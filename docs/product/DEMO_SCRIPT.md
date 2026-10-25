# AccessRoute AI — Demo Script

**Owner:** Person 01 (with Person 04 — Integration, QA and Documentation)  
**Version:** 1.0  
**Date:** 2026-10-24  
**Duration:** ~4 minutes (core demo)

---

## Pre-Demo Checklist (Run 30 min before presenting)

- [ ] Backend is running and health endpoint returns 200.
- [ ] Frontend production build is deployed and accessible from the demo device.
- [ ] Map tiles load correctly.
- [ ] TinyFish credentials are set as environment variables (not in code).
- [ ] Demo route (Main Entrance → Library) returns a successful step-free route.
- [ ] Stale data scenario (if demoing) has a place with old verification date.
- [ ] No-route scenario (if demoing) confirmed to return the correct "no route" message.
- [ ] Demo device is fully charged; screen mirroring is tested.
- [ ] Browser console is cleared; no API keys visible.
- [ ] Browser zoom is set to 100%; font size is default.
- [ ] Team member knows how to trigger the fallback demo if live fails.

---

## Persona Setup

**Demo user:** Arjun — a first-year student at IIIT Delhi who uses a wheelchair. He needs to get from the campus main entrance to the library for a study session and wants to know the route avoids stairs.

---

## Script

### Opening (30 seconds)

> "Imagine you're a wheelchair user arriving at IIIT Delhi for the first time. You open Google Maps — it shows you the shortest path, but it cuts through a staircase. There's no way to know in advance.
>
> AccessRoute AI solves this. It's a campus-specific route planner that only shows you step-free paths — and tells you exactly how confident it is in each segment of the route."

### Step 1 — Open the App (15 seconds)

*[Open browser to the AccessRoute AI URL]*

> "This is AccessRoute AI. It opens directly to the IIIT Delhi campus map. The focus is entirely on the route — we don't ask for login, we don't collect location, we just help you find a step-free path."

*[Point to the map area showing supported locations marked]*

### Step 2 — Select Route (20 seconds)

> "Arjun wants to go from the campus main entrance to the library."

*[Click the Start dropdown → select "Main Gate (Step-free Entrance)"]*
*[Click the Destination dropdown → select "Library (Ground Floor Entrance)"]*

> "Notice we only show supported locations — places we have actual evidence for. We don't offer locations where we don't have data."

### Step 3 — Request Route (10 seconds)

*[Click "Find Step-Free Route"]*

> "The app contacts our route engine…"

*[Loading state appears briefly]*

### Step 4 — Show the Result (60 seconds)

*[Route appears on map as a highlighted polyline]*

> "Here's the step-free route. It's drawn on the map, and below it you have step-by-step text directions — because we know not everyone can read a map easily."

*[Point to text directions panel]*

> "Each step shows its accessibility status. This green tick means **verified step-free** — we have a source for this. This amber warning means **reported step-free** — someone reported it, but it hasn't been physically verified."

*[Point to evidence panel]*

> "And here's the evidence panel. You can see exactly where this information came from, when it was retrieved, and what the limitations are. We never claim a route is guaranteed accessible — we show you what we know and what we don't."

### Step 5 — Show the No-Route Case (30 seconds)

*[Change Destination to a location with no step-free path]*

> "What happens when there's no step-free route? Let's try somewhere we know isn't reachable without stairs."

*[Click "Find Step-Free Route"]*

> "AccessRoute AI says: **No step-free route found**. It explains why, and it does NOT fall back to showing a route with stairs. That's intentional — we'd rather be honest than send someone into an inaccessible path."

### Step 6 — Show Graceful Degradation (20 seconds) *(optional — if time allows)*

> "One more thing: if our live research service is temporarily unavailable, the app still works. It shows local routing based on our verified campus data — and clearly tells you that live research isn't available right now. The route planner never goes down just because an external service does."

### Closing (30 seconds)

> "AccessRoute AI is honest about what it knows and what it doesn't. It gives step-free routes backed by real evidence, clear status labels, and graceful failure modes.
>
> We built this in 24 hours on a small, defensible dataset for IIIT Delhi campus. The architecture is designed to extend to other campuses — but only with verified data, never invented coverage.
>
> Thank you."

---

## Known Limitations to State Honestly (If Asked)

| Limitation | Honest Statement |
|---|---|
| Campus coverage | "We support a small set of verified locations on the IIIT Delhi campus only. We deliberately did not invent routes we couldn't verify." |
| Data currency | "Our accessibility data was last verified on [date]. Physical conditions may have changed." |
| TinyFish integration | "We use TinyFish to retrieve public accessibility information. It supplements our local data but does not physically verify routes." |
| Distance precision | "Distance figures are approximate estimates based on path geometry. They are not GPS-tracked measurements." |
| Lift status | "We do not show real-time lift status because we don't have a reliable live source. Any lift information is static and may be outdated." |
| Reported edges | "Some route segments are labeled 'reported step-free' — this means a user or source claimed it, not that we physically verified it." |

---

## Fallback Plan (If Live Demo Fails)

1. **Backend unavailable:** The app shows the error state ("Service temporarily unavailable"). Narrate: *"This shows how the app handles failures — it tells the user clearly and doesn't crash."*
2. **Map tiles unavailable:** Navigate to the text directions section. Narrate: *"Even without the map, users get full text directions — the route is still usable."*
3. **TinyFish unavailable:** Show that route still returns. Narrate: *"Our local routing continues to work even when the external research service is down."*
4. **Complete service failure:** Use a pre-recorded screen recording of the working demo as last resort. Clearly state: *"This is a recording of the working application."*

---

## Questions the Judges May Ask

| Question | Answer |
|---|---|
| How do you get the accessibility data? | "We collected a small verified dataset for specific IIIT Delhi locations. Each entry has a source, timestamp, and confidence level. We label what is verified vs. reported." |
| What does TinyFish actually do in your app? | "TinyFish retrieves relevant public information about campus locations and returns it with source URLs and timestamps. This supplements our local graph — but the route engine runs independently of TinyFish." |
| Why not use Google Maps / OSRM? | "These don't have reliable stair/ramp data for campus environments. We built a small purposeful graph with explicit accessibility annotations rather than relying on incomplete external data." |
| How would you scale this? | "By adding more verified campus areas — but only with real data, not invented coverage. The architecture separates the route engine from the data so new graphs can be added." |
| Is it accessible itself? | "Yes, we built in keyboard navigation, screen reader support with aria-live regions, and WCAG AA contrast. Text directions are always available as an alternative to the map." |
