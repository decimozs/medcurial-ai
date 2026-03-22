# Medcurial Agent Guidelines

This document provides guidelines for AI agents working on the Medcurial codebase.

## Project Overview

**Medcurial** is an AI-powered medical fraud detection system with a multi-service architecture. It enables:
- Signature enrollment and verification
- Document processing and OCR
- AI-driven fraud detection analysis
- Interactive chat assistants for document analysis

## Project Structure

```
medcurial/
├── api/           # TypeScript REST API (Bun + Hono + Drizzle)
├── worker/        # Python image processing (FastAPI + OpenCV)
├── agent/         # Python AI agent (FastAPI + LangGraph)
├── mcp/           # Python MCP server (FastMCP)
├── app/           # React frontend (Vite + TanStack)
└── assets/        # Test signature images
```

## Services Summary

| Service | Port | Language | Framework | Purpose |
|---------|------|----------|-----------|---------|
| `api/` | 3000 | TypeScript | Bun + Hono | REST API, database management |
| `worker/` | 8000 | Python | FastAPI | Image processing, Supabase storage |
| `agent/` | 8001 | Python | FastAPI + LangGraph | AI fraud detection, chat |
| `mcp/` | stdio | Python | FastMCP | External tool access for AI agents |
| `app/` | 5173 | TypeScript | React + Vite | Frontend application |

---

## Service Connections

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    App      │────▶│     API     │◀────│   Worker    │
│  (React)    │     │  (Hono)     │     │  (FastAPI)  │
│   :5173     │     │   :3000     │     │   :8000     │
└─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          │                    │
                          ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │    Agent    │     │  Supabase   │
                    │ (LangGraph) │     │  (Storage)  │
                    │   :8001     │     └─────────────┘
                    └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │     MCP     │
                    │  (FastMCP)  │
                    └─────────────┘
```

---

## Shared Resources

| Resource | Provider | Purpose |
|----------|----------|---------|
| Database | Neon PostgreSQL | Persistent data storage |
| Storage | Supabase | File storage (signatures, documents) |
| LLM (Chat) | Ollama Cloud | Chat models (minimax, cogito, gemini, kimi) |
| LLM (Fraud) | HuggingFace | Qwen model for fraud detection |

---

## Development Commands

### Root Commands (Makefile)

```bash
# Install all dependencies
make install

# Run all services in development
make dev

# Run infrastructure services only (no frontend)
make dev-infra

# Run individual services
make dev-api      # API (port 3000)
make dev-app      # App (port 5173)
make dev-worker   # Worker (port 8000)
make dev-agent    # Agent (port 8001)
make dev-mcp      # MCP (stdio mode)

# Clean and reinstall
make clean
```

### Running Services Individually

```bash
# Terminal 1 - API
cd api && bun run dev

# Terminal 2 - Worker
cd worker && uv run fastapi dev app/

# Terminal 3 - Agent
cd agent && uv run uvicorn src.main:app --reload --port 8001

# Terminal 4 - App
cd app && bun run dev
```

---

## Verification Commands

Before submitting code changes, always run the appropriate verification commands for the service you modified.

### API Service

```bash
cd api
bun run lint
bun run format
bun run typecheck
```

### Worker Service

```bash
cd worker
uv run ruff check .
uv run ruff format --check .
uv run mypy .
```

### Agent Service

```bash
cd agent
uv run ruff check .
uv run ruff format --check .
```

### App Service

```bash
cd app
bun run lint
bun run format
bun run typecheck
```

---

## API Service (api/)

**Language:** TypeScript (strict mode)  
**Runtime:** Bun  
**Framework:** Hono  
**Database:** PostgreSQL with Drizzle ORM

### Database Schemas

#### Table: `signatures`

| Field | Type | Description |
|-------|------|-------------|
| `id` | text (PK) | Auto-generated nanoid |
| `no` | serial | Auto-increment number |
| `name` | text | Signatory name |
| `status` | text | Processing status |
| `imageUrls` | jsonb | Object containing all image URLs by type |
| `createdAt` | timestamp | Auto-generated timestamp |
| `updatedAt` | timestamp | Auto-updated timestamp |

#### Table: `documents`

| Field | Type | Description |
|-------|------|-------------|
| `id` | text (PK) | Auto-generated nanoid |
| `no` | serial | Auto-increment number |
| `name` | text | Document name |
| `status` | text | Processing status |
| `imageUrls` | jsonb | Document image URLs |
| `extractedText` | text | OCR extracted text |
| `fraudAnalysis` | jsonb | Fraud detection results |
| `createdAt` | timestamp | Auto-generated timestamp |
| `updatedAt` | timestamp | Auto-updated timestamp |

#### Table: `chat_sessions`

| Field | Type | Description |
|-------|------|-------------|
| `id` | text (PK) | Auto-generated nanoid |
| `no` | serial | Auto-increment number |
| `title` | text | Session title |
| `documentId` | text (FK) | Optional link to document |
| `createdAt` | timestamp | Auto-generated timestamp |
| `updatedAt` | timestamp | Auto-updated timestamp |

#### Table: `chat_messages`

| Field | Type | Description |
|-------|------|-------------|
| `id` | text (PK) | Auto-generated nanoid |
| `sessionId` | text (FK) | Reference to chat_sessions |
| `role` | text | "user" or "assistant" |
| `content` | text | Message content |
| `createdAt` | timestamp | Auto-generated timestamp |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/signatures` | List all signatures |
| GET | `/api/v1/signatures/:id` | Get signature by ID |
| POST | `/api/v1/signatures` | Create signature |
| PUT | `/api/v1/signatures/:id` | Update signature |
| DELETE | `/api/v1/signatures/:id` | Delete signature |
| GET | `/api/v1/documents` | List all documents |
| GET | `/api/v1/documents/:id` | Get document by ID |
| POST | `/api/v1/documents` | Create document |
| PUT | `/api/v1/documents/:id` | Update document |
| PATCH | `/api/v1/documents/:id/fraud-analysis` | Update fraud analysis |
| DELETE | `/api/v1/documents/:id` | Delete document |
| GET | `/api/v1/chat` | List chat sessions |
| GET | `/api/v1/chat/search` | Search chats |
| GET | `/api/v1/chat/:id` | Get session with messages |
| POST | `/api/v1/chat` | Create chat session |
| POST | `/api/v1/chat/:id/messages` | Send message |
| DELETE | `/api/v1/chat/:id` | Delete chat session |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `AGENT_URL` | No | `http://localhost:8001` | Agent service URL |

---

## Worker Service (worker/)

**Language:** Python 3.12+  
**Framework:** FastAPI  
**Image Processing:** OpenCV  
**Key Dependencies:** fastapi, nanoid, opencv-contrib-python, supabase, httpx

### Image Processing Pipeline

The `SignatureProcessor` handles signature image preprocessing:

1. **Decode** - Convert bytes to numpy array
2. **Grayscale** - Convert to grayscale
3. **Blur** - Apply Gaussian blur
4. **Threshold** - Adaptive thresholding (binary)
5. **Morphology** - Open and close operations
6. **Contour filtering** - Filter by connected component area
7. **ROI extraction** - Crop signature region
8. **Visualization** - Generate RGB image with contours
9. **Siamese preparation** - Resize to 220x155 grayscale

**Siamese Network Size:** 220 x 155 pixels (width x height)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/workers/enroll-signature` | Enroll signature images |
| POST | `/workers/document-analysis` | Analyze document images |

### Supabase Storage Structure

```
signatures/
├── reference/
│   └── {signatory_name}/
│       └── {nanoid}.png     # Original images
└── processed/
    └── {signatory_name}/
        ├── roi/             # ROI visualization
        ├── normalized/       # Prepared for siamese
        ├── siamese/         # 220x155 grayscale
        └── image_preview/   # Inverted for display
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_URL` | Yes | `http://localhost:3000/api/v1` | API service URL |
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_KEY` | Yes | - | Supabase anon key |
| `ROBOFLOW_API_KEY` | Yes | - | Roboflow API key |
| `ROBOFLOW_API_URL` | Yes | - | Roboflow API URL |
| `ROBOFLOW_WORKSPACE_NAME` | Yes | - | Roboflow workspace name |
| `ROBOFLOW_WORKSPACE_ID` | Yes | - | Roboflow workspace ID |

### Testing Enroll-Signature Endpoint

```bash
curl -X POST \
  'http://localhost:8000/workers/enroll-signature?signatory_name=Marlon%20Martin' \
  -H 'accept: application/json' \
  -F 'files=@assets/marlon-martin-signatures/image1.jfif'
```

---

## Agent Service (agent/)

**Language:** Python 3.12+  
**Framework:** FastAPI + LangGraph  
**LLM Providers:** Ollama Cloud, HuggingFace

### LangGraph Workflow

```
START → formatter → fraud_detector → ranking → auditor → END
```

The fraud detection pipeline consists of specialized agents:
1. **Formatter** - Formats raw OCR text for analysis
2. **Fraud Detector** - Identifies potential fraud indicators
3. **Ranking** - Ranks and categorizes findings
4. **Auditor** - Final review and verdict

### Available LLM Models

#### Chat Models (Ollama Cloud)

| Model Name | Ollama ID | Use Case |
|------------|------------|----------|
| `minimax-2.5` | `minimax-m2.5:cloud` | Default chat model |
| `minimax-2.7` | `minimax-m2.7:cloud` | Enhanced reasoning |
| `minimax-m2.1` | `minimax-m2.1:cloud` | Previous version |
| `cogito-2.1` | `cogito-2.1` | Reasoning-focused |
| `gemini-flash` | `gemini-flash-preview` | Fast responses |
| `kimi-k2.5` | `kimi-k2:cloud` | Analysis tasks |

#### Fraud Detection Model (HuggingFace)

| Model Name | Provider | Use Case |
|------------|----------|----------|
| `Qwen2.5-1.5B-Instruct` | HuggingFace | Title generation, fraud analysis |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/analyze` | Analyze document text for fraud |
| POST | `/chat` | Chat with AI assistant |
| POST | `/chat/title` | Generate chat session title |

### Chat Context Types

The agent supports different chat contexts:
- **General Chat** - Uses global context (all documents, signatures)
- **Document Chat** - Uses document-specific context (extracted text, fraud analysis)

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OLLAMA_API_KEY` | Yes | - | Ollama Cloud API key |
| `HF_TOKEN` | Yes | - | HuggingFace token |
| `HF_BASE_URL` | Yes | `https://router.huggingface.co/v1` | HuggingFace router URL |
| `API_BASE_URL` | No | `http://localhost:3000/api/v1` | API service URL |

---

## MCP Service (mcp/)

**Language:** Python 3.12+  
**Framework:** FastMCP  
**Mode:** stdio (for AI agent integration)

### Available Tools

| Tool | Description |
|------|-------------|
| `query_documents` | Query documents with pagination and status filter |
| `get_document` | Get a specific document by ID |
| `get_fraud_analysis` | Get fraud analysis for a document |
| `query_signatures` | Query signatures with pagination and name filter |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_BASE_URL` | No | `http://localhost:3000/api/v1` | API service URL |

### Running MCP

```bash
cd mcp && uv run python main.py
```

---

## App Service (app/)

**Language:** TypeScript  
**Framework:** React 19 + Vite  
**State Management:** TanStack Query, Zustand  
**Styling:** Tailwind CSS + shadcn/ui

### Routes

| Path | Description |
|------|-------------|
| `/` | Dashboard |
| `/signatures` | Signature list |
| `/signatures/:id` | Signature detail |
| `/documents` | Document list |
| `/documents/:id` | Document detail with fraud analysis |
| `/enrollment` | Signature enrollment |
| `/enroll-documents` | Document enrollment |
| `/chat` | Chat sessions list |
| `/chat/:id` | Chat conversation |

### Key Components

| Component | Purpose |
|-----------|---------|
| `document-chat-panel.tsx` | Chat assistant for document analysis |
| `fraud-analysis-panel.tsx` | Display fraud detection results |
| `signature-sidebar.tsx` | Signature navigation |
| `document-sidebar.tsx` | Document navigation |
| `enrollment-form.tsx` | Upload signature images |

---

## Code Style Guidelines

### TypeScript (API, App)

- **Indentation:** 2 spaces
- **Line width:** 80 characters
- **Quotes:** Single quotes
- **Trailing commas:** es5 style
- **Naming:**
  - Files: `snake_case.ts`
  - Variables/functions: `camelCase`
  - Classes/Types: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Database tables: `snake_case`

### Python (Worker, Agent, MCP)

- **Indentation:** 4 spaces
- **Line width:** 88 characters (ruff default)
- **Quotes:** Single quotes or f-strings
- **Naming:**
  - Files: `snake_case.py`
  - Variables/functions: `snake_case`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`

### General Principles

- **Never hardcode sensitive values** - use environment variables
- **Validate configuration at startup** - fail fast on misconfiguration
- **Use appropriate HTTP status codes**:
  - `400` for bad requests / validation errors
  - `404` for not found
  - `500` for internal server errors
  - `502` for external API failures

---

## Error Handling

### API Service

- Use error middleware for consistent responses
- Log errors with `console.error()` before returning
- JSON error format: `{ "error": "message" }`

```typescript
if (!data) {
  return c.json({ error: "Not found" }, 404);
}

try {
  // operation
} catch (error) {
  console.error("Error:", error);
  return c.json({ error: "Internal error" }, 500);
}
```

### Python Services

- Use custom exception classes inheriting from a base exception
- Validate configuration at startup

```python
class ProcessingError(Exception):
    def __init__(self, message: str = "Error"):
        super().__init__(message)
```

---

## Testing

### API

```bash
cd api
bun test
bun test test/file.test.ts
```

### Worker

```bash
cd worker
uv run pytest
uv run pytest tests/test_file.py
```

### Agent

```bash
# Test analyze endpoint
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{"extracted_text": "sample text"}'

# Test chat endpoint
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me recent documents"}'
```

---

## Troubleshooting

### Common Issues

1. **API not connecting to Agent**
   - Check `AGENT_URL` environment variable in API
   - Verify Agent service is running on port 8001

2. **Worker not uploading to Supabase**
   - Verify `SUPABASE_URL` and `SUPABASE_KEY`
   - Check Supabase bucket permissions

3. **MCP tools not working**
   - Verify `API_BASE_URL` is correct
   - Check API service is running

4. **LLM timeout errors**
   - Check network connectivity to Ollama/HuggingFace
   - Increase `LLM_TIMEOUT` in agent config
