// ============================================================
// AccessRoute AI — Route Engine (Dijkstra's Algorithm)
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================
// Deterministic graph-based routing with step-free constraint
// enforcement. The route engine operates entirely on the local
// campus graph — it does NOT depend on TinyFish or any external
// service and remains fully functional offline.
//
// ROUTING POLICY:
// - When requireStepFree=true, edges with accessibilityStatus
//   'not_step_free' are HARD EXCLUDED from the graph. They are
//   not penalized — they are removed entirely.
// - Edges with 'unknown' status ARE included but flagged with
//   warnings. The user is informed that segments are unverified.
// - If no qualifying path exists, the engine returns a clear
//   "no qualifying route" result. It NEVER silently falls back
//   to a route containing stairs.
// ============================================================

import type {
  CampusNode,
  CampusEdge,
  RouteRequest,
  RouteResult,
  RouteSegment,
  AccessibilitySummary,
  AccessibilityStatus,
  GraphNode,
  GraphEdge,
} from '../types';
import { loadCampusData } from './campus-data';
import { createLogger } from '../utils/logger';

const logger = createLogger('route-engine');

/** Average walking speed in meters per minute (approx 4.5 km/h) */
const WALKING_SPEED_M_PER_MIN = 75;

/**
 * Builds an adjacency list from campus edges.
 * When stepFreeOnly=true, edges with 'not_step_free' are completely excluded.
 * The graph is bidirectional (undirected) — each edge creates two connections.
 */
function buildAdjacencyList(
  edges: CampusEdge[],
  stepFreeOnly: boolean
): Map<string, GraphEdge[]> {
  const adjacency = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
    // HARD EXCLUSION: stairs and known inaccessible paths are removed entirely
    if (stepFreeOnly && edge.accessibilityStatus === 'not_step_free') {
      continue;
    }

    // Add forward direction
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from)!.push({
      targetId: edge.to,
      weight: edge.distanceMeters,
      edgeData: edge,
    });

    // Add reverse direction (undirected graph)
    if (!adjacency.has(edge.to)) {
      adjacency.set(edge.to, []);
    }
    adjacency.get(edge.to)!.push({
      targetId: edge.from,
      weight: edge.distanceMeters,
      edgeData: edge,
    });
  }

  return adjacency;
}

/**
 * Simple min-heap priority queue for Dijkstra's algorithm.
 */
class MinHeap {
  private heap: Array<{ nodeId: string; distance: number }> = [];

  push(nodeId: string, distance: number): void {
    this.heap.push({ nodeId, distance });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { nodeId: string; distance: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].distance <= this.heap[idx].distance) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < length && this.heap[left].distance < this.heap[smallest].distance) {
        smallest = left;
      }
      if (right < length && this.heap[right].distance < this.heap[smallest].distance) {
        smallest = right;
      }
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

/**
 * Dijkstra's shortest path algorithm.
 * Returns the ordered list of edges forming the shortest path,
 * or null if no path exists.
 */
function dijkstra(
  adjacency: Map<string, GraphEdge[]>,
  startId: string,
  endId: string
): GraphEdge[] | null {
  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edge: GraphEdge } | null>();
  const visited = new Set<string>();
  const heap = new MinHeap();

  distances.set(startId, 0);
  previous.set(startId, null);
  heap.push(startId, 0);

  while (heap.size > 0) {
    const current = heap.pop()!;

    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    // Found the destination
    if (current.nodeId === endId) {
      break;
    }

    const neighbors = adjacency.get(current.nodeId) || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.targetId)) continue;

      const newDist = current.distance + neighbor.weight;
      const oldDist = distances.get(neighbor.targetId) ?? Infinity;

      if (newDist < oldDist) {
        distances.set(neighbor.targetId, newDist);
        previous.set(neighbor.targetId, {
          nodeId: current.nodeId,
          edge: neighbor,
        });
        heap.push(neighbor.targetId, newDist);
      }
    }
  }

  // Reconstruct path
  if (!previous.has(endId)) {
    return null; // No path found
  }

  const pathEdges: GraphEdge[] = [];
  let currentNode = endId;
  while (previous.get(currentNode) !== null) {
    const prev = previous.get(currentNode)!;
    pathEdges.unshift(prev.edge);
    currentNode = prev.nodeId;
  }

  return pathEdges;
}

/**
 * Generates human-readable text directions from route segments.
 */
function generateTextDirections(segments: RouteSegment[]): string[] {
  const directions: string[] = [];

  directions.push(`Start at ${segments[0].from.name}.`);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const distStr = seg.edge.distanceMeters < 100
      ? `${Math.round(seg.edge.distanceMeters)}m`
      : `${(seg.edge.distanceMeters / 1000).toFixed(2)}km`;

    let pathDesc = '';
    switch (seg.edge.pathType) {
      case 'sidewalk': pathDesc = 'along the sidewalk'; break;
      case 'corridor': pathDesc = 'through the corridor'; break;
      case 'ramp': pathDesc = 'via the ramp'; break;
      case 'elevator': pathDesc = 'using the elevator'; break;
      case 'outdoor_path': pathDesc = 'along the outdoor path'; break;
      case 'crossing': pathDesc = 'across the crossing'; break;
      case 'stairs': pathDesc = 'up/down the stairs'; break;
      default: pathDesc = 'along the path';
    }

    let statusNote = '';
    if (seg.edge.accessibilityStatus === 'unknown') {
      statusNote = ' ⚠️ [accessibility unverified]';
    } else if (seg.edge.accessibilityStatus === 'reported_step_free') {
      statusNote = ' ℹ️ [step-free reported but not verified]';
    }

    directions.push(
      `${i + 1}. Walk ${distStr} ${pathDesc} toward ${seg.to.name}.${statusNote}`
    );
  }

  const lastSeg = segments[segments.length - 1];
  directions.push(`Arrive at ${lastSeg.to.name}.`);

  return directions;
}

/**
 * Computes the accessibility summary for a route.
 */
function computeAccessibilitySummary(segments: RouteSegment[]): AccessibilitySummary {
  const statusBreakdown: Record<AccessibilityStatus, number> = {
    verified_step_free: 0,
    reported_step_free: 0,
    not_step_free: 0,
    unknown: 0,
  };

  for (const seg of segments) {
    statusBreakdown[seg.edge.accessibilityStatus]++;
  }

  return {
    allVerifiedStepFree: statusBreakdown.reported_step_free === 0 &&
      statusBreakdown.not_step_free === 0 &&
      statusBreakdown.unknown === 0,
    hasUnknownSegments: statusBreakdown.unknown > 0,
    hasReportedOnlySegments: statusBreakdown.reported_step_free > 0,
    unknownSegmentCount: statusBreakdown.unknown,
    reportedOnlySegmentCount: statusBreakdown.reported_step_free,
    statusBreakdown,
  };
}

/**
 * Calculates a route between two campus nodes.
 *
 * @param request - The route request containing from, to, and step-free requirement
 * @returns RouteResult with the calculated route or a clear no-route indication
 */
export function calculateRoute(request: RouteRequest): RouteResult {
  const startTime = Date.now();
  const campusData = loadCampusData();

  logger.info('Calculating route', {
    from: request.from,
    to: request.to,
    requireStepFree: request.requireStepFree,
  });

  // Validate node IDs exist
  const fromNode = campusData.nodeMap.get(request.from);
  const toNode = campusData.nodeMap.get(request.to);

  if (!fromNode) {
    return {
      success: false,
      route: null,
      totalDistanceMeters: 0,
      estimatedWalkingMinutes: 0,
      accessibilitySummary: computeAccessibilitySummary([]),
      textDirections: [`Error: Start location "${request.from}" is not a recognized campus location.`],
      warnings: [`Unknown start location ID: ${request.from}`],
      computedAt: new Date().toISOString(),
    };
  }

  if (!toNode) {
    return {
      success: false,
      route: null,
      totalDistanceMeters: 0,
      estimatedWalkingMinutes: 0,
      accessibilitySummary: computeAccessibilitySummary([]),
      textDirections: [`Error: Destination "${request.to}" is not a recognized campus location.`],
      warnings: [`Unknown destination location ID: ${request.to}`],
      computedAt: new Date().toISOString(),
    };
  }

  // Same start and destination
  if (request.from === request.to) {
    return {
      success: true,
      route: [],
      totalDistanceMeters: 0,
      estimatedWalkingMinutes: 0,
      accessibilitySummary: computeAccessibilitySummary([]),
      textDirections: [`You are already at ${fromNode.name}.`],
      warnings: [],
      computedAt: new Date().toISOString(),
    };
  }

  // Build graph with step-free constraint enforcement
  const adjacency = buildAdjacencyList(campusData.edges, request.requireStepFree);

  // Run Dijkstra
  const pathEdges = dijkstra(adjacency, request.from, request.to);

  if (!pathEdges || pathEdges.length === 0) {
    const reason = request.requireStepFree
      ? `No step-free route exists between ${fromNode.name} and ${toNode.name}. ` +
        `All available paths between these locations include stairs or inaccessible segments. ` +
        `This is NOT a fallback — the system will not suggest an inaccessible route.`
      : `No route exists between ${fromNode.name} and ${toNode.name} in the campus graph.`;

    logger.warn('No qualifying route found', {
      from: request.from,
      to: request.to,
      requireStepFree: request.requireStepFree,
    });

    return {
      success: false,
      route: null,
      totalDistanceMeters: 0,
      estimatedWalkingMinutes: 0,
      accessibilitySummary: computeAccessibilitySummary([]),
      textDirections: [reason],
      warnings: [reason],
      computedAt: new Date().toISOString(),
    };
  }

  // Build route segments
  const segments: RouteSegment[] = [];
  let totalDistance = 0;
  const warnings: string[] = [];

  // Track the actual node path
  let currentNodeId = request.from;
  for (const graphEdge of pathEdges) {
    const edgeData = graphEdge.edgeData;
    // Determine direction — edge might be traversed in reverse
    const isForward = edgeData.from === currentNodeId;
    const segFromId = isForward ? edgeData.from : edgeData.to;
    const segToId = isForward ? edgeData.to : edgeData.from;

    const segFrom = campusData.nodeMap.get(segFromId)!;
    const segTo = campusData.nodeMap.get(segToId)!;

    totalDistance += edgeData.distanceMeters;

    // Generate instruction
    let instruction = `Walk toward ${segTo.name}`;
    if (edgeData.pathType === 'ramp') {
      instruction = `Take the ramp toward ${segTo.name}`;
    } else if (edgeData.pathType === 'elevator') {
      instruction = `Take the elevator toward ${segTo.name}`;
    } else if (edgeData.pathType === 'corridor') {
      instruction = `Walk through the corridor toward ${segTo.name}`;
    }

    segments.push({
      from: segFrom,
      to: segTo,
      edge: edgeData,
      instruction,
    });

    // Track warnings for unverified segments
    if (edgeData.accessibilityStatus === 'unknown') {
      warnings.push(
        `Segment from ${segFrom.shortName} to ${segTo.shortName}: ` +
        `Accessibility has NOT been assessed. Proceed with caution or seek assistance.`
      );
    } else if (edgeData.accessibilityStatus === 'reported_step_free') {
      warnings.push(
        `Segment from ${segFrom.shortName} to ${segTo.shortName}: ` +
        `Step-free access is reported but not independently verified.`
      );
    }

    currentNodeId = segToId;
  }

  const accessibilitySummary = computeAccessibilitySummary(segments);
  const estimatedMinutes = Math.ceil(totalDistance / WALKING_SPEED_M_PER_MIN);
  const textDirections = generateTextDirections(segments);

  const duration = Date.now() - startTime;
  logger.info('Route calculated', {
    from: request.from,
    to: request.to,
    segments: segments.length,
    totalDistanceMeters: totalDistance,
    estimatedMinutes,
    durationMs: duration,
    allVerifiedStepFree: accessibilitySummary.allVerifiedStepFree,
  });

  return {
    success: true,
    route: segments,
    totalDistanceMeters: totalDistance,
    estimatedWalkingMinutes: estimatedMinutes,
    accessibilitySummary,
    textDirections,
    warnings,
    computedAt: new Date().toISOString(),
  };
}
