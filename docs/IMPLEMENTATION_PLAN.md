# Implementation Plan

## Phase 1: Project Setup & Core Infrastructure
- **Initialize Frontend**: Next.js (App Router), Tailwind CSS, shadcn/ui.
- **Initialize Backend**: FastAPI, Uvicorn, SQLAlchemy, Alembic.
- **Database & Storage**: SQLite for local development and filesystem storage for uploaded images.
- **Authentication**: JWT, bcrypt, python-jose. Roles (ADMIN, ANALYST, VIEWER).
- **Dashboard & Project CRUD**: UI and API for managing workspaces (Projects).
- **Seed Data**: Demo user `demo@satquery.ai` / `Demo@12345`.

## Phase 2: Image Management
- **Upload API**: Support `.tif`, `.tiff`, `.png`, `.jpg`, `.jpeg`.
- **Metadata Extraction**: Use Rasterio for GeoTIFF to extract CRS, bounds, bands, etc.
- **Previews**: Generate RGB previews (optical) or grayscale (SAR). COG conversion where possible.
- **Modality Detection**: Rule-based detection (Optical, SAR, Multispectral, Unknown) with explainable rules.

## Phase 3: Image Pairing & Validation
- **Pair Creation**: Select two images (bi-temporal or optical-SAR).
- **Compatibility Validation**: Geographic overlap, CRS matching, resolution mismatch, and time difference.
- **Interactive Map**: MapLibre GL JS integration to display image previews, bounding boxes, and base maps.

## Phase 4: Agentic Controller & Query Panel
- **Query Panel**: Chat interface, suggestion chips.
- **Tool Registry**: Define and register static tool APIs (e.g., `vqa_model`, `land_cover_model`, `change_detector`).
- **Rule-Based Routing**: Parse intent, route to the correct sequence of tools based on image count and modality.
- **Execution Trace**: UI to display steps, validation, warnings, and confidence.

## Phase 5: Single-Image Workflows
- **VQA & Captioning**: "Demo Mode" fallback models with deterministic responses for the SIH demo.
- **Text-Guided Grounding**: Bounding box / GeoJSON extraction for specific queries (e.g., "Highlight water body").
- **Land-Cover Analysis**: Classification output, statistics, and charts.

## Phase 6: Bi-temporal Change Workflow
- **Change Detection**: Coregistration check, change mask generation.
- **UI Components**: Before/after swipe comparison.
- **Change VQA**: Answering questions like "Where did the built-up area increase?"

## Phase 7: Cross-modal (Optical-SAR) Fusion
- **Fusion Workflow**: Process co-registered Optical + SAR images.
- **Modality Agreement**: Show evidence from Optical (e.g. texture) and SAR (e.g. backscatter).
- **Confidence Scoring**: Unified formula combining image quality, pair compatibility, and model agreement.

## Phase 8: Polish & Export
- **Reports**: PDF, JSON, CSV, GeoJSON exports.
- **Documentation**: README, API docs, Demo Scripts.
- **Testing & Verification**: Pytest, Frontend tests, Error states, Empty states.
- **UI Polish**: ISRO-inspired, dark navy theme, high contrast.
