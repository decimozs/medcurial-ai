# Project Requirements — Medcurial AI Claims Fraud Detection

---

## 1. Project Overview

**Medcurial AI Claims Fraud Detection** is an AI-powered medical insurance claims fraud detection system. It combines computer vision, large language models, and structured multi-agent workflows to help insurers automatically detect fraudulent patterns in submitted claims documents and signature data.

The system ingests scanned claim documents, extracts text via OCR, processes and compares signatory signatures using a Siamese neural network pipeline, and routes the combined data through a multi-node LangGraph AI analysis pipeline that produces a structured fraud assessment report. Human reviewers then act on those reports through a web application using role-based approval workflows.

---

## 2. Objectives

| # | Objective |
|---|-----------|
| 1 | Automate the initial fraud screening of medical insurance claims documents |
| 2 | Process and normalise handwritten signature images for machine-comparison |
| 3 | Produce a structured, human-readable fraud analysis report for every submitted document |
| 4 | Support multi-role review workflows (Claims Approval Process and Fraud Investigation Unit) |
| 5 | Provide an AI chat interface allowing reviewers to query documents and fraud findings interactively |
| 6 | Expose system data to LLM agents via a Model Context Protocol (MCP) service |
| 7 | Deliver a secure, maintainable, cloud-ready multi-service architecture |

---

## 3. Scope

### In-Scope

- Signature image upload, processing, and storage (OpenCV pipeline)
- Document image upload and OCR text extraction (Roboflow)
- Automated fraud analysis via LangGraph multi-agent pipeline
- Claims Approval Process (CAP) reviewer workflow
- Fraud Investigation Unit (FIU) reviewer workflow
- Session-based AI chat with document context
- User authentication and role-based access control
- REST API for all core operations
- React-based web application for all user-facing features
- MCP service exposing documents and signatures to external LLM agents
- Docker-based deployment for all services

### Out-of-Scope

- Native mobile applications (iOS / Android)
- Real-time streaming document ingestion (e.g., fax, email parsing)
- Payment processing or claims adjudication
- Integration with specific insurance core systems (e.g., Guidewire, Duck Creek)
- Training or fine-tuning of new AI/ML models within the system
- Third-party identity verification (KYC/AML)

---

## 4. Functional Requirements

### 4.1 Signature Management

| ID | Requirement |
|----|-------------|
| FR-SIG-01 | The system shall accept multi-image signature uploads for a named signatory |
| FR-SIG-02 | The system shall process each image through a five-stage OpenCV pipeline producing: original, ROI, normalised, siamese (220×155 px), and preview variants |
| FR-SIG-03 | The system shall store all processed image variants in Supabase object storage |
| FR-SIG-04 | The system shall persist signature metadata (name, image URLs, status) in the database |
| FR-SIG-05 | The system shall provide CRUD endpoints for signature records |
| FR-SIG-06 | The system shall track processing status: `pending`, `processing`, `completed`, `failed` |

### 4.2 Document Processing

| ID | Requirement |
|----|-------------|
| FR-DOC-01 | The system shall accept document image uploads |
| FR-DOC-02 | The system shall extract text from document images using the Roboflow OCR service |
| FR-DOC-03 | The system shall store extracted text and image URLs in the database |
| FR-DOC-04 | The system shall trigger an AI fraud analysis upon document submission |
| FR-DOC-05 | The system shall store the fraud analysis result as structured JSON |
| FR-DOC-06 | The system shall provide CRUD endpoints for document records |

### 4.3 Fraud Analysis

| ID | Requirement |
|----|-------------|
| FR-FRD-01 | The system shall format extracted OCR text into a standardised structure (Formatter node) |
| FR-FRD-02 | The system shall classify the document as fraud / not-fraud (Fraud Detector node) |
| FR-FRD-03 | The system shall assign a severity ranking to detected fraud indicators (Ranking node) |
| FR-FRD-04 | The system shall produce a final audit summary with justification (Auditor node) |
| FR-FRD-05 | The system shall expose the fraud analysis result via the REST API |

### 4.4 Review Workflows

| ID | Requirement |
|----|-------------|
| FR-REV-01 | The system shall support a Claims Approval Process (CAP) with `pending`, `approved`, and `rejected` states |
| FR-REV-02 | The system shall support a Fraud Investigation Unit (FIU) workflow with `pending`, `fraud`, and `not_fraud` states |
| FR-REV-03 | Authorised users shall be able to add review findings (notes) to any document |
| FR-REV-04 | Approval and rejection events shall be timestamped and attributed to the acting user |

### 4.5 Chat

| ID | Requirement |
|----|-------------|
| FR-CHT-01 | The system shall provide a chat interface where users can ask questions about a document |
| FR-CHT-02 | The system shall maintain per-session conversation history |
| FR-CHT-03 | The system shall generate a descriptive title for each new chat session |
| FR-CHT-04 | The system shall support multiple LLM backends selectable at runtime |

### 4.6 Authentication & Authorisation

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | The system shall require email/password authentication for all protected endpoints |
| FR-AUTH-02 | The system shall support session-based tokens |
| FR-AUTH-03 | The system shall support role assignment (`user`, `admin`) |
| FR-AUTH-04 | The system shall allow administrators to ban users |

### 4.7 MCP Service

| ID | Requirement |
|----|-------------|
| FR-MCP-01 | The MCP service shall expose document and signature data as callable tools |
| FR-MCP-02 | Tools shall support pagination and filtering |
| FR-MCP-03 | The service shall be consumable via stdio or SSE transport |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | API responses for read operations shall complete in under 500 ms under normal load |
| NFR-02 | Performance | Document OCR and fraud analysis shall complete within 60 seconds |
| NFR-03 | Scalability | Each service shall be independently deployable and horizontally scalable via Docker |
| NFR-04 | Security | All API endpoints (except auth) shall require a valid session token |
| NFR-05 | Security | Sensitive configuration (API keys, DB credentials) shall be provided via environment variables only |
| NFR-06 | Reliability | Each service shall expose a `/health` endpoint for readiness probing |
| NFR-07 | Maintainability | Code shall pass type-checking and linting gates in CI |
| NFR-08 | Observability | All services shall emit structured request logs |
| NFR-09 | Portability | All services shall be containerised with Docker and orchestrated with Docker Compose |
| NFR-10 | Data Integrity | Database schema migrations shall be managed with Drizzle ORM and version-controlled |

---

## 6. Assumptions and Constraints

### Assumptions

- Users have a modern web browser (Chrome, Firefox, Edge — latest two versions)
- Supabase is provisioned and accessible for object storage
- A Neon PostgreSQL (or compatible) database is available
- Roboflow API credentials are available for OCR text extraction
- Ollama Cloud credentials are available for the chat LLM
- HuggingFace credentials are available for the fraud detection model
- Document images are scanned at sufficient resolution for OCR accuracy (≥150 DPI recommended)

### Constraints

| Constraint | Detail |
|------------|--------|
| Runtime — API | Requires Bun ≥ 1.0 |
| Runtime — Python services | Requires Python ≥ 3.12 |
| Image size — Siamese network | Input images are normalised to exactly 220×155 pixels (width × height) |
| Storage | All processed images are stored in Supabase; local disk is not used for persistence |
| LLM availability | Fraud detection quality depends on availability of Ollama Cloud and HuggingFace endpoints |
| Database | Schema migrations must be applied before any service starts |
| Concurrency | LangGraph pipeline runs synchronously per document; parallel processing requires multiple worker instances |
