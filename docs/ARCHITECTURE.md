# System Architecture

## Overview
The architecture is designed to handle multimodal remote sensing data efficiently, offering a modern web interface backed by a local, synchronous geospatial backend.

```mermaid
graph TD
    subgraph Frontend
        UI[Next.js App Router]
        State[Zustand & TanStack Query]
        Map[MapLibre GL JS]
        UI --> State
        State --> Map
    end

    subgraph API Gateway / Backend
        API[FastAPI Server]
        Auth[JWT Auth]
        Controller[Agentic Workflow Controller]
        API --> Auth
        API --> Controller
    end

    subgraph Processing
        GeoTools[GDAL, Rasterio, OpenCV]
        ML[PyTorch, HuggingFace, timm]
    end

    subgraph Storage & Data
        DB[(SQLite)]
        Files[(Local Filesystem)]
    end

    Frontend -- HTTP/REST --> API
    Frontend -- WebSockets/Polling --> API
    Controller --> GeoTools
    Controller --> ML
    Controller -- Read/Write --> Files
    API -- Read/Write --> DB
```

## Agentic Controller Workflow
The Agentic Controller routes natural language queries to the appropriate processing pipelines.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Controller
    participant Registry as Tool Registry
    participant ML as ML/Geo Processing

    User->>Frontend: Submit Query & Image(s)
    Frontend->>API: POST /api/v1/analysis/query
    API->>Controller: Parse Intent & Context
    Controller->>Registry: Lookup Compatible Tools
    Registry-->>Controller: Return Tool Chain
    Controller->>ML: Dispatch Task (e.g., Optical-SAR Fusion)
    ML-->>Controller: Return Results & Evidence Masks
    Controller->>API: Compile Response & Execution Trace
    API-->>Frontend: Structured JSON Response
    Frontend->>User: Render Map, Trace, and Answer
```
