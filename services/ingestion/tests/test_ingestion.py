from datetime import UTC, datetime
import pytest
from app.config import Settings
from app.ingestion import InMemoryStore, IngestionService
from app.models import BarrierReportRequest, Freshness
from app.source_registry import SOURCES
from app.storage import PostgresRedisStore
from app.tinyfish import TinyFishUnavailable

class FakeClient:
    def __init__(self, result): self.result = result
    async def fetch(self, url): return self.result

@pytest.mark.asyncio
async def test_verified_exact_lift_down_disables_only_exact_edge_and_invalidates():
    source = SOURCES["dmrc_govindpuri_candidate"]
    client = FakeClient({"title": "Notice", "text": "govindpuri metro lift 1 is out of service"})
    store = InMemoryStore()
    result = await IngestionService(client, store, Settings()).run(source)
    assert result.alerts_applied == 1
    assert store.edge_enabled[source.edge_id] is False
    assert store.invalidated_edges == [source.edge_id]
    assert store.graph_version == 1

@pytest.mark.asyncio
async def test_ambiguous_notice_stays_pending_and_cannot_change_graph():
    source = SOURCES["dmrc_govindpuri_candidate"]
    client = FakeClient({"text": "A lift is out of service."})
    store = InMemoryStore()
    result = await IngestionService(client, store, Settings()).run(source)
    alert = next(iter(store.alerts.values()))
    assert result.alerts_applied == 0
    assert alert.match_status == "PENDING"
    assert store.graph_version == 0

@pytest.mark.asyncio
async def test_duplicate_event_is_idempotent():
    source = SOURCES["dmrc_govindpuri_candidate"]
    service = IngestionService(FakeClient({"text": "govindpuri metro lift 1 is out of service"}), InMemoryStore(), Settings())
    await service.run(source)
    second = await service.run(source)
    assert second.alerts_applied == 0


@pytest.mark.asyncio
async def test_provider_failure_retains_old_state_with_stale_label():
    class BrokenClient:
        async def fetch(self, url): raise TinyFishUnavailable("offline")
    source = SOURCES["dmrc_govindpuri_candidate"]
    store = InMemoryStore()
    store.alerts["old"] = IngestionService(FakeClient({"text": "A lift is out of service."}), store, Settings()).normalize(source, {"text": "A lift is out of service."})
    result = await IngestionService(BrokenClient(), store, Settings()).run(source)
    assert result.state == "FALLBACK"
    assert result.freshness == Freshness.STALE


def test_crowd_report_needs_two_distinct_reporters():
    store = InMemoryStore()
    report = store.create_report(BarrierReportRequest(edge_id="edge-1", barrier_type="ROUGH_SURFACE", description="Loose paving", reporter_id="reporter-1"))
    first = store.confirm_report(report.report_id, "reporter-1")
    assert first.verification_status == "PENDING"
    second = store.confirm_report(report.report_id, "reporter-2")
    assert second.verification_status == "CROWD_CONFIRMED"
    assert second.confirmation_count == 2


def test_redis_edge_index_removes_dependent_route_keys_and_bumps_version():
    class FakeRedis:
        def __init__(self): self.data = {"accessroute:edge:e1:profile:wheelchair_direct:route_keys": {"route:a", "route:b"}}; self.deleted = []
        def smembers(self, key): return self.data.get(key, set())
        def delete(self, *keys): self.deleted.extend(keys); return len(keys)
        def incr(self, key): self.version_key = key; return 1
    store = object.__new__(PostgresRedisStore)
    store.redis = FakeRedis()
    deleted = store.invalidate_edge_routes("e1", ("wheelchair_direct",))
    assert deleted == 2
    assert {"route:a", "route:b"}.issubset(set(store.redis.deleted))
    assert store.redis.version_key == "accessroute:graph_version"
