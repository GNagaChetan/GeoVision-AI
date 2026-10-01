# GeoVision AI — API Documentation

## Overview
GeoVision AI backend is powered by **FastAPI** with interactive Swagger OpenAPI documentation available at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

Base URL: `http://localhost:8000/api/v1`

---

## 1. System Health
- **`GET /health`**
  - Description: Returns operational status of all backend subsystems (DIP Engine, RS Engine, GIS Engine, LULC Engine, RAG Vector Store, Gemini API).
  - Response:
    ```json
    {
      "status": "healthy",
      "app_name": "GeoVision AI",
      "version": "1.0.0",
      "environment": "development",
      "services": {
        "dip_engine": true,
        "rs_engine": true,
        "gis_engine": true,
        "lulc_engine": true,
        "rag_vector_store": true,
        "gemini_api": true
      }
    }
    ```

---

## 2. Digital Image Processing (DIP)
- **`POST /api/v1/image-processing/process`**
  - Content-Type: `multipart/form-data`
  - Parameters:
    - `image_path` (string): Image path or sample alias (e.g. `sample:scene_2020_t1.png`).
    - `operation` (string): Operation name (`equalize`, `clahe`, `contrast_stretch`, `mean_filter`, `median_filter`, `gaussian_filter`, `sharpen`, `sobel`, `prewitt`, `roberts`, `canny`, `otsu`, `multi_otsu`, `adaptive_thresh`, `fft`, `kmeans_segmentation`).
    - `params_json` (string): JSON dictionary of parameters (e.g. `{"clip_limit": 2.5, "tile_grid_size": 8}`).
  - Response:
    - `output_image_url`: Relative URL to processed PNG output.
    - `stats_original` & `stats_processed`: Min, max, mean, standard deviation, Michelson contrast.
    - `histogram_original` & `histogram_processed`: 256-bin RGB / Grayscale distribution.
    - `mathematical_formula` & `academic_reference`: Direct mathematical formula and textbook citation.
    - `execution_time_ms`: Algorithm benchmark runtime in milliseconds.

- **`POST /api/v1/image-processing/quality`**
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "reference_image_path": "uploads/ref.png",
      "distorted_image_path": "uploads/proc.png"
    }
    ```
  - Response: `psnr` (dB), `ssim` (0.0 - 1.0), `mse`, and academic interpretation.

- **`POST /api/v1/image-processing/register`**
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "reference_image_path": "uploads/t1.png",
      "moving_image_path": "uploads/t2.png",
      "feature_type": "ORB"
    }
    ```
  - Response: `num_matches`, `homography_matrix` ($3\times3$), `registered_image_url`, `difference_image_url`, `alignment_error`.

---

## 3. Remote Sensing & Spectral Indices
- **`GET /api/v1/remote-sensing/sample-scenes`**
  - Returns list of verified multispectral satellite scenes (Sentinel-2 MSI 10m) with sensor specifications and acquisition dates.

- **`POST /api/v1/remote-sensing/spectral-index?index_type=NDVI`**
  - Computes Normalized Difference Vegetation Index (NDVI), Water Index (NDWI), or Built-up Index (NDBI).
  - Returns mean, min, max, std dev, 50-bin histogram, colormapped image overlay URL, and ecological interpretation.

- **`POST /api/v1/remote-sensing/false-color?preset=Standard_FCC`**
  - Generates False Color Composite (Standard NIR-Red-Green).

---

## 4. GIS & Spatial Vector Analytics
- **`GET /api/v1/gis/sample-study-area`**
  - Returns verified GeoJSON Polygon FeatureCollection for the active satellite scene boundary.

- **`POST /api/v1/gis/area-metrics`**
  - Body: `{ "geojson": { ... } }`
  - Returns true WGS84 geodesic area in $m^2$, hectares ($ha$), and $km^2$, geodesic perimeter ($m$), centroid $[lon, lat]$, and bounding box.

- **`POST /api/v1/gis/buffer`**
  - Body: `{ "geojson": { ... }, "distance_meters": 150.0 }`
  - Returns projected local UTM geodesic buffer geometry in GeoJSON format with original and expanded hectare measurements.

---

## 5. Land Use & Land Cover (LULC)
- **`POST /api/v1/lulc/classify?scene_id=scene_2020&resolution_m=10.0`**
  - Performs 5-class spectral classification (Vegetation, Water, Built-up, Agriculture, Bare Land).
  - Returns per-class pixel count, area ($ha$ & $km^2$), percentage of study area, and classification map PNG URL.

- **`POST /api/v1/lulc/temporal-change?resolution_m=10.0`**
  - Performs multi-temporal change detection ($T_1 \text{ 2020} \to T_2 \text{ 2025}$).
  - Returns $5 \times 5$ Transition Matrix ($ha$), net class gain/loss ($ha$ & %), and difference map PNG URL.

---

## 6. RAG & Knowledge Base
- **`POST /api/v1/rag/ingest`**
  - Content-Type: `multipart/form-data` (`file`, `doc_tag`)
  - Parses PDF, TXT, or MD, chunks semantically, computes TF-IDF vector embeddings, and stores in index.

- **`POST /api/v1/rag/query`**
  - Body: `{ "query": "NDVI mathematical formulation", "top_k": 4 }`
  - Returns cosine similarity ranked knowledge citations with document name, page number, and snippet.

- **`GET /api/v1/rag/documents`**
  - Returns indexed documents and chunk statistics.

---

## 7. Ask GeoVision Decision Assistant
- **`POST /api/v1/ask-geovision/chat`**
  - Body:
    ```json
    {
      "prompt": "Analyze urban expansion between 2020 and 2025 and evaluate a 100m buffer zone around the river.",
      "active_dataset_id": "scene_2020",
      "include_rag_context": true
    }
    ```
  - Returns synthesized, citation-grounded response with verified numerical metrics, structured GIS actions, and literature citations.
