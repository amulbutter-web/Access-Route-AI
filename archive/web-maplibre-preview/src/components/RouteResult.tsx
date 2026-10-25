// ============================================================
// AccessRoute AI — RouteResult Component
// Owner: Person 01
// Displays route instructions, status, evidence, and all
// non-success states (no-route, error, loading, idle)
// ============================================================

import React from "react";
import type { RouteResponse, ApiState, AccessibilityStatus } from "../types";

// ─── Status Helpers ──────────────────────────────────────────
const STATUS_CONFIG: Record<
  AccessibilityStatus,
  { icon: string; label: string; className: string }
> = {
  verified_step_free: {
    icon: "✓",
    label: "Verified step-free",
    className: "status--verified",
  },
  reported_step_free: {
    icon: "⚠",
    label: "Reported step-free (unverified)",
    className: "status--reported",
  },
  not_step_free: {
    icon: "✗",
    label: "Contains stairs",
    className: "status--not-accessible",
  },
  unknown: {
    icon: "?",
    label: "Accessibility unknown",
    className: "status--unknown",
  },
};

function StatusBadge({ status }: { status: AccessibilityStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`status-badge ${config.className}`}
      title={config.label}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span className="status-badge__label">{config.label}</span>
    </span>
  );
}

// ─── Evidence Panel ──────────────────────────────────────────
function EvidencePanel({ evidence }: { evidence: RouteResponse["evidence"] }) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <section className="evidence-panel" aria-labelledby="evidence-heading">
      <h3 id="evidence-heading" className="evidence-panel__heading">
        Accessibility Information
      </h3>
      {evidence.map((ev, i) => (
        <div key={i} className="evidence-panel__item">
          <dl className="evidence-panel__dl">
            <dt>Source</dt>
            <dd>
              <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer">
                {ev.sourceTitle}
              </a>
            </dd>
            <dt>Retrieved</dt>
            <dd>{new Date(ev.retrievedAt).toLocaleDateString()}</dd>
            <dt>Claim</dt>
            <dd>{ev.claim}</dd>
            <dt>Status</dt>
            <dd>{ev.verificationLabel}</dd>
            <dt>Limitations</dt>
            <dd>{ev.limitations}</dd>
          </dl>
        </div>
      ))}
      <p className="evidence-panel__disclaimer">
        ⚠ This information is not a guarantee of physical accessibility.
        Conditions may have changed. Verify before relying on this route.
      </p>
    </section>
  );
}

// ─── TinyFish Unavailable Notice ─────────────────────────────
function TinyFishUnavailableNotice() {
  return (
    <p className="notice notice--info" role="status">
      Live accessibility research is currently unavailable. Route is based on
      locally verified information only.
    </p>
  );
}

// ─── Route Found State ───────────────────────────────────────
function RouteFound({ route }: { route: RouteResponse }) {
  const hasTinyFishWarning = route.warnings?.some((w) =>
    w.toLowerCase().includes("tinyfish") || w.toLowerCase().includes("live research")
  );

  const hasReportedSegments = route.instructions?.some(
    (i) => i.accessibilityStatus === "reported_step_free"
  );

  return (
    <div className="route-result route-result--found">
      {/* Route header */}
      <div className="route-result__header">
        <h2 className="route-result__heading" tabIndex={-1}>
          Step-free route found
        </h2>
        {route.distanceMeters && (
          <p className="route-result__distance">
            Approx. {Math.round(route.distanceMeters)} m
          </p>
        )}
      </div>

      {/* Warnings */}
      {hasReportedSegments && (
        <div className="notice notice--warning" role="alert">
          ⚠ Parts of this route are based on reported but unverified information.
          Please exercise caution.
        </div>
      )}
      {hasTinyFishWarning && <TinyFishUnavailableNotice />}

      {/* Step-by-step directions */}
      {route.instructions && route.instructions.length > 0 && (
        <section aria-labelledby="directions-heading">
          <h3 id="directions-heading" className="route-result__section-heading">
            Step-by-step directions
          </h3>
          <ol className="directions-list">
            {route.instructions.map((step) => (
              <li key={step.stepNumber} className="directions-list__item">
                <div className="directions-list__step-header">
                  <span className="directions-list__step-number">
                    Step {step.stepNumber}
                  </span>
                  <StatusBadge status={step.accessibilityStatus} />
                </div>
                <p className="directions-list__description">{step.description}</p>
                {step.distanceMeters != null && (
                  <p className="directions-list__distance">
                    Approx. {Math.round(step.distanceMeters)} m
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Evidence panel */}
      <EvidencePanel evidence={route.evidence} />

      {/* Data freshness */}
      <p className="route-result__generated">
        Route generated:{" "}
        {new Date(route.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

// ─── No Route State ──────────────────────────────────────────
function NoRoute({ startName, destName }: { startName?: string; destName?: string }) {
  return (
    <div className="route-result route-result--no-route" role="status">
      <h2 className="route-result__heading" tabIndex={-1}>
        No step-free route found
      </h2>
      <p>
        We couldn't find a step-free route
        {startName && destName
          ? ` between ${startName} and ${destName}`
          : ""}. The connecting paths may include stairs or have unknown
        accessibility.
      </p>
      <p className="route-result__guidance">
        Try a different start or destination, or check with the campus
        facilities office for current accessibility information.
      </p>
    </div>
  );
}

// ─── Service Error State ─────────────────────────────────────
function ServiceError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="route-result route-result--error" role="alert">
      <h2 className="route-result__heading" tabIndex={-1}>
        Service temporarily unavailable
      </h2>
      <p>
        We're unable to process your route request right now. Please try again
        in a moment.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="route-result__retry-btn"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ─── Loading State ───────────────────────────────────────────
function LoadingState() {
  return (
    <div className="route-result route-result--loading" aria-live="polite">
      <p>Finding your step-free route…</p>
    </div>
  );
}

// ─── Main RouteResult Component ──────────────────────────────
interface RouteResultProps {
  state: ApiState<RouteResponse>;
  startName?: string;
  destName?: string;
  onRetry?: () => void;
}

export const RouteResult: React.FC<RouteResultProps> = ({
  state,
  startName,
  destName,
  onRetry,
}) => {
  // Screen reader live region for announcements
  const [announcement, setAnnouncement] = React.useState("");

  React.useEffect(() => {
    if (state.kind === "loading") {
      setAnnouncement("Finding your step-free route…");
    } else if (state.kind === "success") {
      if (state.data.status === "found") {
        const steps = state.data.instructions?.length ?? 0;
        setAnnouncement(
          `Step-free route found. ${steps} steps. Scroll down for directions.`
        );
      } else if (state.data.status === "no_route") {
        setAnnouncement(
          `No step-free route found${startName && destName ? ` between ${startName} and ${destName}` : ""}.`
        );
      }
    } else if (state.kind === "error") {
      setAnnouncement("Service temporarily unavailable. Please try again.");
    }
  }, [state, startName, destName]);

  return (
    <div className="route-result-container">
      {/* Screen reader live region */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Visual content */}
      {state.kind === "idle" && null}
      {state.kind === "loading" && <LoadingState />}
      {state.kind === "error" && <ServiceError onRetry={onRetry} />}
      {state.kind === "success" && state.data.status === "found" && (
        <RouteFound route={state.data} />
      )}
      {state.kind === "success" && state.data.status === "no_route" && (
        <NoRoute startName={startName} destName={destName} />
      )}
      {state.kind === "success" && state.data.status === "service_error" && (
        <ServiceError onRetry={onRetry} />
      )}
      {state.kind === "success" && state.data.status === "invalid_input" && (
        <div className="route-result route-result--error" role="alert">
          <h2 className="route-result__heading" tabIndex={-1}>
            Invalid selection
          </h2>
          <p>
            One or more selected locations are not supported. Please choose
            from the available options.
          </p>
        </div>
      )}
    </div>
  );
};

export default RouteResult;
