# TinyFish ingestion

Verified 2026-10-24 against TinyFish official documentation: `POST https://api.fetch.tinyfish.ai` accepts JSON containing `urls`; requests use `X-API-Key`. This service uses Fetch because a registered public source URL is already known. `POST /tinyfish/extract` is an internal AccessRoute endpoint, not a vendor endpoint.

## Operational contract

- Put the credential only in `TINYFISH_API_KEY` outside Git. Requests have a 4-second connect and 12-second total timeout.
- Temporary provider errors (429/5xx) retry up to three times with capped exponential backoff (250ms, 500ms); all other provider failures enter the circuit-breaker path.
- Set `INGESTION_SCHEDULER_ENABLED=true` to run the approved source every 15 minutes. Keep one API worker replica for this development scheduler; production should replace it with a deployment scheduler and a Redis/Postgres advisory lock. The in-process lock prevents overlap in local mode.
- Sources are allowlisted in `backend/app/source_registry.py`. The shipped entry is a candidate metro scenario and intentionally separate from the IIITD campus pilot.
- A result is FRESH for 15 minutes. Retention may be four hours, but retained data becomes STALE; unavailable provider data is FAILED without a retained record or STALE with one.
- Only a source-verified, current, exact entity match for a lift-down notice can disable the mapped edge. Text that merely says “a lift” remains PENDING.
- Event hashes enforce idempotency. Postgres persists alerts, an `edge_availability` overlay and graph version. A confirmed change invalidates Redis keys from `accessroute:edge:{edge_id}:profile:{profile}:route_keys`, then increments the Redis graph version. Ishaan's route cache must add each generated key to that index.
- `POST /api/barrier-reports` creates only pending evidence. A second, distinct reporter can use `POST /api/barrier-reports/{id}/confirm`; two reporters make it `CROWD_CONFIRMED`, but a routing penalty still needs the agreed barrier policy.

See [the integration handoff](INGESTION_HANDOFF.md) for the route-cache index, PostGIS overlay, and UI fields.

## Running locally

```powershell
$env:TINYFISH_API_KEY = "<your key>"
$env:INGESTION_ADMIN_TOKEN = "<local admin token>"
docker compose up --build
```

The response contains only normalized alert state, never the provider raw payload or API key.

## Provider references

- [TinyFish Fetch API](https://docs.tinyfish.ai/fetch-api/index.md)
- [TinyFish Fetch reference](https://docs.tinyfish.ai/fetch-api/reference.md)

