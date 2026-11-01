# GeoVision AI — Academic Curriculum Compliance & Syllabus Mapping
**Courses Covered:**
1. **Remote Sensing and Geographic Information Systems (RS & GIS)**
2. **Digital Image Processing (DIP)**

**Target Audience:** Academic Reviewers, Course Instructors, and Geospatial Researchers  
**Audit Date:** October 2026  
**Implementation Standard:** Rigorous algorithmic and mathematical implementations without placeholder or mocked data.

---

## 1. Remote Sensing & GIS Curriculum Mapping

| Academic Concept | Status | Implementation Source File | API Endpoint | UI Page / Component | Algorithm / Service & Mathematical Foundation | Database / Persistence |
|---|---|---|---|---|---|---|
| **Remote Sensing Fundamentals** | **IMPLEMENTED** | `backend/app/services/remote_sensing/` | `GET /api/v1/remote-sensing/sample-scenes` | `/remote-sensing` | Multi-spectral band decomposition, radiometric calibration, and spectral reflectance signatures. | Sample GeoTIFF scenes stored in `data/sample_datasets/` |
| **Passive vs. Active Remote Sensing** | **IMPLEMENTED** | `backend/app/services/rag_service.py` | `POST /api/v1/rag/query` | `/knowledge-base` | Ingested optical (passive Sentinel-2/Landsat) and SAR (active) radiometric theory with semantic retrieval. | Vector store chunk embeddings in `rag_service` |
| **Electromagnetic Spectrum Concepts** | **IMPLEMENTED** | `backend/app/services/remote_sensing/spectral_indices.py` | `POST /api/v1/remote-sensing/composite/false-color` | `/remote-sensing` | Wavelength band assignment: B02 (Blue ~490nm), B03 (Green ~560nm), B04 (Red ~665nm), B08 (NIR ~842nm). | Stored in GeoTIFF band tags |
| **Spatial & Radiometric Resolution** | **IMPLEMENTED** | `backend/app/services/remote_sensing/raster_io.py` | `POST /api/v1/remote-sensing/bands/inspect` | `/remote-sensing` | Extraction of Ground Sampling Distance (10.0m GSD) and bit depth (12-bit/16-bit to Float32 normalization). | Raster metadata dictionary |
| **Sensors & Satellite Metadata** | **IMPLEMENTED** | `backend/app/services/remote_sensing/raster_io.py` | `POST /api/v1/remote-sensing/metadata` | `/remote-sensing` | Extraction of EPSG CRS, bounding box coordinates, affine geotransform, and driver attributes. | GeoTIFF tags & PostGIS metadata |
| **Image Interpretation (Composites)** | **IMPLEMENTED** | `backend/app/services/remote_sensing/composites.py` | `POST /api/v1/remote-sensing/composite/false-color` | `/remote-sensing` | Standard False Color Composite (NIR-Red-Green $\to$ RGB) for vegetation canopy highlighting and True Color (RGB). | Processed PNG outputs in `/uploads/processed/` |
| **Raster Data Modeling** | **IMPLEMENTED** | `backend/app/services/gis/raster_gis.py` | `POST /api/v1/gis/raster-metadata` | `/gis` | Affine transformation matrix ($[a, b, d, e, x_{\text{off}}, y_{\text{off}}]$), pixel resolution, and raster-to-world mapping. | `data/gis_layers/` |
| **Vector Data Modeling** | **IMPLEMENTED** | `backend/app/services/gis/geometry.py` | `POST /api/v1/gis/validate-geojson` | `/gis` | GeoJSON FeatureCollection parsing, Point/LineString/Polygon/MultiPolygon validation, and compactness ratios. | PostGIS `GEOMETRY(Polygon, 4326)` |
| **Spatial Referencing & CRS Transformations** | **IMPLEMENTED** | `backend/app/services/gis/crs_engine.py` | `POST /api/v1/gis/crs/validate-and-transform` | `/gis` | PyProj/PROJ geodesic transformation between WGS84 (EPSG:4326), UTM Zone 43N/44N (EPSG:32643/32644), and Web Mercator (EPSG:3857). | CRS definition catalog |
| **GIS Operations (Buffering & Overlay)** | **IMPLEMENTED** | `backend/app/services/gis/geodesic.py` | `POST /api/v1/gis/buffer` | `/gis`, `/ask-geovision` | Geodesic UTM buffering using Shapely `buffer(cap_style=1)` and polygon-in-polygon spatial intersections. | Persistent vector layers in JSON/PostGIS |
| **Geodesic Area & Perimeter Calculation** | **IMPLEMENTED** | `backend/app/services/gis/geodesic.py` | `POST /api/v1/gis/area-metrics` | `/gis` | True ellipsoidal WGS84 geodesic area (Shoelace formula projected to UTM / Karney geodesic algorithms). | Geometry metric response schema |
| **Land Use / Land Cover (LULC) Classification** | **IMPLEMENTED** | `backend/app/services/lulc_service.py` | `POST /api/v1/lulc/classify` | `/lulc` | Multi-class spectral partitioning (Vegetation, Water, Built-up, Agriculture, Bare Land) with exact hectare & percentage calculation. | LULC class metric distributions |
| **Multi-Temporal Change Detection** | **IMPLEMENTED** | `backend/app/services/change_detection_service.py` | `POST /api/v1/change-detection/analyze` | `/change-detection` | Multi-date (2020 vs 2025) cross-classification, $5 \times 5$ transition matrix, net flux, and difference map generation. | Change analytics history |
| **Vegetation Health & NDVI** | **IMPLEMENTED** | `backend/app/services/vegetation_service.py` | `POST /api/v1/vegetation/ndvi` | `/vegetation` | $\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$ with 5 health thresholds (Water/Cloud, Bare Soil, Sparse, Moderate, Dense). | Multi-band GeoTIFF processing |
| **Geospatial Decision Support (AI Assistant)** | **IMPLEMENTED** | `backend/app/services/llm_service.py` | `POST /api/v1/ask-geovision/query` | `/ask-geovision` | 3-source intelligence routing (Project DB, GIS Geodesics, RAG literature) with allowlisted structured query execution. | Query history & context |
| **GPS / Real-Time GNSS Kinematics** | **PARTIALLY IMPLEMENTED** | `backend/app/services/gis/crs_engine.py` | Supported via GeoJSON upload | `/gis` | Supports WGS84 GPS coordinate ingestion and projection; real-time NMEA streaming is not implemented. | GeoJSON coordinate arrays |
| **Hyperspectral Band Unmixing** | **NOT IMPLEMENTED** | N/A | N/A | N/A | Multispectral (4-12 band) processing is implemented; 224-band AVIRIS hyperspectral unmixing is not implemented. | N/A |

---

## 2. Digital Image Processing (DIP) Curriculum Mapping

| Academic Concept | Status | Implementation Source File | API Endpoint | UI Page / Component | Algorithm / Mathematical Implementation |
|---|---|---|---|---|---|
| **Image Acquisition & Storage** | **IMPLEMENTED** | `backend/app/services/image_processing/io.py` | `POST /api/v1/image-processing/upload` | `/image-processing` | Multi-format image loader (GeoTIFF, PNG, JPEG) with dtype handling (`uint8`, `float32`). |
| **Image Sampling & Quantization** | **IMPLEMENTED** | `backend/app/services/image_processing/analysis.py` | `POST /api/v1/image-processing/sampling-quantization` | `/image-processing` | Spatial downsampling factor ($2\times, 4\times, 8\times$) and bit-depth quantization ($1 \text{ to } 8 \text{ bits}, 2^k \text{ levels}$). |
| **Color Models & Transformations** | **IMPLEMENTED** | `backend/app/services/image_processing/transforms.py` | `POST /api/v1/image-processing/colorspace` | `/image-processing` | Transformations between RGB, Grayscale, HSV, LAB, and YCrCb color spaces. |
| **Histogram & Statistical Moments** | **IMPLEMENTED** | `backend/app/services/image_processing/histogram.py` | `POST /api/v1/image-processing/histogram` | `/image-processing` | 256-bin histogram computation, PDF, CDF, Mean ($\mu$), Standard Deviation ($\sigma$), Variance ($\sigma^2$), Skewness, and Kurtosis. |
| **Histogram Equalization & CLAHE** | **IMPLEMENTED** | `backend/app/services/image_processing/histogram.py` | `POST /api/v1/image-processing/process` | `/image-processing` | Global Histogram Equalization $s_k = T(r_k) = (L-1) \sum_{j=0}^k p_r(r_j)$ and Contrast Limited Adaptive Histogram Equalization (CLAHE). |
| **Linear Contrast Stretching (Min-Max)** | **IMPLEMENTED** | `backend/app/services/image_processing/enhancement.py` | `POST /api/v1/image-processing/process` | `/image-processing` | $g(x,y) = \frac{f(x,y) - f_{\min}}{f_{\max} - f_{\min}} \times 255$. |
| **Gamma Power-Law Transformation** | **IMPLEMENTED** | `backend/app/services/image_processing/enhancement.py` | `POST /api/v1/image-processing/process` | `/image-processing` | $s = c \cdot r^\gamma$ with configurable $\gamma \in [0.1, 5.0]$. |
| **Spatial Filtering (Smoothing)** | **IMPLEMENTED** | `backend/app/services/image_processing/filters.py` | `POST /api/v1/image-processing/process` | `/image-processing` | Mean/Box Filter, Gaussian 2D Kernel $G(x,y) = \frac{1}{2\pi\sigma^2} e^{-\frac{x^2+y^2}{2\sigma^2}}$, and Non-linear Median Filter. |
| **Spatial Sharpening (Laplacian & Unsharp)** | **IMPLEMENTED** | `backend/app/services/image_processing/filters.py` | `POST /api/v1/image-processing/process` | `/image-processing` | Laplacian 2nd-derivative $\nabla^2 f = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2}$ and Unsharp Masking ($f_{\text{sharp}} = f + k \cdot (f - f_{\text{smooth}})$). |
| **Edge Detection (First & Second Derivatives)** | **IMPLEMENTED** | `backend/app/services/image_processing/edges.py` | `POST /api/v1/image-processing/process` | `/image-processing` | Sobel ($3\times3$), Prewitt ($3\times3$), Roberts Cross ($2\times2$), and Canny Multi-Stage Edge Detector (Gaussian $\to$ Gradient $\to$ Non-Max Suppression $\to$ Hysteresis). |
| **Thresholding Algorithms** | **IMPLEMENTED** | `backend/app/services/image_processing/segmentation.py` | `POST /api/v1/image-processing/process` | `/image-processing` | Global Thresholding, Otsu's Optimum Inter-Class Variance Maximization $\sigma_B^2(t)$, and Adaptive Gaussian/Mean Thresholding. |
| **Region-Based Segmentation & Contours** | **IMPLEMENTED** | `backend/app/services/image_processing/segmentation.py` | `POST /api/v1/image-processing/process` | `/image-processing` | Watershed transform with distance transform markers, and Connected Components contour extraction with bounding boxes. |
| **2D Discrete Fourier Transform (2D-DFT / FFT)** | **IMPLEMENTED** | `backend/app/services/image_processing/frequency.py` | `POST /api/v1/image-processing/process` | `/image-processing` | 2D-FFT $F(u,v) = \sum_{x=0}^{M-1} \sum_{y=0}^{N-1} f(x,y) e^{-j 2\pi (\frac{ux}{M} + \frac{vy}{N})}$, centering DC component, magnitude spectrum, phase spectrum, and Ideal/Butterworth/Gaussian Lowpass/Highpass filtering. |
| **Noise Models & Image Restoration** | **IMPLEMENTED** | `backend/app/services/image_processing/restoration.py` | `POST /api/v1/image-processing/process` | `/image-processing` | Gaussian noise, Salt-and-Pepper noise, Speckle noise generation; Wiener filter restoration and bilateral edge-preserving smoothing. |
| **Image Quality & Fidelity Metrics** | **IMPLEMENTED** | `backend/app/services/image_processing/quality.py` | `POST /api/v1/image-processing/quality-metrics` | `/image-processing` | Peak Signal-to-Noise Ratio ($\text{PSNR} = 10 \log_{10} \frac{\text{MAX}^2}{\text{MSE}}$), Mean Squared Error ($\text{MSE}$), and Structural Similarity Index ($\text{SSIM}$). |
| **Image Registration & Geometric Alignment** | **IMPLEMENTED** | `backend/app/services/image_processing/registration.py` | `POST /api/v1/image-processing/register` | `/image-processing` | ORB / SIFT feature keypoint extraction, RANSAC homography estimation ($H$), affine warping, and sub-pixel alignment. |
| **Texture Analysis (GLCM)** | **IMPLEMENTED** | `backend/app/services/image_processing/texture.py` | `POST /api/v1/image-processing/texture` | `/image-processing` | Gray-Level Co-occurrence Matrix (GLCM) computing Haralick features: Contrast, Dissimilarity, Homogeneity, Energy, and Correlation. |
| **Morphological Operations** | **IMPLEMENTED** | `backend/app/services/image_processing/filters.py` | `POST /api/v1/image-processing/process` | `/image-processing` | Dilation ($A \oplus B$), Erosion ($A \ominus B$), Opening ($A \circ B$), and Closing ($A \bullet B$) with rectangular and elliptical structuring elements. |

---

## 3. Academic Demonstration Checklist for Faculty Review

Use this checklist during academic evaluation or project viva:

1. **Remote Sensing Pipeline**:
   - [x] Open `/remote-sensing`. Load `sentinel2_multispectral_sample.tif`.
   - [x] Inspect multi-band metadata (EPSG:32643, 10m GSD, 4 spectral bands).
   - [x] Generate False Color Composite (NIR-Red-Green); verify dense vegetation appears in vibrant red.
2. **Digital Image Processing Suite**:
   - [x] Open `/image-processing`. Upload satellite sample scene.
   - [x] Run **Histogram Equalization** and inspect before/after histograms and cumulative distribution functions.
   - [x] Run **Frequency Domain FFT**; inspect 2D centered Fourier magnitude spectrum and apply Gaussian Lowpass filter.
   - [x] Run **Canny Edge Detection**; verify multi-stage gradient hysteresis tracking.
   - [x] Compare restored vs degraded images to compute exact PSNR (dB) and SSIM metrics.
3. **LULC & Multi-Date Change Detection**:
   - [x] Open `/lulc`; verify 5-class distribution with exact computed hectares and percentages.
   - [x] Open `/change-detection`; run 2020 vs 2025 analysis to inspect the $5 \times 5$ transition matrix and net urbanization flux.
4. **Automated Geospatial Reports**:
   - [x] Open `/reports`; click **Generate Project Report** to synthesize a 14-section academic report.
5. **Domain RAG & Decision Support Assistant**:
   - [x] Open `/knowledge-base`; test queries like *"What is remote sensing?"* or *"Explain histogram equalization."*
   - [x] Open `/ask-geovision`; ask *"What percentage of the study area is vegetation?"* (routes to Project DB) and *"Evaluate a 150m buffer"* (routes to GIS engine).
