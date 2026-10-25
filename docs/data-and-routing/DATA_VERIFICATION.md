# Campus Data Verification & Audit Methodology

> **Person 3: Spatial Data & Routing Engine**
> **Focus:** Delhi High Court Complex Graph Audit

---

## 1. Data Integrity Requirements

Every edge and node in the Delhi High Court dataset must satisfy strict referential integrity rules validated by unit tests:

1. **Referential Completeness:** Every `from` and `to` ID in `campus-edges.json` must resolve to a valid node in `campus-nodes.json`.
2. **Uniqueness:** No duplicate node IDs or edge IDs are permitted.
3. **Physical Distance Bounds:** Every edge distance must be strictly $> 0$ meters.
4. **Bidirectional Symmetry:** All pedestrian paths are navigable bidirectionally unless specific one-way security gates apply.
5. **Categorical Precision:** Node types must be strictly one of `['building', 'entrance', 'junction', 'landmark']`.

---

## 2. Verification Taxonomy & Audit Levels

| Status | Verification Standard | Evidence Requirement | Audit Recency |
| :--- | :--- | :--- | :--- |
| **`verified_step_free`** | Physical ramp audit or architectural blueprint inspection confirming slope $\le 1:12$ and zero steps. | Architectural blueprints (DFI), High Court Accessibility Audit, or physical walkthrough. | Within last 12 months. |
| **`reported_step_free`** | Staff, advocate, or visitor report of step-free passage without formal slope measurement. | Delhi High Court Citizen's Charter, staff guidance, advocate feedback. | Unverified timestamp. |
| **`not_step_free`** | Flight of stairs, kerb without dropped curb, or steep barrier observed. | Photographic evidence or physical site confirmation of steps. | Permanent structural property. |
| **`unknown`** | Unaudited path or newly renovated segment without accessibility reports. | None (treated as cautionary). | Pending audit. |

---

## 3. Real-world Delhi High Court Data Sources

- **Delhi High Court Official Portal:** Universal accessibility statements and public facilities directory (`delhihighcourt.nic.in/web/accessibility-statement`).
- **Architectural Reference (C Block):** Design Forum International (DFI) documentation for C Block universal accessibility ramps, elevators, and courtrooms.
- **Visitor Parking & Security Protocol:** DHC Citizen's Charter and Registry filing protocols.
