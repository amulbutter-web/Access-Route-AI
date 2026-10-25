// ============================================================
// AccessRoute AI — Locations API Handler
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import { Router, type Request, type Response } from 'express';
import type { ApiResponse, LocationListItem } from '../types';
import { getSelectableLocations, getNodeById } from '../services/campus-data';
import { isValidNodeId } from '../utils/sanitize';
import { generateRequestId } from '../utils/request-id';
import { createLogger } from '../utils/logger';

const logger = createLogger('locations-api');

export function createLocationsRouter(): Router {
  const router = Router();

  /**
   * GET /api/locations
   *
   * Returns the list of selectable campus locations for the frontend dropdowns.
   * Only returns buildings and entrances (not junctions).
   */
  router.get('/', (_req: Request, res: Response) => {
    const requestId = generateRequestId();

    try {
      const nodes = getSelectableLocations();

      const locations: LocationListItem[] = nodes.map(n => ({
        id: n.id,
        name: n.name,
        shortName: n.shortName,
        type: n.type,
        accessibilityNotes: n.accessibilityNotes,
      }));

      const response: ApiResponse<LocationListItem[]> = {
        success: true,
        data: locations,
        meta: { timestamp: new Date().toISOString(), requestId },
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Failed to load locations', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'DATA_LOAD_ERROR',
          message: 'Failed to load campus locations.',
        },
        meta: { timestamp: new Date().toISOString(), requestId },
      };
      res.status(500).json(response);
    }
  });

  /**
   * GET /api/locations/:id
   *
   * Returns details for a specific campus location.
   */
  router.get('/:id', (req: Request, res: Response) => {
    const requestId = generateRequestId();
    const { id } = req.params;

    if (!isValidNodeId(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid location ID format: "${String(id).substring(0, 50)}"`,
        },
        meta: { timestamp: new Date().toISOString(), requestId },
      };
      res.status(400).json(response);
      return;
    }

    const node = getNodeById(id);
    if (!node) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Location "${id}" not found in campus data.`,
        },
        meta: { timestamp: new Date().toISOString(), requestId },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<LocationListItem> = {
      success: true,
      data: {
        id: node.id,
        name: node.name,
        shortName: node.shortName,
        type: node.type,
        accessibilityNotes: node.accessibilityNotes,
      },
      meta: { timestamp: new Date().toISOString(), requestId },
    };

    res.status(200).json(response);
  });

  return router;
}
