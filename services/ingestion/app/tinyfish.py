"""Minimal server-only TinyFish Fetch client; provider payloads never leave this module."""
import asyncio
from dataclasses import dataclass
import httpx


class TinyFishUnavailable(RuntimeError):
    pass


@dataclass
class CircuitBreaker:
    threshold: int = 3
    reset_seconds: int = 300
    failures: int = 0
    opened_at: float | None = None

    def allow(self, now: float) -> bool:
        if self.opened_at is None:
            return True
        if now - self.opened_at >= self.reset_seconds:
            self.failures = 0
            self.opened_at = None
            return True
        return False

    def success(self) -> None:
        self.failures = 0
        self.opened_at = None

    def failure(self, now: float) -> None:
        self.failures += 1
        if self.failures >= self.threshold:
            self.opened_at = now


class TinyFishFetchClient:
    endpoint = "https://api.fetch.tinyfish.ai"

    def __init__(self, api_key: str | None, breaker: CircuitBreaker | None = None, attempts: int = 3):
        self.api_key = api_key
        self.breaker = breaker or CircuitBreaker()
        self.attempts = attempts

    async def fetch(self, url: str) -> dict:
        if not self.api_key:
            raise TinyFishUnavailable("TINYFISH_API_KEY is not configured")
        loop = asyncio.get_running_loop()
        if not self.breaker.allow(loop.time()):
            raise TinyFishUnavailable("TinyFish circuit is open; using retained state")
        try:
            payload = None
            async with httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=4.0)) as client:
                for attempt in range(self.attempts):
                    response = await client.post(
                        self.endpoint,
                        headers={"X-API-Key": self.api_key},
                        json={"urls": [url], "format": "markdown", "ttl": 0},
                    )
                    if response.status_code not in (429, 500, 502, 503, 504):
                        response.raise_for_status()
                        payload = response.json()
                        break
                    if attempt + 1 < self.attempts:
                        await asyncio.sleep(0.25 * (2 ** attempt))
                if payload is None:
                    response.raise_for_status()
                    payload = response.json()
            result = (payload.get("results") or [None])[0]
            if not isinstance(result, dict):
                raise TinyFishUnavailable("TinyFish returned no usable fetch result")
            self.breaker.success()
            return result
        except (httpx.HTTPError, ValueError, TinyFishUnavailable) as exc:
            self.breaker.failure(loop.time())
            raise TinyFishUnavailable("TinyFish fetch failed") from exc
