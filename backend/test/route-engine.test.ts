// ============================================================
// AccessRoute AI — Route Engine Unit Tests
// Person 4: Backend, TinyFish, Security, QA & Deployment
// Delhi High Court Campus Data
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateRoute } from '../src/services/route-engine';
import { clearCampusDataCache } from '../src/services/campus-data';

// Note: Tests use the actual campus data files from data/ directory.
// This ensures tests validate the real data, not imaginary fixtures.

describe('Route Engine', () => {
  beforeEach(() => {
    clearCampusDataCache();
  });

  describe('Valid routes (step-free not required)', () => {
    it('should find a route between main gate and bar library', () => {
      const result = calculateRoute({
        from: 'main-gate',
        to: 'bar-library',
        requireStepFree: false,
      });

      expect(result.success).toBe(true);
      expect(result.route).not.toBeNull();
      expect(result.route!.length).toBeGreaterThan(0);
      expect(result.totalDistanceMeters).toBeGreaterThan(0);
      expect(result.estimatedWalkingMinutes).toBeGreaterThanOrEqual(1);
      expect(result.textDirections.length).toBeGreaterThan(0);
      expect(result.computedAt).toBeTruthy();
    });

    it('should find a route between main gate and old building (may use shorter stairs)', () => {
      const result = calculateRoute({
        from: 'main-gate',
        to: 'old-building',
        requireStepFree: false,
      });

      expect(result.success).toBe(true);
      expect(result.route).not.toBeNull();
      expect(result.totalDistanceMeters).toBeGreaterThan(0);
    });

    it('should find a route between chambers 1 and chambers 2 via stairs when allowed', () => {
      const result = calculateRoute({
        from: 'lawyers-chambers-1',
        to: 'lawyers-chambers-2',
        requireStepFree: false,
      });

      expect(result.success).toBe(true);
      expect(result.route).not.toBeNull();
      expect(result.totalDistanceMeters).toBe(30); // Direct stairs edge
    });
  });

  describe('Step-free routing', () => {
    it('should find a step-free route from main gate to bar library', () => {
      const result = calculateRoute({
        from: 'main-gate',
        to: 'bar-library',
        requireStepFree: true,
      });

      expect(result.success).toBe(true);
      expect(result.route).not.toBeNull();

      // Verify NO stairs edges in the route
      for (const segment of result.route!) {
        expect(segment.edge.accessibilityStatus).not.toBe('not_step_free');
        expect(segment.edge.pathType).not.toBe('stairs');
      }
    });

    it('should find a step-free route from main gate to old building (via ramp/path, not stairs)', () => {
      const result = calculateRoute({
        from: 'main-gate',
        to: 'old-building',
        requireStepFree: true,
      });

      expect(result.success).toBe(true);
      expect(result.route).not.toBeNull();

      // The route should avoid the shorter stairs path
      for (const segment of result.route!) {
        expect(segment.edge.accessibilityStatus).not.toBe('not_step_free');
        expect(segment.edge.pathType).not.toBe('stairs');
      }

      // The step-free route (140m) should be longer than the stairs route (125m)
      const stairsResult = calculateRoute({
        from: 'main-gate',
        to: 'old-building',
        requireStepFree: false,
      });

      expect(result.totalDistanceMeters).toBeGreaterThan(stairsResult.totalDistanceMeters);
    });

    it('should flag warnings for unknown accessibility segments', () => {
      const result = calculateRoute({
        from: 'main-gate',
        to: 'lawyers-chambers-1',
        requireStepFree: true,
      });

      expect(result.success).toBe(true);
      expect(result.route).not.toBeNull();

      // Chambers 1 path has 'unknown' accessibility segment (e-junction-south-chambers1)
      const hasUnknown = result.route!.some(
        seg => seg.edge.accessibilityStatus === 'unknown'
      );
      if (hasUnknown) {
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.accessibilitySummary.hasUnknownSegments).toBe(true);
      }
    });

    it('should flag warnings for reported-only segments', () => {
      const result = calculateRoute({
        from: 'main-gate',
        to: 'canteen',
        requireStepFree: true,
      });

      expect(result.success).toBe(true);
      // Path to canteen includes 'e-junction-south-canteen' which is reported_step_free
      const hasReported = result.route!.some(
        seg => seg.edge.accessibilityStatus === 'reported_step_free'
      );
      if (hasReported) {
        expect(result.accessibilitySummary.hasReportedOnlySegments).toBe(true);
      }
    });
  });

  describe('Exclusion & Alternative Routes', () => {
    it('should find alternative step-free route between chambers 1 and chambers 2 avoiding stairs', () => {
      const result = calculateRoute({
        from: 'lawyers-chambers-1',
        to: 'lawyers-chambers-2',
        requireStepFree: true,
      });

      expect(result.success).toBe(true);
      if (result.success && result.route) {
        for (const segment of result.route) {
          expect(segment.edge.accessibilityStatus).not.toBe('not_step_free');
          expect(segment.edge.pathType).not.toBe('stairs');
        }
      }
    });

    it('should NEVER silently fall back to stairs when step-free is required across all campus pairs', () => {
      const locations = [
        'main-gate', 'gate-2', 'gate-7',
        'old-building', 'c-block', 's-block',
        'bar-library', 'canteen', 'filing-counter',
        'lawyers-chambers-1', 'lawyers-chambers-2', 'mediation-centre',
      ];

      for (const from of locations) {
        for (const to of locations) {
          if (from === to) continue;

          const result = calculateRoute({
            from,
            to,
            requireStepFree: true,
          });

          if (result.success && result.route) {
            // CRITICAL: No stairs edge should EVER appear in a step-free route
            for (const segment of result.route) {
              expect(segment.edge.accessibilityStatus).not.toBe('not_step_free');
              expect(segment.edge.pathType).not.toBe('stairs');
            }
          }
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle same start and destination', () => {
      const result = calculateRoute({
        from: 'bar-library',
        to: 'bar-library',
        requireStepFree: true,
      });

      expect(result.success).toBe(true);
      expect(result.route).toEqual([]);
      expect(result.totalDistanceMeters).toBe(0);
      expect(result.textDirections[0]).toContain('You are already at');
    });

    it('should handle invalid start node', () => {
      const result = calculateRoute({
        from: 'nonexistent-building',
        to: 'bar-library',
        requireStepFree: false,
      });

      expect(result.success).toBe(false);
      expect(result.route).toBeNull();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle invalid destination node', () => {
      const result = calculateRoute({
        from: 'bar-library',
        to: 'nonexistent-building',
        requireStepFree: false,
      });

      expect(result.success).toBe(false);
      expect(result.route).toBeNull();
    });

    it('should produce text directions with clear instructions', () => {
      const result = calculateRoute({
        from: 'main-gate',
        to: 'c-block',
        requireStepFree: true,
      });

      expect(result.success).toBe(true);
      expect(result.textDirections.length).toBeGreaterThan(2); // Start + steps + arrive
      expect(result.textDirections[0]).toContain('Start at');
      expect(result.textDirections[result.textDirections.length - 1]).toContain('Arrive at');
    });
  });

  describe('Accessibility summary', () => {
    it('should correctly report status breakdown', () => {
      const result = calculateRoute({
        from: 'main-gate',
        to: 'bar-library',
        requireStepFree: true,
      });

      expect(result.success).toBe(true);
      const summary = result.accessibilitySummary;

      // Status breakdown should sum to total segments
      const totalInBreakdown = Object.values(summary.statusBreakdown).reduce((a, b) => a + b, 0);
      expect(totalInBreakdown).toBe(result.route!.length);

      // No 'not_step_free' in step-free route
      expect(summary.statusBreakdown.not_step_free).toBe(0);
    });
  });
});
