// ============================================================
// AccessRoute AI — Campus Data Loader Tests
// Person 4: Backend, TinyFish, Security, QA & Deployment
// Delhi High Court Data Validation
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCampusData,
  getSelectableLocations,
  getNodeById,
  clearCampusDataCache,
} from '../src/services/campus-data';

describe('Campus Data Loader', () => {
  beforeEach(() => {
    clearCampusDataCache();
  });

  describe('loadCampusData', () => {
    it('should load and validate all campus nodes', () => {
      const data = loadCampusData();

      expect(data.nodes.length).toBeGreaterThan(0);
      expect(data.nodeMap.size).toBe(data.nodes.length);

      // All nodes should have required fields
      for (const node of data.nodes) {
        expect(node.id).toBeTruthy();
        expect(node.name).toBeTruthy();
        expect(node.shortName).toBeTruthy();
        expect(typeof node.lat).toBe('number');
        expect(typeof node.lng).toBe('number');
        expect(['building', 'entrance', 'junction', 'landmark']).toContain(node.type);
      }
    });

    it('should load and validate all campus edges', () => {
      const data = loadCampusData();

      expect(data.edges.length).toBeGreaterThan(0);
      expect(data.edgeMap.size).toBe(data.edges.length);

      // All edges should reference valid nodes
      for (const edge of data.edges) {
        expect(edge.id).toBeTruthy();
        expect(data.nodeMap.has(edge.from)).toBe(true);
        expect(data.nodeMap.has(edge.to)).toBe(true);
        expect(edge.distanceMeters).toBeGreaterThan(0);
        expect([
          'verified_step_free',
          'reported_step_free',
          'not_step_free',
          'unknown',
        ]).toContain(edge.accessibilityStatus);
      }
    });

    it('should have no duplicate node IDs', () => {
      const data = loadCampusData();
      const ids = data.nodes.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have no duplicate edge IDs', () => {
      const data = loadCampusData();
      const ids = data.edges.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include at least one edge of each accessibility status', () => {
      const data = loadCampusData();
      const statuses = new Set(data.edges.map(e => e.accessibilityStatus));

      expect(statuses.has('verified_step_free')).toBe(true);
      expect(statuses.has('reported_step_free')).toBe(true);
      expect(statuses.has('not_step_free')).toBe(true);
      expect(statuses.has('unknown')).toBe(true);
    });

    it('should cache data on subsequent calls', () => {
      const data1 = loadCampusData();
      const data2 = loadCampusData();
      expect(data1).toBe(data2); // Same reference (cached)
    });
  });

  describe('getSelectableLocations', () => {
    it('should only return buildings and entrances, not junctions', () => {
      const locations = getSelectableLocations();

      expect(locations.length).toBeGreaterThan(0);
      for (const loc of locations) {
        expect(['building', 'entrance']).toContain(loc.type);
        expect(loc.type).not.toBe('junction');
      }
    });

    it('should include main gate as selectable', () => {
      const locations = getSelectableLocations();
      const mainGate = locations.find(l => l.id === 'main-gate');
      expect(mainGate).toBeDefined();
      expect(mainGate!.name).toContain('Main Gate');
    });
  });

  describe('getNodeById', () => {
    it('should return a known node', () => {
      const node = getNodeById('bar-library');
      expect(node).toBeDefined();
      expect(node!.name).toContain('Bar Library');
    });

    it('should return undefined for unknown ID', () => {
      const node = getNodeById('nonexistent');
      expect(node).toBeUndefined();
    });
  });
});
