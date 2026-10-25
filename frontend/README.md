# Person 1: Frontend Application

This directory contains the user interface for AccessRoute AI, specifically designed for accessible navigation of the Delhi High Court complex.

## Technology Stack
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 6
- **Mapping:** Leaflet interactive campus visualization
- **Typography:** Playfair Display (judicial editorial headings), Inter (clean grotesque body)
- **Palette:** Mocha Brown (`#6F4E37`), Platinum Silver (`#E5E4E2`), Pale Lavender (`#E6E0F0`)
- **Accessibility:** W3C WAI-ARIA compliant, high-contrast states, screen reader live regions, keyboard navigation

## Project Structure
- `src/App.tsx` — Main application component with hero section and responsive layout.
- `src/components/RouteSelector.tsx` — Origin, destination, and step-free constraint controls.
- `src/components/RouteResult.tsx` — Step-by-step directions, accessibility summaries, and TinyFish evidence panels.
- `src/features/map/MapView.tsx` — Interactive Leaflet map visualizing step-free paths, status markers, and building tooltips.
- `src/services/apiClient.ts` — Type-safe backend client connecting to Person 4 endpoints.
- `src/styles/globals.css` — Editorial design system, glassmorphism, and responsive layout.

## Running Locally
```bash
npm install
npm run dev
```
Development server runs at `http://localhost:5173`. API requests to `/api/*` are automatically proxied to the backend at `http://localhost:3001`.
