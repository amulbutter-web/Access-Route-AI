# AccessRoute AI

**Evidence-first, step-free navigation for the Delhi High Court complex (Sher Shah Road, New Delhi).**

AccessRoute AI plans routes for wheelchair users and anyone who needs step-free access. It never silently falls back to a route with stairs, shows how confident it is in each accessibility claim, and attaches live web citations fetched server-side with [TinyFish](https://www.tinyfish.ai/).

## Architecture

```
┌────────────────────┐   /api/*   ┌──────────────────────────────┐
│  frontend/         │ ─────────► │  backend/  (Express, :3001)  │
│  React + Leaflet   │            │  • Dijkstra route engine     │
│  Vite dev :5173    │ ◄───────── │  • Evidence service (TinyFish)│
└────────────────────┘            │  • Campus graph (data/*.json)│
                                  └──────────────────────────────┘

services/ingestion/  (FastAPI + Postgres + Redis) — standalone alert/ingestion service
```

## Repository layout

```
AccessRoute-AI/
├── frontend/              React 19 + TypeScript + Vite + Leaflet UI
├── backend/               Express API, routing engine, campus graph data, tests
│   ├── src/               routes/, services/, middleware/, utils/, types/
│   ├── data/              campus-nodes.json, campus-edges.json, accessibility-sources.json
│   └── test/              Vitest unit & security tests
├── services/
│   └── ingestion/         Python/FastAPI TinyFish ingestion service (own Dockerfile + tests)
├── shared/                Canonical TypeScript types and cross-service contracts
├── docs/                  Architecture, API, product, backend, data & routing, ingestion docs
├── archive/               Earlier MapLibre frontend prototype (kept for reference)
├── .github/               CI workflow and PR template
├── docker-compose.yml             frontend + backend
├── docker-compose.ingestion.yml   ingestion service + Postgres/PostGIS + Redis
└── package.json           Root helper scripts
```

## Quick start

**Prerequisites:** Node.js 22+, a TinyFish API key.

```bash
# 1. Install both apps
npm run install:all

# 2. Configure the backend (the key stays server-side)
cp backend/.env.example backend/.env       # then set TINYFISH_API_KEY

# 3. Run (two terminals)
npm run dev:backend                        # http://localhost:3001
npm run dev:frontend                       # http://localhost:5173  (proxies /api to :3001)
```

Without Node on the host, use Docker instead:

```bash
cp .env.example .env                       # set TINYFISH_API_KEY
docker compose up --build                  # http://localhost:8080
```

## Useful commands

| Command | What it does |
|---|---|
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run dev:backend` / `npm run dev:frontend` | Start each dev server |
| `npm test` | Backend unit tests (43 tests: routing, sanitization, data integrity) |
| `npm run typecheck` | Type-check backend and frontend |
| `npm run build` | Production build of both apps |
| `npm run docker:up` | Build and run frontend + backend in Docker |
| `npm run docker:ingestion` | Run the ingestion stack (needs `.env`) |

Ingestion service tests: `cd services/ingestion && pip install -r requirements.txt && python -m pytest`.

## API (backend)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check (engine, data, TinyFish) |
| `GET` | `/api/health/ping` | Liveness check |
| `GET` | `/api/locations` | Selectable campus locations |
| `POST` | `/api/route` | Compute a route (`{ from, to, requireStepFree }`) |
| `GET` | `/api/evidence/:locationId` | Web accessibility evidence for a location |

Full contracts: [`docs/api/`](docs/api/).

## Documentation

Start at [`docs/README.md`](docs/README.md). Highlights: [architecture](docs/architecture/ARCHITECTURE.md), [routing policy](docs/data-and-routing/ROUTING_POLICY.md), [PRD](docs/product/PRD.md), [deployment](docs/backend/DEPLOYMENT.md).

## Project status

- **Working app:** `frontend/` + `backend/` (the frontend's API client matches the backend's endpoints).
- **Standalone:** `services/ingestion/` is not yet connected to the Express backend, and it does not provide `/api/places` or `/api/route`. See [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).
- **Archived:** `archive/web-maplibre-preview/` expects a different API (`/api/places`, `startId`/`destinationId`) that no backend here implements.

## Security & privacy

- The TinyFish key lives only in the backend environment and is never sent to the browser.
- All `.env` files are gitignored; only `*.env.example` templates are committed.
- External text is sanitized (HTML/JS stripped) before it reaches the UI; the API is rate limited and sends security headers.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under the [MIT License](LICENSE).
