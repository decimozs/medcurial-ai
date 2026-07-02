# Medcurial Agent Guidelines

This document provides guidelines for AI agents working on the Medcurial codebase.

## Project Overview

**Medcurial** is an AI-powered medical fraud detection system with multi-service architecture:

| Service | Port | Language | Framework | Purpose |
|---------|------|----------|-----------|---------|
| API | 3000 | TypeScript | Bun + Hono + Drizzle | REST API, auth, database |
| Worker | 8000 | Python | FastAPI | Image processing, Roboflow, OpenCV |
| Agent | 8001 | Python | FastAPI + LangGraph | AI fraud detection (LLM) |
| App | 5173 | TypeScript | Vite + TanStack | React frontend |
| MCP | 8002 | Python | FastMCP | Model Context Protocol |
| Model | — | Python | YOLO/ultralytics | Signature detection training |

Each service has its own `AGENTS.md` with deep detail (api, worker). Read those for per-service specifics.

## Development Commands

### Root (Makefile)

```bash
make install    # Install all dependencies (api, worker, agent, mcp, app)
make dev        # Run all services (backgrounds them)
make dev-infra  # Everything except frontend
make dev-api    # API only (3000)
make dev-worker # Worker only (8000)
make dev-agent  # Agent only (8001)
make clean      # Remove caches + venvs, reinstall
```

### Running Services Individually

```bash
cd api && bun run dev                              # Terminal 1
cd worker && uv run fastapi dev app/               # Terminal 2
cd agent && uv run uvicorn src.main:app --reload --port 8001  # Terminal 3
cd app && bun run dev                              # Terminal 4
cd mcp && uv run fastmcp run main.py --transport sse --port 8002  # Terminal 5
```

## Verification Commands (ALWAYS RUN BEFORE COMPLETING WORK)

Order matters: lint → format check → typecheck → test.

### API

```bash
cd api && bun run lint && bun run format && bun run typecheck
bun test                         # Run all tests
bun test test/file.test.ts       # Single test file
```

### Worker

```bash
cd worker
uv run ruff check . && uv run ruff format --check . && uv run mypy .
uv run pytest                    # Run all tests
```

### Agent

```bash
cd agent && uv run ruff check . && uv run ruff format --check .
```

### App

```bash
cd app && bun run lint && bun run format && bun run typecheck
```

### MCP

```bash
cd mcp && uv run ruff check . && uv run ruff format --check .
```

## Service Gotchas

### App: `bun run format` is CHECK-ONLY

`bun run format` = `prettier --check` (read-only). To actually write formatting changes:

```bash
bun run format:fix    # === prettier --write
```

The linter (`bun run lint`) = `eslint .` (not biome like the API).

### API: biomes lint + format are separate

```bash
bun run lint      # biome check (lint + format in one)
bun run format    # biome format --write (actually writes)
bun run typecheck # tsc --noEmit
```

### Database migrations must be APPLIED

Schema changes in code need `bun run generate` then `bun run migrate`. Just generating the migration file is not enough — Drizzle reads the column from the schema but the DB must have it.

```bash
cd api
bun run generate   # Creates migration SQL
bun run migrate    # Applies it to the database
```

### Supabase client is lazy (API)

In `api/src/routes/document.ts`, `getSupabaseClient()` returns `null` when `SUPABASE_URL` or `SUPABASE_KEY` are empty. Tests set a placeholder `DATABASE_URL` to allow import; Supabase-dependent features are skipped during tests.

### clear .mypy_cache on config changes

Stale `.mypy_cache` can hide type errors after editing pyproject.toml or mypy settings. Delete `worker/.mypy_cache/` if you see unexpected type warnings or missing errors.

## Worker Auth Bypass

The worker communicates with the API using the `X-Worker-Key` header (matches `WORKER_API_KEY` env var on both sides).

In `api/src/index.ts`, the `isWorkerRoute` middleware sets `isWorker = true` when:
- Method is `GET | POST | PUT | PATCH`
- Path starts with `/api/v1/signatures` or `/api/v1/documents`
- `X-Worker-Key` header matches `WORKER_API_KEY`

The `protectedRouteMiddleware` (`api/src/middlewares/protected.ts`) bypasses auth when `isWorker` is set. This means **any worker request to signatures/documents routes skips user auth**. When adding worker-called routes, ensure they use `protectedRouteMiddleware` (not manual session checks) so the bypass works.

## CSP Meta Tag (Frontend)

The HTML file `app/index.html` contains a Content-Security-Policy `<meta>` tag. When adding:
- **New image sources** (blob URLs, external CDNs): update `img-src`
- **New API/worker endpoints the frontend calls directly**: update `connect-src`
- **New scripts/styles**: update `script-src` / `style-src`

Currently included: blob previews, Supabase storage, worker port 8000, agent port 8001.

## Signature Verification Pipeline

A key feature implemented in this repo that spans all services:

1. **Enroll signatures** — Worker preprocesses raw images through `SignatureProcessor` (grayscale → threshold → morphology → ROI → siamese 220x155), uploads to Supabase, saves metadata to API.
2. **Document analysis** — Worker sends document to Roboflow which extracts text + signature visualization. The `_extract_signature_crop` function finds the Roboflow bounding-box on the visualization and crops the original document to get a clean signature image. Both visualization and crop are stored as separate Supabase URLs.
3. **Auto-verify** — After document analysis completes, `_auto_verify_signature` fires as a background task:
   - Fetches all enrolled signatures from API
   - Extracts physician name from OCR text (patterns: `Attending Physician:`, `Doctor:`, `Provider:`, `Name:`)
   - Strips title prefixes (`Dr.`, `Prof.`, `Mr.`, etc.) for matching
   - Matches against enrolled signatures by name
   - If match found: **loops over ALL reference siamese images**, compares each against the extracted signature crop, picks best score
   - If no match: sets status `"no_verified_signature"`
   - PATCHes result to API → stored in `documents.signature_verification` jsonb column
4. **Analysis panel** — Frontend renders verification result in the Analysis tab (status badge, score bar, extracted/reference/overlay thumbnail images). Auto-refetches document after 3s (up to 3 retries) to pick up the async auto-verify result.

### Key files

| File | Role |
|------|------|
| `worker/app/routers/worker.py` | Document analysis, auto-verify, signature enrollment |
| `worker/app/services/signature_processor.py` | OpenCV preprocessing pipeline |
| `worker/app/services/signature_analyzer.py` | AKAZE feature matching, SSIM scoring |
| `worker/app/services/storage.py` | Supabase image upload/download |
| `worker/app/services/api_client.py` | API HTTP client (CRUD signatures/docs, PATCH verification) |
| `api/src/routes/document.ts` | Document routes + `PATCH /:id/signature-verification` + `POST /:id/signature-verification` |
| `api/src/schemas/document.ts` | `SignatureVerificationResultSchema`, `SignatureVerificationTriggerSchema` |
| `app/src/features/analysis/components/analysis-content.tsx` | Verification result UI section |
| `app/src/features/review/hooks/use-claim-review.ts` | Auto-refetch after verification |
| `app/index.html` | CSP meta tag (connect-src for worker, img-src for blob) |

### Verification status values

`pending | verified | mismatch | needs_review | failed | no_verified_signature`

## Model Service (YOLO)

Located in `model/`. Not wired into `make dev` — run manually.

```bash
cd model && uv sync
uv run python generate-signature-overlay.py   # Generate synthetic dataset
uv run python split-dataset.py                # Train/val split
```

Gitignored in model/: `.venv/`, `dataset/`, `runs/`, `real_test_samples/`, `*.pt` (model weights).

## Code Style Summary

### TypeScript (API, App)
- 2 spaces, 80 char line width, single quotes, es5 trailing commas
- Path aliases `@/` for local imports
- Files: `snake_case.ts`, vars: `camelCase`, types: `PascalCase`
- API uses biome; App uses eslint + prettier

### Python (Worker, Agent, MCP, Model)
- 4 spaces, 88 char line width (ruff default)
- Absolute imports: `from app.config import Settings`
- Type hints on all params/returns; prefer `Optional[T]` over `T | None`
- `asyncio.to_thread()` for CPU-bound ops (OpenCV)

### Import Order (both languages)
1. Standard library
2. Third-party packages
3. Local application imports

## Database (Drizzle)

| Table | Purpose |
|-------|---------|
| `signatures` | Enrolled signature records (imageUrls jsonb with original/roi/siamese/normalized/image_preview) |
| `documents` | Medical claim documents (extractedText, fraudAnalysis jsonb, **signatureVerification jsonb**) |
| `chat_sessions` | Chat session records |
| `chat_messages` | Individual chat messages (role: user/assistant) |

## General Principles

- Never hardcode sensitive values — use environment variables
- Validate configuration at startup — fail fast
- HTTP status codes: 400 (bad request), 404 (not found), 500 (internal), 502 (external API failure)
- **Run verification commands before completing any work**
