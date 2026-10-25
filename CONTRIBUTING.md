# Contributing

## Setup
See the [Quick start](README.md#quick-start). Node.js 22+; Python 3.13 only if you touch `services/ingestion`.

## Workflow
1. Branch from `main`: `feat/<topic>`, `fix/<topic>` or `docs/<topic>`.
2. Keep changes inside one area (`frontend/`, `backend/`, `services/ingestion/`, `docs/`) where possible.
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `feat: …`, `fix: …`, `docs: …`, `chore: …`, `test: …`.
4. Open a pull request using the template; CI must pass.

## Before you push
```bash
npm test                                   # backend tests
npm run typecheck                          # backend + frontend types
npm --prefix frontend run build            # frontend production build
cd services/ingestion && python -m pytest  # only if you changed the ingestion service
```

## Ground rules
- **Never commit secrets.** `.env` files are ignored; add new variables to the matching `.env.example` with an empty or placeholder value.
- **Never call TinyFish or other third-party APIs from the browser.** All external calls go through the backend.
- **Never guess accessibility.** Unknown, pending or stale data must be shown as such, not as step-free.
- Changing an API shape? Update `shared/types.ts` and `docs/api/` in the same PR.
