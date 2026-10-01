# GeoVision AI — Development Guide

## 1. Quick Start Guide

### 1.1 Prerequisites
- **Node.js**: v18+ (tested with v22.14.0)
- **Python**: v3.11+ (tested with Python 3.13 via Python launcher `py`)
- **Docker & Docker Compose**: Optional for containerized multi-service deployment

---

## 2. Local Development Setup

### 2.1 Backend Setup (FastAPI)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
py -3.13 -m venv .venv

# 3. Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. Start FastAPI development server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be accessible at `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.

### 2.2 Frontend Setup (React + TypeScript + Vite)
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install npm dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Frontend Web Console will be accessible at `http://localhost:5173`.

---

## 3. Docker Deployment (PostGIS + Backend + Frontend)

```bash
# Build and launch the multi-container stack
docker compose up --build -d

# Verify running containers
docker compose ps

# View backend logs
docker compose logs -f backend
```

---

## 4. Frontend Application Routes

| Route | Page / Workspace | Description |
| :--- | :--- | :--- |
| `/` or `/dashboard` | **Executive Dashboard** | System overview, active satellite scenes, quick telemetry |
| `/satellite` | **Satellite Explorer** | Multispectral band visualizer, sensor resolutions, metadata |
| `/image-processing` | **DIP Algorithm Studio** | 16+ classical filters, edge detection, FFT, PSNR/SSIM |
| `/lulc` | **LULC Analytics** | 5-Class spectral segmentation, hectare distribution |
| `/change-detection` | **Temporal Change** | Multi-date comparison, $5 \times 5$ transition matrix ($T_1 \to T_2$) |
| `/gis` | **GIS Map Explorer** | Interactive Leaflet map, vector overlays, geodesic buffering |
| `/analytics` | **Geospatial Analytics** | Statistical summaries, NDVI/NDWI trends, Recharts visualizer |
| `/knowledge-base` | **RAG Knowledge Base** | Domain literature ingestion, vector similarity search |
| `/ask-geovision` | **Ask GeoVision Assistant** | Grounded AI decision support assistant with Gemini 2.5 |
| `/reports` | **Reports & Exports** | Analytical summary generator & GeoJSON exports |
| `/settings` | **System Settings** | CRS datums, sensor configurations, API keys |

---

## 5. Testing & Quality Assurance

```bash
# Run backend pytest suite
cd backend
.venv\Scripts\pytest tests\test_geovision.py -v

# Run frontend type check and production build
cd frontend
npm run build
```
