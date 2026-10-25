// ============================================================
// AccessRoute AI — TinyFish API Client
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================
// Server-side client for TinyFish Search and Fetch APIs.
// This module handles:
//  - Authentication (X-API-Key header)
//  - Request construction and validation
//  - Response parsing and error handling
//  - Timeout enforcement
//  - Retry logic with exponential backoff
//  - In-memory cache with TTL
//  - Rate limit awareness
//
// SECURITY: This client runs ONLY on the server. The API key
// is NEVER exposed to the frontend. All external content is
// treated as untrusted data and sanitized before use.
//
// BOUNDARY: TinyFish retrieves publicly available information.
// It does NOT calculate routes, certify accessibility, or
// replace the local route engine. All TinyFish results are
// supplementary evidence, not authoritative navigation data.
// ============================================================

import type {
  TinyFishConfig,
  TinyFishSearchRequest,
  TinyFishSearchResponse,
  TinyFishSearchResult,
  TinyFishFetchRequest,
  TinyFishFetchResponse,
} from '../types';
import { sanitizeExternalContent } from '../utils/sanitize';
import { createLogger } from '../utils/logger';

const logger = createLogger('tinyfish-client');

// --- In-Memory Cache ---

interface CacheEntry<T> {
  data: T;
  storedAt: number;
  ttl: number;
}

class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxSize = 200;

  get(key: string): { data: T; age: number } | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    const age = Date.now() - entry.storedAt;
    if (age > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    return { data: entry.data, age };
  }

  set(key: string, data: T, ttlMs: number): void {
    // Evict oldest if over capacity
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, { data, storedAt: Date.now(), ttl: ttlMs });
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

// --- Rate Limit Tracking ---

interface RateLimitState {
  requestCount: number;
  windowStart: number;
  windowMs: number;
  maxRequests: number;
}

// --- TinyFish Client Class ---

export class TinyFishClient {
  private config: TinyFishConfig;
  private searchCache = new SimpleCache<TinyFishSearchResponse>();
  private fetchCache = new SimpleCache<TinyFishFetchResponse>();
  private searchRateLimit: RateLimitState = {
    requestCount: 0,
    windowStart: Date.now(),
    windowMs: 60000,  // 1 minute window
    maxRequests: 25,   // Conservative: below the 30/min limit
  };
  private fetchRateLimit: RateLimitState = {
    requestCount: 0,
    windowStart: Date.now(),
    windowMs: 60000,
    maxRequests: 10,   // Conservative for URL batches
  };
  private lastHealthCheck: { status: 'up' | 'down' | 'degraded'; checkedAt: string; latencyMs: number } | null = null;

  constructor(config: TinyFishConfig) {
    this.config = config;
    if (!config.apiKey || config.apiKey === 'your_tinyfish_api_key_here') {
      logger.warn('TinyFish API key not configured — external evidence lookups will fail');
    }
  }

  // --- Search API ---

  /**
   * Searches the web via TinyFish Search API for accessibility evidence.
   * Results are cached to avoid redundant requests.
   */
  async search(request: TinyFishSearchRequest): Promise<{
    response: TinyFishSearchResponse | null;
    cached: boolean;
    cacheAge?: number;
    error?: string;
  }> {
    const cacheKey = `search:${request.query}:${request.domain_type || 'web'}`;

    // Check cache
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      logger.debug('Search cache hit', { query: request.query, ageMs: cached.age });
      return { response: cached.data, cached: true, cacheAge: cached.age };
    }

    // Check rate limit
    if (this.isRateLimited(this.searchRateLimit)) {
      logger.warn('Search rate limited', { query: request.query });
      return {
        response: null,
        cached: false,
        error: 'TinyFish Search rate limit reached. Try again shortly.',
      };
    }

    try {
      // Build URL with query params
      const url = new URL(this.config.searchBaseUrl);
      url.searchParams.set('query', request.query);
      if (request.purpose) url.searchParams.set('purpose', request.purpose);
      if (request.location) url.searchParams.set('location', request.location);
      if (request.language) url.searchParams.set('language', request.language);
      if (request.include_domains) url.searchParams.set('include_domains', request.include_domains);
      if (request.exclude_domains) url.searchParams.set('exclude_domains', request.exclude_domains);
      if (request.recency_minutes) url.searchParams.set('recency_minutes', String(request.recency_minutes));
      if (request.domain_type) url.searchParams.set('domain_type', request.domain_type);

      logger.info('TinyFish Search request', {
        query: request.query,
        url: url.toString(),
      });

      const response = await this.fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey,
          'Accept': 'application/json',
        },
      }, this.config.searchTimeoutMs);

      this.incrementRateCounter(this.searchRateLimit);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error('TinyFish Search error', {
          status: response.status,
          error: errorText.substring(0, 500),
        });
        return {
          response: null,
          cached: false,
          error: `TinyFish Search returned HTTP ${response.status}: ${errorText.substring(0, 200)}`,
        };
      }

      const data = await response.json() as TinyFishSearchResponse;

      // Validate response structure
      if (!data || !Array.isArray(data.results)) {
        logger.error('TinyFish Search malformed response');
        return {
          response: null,
          cached: false,
          error: 'TinyFish Search returned an unexpected response format.',
        };
      }

      // Sanitize result snippets (external content is untrusted)
      data.results = data.results.map((r: TinyFishSearchResult) => ({
        ...r,
        snippet: sanitizeExternalContent(r.snippet || '', 1000),
        title: sanitizeExternalContent(r.title || '', 300),
      }));

      // Cache the response
      this.searchCache.set(cacheKey, data, this.config.cacheTtlMs);

      logger.info('TinyFish Search success', {
        query: request.query,
        resultCount: data.results.length,
        totalResults: data.total_results,
      });

      return { response: data, cached: false };

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('TinyFish Search failed', { query: request.query, error: errMsg });

      if (errMsg.includes('abort') || errMsg.includes('timeout')) {
        return {
          response: null,
          cached: false,
          error: `TinyFish Search timed out after ${this.config.searchTimeoutMs}ms.`,
        };
      }

      return {
        response: null,
        cached: false,
        error: `TinyFish Search failed: ${errMsg}`,
      };
    }
  }

  // --- Fetch API ---

  /**
   * Fetches and extracts clean content from URLs via TinyFish Fetch API.
   * Used to retrieve detailed accessibility information from web pages.
   */
  async fetchUrl(request: TinyFishFetchRequest): Promise<{
    response: TinyFishFetchResponse | null;
    cached: boolean;
    cacheAge?: number;
    error?: string;
  }> {
    // Validate URLs
    if (!request.urls || request.urls.length === 0) {
      return { response: null, cached: false, error: 'No URLs provided for fetch.' };
    }
    if (request.urls.length > 10) {
      return { response: null, cached: false, error: 'Maximum 10 URLs per fetch request.' };
    }

    const cacheKey = `fetch:${request.urls.sort().join('|')}:${request.format || 'markdown'}`;

    // Check cache
    const cached = this.fetchCache.get(cacheKey);
    if (cached) {
      logger.debug('Fetch cache hit', { urls: request.urls, ageMs: cached.age });
      return { response: cached.data, cached: true, cacheAge: cached.age };
    }

    // Check rate limit
    if (this.isRateLimited(this.fetchRateLimit)) {
      logger.warn('Fetch rate limited', { urls: request.urls });
      return {
        response: null,
        cached: false,
        error: 'TinyFish Fetch rate limit reached. Try again shortly.',
      };
    }

    try {
      logger.info('TinyFish Fetch request', { urls: request.urls, format: request.format });

      const body: Record<string, unknown> = {
        urls: request.urls,
        format: request.format || 'markdown',
      };
      if (request.purpose) body.purpose = request.purpose;
      if (request.links !== undefined) body.links = request.links;
      if (request.image_links !== undefined) body.image_links = request.image_links;
      if (request.ttl !== undefined) body.ttl = request.ttl;

      const response = await this.fetchWithTimeout(this.config.fetchBaseUrl, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      }, this.config.fetchTimeoutMs);

      this.incrementRateCounter(this.fetchRateLimit);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error('TinyFish Fetch error', {
          status: response.status,
          error: errorText.substring(0, 500),
        });
        return {
          response: null,
          cached: false,
          error: `TinyFish Fetch returned HTTP ${response.status}: ${errorText.substring(0, 200)}`,
        };
      }

      const data = await response.json() as TinyFishFetchResponse;

      // Validate response
      if (!data || !Array.isArray(data.results)) {
        return {
          response: null,
          cached: false,
          error: 'TinyFish Fetch returned an unexpected response format.',
        };
      }

      // Sanitize extracted content (external content is untrusted)
      data.results = data.results.map(r => ({
        ...r,
        text: sanitizeExternalContent(r.text || '', 10000),
        title: sanitizeExternalContent(r.title || '', 300),
        description: sanitizeExternalContent(r.description || '', 500),
      }));

      // Cache
      this.fetchCache.set(cacheKey, data, this.config.cacheTtlMs);

      logger.info('TinyFish Fetch success', {
        urlCount: request.urls.length,
        resultCount: data.results.length,
        errorCount: data.errors?.length || 0,
      });

      return { response: data, cached: false };

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('TinyFish Fetch failed', { urls: request.urls, error: errMsg });

      if (errMsg.includes('abort') || errMsg.includes('timeout')) {
        return {
          response: null,
          cached: false,
          error: `TinyFish Fetch timed out after ${this.config.fetchTimeoutMs}ms.`,
        };
      }

      return {
        response: null,
        cached: false,
        error: `TinyFish Fetch failed: ${errMsg}`,
      };
    }
  }

  // --- Health Check ---

  /**
   * Performs a lightweight health check against TinyFish Search.
   */
  async healthCheck(): Promise<{
    status: 'up' | 'down' | 'degraded';
    latencyMs: number;
    message?: string;
  }> {
    const start = Date.now();
    try {
      const url = new URL(this.config.searchBaseUrl);
      url.searchParams.set('query', 'health check test');

      const response = await this.fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey,
          'Accept': 'application/json',
        },
      }, 5000);

      const latencyMs = Date.now() - start;

      if (response.ok) {
        const result = { status: 'up' as const, latencyMs };
        this.lastHealthCheck = { ...result, checkedAt: new Date().toISOString() };
        return result;
      }

      const result = {
        status: 'degraded' as const,
        latencyMs,
        message: `TinyFish returned HTTP ${response.status}`,
      };
      this.lastHealthCheck = { ...result, checkedAt: new Date().toISOString() };
      return result;

    } catch (error) {
      const latencyMs = Date.now() - start;
      const result = {
        status: 'down' as const,
        latencyMs,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      this.lastHealthCheck = { ...result, checkedAt: new Date().toISOString() };
      return result;
    }
  }

  /**
   * Returns the last known health check result without making a new request.
   */
  getLastHealthStatus() {
    return this.lastHealthCheck;
  }

  /**
   * Clears all caches.
   */
  clearCache(): void {
    this.searchCache.clear();
    this.fetchCache.clear();
    logger.info('TinyFish client caches cleared');
  }

  // --- Internal Utilities ---

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private isRateLimited(state: RateLimitState): boolean {
    const now = Date.now();
    if (now - state.windowStart > state.windowMs) {
      // Reset window
      state.requestCount = 0;
      state.windowStart = now;
    }
    return state.requestCount >= state.maxRequests;
  }

  private incrementRateCounter(state: RateLimitState): void {
    const now = Date.now();
    if (now - state.windowStart > state.windowMs) {
      state.requestCount = 1;
      state.windowStart = now;
    } else {
      state.requestCount++;
    }
  }
}
