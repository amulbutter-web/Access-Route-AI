# Testing & Risks — AccessRoute AI

> Person 4 Ownership: Backend, TinyFish, Security, QA & Deployment

## Test Suite

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run check         # Typecheck + lint + test
```

### Test Files

| File | Tests | What It Covers |
|---|---|---|
| `test/route-engine.test.ts` | Route calculation | Valid routes, step-free enforcement, no-route cases, edge cases |
| `test/sanitize.test.ts` | Input validation | String sanitization, node ID validation, URL validation, XSS prevention |
| `test/campus-data.test.ts` | Data loading | Node/edge validation, duplicate detection, referential integrity |

### Route Engine Test Coverage

- ✅ Valid route between connected nodes
- ✅ Step-free route avoids stairs entirely (HARD EXCLUSION, not penalty)
- ✅ Step-free route finds longer alternative via ramp when stairs are shorter
- ✅ Unknown-status edges are included but flagged with warnings
- ✅ Reported-only edges are included but flagged
- ✅ Same start/destination returns empty route
- ✅ Invalid start node returns error
- ✅ Invalid destination node returns error
- ✅ ALL location pairs: no stairs edge EVER appears in step-free route
- ✅ Text directions include start, numbered steps, and arrival
- ✅ Accessibility summary correctly counts status breakdown

### Security Test Coverage

- ✅ Empty/null/non-string input rejection
- ✅ Overly long string rejection
- ✅ Control character removal
- ✅ Node ID format validation (only lowercase alphanumeric + hyphens + underscores)
- ✅ Path traversal attack prevention (../)
- ✅ Script injection prevention (<script>)
- ✅ HTML tag stripping from external content
- ✅ JavaScript: protocol removal
- ✅ Event handler pattern removal (onclick=, onerror=, etc.)
- ✅ URL protocol validation (only http/https)

### Data Integrity Test Coverage

- ✅ All nodes have required fields with correct types
- ✅ All edges reference valid node IDs
- ✅ No duplicate node IDs
- ✅ No duplicate edge IDs
- ✅ All four accessibility statuses represented in test data
- ✅ Selectable locations filter excludes junctions
- ✅ Node lookup by ID works correctly

## Known Risks

### Critical Risks

| ID | Risk | Mitigation |
|---|---|---|
| R-01 | TinyFish API key exposed in frontend | Key is server-side only, CORS blocks direct API calls from browser |
| R-02 | Route includes stairs when step-free requested | Hard exclusion in graph builder — stairs edges removed, not penalized |
| R-03 | `.env` committed to Git | `.gitignore` excludes `.env`; `.env.example` has placeholders only |
| R-04 | XSS via TinyFish content | All external content sanitized (HTML stripped, JS patterns removed) |
| R-05 | Stale cached evidence displayed as fresh | Every response includes `provider`, `isCached`, `cacheAge` metadata |

### Moderate Risks

| ID | Risk | Mitigation |
|---|---|---|
| R-06 | TinyFish rate limit exhausted | Conservative client-side rate tracking below official limits |
| R-07 | TinyFish timeout causes slow response | AbortController with configurable timeout; fallback to local seed |
| R-08 | Campus data file corrupted | Full validation on load with descriptive error messages |
| R-09 | Approximate coordinates mislead users | Data disclaimer in accessibility-sources.json; NOT surveyed data |
| R-10 | Unknown accessibility shown as safe | Unknown edges flagged with explicit warnings in route and UI |

### Deployment Risks

| ID | Risk | Mitigation |
|---|---|---|
| R-11 | CORS misconfiguration blocks frontend | Configurable CORS_ORIGIN; health endpoint for verification |
| R-12 | Port conflict on deployment | Configurable PORT via environment variable |
| R-13 | Missing environment variables crash server | Config loader validates all required vars at startup |
| R-14 | Production exposes stack traces | Error handler checks NODE_ENV; hides details in production |

## QA Checklist

- [ ] `npm run check` passes (typecheck + lint + tests)
- [ ] Health endpoint returns 200: `GET /api/health/ping`
- [ ] Locations endpoint returns all buildings: `GET /api/locations`
- [ ] Route calculation works: `POST /api/route` with valid from/to
- [ ] Step-free route avoids stairs: verify with sports-complex route
- [ ] No-route returns clear message (not a 500 error)
- [ ] Evidence endpoint returns data: `GET /api/evidence/library`
- [ ] TinyFish evidence labeled correctly (live vs cached vs local)
- [ ] Invalid input returns 400 with descriptive error
- [ ] Rate limiting returns 429 when exceeded
- [ ] `.env` is NOT in git tracked files
- [ ] No API key appears in any source file
- [ ] Server starts cleanly from `npm run dev`
- [ ] Server builds cleanly from `npm run build && npm start`
