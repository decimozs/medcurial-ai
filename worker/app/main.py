import os
import sys

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import get_settings
from app.exceptions import WorkerException
from app.routers.worker import enroll_signature_router


def configure_logging() -> None:
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_format = os.getenv("LOG_FORMAT", "pretty")

    logger.remove()

    if log_format == "pretty":
        logger.add(
            sys.stderr,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level=log_level,
        )
    else:
        logger.add(
            sys.stderr,
            format="{time} | {level} | {name}:{function}:{line} - {message}",
            level=log_level,
            serialize=True,
        )

    logger.info(f"Logging configured: level={log_level}, format={log_format}")


configure_logging()

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
