# API Contracts Specification — AccessRoute AI

> **Person 2: Architecture & System Design**
> Shared Contract between Person 1 (Frontend), Person 3 (Routing Engine), and Person 4 (Backend)

---

## Base URL
- Local Development: `http://localhost:3001`
- Frontend Proxy: `/api/*` mapped to `http://localhost:3001/api/*`

---

## 1. Standard Response Envelope

All API endpoints return JSON conforming to the following generic contract:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta: {
    timestamp: string;      // ISO 8601 string
    requestId: string;      // Traceable UUID/slug
    duration?: number;      // Milliseconds taken
    provider?: string;      // Backend engine/service tag
    cached?: boolean;       // Cache status
  };
}
```

---

## 2. Endpoints

### `GET /api/locations`
Returns all selectable campus locations (buildings and entrances). Junctions are excluded.

**Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "main-gate",
      "name": "Delhi High Court Main Gate (Gate No. 1)",
      "shortName": "Main Gate",
      "type": "entrance",
      "accessibilityNotes": "Ground level entry with security checkpoint; vehicle drop-off area nearby"
    },
    {
      "id": "c-block",
      "name": "New Courts Block (C Block)",
      "shortName": "C Block",
      "type": "building",
      "accessibilityNotes": "Modern construction with ramp access at ground level; elevators to upper floors reported available"
    }
  ],
  "meta": {
    "timestamp": "2026-10-24T13:40:00.000Z",
    "requestId": "req_loc_abc123"
  }
}
```

---

### `POST /api/route`
Computes an optimal path between two nodes.

**Request Body:**
```json
{
  "from": "main-gate",
  "to": "c-block",
  "requireStepFree": true
}
```

**Response `200 OK` (Route Found):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "route": [
      {
        "from": {
          "id": "main-gate",
          "name": "Delhi High Court Main Gate (Gate No. 1)",
          "shortName": "Main Gate",
          "lat": 28.6328,
          "lng": 77.2405,
          "type": "entrance"
        },
        "to": {
          "id": "junction-central",
          "name": "Central Courtyard Junction",
          "shortName": "Central Junction",
          "lat": 28.6330,
          "lng": 77.2412,
          "type": "junction"
        },
        "edge": {
          "id": "e-maingate-junction-central",
          "distanceMeters": 100,
          "accessibilityStatus": "verified_step_free",
          "pathType": "sidewalk",
          "surface": "paved"
        },
        "instruction": "Walk toward Central Courtyard Junction"
      }
    ],
    "totalDistanceMeters": 215,
    "estimatedWalkingMinutes": 3,
    "accessibilitySummary": {
      "allVerifiedStepFree": true,
      "hasUnknownSegments": false,
      "hasReportedOnlySegments": false,
      "unknownSegmentCount": 0,
      "reportedOnlySegmentCount": 0,
      "statusBreakdown": {
        "verified_step_free": 3,
        "reported_step_free": 0,
        "not_step_free": 0,
        "unknown": 0
      }
    },
    "textDirections": [
      "Start at Delhi High Court Main Gate (Gate No. 1).",
      "1. Walk 100m along the sidewalk toward Central Courtyard Junction.",
      "2. Walk 70m along the sidewalk toward North Corridor Junction.",
      "3. Walk 45m along the ramp toward New Courts Block (C Block).",
      "Arrive at New Courts Block (C Block)."
    ],
    "warnings": [],
    "computedAt": "2026-10-24T13:40:00.000Z"
  },
  "meta": {
    "timestamp": "2026-10-24T13:40:00.000Z",
    "requestId": "req_route_xyz789"
  }
}
```

---

### `GET /api/evidence/:locationId`
Retrieves live or cached supplementary web evidence scraped via TinyFish.

**Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "query": "Accessibility info for C Block Delhi High Court",
    "locationName": "New Courts Block (C Block)",
    "sources": [
      {
        "title": "Delhi High Court 'C' Block by Design Forum International - Archello",
        "url": "https://archello.com/project/delhi-high-court-c-block",
        "snippet": "Universal accessibility features including ramp access at ground level, braille signage, and dedicated elevators.",
        "siteName": "Archello",
        "relevanceScore": 0.95,
        "retrievedAt": "2024-10-01T00:00:00Z"
      }
    ],
    "summary": "Universal accessibility features confirmed in C Block architectural specifications.",
    "confidence": "high",
    "retrievedAt": "2026-10-24T13:40:00.000Z",
    "provider": "tinyfish_search",
    "isCached": true,
    "cacheAge": 42000
  },
  "meta": {
    "timestamp": "2026-10-24T13:40:00.000Z",
    "requestId": "req_ev_456"
  }
}
```
