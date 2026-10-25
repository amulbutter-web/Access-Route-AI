# Shared contracts

- Person 2 owns the route API contract and must expose a source-backed route result.
- Person 3 owns stable `edge_id` values and graph geometry.
- Person 4 writes `edge_availability` overlays and invalidates Redis keys listed in `services/ingestion/app/storage.py`.
- Person 1 displays uncertainty; it must not convert `PENDING`, `STALE`, `UNKNOWN`, or `FAILED` into accessibility claims.

## Files
- `types.ts` — canonical system-wide TypeScript types (moved here from the former architecture folder).
