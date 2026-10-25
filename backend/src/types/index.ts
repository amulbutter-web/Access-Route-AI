// ============================================================
// AccessRoute AI — Shared Type Definitions
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

// --- Campus Graph Types ---

export interface CampusNode {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  type: 'building' | 'entrance' | 'junction' | 'landmark';
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
  pathType: 'sidewalk' | 'corridor' | 'ramp' | 'elevator' | 'stairs' | 'outdoor_path' | 'crossing';
  surface?: 'paved' | 'unpaved' | 'tiled' | 'concrete' | 'unknown';
  sourceEvidence?: string;
  lastVerified?: string; // ISO date string
  notes?: string;
}

export type AccessibilityStatus =
  | 'verified_step_free'
  | 'reported_step_free'
  | 'not_step_free'
  | 'unknown';

// --- Route Types ---

export interface RouteRequest {
  from: string;
  to: string;
  requireStepFree: boolean;
}

export interface RouteResult {
  success: boolean;
  route: RouteSegment[] | null;
  totalDistanceMeters: number;
  estimatedWalkingMinutes: number;
  accessibilitySummary: AccessibilitySummary;
  textDirections: string[];
  warnings: string[];
  computedAt: string; // ISO timestamp
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

// --- Route Engine Types ---

export interface GraphNode {
  id: string;
  edges: GraphEdge[];
}

export interface GraphEdge {
  targetId: string;
  weight: number;
  edgeData: CampusEdge;
}

// --- TinyFish API Types ---

export interface TinyFishSearchRequest {
  query: string;
  purpose?: string;
  location?: string;
  language?: string;
  include_domains?: string;
  exclude_domains?: string;
  recency_minutes?: number;
  domain_type?: 'web' | 'news' | 'research_paper';
}

export interface TinyFishSearchResponse {
  query: string;
  total_results: number;
  page: number;
  results: TinyFishSearchResult[];
}

export interface TinyFishSearchResult {
  position: number;
  site_name: string;
  title: string;
  snippet: string;
  url: string;
}

export interface TinyFishFetchRequest {
  urls: string[];
  format?: 'markdown' | 'html' | 'json';
  purpose?: string;
  links?: boolean;
  image_links?: boolean;
  ttl?: number;
}

export interface TinyFishFetchResponse {
  results: TinyFishFetchResult[];
  errors: TinyFishFetchError[];
}

export interface TinyFishFetchResult {
  url: string;
  final_url: string;
  title: string;
  description: string;
  language: string;
  format: string;
  text: string;
  links?: string[];
  image_links?: string[];
}

export interface TinyFishFetchError {
  url: string;
  error: string;
}

// --- Evidence Types ---

export interface EvidenceResult {
  query: string;
  locationName: string;
  sources: EvidenceSource[];
  summary: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  retrievedAt: string; // ISO timestamp
  provider: 'tinyfish_search' | 'tinyfish_fetch' | 'local_cache' | 'local_seed';
  isCached: boolean;
  cacheAge?: number; // milliseconds
}

export interface EvidenceSource {
  title: string;
  url: string;
  snippet: string;
  siteName: string;
  relevanceScore: number; // 0-1
  retrievedAt: string;
}

// --- API Response Types ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

export interface ApiMeta {
  timestamp: string;
  requestId: string;
  duration?: number;
  provider?: string;
  cached?: boolean;
}

// --- Health Check Types ---

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  services: {
    routeEngine: ServiceHealth;
    tinyfish: ServiceHealth;
    campusData: ServiceHealth;
  };
  version: string;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded' | 'unchecked';
  lastCheck?: string;
  latencyMs?: number;
  message?: string;
}

// --- Location List for Frontend ---

export interface LocationListItem {
  id: string;
  name: string;
  shortName: string;
  type: CampusNode['type'];
  accessibilityNotes?: string;
}

// --- Config Types ---

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  tinyfish: TinyFishConfig;
  rateLimit: RateLimitConfig;
}

export interface TinyFishConfig {
  apiKey: string;
  searchBaseUrl: string;
  fetchBaseUrl: string;
  searchTimeoutMs: number;
  fetchTimeoutMs: number;
  maxRetries: number;
  cacheTtlMs: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}
