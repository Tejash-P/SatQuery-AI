# SatQuery AI

## Run locally

The default local configuration uses SQLite for the database and `backend/storage` for uploaded files. Redis, MinIO, PostgreSQL, and the Celery worker are not required for the normal local API workflow.

### 1. Install backend dependencies

From the repository root in PowerShell:

```powershell
python -m pip install -r backend/requirements-local.txt
```

### 2. Start the backend

```powershell
Push-Location backend
$env:PYTHONPATH = "."
python -m uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000` and its OpenAPI page is at `http://localhost:8000/docs`.

### 3. Start the frontend

Open a second PowerShell terminal:

```powershell
Push-Location frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

The frontend already points to `http://localhost:8000/api/v1` through `frontend/.env.local`.

## Production deployment

The repository includes deployment defaults for Vercel and Render:

### Backend on Render

1. Create a Render Blueprint from the repository. Render will use [`render.yaml`](render.yaml) to create the API and a Postgres database.
2. In the API service environment, set `CORS_ORIGINS` to the deployed Vercel URL, for example `https://satquery-ai.vercel.app`.
3. Keep the generated `JWT_SECRET` private. The API health check is available at `/health`.

The API stores uploads locally by default. Render's local filesystem is ephemeral, so configure S3-compatible storage by setting `STORAGE_MODE=minio` and the `MINIO_*` variables before using uploads in production.

### Frontend on Vercel

1. Import the repository into Vercel and set the project root directory to `frontend`.
2. Set `NEXT_PUBLIC_API_URL` to the Render API URL plus `/api/v1`, for example `https://satquery-api.onrender.com/api/v1`.
3. Deploy with the default Next.js build settings. [`frontend/vercel.json`](frontend/vercel.json) records the same settings for CLI deployments.

Example environment files are provided at [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).
