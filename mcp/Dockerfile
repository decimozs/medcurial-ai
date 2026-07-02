FROM python:3.12-slim AS base

WORKDIR /app

RUN pip install --no-cache-dir uv


FROM base AS dev

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY . .

CMD ["uv", "run", "fastmcp", "run", "main.py", "--transport", "sse", "--host", "0.0.0.0", "--port", "8002"]


FROM base AS production

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .

RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup appuser

USER appuser

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["sh", "-c", "python -c \"import socket,sys; sys.exit(0) if socket.create_connection(('127.0.0.1',8002),timeout=2) else sys.exit(1)\""]

CMD ["uv", "run", "fastmcp", "run", "main.py", "--transport", "sse", "--host", "0.0.0.0", "--port", "8002"]
