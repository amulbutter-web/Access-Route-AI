# API Contracts — AccessRoute AI

> Shared contract between Person 1 (Frontend) and Person 4 (Backend)

## Base URL

Development: `http://localhost:3001`

## Common Response Envelope

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Optional technical details (dev only)"
  },
  "meta": {
    "timestamp": "2024-10-24T12:00:00.000Z",
    "requestId": "req_abc123_def456",
    "duration": 42,
    "provider": "tinyfish_search",
    "cached": false
  }
}
```

## Endpoints

### GET /api/health/ping

**Response:** `200`
```json
{ "status": "ok", "timestamp": "..." }
```

### GET /api/health

**Response:** `200` or `503`
```json
{
  "success": true,
  "data": {
    "status": "healthy | degraded | unhealthy",
    "uptime": 3600,
    "timestamp": "...",
    "services": {
      "routeEngine": { "status": "up", "message": "..." },
      "tinyfish": { "status": "up | down | degraded", "latencyMs": 200 },
      "campusData": { "status": "up", "message": "14 nodes, 17 edges loaded" }
    },
    "version": "1.0.0"
  }
}
```

### GET /api/locations

**Response:** `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "main-gate",
      "name": "IIIT Delhi Main Gate",
      "shortName": "Main Gate",
      "type": "entrance",
      "accessibilityNotes": "Ground level entry, accessible for wheelchairs"
    }
  ]
}
```

### GET /api/locations/:id

**Response:** `200` | `400` | `404`

### POST /api/route

**Request:**
```json
{
  "from": "main-gate",
  "to": "library",
  "requireStepFree": true
}
```

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "success": true,
    "route": [
      {
        "from": { "id": "main-gate", "name": "...", "lat": 28.5459, "lng": 77.2732, ... },
        "to": { "id": "junction-central", "name": "...", ... },
        "edge": {
          "id": "e-maingate-junction-central",
          "distanceMeters": 120,
          "accessibilityStatus": "verified_step_free",
          "pathType": "sidewalk",
          ...
        },
        "instruction": "Walk toward Central Walkway Junction"
      }
    ],
    "totalDistanceMeters": 160,
    "estimatedWalkingMinutes": 3,
    "accessibilitySummary": {
      "allVerifiedStepFree": true,
      "hasUnknownSegments": false,
      "hasReportedOnlySegments": false,
      "unknownSegmentCount": 0,
      "reportedOnlySegmentCount": 0,
      "statusBreakdown": {
        "verified_step_free": 2,
        "reported_step_free": 0,
        "not_step_free": 0,
        "unknown": 0
      }
    },
    "textDirections": [
      "Start at IIIT Delhi Main Gate.",
      "1. Walk 120m along the sidewalk toward Central Walkway Junction.",
      "2. Walk 40m along the sidewalk toward IIIT Delhi Library.",
      "Arrive at IIIT Delhi Library."
    ],
    "warnings": [],
    "computedAt": "2024-10-24T12:00:00.000Z"
  }
}
```

**No qualifying route response (still 200):**
```json
{
  "success": true,
  "data": {
    "success": false,
    "route": null,
    "totalDistanceMeters": 0,
    "textDirections": ["No step-free route exists between ..."],
    "warnings": ["No step-free route exists ..."]
  }
}
```

### GET /api/evidence/:locationId

**Response:** `200`
```json
{
  "success": true,
  "data": {
    "query": "Accessibility info for IIIT Delhi Library",
    "locationName": "IIIT Delhi Library",
    "sources": [
      {
        "title": "Page Title",
        "url": "https://...",
        "snippet": "Extracted relevant text...",
        "siteName": "example.com",
        "relevanceScore": 0.8,
        "retrievedAt": "..."
      }
    ],
    "summary": "Found 3 web sources...",
    "confidence": "low",
    "retrievedAt": "...",
    "provider": "tinyfish_search",
    "isCached": false,
    "cacheAge": null
  },
  "meta": {
    "provider": "tinyfish_search",
    "cached": false
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `INVALID_INPUT` | 400 | Missing or malformed request parameters |
| `NOT_FOUND` | 404 | Location or resource not found |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Content-Type is not application/json |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `ROUTE_CALCULATION_ERROR` | 500 | Internal route engine error |
| `EVIDENCE_LOOKUP_ERROR` | 500 | TinyFish or evidence service error |
| `DATA_LOAD_ERROR` | 500 | Campus data loading failure |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error |

## Rate Limiting Headers

All responses include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1729785600
```
