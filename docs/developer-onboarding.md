# Developer Onboarding — Medcurial AI Claims Fraud Detection

---

## 1. Prerequisites

Before setting up the project, ensure you have the following tools installed:

| Tool | Version | Purpose |
|------|---------|---------|
| [Bun](https://bun.sh) | ≥1.0 | JavaScript runtime for API and App services |
| [Python](https://www.python.org) | ≥3.12 | Worker, Agent, and MCP services |
| [uv](https://docs.astral.sh/uv/) | latest | Python package manager |
| [Docker](https://www.docker.com) | ≥24.0 | Container runtime |
| [Docker Compose](https://docs.docker.com/compose/) | ≥2.20 | Multi-service orchestration |
| [Git](https://git-scm.com) | ≥2.40 | Version control |
| [Node.js](https://nodejs.org) | ≥18 | Required by some tooling dependencies |

You will also need accounts and credentials for:

| Service | Purpose |
|---------|---------|
| [Neon](https://neon.tech) | Managed PostgreSQL database |
| [Supabase](https://supabase.com) | Object storage for images |
| [Roboflow](https://roboflow.com) | OCR extraction API |
| [Ollama Cloud](https://ollama.com) | Chat LLM inference |
| [HuggingFace](https://huggingface.co) | Fraud detection model inference |

---

## 2. Environment Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/decimozs/medcurial-ai.git
cd medcurial-ai
```

### 2.2 Configure Environment Variables

Copy the root example file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# PostgreSQL (Neon or local)
DATABASE_URL=postgresql://username:password@host:port/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key

# Roboflow OCR
ROBOFLOW_API_KEY=your_roboflow_api_key
ROBOFLOW_API_URL=https://api.roboflow.com
ROBOFLOW_WORKSPACE_NAME=your_workspace_name
ROBOFLOW_WORKSPACE_ID=your_workspace_id

# Ollama Cloud
OLLAMA_API_KEY=your_ollama_api_key

# HuggingFace
HF_TOKEN=your_huggingface_token
```

> **Security:** Never commit `.env` to version control. It is already listed in `.gitignore`.

---

## 3. Installation

### Option A — Install All Services at Once

```bash
make install
```

This runs the install commands for all services sequentially.

### Option B — Install Services Individually

**API**
```bash
cd api
bun install
```

**App**
```bash
cd app
bun install
```

**Worker**
```bash
cd worker
uv sync
```

**Agent**
```bash
cd agent
uv sync
```

**MCP**
```bash
cd mcp
uv sync
```

---

## 4. Database Setup

Run the Drizzle ORM migrations to set up the database schema:

```bash
cd api
bun run db:migrate
```

To explore the schema interactively:

```bash
bun run db:studio
```

---

## 5. Running the Application

### Option A — Run All Services (recommended)

```bash
make dev
```

### Option B — Run Infrastructure Services Only (no frontend)

```bash
make dev-infra
```

### Option C — Run Services Individually

Open separate terminal windows for each service:

```bash
# Terminal 1 — API (port 3000)
cd api && bun run dev

# Terminal 2 — Worker (port 8000)
cd worker && uv run fastapi dev app/

# Terminal 3 — Agent (port 8001)
cd agent && uv run uvicorn src.main:app --reload --port 8001

# Terminal 4 — App (port 5173)
cd app && bun run dev

# Terminal 5 — MCP (port 8002, optional)
cd mcp && uv run fastmcp run main.py --transport sse --port 8002
```

### Option D — Docker Compose

```bash
docker-compose up --build
```

Service ports:

| Service | Port |
|---------|------|
| API | 3000 |
| Worker | 8000 |
| Agent | 8001 |
| App (frontend) | 5173 |
| MCP | 8002 |

---

## 6. Verification Commands

Run these after setup to confirm each service is working correctly:

### API

```bash
cd api
bun run lint          # Biome linting
bun run format        # Biome formatting check
bun run typecheck     # TypeScript type checking
bun test              # Run all tests
```

### Worker

```bash
cd worker
uv run ruff check .           # Ruff linting
uv run ruff format --check .  # Ruff formatting check
uv run mypy .                 # mypy type checking
uv run pytest                 # Run all tests
```

### Agent

```bash
cd agent
uv run ruff check .
uv run ruff format --check .
```

### App

```bash
cd app
bun run lint          # ESLint
bun run format        # Prettier check
bun run typecheck     # TypeScript type checking
```

### MCP

```bash
cd mcp
uv run ruff check .
uv run ruff format --check .
```

---

## 7. Folder Structure

```
medcurial-ai/
├── api/                          # TypeScript REST API
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── auth.ts               # Authentication config
│   │   ├── db.ts                 # Database connection
│   │   ├── constants.ts          # Environment constants
│   │   ├── routes/               # Route handlers
│   │   ├── schemas/              # Drizzle ORM schemas
│   │   ├── middlewares/          # Auth, logging, error
│   │   └── migrations/           # SQL migrations
│   ├── package.json
│   ├── tsconfig.json
│   ├── biome.json
│   └── drizzle.config.ts
│
├── worker/                       # Python image processing
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   └── pyproject.toml
│
├── agent/                        # Python AI fraud detection
│   ├── src/
│   │   ├── main.py
│   │   ├── graph.py              # LangGraph definition
│   │   ├── state.py
│   │   ├── nodes/                # Formatter, FraudDetector, Ranking, Auditor
│   │   ├── routers/
│   │   ├── tools/
│   │   └── prompts/
│   └── pyproject.toml
│
├── app/                          # React frontend
│   ├── src/
│   │   ├── routes/               # Page components
│   │   ├── features/             # Feature modules
│   │   ├── components/           # Shared UI components
│   │   └── store/
│   ├── package.json
│   └── vite.config.ts
│
├── mcp/                          # MCP server
│   ├── main.py
│   └── pyproject.toml
│
├── docs/                         # Project documentation (this folder)
├── .env.example                  # Environment variable template
├── docker-compose.yml            # Docker orchestration
├── Makefile                      # Development shortcuts
└── README.md
```

---

## 8. Coding Standards

### TypeScript (API, App)

| Standard | Rule |
|----------|------|
| Indentation | 2 spaces |
| Line width | 80 characters |
| Quotes | Single quotes |
| Trailing commas | ES5 style |
| Imports | Use `@/` path alias for local imports |
| Types | Explicit type annotations; avoid `any` |
| File naming | `snake_case.ts` |
| Variable/function naming | `camelCase` |
| Class/Type naming | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` |
| Linter | Biome (enforced in CI) |

### Python (Worker, Agent, MCP)

| Standard | Rule |
|----------|------|
| Indentation | 4 spaces |
| Line width | 88 characters (ruff default) |
| Quotes | Single quotes or f-strings |
| Types | Type hints required for all parameters and return values |
| Optional types | Use `Optional[T]` over `T | None` |
| File naming | `snake_case.py` |
| Variable/function naming | `snake_case` |
| Class naming | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` |
| Linter | Ruff (enforced in CI) |
| Type checker | mypy (worker only) |

### Import Order (Both Languages)

1. Standard library
2. Third-party packages
3. Local application imports

---

## 9. Contribution Guidelines

### Branching Strategy

| Branch Type | Naming Pattern | Example |
|-------------|----------------|---------|
| Feature | `feat/<short-description>` | `feat/signature-comparison` |
| Bug fix | `fix/<short-description>` | `fix/document-status-update` |
| Chore | `chore/<short-description>` | `chore/update-dependencies` |
| Documentation | `docs/<short-description>` | `docs/api-endpoints` |

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]
```

**Examples:**
```
feat(api): add document approval endpoint
fix(worker): handle missing contour in signature processing
docs(onboarding): add environment setup instructions
chore(agent): update LangGraph to 1.2.0
```

### Pull Request Checklist

Before opening a pull request, confirm all of the following:

- [ ] Linting passes (`bun run lint` / `uv run ruff check .`)
- [ ] Formatting passes (`bun run format` / `uv run ruff format --check .`)
- [ ] Type checking passes (`bun run typecheck` / `uv run mypy .`)
- [ ] All tests pass (`bun test` / `uv run pytest`)
- [ ] New features have corresponding tests
- [ ] Environment variables are documented in `.env.example`
- [ ] No secrets or credentials are committed

### Code Review

- At least one approval is required before merging
- All CI checks must pass
- Squash commits are preferred for feature branches
