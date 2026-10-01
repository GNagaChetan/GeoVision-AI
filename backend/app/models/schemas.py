from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ===================================================
# Common & Health Models
# ===================================================
class HealthResponse(BaseModel):
    status: str = "ok"
    app_name: str
    version: str
    environment: str
    services: Dict[str, bool]

# ===================================================
# Digital Image Processing (DIP) Models
# ===================================================
class HistogramData(BaseModel):
    bins: List[int]
    counts_r: Optional[List[int]] = None
    counts_g: Optional[List[int]] = None
    counts_b: Optional[List[int]] = None
    counts_gray: Optional[List[int]] = None

class ImageStats(BaseModel):
    width: int
    height: int
    channels: int
    min_val: float
    max_val: float
    mean_val: float
    std_val: float
    contrast: float

class DIPProcessRequest(BaseModel):
    operation: str = Field(..., description="DIP operation name (e.g. 'equalize', 'clahe', 'gaussian', 'median', 'sharpen', 'sobel', 'canny', 'otsu', 'adaptive_thresh', 'fft')")
    params: Dict[str, Any] = Field(default_factory=dict)
    save_output: bool = True

class DIPProcessResponse(BaseModel):
    success: bool
    operation: str
    output_image_url: str
    original_image_url: str
    stats_original: ImageStats
    stats_processed: ImageStats
    histogram_original: HistogramData
    histogram_processed: HistogramData
    parameters_applied: Dict[str, Any]
    academic_reference: str
    mathematical_formula: Optional[str] = None
    execution_time_ms: float

class ImageQualityRequest(BaseModel):
    reference_image_path: str
    distorted_image_path: str

class ImageQualityResponse(BaseModel):
    psnr: float
    ssim: float
    mse: float
    interpretation: str

class ImageRegistrationRequest(BaseModel):
    reference_image_path: str
    moving_image_path: str
    feature_type: str = "ORB" # ORB or SIFT

class ImageRegistrationResponse(BaseModel):
    success: bool
    num_matches: int
    homography_matrix: Optional[List[List[float]]] = None
    registered_image_url: str
    difference_image_url: str
    alignment_error: float

# ===================================================
# Remote Sensing (RS) Models
# ===================================================
class RasterMetadata(BaseModel):
    filename: str
    width: int
    height: int
    bands: int
    crs: str
    bounds: List[float] # [minx, miny, maxx, maxy]
    resolution: List[float]
    sensor_name: Optional[str] = None
    acquisition_date: Optional[str] = None
    is_sample_data: bool = True

class SpectralIndexRequest(BaseModel):
    index_type: str = Field(..., description="NDVI, NDWI, or NDBI")
    red_band_idx: int = 1
    nir_band_idx: int = 2
    green_band_idx: Optional[int] = 3
    swir_band_idx: Optional[int] = 4

class SpectralIndexResponse(BaseModel):
    index_type: str
    mean_value: float
    min_value: float
    max_value: float
    std_value: float
    colormap_image_url: str
    histogram: HistogramData
    academic_formula: str
    interpretation: str

# ===================================================
# GIS & Vector Analytics Models
# ===================================================
class SpatialAreaRequest(BaseModel):
    geojson: Dict[str, Any]

class SpatialAreaResponse(BaseModel):
    area_sq_meters: float
    area_hectares: float
    area_sq_km: float
    perimeter_meters: float
    centroid: List[float]
    bounding_box: List[float]
    is_valid: bool

class SpatialBufferRequest(BaseModel):
    geojson: Dict[str, Any]
    distance_meters: float

class SpatialBufferResponse(BaseModel):
    buffered_geojson: Dict[str, Any]
    original_area_ha: float
    buffered_area_ha: float
    distance_meters: float

# ===================================================
# LULC & Temporal Change Detection Models
# ===================================================
class LULCClassMetric(BaseModel):
    class_id: int
    class_name: str
    color_hex: str
    pixel_count: int
    area_hectares: float
    area_sq_km: float
    percentage: float

class LULCClassificationResponse(BaseModel):
    dataset_name: str
    total_area_hectares: float
    total_area_sq_km: float
    classes: List[LULCClassMetric]
    classification_map_url: str
    method_used: str

class LULCTemporalComparisonRequest(BaseModel):
    t1_dataset_id: str
    t2_dataset_id: str

class LULCTemporalComparisonResponse(BaseModel):
    t1_timestamp: str
    t2_timestamp: str
    total_area_ha: float
    t1_classes: List[LULCClassMetric]
    t2_classes: List[LULCClassMetric]
    class_changes: List[Dict[str, Any]] # {class_name, t1_ha, t2_ha, change_ha, change_pct}
    transition_matrix: List[List[float]] # NxN transition in hectares
    transition_labels: List[str]
    change_map_url: str

# ===================================================
# RAG Models
# ===================================================
class DocumentIngestionResponse(BaseModel):
    filename: str
    doc_type: str
    num_chunks: int
    character_count: int
    status: str

class RAGChunkCitation(BaseModel):
    document_name: str
    page_number: Optional[int] = None
    chunk_index: int
    similarity_score: float
    snippet: str

class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 4
    filter_tag: Optional[str] = None

class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[RAGChunkCitation]
    grounded: bool
    context_used: List[str]

# ===================================================
# Ask GeoVision Multi-Modal Assistant Models
# ===================================================
class AskGeoVisionRequest(BaseModel):
    prompt: str
    active_dataset_id: Optional[str] = None
    active_coordinates: Optional[List[float]] = None
    include_rag_context: bool = True
    session_id: Optional[str] = None

class AskGeoVisionResponse(BaseModel):
    response_text: str
    rag_citations: List[RAGChunkCitation]
    structured_analytics: Optional[Dict[str, Any]] = None
    map_actions: Optional[List[Dict[str, Any]]] = None
    executed_tools: List[str]
    grounding_status: str
