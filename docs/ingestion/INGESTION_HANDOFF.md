# Person 4 integration handoff

## Contract for Ishaan (routing/API)

The internal trigger is `POST /tinyfish/extract`, protected with `X-Ingestion-Token`. The safe read model is `GET /api/ingestion/status`; never return TinyFish raw content to clients.

When a fresh source-verified outage is applied, Person 4 writes `edge_availability(edge_id, profile, enabled, source_event_key, changed_at)` and increments `graph_state.version`. The route query must treat `enabled=false` as a hard ineligibility, not a large numeric penalty.

Every route cache write must add its cache key to Redis set `accessroute:edge:{edge_id}:profile:{profile}:route_keys` for every edge used by that route. Ingestion deletes the indexed keys for affected profiles and increments `accessroute:graph_version`.

## Contract for Madhav (PostGIS)

Person 4 owns `transit_alerts`, `edge_availability`, `graph_state`, and `barrier_reports` tables (created by `PostgresRedisStore.initialize`). Madhav's graph schema remains authoritative for geometry and topology. Join the availability overlay by stable `edge_id`; no geometry or nearest-edge inference is permitted from alert text.

## Contract for Tanishk (UI)

Display `source_url`, `source_title`, `publisher`, `retrieved_at`, `effective_at`, `status`, `evidence_snippet`, `match_status`, `match_confidence`, `freshness`, and `verification_status`. `PENDING`, `UNKNOWN`, `STALE`, and `FAILED` must be visibly distinct from confirmed availability. A crowd report starts as `PENDING`; `CROWD_CONFIRMED` means two distinct reporter IDs confirmed it, not necessarily that a routing penalty has been approved.
