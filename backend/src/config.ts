// ============================================================
// AccessRoute AI — Application Configuration
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import type { AppConfig } from './types';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Check your .env file and .env.example for reference.`
    );
  }
  return value.trim();
}

function optionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

function parseIntEnv(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    console.warn(`[config] Invalid integer for ${key}: "${raw}", using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

export function loadConfig(): AppConfig {
  return {
    port: parseIntEnv('PORT', 3001),
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
    tinyfish: {
      apiKey: requireEnv('TINYFISH_API_KEY'),
      searchBaseUrl: 'https://api.search.tinyfish.ai',
      fetchBaseUrl: 'https://api.fetch.tinyfish.ai',
      searchTimeoutMs: parseIntEnv('TINYFISH_SEARCH_TIMEOUT_MS', 8000),
      fetchTimeoutMs: parseIntEnv('TINYFISH_FETCH_TIMEOUT_MS', 12000),
      maxRetries: parseIntEnv('TINYFISH_MAX_RETRIES', 2),
      cacheTtlMs: parseIntEnv('TINYFISH_CACHE_TTL_MS', 300000), // 5 minutes
    },
    rateLimit: {
      windowMs: parseIntEnv('RATE_LIMIT_WINDOW_MS', 60000),
      maxRequests: parseIntEnv('RATE_LIMIT_MAX_REQUESTS', 100),
    },
  };
}
