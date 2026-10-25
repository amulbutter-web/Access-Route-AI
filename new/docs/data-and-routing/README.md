# Spatial Data & Routing Engine

Campus graph data for the Delhi High Court complex, data verification audits, and the Dijkstra routing engine. The code and data live in `backend/`; this folder holds the policy documents.

## Where things are
- `backend/data/campus-nodes.json` — 16 campus nodes (court buildings, chambers, gates, junctions).
- `backend/data/campus-edges.json` — 21 connected edges with accessibility classifications.
- `backend/data/accessibility-sources.json` — Citations, disclaimers, and audit metadata.
- `backend/src/services/route-engine.ts` — Dijkstra route calculator with hard step-free constraints.
- `backend/src/services/campus-data.ts` — In-memory graph indexer and referential validator.
- `backend/test/` — Unit tests for data integrity and pathfinding.
- [`ROUTING_POLICY.md`](ROUTING_POLICY.md) — Dijkstra weighting and constraint specifications.
- [`DATA_VERIFICATION.md`](DATA_VERIFICATION.md) — Campus audit and verification criteria.
