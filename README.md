# Medcurial - AI Fraud Detection

A signature verification system that uses AI to detect fraudulent signatures in medical documents. Built with a multi-service architecture.

<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/1f86c990-89cb-48e1-88d9-0739b2f995fe" />

## Tech Stack

| Service | Technology |
|---------|------------|
| API | TypeScript, Bun, Hono, Drizzle ORM, PostgreSQL |
| Worker | Python, FastAPI, OpenCV, Supabase |
| Agent | Python, FastAPI, LangGraph, Ollama Cloud |
| MCP | Python, FastMCP |
| App | React 19, TanStack Query, Vite |

## Prerequisites

- **Node.js** 18+
- **Bun**
- **Python** 3.12+
- **PostgreSQL** Database (Neon)
- **Supabase** Account (for storage)
- **Ollama Cloud** Account (for chat LLM)
- **HuggingFace** Account (for fraud detection model)

## Project Structure

```
medcurial/
├── api/           # TypeScript REST API (Bun + Hono + Drizzle)
├── worker/        # Python image processing (FastAPI + OpenCV)
├── agent/         # Python AI agent (FastAPI + LangGraph)
├── mcp/           # Python MCP server (FastMCP)
├── app/           # React frontend (Vite + TanStack)
├── assets/        # Test signature images
├── Makefile       # Development commands
└── AGENTS.md      # Agent guidelines
```

## Installation & Setup

### All Services (using Makefile)

```bash
make install
```

### Individual Services

**API**

```bash
cd api && bun install
```

**Worker**

```bash
cd worker && uv sync
```

**Agent**

```bash
cd agent && uv sync
```

**MCP**

```bash
cd mcp && uv sync
```

**App**

```bash
cd app && bun install
```

## Environment Variables

### API (`api/.env`)

```bash
DATABASE_URL=postgresql://username:password@host:port/database
AGENT_URL=http://localhost:8001
```

### Worker (`worker/.env`)

```bash
API_URL=http://localhost:3000/api/v1
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
ROBOFLOW_API_KEY=your_roboflow_key
ROBOFLOW_API_URL=https://api.roboflow.com
ROBOFLOW_WORKSPACE_NAME=your_workspace
ROBOFLOW_WORKSPACE_ID=your_workspace_id
```

### Agent (`agent/.env`)

```bash
OLLAMA_API_KEY=your_ollama_api_key
HF_TOKEN=your_huggingface_token
HF_BASE_URL=https://router.huggingface.co/v1
API_BASE_URL=http://localhost:3000/api/v1
```

### MCP (`mcp/.env`)

```bash
API_BASE_URL=http://localhost:3000/api/v1
```

## Running the Application

### Using Makefile

```bash
make dev          # Run all services
make dev-infra    # Run API, Worker, Agent (no frontend)
make dev-api      # API only (port 3000)
make dev-worker   # Worker only (port 8000)
make dev-agent    # Agent only (port 8001)
make dev-app      # App only (port 5173)
make dev-mcp      # MCP (stdio mode)
```

### Individual Services

**API**

```bash
cd api && bun run dev
```

**Worker**

```bash
cd worker && uv run fastapi dev app/
```

**Agent**

```bash
cd agent && uv run uvicorn src.main:app --reload --port 8001
```

**MCP** (SSE mode on port 8002)

```bash
cd mcp && uv run fastmcp run main.py --transport sse --port 8002
```

**App**

```bash
cd app && bun run dev
```

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| API | 3000 | REST API for data management |
| Worker | 8000 | Image processing & Supabase storage |
| Agent | 8001 | AI fraud detection & chat |
| MCP | 8002 | External tool access for AI agents (SSE mode) |
| App | 5173 | React frontend application |

## Features

### Signature Management
- Upload and enroll signature images
- OpenCV image preprocessing
- Siamese network preparation (220x155 grayscale)
- Supabase storage

### Document Processing
- OCR text extraction via Roboflow
- Fraud analysis via AI agent
- Document status tracking

### AI Chat
- General chat with global context
- Document-specific chat with context
- LLM model selection via header (X-LLM-Model)
- Session-based conversation history
- Auto-generated chat titles via Qwen

### MCP Integration
- Query documents with pagination
- Get document by ID
- Get fraud analysis
- Query signatures

## Database Schema

| Table | Key Fields |
|-------|-----------|
| `signatures` | id (nanoid), name, imageUrls (jsonb), status |
| `documents` | id (nanoid), name, extractedText, fraudAnalysis (jsonb), status |
| `chat_sessions` | id (nanoid), title, documentId (FK), userId (FK) |
| `chat_messages` | id (nanoid), sessionId (FK), role ("user"/"assistant"), content |

### Image Storage Structure (Supabase)

```
signatures/
├── reference/{signatory_name}/    # Original uploads
└── processed/{signatory_name}/
    ├── roi/                        # ROI visualization
    ├── normalized/                 # Prepared for siamese
    ├── siamese/                    # 220x155 grayscale
    └── image_preview/              # Inverted for display
```

## Verification Commands

Always run these before submitting code changes:

### API
```bash
cd api && bun run lint && bun run format && bun run typecheck
```

### Worker
```bash
cd worker && uv run ruff check . && uv run ruff format --check . && uv run mypy .
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

## Available LLM Models

The Agent service supports multiple chat models via Ollama Cloud:

| Model | Description |
|-------|-------------|
| minimax-2.5 | Default chat model |
| minimax-2.7 | Enhanced reasoning |
| minimax-m2.1 | Previous version |
| cogito-2.1 | Reasoning-focused |
| gemini-flash | Fast responses |
| kimi-k2.5 | Analysis tasks |

Use via header: `X-LLM-Model: minimax-2.5`

## Testing

### Test Enroll-Signature

```bash
curl -X POST \
  'http://localhost:8000/workers/enroll-signature?signatory_name=Marlon%20Martin' \
  -H 'accept: application/json' \
  -F 'files=@assets/marlon-martin-signatures/image1.jfif'
```

### Test Agent Analyze

```bash
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{"extracted_text": "sample medical document text"}'
```

### Test Chat

```bash
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me recent documents"}'
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Database connection failed** | Ensure `DATABASE_URL` is set in `api/.env` |
| **Supabase upload fails** | Check `SUPABASE_URL` and `SUPABASE_KEY` in worker `.env` |
| **Agent returns 502** | Ensure Agent service is running on port 8001 |
| **MCP tools not available** | Use SSE mode: `uv run fastmcp run main.py --transport sse --port 8002` |
| **Image processing slow** | Ensure sufficient memory; OpenCV is CPU-intensive |

### Port Conflicts

If you get port conflicts, stop other services:
```bash
# Find process using a port
lsof -i :3000  # API
lsof -i :8000  # Worker
lsof -i :8001  # Agent
lsof -i :8002  # MCP
lsof -i :5173  # App
```

## Documentation

- [AGENTS.md](./AGENTS.md) - Detailed guidelines for AI agents

## License

MIT
