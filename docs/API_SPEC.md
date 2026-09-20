# API Specification

## Authentication
- `POST /api/v1/auth/register`: Register a new user.
- `POST /api/v1/auth/login`: Authenticate and receive a JWT token.
- `GET /api/v1/auth/me`: Get current user profile and role.

## Projects Workspace
- `GET /api/v1/projects`: List all projects for the user.
- `POST /api/v1/projects`: Create a new project workspace.
- `GET /api/v1/projects/{project_id}`: Get project details.
- `PATCH /api/v1/projects/{project_id}`: Update project metadata.
- `DELETE /api/v1/projects/{project_id}`: Delete a project.

## Image Management
- `POST /api/v1/images/upload`: Upload image files (`.tif`, `.png`, etc.) to a project.
- `GET /api/v1/images/{image_id}`: Get image metadata (CRS, bounds, modality).
- `GET /api/v1/images/{image_id}/preview`: Fetch RGB/Grayscale preview image.
- `POST /api/v1/images/{image_id}/validate`: Trigger metadata and geospatial validation.
- `PATCH /api/v1/images/{image_id}/modality`: Manual override for detected modality.

## Image Pairs
- `POST /api/v1/pairs`: Create a new pair (bi-temporal or optical-SAR).
- `GET /api/v1/pairs/{pair_id}`: Get pair metadata.
- `POST /api/v1/pairs/{pair_id}/validate`: Trigger compatibility analysis (geographic overlap, resolution match).

## Analysis & Agentic Workflows
- `POST /api/v1/analysis/query`: Submit natural language query and image/pair IDs.
- `GET /api/v1/analysis/jobs/{job_id}`: Poll background job status.
- `GET /api/v1/analysis/jobs/{job_id}/trace`: Retrieve execution trace and validation steps.
- `GET /api/v1/analysis/results/{result_id}`: Fetch final text answers, confidences, and evidence maps.

## Reports & Exports
- `POST /api/v1/exports/{result_id}/pdf`: Generate and download PDF report.
- `GET /api/v1/exports/{result_id}/json`: Download full trace and results in JSON.
- `GET /api/v1/exports/{result_id}/csv`: Download area statistics in CSV.
- `GET /api/v1/exports/{result_id}/geojson`: Download spatial grounding outputs.
- `GET /api/v1/exports/{result_id}/geotiff`: Download generated masks/overlays.
