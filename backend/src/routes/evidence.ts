// ============================================================
// AccessRoute AI — Evidence API Handler
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import { Router, type Request, type Response } from 'express';
import type { ApiResponse, EvidenceResult, TinyFishConfig } from '../types';
import { EvidenceService } from '../services/evidence-service';
import { isValidNodeId, sanitizeString, isValidHttpUrl } from '../utils/sanitize';
import { generateRequestId } from '../utils/request-id';
import { createLogger } from '../utils/logger';

const logger = createLogger('evidence-api');

export function createEvidenceRouter(tinyFishConfig: TinyFishConfig): Router {
  const router = Router();
  const evidenceService = new EvidenceService(tinyFishConfig);

  /**
   * GET /api/evidence/:locationId
   *
   * Retrieves accessibility evidence for a campus location.
   * Uses TinyFish Search API when available, falls back to local seed data.
   *
   * Response includes metadata about the source (live/cached/local).
   */
  router.get('/:locationId', async (req: Request, res: Response) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const { locationId } = req.params;

    if (!isValidNodeId(locationId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid location ID: "${String(locationId).substring(0, 50)}"`,
        },
        meta: { timestamp: new Date().toISOString(), requestId },
      };
      res.status(400).json(response);
      return;
    }

    try {
      const evidence = await evidenceService.lookupEvidence(locationId);
      const duration = Date.now() - startTime;

      logger.info('Evidence lookup complete', {
        requestId,
        locationId,
        provider: evidence.provider,
        sourceCount: evidence.sources.length,
        confidence: evidence.confidence,
        cached: evidence.isCached,
        durationMs: duration,
      });

      const response: ApiResponse<EvidenceResult> = {
        success: true,
        data: evidence,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          duration,
          provider: evidence.provider,
          cached: evidence.isCached,
        },
      };

      res.status(200).json(response);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Evidence lookup failed', {
        requestId,
        locationId,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'EVIDENCE_LOOKUP_ERROR',
          message: 'Failed to retrieve accessibility evidence.',
          details: process.env.NODE_ENV !== 'production'
            ? (error instanceof Error ? error.message : 'Unknown')
            : undefined,
        },
        meta: { timestamp: new Date().toISOString(), requestId, duration },
      };
      res.status(500).json(response);
    }
  });

  /**
   * POST /api/evidence/fetch
   *
   * Fetches detailed accessibility info from a specific URL via TinyFish Fetch API.
   *
   * Request body:
   *   { url: string, locationName?: string }
   */
  router.post('/fetch', async (req: Request, res: Response) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const { url, locationName } = req.body as {
      url?: unknown;
      locationName?: unknown;
    };

    // Validate URL
    const urlStr = sanitizeString(url, 2000);
    if (!urlStr || !isValidHttpUrl(urlStr)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'A valid HTTP/HTTPS URL is required.',
        },
        meta: { timestamp: new Date().toISOString(), requestId },
      };
      res.status(400).json(response);
      return;
    }

    const locName = sanitizeString(locationName, 200) || 'Unknown Location';

    try {
      const evidence = await evidenceService.fetchDetailedEvidence(urlStr, locName);
      const duration = Date.now() - startTime;

      const response: ApiResponse<EvidenceResult> = {
        success: true,
        data: evidence,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          duration,
          provider: evidence.provider,
          cached: evidence.isCached,
        },
      };

      res.status(200).json(response);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Fetch evidence failed', {
        requestId,
        url: urlStr,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch page content.',
        },
        meta: { timestamp: new Date().toISOString(), requestId, duration },
      };
      res.status(500).json(response);
    }
  });

  return router;
}
