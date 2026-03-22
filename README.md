# Medcurial - AI Fraud Detection

A signature verification system that uses AI to detect fraudulent signatures in medical documents. Built with a multi-service architecture.

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

**MCP** (stdio mode)

```bash
cd mcp && uv run python main.py
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
| MCP | stdio | External tool access for AI agents |
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

## Documentation

- [AGENTS.md](./AGENTS.md) - Detailed guidelines for AI agents

## License

MIT