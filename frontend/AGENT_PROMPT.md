# AccessRoute AI — Person 01 Copy-Paste Agent Prompt

Paste this prompt into your vibe-coding agent when resuming work on the frontend.

---

```text
Read all four role files (Reference_01 through Reference_04) and the docs/PRD.md,
docs/UX_STATES.md, and src/types/index.ts in this package before editing any file.

You are implementing ONLY the work assigned to Person 01:
- Product Requirements Document (already in docs/PRD.md)
- UX States document (already in docs/UX_STATES.md)
- React/TypeScript frontend components
- Frontend API client (src/services/apiClient.ts)
- Styles (src/styles/globals.css)

Constraints (non-negotiable):
1. Never call TinyFish or any external API from the browser. All calls go through the backend API.
2. Never expose API keys in frontend code, .env, source maps, or logs.
3. Never label `unknown` accessibility status as accessible in the UI.
4. Never fall back to a stair-containing route if status is not "found".
5. Always provide text directions as a fallback to the map.
6. Use the exact TypeScript types in src/types/index.ts — do not invent new API fields.
7. Do not invent campus locations, coordinates, or accessibility evidence.
8. Make focused changes only — do not rewrite the whole project.

Before starting:
- Read the current repository tree.
- Read docs/PRD.md for acceptance criteria.
- Read docs/UX_STATES.md for exact UI copy and state requirements.
- Ask for docs/API_CONTRACTS.md and docs/ROUTING_POLICY.md from Person 02/03 if not yet available.

After completing work, report:
- Files created or changed and why.
- Commands actually run and their real output (npm run build, npm run typecheck, npm run lint).
- Tests that passed, failed, or were skipped.
- Assumptions made and any invented data (flag these clearly).
- Known bugs, limitations, or unresolved issues.
- Any proposed changes to shared types/contracts (require team approval before changing).
```
