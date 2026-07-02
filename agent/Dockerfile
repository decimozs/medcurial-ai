FROM python:3.12-slim AS base

WORKDIR /app

RUN pip install --no-cache-dir uv


FROM base AS dev

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY . .

CMD ["uv", "run", "uvicorn", "src.main:app", "--reload", "--host", "0.0.0.0", "--port", "8001"]


FROM base AS production

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .

RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup appuser

USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["sh", "-c", "python -c \"import urllib.request,sys; sys.exit(0) if urllib.request.urlopen('http://localhost:8001/health').status==200 else sys.exit(1)\""]

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
