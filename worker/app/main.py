from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.exceptions import WorkerException
from app.routers.worker import enroll_signature_router

app = FastAPI(
    title="Medcurial Worker",
    description="Worker service for signature processing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(WorkerException)
async def worker_exception_handler(request: Request, exc: WorkerException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message},
    )


@app.get("/health")
async def health_check():
    settings = get_settings()
    return {
        "status": "healthy",
        "api_url": settings.api_url,
    }


app.include_router(enroll_signature_router)
