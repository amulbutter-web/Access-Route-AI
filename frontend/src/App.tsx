// ============================================================
// AccessRoute AI — App Root Component
// Platform: Universal Evidence-First Accessible Navigation
// Active Deployment Flagship: Delhi High Court Complex
// ============================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RouteSelector } from './components/RouteSelector';
import { RouteResult } from './components/RouteResult';
import { MapView } from './features/map/MapView';
import { fetchLocations, fetchRoute } from './services/apiClient';
import type { Location, RouteResult as RouteResultType, ApiResponse, ApiState } from './types';
import heroImage from './assets/accessroute-hero-3d.png';

export const App: React.FC = () => {
  // ── Locations state ─────────────────────────────────────────
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    fetchLocations().then((data) => {
      setLocations(data);
      setLocationsLoading(false);
    });
  }, []);

  // ── Route selection state ──────────────────────────────────
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [requireStepFree, setRequireStepFree] = useState(true);

  // ── Form validation errors ─────────────────────────────────
  const [fromError, setFromError] = useState<string | undefined>();
  const [toError, setToError] = useState<string | undefined>();
  const [sameLocError, setSameLocError] = useState<string | undefined>();

  // ── Route state ────────────────────────────────────────────
  const [routeState, setRouteState] = useState<ApiState<RouteResultType>>({ kind: 'idle' });
  const requestCounterRef = useRef(0);

  // ── Place Names ────────────────────────────────────────────
  const fromName = locations.find((l) => l.id === fromId)?.name;
  const toName = locations.find((l) => l.id === toId)?.name;

  const routeForMap = routeState.kind === 'success' ? routeState.data : undefined;

  // ── Validate Selection ─────────────────────────────────────
  const validate = (): boolean => {
    let valid = true;
    if (!fromId) {
      setFromError('Please select a starting point.');
      valid = false;
    } else {
      setFromError(undefined);
    }
    if (!toId) {
      setToError('Please select a destination.');
      valid = false;
    } else {
      setToError(undefined);
    }
    if (fromId && toId && fromId === toId) {
      setSameLocError('Start and destination must be different campus locations.');
      valid = false;
    } else {
      setSameLocError(undefined);
    }
    return valid;
  };

  // ── Submit Route Computation ───────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    if (!fromId || !toId) return;

    const thisRequest = ++requestCounterRef.current;
    setRouteState({ kind: 'loading' });

    try {
      const response: ApiResponse<RouteResultType> = await fetchRoute(fromId, toId, requireStepFree);
      if (requestCounterRef.current !== thisRequest) return;

      if (response.success && response.data) {
        setRouteState({ kind: 'success', data: response.data });
      } else {
        setRouteState({
          kind: 'error',
          error: {
            code: response.error?.code ?? 'CALCULATION_FAILED',
            message: response.error?.message ?? 'Path calculation could not complete.',
          },
        });
      }
    } catch {
      if (requestCounterRef.current !== thisRequest) return;
      setRouteState({
        kind: 'error',
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the AccessRoute backend. Please ensure the server is running on port 3001.',
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromId, toId, requireStepFree]);

  const handleRetry = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  // ── Preset Quick Route Trigger ─────────────────────────────
  const handleApplyPreset = (originId: string, destId: string) => {
    setFromId(originId);
    setToId(destId);
    setFromError(undefined);
    setToError(undefined);
    setSameLocError(undefined);

    // Run fetch directly
    const thisRequest = ++requestCounterRef.current;
    setRouteState({ kind: 'loading' });

    fetchRoute(originId, destId, true)
      .then((res) => {
        if (requestCounterRef.current !== thisRequest) return;
        if (res.success && res.data) {
          setRouteState({ kind: 'success', data: res.data });
        } else {
          setRouteState({
            kind: 'error',
            error: {
              code: res.error?.code ?? 'ERROR',
              message: res.error?.message ?? 'Failed to load route.',
            },
          });
        }
      })
      .catch(() => {
        if (requestCounterRef.current !== thisRequest) return;
        setRouteState({
          kind: 'error',
          error: { code: 'NETWORK_ERROR', message: 'Connection to server failed.' },
        });
      });
  };

  return (
    <div className="app">
      {/* Skip Link for A11y */}
      <a href="#main-content" className="skip-link">Skip to Accessible Routing</a>

      {/* Top Platform & Telemetry Bar */}
      <div className="platform-bar" role="complementary" aria-label="System status">
        <div className="platform-bar__left">
          <span className="platform-bar__status-pill">
            <span className="platform-bar__status-dot" aria-hidden="true" />
            TINYFISH AGENT: ONLINE
          </span>
          <span className="platform-bar__facility">
            🏛️ ACTIVE DEPLOYMENT: HIGH COURT OF DELHI (SHER SHAH ROAD)
          </span>
        </div>
        <div className="platform-bar__metrics">
          <span>NODES: 16 FACILITIES</span>
          <span>CORRIDORS: 21 AUDITED</span>
          <span>STAIR EXCLUSION: HARD STRICT</span>
        </div>
      </div>

      {/* Luxury Brand Header */}
      <header className="app-header" role="banner">
        <div className="app-header__inner">
          <a className="app-header__brand" href="#main-content" aria-label="AccessRoute AI platform home">
            <div className="app-header__logo-frame" aria-hidden="true">
              ⚖️
            </div>
            <div className="app-header__titles">
              <div className="app-header__title">
                AccessRoute<span>AI</span>
              </div>
              <div className="app-header__tagline">
                Evidence-First Accessible Navigation Engine
              </div>
            </div>
          </a>

          <div className="app-header__actions">
            <div className="app-header__badge-deployment">
              <span>Facility:</span>
              <strong>Delhi High Court Pilot</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Dramatic Hero Section */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__grid">
          <div className="hero__content">
            <div className="hero__kicker-pill">
              <span>🛡️ Defensible Civic Navigation · Engine v2.4</span>
            </div>
            <h1 id="hero-title" className="hero__title">
              Defensible paths.<br />
              <em>Zero barriers.</em>
            </h1>
            <p className="hero__lead">
              AccessRoute AI bridges digital wayfinding with physical accessibility reality.
              Every path is governed by <strong>strict mathematical barrier exclusion</strong> and
              corroborated by <strong>live TinyFish AI web intelligence</strong>.
            </p>

            <div className="hero__badges-row" aria-label="Platform Guarantees">
              <div className="hero__spec-badge">
                <span className="badge-icon">🚫</span>
                <div>
                  <strong>Hard Exclusion</strong>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>No silent stairs fallback</div>
                </div>
              </div>
              <div className="hero__spec-badge">
                <span className="badge-icon">🔎</span>
                <div>
                  <strong>TinyFish Intelligence</strong>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Real-time web verification</div>
                </div>
              </div>
              <div className="hero__spec-badge">
                <span className="badge-icon">📐</span>
                <div>
                  <strong>Tactile Precision</strong>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>ADA/CPWD ramp metrics</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Visual Art Column */}
          <div className="hero__visual" aria-hidden="true">
            <div className="hero__art-card">
              <img
                src={heroImage}
                alt="3D Accessibility Wayfinding Diagram"
                className="hero__art-img"
              />
              <div className="hero__art-overlay">
                <div className="hero__art-overlay-title">Evidence-First Spatial Topology</div>
                <div className="hero__art-overlay-sub">Real-Time Barrier Containment Mesh Active</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Test Scenarios Bar */}
      <section className="presets-section" aria-label="Quick Test Scenarios">
        <div className="presets-card">
          <div className="presets-card__label">
            <span>⚡ Rapid Scenarios:</span>
          </div>
          <div className="presets-card__buttons">
            <button
              type="button"
              onClick={() => handleApplyPreset('main-gate', 'c-block')}
              className="preset-btn"
            >
              <span>Main Gate 1</span> <span className="preset-arrow">➔</span> <span>New C Block (Courtrooms)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('gate-2', 'bar-library')}
              className="preset-btn"
            >
              <span>Lawyers Gate 2</span> <span className="preset-arrow">➔</span> <span>Bar Library</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('gate-7', 'mediation-centre')}
              className="preset-btn"
            >
              <span>Gate 7</span> <span className="preset-arrow">➔</span> <span>Mediation Centre</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('lawyers-chambers-1', 'lawyers-chambers-2')}
              className="preset-btn"
            >
              <span>Chambers I</span> <span className="preset-arrow">➔</span> <span>Chambers II (Ramp Detour)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Workspace Layout */}
      <main id="main-content" className="app-main">
        {/* Route Planner Panel */}
        <section className="panel panel--planner" aria-labelledby="planner-heading">
          <div className="panel__kicker">
            <span>Navigation Terminal</span>
          </div>
          <h2 id="planner-heading" className="panel__heading">
            Plan Accessible Journey
          </h2>
          <p className="panel__subheading">
            Specify origin and destination within the Delhi High Court complex to compute a verified step-free trajectory.
          </p>

          {locationsLoading ? (
            <div role="status" aria-live="polite">
              <div className="skeleton skeleton--block" style={{ height: '56px', borderRadius: '10px' }} />
              <div className="skeleton skeleton--block" style={{ height: '56px', borderRadius: '10px', marginTop: '1rem' }} />
              <div className="skeleton skeleton--text" style={{ marginTop: '1rem' }} />
            </div>
          ) : locations.length === 0 ? (
            <p role="alert" style={{ color: '#B91C1C', fontWeight: 600 }}>
              Campus topological data unavailable. Please verify the backend server at port 3001 is active.
            </p>
          ) : (
            <RouteSelector
              locations={locations}
              fromId={fromId}
              toId={toId}
              requireStepFree={requireStepFree}
              isLoading={routeState.kind === 'loading'}
              onFromChange={(id) => {
                setFromId(id);
                setFromError(undefined);
                setSameLocError(undefined);
              }}
              onToChange={(id) => {
                setToId(id);
                setToError(undefined);
                setSameLocError(undefined);
              }}
              onStepFreeChange={setRequireStepFree}
              onSubmit={handleSubmit}
              fromError={fromError}
              toError={toError}
              sameLocationError={sameLocError}
            />
          )}
        </section>

        {/* Map Panel */}
        <section className="panel panel--map" aria-label="Campus Interactive Map">
          <MapView
            locations={locations}
            route={routeForMap}
            fromId={fromId}
            toId={toId}
          />
        </section>

        {/* Route Result Panel */}
        {routeState.kind !== 'idle' && (
          <section className="panel--result" aria-label="Navigation Directions & Verification">
            <RouteResult
              state={routeState}
              fromName={fromName}
              toName={toName}
              onRetry={handleRetry}
            />
          </section>
        )}
      </main>

      {/* Luxury Footer */}
      <footer className="app-footer" role="contentinfo">
        <div className="app-footer__inner">
          <div className="app-footer__disclaimer">
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: '0.4rem' }}>
              AccessRoute AI · Civic Accessibility Infrastructure
            </div>
            <p>
              Deployment Flagship: Delhi High Court Campus (Sher Shah Road, New Delhi).
              Physical accessibility metrics reflect formal architectural surveys (DFI) and verified civic charters.
              Web intelligence supplied by TinyFish Agentic Infrastructure.
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
            <div>WCAG 2.1 Level AAA Contrast Compliant</div>
            <div style={{ marginTop: '0.25rem' }}>
              <a href="#main-content">Back to Top ↑</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
