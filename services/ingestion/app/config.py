from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    tinyfish_api_key: str | None = os.getenv("TINYFISH_API_KEY")
    ingestion_admin_token: str | None = os.getenv("INGESTION_ADMIN_TOKEN")
    freshness_minutes: int = int(os.getenv("ALERT_FRESHNESS_MINUTES", "15"))
    retention_hours: int = int(os.getenv("ALERT_RETENTION_HOURS", "4"))
    circuit_failure_threshold: int = int(os.getenv("TINYFISH_FAILURE_THRESHOLD", "3"))
    circuit_reset_seconds: int = int(os.getenv("TINYFISH_CIRCUIT_RESET_SECONDS", "300"))

