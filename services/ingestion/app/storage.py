"""PostgreSQL source-of-truth plus Redis route-cache invalidation adapter."""
from __future__ import annotations

from datetime import UTC, datetime
import json
from uuid import uuid4

import psycopg
import redis

from .models import BarrierReport, BarrierReportRequest, NormalizedAlert, Verification


class PostgresRedisStore:
    """Production adapter. `edge_availability` is an overlay the routing query must honor."""
    def __init__(self, database_url: str, redis_url: str):
        self.database_url = database_url.replace("postgresql+psycopg://", "postgresql://")
        self.redis = redis.Redis.from_url(redis_url, decode_responses=True)
        self.last_run = None
        self._lock_token: str | None = None

    def initialize(self) -> None:
        with psycopg.connect(self.database_url, autocommit=True) as conn, conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS postgis")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS transit_alerts (
                  event_key TEXT PRIMARY KEY, source_id TEXT NOT NULL, source_url TEXT NOT NULL,
                  source_title TEXT, publisher TEXT NOT NULL, retrieved_at TIMESTAMPTZ NOT NULL,
                  effective_at TIMESTAMPTZ, entity_id TEXT, edge_id TEXT, alert_type TEXT NOT NULL,
                  status TEXT NOT NULL, evidence_snippet TEXT NOT NULL, match_status TEXT NOT NULL,
                  match_confidence DOUBLE PRECISION NOT NULL, freshness TEXT NOT NULL,
                  verification_status TEXT NOT NULL, parser_version TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS edge_availability (
                  edge_id TEXT NOT NULL, profile TEXT NOT NULL, enabled BOOLEAN NOT NULL,
                  source_event_key TEXT NOT NULL REFERENCES transit_alerts(event_key),
                  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(edge_id, profile)
                );
                CREATE TABLE IF NOT EXISTS graph_state (singleton BOOLEAN PRIMARY KEY DEFAULT true, version BIGINT NOT NULL);
                INSERT INTO graph_state(singleton, version) VALUES (true, 0) ON CONFLICT (singleton) DO NOTHING;
                CREATE TABLE IF NOT EXISTS barrier_reports (
                  report_id UUID PRIMARY KEY, edge_id TEXT NOT NULL, barrier_type TEXT NOT NULL,
                  description TEXT NOT NULL, submitted_at TIMESTAMPTZ NOT NULL, verification_status TEXT NOT NULL,
                  reporter_ids JSONB NOT NULL DEFAULT '[]'::jsonb
                );
            """)

    def acquire(self) -> bool:
        self._lock_token = str(uuid4())
        return bool(self.redis.set("accessroute:ingestion:lock", self._lock_token, nx=True, ex=120))

    def release(self) -> None:
        # Delete only our own lock; an expired/reacquired lock must be left alone.
        if self._lock_token:
            script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end return 0"
            self.redis.eval(script, 1, "accessroute:ingestion:lock", self._lock_token)
        self._lock_token = None

    def save(self, alert: NormalizedAlert) -> bool:
        fields = alert.model_dump(mode="json")
        with psycopg.connect(self.database_url) as conn, conn.cursor() as cur:
            cur.execute("""
              INSERT INTO transit_alerts(event_key,source_id,source_url,source_title,publisher,retrieved_at,effective_at,entity_id,edge_id,alert_type,status,evidence_snippet,match_status,match_confidence,freshness,verification_status,parser_version)
              VALUES (%(event_key)s,%(source_id)s,%(source_url)s,%(source_title)s,%(publisher)s,%(retrieved_at)s,%(effective_at)s,%(entity_id)s,%(edge_id)s,%(alert_type)s,%(status)s,%(evidence_snippet)s,%(match_status)s,%(match_confidence)s,%(freshness)s,%(verification_status)s,%(parser_version)s)
              ON CONFLICT (event_key) DO NOTHING
            """, fields)
            created = cur.rowcount == 1
        return created

    def has_retained_recent(self, source_id: str, retention_hours: int) -> bool:
        with psycopg.connect(self.database_url, autocommit=True) as conn, conn.cursor() as cur:
            cur.execute("SELECT EXISTS(SELECT 1 FROM transit_alerts WHERE source_id=%s AND retrieved_at >= now() - make_interval(hours => %s))", (source_id, retention_hours))
            return bool(cur.fetchone()[0])

    def apply_verified_lift_down(self, alert: NormalizedAlert, profiles: tuple[str, ...] = ("wheelchair_direct", "assisted_walker")) -> bool:
        if not alert.edge_id:
            return False
        with psycopg.connect(self.database_url) as conn, conn.cursor() as cur:
            cur.executemany("""
              INSERT INTO edge_availability(edge_id,profile,enabled,source_event_key)
              VALUES (%s,%s,false,%s)
              ON CONFLICT (edge_id,profile) DO UPDATE SET enabled=false,source_event_key=EXCLUDED.source_event_key,changed_at=now()
            """, [(alert.edge_id, profile, alert.event_key) for profile in profiles])
            cur.execute("UPDATE graph_state SET version=version+1 WHERE singleton=true RETURNING version")
            version = cur.fetchone()[0]
        self.invalidate_edge_routes(alert.edge_id, profiles)
        return version > 0

    def invalidate_edge_routes(self, edge_id: str, profiles: tuple[str, ...]) -> int:
        deleted = 0
        for profile in profiles:
            index = f"accessroute:edge:{edge_id}:profile:{profile}:route_keys"
            keys = list(self.redis.smembers(index))
            if keys:
                deleted += self.redis.delete(*keys)
            self.redis.delete(index)
        self.redis.incr("accessroute:graph_version")
        return deleted

    @property
    def graph_version(self) -> int:
        with psycopg.connect(self.database_url, autocommit=True) as conn, conn.cursor() as cur:
            cur.execute("SELECT version FROM graph_state WHERE singleton=true")
            return int(cur.fetchone()[0])

    def create_report(self, request: BarrierReportRequest) -> BarrierReport:
        report = BarrierReport(report_id=str(uuid4()), edge_id=request.edge_id, barrier_type=request.barrier_type,
                               description=request.description, submitted_at=datetime.now(UTC))
        with psycopg.connect(self.database_url) as conn, conn.cursor() as cur:
            cur.execute("INSERT INTO barrier_reports(report_id,edge_id,barrier_type,description,submitted_at,verification_status,reporter_ids) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                        (report.report_id, report.edge_id, report.barrier_type, report.description, report.submitted_at, report.verification_status, json.dumps([request.reporter_id])))
        return report

    def confirm_report(self, report_id: str, reporter_id: str) -> BarrierReport | None:
        with psycopg.connect(self.database_url) as conn, conn.cursor() as cur:
            cur.execute("SELECT edge_id,barrier_type,description,submitted_at,verification_status,reporter_ids FROM barrier_reports WHERE report_id=%s FOR UPDATE", (report_id,))
            row = cur.fetchone()
            if not row:
                return None
            reporters = set(row[5] or [])
            reporters.add(reporter_id)
            state = Verification.CROWD_CONFIRMED if len(reporters) >= 2 else Verification.PENDING
            cur.execute("UPDATE barrier_reports SET reporter_ids=%s,verification_status=%s WHERE report_id=%s", (json.dumps(sorted(reporters)), state, report_id))
        return BarrierReport(report_id=report_id, edge_id=row[0], barrier_type=row[1], description=row[2], submitted_at=row[3], verification_status=state, confirmation_count=len(reporters))
