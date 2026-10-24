// ============================================================
// AccessRoute AI — Frontend API Client
// Owner: Person 01
// NOTE: All backend calls go through this file. Never call
//       TinyFish or external APIs directly from the browser.
// ============================================================

import type { RouteRequest, RouteResponse, Place, ApiError } from "../types";

// Backend base URL — loaded from environment variable at build time.
// Set VITE_API_BASE_URL in .env (never commit real values).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

// ─── Helper: safe fetch with timeout ─────────────────────────
async function safeFetch(
  url: string,
  options?: RequestInit,
  timeoutMs = 15_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Helper: parse error response ────────────────────────────
async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    return {
      code: body?.code ?? "UNKNOWN_ERROR",
      message: body?.message ?? "An unexpected error occurred.",
      requestId: body?.requestId,
    };
  } catch {
    return {
      code: "PARSE_ERROR",
      message: "Service temporarily unavailable. Please try again.",
    };
  }
}

// ─── GET /api/places ─────────────────────────────────────────
/**
 * Returns the list of supported campus places for the dropdowns.
 * Returns an empty array on error (UI shows empty state).
 */
export async function fetchPlaces(): Promise<Place[]> {
  try {
    const res = await safeFetch(`${API_BASE}/api/places`);
    if (!res.ok) return [];
    const data = await res.json();
    // Validate minimal shape
    if (!Array.isArray(data)) return [];
    return data as Place[];
  } catch {
    return [];
  }
}

// ─── POST /api/route ─────────────────────────────────────────
/**
 * Requests a step-free route between two campus locations.
 * Returns a RouteResponse on success, or throws an ApiError.
 */
export async function fetchRoute(
  request: RouteRequest
): Promise<RouteResponse> {
  let res: Response;
  try {
    res = await safeFetch(`${API_BASE}/api/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch (err) {
    // Network error or timeout
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    throw {
      code: isAbort ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
      message: "Service temporarily unavailable. Please try again.",
    } satisfies ApiError;
  }

  if (!res.ok) {
    const apiError = await parseErrorResponse(res);
    throw apiError;
  }

  try {
    const data = await res.json();
    return data as RouteResponse;
  } catch {
    throw {
      code: "PARSE_ERROR",
      message: "Received an unexpected response. Please try again.",
    } satisfies ApiError;
  }
}
