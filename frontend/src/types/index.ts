// ============================================================
// AccessRoute AI — Shared TypeScript Types
// Owner: Person 01 (agreed with Person 02 — do not change
//        without team approval and updating API_CONTRACTS.md)
// ============================================================

// ─── Accessibility Status ────────────────────────────────────
export type AccessibilityStatus =
  | "verified_step_free"
  | "reported_step_free"
  | "not_step_free"
  | "unknown";

// ─── Place ───────────────────────────────────────────────────
export type PlaceKind = "building" | "entrance" | "outdoor_node" | "destination";

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
}

// ─── Route Request ───────────────────────────────────────────
export interface RouteRequest {
  startId: string;
  destinationId: string;
  mode: "step_free"; // always "step_free" for MVP
}

// ─── Route Instructions ──────────────────────────────────────
export interface RouteInstruction {
  stepNumber: number;
  description: string;
  accessibilityStatus: AccessibilityStatus;
  distanceMeters?: number; // only if defensible/known
}

// ─── Evidence ────────────────────────────────────────────────
export interface Evidence {
  sourceUrl: string;
  sourceTitle: string;
  retrievedAt: string;       // ISO 8601
  claim: string;
  verificationLabel: string;
  limitations: string;
}

// ─── Route Response ──────────────────────────────────────────
export type RouteStatus =
  | "found"
  | "no_route"
  | "invalid_input"
  | "service_error";

export interface RouteResponse {
  status: RouteStatus;
  routeNodeIds?: string[];
  instructions?: RouteInstruction[];
  distanceMeters?: number;   // only if defensible
  evidence?: Evidence[];
  warnings?: string[];
  generatedAt: string;       // ISO 8601
}

// ─── Error Response ──────────────────────────────────────────
export interface ApiError {
  code: string;              // stable machine-readable code
  message: string;           // user-safe description
  requestId?: string;
}

// ─── API State (for UI state management) ─────────────────────
export type ApiState<T> =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: T }
  | { kind: "error"; error: ApiError };
