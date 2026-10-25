# Multi-Agent Coordination Specification — AccessRoute AI

> **Person 2: Architecture & System Design**
> **Project:** AccessRoute AI (Delhi High Court Campus Prototype)

---

## 1. Multi-Agent Ecosystem Architecture

AccessRoute AI uses a 4-agent division of responsibilities, mirroring team competencies and minimizing runtime coupling:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AccessRoute AI Multi-Agent Mesh                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   Person 1       │          │   Person 2       │          │   Person 3       │
│   Frontend       │ ◄──────► │   Architecture   │ ◄──────► │   Spatial Data   │
│   Agent          │          │   & Contracts    │          │   & Routing      │
│                  │          │                  │          │                  │
│ • UI / UX        │          │ • Data schemas   │          │ • Graph models   │
│ • Interactive Map│          │ • API interfaces │          │ • Step-free logic│
│ • Accessibility  │          │ • Security guard │          │ • Verification   │
└──────────────────┘          └──────────────────┘          └──────────────────┘
        │                              ▲                              ▲
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       ▼
                              ┌──────────────────┐
                              │   Person 4       │
                              │   Backend &      │
                              │   TinyFish Agent │
                              │                  │
                              │ • Express Engine │
                              │ • TinyFish Search│
                              │ • Security & QA  │
                              └──────────────────┘
```

---

## 2. Agent Roles and Contractual Boundaries

| Agent | Core Mandate | Inputs | Outputs | External Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **Person 1 (Frontend)** | Accessible, responsive, non-AI-looking UI | Locations list, Route results, Evidence objects | User intent (`from`, `to`, `requireStepFree`) | React, Vite, Leaflet, Inter/Playfair Fonts |
| **Person 2 (Architecture)** | Protocols, type definitions, ADRs, compliance | System goals, accessibility standards | Type definitions, API contracts, ADRs | W3C WAI-ARIA, WCAG 2.1 AA |
| **Person 3 (Spatial & Routing)**| Campus graph topology, step-free path algorithms | Delhi High Court geometry, physical audits | `campus-nodes.json`, `campus-edges.json`, Dijkstra engine | Network graph theory, DHC campus records |
| **Person 4 (Backend & TinyFish)**| Service endpoints, evidence extraction, resilience | HTTP requests, TinyFish web intelligence | Structured JSON API responses, sanitized snippets | Express, Node.js, TinyFish Search & Fetch APIs |

---

## 3. TinyFish Agent Integration Safety Guardrails

TinyFish is used strictly as a **supplementary web evidence agent**:
1. **Never in critical routing loop:** Route computation runs purely locally in deterministic Dijkstra algorithm (sub-millisecond latency).
2. **Never accepts remote routing overrides:** TinyFish outputs cannot modify node or edge weights dynamically without human-in-the-loop review.
3. **Strict Content Sanitization:** All text scraped via TinyFish Search or Fetch is stripped of HTML tags, JavaScript event handlers, and malicious control characters before being served to Person 1.
4. **Graceful Fallback:** If TinyFish is unreachable, times out, or exceeds rate limits, Person 4 transparently serves local seed evidence with explicit `provider: "local_seed"` attribution.
