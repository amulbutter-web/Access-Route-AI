// ============================================================
// AccessRoute AI — Main Server Entry Point
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================
// Express server with:
//  - CORS configuration
//  - Security headers
//  - Rate limiting
//  - Request logging
//  - API routes: /api/health, /api/locations, /api/route, /api/evidence
//  - Global error handling
//  - Graceful shutdown
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load .env before any config reads
dotenv.config();

import { loadConfig } from './config';
import { loadCampusData } from './services/campus-data';
import { createRouteRouter } from './routes/route';
import { createLocationsRouter } from './routes/locations';
import { createEvidenceRouter } from './routes/evidence';
import { createHealthRouter } from './routes/health';
import {
  securityHeaders,
  validateContentType,
  requestLogger,
  globalErrorHandler,
} from './middleware/security';
import { createRateLimiter } from './middleware/rate-limiter';
import { createLogger } from './utils/logger';

const logger = createLogger('server');

async function main() {
  // --- Load Configuration ---
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error('❌ Configuration error:', (error as Error).message);
    console.error('   Make sure you have a .env file based on .env.example');
    process.exit(1);
  }

  // --- Validate Campus Data ---
  try {
    const campusData = loadCampusData();
    logger.info('Campus data loaded', {
      nodes: campusData.nodes.length,
      edges: campusData.edges.length,
    });
  } catch (error) {
    logger.error('Failed to load campus data', {
      error: (error as Error).message,
    });
    console.error('❌ Campus data error:', (error as Error).message);
    process.exit(1);
  }

  // --- Create Express App ---
  const app = express();

  // --- Global Middleware ---

  // CORS configuration (supports all local development ports: 5173, 3000, 4173, etc.)
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        config.nodeEnv === 'development' ||
        origin === config.corsOrigin ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false,
    maxAge: 86400, // 24 hours preflight cache
  }));

  // Security headers
  app.use(securityHeaders);

  // Body parsing (with size limit)
  app.use(express.json({ limit: '100kb' }));

  // Content type validation
  app.use(validateContentType);

  // Request logging
  app.use(requestLogger);

  // Rate limiting
  app.use(createRateLimiter(config.rateLimit));

  // --- API Routes ---

  app.use('/api/health', createHealthRouter(config.tinyfish));
  app.use('/api/locations', createLocationsRouter());
  app.use('/api/route', createRouteRouter());
  app.use('/api/evidence', createEvidenceRouter(config.tinyfish));

  // --- 404 Handler ---
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist.',
      },
      meta: { timestamp: new Date().toISOString(), requestId: '' },
    });
  });

  // --- Global Error Handler ---
  app.use(globalErrorHandler);

  // --- Start Server ---
  const server = app.listen(config.port, () => {
    logger.info('🚀 AccessRoute AI server started', {
      port: config.port,
      env: config.nodeEnv,
      corsOrigin: config.corsOrigin,
    });
    console.log('');
    console.log('  ┌──────────────────────────────────────────────┐');
    console.log('  │                                              │');
    console.log('  │   🗺️  AccessRoute AI — Backend Server        │');
    console.log('  │                                              │');
    console.log(`  │   Local:   http://localhost:${config.port}            │`);
    console.log(`  │   Health:  http://localhost:${config.port}/api/health  │`);
    console.log('  │                                              │');
    console.log(`  │   Environment: ${config.nodeEnv.padEnd(27)}│`);
    console.log('  │                                              │');
    console.log('  └──────────────────────────────────────────────┘');
    console.log('');
  });

  // --- Graceful Shutdown ---
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
