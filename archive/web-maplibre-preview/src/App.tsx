// ============================================================
// AccessRoute AI — App Root Component
// Owner: Person 01
// ============================================================

import React, { useState, useCallback, useEffect, useRef } from "react";
import { RouteSelector } from "./components/RouteSelector";
import { RouteResult } from "./components/RouteResult";
import { MapView } from "./features/map/MapView";
import { fetchPlaces, fetchRoute } from "./services/apiClient";
import type { Place, RouteResponse, ApiState, RouteRequest } from "./types";
import heroImage from "./assets/accessroute-hero-3d.png";
import "./styles/globals.css";

export const App: React.FC = () => {
  // ── Places (dropdown data) ─────────────────────────────────
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);

  useEffect(() => {
    fetchPlaces().then((data) => {
      setPlaces(data);
      setPlacesLoading(false);
    });
  }, []);

  // ── Route selection state ──────────────────────────────────
  const [startId, setStartId] = useState<string | null>(null);
  const [destId, setDestId] = useState<string | null>(null);

  // ── Validation errors ──────────────────────────────────────
  const [startError, setStartError] = useState<string | undefined>();
  const [destError, setDestError] = useState<string | undefined>();
  const [sameLocError, setSameLocError] = useState<string | undefined>();

  // ── Route API state ────────────────────────────────────────
  const [routeState, setRouteState] = useState<ApiState<RouteResponse>>({
    kind: "idle",
  });

  // Keep a ref to the last request to ignore stale responses
  const requestCounterRef = useRef(0);

  // ── Derived: selected place names (for display in result) ──
  const startName = places.find((p) => p.id === startId)?.name;
  const destName = places.find((p) => p.id === destId)?.name;

  // ── Validate form ──────────────────────────────────────────
  const validate = (): boolean => {
    let valid = true;
    if (!startId) {
      setStartError("Please select a start location.");
      valid = false;
    } else {
      setStartError(undefined);
    }
    if (!destId) {
      setDestError("Please select a destination.");
      valid = false;
    } else {
      setDestError(undefined);
    }
    if (startId && destId && startId === destId) {
      setSameLocError("Start and destination must be different places.");
      valid = false;
    } else {
      setSameLocError(undefined);
    }
    return valid;
  };

  // ── Handle route request ───────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    if (!startId || !destId) return;

    const thisRequest = ++requestCounterRef.current;
    setRouteState({ kind: "loading" });

    const request: RouteRequest = {
      startId,
      destinationId: destId,
      mode: "step_free",
    };

    try {
      const result = await fetchRoute(request);
      // Ignore stale responses
      if (requestCounterRef.current !== thisRequest) return;
      setRouteState({ kind: "success", data: result });
    } catch (err) {
      if (requestCounterRef.current !== thisRequest) return;
      setRouteState({
        kind: "error",
        error: {
          code: (err as { code?: string }).code ?? "UNKNOWN",
          message:
            (err as { message?: string }).message ??
            "Service temporarily unavailable.",
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startId, destId]);

  // ── Retry handler ─────────────────────────────────────────
  const handleRetry = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  return (
    <div className="app">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to directions
      </a>

      {/* Header */}
      <header className="app-header" role="banner">
        <a className="brand" href="#main-content" aria-label="AccessRoute AI home"><span className="brand__mark" aria-hidden="true">A</span><span>AccessRoute <em>AI</em></span></a>
        <span className="app-header__subtitle">Evidence-first navigation</span>
      </header>
      <section className="hero" aria-labelledby="hero-title">
        <img className="hero__art" src={heroImage} alt="" />
        <div className="hero__content"><p className="eyebrow">ACCESSIBILITY, MADE VISIBLE</p><h1 id="hero-title">Choose paths that <span>work in the real world.</span></h1><p>AccessRoute pairs route planning with current, source-backed accessibility evidence—so uncertainty is visible before you go.</p><div className="hero__signals" aria-label="Product principles"><span>Live evidence states</span><span>Hard barrier exclusions</span><span>Human-reviewed reports</span></div></div>
      </section>

      {/* Main content */}
      <main id="main-content" className="app-main">
        {/* Selector panel */}
        <section
          className="panel panel--selector"
          aria-labelledby="planner-heading"
        >
          <p className="panel__kicker">ROUTE PLANNER</p><h2 id="planner-heading" className="panel__heading">Find your step-free route</h2>
          <p className="panel__subheading">
            Select a start and destination to plan an accessible path on IIIT
            Delhi campus.
          </p>

          {placesLoading ? (
            <p role="status" aria-live="polite">
              Loading campus locations…
            </p>
          ) : places.length === 0 ? (
            <p role="alert">
              Campus locations are currently unavailable. Please refresh the page.
            </p>
          ) : (
            <RouteSelector
              places={places}
              startId={startId}
              destinationId={destId}
              isLoading={routeState.kind === "loading"}
              onStartChange={(id) => {
                setStartId(id);
                setStartError(undefined);
                setSameLocError(undefined);
              }}
              onDestinationChange={(id) => {
                setDestId(id);
                setDestError(undefined);
                setSameLocError(undefined);
              }}
              onSubmit={handleSubmit}
              startError={startError}
              destinationError={destError}
              sameLocationError={sameLocError}
            />
          )}
        </section>

        {/* Map */}
        <section className="panel panel--map" aria-label="Campus map">
          <MapView
            places={places}
            route={
              routeState.kind === "success" ? routeState.data : undefined
            }
            startId={startId}
            destId={destId}
          />
        </section>

        {/* Route result */}
        {routeState.kind !== "idle" && (
          <section className="panel panel--result" aria-label="Route result">
            <RouteResult
              state={routeState}
              startName={startName}
              destName={destName}
              onRetry={handleRetry}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer" role="contentinfo">
        <p>
          AccessRoute AI — HackIIITD demo build. Coverage is limited to a
          small verified area of IIIT Delhi campus. Route information is not a
          guarantee of physical accessibility.
        </p>
      </footer>
    </div>
  );
};

export default App;
