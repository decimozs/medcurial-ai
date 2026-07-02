# Medcurial Architecture - High Level Overview

## System Architecture Diagram

```mermaid
flowchart TB
    subgraph External["External Services"]
        Ollama[Ollama Cloud]
        HF[HuggingFace]
        Supabase[Supabase Storage]
        Neon[(Neon DB)]
    end

    subgraph App["Frontend - App (5173)"]
        React[React + Vite]
    end

    subgraph Backend["Backend Services"]
        subgraph API["API Service (3000)"]
            Hono[Hono REST API]
            Drizzle[Drizzle ORM]
            Auth[Supabase Auth]
        end

        subgraph Worker["Worker Service (8000)"]
            FastAPI_W[FastAPI]
            OpenCV[OpenCV Processing]
            Roboflow[Roboflow API]
        end

        subgraph Agent["Agent Service (8001)"]
            FastAPI_A[FastAPI]
            LangGraph[LangGraph Agent]
            ChatLLM[Chat LLM]
            FraudLLM[Fraud Detection LLM]
        end

        subgraph MCP["MCP Service (stdio)"]
            FastMCP[FastMCP Server]
        end
    end

    React -->|"HTTP"| Hono
    Hono -->|"Query/Write"| Drizzle
    Drizzle -->|"SQL"| Neon

    Hono -->|"Call"| FastAPI_W
    Hono -->|"Call"| FastAPI_A

    FastAPI_W -->|"Upload/Download"| Supabase
    FastAPI_W -->|"OCR/Detect"| Roboflow

    FastAPI_A -->|"Chat"| Ollama
    FastAPI_A -->|"Fraud Analysis"| HF

    MCP -.->|"Tools"| ExternalAI[External AI Agent]
```

## Service Connections Diagram

```mermaid
flowchart LR
    subgraph Services
        direction TB
        App[App<br/>5173] --> API[API<br/>3000]
        App -->|"enrollment"| Worker[Worker<br/>8000]
        API -->|"trigger verify"| Worker
        Worker -->|"save/patch data"| API
        API --> Agent[Agent<br/>8001]
        API --> Neon_DB[(Neon<br/>PostgreSQL)]
        Worker --> Supabase[(Supabase<br/>Storage)]
        Agent --> Ollama[Ollama<br/>Cloud]
        Agent --> HF[HuggingFace]
    end

    MCP[MCP<br/>stdio] -.->|"Tools"| External[External<br/>AI Agents]
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant App as App (5173)
    participant API as API (3000)
    participant Worker as Worker (8000)
    participant Agent as Agent (8001)
    participant DB as Neon DB
    participant Storage as Supabase
    participant LLM as Ollama/HF

    Note over User,Storage: Signature Enrollment Flow
    User->>App: Upload signature images
    App->>API: POST /signatures
    API->>Worker: Forward to worker service
    Worker->>Storage: Upload original images
    Worker->>Worker: Process with OpenCV
    Worker->>Storage: Upload processed images
    Worker->>API: Save signature metadata
    API->>DB: Insert record
    DB-->>API: Return created record
    API-->>App: Return signature data

    Note over User,LLM: Document Analysis Flow
    User->>App: Upload document
    App->>API: POST /documents
    API->>Agent: Request fraud analysis
    Agent->>LLM: Process with LangGraph
    LLM-->>Agent: Fraud results
    Agent->>API: Save analysis
    API->>DB: Update document
    API-->>App: Return analysis

    Note over User,LLM: Chat Flow
    User->>App: Send message
    App->>API: POST /chat/:id/messages
    API->>Agent: Forward to chat service
    Agent->>API: Fetch documents/signatures
    Agent->>LLM: Get AI response
    LLM-->>Agent: Response
    Agent->>API: Save message
    API-->>App: Return chat response
```

## Signature Verification Flow

```mermaid
sequenceDiagram
    participant User
    participant App as App (5173)
    participant API as API (3000)
    participant Worker as Worker (8000)
    participant Roboflow as Roboflow
    participant DB as Neon DB
    participant Storage as Supabase

    Note over User,Storage: Document Upload + Auto-Verify
    User->>App: Upload medical claim document
    App->>API: POST /documents
    API->>Worker: POST /workers/document-analysis
    Worker->>Roboflow: Send document for OCR + detection
    Roboflow-->>Worker: text_extraction + signature_visualization
    Worker->>Worker: Crop signature from bbox
    Worker->>Storage: Upload visualization + crop
    Worker->>API: PATCH /documents/:id (save URLs + text)
    API->>DB: Update document record

    Note over Worker,DB: Background Auto-Verify
    Worker->>Worker: Extract physician name from OCR text
    Worker->>API: GET /signatures (list enrolled)
    API-->>Worker: All enrolled signatures
    Worker->>Worker: Match physician name → find enrolled sig
    alt Match found
        loop For each reference siamese image
            Worker->>Storage: Download reference siamese
            Worker->>Worker: Preprocess + align + score
        end
        Worker->>Worker: Pick best score + generate overlay
        Worker->>Storage: Upload overlay image
        Worker->>API: PATCH /documents/:id/signature-verification
        API->>DB: Store verification result
    else No match
        Worker->>API: PATCH /documents/:id/signature-verification
        Note over API,DB: status: "no_verified_signature"
    end

    Note over App: Auto-refetch after 3s
    App->>API: GET /documents/:id
    API-->>App: Document with signatureVerification
    App->>App: Render result in Analysis panel
```

## Technology Stack Summary

```mermaid
graph TB
    subgraph Frontend
        R[React 19]
        V[Vite]
        TQ[TanStack Query]
        ZS[Zustand]
        Tail[Tailwind + shadcn/ui]
    end

    subgraph API_Service["API (TypeScript)"]
        B[Bun]
        H[Hono]
        D[Drizzle]
        Z[Zod]
        SAuth[Supabase Auth]
    end

    subgraph Worker_Service["Worker (Python)"]
        FA[FastAPI]
        CV[OpenCV]
        SB[Supabase Client]
        RF[Roboflow]
    end

    subgraph Agent_Service["Agent (Python)"]
        FAA[FastAPI]
        LG[LangGraph]
        LCO[LangChain Ollama]
        LCHF[LangChain HF]
    end

    subgraph MCP_Service["MCP (Python)"]
        FMCP[FastMCP]
    end

    subgraph Model_Service["Model (Python)"]
        YOLO[ultralytics YOLO]
        Albumentations[Albumentations]
        PIL[Pillow]
    end

    R --> V
    V --> TQ
    TQ --> ZS
    ZS --> Tail

    B --> H
    H --> D
    D --> Z
    H --> SAuth

    YOLO --> Albumentations
    Albumentations --> PIL
```