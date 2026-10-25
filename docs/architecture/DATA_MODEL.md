# Data Models & Graph Topology Specification

> **Person 2: Architecture & System Design**
> **Specification Version:** 2.1 (Delhi High Court Edition)

---

## 1. Campus Node Schema

A node represents an entrance, building, landmark, or walkway intersection on campus.

```typescript
export interface CampusNode {
  id: string;               // Unique kebab-case slug, e.g. "old-building", "main-gate"
  name: string;             // Human-readable title, e.g. "Main Court Building (Old Block)"
  shortName: string;        // Abbreviated label for mobile UI, e.g. "Old Building"
  lat: number;              // WGS84 latitude coordinate
  lng: number;              // WGS84 longitude coordinate
  type: 'building' | 'entrance' | 'junction' | 'landmark';
  floor?: number;           // 0 for ground level
  description?: string;     // Purpose & department info
  accessibilityNotes?: string; // Information on ramps, elevators, restrooms
}
```

---

## 2. Campus Edge Schema

An edge represents a navigable connection between two nodes. Edges are undirected unless physically constrained.

```typescript
export interface CampusEdge {
  id: string;               // Unique identifier, e.g. "e-maingate-junction-central"
  from: string;             // Starting node id
  to: string;               // Ending node id
  distanceMeters: number;   // Metric distance in meters
  accessibilityStatus: AccessibilityStatus;
  pathType: 'sidewalk' | 'corridor' | 'ramp' | 'elevator' | 'stairs' | 'outdoor_path' | 'crossing';
  surface?: 'paved' | 'unpaved' | 'tiled' | 'concrete' | 'unknown';
  sourceEvidence?: string;  // Citation or source note
  lastVerified?: string;    // ISO 8601 date (YYYY-MM-DD)
  notes?: string;           // Special caution or ramp slope guidance
}
```

---

## 3. Accessibility Taxonomy

| Status | Code | Graph Engine Rule | UI Presentation |
| :--- | :--- | :--- | :--- |
| **Verified Step-Free** | `verified_step_free` | Traversed with base distance weight. | Solid green indicator with checkmark. |
| **Reported Step-Free** | `reported_step_free` | Traversed with 1.1x caution penalty. | Amber warning badge indicating self-reported data. |
| **Unknown Accessibility** | `unknown` | Traversed with 1.3x penalty; flags warnings. | Neutral gray badge with question mark. |
| **Not Step-Free (Stairs)** | `not_step_free` | **HARD PRUNED** if `requireStepFree=true`. Edge weight = $\infty$. | Red badge with cross symbol. |
