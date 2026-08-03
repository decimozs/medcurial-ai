# Code Documentation — Medcurial AI Claims Fraud Detection

---

## 1. Code Structure Overview

The codebase is organised as a **monorepo** with five independently deployable services. Each service follows its own language-idiomatic conventions but shares a consistent philosophy: single-responsibility modules, explicit typing, and separation of routing from business logic.

```
medcurial-ai/
├── api/         TypeScript · Bun · Hono · Drizzle
├── worker/      Python · FastAPI · OpenCV
├── agent/       Python · FastAPI · LangGraph
├── app/         TypeScript · React · Vite · TanStack
└── mcp/         Python · FastMCP
```

---

## 2. Key Modules and Responsibilities

### 2.1 API Service (`api/src/`)

#### `index.ts` — Server Bootstrap

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loggerMiddleware } from '@/middlewares/logger';
import { errorMiddleware } from '@/middlewares/error';
import { routes } from '@/routes';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', loggerMiddleware);
app.onError(errorMiddleware);

// Routes
app.route('/signatures', routes.signature);
app.route('/documents', routes.document);
app.route('/chat', routes.chat);
app.route('/users', routes.user);

export default app;
```

**Responsibility:** Creates the Hono application, registers global middleware, and mounts all route handlers. This is the entry point for every HTTP request.

---

#### `db.ts` — Database Connection

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '@/constants';

const client = postgres(DATABASE_URL);
export const db = drizzle(client);
```

**Responsibility:** Establishes and exports the singleton Drizzle ORM client. Imported wherever database queries are needed.

---

#### `routes/document.ts` — Document Route Handler (excerpt)

```typescript
import { Hono } from 'hono';
import { db } from '@/db';
import { documents } from '@/schemas/document';
import { eq } from 'drizzle-orm';
import { protected } from '@/middlewares/protected';

const route = new Hono();

// List all documents
route.get('/', protected, async (c) => {
  const rows = await db.select().from(documents);
  return c.json(rows);
});

// Get single document
route.get('/:id', protected, async (c) => {
  const { id } = c.req.param();
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) return c.json({ error: 'Document not found' }, 404);
  return c.json(doc);
});

// Approve / reject a document
route.patch('/:id/approve', protected, async (c) => {
  const { id } = c.req.param();
  const { action, notes } = await c.req.json();
  const now = new Date();
  const userId = c.get('user').id;

  if (action === 'approve') {
    await db.update(documents)
      .set({ approvalStatus: 'approved', approvalNotes: notes, approvedAt: now, approvedBy: userId })
      .where(eq(documents.id, id));
  } else {
    await db.update(documents)
      .set({ approvalStatus: 'rejected', approvalNotes: notes, rejectedAt: now, rejectedBy: userId })
      .where(eq(documents.id, id));
  }
  return c.json({ success: true });
});
```

**Responsibility:** Defines all HTTP handlers for the `/documents` resource. Each handler reads from or writes to PostgreSQL via Drizzle and returns JSON responses.

---

#### `schemas/document.ts` — Drizzle ORM Schema

```typescript
import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull().default('pending'),
  imageUrls: jsonb('image_urls'),
  extractedText: text('extracted_text'),
  fraudAnalysis: jsonb('fraud_analysis'),
  approvalStatus: text('approval_status').default('pending'),
  approvalNotes: text('approval_notes'),
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  rejectedBy: text('rejected_by').references(() => users.id),
  fiuStatus: text('fiu_status').default('pending'),
  fiuNotes: text('fiu_notes'),
  fiuInvestigatedAt: timestamp('fiu_investigated_at'),
  fiuInvestigatedBy: text('fiu_investigated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Responsibility:** Declares the `documents` table structure used by Drizzle ORM. This is the single source of truth for the table schema — migrations are generated from these definitions.

---

#### `middlewares/protected.ts` — Auth Guard

```typescript
import { createMiddleware } from 'hono/factory';
import { auth } from '@/auth';

export const protected = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'Unauthorised' }, 401);
  c.set('user', session.user);
  await next();
});
```

**Responsibility:** Validates the session token on every protected route. Attaches the user object to the request context so downstream handlers can access the authenticated user without re-querying the database.

---

### 2.2 Worker Service (`worker/app/`)

#### `services/signature_processor.py` — OpenCV Pipeline (excerpt)

```python
import cv2
import numpy as np
from typing import Optional

class SignatureProcessor:
    """Processes raw signature images through a five-stage OpenCV pipeline."""

    def process(self, image_bytes: bytes) -> dict[str, np.ndarray]:
        """
        Accepts raw image bytes and returns a dict of processed variants.

        Returns:
            {
                "original": np.ndarray,
                "roi": np.ndarray,
                "normalized": np.ndarray,
                "siamese": np.ndarray,   # 220x155 pixels
                "image_preview": np.ndarray,
            }
        """
        img = self._load(image_bytes)
        gray = self._to_grayscale(img)
        blurred = self._apply_blur(gray)
        binary = self._threshold(blurred)
        morphed = self._apply_morphology(binary)
        roi = self._extract_roi(morphed, img)
        normalized = self._normalize(roi)
        siamese = cv2.resize(normalized, (220, 155))
        preview = self._create_preview(roi)

        return {
            "original": img,
            "roi": roi,
            "normalized": normalized,
            "siamese": siamese,
            "image_preview": preview,
        }

    def _to_grayscale(self, img: np.ndarray) -> np.ndarray:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    def _apply_blur(self, img: np.ndarray) -> np.ndarray:
        return cv2.GaussianBlur(img, (5, 5), 0)

    def _threshold(self, img: np.ndarray) -> np.ndarray:
        return cv2.adaptiveThreshold(
            img, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            11, 2
        )

    def _apply_morphology(self, img: np.ndarray) -> np.ndarray:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        return cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)

    def _extract_roi(self, binary: np.ndarray, original: np.ndarray) -> np.ndarray:
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return original
        x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
        return original[y:y+h, x:x+w]
```

**Responsibility:** Core image processing logic. Transforms a raw signature scan into five standardised variants used for storage, display, and machine comparison.

---

#### `services/storage.py` — Supabase Upload (excerpt)

```python
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY

class StorageService:
    """Handles all Supabase object storage operations."""

    def __init__(self) -> None:
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    async def upload_image(
        self,
        bucket: str,
        path: str,
        image_bytes: bytes,
        content_type: str = 'image/png'
    ) -> str:
        """
        Uploads an image to Supabase Storage and returns its public URL.

        Args:
            bucket: Storage bucket name (e.g., 'signatures')
            path:   Object path within the bucket
            image_bytes: Raw image bytes to upload
            content_type: MIME type of the image

        Returns:
            Public URL of the uploaded object
        """
        self.client.storage.from_(bucket).upload(
            path=path,
            file=image_bytes,
            file_options={'content-type': content_type}
        )
        return self.client.storage.from_(bucket).get_public_url(path)
```

**Responsibility:** Abstracts all Supabase Storage operations behind a clean interface. Handles upload and URL generation for every processed image variant.

---

### 2.3 Agent Service (`agent/src/`)

#### `graph.py` — LangGraph Workflow Definition (excerpt)

```python
from langgraph.graph import StateGraph, END
from src.state import AgentState
from src.nodes.formatter import formatter_node
from src.nodes.fraud_detector import fraud_detector_node
from src.nodes.ranking import ranking_node
from src.nodes.auditor import auditor_node

def build_graph() -> StateGraph:
    """
    Builds and compiles the fraud detection LangGraph workflow.

    Pipeline: formatter → fraud_detector → ranking → auditor → END
    """
    graph = StateGraph(AgentState)

    graph.add_node('formatter', formatter_node)
    graph.add_node('fraud_detector', fraud_detector_node)
    graph.add_node('ranking', ranking_node)
    graph.add_node('auditor', auditor_node)

    graph.set_entry_point('formatter')
    graph.add_edge('formatter', 'fraud_detector')
    graph.add_edge('fraud_detector', 'ranking')
    graph.add_edge('ranking', 'auditor')
    graph.add_edge('auditor', END)

    return graph.compile()

fraud_detection_graph = build_graph()
```

**Responsibility:** Defines and compiles the LangGraph directed acyclic graph (DAG). Each node is an async function that receives the shared `AgentState` and returns a partial state update. The graph is compiled once at startup and reused per request.

---

#### `state.py` — Graph State

```python
from typing import Optional
from langgraph.graph import MessagesState

class AgentState(MessagesState):
    """Shared state passed between all LangGraph nodes."""
    raw_text: str                  # Original OCR text input
    formatted_text: str            # Output from Formatter node
    is_fraud: Optional[bool]       # Output from Fraud Detector node
    confidence: Optional[float]    # Fraud confidence score (0.0–1.0)
    risk_level: Optional[str]      # Output from Ranking node
    findings: list[str]            # Individual fraud indicators
    summary: Optional[str]         # Output from Auditor node
```

**Responsibility:** Defines the typed data structure that flows through the pipeline. Each node reads input fields and writes output fields to this state object.

---

### 2.4 App (`app/src/`)

#### `store/useStore.ts` — Global State

```typescript
import { create } from 'zustand';

interface AppState {
  selectedDocumentId: string | null;
  setSelectedDocumentId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedDocumentId: null,
  setSelectedDocumentId: (id) => set({ selectedDocumentId: id }),
}));
```

**Responsibility:** Zustand store for lightweight client-side state that does not belong in URL params or server state. Server state (fetched data) is managed by TanStack Query.

---

#### Feature Module Structure

Each feature in `app/src/features/` follows this pattern:

```
features/documents/
├── components/       # UI components specific to this feature
│   ├── DocumentCard.tsx
│   ├── DocumentList.tsx
│   └── FraudAnalysisReport.tsx
├── hooks/            # TanStack Query hooks
│   ├── useDocuments.ts
│   └── useDocument.ts
├── api/              # API call functions
│   └── documents.ts
└── index.ts          # Public exports
```

**Responsibility:** Keeps each business domain self-contained. Route components import from feature modules; feature modules do not import from other feature modules.

---

## 3. Naming Conventions

### TypeScript

| Entity | Convention | Example |
|--------|-----------|---------|
| Files | `snake_case.ts` | `signature_processor.ts` |
| Variables | `camelCase` | `documentId`, `fraudAnalysis` |
| Functions | `camelCase` | `getDocumentById()` |
| React Components | `PascalCase` | `DocumentCard`, `FraudReport` |
| Types / Interfaces | `PascalCase` | `DocumentSchema`, `UserRole` |
| Constants | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `MAX_FILE_SIZE` |
| Path aliases | `@/` prefix | `@/routes/document` |

### Python

| Entity | Convention | Example |
|--------|-----------|---------|
| Files | `snake_case.py` | `signature_processor.py` |
| Variables | `snake_case` | `signatory_name`, `image_bytes` |
| Functions | `snake_case` | `process_image()`, `upload_to_supabase()` |
| Classes | `PascalCase` | `SignatureProcessor`, `StorageService` |
| Constants | `UPPER_SNAKE_CASE` | `SUPABASE_URL`, `SIAMESE_WIDTH` |
| Type hints | `Optional[T]` for nullable | `Optional[str]`, `Optional[float]` |

---

## 4. Error Handling Patterns

### TypeScript (Hono)

```typescript
// Inline 404
if (!document) return c.json({ error: 'Document not found' }, 404);

// Try/catch for unexpected errors
try {
  const result = await externalService.call();
  return c.json(result);
} catch (error) {
  console.error('External service failed:', error);
  return c.json({ error: 'Internal error' }, 500);
}
```

### Python (FastAPI)

```python
from fastapi import HTTPException

class ProcessingError(Exception):
    def __init__(self, message: str = 'Processing failed') -> None:
        super().__init__(message)

# In a route handler
@router.post('/workers/enroll-signature')
async def enroll_signature(signatory_name: str, file: UploadFile) -> dict:
    try:
        result = await processor.process(await file.read())
        return result
    except ProcessingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail='Internal server error')
```

---

## 5. Environment Variable Access

### TypeScript (API)

Environment variables are parsed once in `constants.ts` and imported elsewhere:

```typescript
// api/src/constants.ts
export const DATABASE_URL = process.env.DATABASE_URL!;
export const SUPABASE_URL = process.env.SUPABASE_URL!;

// Usage
import { DATABASE_URL } from '@/constants';
```

### Python (Worker / Agent / MCP)

Environment variables are loaded in `config.py` using `os.environ`:

```python
# worker/app/config.py
import os

SUPABASE_URL: str = os.environ['SUPABASE_URL']
SUPABASE_KEY: str = os.environ['SUPABASE_KEY']
ROBOFLOW_API_KEY: str = os.environ['ROBOFLOW_API_KEY']
```

Configuration is validated at startup — if a required variable is missing, the service will fail immediately with a clear error rather than failing silently at runtime.
