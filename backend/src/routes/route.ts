// ============================================================
// AccessRoute AI — Route API Handlers
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import { Router, type Request, type Response } from 'express';
import type { RouteRequest, ApiResponse, RouteResult } from '../types';
import { calculateRoute } from '../services/route-engine';
import { isValidNodeId } from '../utils/sanitize';
import { generateRequestId } from '../utils/request-id';
import { createLogger } from '../utils/logger';

const logger = createLogger('route-api');

export function createRouteRouter(): Router {
  const router = Router();

  /**
   * POST /api/route
   *
   * Calculate a route between two campus locations.
   *
   * Request body:
   *   { from: string, to: string, requireStepFree?: boolean }
   *
   * Response:
   *   ApiResponse<RouteResult>
   */
  router.post('/', (req: Request, res: Response) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
      const { from, to, requireStepFree } = req.body as {
        from?: unknown;
        to?: unknown;
        requireStepFree?: unknown;
      };

      // --- Input Validation ---

      if (!from || !to) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Both "from" and "to" location IDs are required.',
          },
          meta: { timestamp: new Date().toISOString(), requestId },
        };
        res.status(400).json(response);
        return;
      }

      if (!isValidNodeId(from)) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Invalid "from" location ID format: "${String(from).substring(0, 50)}"`,
            details: 'Location IDs must contain only lowercase letters, numbers, hyphens, and underscores.',
          },
          meta: { timestamp: new Date().toISOString(), requestId },
        };
        res.status(400).json(response);
        return;
      }

      if (!isValidNodeId(to)) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Invalid "to" location ID format: "${String(to).substring(0, 50)}"`,
            details: 'Location IDs must contain only lowercase letters, numbers, hyphens, and underscores.',
          },
          meta: { timestamp: new Date().toISOString(), requestId },
        };
        res.status(400).json(response);
        return;
      }

      // --- Route Calculation ---

      const routeRequest: RouteRequest = {
        from: from as string,
        to: to as string,
        requireStepFree: requireStepFree === true || requireStepFree === 'true',
      };

      const routeResult = calculateRoute(routeRequest);
      const duration = Date.now() - startTime;

      logger.info('Route calculated', {
        requestId,
        from: routeRequest.from,
        to: routeRequest.to,
        requireStepFree: routeRequest.requireStepFree,
        success: routeResult.success,
        segments: routeResult.route?.length || 0,
        durationMs: duration,
      });

      const response: ApiResponse<RouteResult> = {
        success: routeResult.success,
        data: routeResult,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          duration,
        },
      };

      // Use 200 even for "no route" — it's a valid computation result, not an error
      res.status(200).json(response);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Route calculation failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'ROUTE_CALCULATION_ERROR',
          message: 'An error occurred while calculating the route.',
          details: process.env.NODE_ENV !== 'production'
            ? (error instanceof Error ? error.message : 'Unknown error')
            : undefined,
        },
        meta: { timestamp: new Date().toISOString(), requestId, duration },
      };
      res.status(500).json(response);
    }
  });

  return router;
}
