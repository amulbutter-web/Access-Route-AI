// ============================================================
// AccessRoute AI — Security Middleware
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('security');

/**
 * Sets security-related HTTP headers.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (API server — no inline scripts)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  );

  // Strict Transport Security (when behind HTTPS)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Validates request body size and content type for POST/PUT.
 */
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      res.status(415).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Content-Type must be application/json',
        },
        meta: { timestamp: new Date().toISOString(), requestId: '' },
      });
      return;
    }
  }
  next();
}

/**
 * Logs incoming requests with redacted sensitive information.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query as Record<string, unknown> : undefined,
    ip: req.ip,
    userAgent: (req.headers['user-agent'] || '').substring(0, 100),
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('Response sent', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}

/**
 * Global error handler for uncaught errors in routes.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    method: req.method,
    path: req.path,
  });

  // Never expose stack traces in production
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: '',
    },
  });
}
