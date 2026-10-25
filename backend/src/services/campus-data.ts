// ============================================================
// AccessRoute AI — Campus Data Loader
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================
// Loads and validates the campus graph data from JSON seed files.
// This is the single source of truth for campus topology.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import type { CampusNode, CampusEdge } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('campus-data');

interface CampusData {
  nodes: CampusNode[];
  edges: CampusEdge[];
  nodeMap: Map<string, CampusNode>;
  edgeMap: Map<string, CampusEdge>;
  loadedAt: string;
}

let cachedData: CampusData | null = null;

/**
 * Validates a single campus node for required fields and types.
 */
function validateNode(node: unknown, index: number): CampusNode {
  const n = node as Record<string, unknown>;
  if (!n || typeof n !== 'object') {
    throw new Error(`Node at index ${index} is not an object`);
  }
  if (typeof n.id !== 'string' || n.id.trim() === '') {
    throw new Error(`Node at index ${index} has invalid or missing 'id'`);
  }
  if (typeof n.name !== 'string' || n.name.trim() === '') {
    throw new Error(`Node "${n.id}" has invalid or missing 'name'`);
  }
  if (typeof n.shortName !== 'string') {
    throw new Error(`Node "${n.id}" has invalid or missing 'shortName'`);
  }
  if (typeof n.lat !== 'number' || typeof n.lng !== 'number') {
    throw new Error(`Node "${n.id}" has invalid coordinates`);
  }
  if (!['building', 'entrance', 'junction', 'landmark'].includes(n.type as string)) {
    throw new Error(`Node "${n.id}" has invalid 'type': ${n.type}`);
  }
  return n as unknown as CampusNode;
}

/**
 * Validates a single campus edge for required fields, types, and node references.
 */
function validateEdge(edge: unknown, index: number, nodeIds: Set<string>): CampusEdge {
  const e = edge as Record<string, unknown>;
  if (!e || typeof e !== 'object') {
    throw new Error(`Edge at index ${index} is not an object`);
  }
  if (typeof e.id !== 'string' || e.id.trim() === '') {
    throw new Error(`Edge at index ${index} has invalid or missing 'id'`);
  }
  if (typeof e.from !== 'string' || !nodeIds.has(e.from)) {
    throw new Error(`Edge "${e.id}" references unknown 'from' node: ${e.from}`);
  }
  if (typeof e.to !== 'string' || !nodeIds.has(e.to)) {
    throw new Error(`Edge "${e.id}" references unknown 'to' node: ${e.to}`);
  }
  if (typeof e.distanceMeters !== 'number' || e.distanceMeters <= 0) {
    throw new Error(`Edge "${e.id}" has invalid 'distanceMeters': ${e.distanceMeters}`);
  }
  const validStatuses = ['verified_step_free', 'reported_step_free', 'not_step_free', 'unknown'];
  if (!validStatuses.includes(e.accessibilityStatus as string)) {
    throw new Error(`Edge "${e.id}" has invalid 'accessibilityStatus': ${e.accessibilityStatus}`);
  }
  const validPathTypes = ['sidewalk', 'corridor', 'ramp', 'elevator', 'stairs', 'outdoor_path', 'crossing'];
  if (!validPathTypes.includes(e.pathType as string)) {
    throw new Error(`Edge "${e.id}" has invalid 'pathType': ${e.pathType}`);
  }
  return e as unknown as CampusEdge;
}

/**
 * Loads campus data from the JSON seed files.
 * Validates all nodes and edges, checks for duplicates, and verifies referential integrity.
 */
export function loadCampusData(dataDir?: string): CampusData {
  if (cachedData) {
    logger.debug('Returning cached campus data');
    return cachedData;
  }

  const resolvedDir = dataDir || path.resolve(process.cwd(), 'data');
  const nodesPath = path.join(resolvedDir, 'campus-nodes.json');
  const edgesPath = path.join(resolvedDir, 'campus-edges.json');

  logger.info('Loading campus data', { nodesPath, edgesPath });

  // Check files exist
  if (!fs.existsSync(nodesPath)) {
    throw new Error(`Campus nodes file not found: ${nodesPath}`);
  }
  if (!fs.existsSync(edgesPath)) {
    throw new Error(`Campus edges file not found: ${edgesPath}`);
  }

  // Parse JSON
  let rawNodes: unknown[];
  let rawEdges: unknown[];
  try {
    rawNodes = JSON.parse(fs.readFileSync(nodesPath, 'utf-8'));
  } catch (err) {
    throw new Error(`Failed to parse campus-nodes.json: ${(err as Error).message}`);
  }
  try {
    rawEdges = JSON.parse(fs.readFileSync(edgesPath, 'utf-8'));
  } catch (err) {
    throw new Error(`Failed to parse campus-edges.json: ${(err as Error).message}`);
  }

  if (!Array.isArray(rawNodes)) {
    throw new Error('campus-nodes.json must contain a JSON array');
  }
  if (!Array.isArray(rawEdges)) {
    throw new Error('campus-edges.json must contain a JSON array');
  }

  // Validate nodes
  const nodeMap = new Map<string, CampusNode>();
  const nodes: CampusNode[] = [];
  for (let i = 0; i < rawNodes.length; i++) {
    const node = validateNode(rawNodes[i], i);
    if (nodeMap.has(node.id)) {
      throw new Error(`Duplicate node ID: ${node.id}`);
    }
    nodeMap.set(node.id, node);
    nodes.push(node);
  }

  // Validate edges
  const nodeIds = new Set(nodeMap.keys());
  const edgeMap = new Map<string, CampusEdge>();
  const edges: CampusEdge[] = [];
  for (let i = 0; i < rawEdges.length; i++) {
    const edge = validateEdge(rawEdges[i], i, nodeIds);
    if (edgeMap.has(edge.id)) {
      throw new Error(`Duplicate edge ID: ${edge.id}`);
    }
    edgeMap.set(edge.id, edge);
    edges.push(edge);
  }

  logger.info('Campus data loaded and validated', {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    stairsEdges: edges.filter(e => e.accessibilityStatus === 'not_step_free').length,
    unknownEdges: edges.filter(e => e.accessibilityStatus === 'unknown').length,
  });

  cachedData = {
    nodes,
    edges,
    nodeMap,
    edgeMap,
    loadedAt: new Date().toISOString(),
  };

  return cachedData;
}

/**
 * Returns all campus locations suitable for the frontend dropdown.
 * Only returns buildings and entrances, not junctions.
 */
export function getSelectableLocations(): CampusNode[] {
  const data = loadCampusData();
  return data.nodes.filter(n => n.type === 'building' || n.type === 'entrance');
}

/**
 * Returns a specific node by ID.
 */
export function getNodeById(id: string): CampusNode | undefined {
  const data = loadCampusData();
  return data.nodeMap.get(id);
}

/**
 * Clears the cached data (useful for testing).
 */
export function clearCampusDataCache(): void {
  cachedData = null;
}
