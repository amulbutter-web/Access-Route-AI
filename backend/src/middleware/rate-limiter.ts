// ============================================================
// AccessRoute AI — Rate Limiting Middleware
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import type { RateLimitConfig } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('rate-limiter');

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Simple in-memory rate limiter per IP address.
 * For production, consider Redis-backed rate limiting.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup of expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > config.windowMs * 2) {
        store.delete(key);
      }
    }
  }, config.windowMs);

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const clientId = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = store.get(clientId);

    if (!entry || now - entry.windowStart > config.windowMs) {
      entry = { count: 1, windowStart: now };
      store.set(clientId, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTime = Math.ceil((entry.windowStart + config.windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetTime));

    if (entry.count > config.maxRequests) {
      logger.warn('Rate limit exceeded', { clientId, count: entry.count });
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please wait before trying again.',
          details: `Limit: ${config.maxRequests} requests per ${config.windowMs / 1000} seconds`,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      });
      return;
    }

    next();
  };
}
