// ============================================================
// AccessRoute AI — RouteSelector Component
// Tactile Controls, Categorized Locations & Quick Swapping
// ============================================================

import React, { useId } from 'react';
import type { Location } from '../types';

interface RouteSelectorProps {
  locations: Location[];
  fromId: string | null;
  toId: string | null;
  requireStepFree: boolean;
  isLoading: boolean;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  onStepFreeChange: (value: boolean) => void;
  onSubmit: () => void;
  fromError?: string;
  toError?: string;
  sameLocationError?: string;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  locations,
  fromId,
  toId,
  requireStepFree,
  isLoading,
  onFromChange,
  onToChange,
  onStepFreeChange,
  onSubmit,
  fromError,
  toError,
  sameLocationError,
}) => {
  const fromSelectId = useId();
  const toSelectId = useId();
  const fromErrorId = useId();
  const toErrorId = useId();
  const sameErrId = useId();
  const toggleId = useId();

  const isButtonDisabled = isLoading || !fromId || !toId || fromId === toId;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isButtonDisabled) onSubmit();
  };

  const handleSwap = () => {
    if (fromId && toId) {
      const prevFrom = fromId;
      onFromChange(toId);
      onToChange(prevFrom);
    }
  };

  // Group locations for organized display
  const entrances = locations.filter((l) => l.type === 'entrance');
  const buildings = locations.filter((l) => l.type === 'building');
  const landmarks = locations.filter((l) => l.type === 'landmark');

  return (
    <form
      onSubmit={handleFormSubmit}
      aria-label="Accessible Route Planner"
      className="route-form"
      noValidate
    >
      {/* Origin Selection */}
      <div className="route-form__field">
        <label htmlFor={fromSelectId} className="route-form__label">
          <span>Starting Point / Campus Entry</span>
          <span className="route-form__required" aria-hidden="true">* REQUIRED</span>
        </label>
        <div className="route-form__select-wrapper">
          <select
            id={fromSelectId}
            value={fromId ?? ''}
            onChange={(e) => onFromChange(e.target.value)}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!fromError}
            aria-describedby={fromError ? fromErrorId : undefined}
            className={`route-form__select ${fromError ? 'route-form__select--error' : ''}`}
          >
            <option value="" disabled>Select origin gate or facility…</option>
            {entrances.length > 0 && (
              <optgroup label="Gates & Perimeter Entrances">
                {entrances.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    📍 {loc.name}
                  </option>
                ))}
              </optgroup>
            )}
            {buildings.length > 0 && (
              <optgroup label="Courtrooms & Chambers Blocks">
                {buildings.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    🏛️ {loc.name}
                  </option>
                ))}
              </optgroup>
            )}
            {landmarks.length > 0 && (
              <optgroup label="Parking & Landmarks">
                {landmarks.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    🅿️ {loc.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        {fromError && (
          <p id={fromErrorId} role="alert" className="route-form__error">
            ⚠️ {fromError}
          </p>
        )}
      </div>

      {/* Swap Button Quick Tool */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.4rem 0 0.8rem' }}>
        <button
          type="button"
          onClick={handleSwap}
          disabled={!fromId || !toId || isLoading}
          title="Swap starting point and destination"
          style={{
            background: 'var(--platinum-surface)',
            border: '1.5px solid var(--platinum-border)',
            borderRadius: 'var(--radius-pill)',
            padding: '0.35rem 0.9rem',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--mocha-primary)',
            cursor: (!fromId || !toId || isLoading) ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <span>⇅</span> Reverse Direction
        </button>
      </div>

      {/* Destination Selection */}
      <div className="route-form__field">
        <label htmlFor={toSelectId} className="route-form__label">
          <span>Destination Point</span>
          <span className="route-form__required" aria-hidden="true">* REQUIRED</span>
        </label>
        <div className="route-form__select-wrapper">
          <select
            id={toSelectId}
            value={toId ?? ''}
            onChange={(e) => onToChange(e.target.value)}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={!!toError}
            aria-describedby={toError ? toErrorId : undefined}
            className={`route-form__select ${toError ? 'route-form__select--error' : ''}`}
          >
            <option value="" disabled>Select destination building or service…</option>
            {buildings.length > 0 && (
              <optgroup label="Courtrooms & Chambers Blocks">
                {buildings.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    🏛️ {loc.name}
                  </option>
                ))}
              </optgroup>
            )}
            {entrances.length > 0 && (
              <optgroup label="Gates & Perimeter Entrances">
                {entrances.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    📍 {loc.name}
                  </option>
                ))}
              </optgroup>
            )}
            {landmarks.length > 0 && (
              <optgroup label="Parking & Landmarks">
                {landmarks.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    🅿️ {loc.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        {toError && (
          <p id={toErrorId} role="alert" className="route-form__error">
            ⚠️ {toError}
          </p>
        )}
      </div>

      {sameLocationError && (
        <p id={sameErrId} role="alert" className="route-form__error" style={{ marginBottom: '1rem' }}>
          ⚠️ {sameLocationError}
        </p>
      )}

      {/* Hard Exclusion Step-Free Toggle */}
      <div className="toggle-safety-box">
        <div className="toggle-safety-box__text">
          <div className="toggle-safety-box__title">
            <span>♿ Defensible Step-Free Path</span>
          </div>
          <div className="toggle-safety-box__desc">
            Mathematically prunes stairways. Reroutes via certified ramps & level corridors.
          </div>
        </div>
        <label className="switch-control" htmlFor={toggleId}>
          <input
            type="checkbox"
            id={toggleId}
            checked={requireStepFree}
            onChange={(e) => onStepFreeChange(e.target.checked)}
            disabled={isLoading}
            aria-label="Enforce hard barrier exclusion for step-free routes"
          />
          <span className="switch-control__slider" />
        </label>
      </div>

      {/* Submit Action */}
      <button
        type="submit"
        disabled={isButtonDisabled}
        className="btn-calculate"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className="route-form__spinner" aria-hidden="true" />
            <span>Computing Accessible Mesh…</span>
          </>
        ) : (
          <>
            <span>🗺️ Calculate Defensible Path</span>
          </>
        )}
      </button>
    </form>
  );
};

export default RouteSelector;
