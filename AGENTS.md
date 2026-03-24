# Medcurial Agent Guidelines

This document provides guidelines for AI agents working on the Medcurial codebase.

## Project Overview

**Medcurial** is an AI-powered medical fraud detection system with multi-service architecture:
- **API** (port 3000): TypeScript REST API with Bun + Hono + Drizzle
- **Worker** (port 8000): Python FastAPI for image processing
- **Agent** (port 8001): Python FastAPI + LangGraph for AI fraud detection
- **App** (port 5173): React frontend with Vite + TanStack

## Development Commands

### Root (Makefile)
```bash
make install    # Install all dependencies
make dev        # Run all services
make dev-infra  # Run infrastructure only (no frontend)
make dev-api    # API only (3000)
make dev-worker # Worker only (8000)
make dev-agent  # Agent only (8001)
```

### Running Services Individually
```bash
cd api && bun run dev           # Terminal 1
cd worker && uv run fastapi dev app/  # Terminal 2
cd agent && uv run uvicorn src.main:app --reload --port 8001  # Terminal 3
cd app && bun run dev           # Terminal 4
```

## Verification Commands (ALWAYS RUN BEFORE COMPLETING WORK)

### API
```bash
cd api && bun run lint && bun run format && bun run typecheck
bun test                    # Run all tests
bun test test/file.test.ts  # Run single test file
```

### Worker
```bash
cd worker
uv run ruff check . && uv run ruff format --check . && uv run mypy .
uv run pytest              # Run all tests
uv run pytest tests/test_file.py::test_function_name  # Single test
```

### Agent
```bash
cd agent && uv run ruff check . && uv run ruff format --check .
```

### App
```bash
cd app && bun run lint && bun run format && bun run typecheck
```

## Code Style Guidelines

### TypeScript (API, App)
- **Indentation:** 2 spaces
- **Line width:** 80 characters
- **Quotes:** Single quotes
- **Trailing commas:** es5 style
- **Imports:** Use path aliases (`@/`) for local imports
- **Types:** Always use explicit type annotations; avoid `any`
- **Naming:** 
  - Files: `snake_case.ts`
  - Variables/functions: `camelCase`
  - Classes/Types: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

### Python (Worker, Agent, MCP)
- **Indentation:** 4 spaces
- **Line width:** 88 characters (ruff default)
- **Quotes:** Single quotes or f-strings
- **Types:** Use type hints for all parameters and return values; prefer `Optional[T]` over `T | None`
- **Naming:**
  - Files: `snake_case.py`
  - Variables/functions: `snake_case`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

### Import Order (Both Languages)
1. Standard library
2. Third-party packages
3. Local application imports

## Error Handling

### TypeScript/Hono
```typescript
if (!data) return c.json({ error: "Not found" }, 404);
try {
  // operation
} catch (error) {
  console.error("Error:", error);
  return c.json({ error: "Internal error" }, 500);
}
```

### Python/FastAPI
```python
class ProcessingError(Exception):
    def __init__(self, message: str = "Error"):
        super().__init__(message)

# Use appropriate HTTP codes: 400 (bad request), 404 (not found), 500 (internal), 502 (external API failure)
```

## General Principles

- **Never hardcode sensitive values** - use environment variables
- **Validate configuration at startup** - fail fast on misconfiguration
- **Use appropriate HTTP status codes**: 400, 404, 500, 502
- **Run verification commands before completing any work**
- **Use proper project structure**: organize by feature/domain, not by type

## Testing Guidelines

- Place tests in `tests/` directory
- Name test files: `test_<module_name>.py` (Python), `<module>.test.ts` (TypeScript)
- Use pytest for Python with `pytest.mark.asyncio` for async tests
- Use Bun's built-in test runner for TypeScript

## Database Schemas

| Table | Key Fields |
|-------|-----------|
| `signatures` | id (nanoid), name, imageUrls (jsonb), status |
| `documents` | id (nanoid), name, extractedText, fraudAnalysis (jsonb) |
| `chat_sessions` | id (nanoid), title, documentId (FK) |
| `chat_messages` | id (nanoid), sessionId (FK), role ("user"/"assistant"), content |

## Key Technical Details

- **Siamese Network Size:** 220 x 155 pixels (width x height)
- **Supabase Storage:** signatures/reference/{name}/ and signatures/processed/{name}/{type}/
- **LangGraph Workflow:** formatter → fraud_detector → ranking → auditor
- **LLM Providers:** Ollama Cloud (chat), HuggingFace (fraud detection)
