// ============================================================
// AccessRoute AI — Health Check API Handler
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import { Router, type Request, type Response } from 'express';
import type { ApiResponse, HealthStatus, TinyFishConfig } from '../types';
import { loadCampusData } from '../services/campus-data';
import { EvidenceService } from '../services/evidence-service';
import { generateRequestId } from '../utils/request-id';
import { createLogger } from '../utils/logger';

const logger = createLogger('health-api');
const startTime = Date.now();

export function createHealthRouter(tinyFishConfig: TinyFishConfig): Router {
  const router = Router();
  const evidenceService = new EvidenceService(tinyFishConfig);

  /**
   * GET /api/health
   *
   * Returns the overall system health status.
   * Checks: route engine (campus data loaded), TinyFish connectivity, and data integrity.
   */
  router.get('/', async (_req: Request, res: Response) => {
    const requestId = generateRequestId();

    try {
      // Check campus data
      let campusDataStatus: HealthStatus['services']['campusData'] = {
        status: 'unchecked',
      };
      try {
        const data = loadCampusData();
        campusDataStatus = {
          status: 'up',
          lastCheck: new Date().toISOString(),
          message: `${data.nodes.length} nodes, ${data.edges.length} edges loaded`,
        };
      } catch (error) {
        campusDataStatus = {
          status: 'down',
          lastCheck: new Date().toISOString(),
          message: error instanceof Error ? error.message : 'Failed to load campus data',
        };
      }

      // Check route engine (implicitly checked via campus data)
      const routeEngineStatus: HealthStatus['services']['routeEngine'] = {
        status: campusDataStatus.status === 'up' ? 'up' : 'down',
        lastCheck: new Date().toISOString(),
        message: campusDataStatus.status === 'up'
          ? 'Route engine ready'
          : 'Route engine unavailable — campus data not loaded',
      };

      // Check TinyFish (non-blocking, with timeout)
      let tinyFishStatus: HealthStatus['services']['tinyfish'] = {
        status: 'unchecked',
      };
      try {
        const tfHealth = await evidenceService.checkTinyFishHealth();
        tinyFishStatus = {
          status: tfHealth.status,
          lastCheck: new Date().toISOString(),
          latencyMs: tfHealth.latencyMs,
          message: tfHealth.message || `TinyFish ${tfHealth.status}`,
        };
      } catch {
        tinyFishStatus = {
          status: 'down',
          lastCheck: new Date().toISOString(),
          message: 'TinyFish health check failed',
        };
      }

      // Overall status
      const overallStatus: HealthStatus['status'] =
        campusDataStatus.status === 'down' ? 'unhealthy' :
        tinyFishStatus.status === 'down' ? 'degraded' :
        'healthy';

      const healthStatus: HealthStatus = {
        status: overallStatus,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        services: {
          routeEngine: routeEngineStatus,
          tinyfish: tinyFishStatus,
          campusData: campusDataStatus,
        },
        version: '1.0.0',
      };

      const response: ApiResponse<HealthStatus> = {
        success: true,
        data: healthStatus,
        meta: { timestamp: new Date().toISOString(), requestId },
      };

      const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
      res.status(statusCode).json(response);

    } catch (error) {
      logger.error('Health check failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Health check failed.',
        },
        meta: { timestamp: new Date().toISOString(), requestId },
      });
    }
  });

  /**
   * GET /api/health/ping
   * Simple liveness probe — returns 200 immediately.
   */
  router.get('/ping', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}
