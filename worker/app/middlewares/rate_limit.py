from collections import defaultdict
from time import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        max_requests: int = 20,
        window_seconds: int = 60,
    ) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.store: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if not ip:
            ip = request.client.host if request.client else "unknown"

        key = f"{ip}:{request.url.path}"
        now = time()
        timestamps = self.store[key]

        cutoff = now - self.window_seconds
        timestamps[:] = [t for t in timestamps if t > cutoff]

        if len(timestamps) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"error": "Too many requests"},
            )

        timestamps.append(now)
        return await call_next(request)
