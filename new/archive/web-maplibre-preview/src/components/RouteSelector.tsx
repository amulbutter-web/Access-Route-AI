// ============================================================
// AccessRoute AI — RouteSelector Component
// Owner: Person 01
// Handles start/destination selection and form submission
// ============================================================

import React, { useId } from "react";
import type { Place } from "../types";

interface RouteSelectorProps {
  places: Place[];
  startId: string | null;
  destinationId: string | null;
  isLoading: boolean;
  onStartChange: (id: string) => void;
  onDestinationChange: (id: string) => void;
  onSubmit: () => void;
  startError?: string;
  destinationError?: string;
  sameLocationError?: string;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  places,
  startId,
  destinationId,
  isLoading,
  onStartChange,
  onDestinationChange,
  onSubmit,
  startError,
  destinationError,
  sameLocationError,
}) => {
  const startSelectId = useId();
  const destSelectId = useId();
  const startErrorId = useId();
  const destErrorId = useId();
  const sameErrId = useId();

  const isButtonDisabled =
    isLoading || !startId || !destinationId || startId === destinationId;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isButtonDisabled) onSubmit();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      aria-label="Step-free route planner"
      className="route-selector"
      noValidate
    >
      <div className="route-selector__field">
        <label htmlFor={startSelectId} className="route-selector__label">
          Start location
          <span className="route-selector__required" aria-hidden="true"> *</span>
        </label>
        <select
          id={startSelectId}
          value={startId ?? ""}
          onChange={(e) => onStartChange(e.target.value)}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!startError}
          aria-describedby={startError ? startErrorId : undefined}
          className={`route-selector__select ${startError ? "route-selector__select--error" : ""}`}
        >
          <option value="" disabled>
            Select a start location
          </option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
        {startError && (
          <p id={startErrorId} role="alert" className="route-selector__error">
            {startError}
          </p>
        )}
      </div>

      <div className="route-selector__field">
        <label htmlFor={destSelectId} className="route-selector__label">
          Destination
          <span className="route-selector__required" aria-hidden="true"> *</span>
        </label>
        <select
          id={destSelectId}
          value={destinationId ?? ""}
          onChange={(e) => onDestinationChange(e.target.value)}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!destinationError}
          aria-describedby={destinationError ? destErrorId : undefined}
          className={`route-selector__select ${destinationError ? "route-selector__select--error" : ""}`}
        >
          <option value="" disabled>
            Select a destination
          </option>
          {places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
        {destinationError && (
          <p id={destErrorId} role="alert" className="route-selector__error">
            {destinationError}
          </p>
        )}
      </div>

      {sameLocationError && (
        <p id={sameErrId} role="alert" className="route-selector__error route-selector__error--same">
          {sameLocationError}
        </p>
      )}

      <button
        type="submit"
        disabled={isButtonDisabled}
        className={`route-selector__button ${isLoading ? "route-selector__button--loading" : ""}`}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className="route-selector__spinner" aria-hidden="true" />
            <span>Searching…</span>
          </>
        ) : (
          "Find Step-Free Route"
        )}
      </button>
    </form>
  );
};

export default RouteSelector;
