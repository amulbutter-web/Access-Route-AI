// ============================================================
// AccessRoute AI — Frontend API Client
// All calls to Person 4 Backend go through this file.
// Seamless dual-mode: Vite dev proxy OR direct localhost:3001 fallback
// ============================================================

import type { Location, RouteResult, ApiResponse, EvidenceResult } from '../types';

// Configurable base URL with fallback to relative (proxy) or direct localhost:3001
const ENV_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ─── Helper: safe fetch with dual-mode fallback & timeout ───
async function safeFetch(
  endpoint: string,
  options?: RequestInit,
  timeoutMs = 15_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // If ENV_BASE is specified, use it directly
  if (ENV_BASE) {
    try {
      return await fetch(`${ENV_BASE}${endpoint}`, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  // Dual-mode: Try relative path first (Vite proxy)
  try {
    const res = await fetch(endpoint, { ...options, signal: controller.signal });
    if (res.ok || res.status < 500) {
      return res;
    }
    throw new Error(`Relative proxy returned status ${res.status}`);
  } catch (err) {
    // If relative fetch fails (e.g. no proxy running or CORS issue), fallback directly to port 3001
    const fallbackUrl = `http://localhost:3001${endpoint}`;
    try {
      return await fetch(fallbackUrl, { ...options, signal: controller.signal });
    } catch {
      throw err;
    }
  } finally {
    clearTimeout(timer);
  }
}

// ─── GET /api/locations ───────────────────────────────────
export async function fetchLocations(): Promise<Location[]> {
  try {
    const res = await safeFetch('/api/locations');
    if (!res.ok) return [];
    const json: ApiResponse<Location[]> = await res.json();
    return json.data ?? [];
  } catch (err) {
    console.error('[AccessRoute AI] Failed to fetch locations:', err);
    return [];
  }
}

// ─── POST /api/route ──────────────────────────────────────
export async function fetchRoute(
  from: string,
  to: string,
  requireStepFree: boolean
): Promise<ApiResponse<RouteResult>> {
  const res = await safeFetch('/api/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, requireStepFree }),
  });
  const json: ApiResponse<RouteResult> = await res.json();
  return json;
}

// ─── GET /api/evidence/:locationId ────────────────────────
export async function fetchEvidence(locationId: string): Promise<EvidenceResult | null> {
  try {
    const res = await safeFetch(`/api/evidence/${encodeURIComponent(locationId)}`);
    if (!res.ok) return null;
    const json: ApiResponse<EvidenceResult> = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}
