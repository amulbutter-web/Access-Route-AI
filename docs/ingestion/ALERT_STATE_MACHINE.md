# Alert state machine

`FETCHED -> NORMALIZED -> PENDING | MATCHED -> SOURCE_VERIFIED -> APPLIED`

- `PENDING`: unknown status, no exact entity mapping, or insufficient evidence. It cannot change routing.
- `MATCHED`: exact registered entity plus recognizable status.
- `SOURCE_VERIFIED`: only the source-backed exact match needed for a lift-down hard exclusion.
- `APPLIED`: a current (`FRESH`) verified lift-down disabled its exact edge and invalidated dependent route keys.
- `STALE`, `UNKNOWN`, and `FAILED` are freshness states, not availability claims. A stale “working” alert never certifies accessibility.
- Crowd reports start `PENDING`; two distinct reporters move a report to `CROWD_CONFIRMED`. A policy-approved multi-user confirmation/review is required before a major penalty. They do not share the TinyFish source-verification path.
