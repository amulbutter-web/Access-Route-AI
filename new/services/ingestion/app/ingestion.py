"""Normalization, exact matching, idempotent graph changes, and cache invalidation."""
from datetime import UTC, datetime, timedelta
import hashlib
import re
from uuid import uuid4

from .config import Settings
from .models import AlertStatus, BarrierReport, BarrierReportRequest, Freshness, IngestionResult, MatchStatus, NormalizedAlert, SourceDefinition, Verification
from .tinyfish import TinyFishFetchClient, TinyFishUnavailable

OUTAGE = re.compile(r"\b(lift|elevator)\b.{0,80}\b(out of service|not working|closed|unavailable|down)\b", re.I | re.S)
WORKING = re.compile(r"\b(lift|elevator)\b.{0,80}\b(working|operational|restored)\b", re.I | re.S)


class InMemoryStore:
    """Contract-shaped local fallback. Replace with PostGIS and Redis adapters at integration."""
    def __init__(self):
        self.alerts: dict[str, NormalizedAlert] = {}
        self.edge_enabled: dict[str, bool] = {}
        self.graph_version = 0
        self.invalidated_edges: list[str] = []
        self.reports: dict[str, BarrierReport] = {}
        self.locked = False
        self.last_run: IngestionResult | None = None

    def acquire(self) -> bool:
        if self.locked:
            return False
        self.locked = True
        return True

    def release(self) -> None:
        self.locked = False

    def save(self, alert: NormalizedAlert) -> bool:
        if alert.event_key in self.alerts:
            return False
        self.alerts[alert.event_key] = alert
        return True

    def has_retained_recent(self, source_id: str, retention_hours: int) -> bool:
        cutoff = datetime.now(UTC) - timedelta(hours=retention_hours)
        return any(alert.source_id == source_id and alert.retrieved_at >= cutoff for alert in self.alerts.values())

    def apply_verified_lift_down(self, alert: NormalizedAlert, profiles: tuple[str, ...] = ("wheelchair_direct", "assisted_walker")) -> bool:
        if not (alert.edge_id and alert.status == AlertStatus.DOWN and alert.match_status == MatchStatus.MATCHED and alert.verification_status == Verification.SOURCE_VERIFIED):
            return False
        if self.edge_enabled.get(alert.edge_id) is False:
            return False
        self.edge_enabled[alert.edge_id] = False
        self.graph_version += 1
        self.invalidated_edges.append(alert.edge_id)
        return True

    def create_report(self, request: BarrierReportRequest) -> BarrierReport:
        report = BarrierReport(report_id=str(uuid4()), edge_id=request.edge_id, barrier_type=request.barrier_type,
                               description=request.description, submitted_at=datetime.now(UTC))
        # Test adapter keeps a private reporter set alongside the public DTO.
        report.__dict__["_reporters"] = {request.reporter_id}
        self.reports[report.report_id] = report
        return report

    def confirm_report(self, report_id: str, reporter_id: str) -> BarrierReport | None:
        report = self.reports.get(report_id)
        if not report:
            return None
        reporters = report.__dict__.setdefault("_reporters", set())
        reporters.add(reporter_id)
        report.confirmation_count = len(reporters)
        if len(reporters) >= 2:
            report.verification_status = Verification.CROWD_CONFIRMED
        return report


class IngestionService:
    def __init__(self, client: TinyFishFetchClient, store: InMemoryStore, settings: Settings):
        self.client, self.store, self.settings = client, store, settings

    def _freshness(self, retrieved: datetime) -> Freshness:
        return Freshness.FRESH if datetime.now(UTC) - retrieved <= timedelta(minutes=self.settings.freshness_minutes) else Freshness.STALE

    def normalize(self, source: SourceDefinition, provider_result: dict, retrieved: datetime | None = None) -> NormalizedAlert:
        retrieved = retrieved or datetime.now(UTC)
        text = str(provider_result.get("text") or provider_result.get("content") or "")[:10000]
        title = str(provider_result.get("title") or "")[:300] or None
        # Only an exact registry entity reference can reach the graph. Broad text stays pending.
        exact_entity = source.entity_id.lower().replace("_", " ") in text.lower()
        status = AlertStatus.DOWN if OUTAGE.search(text) else AlertStatus.WORKING if WORKING.search(text) else AlertStatus.UNKNOWN
        matched = exact_entity and status != AlertStatus.UNKNOWN
        snippet_match = OUTAGE.search(text) or WORKING.search(text)
        snippet = (snippet_match.group(0) if snippet_match else "No machine-readable lift status found.").strip()
        event_hash = hashlib.sha256(f"{source.id}|{status}|{text}".encode()).hexdigest()[:24]
        effective_at = self._provider_time(provider_result)
        return NormalizedAlert(
            event_key=f"tf:{event_hash}", source_id=source.id, source_url=source.url,
            source_title=title, publisher=source.publisher, retrieved_at=retrieved,
            effective_at=effective_at,
            entity_id=source.entity_id if matched else None, edge_id=source.edge_id if matched else None,
            status=status, evidence_snippet=snippet, match_status=MatchStatus.MATCHED if matched else MatchStatus.PENDING,
            match_confidence=1.0 if matched else 0.0, freshness=self._freshness(retrieved),
            verification_status=Verification.SOURCE_VERIFIED if matched else Verification.PENDING,
        )

    @staticmethod
    def _provider_time(result: dict) -> datetime | None:
        """Preserve an explicit provider/source timestamp when present; never invent one."""
        raw = result.get("published_at") or result.get("effective_at")
        if not isinstance(raw, str):
            return None
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)
        except ValueError:
            return None

    async def run(self, source: SourceDefinition) -> IngestionResult:
        run_id = str(uuid4())
        if not self.store.acquire():
            return IngestionResult(run_id=run_id, state="SKIPPED_OVERLAP", alerts_seen=0, alerts_applied=0, graph_version=self.store.graph_version, freshness=Freshness.UNKNOWN)
        try:
            try:
                result = await self.client.fetch(str(source.url))
                alert = self.normalize(source, result)
            except TinyFishUnavailable:
                retained = self.store.has_retained_recent(source.id, self.settings.retention_hours)
                freshness = Freshness.FAILED if not retained else Freshness.STALE
                output = IngestionResult(run_id=run_id, state="FALLBACK", alerts_seen=0, alerts_applied=0, graph_version=self.store.graph_version, freshness=freshness, detail="Provider unavailable; retained data keeps original timestamps.")
                self.store.last_run = output
                return output
            created = self.store.save(alert)
            applied = int(created and alert.freshness == Freshness.FRESH and self.store.apply_verified_lift_down(alert, source.affected_profiles))
            output = IngestionResult(run_id=run_id, state="COMPLETED", alerts_seen=1, alerts_applied=applied, graph_version=self.store.graph_version, freshness=alert.freshness)
            self.store.last_run = output
            return output
        finally:
            self.store.release()
