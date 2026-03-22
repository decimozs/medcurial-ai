# Contributing to Medcurial

Thank you for your interest in contributing to Medcurial. This document outlines the development workflow, code style guidelines, and verification requirements for all contributors.

## Development Setup

### Prerequisites

- **Node.js** 18+
- **Bun**
- **Python** 3.12+
- **Git**

### Installation

1. Clone the repository and navigate to the project root:

```bash
git clone https://github.com/your-org/medcurial.git
cd medcurial
```

2. Install all dependencies:

```bash
make install
```

3. Copy `.env.example` to each service and fill in required values:

```bash
cp .env.example api/.env
cp .env.example worker/.env
cp .env.example agent/.env
cp .env.example mcp/.env
```

4. Start the development environment:

```bash
make dev          # Run all services
make dev-infra    # Run API, Worker, Agent only (no frontend)
```

## Code Style

### TypeScript (API, App)

| Convention | Value |
|------------|-------|
| Indentation | 2 spaces |
| Line width | 80 characters |
| Quotes | Single quotes |
| Trailing commas | es5 style |
| Variables/Functions | `camelCase` |
| Types/Classes | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` |
| Database tables | `snake_case` |

### Python (Worker, Agent, MCP)

| Convention | Value |
|------------|-------|
| Indentation | 4 spaces |
| Line width | 88 characters (ruff default) |
| Quotes | Single quotes or f-strings |
| Variables/Functions | `snake_case` |
| Classes | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` |

## Per-Service Guidelines

### API Service (`api/`)

**Language:** TypeScript (strict mode)  
**Runtime:** Bun  
**Framework:** Hono + Drizzle ORM

```bash
cd api

bun run lint        # Check code style
bun run format     # Format code
bun run typecheck  # TypeScript type checking
bun test           # Run tests
```

### Worker Service (`worker/`)

**Language:** Python 3.12+  
**Framework:** FastAPI + OpenCV

```bash
cd worker

uv run ruff check .        # Lint
uv run ruff format --check .  # Format check
uv run mypy .              # Type checking
uv run pytest              # Run tests
```

### Agent Service (`agent/`)

**Language:** Python 3.12+  
**Framework:** FastAPI + LangGraph

```bash
cd agent

uv run ruff check .       # Lint
uv run ruff format --check .  # Format check
```

### MCP Service (`mcp/`)

**Language:** Python 3.12+  
**Framework:** FastMCP

```bash
cd mcp

uv run ruff check .       # Lint
uv run ruff format --check .  # Format check
```

### App Service (`app/`)

**Language:** TypeScript  
**Framework:** React 19 + Vite + TanStack

```bash
cd app

bun run lint        # Check code style
bun run format     # Format code
bun run typecheck  # TypeScript type checking
```

## Git Workflow

### Branch Naming

Use descriptive branch names with a type prefix:

```
feature/add-document-chat
fix/signature-upload-validation
refactor/api-error-handling
docs/update-api-endpoints
chore/update-dependencies
```

### Commit Messages

- Use clear, concise descriptions of what changed and why.
- Write in the imperative mood (e.g., "Add validation" not "Added validation").
- Reference issues or pull requests where applicable.

### Pull Requests

1. Create a feature branch from `main`.
2. Make your changes following the code style and verification requirements.
3. Open a pull request with a clear description of the changes.
4. Ensure all verification commands pass before requesting review.
5. Address feedback and push updates to the same branch.
6. Once approved, the maintainer will merge the PR.

## Docker Guidelines

When adding or modifying Docker configurations:

- **Port consistency.** Follow the established port mapping:
  - API: `3000`
  - Worker: `8000`
  - Agent: `8001`
  - App: `5173`
- **Healthchecks.** Add or update healthcheck definitions for any new services.
- **Non-root execution.** Run containers as non-root users where possible.
- **Environment variables.** Pass secrets via environment variable interpolation from a `.env` file, not hardcoded values.
- **Network isolation.** New services should join the existing `medcurial` bridge network.
- **`.dockerignore`.** Keep Dockerfiles lean by excluding unnecessary files (e.g., `node_modules`, `__pycache__`, `.git`).

## Verification Requirements

Before opening a pull request, run the verification commands for the service(s) you modified:

| Service | Commands |
|---------|----------|
| API | `bun run lint && bun run format && bun run typecheck` |
| Worker | `uv run ruff check . && uv run ruff format --check . && uv run mypy .` |
| Agent | `uv run ruff check . && uv run ruff format --check .` |
| MCP | `uv run ruff check . && uv run ruff format --check .` |
| App | `bun run lint && bun run format && bun run typecheck` |

If you modified multiple services, run verification for each one.

## Testing

Run service-specific tests before submitting a pull request:

```bash
# API
cd api && bun test

# Worker
cd worker && uv run pytest

# Agent
# Manual testing with curl commands (see Testing section in README)
```

### Manual Testing Examples

Test signature enrollment:

```bash
curl -X POST \
  'http://localhost:8000/workers/enroll-signature?signatory_name=Test%20User' \
  -H 'accept: application/json' \
  -F 'files=@assets/test-image.png'
```

Test fraud analysis:

```bash
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{"extracted_text": "sample medical document text"}'
```

Test chat:

```bash
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me recent documents"}'
```

## Documentation

Update documentation when you make changes that affect:

- **API endpoints.** Update the endpoint table in `AGENTS.md` and add descriptions to this file's relevant section.
- **Environment variables.** Update `.env.example` and document new variables in the relevant service README.
- **Service configuration.** Update the service README in the modified directory.
- **Features.** Update the Features section in the root `README.md`.

When adding a new service or significant component, create or update the corresponding `README.md` and `AGENTS.md` entries.

## Code Review Expectations

- Changes should be focused and minimal — avoid unrelated refactoring in the same PR.
- Code should be readable and self-documenting. Add comments only when explaining non-obvious logic.
- Follow existing conventions in the codebase. If you're unsure, look at similar code in the same file or service.
- Tests are encouraged for new features and bug fixes.

## License

By contributing to Medcurial, you agree that your contributions will be licensed under the MIT License.
