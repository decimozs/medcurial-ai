.PHONY: dev dev-api dev-app dev-worker dev-agent dev-mcp install install-mcp clean

dev:
	(cd api && bun run dev) & \
	(cd worker && uv run fastapi dev) & \
	(cd agent && uv run uvicorn src.main:app --reload --port 8001) & \
	(cd app && bun run dev) & \
	wait

dev-infra:
	(cd api && bun run dev) & \
	(cd worker && uv run fastapi dev) & \
	(cd agent && uv run uvicorn src.main:app --reload --port 8001) & \
	wait

dev-api:
	cd api && bun run dev

dev-app:
	cd app && bun run dev

dev-worker:
	cd worker && uv run fastapi dev

dev-agent:
	cd agent && uv run uvicorn src.main:app --reload --port 8001

dev-mcp:
	cd mcp && uv run python main.py

install:
	cd api && bun install
	cd worker && uv sync
	cd agent && uv sync
	cd mcp && uv sync
	cd app && bun install

install-mcp:
	cd mcp && uv sync

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name "node_modules" -exec rm -rf {} +
	rm -rf worker/.venv agent/.venv mcp/.venv
	make install
