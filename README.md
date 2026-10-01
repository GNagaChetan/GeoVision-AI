# GeoVision AI

> **Intelligent Satellite Image Processing, GIS Analytics and RAG-Based Geospatial Decision Support System**

GeoVision AI is an academic and enterprise-grade full-stack platform uniting **Digital Image Processing (DIP)**, **Remote Sensing (RS)**, **Geographic Information Systems (GIS)**, **Land Use / Land Cover (LULC) Analytics**, and **Retrieval-Augmented Generation (RAG)** powered by Google Gemini for grounded geospatial decision support.

---

## 🌟 Key Capabilities

1. **Digital Image Processing (DIP) Studio**
   - **Histograms & Enhancement**: Global Histogram Equalization, CLAHE, Contrast Stretching.
   - **Spatial Filters**: Mean, Median (despeckling), Gaussian, Laplacian Sharpening, Unsharp Masking.
   - **Edge Detection**: Sobel ($G_x, G_y$), Prewitt, Roberts Cross, Canny Multi-stage.
   - **Segmentation & Thresholding**: Otsu, Multi-Otsu, Adaptive Mean/Gaussian, K-Means clustering.
   - **Frequency Domain (FFT)**: 2D Fourier transform spectrum visualization, Low-pass & High-pass frequency filtering.
   - **Quality Estimation**: Peak Signal-to-Noise Ratio (PSNR), Structural Similarity Index (SSIM), MSE.
   - **Image Registration**: Feature extraction (ORB), matching, RANSAC homography transformation.

2. **Remote Sensing & Spectral Indices**
   - **Multi-spectral Analytics**: NDVI (Vegetation), NDWI (Water), NDBI (Built-up).
   - **Geospatial Metadata**: Sensor resolution, acquisition timestamp, bounding box, CRS transformation.
   - **True Color & False Color Composite Generation**: Standard FCC (NIR-Red-Green), Agriculture (SWIR-NIR-Blue).

3. **GIS & Vector Analytics**
   - **Interactive Layer Management**: GeoJSON vectors, raster overlays, split-screen swipe comparator.
   - **Spatial Operations**: Geodesic area calculation ($\text{km}^2$ / hectares), buffering, bounding envelope, centroid calculation.
   - **Spatial Queries**: Geometry intersection, containment, point-in-polygon queries.

4. **LULC & Temporal Change Detection**
   - **5 Standard Classes**: Vegetation, Water, Built-up, Agriculture, Bare Land.
   - **Change Matrix (Transition Matrix)**: Pixel-accurate area transition between temporal timestamps ($T_1 \to T_2$).
   - **Dynamic Visualization**: Real-time Recharts class distributions, gain/loss metrics, area tables.

5. **RAG & Knowledge Engine**
   - **Document Ingestion**: PDF, Markdown, and TXT parsing with semantic chunking and metadata retention.
   - **Vector Search**: Semantic similarity matching with source citations, page numbers, and relevance scores.
   - **Grounded Knowledge Base**: Pre-loaded with remote sensing textbooks, DIP theory, and geospatial guidelines.

6. **Ask GeoVision (AI Decision Support Assistant)**
   - Unified multi-modal reasoning connecting active map data, computed GIS analytics, RAG knowledge, and Gemini LLM.
   - Safe execution of structured geospatial operations with verified numeric evidence and source citations.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Leaflet / React-Leaflet, Recharts, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **Image Processing** | OpenCV (`cv2`), NumPy, scikit-image (`skimage`), SciPy |
| **GIS & RS** | Rasterio, Shapely, PyProj, GeoJSON |
| **AI / RAG / LLM** | Google GenAI SDK (Gemini 2.5 Flash), Text Embeddings, Vector Index |
| **Database & Infra** | PostgreSQL 16 + PostGIS + pgvector, Docker & Docker Compose |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (verified: v22.14.0)
- Python 3.11+ (verified: Python 3.13 via `py`)
- Docker & Docker Compose (optional for full container stack)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment using Python launcher
py -m venv .venv

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 📚 Academic Traceability

Every major feature in GeoVision AI maps directly to established principles of:
- **Digital Image Processing**: Gonzalez & Woods, *Digital Image Processing*, 4th Edition.
- **Remote Sensing and Image Interpretation**: Lillesand, Kiefer & Chipman, *Remote Sensing and Image Interpretation*, 7th Edition.
- **GIS Principles**: Longley et al., *Geographic Information Science and Systems*.
