# GeoVision AI — Production Deployment & Operations Guide
**Version:** 1.0.0  
**Stack:** FastAPI, React (Vite), PostgreSQL 16 + PostGIS + pgvector, Docker Compose, Nginx

---

## 1. System Requirements & Architecture

### Recommended Hardware
- **CPU:** 4+ Cores (for parallel raster convolution and FFT transformations)
- **RAM:** 8 GB minimum (16 GB recommended for large GeoTIFF processing)
- **Disk:** 20 GB SSD storage (for satellite datasets, vector layers, and embeddings)
- **OS:** Linux (Ubuntu 22.04 LTS / Debian 12), Windows 11 with WSL2, or macOS

### Architecture Topology
```
                  [ Client Browser ]
                          │ (Port 5173 / 80)
                          ▼
            [ Frontend Service: Nginx Alpine ]
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
    [ Static HTML/JS/CSS ]      [ Reverse Proxy: /api/* ]
                                          │ (Port 8000)
                                          ▼
                         [ Backend: FastAPI (Python 3.11) ]
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       [ PostGIS + pgvector DB ]                     [ Sandboxed Storage ]
          (Port 5432: PostgreSQL)                    - /uploads
                                                     - /data/sample_datasets
                                                     - /data/reports
```

---

## 2. Quick Start: Docker Compose Deployment

### Step 1: Clone and Configure Environment
```bash
# 1. Clone the repository
git clone https://github.com/geovision-ai/geovision-ai.git
cd geovision-ai

# 2. Copy and configure the environment file
cp .env.example .env
```

Edit `.env` to set your PostgreSQL credentials and optional Gemini API key:
```env
POSTGRES_USER=geovision_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=geovision_db
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 2: Build and Start Containers
```bash
# Build multi-stage images for backend and frontend
docker compose build

# Launch the full containerized stack in detached mode
docker compose up -d
```

### Step 3: Verify Container Health
```bash
docker compose ps
```
Expected output:
```
NAME                 IMAGE                   COMMAND                  SERVICE    STATUS
geovision_db         postgis/postgis:16-3.4  "docker-entrypoint.s…"   db         running (healthy)
geovision_backend    geovision_backend       "uvicorn main:app -…"    backend    running (healthy)
geovision_frontend   geovision_frontend      "nginx -g 'daemon of…"   frontend   running
```

---

## 3. Health Checks & Verification

### Automated Service Health Check
Run an HTTP GET request against the backend health endpoint:
```bash
curl http://localhost:8000/api/v1/health
```
Response:
```json
{
  "status": "healthy",
  "app_name": "GeoVision AI",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2026-10-02T03:00:00Z"
}
```

### Web Interface Access
- **GeoVision AI Dashboard:** [http://localhost:5173](http://localhost:5173) (or `http://localhost` if mapped to port 80)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. Database Migrations & Vector Initialization

The PostGIS database container automatically initializes required spatial and vector extensions. If migrating or initializing manually:

```bash
# Connect to the PostgreSQL container
docker compose exec db psql -U geovision_user -d geovision_db

# Verify PostGIS and pgvector extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installed extensions
\dx
```

---

## 5. Backup and Disaster Recovery

### Database Backup
```bash
# Dump complete database including spatial geometries and vector embeddings
docker compose exec db pg_dump -U geovision_user -d geovision_db -F c -b -v -f /tmp/geovision_backup.dump

# Copy dump file to host
docker cp geovision_db:/tmp/geovision_backup.dump ./backups/geovision_$(date +%Y%m%d).dump
```

### Database Restore
```bash
# Copy dump to container and restore
docker cp ./backups/geovision_20261002.dump geovision_db:/tmp/restore.dump
docker compose exec db pg_restore -U geovision_user -d geovision_db -v -c /tmp/restore.dump
```

### Uploaded File and Report Storage Backup
```bash
# Archive all uploads, vector store indices, and generated reports
tar -czvf backups/geovision_storage_$(date +%Y%m%d).tar.gz backend/uploads/ backend/data/
```

---

## 6. Troubleshooting Guide

| Symptom | Probable Cause | Resolution |
|---|---|---|
| **`docker compose up` fails on DB health check** | Port 5432 already in use by local PostgreSQL service | Change `POSTGRES_PORT=5433` in `.env` or stop the host PostgreSQL instance (`sudo systemctl stop postgresql`). |
| **OpenCV `libGL.so.1` error on startup** | Missing system OpenGL libraries in base image | Ensured `libgl1` and `libglib2.0-0` are included in `backend/Dockerfile`. Rebuild with `docker compose build --no-cache backend`. |
| **RAG search returns empty citations** | Knowledge base directory unindexed or empty | Ensure `data/knowledge_base/` contains `.md`/`.txt` files. In the UI, visit `/knowledge-base` and upload documents. |
| **Ask GeoVision LLM responses are fallback only** | Missing or invalid `GEMINI_API_KEY` | Set a valid Google Gemini API key in `.env` and restart backend (`docker compose restart backend`). Grounded fallback mode operates deterministically without keys. |
| **CORS errors when accessing API from external host** | Host origin not in `CORS_ORIGINS` | Add the client domain or IP to `CORS_ORIGINS` in `.env` (comma-separated, e.g., `http://my-server-ip:5173`). |
