# AccessRoute AI — Product Requirements Document (PRD)

**Owner:** Person 01 — Product Owner, PRD, UX and Frontend  
**Project:** AccessRoute AI — HackIIITD 24-hour Build  
**Venue:** IIIT Delhi Campus  
**Version:** 1.0  
**Date:** 2026-10-24  
**Status:** Draft — agree with Persons 2, 3, 4 before parallel coding begins

---

## 1. Problem Statement

Conventional navigation apps (Google Maps, Apple Maps, etc.) optimize for the shortest or fastest route. They do not reliably filter for stair-free paths, broken ramps, missing kerb cuts, obstructed pavements, or lift outages. For a wheelchair user, a person with limited mobility, or someone temporarily injured, the "shortest" route can be completely unusable.

**There is no accessible, honest, localized routing tool for IIIT Delhi campus.**

---

## 2. Target Users

| User Type | Mobility Need | Scenario |
|---|---|---|
| Primary | Wheelchair user | Needs guaranteed no-stairs, no-kerb path |
| Primary | Mobility-impaired walker | Needs flat, smooth, ramp-accessible paths |
| Secondary | Temporary injury (leg/foot) | Needs step-free route for duration of recovery |
| Tertiary | Carer/companion | Planning a route on behalf of a user |

> **[!IMPORTANT]**
> We do NOT build for: blind/visually impaired users as primary users, hearing impairments, chronic illness, or any other disability category. The single focus is step-free navigation. Scope is IIIT Delhi campus demo area only.

---

## 3. Product Goal

Build a focused web-based route planner that:

1. Accepts a start and destination within a small defined IIIT Delhi campus zone.
2. Returns a step-free route using a verified graph with hard stair exclusions.
3. Clearly labels every route edge's accessibility status (verified / reported / unknown).
4. Shows a map route AND text directions.
5. Shows evidence: source, timestamp, confidence.
6. Gives an honest "no route found" response when no qualifying path exists.
7. Degrades gracefully when TinyFish, map tiles, or backend APIs are unavailable.

---

## 4. Non-Goals (Out of Scope for 24-hour MVP)

| Out of Scope | Reason |
|---|---|
| Nationwide / whole-campus coverage | Insufficient time and unverifiable data |
| Real-time lift status | No reliable live data source |
| Computer vision obstacle detection | No working dataset |
| User accounts and profiles | Not needed for demo journey |
| Medical data collection | Privacy risk, not necessary |
| Complex admin / analytics dashboard | Complexity risk |
| Custom AI models | Time risk |
| Multiple mobility filter settings | Scope creep |
| 3D maps or heavy animation | Reliability risk |
| Any feature not integrated before deadline | Hard rule |

---

## 5. User Journey (Primary Flow)

```
1. User opens AccessRoute AI in browser
        ↓
2. User sees: campus map + start/destination selector
        ↓
3. User picks a start location (from supported list)
        ↓
4. User picks a destination (from supported list)
        ↓
5. User clicks "Find Step-Free Route"
        ↓
6. App shows: loading state
        ↓
7. Route engine returns result
        ↓
    ┌── ROUTE FOUND ────────────────────────────────┐
    │  - Route drawn on map                         │
    │  - Step-by-step text directions shown         │
    │  - Each segment has accessibility status      │
    │  - Evidence panel: source, date, confidence   │
    │  - Warnings shown if any segment is "reported"│
    └───────────────────────────────────────────────┘
        OR
    ┌── NO ROUTE FOUND ─────────────────────────────┐
    │  - Clear message: "No step-free route found"  │
    │  - Explanation of why (stairs, unknown, etc.) │
    │  - DO NOT show a route with stairs            │
    └───────────────────────────────────────────────┘
        OR
    ┌── ERROR STATE ────────────────────────────────┐
    │  - Backend unavailable: show local-only notice│
    │  - Map tiles fail: retain text directions     │
    │  - TinyFish unavailable: route still works    │
    └───────────────────────────────────────────────┘
```

---

## 6. User Stories

### Core Journey
| ID | As a | I want to | So that | Priority |
|---|---|---|---|---|
| US-01 | Mobility-impaired user | Select a start and destination from known campus locations | I can plan where to go | P0 |
| US-02 | Wheelchair user | Request a step-free route | I avoid stairs and inaccessible paths | P0 |
| US-03 | User | See the route on a map | I can visually follow the path | P0 |
| US-04 | User | See step-by-step text directions | I don't rely on reading a map | P0 |
| US-05 | User | See what is verified vs. reported vs. unknown | I can assess trust in the route | P0 |
| US-06 | User | Get an honest message when no step-free route exists | I don't accidentally take an inaccessible route | P0 |
| US-07 | User | See where data came from and how old it is | I can judge reliability of the information | P1 |
| US-08 | User | Use the app on my phone | I can use it while navigating campus | P1 |
| US-09 | User | Use the app with keyboard only | The app is accessible to me regardless of input method | P1 |
| US-10 | User | See the app recover when a service fails | I can still get local routing info | P1 |

### Secondary (only if MVP is stable)
| ID | As a | I want to | So that |
|---|---|---|---|
| US-11 | User | Report an obstacle | Others know about new barriers |

---

## 7. Acceptance Criteria

### AC-01 — Route Request
- [ ] User can pick start and destination from a dropdown/selector showing only supported campus locations.
- [ ] "Find Step-Free Route" button triggers the route request.
- [ ] Selecting the same place for start and destination shows a validation error.
- [ ] Empty selection shows an inline validation error, not a crash.

### AC-02 — Route Result (Success)
- [ ] Route is drawn on the map as a polyline.
- [ ] Step-by-step text directions appear alongside/below the map.
- [ ] Each route step shows accessibility status: `verified_step_free`, `reported_step_free`, `not_step_free`, or `unknown`.
- [ ] `unknown` is NEVER labeled as accessible.
- [ ] `not_step_free` edges NEVER appear in a step-free route result.
- [ ] Evidence panel shows source name, source URL, retrieval date, and confidence label.

### AC-03 — No Route Found
- [ ] If no step-free path exists, a clear message is displayed: e.g. "No step-free route found between [start] and [destination]."
- [ ] The UI does NOT silently fall back to a stair-containing route.
- [ ] Optional: a message explaining why (e.g., "all connecting paths contain stairs").

### AC-04 — Error States
- [ ] When backend is unreachable: user sees "Service temporarily unavailable — please try again."
- [ ] When map tiles fail to load: text directions remain visible and usable.
- [ ] When TinyFish is unavailable: route still works; evidence panel shows "Live research unavailable."
- [ ] No blank/white screen on any network failure.

### AC-05 — Accessibility / Usability
- [ ] App works at 320px minimum width (mobile).
- [ ] App works at 1280px desktop width.
- [ ] All interactive elements have visible focus indicators.
- [ ] All form inputs have proper `<label>` elements.
- [ ] Route status announcements are made via `aria-live` regions for screen readers.
- [ ] Color is not the only indicator of status (text label must accompany color coding).
- [ ] Sufficient color contrast (WCAG AA minimum).
- [ ] No keyboard traps.

### AC-06 — Production Build
- [ ] `npm run build` completes without errors.
- [ ] Production build does not expose API keys in frontend bundle or source maps.
- [ ] App loads from a clean browser session without errors.

---

## 8. API Contracts (Person 01 View)

These are frozen by Person 02. Person 01 uses only these shapes — do not invent fields.

### RouteRequest (sent to backend)
```typescript
{
  startId: string;      // e.g. "node_lecture_hall_entrance"
  destinationId: string;
  mode: "step_free";    // always "step_free" for MVP
}
```

### RouteResponse (received from backend)
```typescript
{
  status: "found" | "no_route" | "invalid_input" | "service_error";
  routeNodeIds?: string[];
  instructions?: RouteInstruction[];
  distanceMeters?: number;       // only if defensible / known
  evidence?: Evidence[];
  warnings?: string[];
  generatedAt: string;           // ISO 8601
}

type RouteInstruction = {
  stepNumber: number;
  description: string;
  accessibilityStatus: AccessibilityStatus;
  distanceMeters?: number;
};

type AccessibilityStatus = 
  "verified_step_free" | "reported_step_free" | "not_step_free" | "unknown";

type Evidence = {
  sourceUrl: string;
  sourceTitle: string;
  retrievedAt: string;           // ISO 8601
  claim: string;
  verificationLabel: string;
  limitations: string;
};
```

### Error Response
```typescript
{
  code: string;                  // stable machine-readable code
  message: string;               // user-safe description
  requestId?: string;
}
```

### Place (for dropdowns)
```typescript
{
  id: string;
  name: string;
  kind: "building" | "entrance" | "outdoor_node" | "destination";
}
```

---

## 9. Known Assumptions and Open Decisions

| # | Assumption / Decision | Owner | Status |
|---|---|---|---|
| A1 | Map tile provider: OpenStreetMap with Leaflet | Person 02 | To confirm |
| A2 | Supported places list to be provided by Person 03 | Person 03 | To confirm |
| A3 | Backend runs locally on port 3001 in dev | Person 02 | To confirm |
| A4 | Frontend runs on port 5173 (Vite default) | Person 01 | Proposed |
| A5 | TinyFish is called from backend only; never from frontend | All | Agreed |
| A6 | No user authentication for MVP | All | Agreed |
| A7 | Distance shown as approximate; label with "approx." | Person 03 | To confirm |
| A8 | Feature freeze at hour 18 | All | Agreed |

---

## 10. Definition of Done for Person 01

- [ ] `docs/PRD.md` written, reviewed with team.
- [ ] `docs/UX_STATES.md` written with all state designs and copy.
- [ ] `docs/DEMO_SCRIPT.md` written (coordinated with Person 04).
- [ ] All UI components built and integrated with agreed API contract.
- [ ] Manual accessibility/usability test report written.
- [ ] All acceptance criteria checked and evidence recorded.
- [ ] No mocks presented as live data in production build.
