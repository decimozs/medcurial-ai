# Agent Guidelines for Medcurial Worker

This document provides guidelines for AI agents working on the Medcurial Worker codebase.

## Project Overview

- **Project**: Medcurial Worker
- **Language**: Python 3.12+
- **Framework**: FastAPI
- **Key Dependencies**: fastapi[standard], nanoid, opencv-contrib-python, opencv-python, pydantic-settings, python-dotenv, supabase, httpx

## Development Commands

### Running the Application

```bash
# Install dependencies
uv sync

# Run development server with auto-reload
uv run fastapi dev app/

# Or using uvicorn directly
uv run uvicorn app.main:app --reload --port 8000
```

### Testing

No tests currently exist. When adding tests:

```bash
# Run all tests with pytest
uv run pytest

# Run a single test file
uv run pytest tests/test_file.py

# Run a single test function
uv run pytest tests/test_file.py::test_function_name

# Run tests matching a pattern
uv run pytest -k "test_pattern"
```

To add testing, install pytest and create a `tests/` directory:

```bash
uv add --dev pytest pytest-asyncio httpx
```

### Linting and Formatting

```bash
# Run ruff linter
uv run ruff check .

# Auto-fix linting issues
uv run ruff check --fix .

# Format code with ruff
uv run ruff format .

# Run mypy type checker
uv run mypy .
```

### Verification Commands

Before submitting code changes, run:

```bash
# Check code quality
uv run ruff check .
uv run ruff format --check .
uv run mypy .

# Run tests (if any exist)
uv run pytest
```

Fix any linting errors or type errors before completing work.

## Code Style Guidelines

### Imports

- Use absolute imports within the package (e.g., `from app.config import Settings`)
- Group imports in this order: standard library, third-party, local application

### Formatting

- Follow PEP 8 guidelines
- Use 4 spaces for indentation
- Maximum line length: 88 characters (ruff default)
- Use trailing commas for multi-line structures
- Use f-strings for string formatting

### Types

- Use type hints for all function parameters and return values
- Use Pydantic models for configuration and request/response schemas
- Prefer explicit types over `Any`
- Use `Optional[T]` instead of `T | None` for compatibility

Example:
```python
from typing import Optional

def process_file(file_path: str, timeout: Optional[int] = None) -> dict[str, Any]:
    ...
```

### Naming Conventions

- **Variables/functions**: `snake_case` (e.g., `get_settings`, `api_url`)
- **Classes**: `PascalCase` (e.g., `Settings`, `WorkerException`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`, `MAX_RETRIES`)
- **Files**: `snake_case.py` (e.g., `config.py`, `exceptions.py`)

### Error Handling

- Use custom exception classes inheriting from `WorkerException`
- Define specific exception types for different error conditions (see `app/exceptions.py`)
- Use appropriate HTTP status codes:
  - `400` for bad requests / invalid input
  - `502` for external API failures
  - `500` for internal processing errors
- Validate configuration at startup (see `app/config.py`)

Example:
```python
class ProcessingError(WorkerException):
    def __init__(self, message: str = "Error processing signature"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### Project Structure

```
app/
├── __init__.py               # Package initialization
├── main.py                   # FastAPI application entry point
├── config.py                 # Settings and configuration (Pydantic)
├── exceptions.py             # Custom exception classes
├── dependencies.py           # FastAPI dependencies (Supabase client, API URL)
├── routers/
│   ├── __init__.py
│   └── worker.py             # Worker API routes (signature processing)
├── schemas/
│   ├── __init__.py
│   └── worker.py             # Pydantic schemas for request/response
└── services/
    ├── __init__.py
    ├── signature_processor.py  # Image preprocessing pipeline
    └── signature_analyzer.py  # Signature feature extraction & matching
```

### Environment Variables

- Never hardcode sensitive values
- Use `.env` files for local development (already gitignored)
- Validate required environment variables at startup
- Provide sensible defaults only when safe to do so

Required environment variables:
- `API_BASE_URL` - External API URL for saving signature metadata (e.g., `http://localhost:3000/api/v1`)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/public key

### Async/Await

- Use `async def` for FastAPI route handlers
- Use `await` for I/O-bound operations
- Use `asyncio.to_thread()` for CPU-bound operations (OpenCV image processing)
- Avoid blocking operations in async context

---

## Supabase Storage Folder Structure

All signature images are stored in Supabase storage with the following structure:

```
signatures/
├── reference/
│   └── {signatory_name}/
│       └── {nanoid}.png     # Original uploaded images
└── processed/
    └── {signatory_name}/
        ├── roi/             # ROI visualization with contours/bounding box
        ├── normalized/      # Prepared for siamese network
        ├── siamese/         # 220x155 grayscale (optimal for Siamese)
        └── image_preview/   # Inverted siamese for display
```

### Naming Conventions

- **Folder names**: Lowercase with hyphens (e.g., `marlon-martin`)
- **File names**: Nanoid generated (e.g., `abc123def456.png`)
- **Folder reuse**: If folder exists, images are added to existing folder

---

## Image Processing Pipeline

The signature processing uses OpenCV in the `SignatureProcessor` class:

### Processing Steps

1. **Decode**: Convert bytes to numpy array
2. **Grayscale**: Convert to grayscale
3. **Blur**: Apply Gaussian blur
4. **Threshold**: Adaptive thresholding (binary)
5. **Morphology**: Open and close operations
6. **Contour filtering**: Filter by connected component area
7. **ROI extraction**: Crop signature region
8. **Visualization**: Generate RGB image with contours and bounding box
9. **Siamese preparation**: Resize to 220x155 (optimal for Siamese networks)
10. **Encode**: Base64 encode for API responses

### Siamese Network Size

**220 x 155 pixels (width x height)** - Based on research for optimal performance:
- Standard size for CEDAR and GPDS datasets
- Balances detail retention with computational efficiency
- Previous size was 256x256

### ROI with Fallback

The ROI uses `get_visualization()` which returns an RGB image with:
- Green contours drawn around valid signature areas
- Blue bounding rectangle around the signature

If visualization fails (no contours detected, encoding error), it falls back to the original raw image.

---

## API Endpoints

### POST /workers/enroll-signature

Enrolls signature images into the system. Accepts single or multiple images, processes them, uploads to Supabase, and saves metadata to the API.

**Features:**
- Accepts multiple images (single or batch)
- Parallel processing using `asyncio.to_thread()` + `asyncio.gather()`
- Uploads all 5 image types to Supabase storage
- Saves signature metadata to external API
- Returns signature ID and all uploaded URLs

**Request Parameters:**
- `signatory_name` (query string): Name of the person
- `files` (multipart/form-data): List of signature image files

**Response:**
```json
{
  "success": true,
  "message": "Signature enrolled successfully",
  "data": {
    "signatory_name": "Marlon Martin",
    "signature_id": "Cz1kDAz6pPK53NhGcOg_o",
    "image_urls": {
      "original": [
        "https://...supabase.co/.../reference/marlon-martin/abc123.png",
        "https://...supabase.co/.../reference/marlon-martin/def456.png"
      ],
      "roi": [
        "https://...supabase.co/.../processed/marlon-martin/roi/ghi789.png"
      ],
      "normalized": [
        "https://...supabase.co/.../processed/marlon-martin/normalized/jkl012.png"
      ],
      "siamese": [
        "https://...supabase.co/.../processed/marlon-martin/siamese/mno345.png"
      ],
      "image_preview": [
        "https://...supabase.co/.../processed/marlon-martin/image_preview/pqr678.png"
      ]
    }
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "api_url": "http://localhost:3000/api/v1"
}
```

---

## Testing Guidelines

When adding tests:

- Place tests in a `tests/` directory at the root
- Name test files as `test_<module_name>.py`
- Use `pytest` as the test runner
- Use `pytest.mark.asyncio` for async tests
- Use `httpx` with `AsyncClient` for API integration tests

Example test structure:
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
```

---

## Testing the Enroll-Signature Endpoint

### Using curl

```bash
curl -X 'POST' \
  'http://localhost:8000/workers/enroll-signature?signatory_name=Marlon%20Martin' \
  -H 'accept: application/json' \
  -F 'files=@assets/marlon-martin-signatures/image1.jfif;type=image/jpeg' \
  -F 'files=@assets/marlon-martin-signatures/image2.jfif;type=image/jpeg' \
  -F 'files=@assets/marlon-martin-signatures/image3.jfif;type=image/jpeg'
```

### Prerequisites

1. Start the API service: `cd api && bun run dev` (port 3000)
2. Start the Worker service: `cd worker && uv run fastapi dev app/` (port 8000)

---

## Signature Analyzer (Future Reference)

The `SignatureAnalyzer` class handles feature extraction and matching:

- AKAZE feature detection
- Feature matching with BFMatcher
- Image alignment using homography
- SSIM similarity scoring
- Overlap visualization

This service is for future implementation of signature verification functionality.
