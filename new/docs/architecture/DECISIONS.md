# Architecture Decision Records (ADRs)

> **Person 2: Architecture & System Design**

---

## ADR-001: Strict Hard Exclusion for Step-Free Routing

- **Status:** Accepted
- **Context:** Standard navigation algorithms often penalize stairs (e.g. 5x or 10x distance weight), which causes Dijkstra to still select stairs if the alternative ramp is long or unavailable.
- **Decision:** When `requireStepFree: true`, all edges where `accessibilityStatus === 'not_step_free'` or `pathType === 'stairs'` are completely pruned from the graph before running Dijkstra.
- **Consequence:** Eliminates the risk of sending wheelchair users or people with strollers up stairways. If no step-free route exists, the engine returns `success: false` with actionable guidance rather than a false path.

---

## ADR-002: TinyFish AI Web Agent Role Boundary

- **Status:** Accepted
- **Context:** TinyFish provides search and fetch APIs for AI web agents. We need to decide whether TinyFish computes routes or provides supplementary evidence.
- **Decision:** Route computation is strictly performed by our local deterministic graph engine. TinyFish Search and Fetch APIs are used exclusively as a web research sidecar to fetch and summarize real-world accessibility citations and visitor reports.
- **Consequence:** Sub-millisecond routing response times, offline-capable route calculations, zero hallucination of paths, and enhanced user trust through verified citations.

---

## ADR-003: Selection of Delhi High Court as Flagship Prototype

- **Status:** Accepted
- **Context:** The original hackathon concept used IIIT Delhi, but the project has evolved to address high-stakes real-world civic environments.
- **Decision:** Pilot AccessRoute AI on the Delhi High Court complex (Sher Shah Road), which blends historic heritage blocks (Old Building) with modern universal-access construction (C Block and S Block).
- **Consequence:** Provides immediate real-world utility for advocates, litigants, senior citizens, and people with disabilities attending court hearings.

---

## ADR-004: Editorial Visual System & Color Palette

- **Status:** Accepted
- **Context:** Accessible tools often suffer from looking like generic AI demos or clinical utilities.
- **Decision:** Adopt an editorial judicial theme: Mocha Brown (`#6F4E37`), Platinum Silver (`#E5E4E2`), and Pale Lavender (`#E6E0F0`), styled with Playfair Display headings, Inter body typography, glassmorphism, and W3C AA contrast compliance.
- **Consequence:** Professional civic feel, high trust, distinct visual identity.
