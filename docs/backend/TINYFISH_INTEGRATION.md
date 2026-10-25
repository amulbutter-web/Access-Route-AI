# TinyFish Integration — AccessRoute AI

> Person 4 Ownership: Backend, TinyFish, Security, QA & Deployment

## Overview

TinyFish is a **web infrastructure platform for AI agents** — it is NOT an LLM/chat API. AccessRoute AI uses TinyFish to retrieve supplementary accessibility evidence about campus locations from the public web.

**TinyFish does NOT:**
- Calculate routes
- Certify physical accessibility
- Replace the local route engine
- Make navigation decisions

**TinyFish DOES:**
- Search the web for accessibility information (Search API)
- Extract clean content from web pages (Fetch API)
- Return structured results for evidence display

## API Endpoints Used

### 1. Search API (FREE)
- **Endpoint:** `GET https://api.search.tinyfish.ai`
- **Auth:** `X-API-Key` header
- **Purpose:** Search for wheelchair accessibility, ramp access, elevator info for IIIT Delhi locations
- **Rate Limit:** 30 req/min, 500 req/hr
- **Parameters:**
  - `query` (required): Search query string
  - `purpose` (optional): Intent statement for better results
  - `location` (optional): Country code (we use `IN`)
  - `language` (optional): Language code (we use `en`)
- **Response:** `{ query, total_results, page, results: [{ position, site_name, title, snippet, url }] }`

### 2. Fetch API (FREE)
- **Endpoint:** `POST https://api.fetch.tinyfish.ai`
- **Auth:** `X-API-Key` header
- **Purpose:** Extract detailed accessibility content from specific URLs
- **Rate Limit:** 150 URLs/min, 1000 URLs/day
- **Request Body:**
  - `urls` (required): Array of URLs (max 10)
  - `format` (optional): `"markdown"` | `"html"` | `"json"`
  - `purpose` (optional): Context for extraction
- **Response:** `{ results: [{ url, final_url, title, description, language, format, text }], errors: [] }`

## Architecture

```
Frontend → POST /api/evidence/:locationId → Backend (Express)
                                               ↓
                                        EvidenceService
                                         ↓         ↓
                                  TinyFishClient  Local Seed
                                   ↓        ↓
                              Search API  Fetch API
                           (tinyfish.ai) (tinyfish.ai)
```

## Security Boundaries

1. **API key is server-side ONLY** — stored in `.env`, loaded via `process.env`, NEVER sent to frontend
2. **All external content is sanitized** — HTML stripped, JavaScript patterns removed, length limited
3. **Rate limiting is enforced** — both server-side (Express middleware) and client-side (TinyFish rate tracking)
4. **Timeouts are enforced** — Search: 8s, Fetch: 12s (configurable)
5. **Cache prevents redundant requests** — In-memory TTL cache (default 5 minutes)

## Failure Handling

| Failure Mode | Detection | Recovery |
|---|---|---|
| TinyFish timeout | AbortController signal | Return local seed evidence |
| TinyFish HTTP error | Non-200 status | Return local seed evidence |
| Rate limit exceeded | Counter tracking | Return cached or local seed |
| Malformed response | Schema validation | Return error with explanation |
| Network unavailable | Fetch throws | Return local seed evidence |
| Empty results | Zero-length array | Return local seed with "no web data" note |

**Core routing ALWAYS works** — TinyFish failure only affects supplementary evidence, never route calculation.

## Configuration

Environment variables (`.env`):
```
TINYFISH_API_KEY=your_key_here
TINYFISH_SEARCH_TIMEOUT_MS=8000
TINYFISH_FETCH_TIMEOUT_MS=12000
TINYFISH_MAX_RETRIES=2
TINYFISH_CACHE_TTL_MS=300000
```

## Evidence Labeling

Every evidence response includes:
- `provider`: `"tinyfish_search"` | `"tinyfish_fetch"` | `"local_cache"` | `"local_seed"`
- `isCached`: boolean
- `cacheAge`: milliseconds (when cached)
- `confidence`: `"high"` | `"medium"` | `"low"` | `"none"`

The frontend MUST display the source type so users know whether evidence is live, cached, or local.

## Source Files

- `src/services/tinyfish-client.ts` — HTTP client with auth, retry, cache, rate limits
- `src/services/evidence-service.ts` — Orchestration: search → normalize → fallback
- `src/routes/evidence.ts` — API handlers for `/api/evidence`
- `src/config.ts` — TinyFish configuration loading

## Verified vs Unverified

- API endpoint URLs: **Verified** from official TinyFish documentation
- Authentication method (`X-API-Key`): **Verified**
- Rate limits (30/min search, 150 URLs/min fetch): **Verified** from docs
- Response schemas: **Verified** from docs
- Actual API behavior with our specific key: **REQUIRES LIVE TESTING** during hackathon
