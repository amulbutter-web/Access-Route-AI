# Routing Policy & Algorithm Specification

> **Person 3: Spatial Data & Routing Engine**
> **Scope:** Delhi High Court Complex

---

## 1. Algorithm Overview

AccessRoute AI uses **Dijkstra's Shortest Path Algorithm** with **strict domain-specific accessibility constraints**.

Routing is performed over a weighted graph $G = (V, E)$, where $V$ is the set of campus nodes (buildings, gates, courtyards, corridors) and $E$ is the set of edges.

---

## 2. Weighting & Step-Free Constraint Function

Given an edge $e \in E$ between nodes $u$ and $v$ with physical distance $d(e)$:

### Case A: `requireStepFree = true` (Default Accessibility Mode)
1. **Hard Inaccessibility Filter:**
   $$\text{If } e.\text{accessibilityStatus} = \text{'not\_step\_free'} \lor e.\text{pathType} = \text{'stairs'}: \quad w(e) = \infty$$
   The edge is excluded from the adjacency list before search execution.
2. **Confidence Weight Penalties (Soft Guidance):**
   $$w(e) = \begin{cases} 
   d(e) \times 1.0 & \text{if } e.\text{accessibilityStatus} = \text{'verified\_step\_free'} \\
   d(e) \times 1.1 & \text{if } e.\text{accessibilityStatus} = \text{'reported\_step\_free'} \\
   d(e) \times 1.3 & \text{if } e.\text{accessibilityStatus} = \text{'unknown'}
   \end{cases}$$

### Case B: `requireStepFree = false` (Standard Pedestrian Mode)
All edges are navigable:
$$w(e) = \begin{cases}
d(e) \times 1.0 & \text{if } e.\text{accessibilityStatus} \in \{\text{'verified\_step\_free'}, \text{'reported\_step\_free'}\} \\
d(e) \times 1.15 & \text{if } e.\text{accessibilityStatus} = \text{'unknown'} \\
d(e) \times 1.25 & \text{if } e.\text{accessibilityStatus} = \text{'not\_step\_free'}
\end{cases}$$

---

## 3. Direction Generation & Distance Estimation

Walking speed is modeled at a conservative accessible pace:
- **Speed:** $50 \text{ meters/minute}$ ($3 \text{ km/h}$), suitable for manual wheelchair propulsion, crutches, or assisted walking.
- **Estimated Time:** $\lceil \text{totalDistanceMeters} / 50 \rceil \text{ minutes}$ (minimum 1 minute).

Turn-by-turn text instructions are generated deterministically:
1. `Start at {startNode.name}.`
2. `[Step N]: Walk {edge.distanceMeters}m along the {edge.pathType} toward {nextNode.name}.`
3. `Arrive at {destNode.name}.`
