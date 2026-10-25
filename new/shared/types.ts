// ============================================================
// AccessRoute AI — Central Shared Type Definitions
// Person 2: Architecture & System Design
// Canonical Source of Truth across Person 1, 2, 3, and 4
// ============================================================

export type AccessibilityStatus =
  | 'verified_step_free'
  | 'reported_step_free'
  | 'not_step_free'
  | 'unknown';

export type PathType =
  | 'sidewalk'
  | 'corridor'
  | 'ramp'
  | 'elevator'
  | 'stairs'
  | 'outdoor_path'
  | 'crossing';

export type SurfaceType =
  | 'paved'
  | 'unpaved'
  | 'tiled'
  | 'concrete'
  | 'unknown';

export type NodeKind =
  | 'building'
  | 'entrance'
  | 'junction'
  | 'landmark';

export interface CampusNode {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  type: NodeKind;
  floor?: number;
  description?: string;
  accessibilityNotes?: string;
}

export interface CampusEdge {
  id: string;
  from: string;
  to: string;
  distanceMeters: number;
  accessibilityStatus: AccessibilityStatus;
  pathType: PathType;
  surface?: SurfaceType;
  sourceEvidence?: string;
  lastVerified?: string;
  notes?: string;
}

export interface RouteRequest {
  from: string;
  to: string;
  requireStepFree: boolean;
}

export interface RouteSegment {
  from: CampusNode;
  to: CampusNode;
  edge: CampusEdge;
  instruction: string;
}

export interface AccessibilitySummary {
  allVerifiedStepFree: boolean;
  hasUnknownSegments: boolean;
  hasReportedOnlySegments: boolean;
  unknownSegmentCount: number;
  reportedOnlySegmentCount: number;
  statusBreakdown: Record<AccessibilityStatus, number>;
}

export interface RouteResult {
  success: boolean;
  route: RouteSegment[] | null;
  totalDistanceMeters: number;
  estimatedWalkingMinutes: number;
  accessibilitySummary: AccessibilitySummary;
  textDirections: string[];
  warnings: string[];
  computedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
    duration?: number;
    provider?: string;
    cached?: boolean;
  };
}
