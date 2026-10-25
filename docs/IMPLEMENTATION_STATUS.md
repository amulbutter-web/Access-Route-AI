> **Note:** the repository was reorganised into `frontend/`, `backend/`, `services/ingestion/`, `shared/`, `docs/` and `archive/`. "Person N" below refers to workstream roles, not folders. The MapLibre shell described here now lives in `archive/web-maplibre-preview/`.

# Implementation status

## Implemented now

- Person 1 visual web shell with responsive evidence-first UI, generated 3D hero graphic, MapLibre 3D preview, accessible controls, lint and production build.
- Person 4 FastAPI TinyFish ingestion, source registry, retry/circuit breaker, Postgres persistence, Redis invalidation contract, scheduler option, crowd-report confirmation, tests, and internal API endpoints.
- Docker Compose definition for PostGIS, Redis, and the ingestion service.
- Git-ready folder ownership and shared contracts.

## Requires the assigned owner / verified data

- Person 2: `/api/places` and `/api/route`, hard-constraint route selection, and route-cache registration.
- Person 3: PostGIS/pgRouting graph, verified campus coordinates, stable edge IDs, source-backed edge attributes, and a verified map style/data source.
- Person 1: route geometry rendering once Person 3 provides it; the current 3D map is expressly marked a visual preview.

This separation is intentional. The project never fabricates campus paths, building coordinates, lift availability, or accessibility claims merely to make a demo appear complete.
