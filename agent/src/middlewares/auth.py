import os

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp


class WorkerAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        worker_key = os.getenv("WORKER_API_KEY", "")

        if not worker_key:
            return JSONResponse(
                status_code=500,
                content={"error": "Server misconfigured: WORKER_API_KEY not set"},
            )

        auth_header = request.headers.get("X-Worker-Key", "")
        if auth_header != worker_key:
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized"},
            )

        return await call_next(request)
