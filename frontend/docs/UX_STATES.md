# AccessRoute AI — UX States Document

**Owner:** Person 01 — Product Owner, PRD, UX and Frontend  
**Version:** 1.0  
**Date:** 2026-10-24

> All copy in this document is exact UI text. Do not deviate from this copy in the implementation without updating this document. Coordinate any changes with Person 04 (demo script).

---

## Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│  AccessRoute AI                        [Skip to directions ↓] │  ← Header / Nav
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌───────────────────────┐   │
│  │  Start location: [Select▼]  │  │  From: ____________    │   │  ← Route Selector Panel
│  │  Destination:   [Select▼]  │  │  To:   ____________    │   │
│  │  [Find Step-Free Route]    │  │                       │   │
│  └────────────────────────────┘  └───────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    MAP AREA                                  │  ← Map (primary)
│                    (Leaflet)                                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ROUTE RESULT / STATUS / EVIDENCE                            │  ← Result Panel
└──────────────────────────────────────────────────────────────┘
```

---

## State 1: Initial / Idle

**When:** App has loaded; no route requested yet.

### UI Copy
- **Heading:** "Find your step-free route"
- **Subheading:** "Select a start and destination to plan an accessible path on IIIT Delhi campus."
- **Start label:** "Start location"
- **Start placeholder:** "Select a start location"
- **Destination label:** "Destination"
- **Destination placeholder:** "Select a destination"
- **Button:** "Find Step-Free Route"
- **Map:** Shows the campus area with supported locations marked. No route line.
- **Result panel:** Hidden / empty.

### Notes
- Button is enabled only when both fields are selected and they differ.
- Focus order: Start selector → Destination selector → Button.
- Map shows supported nodes with subtle markers.

---

## State 2: Validation Error — Empty Field

**When:** User clicks "Find Step-Free Route" with one or both fields unselected.

### UI Copy
- **Inline error (Start):** "Please select a start location."
- **Inline error (Destination):** "Please select a destination."
- **`role="alert"`:** "Please complete both fields before searching."

### Notes
- Error messages appear directly below the relevant selector.
- Focus is moved to the first field with an error.
- Button remains visible; errors clear when user corrects selection.

---

## State 3: Validation Error — Same Start and Destination

**When:** User selects the same place for Start and Destination.

### UI Copy
- **Inline error:** "Start and destination must be different places."
- **`role="alert"`:** "Start and destination cannot be the same location."

### Notes
- Can be caught in real-time as user selects, or on submit — both are acceptable.

---

## State 4: Loading

**When:** Route request has been sent to backend; awaiting response.

### UI Copy
- **Status area (aria-live="polite"):** "Finding your step-free route…"
- **Button:** Disabled; shows spinner + "Searching…"
- **Map:** Previous state shown; no new route line yet.

### Notes
- Do not show a skeleton route. Show a clear loading message.
- If loading takes more than 10 seconds, show: "This is taking longer than expected. Please wait…"

---

## State 5: Route Found — Success

**When:** Backend returns `status: "found"` with a valid route.

### UI Copy
- **Status heading (aria-live="assertive"):** "Step-free route found"
- **Route summary:** "[N] steps · Approx. [X] m" (only if distance is defensible)
- **Warning banner (if any):** "⚠ Parts of this route are based on reported but unverified information. Please exercise caution."

### Route Step Format
```
Step 1: Head north from [Start Name] entrance
        ✓ Verified step-free  [source badge]
Step 2: Continue along path to [Waypoint Name]
        ⚠ Reported step-free (not physically verified)  [source badge]
Step 3: Enter [Destination Name] via accessible entrance
        ✓ Verified step-free  [source badge]
```

### Evidence Panel Copy
```
Accessibility Information
──────────────────────────────────
Source: [sourceTitle]
URL: [sourceUrl] (link)
Retrieved: [retrievedAt, human-readable, e.g. "3 days ago"]
Claim: "[claim text]"
Status: Verified step-free / Reported step-free / Unknown
Limitations: [limitations text]
──────────────────────────────────
⚠ This information is not a guarantee of physical accessibility.
  Conditions may have changed. Verify before relying on this route.
```

### Status Icons / Labels
| Status | Icon | Label | Color |
|---|---|---|---|
| `verified_step_free` | ✓ | Verified step-free | Green `#1A8A5A` |
| `reported_step_free` | ⚠ | Reported step-free | Amber `#FFBF69` |
| `not_step_free` | ✗ | Contains stairs | Red `#D94F4F` |
| `unknown` | ? | Accessibility unknown | Grey `#888` |

> Color is NEVER the only indicator. Icon + text label is always required.

---

## State 6: No Route Found

**When:** Backend returns `status: "no_route"`.

### UI Copy
- **Status heading (aria-live="assertive"):** "No step-free route found"
- **Body:** "We couldn't find a step-free route between [Start Name] and [Destination Name]. The connecting paths may include stairs or have unknown accessibility."
- **Guidance:** "Try a different start or destination, or check with the campus facilities office for current accessibility information."
- **Map:** No route line drawn. Start and destination markers remain.

### Notes
- Do NOT suggest a stair-containing route as an alternative.
- Do NOT show a route on the map even partially.

---

## State 7: Invalid Input Error (Backend Validation)

**When:** Backend returns `status: "invalid_input"` (e.g., unknown place IDs).

### UI Copy
- **Status (aria-live="assertive"):** "Invalid selection"
- **Body:** "One or more selected locations are not supported. Please choose from the available options."

---

## State 8: Backend / Service Error

**When:** Backend returns `status: "service_error"` or network request fails (HTTP 5xx / network error).

### UI Copy
- **Status (aria-live="assertive"):** "Service temporarily unavailable"
- **Body:** "We're unable to process your route request right now. Please try again in a moment."
- **Action:** "Try Again" button (retries the last request).
- **Map:** Remains visible with markers. No route line.

### Notes
- Do not expose error codes, stack traces, or internal error details.
- Text directions from a previous successful result, if any, should remain visible.

---

## State 9: Map Tiles Failed

**When:** Leaflet fails to load map tiles (network error, tile provider down).

### UI Copy
- **Map area banner:** "Map unavailable — tile service could not be reached."
- **Text directions:** Remain fully visible and functional below the map area.
- **Status:** Route text and evidence panel are unaffected.

### Notes
- The map area shows a grey background with the banner.
- Text directions are the fallback; they must always be present.

---

## State 10: TinyFish Unavailable

**When:** Backend could not reach TinyFish; local routing succeeds.

### UI Copy
- **Evidence panel notice:** "Live accessibility research is currently unavailable. Route is based on locally verified information only."
- **Route result:** Still displayed normally if a step-free route exists.

### Notes
- TinyFish failure MUST NOT affect route calculation.
- Route result is still shown. Only the evidence panel reflects the outage.

---

## State 11: Stale Result Warning

**When:** Route data is older than 30 days (threshold agreed with Person 03).

### UI Copy
- **Warning badge on affected step:** "Information may be outdated (last verified [date])."
- **Evidence panel:** "⚠ This source was last retrieved [N days] ago. Conditions may have changed."

---

## Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| ≥ 1024px | Side-by-side: selector panel left, map right; result panel below |
| 768–1023px | Stacked: selector panel top, map below, result panel below map |
| < 768px | Full-width stacked: selector → map (compact height) → result |

---

## Keyboard and Focus Notes

- All selectors must be navigable by keyboard (arrow keys for options, Enter to select).
- Modal dialogs or panels (if any) must trap focus until dismissed.
- Skip-to-content link at top of page links to main map/result area.
- Focus returns to "Find Step-Free Route" button after an error clear.
- After route result: focus moves to the result heading.

---

## Screen Reader Announcements

| Event | Region | Message |
|---|---|---|
| Route search started | `aria-live="polite"` | "Finding your step-free route…" |
| Route found | `aria-live="assertive"` | "Step-free route found. [N steps]. Scroll down for directions." |
| No route found | `aria-live="assertive"` | "No step-free route found between [start] and [destination]." |
| Error | `aria-live="assertive"` | "Service temporarily unavailable. Please try again." |
| Validation error | `aria-live="assertive"` | "Please complete both fields before searching." |

---

## Reduced Motion

- If `prefers-reduced-motion: reduce` is detected, disable all animations.
- Route polyline draw animation → instant appearance.
- Spinner → static text "Loading…".
- No transitions on state changes.
