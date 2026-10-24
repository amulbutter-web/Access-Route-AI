// ============================================================
// AccessRoute AI — Frontend Type Definitions
// Aligned with Person 4 Backend API Contracts
// ============================================================

export type AccessibilityStatus =
  | 'verified_step_free'
  | 'reported_step_free'
  | 'not_step_free'
  | 'unknown';

// Matches GET /api/locations response items
export interface Location {
  id: string;
  name: string;
  shortName: string;
  type: 'building' | 'entrance' | 'junction' | 'landmark';
  accessibilityNotes?: string;
}

// Matches POST /api/route response → data.route[]
export interface RouteSegment {
  from: { id: string; name: string; shortName: string; lat: number; lng: number; type: string };
  to: { id: string; name: string; shortName: string; lat: number; lng: number; type: string };
  edge: {
    id: string;
    distanceMeters: number;
    accessibilityStatus: AccessibilityStatus;
    pathType: string;
    surface?: string;
    sourceEvidence?: string;
    notes?: string;
  };
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

// Matches POST /api/route response → data
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

// Matches the standard API envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: string };
  meta: {
    timestamp: string;
    requestId: string;
    duration?: number;
    provider?: string;
    cached?: boolean;
  };
}

// Evidence types
export interface EvidenceSource {
  title: string;
  url: string;
  snippet: string;
  siteName: string;
  relevanceScore: number;
  retrievedAt: string;
}

export interface EvidenceResult {
  query: string;
  locationName: string;
  sources: EvidenceSource[];
  summary: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  retrievedAt: string;
  provider: string;
  isCached: boolean;
  cacheAge?: number;
}

// UI State Machine
export type ApiState<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: T }
  | { kind: 'error'; error: { code: string; message: string } };
