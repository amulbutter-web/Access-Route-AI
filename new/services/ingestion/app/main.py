import asyncio
import contextlib
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, HTTPException, status
from .config import Settings
from .ingestion import InMemoryStore, IngestionService
from .models import IngestionRequest, IngestionResult
from .models import BarrierReport, BarrierReportRequest
from .source_registry import SOURCES
from .storage import PostgresRedisStore
from .tinyfish import CircuitBreaker, TinyFishFetchClient

settings = Settings()
store = InMemoryStore()
client = TinyFishFetchClient(settings.tinyfish_api_key, CircuitBreaker(settings.circuit_failure_threshold, settings.circuit_reset_seconds))
service = IngestionService(client, store, settings)

async def scheduled_ingestion() -> None:
    """A bounded 15-minute target loop; service-level single-flight rejects overlaps."""
    while True:
        try:
            await service.run(SOURCES["dmrc_govindpuri_candidate"])
        except Exception:
            # Do not crash routing/API availability because an optional provider job failed.
            pass
        await asyncio.sleep(15 * 60)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    global store, service
    if os.getenv("PERSISTENT_STORE_ENABLED", "false").lower() == "true":
        persistent_store = PostgresRedisStore(os.environ["DATABASE_URL"], os.environ["REDIS_URL"])
        persistent_store.initialize()
        store = persistent_store
        service = IngestionService(client, store, settings)
    task = None
    if os.getenv("INGESTION_SCHEDULER_ENABLED", "false").lower() == "true":
        task = asyncio.create_task(scheduled_ingestion())
    try:
        yield
    finally:
        if task:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task

app = FastAPI(title="AccessRoute AI ingestion", version="0.1.0", lifespan=lifespan)

@app.get("/health")
async def health(): return {"status": "ok"}

@app.get("/api/ingestion/status", response_model=IngestionResult | None)
async def ingestion_status(): return store.last_run

@app.post("/tinyfish/extract", response_model=IngestionResult)
async def extract(request: IngestionRequest, x_ingestion_token: str | None = Header(default=None)):
    if not settings.ingestion_admin_token or x_ingestion_token != settings.ingestion_admin_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ingestion credential")
    source = SOURCES.get(request.source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Unknown or unapproved source")
    return await service.run(source)

@app.post("/api/barrier-reports", response_model=BarrierReport, status_code=status.HTTP_201_CREATED)
async def create_barrier_report(request: BarrierReportRequest):
    """A single reporter only creates pending evidence; it cannot modify an edge."""
    return store.create_report(request)

@app.post("/api/barrier-reports/{report_id}/confirm", response_model=BarrierReport)
async def confirm_barrier_report(report_id: str, reporter_id: str):
    report = store.confirm_report(report_id, reporter_id)
    if not report:
        raise HTTPException(status_code=404, detail="Barrier report not found")
    return report
