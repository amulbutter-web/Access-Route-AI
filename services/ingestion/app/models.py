from datetime import datetime
from enum import StrEnum
from pydantic import BaseModel, Field, HttpUrl


class Freshness(StrEnum):
    FRESH = "FRESH"
    STALE = "STALE"
    UNKNOWN = "UNKNOWN"
    FAILED = "FAILED"


class Verification(StrEnum):
    PENDING = "PENDING"
    SOURCE_VERIFIED = "SOURCE_VERIFIED"
    CROWD_CONFIRMED = "CROWD_CONFIRMED"
    REJECTED = "REJECTED"


class AlertStatus(StrEnum):
    DOWN = "DOWN"
    WORKING = "WORKING"
    UNKNOWN = "UNKNOWN"


class MatchStatus(StrEnum):
    MATCHED = "MATCHED"
    PENDING = "PENDING"
    UNMATCHED = "UNMATCHED"


class SourceDefinition(BaseModel):
    id: str
    publisher: str
    url: HttpUrl
    allowed_hosts: tuple[str, ...]
    entity_id: str
    edge_id: str
    affected_profiles: tuple[str, ...] = ("wheelchair_direct", "assisted_walker")
    scenario: str = "metro"  # deliberately separate from the IIITD campus pilot


class NormalizedAlert(BaseModel):
    event_key: str
    source_id: str
    source_url: HttpUrl
    source_title: str | None = None
    publisher: str
    retrieved_at: datetime
    effective_at: datetime | None = None
    entity_id: str | None = None
    edge_id: str | None = None
    alert_type: str = "LIFT_OUTAGE"
    status: AlertStatus = AlertStatus.UNKNOWN
    evidence_snippet: str = Field(max_length=1000)
    match_status: MatchStatus = MatchStatus.PENDING
    match_confidence: float = Field(ge=0, le=1)
    freshness: Freshness
    verification_status: Verification = Verification.PENDING
    parser_version: str = "v1"


class IngestionRequest(BaseModel):
    source_id: str = "dmrc_govindpuri_candidate"
    force: bool = False


class IngestionResult(BaseModel):
    run_id: str
    state: str
    alerts_seen: int
    alerts_applied: int
    graph_version: int
    freshness: Freshness
    detail: str | None = None


class BarrierReportRequest(BaseModel):
    """A report is evidence, not a routing change, until independently confirmed."""
    edge_id: str
    barrier_type: str = Field(min_length=2, max_length=64)
    description: str = Field(min_length=1, max_length=1000)
    reporter_id: str = Field(min_length=3, max_length=128)


class BarrierReport(BaseModel):
    report_id: str
    edge_id: str
    barrier_type: str
    description: str
    submitted_at: datetime
    verification_status: Verification = Verification.PENDING
    confirmation_count: int = 0

