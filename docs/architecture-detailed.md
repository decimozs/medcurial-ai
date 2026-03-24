# Medcurial Architecture - Detailed Service Diagrams

## Table of Contents

1. [API Service](#api-service)
2. [Worker Service](#worker-service)
3. [Agent Service](#agent-service)
4. [MCP Service](#mcp-service)
5. [Database Schema](#database-schema)

---

## API Service

**Port:** 3000  
**Language:** TypeScript  
**Runtime:** Bun  
**Framework:** Hono + Drizzle ORM

### Components

```mermaid
flowchart TB
    subgraph API_Service["API Service - src/"]
        direction TB
        
        subgraph Entry["Entry Point"]
            Index[index.ts]
        end

        subgraph Middlewares["Middlewares"]
            Logger[logger.ts]
            Error[error.ts]
            Auth[auth.ts]
            Protected[protected.ts]
        end

        subgraph Routes["Routes"]
            Sig_Route[signature.ts]
            Doc_Route[document.ts]
            Chat_Route[chat.ts]
        end

        subgraph Schemas["Schemas"]
            Sig_Schema[signature.ts]
            Doc_Schema[document.ts]
            Chat_Schema[chat.ts]
            Auth_Schema[auth.ts]
        end

        subgraph Core["Core"]
            DB[db.ts]
            Utils[utils.ts]
            Constants[constants.ts]
            Types[types.ts]
        end
    end

    Index --> Middlewares
    Index --> Routes
    Middlewares --> Schemas
    Routes --> DB
    Routes --> Schemas
    DB --> Constants
    Utils --> Types
```

### API Endpoints

```mermaid
erDiagram
    SIGNATURES {
        string id PK
        serial no
        string name
        jsonb imageUrls
        timestamp createdAt
        timestamp updatedAt
    }

    DOCUMENTS {
        string id PK
        serial no
        string name
        string status
        jsonb imageUrls
        text extractedText
        jsonb fraudAnalysis
        timestamp createdAt
        timestamp updatedAt
    }

    CHAT_SESSIONS {
        string id PK
        serial no
        string title
        string documentId FK
        timestamp createdAt
        timestamp updatedAt
    }

    CHAT_MESSAGES {
        string id PK
        string sessionId FK
        string role
        text content
        timestamp createdAt
    }

    SIGNATURES ||--o{ DOCUMENTS : "optional"
    DOCUMENTS ||--o{ CHAT_SESSIONS : "optional"
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "contains"
```

### Route Flow

```mermaid
flowchart LR
    subgraph HTTP["HTTP Requests"]
        GET[GET]
        POST[POST]
        PUT[PUT/PATCH]
        DELETE[DELETE]
    end

    subgraph Endpoints["API Endpoints"]
        Sig[/signatures]
        Doc [/documents]
        Chat[/chat]
    end

    GET --> Sig
    POST --> Sig
    PUT --> Sig
    DELETE --> Sig

    GET --> Doc
    POST --> Doc
    PUT --> Doc
    PATCH --> Doc
    DELETE --> Doc

    GET --> Chat
    POST --> Chat
    DELETE --> Chat

    subgraph Validation["Validation Layer"]
        Zod[Zod Schemas]
        Middleware[Auth Middleware]
    end

    Sig --> Zod
    Doc --> Zod
    Chat --> Zod
    Zod --> Middleware
```

---

## Worker Service

**Port:** 8000  
**Language:** Python 3.12+  
**Framework:** FastAPI  
**Purpose:** Image processing, Supabase storage

### Components

```mermaid
flowchart TB
    subgraph Worker_Service["Worker Service - app/"]
        direction TB
        
        subgraph Entry["Entry Point"]
            Main[main.py]
        end

        subgraph Config["Configuration"]
            Config[config.py]
            Exceptions[exceptions.py]
            Deps[dependencies.py]
        end

        subgraph Routers["Routers"]
            Worker_Router[routers/worker.py]
        end

        subgraph Schemas["Schemas"]
            Worker_Schema[schemas/worker.py]
        end

        subgraph Services["Services"]
            SigProc[services/signature_processor.py]
            SigAna[services/signature_analyzer.py]
            Storage[services/storage.py]
            API_Client[services/api_client.py]
            Roboflow[services/roboflow.py]
        end
    end

    Main --> Config
    Main --> Routers
    Config --> Exceptions
    Routers --> Schemas
    Routers --> Services
    Services --> Deps
```

### Image Processing Pipeline

```mermaid
flowchart LR
    subgraph Input["Input"]
        Image[Signature Image]
    end

    subgraph Processing["Processing Steps"]
        Decode[1. Decode<br/>bytes to numpy]
        Gray[2. Grayscale<br/>conversion]
        Blur[3. Gaussian<br/>blur]
        Thresh[4. Adaptive<br/>threshold]
        Morph[5. Morphology<br/>open/close]
        Contour[6. Contour<br/>filtering]
        ROI[7. ROI<br/>extraction]
        Visual[8. Visualization<br/>contours/bbox]
        Siamese[9. Resize<br/>220x155]
    end

    subgraph Output["Output"]
        Orig[Original<br/>images]
        ROI_Img[ROI<br/>visualization]
        Norm[Normalized<br/>images]
        Siamese_Img[Siamese<br/>220x155]
        Preview[Image<br/>preview]
    end

    Image --> Decode
    Decode --> Gray
    Gray --> Blur
    Blur --> Thresh
    Thresh --> Morph
    Morph --> Contour
    Contour --> ROI
    ROI --> Visual
    Visual --> Siamese

    Decode --> Orig
    Visual --> ROI_Img
    ROI --> Norm
    Siamese --> Siamese_Img
    Siamese --> Preview
```

### Supabase Storage Structure

```mermaid
flowchart TB
    subgraph Supabase_Storage["Supabase Storage Bucket"]
        direction TB
        
        subgraph Reference["signatures/reference/"]
            Ref[signatory_name/<br/>nanoid.png]
        end

        subgraph Processed["signatures/processed/"]
            direction LR
            ROI[roi/]
            Norm[normalized/]
            Siamese[siamese/]
            Preview[image_preview/]
        end
    end

    Ref -->|"1. Upload"| Processed
    Processed -->|"2. Process"| ROI
    ROI -->|"3. Process"| Norm
    Norm -->|"4. Process"| Siamese
    Siamese -->|"5. Generate"| Preview
```

### API Endpoint

```mermaid
sequenceDiagram
    participant Client
    participant API as API (3000)
    participant Worker as Worker (8000)
    participant Supabase as Supabase

    Client->>API: POST /signatures
    API->>Worker: POST /workers/enroll-signature<br/>?signatory_name=...
    
    Note over Worker: Receive multipart images
    
    loop For each image
        Worker->>Worker: Decode & process with OpenCV
        Worker->>Worker: Generate 5 variants
        Worker->>Supabase: Upload all to storage
    end
    
    Worker->>API: POST /signatures (save metadata)
    API->>Database: Insert signature record
    Database-->>API: Return created record
    API-->>Client: Return signature data
```

---

## Agent Service

**Port:** 8001  
**Language:** Python 3.12+  
**Framework:** FastAPI + LangGraph  
**Purpose:** AI fraud detection, chat assistant

### Components

```mermaid
flowchart TB
    subgraph Agent_Service["Agent Service - src/"]
        direction TB
        
        subgraph Entry["Entry Point"]
            Main[main.py]
        end

        subgraph Config["Configuration"]
            Config[config.py]
        end

        subgraph Routers["Routers"]
            Agent_Router[routers/agent.py]
            Chat_Router[routers/chat.py]
        end

        subgraph Graph["LangGraph"]
            Graph[graph.py]
            State[state.py]
            Nodes[_nodes/]
            Formatter[formatter.py]
            FraudDet[fraud_detector.py]
            Ranking[ranking.py]
            Auditor[auditor.py]
        end

        subgraph Tools["Tools"]
            Data_Tools[tools/data_tools.py]
            MCP_Client[tools/mcp_client.py]
        end

        subgraph Prompts["Prompts"]
            Prompts[prompts/__init__.py]
        end
    end

    Main --> Config
    Main --> Routers
    Routers --> Graph
    Routers --> Tools
    Graph --> State
    Graph --> Nodes
    Graph --> Prompts
    Nodes --> Config
    Routers --> Prompts
```

### LangGraph Workflow

```mermaid
flowchart LR
    Start((START)) --> Formatter
    
    subgraph LangGraph["LangGraph Pipeline"]
        Formatter --> FraudDet
        FraudDet --> Ranking
        Ranking --> Auditor
    end
    
    Auditor --> End((END))

    subgraph Nodes["Node Functions"]
        direction TB
        F[Formatter Agent<br/>- Format OCR text<br/>- Clean data]
        FD[Fraud Detector<br/>- Identify fraud<br/>- Flag issues]
        R[Ranking Agent<br/>- Categorize<br/>- Priority rank]
        A[Auditor Agent<br/>- Final review<br/>- Verdict]
    end
```

### Chat Flow

```mermaid
sequenceDiagram
    participant User
    participant API as API (3000)
    participant Agent as Agent (8001)
    participant MCP as MCP (stdio)
    participant LLM as Ollama Cloud
    participant HF as HuggingFace

    User->>API: POST /chat/:id/messages
    API->>Agent: POST /chat

    Note over Agent: Build context
    Agent->>MCP: query_documents()
    MCP-->>Agent: documents list
    Agent->>MCP: query_signatures()
    MCP-->>Agent: signatures list
    
    Note over Agent: Send to LLM
    Agent->>LLM: System + User message
    LLM-->>Agent: AI response
    
    Note over Agent: Generate title (for new chats)
    Agent->>HF: Generate title
    HF-->>Agent: title
    
    Agent->>API: Save messages
    API->>Database: Insert chat messages
    Database-->>API: Return messages
    API-->>User: Return response
```

### LLM Integration

```mermaid
flowchart TB
    subgraph Agent_Service["Agent Service"]
        direction TB
        
        subgraph Chat["Chat Endpoint"]
            Chat[chat.py]
        end

        subgraph Analyze["Analyze Endpoint"]
            Analyze[agent.py]
        end

        subgraph LLMs["LLM Clients"]
            Ollama[LangChain Ollama<br/>Chat Models]
            HF[LangChain HF<br/>Fraud Model]
        end
    end

    subgraph Ollama_Cloud["Ollama Cloud"]
        Models[minimax-2.5<br/>minimax-2.7<br/>cogito-2.1<br/>gemini-flash<br/>kimi-k2.5]
    end

    subgraph HuggingFace["HuggingFace"]
        FraudModel[Qwen2.5-1.5B]
    end

    Chat --> Ollama
    Ollama --> Models
    
    Analyze --> HF
    HF --> FraudModel
```

---

## MCP Service

**Mode:** stdio (for external AI agents)  
**Language:** Python 3.12+  
**Framework:** FastMCP

### Components

```mermaid
flowchart TB
    subgraph MCP_Service["MCP Service - main.py"]
        direction TB
        
        subgraph Tools["MCP Tools"]
            QueryDocs[query_documents]
            GetDoc[get_document]
            GetFraud[get_fraud_analysis]
            QuerySigs[query_signatures]
        end

        subgraph HTTP["HTTP Client"]
            Client[_make_request]
        end
    end

    Tools --> HTTP
    HTTP -->|"GET"| API[API Service<br/>3000]
```

### Tool Definitions

```mermaid
classDiagram
    class query_documents {
        +status: str | None
        +limit: int = 10
        +offset: int = 0
        +returns: dict
    }

    class get_document {
        +document_id: str
        +returns: dict
    }

    class get_fraud_analysis {
        +document_id: str
        +returns: dict
    }

    class query_signatures {
        +name: str | None
        +limit: int = 10
        +offset: int = 0
        +returns: dict
    }

    query_documents <-- FastMCP
    get_document <-- FastMCP
    get_fraud_analysis <-- FastMCP
    query_signatures <-- FastMCP
```

---

## Database Schema

### Tables

```mermaid
erDiagram
    SIGNATURES {
        text id PK "nanoid"
        serial no
        text name
        jsonb imageUrls
        text status "pending/processing/completed/failed"
        timestamp createdAt
        timestamp updatedAt
    }

    DOCUMENTS {
        text id PK "nanoid"
        serial no
        text name
        text status
        jsonb imageUrls
        text extractedText
        jsonb fraudAnalysis
        timestamp createdAt
        timestamp updatedAt
    }

    CHAT_SESSIONS {
        text id PK "nanoid"
        serial no
        text title
        text documentId FK "nullable"
        timestamp createdAt
        timestamp updatedAt
    }

    CHAT_MESSAGES {
        text id PK "nanoid"
        text sessionId FK
        text role "user/assistant"
        text content
        timestamp createdAt
    }

    SIGNATURES ||--o{ DOCUMENTS : "optional"
    DOCUMENTS ||--o{ CHAT_SESSIONS : "optional"
    CHAT_SESSIONS ||--|{ CHAT_MESSAGES : "contains"
```

### imageUrls JSON Structure

```mermaid
flowchart TB
    subgraph JSON["imageUrls Structure"]
        direction TB
        
        Orig[original: string[]]
        ROI[roi: string[]]
        Norm[normalized: string[]]
        Siam[siamese: string[]]
        Preview[image_preview: string[]]
    end

    Orig -->|"uploaded"| ROI
    ROI -->|"processed"| Norm
    Norm -->|"resized"| Siam
    Siam -->|"inverted"| Preview
```

---

## Environment Variables

### API Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `AGENT_URL` | No | `http://localhost:8001` | Agent service URL |

### Worker Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_URL` | Yes | `http://localhost:3000/api/v1` | API service URL |
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_KEY` | Yes | - | Supabase anon key |
| `ROBOFLOW_API_KEY` | Yes | - | Roboflow API key |
| `ROBOFLOW_API_URL` | Yes | - | Roboflow API URL |
| `WORKER_API_KEY` | Yes | - | Key for worker authentication |

### Agent Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OLLAMA_API_KEY` | Yes | - | Ollama Cloud API key |
| `HF_TOKEN` | Yes | - | HuggingFace token |
| `HF_BASE_URL` | Yes | `https://router.huggingface.co/v1` | HF router URL |
| `API_BASE_URL` | No | `http://localhost:3000/api/v1` | API service URL |
| `MCP_URL` | No | `http://localhost:8002/mcp` | MCP server URL |

### MCP Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_BASE_URL` | No | `http://localhost:3000/api/v1` | API service URL |
| `WORKER_API_KEY` | No | - | Worker authentication key |