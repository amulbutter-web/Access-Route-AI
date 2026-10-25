# AccessRoute AI — Frontend

**Role:** Person 01 — Product Owner, PRD, UX and Frontend  
**Project:** AccessRoute AI — HackIIITD 24-hour Build  
**Campus:** IIIT Delhi (demo area only)

---

## What This Package Contains

This is the complete **Person 01 deliverable package** for AccessRoute AI. It includes:

| File / Folder | Purpose |
|---|---|
| `docs/PRD.md` | Product Requirements Document — problem, users, user stories, acceptance criteria |
| `docs/UX_STATES.md` | All 11 UI states with exact copy, aria regions, and accessibility notes |
| `docs/DEMO_SCRIPT.md` | 4-minute demo script, pre-demo checklist, fallback plans, judge Q&A |
| `docs/ACCESSIBILITY_TEST_REPORT.md` | Manual test report template (fill in after actual testing) |
| `src/types/index.ts` | Shared TypeScript types (agreed with Person 02 — do not change without team) |
| `src/services/apiClient.ts` | Frontend API client (timeout, error handling, never calls TinyFish) |
| `src/components/RouteSelector.tsx` | Start/destination form with full accessibility |
| `src/components/RouteResult.tsx` | Route result component handling all states |
| `src/features/map/MapView.tsx` | Leaflet map with tile error handling |
| `src/App.tsx` | Root component — orchestrates all components |
| `src/styles/globals.css` | Global CSS with design tokens, responsive layout, reduced-motion |
| `src/main.tsx` | React entry point |
| `index.html` | HTML shell with Leaflet CSS, lang attribute |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | Strict TypeScript config |
| `vite.config.ts` | Vite with dev proxy and no source maps in production |
| `.env.example` | Environment variable template (no real secrets) |
| `.gitignore` | Excludes .env, node_modules, dist |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL to backend URL (default: http://localhost:3001)

# 3. Start development server (backend must also be running)
npm run dev

# 4. Open http://localhost:5173
```

---

## Production Build

```bash
npm run build
# Output in dist/
# Source maps are disabled — API URLs not exposed in bundle
```

---

## Key Constraints (Do Not Violate)

1. **Never call TinyFish from the browser.** All external API calls go through the backend.
2. **Never expose API keys** in frontend code, `.env`, source maps, or logs.
3. **Never label `unknown` as accessible.** Status must come from the shared `AccessibilityStatus` type.
4. **Never fall back to a stair-containing route.** If `status !== "found"`, show the no-route state.
5. **Always provide text directions** alongside the map (tile failure fallback).

---

## Integration Points (Awaiting Other Team Members)

| Dependency | From | Status |
|---|---|---|
| Supported campus locations list | Person 03 | **Awaiting** |
| Node coordinates for map polyline | Person 03 | **Awaiting** |
| Backend API running on port 3001 | Person 02 | **Awaiting** |
| Frozen API contract | Person 02 | **Agreed in types/index.ts** |
| Demo route verification | Person 04 | **Awaiting** |

---

## Acceptance Criteria Summary

- [ ] User can select two different supported places and request a step-free route.
- [ ] Route shows map + readable text directions + status + evidence.
- [ ] `unknown` is never presented as verified.
- [ ] No-route state is clear and does not show stairs.
- [ ] All 11 UI states display correctly and are understandable.
- [ ] Works at 320px mobile width and with keyboard-only navigation.
- [ ] Passes manual accessibility test (fill in `ACCESSIBILITY_TEST_REPORT.md`).
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] No API keys in built bundle.

---

## Design Palette

| Token | Hex | Usage |
|---|---|---|
| Midnight blue | `#14213D` | Header, primary heading |
| Violet accent | `#6C4DFF` | CTA button, focus ring |
| Turquoise | `#27D7C4` | Info notices |
| Warm amber | `#FFBF69` | Warning badges |
| Off-white | `#F7F8FC` | Page background |
| Charcoal | `#202536` | Footer, body text |
| Success green | `#1A8A5A` | Verified step-free status |
| Error red | `#D94F4F` | Errors, not-step-free |
