import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.middlewares.auth import WorkerAuthMiddleware
from src.middlewares.security import SecurityHeadersMiddleware
from src.routers import agent_router, chat_router


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

app = FastAPI(title="Medcurial Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(WorkerAuthMiddleware)

app.include_router(agent_router)
app.include_router(chat_router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}
