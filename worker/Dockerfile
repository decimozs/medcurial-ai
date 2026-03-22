FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen-lockfile --no-dev --no-install-project

COPY app/ ./app/

EXPOSE 8000

CMD ["uv", "run", "fastapi", "dev", "app/", "--host", "0.0.0.0"]