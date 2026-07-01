# Agent Guidelines for Medcurial API

This document provides guidelines for AI agents working on the Medcurial API codebase.

## Project Overview

- **Project**: Medcurial API
- **Language**: TypeScript (strict mode)
- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL with Drizzle ORM
- **Key Dependencies**: hono, drizzle-orm, drizzle-zod, zod, @hono/zod-validator, nanoid

## Development Commands

### Running the Application

```bash
# Install dependencies
bun install

# Run development server with hot reload
bun run dev

# Build for production
bun run build
```

### Database Commands

```bash
# Generate database migrations
bun run generate

# Run pending migrations
bun run migrate

# Push schema to database
bun run push

# Open Drizzle Studio (port 3001)
bun run studio
```

### Linting and Formatting

```bash
# Run biome linter
bun run lint

# Auto-fix linting issues
bun run lint --write

# Format code with biome
bun run format

# Run TypeScript type checker
bun run typecheck
```

### Running Verification Commands

Before submitting code changes, always run:

```bash
bun run lint
bun run format
bun run typecheck
```

Fix any linting, formatting, or type errors before completing work.

## Code Style Guidelines

### Imports

- Use path aliases (`@/`) for imports within the package
- Group imports: standard library, third-party, local application
- Example: `import { db } from "@/db";` `import { eq } from "drizzle-orm";`

Example:
```typescript
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { zValidator } from "@/utils";
import { signaturesTable } from "@/schemas";
```

### Formatting

- Use 2 spaces for indentation (biome default)
- Maximum line width: 80 characters
- Use single quotes for strings
- Use trailing commas (es5 style)
- Use f-strings (template literals) for string interpolation: `` `Hello ${name}` ``

### Types

- Always use explicit type annotations for function parameters and return types
- Use Zod schemas for request/response validation
- Use Drizzle's type inference for database models
- Avoid `any` - enable strict mode in tsconfig
- Use `type` for type aliases, `interface` for object types

Example:
```typescript
export type Signature = typeof signaturesTable.$inferSelect;
export type InsertSignature = ReturnType<typeof InsertSignatureSchema.parse>;
```

### Naming Conventions

- **Files**: `snake_case.ts` (e.g., `signature.ts`, `error_middleware.ts`)
- **Variables/functions**: `camelCase` (e.g., `getSignatures`, `createRecord`)
- **Classes/Types**: `PascalCase` (e.g., `Signature`, `InsertSignature`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_VERSION`, `MAX_RETRIES`)
- **Database tables**: `snake_case` (e.g., `signatures`, `user_profiles`)

### Project Structure

```
src/
├── index.ts           # App entry point, route registration
├── db.ts              # Database connection (Neon + Drizzle)
├── constants.ts       # App configuration constants
├── utils.ts           # Utility functions, base schemas
├── routes/
│   ├── index.ts       # Route exports
│   └── signature.ts   # Signature CRUD endpoints
├── schemas/
│   ├── index.ts       # Schema exports
│   └── signature.ts   # Drizzle table + Zod schemas
└── middlewares/
    ├── index.ts       # Middleware exports
    ├── error.ts       # Error handling middleware
    └── logger.ts      # Logging middleware
```

### Error Handling

- Use the error middleware for consistent error responses
- Return appropriate HTTP status codes:
  - `400` for bad requests / validation errors
  - `404` for not found
  - `500` for internal server errors
- Log errors with `console.error()` before returning
- Return JSON error format: `{ error: "message" }`

Example:
```typescript
if (!data) {
  return c.json({ error: "Signature not found" }, 404);
}

try {
  // database operation
} catch (error) {
  console.error("Error:", error);
  return c.json({ error: "Failed to create signature" }, 500);
}
```

### Database Operations

- Use Drizzle ORM for all database queries
- Use transactions for multi-step operations
- Return full inserted/updated records using `.returning()`
- Use Zod schemas with Drizzle for validation

Example:
```typescript
const data = await db.insert(signaturesTable).values(body).returning();
```

### Environment Variables

- Never hardcode sensitive values
- Use `.env` files for local development (gitignored)
- Validate required variables at startup
- Required: `DATABASE_URL`

### API Design

- Use Hono routing with `.get()`, `.post()`, `.put()`, `.delete()` methods
- Use `zValidator` for request validation
- Use `c.req.valid("json")` to get validated body
- Use `c.req.param()` to get path parameters
- Register routes with `.route()` method

Example:
```typescript
export const signatureRoutes = new Hono()
  .get("/", async (c) => { /* ... */ })
  .get("/:id", async (c) => { /* ... */ })
  .post("/", zValidator("json", InsertSignatureSchema), async (c) => {
    const body = c.req.valid("json");
    // ...
  });
```

### Validation with Zod

- Create insert schemas using `createInsertSchema()` from drizzle-zod
- Use `.omit()` to exclude auto-generated fields
- Use `.partial()` for update schemas
- Use `.strict()` to reject unknown fields

Example:
```typescript
export const InsertSignatureSchema = createInsertSchema(signaturesTable)
  .omit(excludedFields)
  .strict();

export const UpdateSignatureSchema = InsertSignatureSchema.partial();
```

---

## Database Schema

### Signatures Table

The `signatures` table stores signature enrollment data with the following structure:

| Field | Type | Description |
|-------|------|-------------|
| `id` | text (PK) | Auto-generated nanoid (10 characters) |
| `no` | serial | Auto-increment number |
| `name` | text | Signatory name (required) |
| `imageUrls` | jsonb | Object containing all image URLs by type |
| `createdAt` | timestamp | Auto-generated timestamp on creation |
| `updatedAt` | timestamp | Auto-updated timestamp on modification |

#### imageUrls JSON Structure

The `imageUrls` field stores URLs organized by image type:

```json
{
  "original": ["url1", "url2"],
  "roi": ["url1", "url2"],
  "normalized": ["url1", "url2"],
  "siamese": ["url1", "url2"],
  "image_preview": ["url1", "url2"]
}
```

- **original**: Raw uploaded signature images
- **roi**: ROI visualization with contours and bounding boxes
- **normalized**: Images prepared for siamese network processing
- **siamese**: 220x155 grayscale images (optimal for Siamese networks)
- **image_preview**: Inverted siamese images for display

---

## API Endpoints

### GET /signatures

Get all signature records.

**Response:**
```json
[
  {
    "id": "Cz1kDAz6pPK53NhGcOg_o",
    "name": "Marlon Martin",
    "imageUrls": { ... },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### GET /signatures/:id

Get a specific signature by ID.

**Response:**
```json
{
  "id": "Cz1kDAz6pPK53NhGcOg_o",
  "name": "Marlon Martin",
  "imageUrls": { ... },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### POST /signatures

Create a new signature record.

**Request:**
```json
{
  "name": "Marlon Martin",
  "imageUrls": {
    "original": [
      "https://...supabase.co/.../reference/marlon-martin/abc123.png"
    ],
    "roi": [
      "https://...supabase.co/.../processed/marlon-martin/roi/def456.png"
    ],
    "normalized": [...],
    "siamese": [...],
    "image_preview": [...]
  }
}
```

**Response:**
```json
{
  "id": "Cz1kDAz6pPK53NhGcOg_o",
  "name": "Marlon Martin",
  "imageUrls": { ... },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### PUT /signatures/:id

Update an existing signature record.

**Request:**
```json
{
  "name": "Updated Name",
  "imageUrls": { ... }
}
```

**Response:**
```json
{
  "id": "Cz1kDAz6pPK53NhGcOg_o",
  "name": "Updated Name",
  "imageUrls": { ... },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

### DELETE /signatures/:id

Delete a signature record.

**Response:**
```json
{
  "message": "Signature deleted successfully"
}
```
