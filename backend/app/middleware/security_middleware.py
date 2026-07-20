from collections import defaultdict, deque
from threading import Lock
from time import monotonic

_attempts: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_lock = Lock()


def is_rate_limited(client_ip: str, path: str, *, limit: int = 10, window_seconds: int = 60) -> bool:
    now = monotonic()
    key = (client_ip, path)
    with _lock:
        bucket = _attempts[key]
        while bucket and now - bucket[0] >= window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            return True
        bucket.append(now)
        return False


def apply_security_headers(response) -> None:
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if response.headers.get("content-type", "").startswith("application/json"):
        response.headers["Cache-Control"] = "no-store"
