# System Architecture & Technical Specifications — AccessRoute AI

> **Person 2: Architecture & System Design**
> **Scope:** Delhi High Court Complex Accessible Navigation

---

## 1. System Overview

AccessRoute AI provides high-trust, step-free navigation across the historic and modern structures of the Delhi High Court complex. Unlike general map applications that often route mobility-impaired users through barriers (such as stairways, steep thresholds, or high curbs), AccessRoute AI implements **hard constraint exclusions** and **source-backed evidence tracing**.

### Core Tenets
1. **Zero Silent Fallback:** The engine will never suggest a route containing stairs when a step-free route is requested.
2. **Truth in Uncertainty:** Segments that are merely reported or unknown are visually flagged with caution states.
3. **Evidence-Backed Confidence:** Turn-by-turn directions are accompanied by real-world evidence retrieved via TinyFish AI web infrastructure.

---

## 2. Component Architecture

```
[ Web Browser ]
      │
      ▼  (HTTP/JSON via Vite proxy)
[ Express API Gateway - Port 3001 ]
      ├── Security Layer (Helmet-equivalent headers, CORS, sanitization)
      ├── Rate Limiter (Sliding window token bucket)
      ├── Route Service (Dijkstra algorithm with hard step-free filter)
      ├── Campus Data Service (In-memory indexed graph topology)
      └── Evidence Service
            ├── In-memory TTL Cache (5 minutes)
            ├── TinyFish Search Client (api.search.tinyfish.ai)
            ├── TinyFish Fetch Client (api.fetch.tinyfish.ai)
            └── Local Seed Evidence (High Court official charter & building audits)
```

---

## 3. Visual & Aesthetic Architecture

To ensure the product has a genuine, bespoke civic/editorial feel (avoiding generic AI vibes), the design is built on:
- **Palette:**
  - *Mocha Brown* (`#6F4E37`): Primary tone, signaling legal heritage and warmth.
  - *Platinum Silver* (`#E5E4E2`): Neutral structure, architectural panels, and borders.
  - *Pale Lavender* (`#E6E0F0`): Accessibility accents, badges, highlights, and focus rings.
- **Typography:**
  - Headings: *Playfair Display* (classic judicial editorial weight).
  - Body & Data: *Inter* (high-legibility grotesque sans-serif).
- **Depth & Surfaces:**
  - 24px blurred glassmorphism with subtle drop shadows.
  - No synthetic glowing neon gradients.
