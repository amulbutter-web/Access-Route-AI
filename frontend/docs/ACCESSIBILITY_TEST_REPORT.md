# AccessRoute AI — Manual Accessibility & Usability Test Report

**Owner:** Person 01 — Product Owner, PRD, UX and Frontend  
**Version:** 1.0  
**Date:** 2026-10-24  
**Note:** This template must be filled in AFTER testing is actually run. Do not mark tests passed without executing them and observing results.

---

## Test Environment

| Field | Value |
|---|---|
| Browser | *(fill in: Chrome/Firefox/Safari + version)* |
| OS | *(fill in)* |
| Screen reader | *(fill in: NVDA / VoiceOver / None)* |
| Viewport tested | *(fill in: 320px, 768px, 1280px)* |
| Date tested | *(fill in)* |
| Tester | *(fill in)* |

---

## Keyboard Navigation Test

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| K1 | Tab through all interactive elements | All elements reachable in logical order | PASS / FAIL / SKIP | |
| K2 | Start selector navigable by arrow keys | Options selectable with keyboard | PASS / FAIL / SKIP | |
| K3 | Destination selector navigable by arrow keys | Options selectable with keyboard | PASS / FAIL / SKIP | |
| K4 | "Find Step-Free Route" button activates on Enter/Space | Route request triggered | PASS / FAIL / SKIP | |
| K5 | No keyboard trap exists anywhere | Focus never gets stuck | PASS / FAIL / SKIP | |
| K6 | Visible focus indicator on all interactive elements | Clear, visible focus ring | PASS / FAIL / SKIP | |
| K7 | Skip-to-content link is first tab stop | Links to main content | PASS / FAIL / SKIP | |
| K8 | Error message receives focus after failed submit | User is informed without mouse | PASS / FAIL / SKIP | |

---

## Screen Reader Test (NVDA or VoiceOver)

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| SR1 | App heading is announced | "AccessRoute AI" or main heading read | PASS / FAIL / SKIP | |
| SR2 | Form labels are announced with controls | "Start location" / "Destination" announced | PASS / FAIL / SKIP | |
| SR3 | Route loading announced | "Finding your step-free route…" announced | PASS / FAIL / SKIP | |
| SR4 | Route found announced | "Step-free route found" announced immediately | PASS / FAIL / SKIP | |
| SR5 | No route announced | "No step-free route found between X and Y" | PASS / FAIL / SKIP | |
| SR6 | Error state announced | Error message announced | PASS / FAIL / SKIP | |
| SR7 | Route steps readable | Each step and status read correctly | PASS / FAIL / SKIP | |
| SR8 | Evidence panel readable | Source, date, claim readable | PASS / FAIL / SKIP | |

---

## Responsive Layout Test

| # | Test | Viewport | Expected | Result | Notes |
|---|---|---|---|---|---|
| RL1 | App loads without horizontal scroll | 320px | No overflow | PASS / FAIL | |
| RL2 | Selectors usable on narrow screen | 320px | Dropdowns work | PASS / FAIL | |
| RL3 | Map visible and usable | 320px | Compact map loads | PASS / FAIL | |
| RL4 | Text directions visible on narrow screen | 320px | Directions readable | PASS / FAIL | |
| RL5 | Layout correct on tablet | 768px | Stacked or side-by-side correct | PASS / FAIL | |
| RL6 | Layout correct on desktop | 1280px | Full desktop layout | PASS / FAIL | |
| RL7 | Touch targets ≥ 44×44px on mobile | 375px | All buttons/inputs meet target | PASS / FAIL | |

---

## Color and Contrast Test

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| C1 | "Verified step-free" — text contrast ≥ 4.5:1 | WCAG AA pass | PASS / FAIL | |
| C2 | "Reported step-free" — text contrast ≥ 4.5:1 | WCAG AA pass | PASS / FAIL | |
| C3 | "Unknown" — text contrast ≥ 4.5:1 | WCAG AA pass | PASS / FAIL | |
| C4 | Status is not communicated by color alone | Icon + text label present for all statuses | PASS / FAIL | |
| C5 | Button text contrast on default state | WCAG AA pass | PASS / FAIL | |
| C6 | Error message text contrast | WCAG AA pass | PASS / FAIL | |

---

## Reduced Motion Test

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| RM1 | `prefers-reduced-motion: reduce` set in OS/browser | No route draw animation; instant appearance | PASS / FAIL | |
| RM2 | Loading spinner replaced with static text | "Loading…" text visible instead of animation | PASS / FAIL | |

---

## State Validation Test

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| SV1 | Submit with no Start selected | Inline error shown; no crash | PASS / FAIL | |
| SV2 | Submit with no Destination selected | Inline error shown; no crash | PASS / FAIL | |
| SV3 | Same Start and Destination selected | Inline error: "must be different" | PASS / FAIL | |
| SV4 | Valid route request | Map + text directions displayed | PASS / FAIL | |
| SV5 | No-route scenario | Clear no-route message; no map line drawn | PASS / FAIL | |
| SV6 | Backend unreachable | Error state shown; "Try Again" visible | PASS / FAIL | |
| SV7 | Map tiles fail | Map banner shown; text directions visible | PASS / FAIL | |
| SV8 | TinyFish unavailable | Route still shown; evidence shows "unavailable" | PASS / FAIL | |
| SV9 | Rapid repeated submissions | No duplicate requests sent; loading shows once | PASS / FAIL | |
| SV10 | Stale result followed by new request | Old result is replaced cleanly | PASS / FAIL | |

---

## Known Limitations (Fill in after testing)

*List any issues found that could not be fixed before the demo:*

1. *(issue, severity, workaround if any)*
2. 
3. 

---

## Sign-off

| Role | Name | Date | Status |
|---|---|---|---|
| Person 01 (Frontend) | | 2026-10-24 | ☐ Completed |
| Person 04 (Integration/QA) | | 2026-10-24 | ☐ Reviewed |
