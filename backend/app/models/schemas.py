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
    metrics: Optional[Dict[str, Any]] = None

class ImageMetadataResponse(BaseModel):
    width: int
    height: int
    channels: int
    aspect_ratio: str
    color_model: str
    bit_depth: str
    memory_footprint_kb: float
    min_intensity: float
    max_intensity: float
    mean_intensity: float
    std_deviation: float
    michelson_contrast: float
    rms_contrast: float
    shannon_entropy: float
    source_path: Optional[str] = None

class ColorSpaceResponse(BaseModel):
    bgr_url: str
    rgb_url: str
    hsv_url: str
    lab_url: str
    ycrcb_url: str
    color_models: List[str]

class SamplingQuantizationRequest(BaseModel):
    image_path: str
    sampling_factor: int = 4
    quantization_levels: int = 8

class SamplingQuantizationResponse(BaseModel):
    sampled_image_url: str
    quantized_image_url: str
    sampling_metrics: Dict[str, Any]
    quantization_metrics: Dict[str, Any]

class TextureAnalysisRequest(BaseModel):
    image_path: str

class TextureAnalysisResponse(BaseModel):
    glcm_metrics: Dict[str, float]
    lbp_metrics: Dict[str, float]
    lbp_map_url: str

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
    feature_type: str = "ORB" # ORB, SIFT, AKAZE

class ImageRegistrationResponse(BaseModel):
    success: bool
    num_matches: int
    homography_matrix: Optional[List[List[float]]] = None
    registered_image_url: str
    difference_image_url: str
    alignment_error: float
    message: Optional[str] = None

# ===================================================
# Remote Sensing (RS) Models
# ===================================================
class BandInfo(BaseModel):
    band_index: int
    name: str
    wavelength_nm: Optional[float] = None
    common_name: Optional[str] = None
    data_type: str
    min_val: float
    max_val: float
    mean_val: float
    std_val: float
    preview_url: Optional[str] = None

class RasterMetadata(BaseModel):
    filename: str
    file_path: str
    format: str
    width: int
    height: int
    band_count: int
    data_type: str
    nodata_value: Optional[float] = None
    crs: str
    is_projected: bool = False
    units: str = "degrees"
    spatial_resolution: List[float] = [10.0, 10.0]
    bounds_native: List[float] # [minx, miny, maxx, maxy]
    bounds_wgs84: List[float] # [min_lon, min_lat, max_lon, max_lat]
    geographic_extent: Optional[Dict[str, Any]] = None # GeoJSON polygon geometry
    center_coordinates: List[float] = [0.0, 0.0] # [lat, lon]
    platform: Optional[str] = None
    sensor: Optional[str] = None
    acquisition_date: Optional[str] = None
    bands: List[BandInfo] = []
    is_valid_raster: bool = True
    validation_message: Optional[str] = None
    is_sample_data: bool = False

class RasterValidationResponse(BaseModel):
    is_valid: bool
    filename: str
    format: str
    band_count: int
    width: int
    height: int
    crs: str
    message: str
    has_georeferencing: bool
    details: Dict[str, Any] = {}

class BandVisualizationRequest(BaseModel):
    raster_path: str
    band_index: int = 1
    colormap: str = "grayscale" # grayscale, viridis, magma, ocean, summer, hot
    percentile_min: float = 2.0
    percentile_max: float = 98.0

class BandVisualizationResponse(BaseModel):
    band_index: int
    band_name: str
    preview_url: str
    colormap: str
    min_val: float
    max_val: float
    mean_val: float
    std_val: float
    histogram: HistogramData

class RGBCompositeRequest(BaseModel):
    raster_path: str
    r_band_idx: int = 1
    g_band_idx: int = 2
    b_band_idx: int = 3
    percentile_stretch: bool = True

class RGBCompositeResponse(BaseModel):
    success: bool
    composite_url: str
    bands_mapped: Dict[str, int]
    description: str

class FalseColorCompositeRequest(BaseModel):
    raster_path: str
    preset: str = "Color_Infrared" # Color_Infrared, Agriculture, Urban_SWIR, Atmospheric_Penetration, Custom
    r_band_idx: Optional[int] = None
    g_band_idx: Optional[int] = None
    b_band_idx: Optional[int] = None

class FalseColorCompositeResponse(BaseModel):
    success: bool
    composite_url: str
    preset_used: str
    bands_used: Dict[str, int]
    required_bands_present: bool
    academic_rationale: str
    message: Optional[str] = None

class SpectralIndexRequest(BaseModel):
    raster_path: Optional[str] = None
    index_type: str = Field(..., description="NDVI, NDWI, NDBI, SAVI, EVI, GNDVI")
    nir_band_idx: Optional[int] = None
    red_band_idx: Optional[int] = None
    green_band_idx: Optional[int] = None
    swir_band_idx: Optional[int] = None
    blue_band_idx: Optional[int] = None

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
    required_bands_present: bool = True
    message: Optional[str] = None

class StudyAreaProject(BaseModel):
    project_id: str
    project_name: str
    description: str
    created_at: str
    raster_path: str
    study_area_geojson: Optional[Dict[str, Any]] = None
    area_hectares: Optional[float] = None
    metadata: Optional[RasterMetadata] = None

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

class GeoJSONValidationRequest(BaseModel):
    geojson: Dict[str, Any]

class GeoJSONValidationResponse(BaseModel):
    is_valid: bool
    issues: List[str]
    feature_count: int
    geometry_types: List[str]
    total_vertices: int
    repaired_geojson: Optional[Dict[str, Any]] = None

class DistanceSegment(BaseModel):
    segment_index: int
    from_point: List[float]
    to_point: List[float]
    distance_meters: float
    distance_km: float
    forward_azimuth_deg: float
    back_azimuth_deg: float

class DistanceCalculationRequest(BaseModel):
    coordinates: List[List[float]] # List of [lon, lat]

class DistanceCalculationResponse(BaseModel):
    total_distance_meters: float
    total_distance_km: float
    total_distance_nautical_miles: float
    point_count: int
    segments: List[DistanceSegment]

class PointInPolygonRequest(BaseModel):
    point: List[float] # [lon, lat]
    layer_id: Optional[str] = None
    geojson: Optional[Dict[str, Any]] = None

class PointInPolygonMatch(BaseModel):
    feature_id: str
    properties: Dict[str, Any]
    geometry_type: str
    area_hectares: float
    centroid: List[float]
    bounds: List[float]
    contains_point: bool

class PointInPolygonResponse(BaseModel):
    matches: List[PointInPolygonMatch]
    point: List[float]

class BBoxQueryRequest(BaseModel):
    bbox: List[float] # [minx, miny, maxx, maxy]
    layer_id: Optional[str] = None
    geojson: Optional[Dict[str, Any]] = None
    predicate: str = "intersects" # intersects, within, contains

class BBoxQueryResponse(BaseModel):
    bbox_queried: List[float]
    predicate: str
    matched_count: int
    total_queried: int
    result_geojson: Dict[str, Any]

class SpatialFilterRequest(BaseModel):
    target_geojson: Dict[str, Any]
    reference_geojson: Dict[str, Any]
    predicate: str = "intersects" # intersects, contains, within, touches, disjoint

class SpatialFilterResponse(BaseModel):
    predicate_applied: str
    matched_count: int
    total_source_features: int
    filtered_geojson: Dict[str, Any]

class PolygonStatisticsRequest(BaseModel):
    geojson: Optional[Dict[str, Any]] = None
    layer_id: Optional[str] = None

class PolygonStatisticsResponse(BaseModel):
    total_features: int
    polygon_count: int
    total_area_hectares: float
    total_area_sq_km: float
    mean_area_ha: float
    median_area_ha: float
    min_area_ha: float
    max_area_ha: float
    std_dev_area_ha: float
    total_perimeter_km: float
    mean_perimeter_m: float
    mean_compactness_score: float
    total_vertices: int
    mean_vertices_per_polygon: float
    dataset_bounding_box: List[float]

class VectorLayerCreateRequest(BaseModel):
    name: str
    geojson: Dict[str, Any]
    study_area_id: Optional[str] = None
    style_config: Optional[Dict[str, Any]] = None
    layer_type: Optional[str] = None

class VectorLayerUpdateRequest(BaseModel):
    name: Optional[str] = None
    visible: Optional[bool] = None
    z_index: Optional[int] = None
    style_config: Optional[Dict[str, Any]] = None

class VectorLayerResponse(BaseModel):
    id: str
    name: str
    study_area_id: Optional[str] = None
    layer_type: str
    feature_count: int
    crs: str
    style_config: Dict[str, Any]
    visible: bool
    z_index: int
    geojson_data: Dict[str, Any]
    area_hectares: Optional[float] = None
    perimeter_meters: Optional[float] = None
    centroid: Optional[List[float]] = None
    bounding_box: Optional[List[float]] = None
    is_valid: bool = True
    validation_issues: List[str] = []
    created_at: str

class RasterLayerCreateRequest(BaseModel):
    name: str
    file_path: str
    study_area_id: Optional[str] = None
    colormap: str = "grayscale"
    opacity: float = 1.0

class RasterLayerUpdateRequest(BaseModel):
    name: Optional[str] = None
    visible: Optional[bool] = None
    opacity: Optional[float] = None
    z_index: Optional[int] = None
    colormap: Optional[str] = None

class RasterLayerResponse(BaseModel):
    id: str
    name: str
    study_area_id: Optional[str] = None
    file_path: str
    crs: str
    spatial_resolution_m: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    band_count: int = 1
    bounds_wgs84: Optional[List[float]] = None
    geographic_extent: Optional[Dict[str, Any]] = None
    colormap: str = "grayscale"
    opacity: float = 1.0
    visible: bool = True
    z_index: int = 0
    created_at: str

class LayerReorderRequest(BaseModel):
    ordered_layer_ids: List[str]

class StudyAreaCreateRequest(BaseModel):
    name: str
    boundary_geojson: Dict[str, Any]
    description: Optional[str] = None
    dataset_id: Optional[str] = None

class StudyAreaResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    dataset_id: Optional[str] = None
    boundary_geojson: Dict[str, Any]
    area_hectares: float
    area_sq_km: float
    perimeter_meters: float
    centroid: Optional[List[float]] = None
    bbox: Optional[List[float]] = None
    is_valid: bool = True
    validation_issues: List[str] = []
    created_at: str

class CRSValidationRequest(BaseModel):
    crs: str

class CRSValidationResponse(BaseModel):
    input_crs: str
    is_valid: bool
    epsg_code: Optional[int] = None
    formatted_crs: Optional[str] = None
    name: str = "Unknown"
    type: Optional[str] = None
    is_geographic: Optional[bool] = None
    is_projected: Optional[bool] = None
    units: Optional[str] = None
    axis_info: List[str] = []
    ellipsoid: Optional[str] = None
    datum: Optional[str] = None
    proj4: Optional[str] = None
    error: Optional[str] = None

class CRSTransformRequest(BaseModel):
    geojson: Dict[str, Any]
    src_crs: str = "EPSG:4326"
    dst_crs: str = "EPSG:3857"

class CRSTransformResponse(BaseModel):
    transformed_geojson: Dict[str, Any]
    src_crs: str
    dst_crs: str

class RasterGISMetadataRequest(BaseModel):
    file_path: str

class RasterGISMetadataResponse(BaseModel):
    filename: str
    file_path: str
    format: str
    width: int
    height: int
    band_count: int
    crs: str
    spatial_resolution: List[float]
    bounds_native: List[float]
    bounds_wgs84: List[float]
    geographic_extent: Optional[Dict[str, Any]] = None
    nodata_value: Optional[float] = None
    data_types: List[str] = []
    is_valid: bool = True


# ===================================================
# LULC Models (Phase 6)
# ===================================================
class LULCClassDefinition(BaseModel):
    class_id: int
    class_name: str
    color_hex: str
    description: Optional[str] = None

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
    dominant_class: str
    classes: List[LULCClassMetric]
    classification_map_url: str
    legend: List[Dict[str, Any]]
    method_used: str
    is_demo_data: bool = False

class LULCClassifyRequest(BaseModel):
    raster_path: Optional[str] = None
    scene_id: Optional[str] = None
    pixel_resolution_m: float = 10.0
    custom_classes: Optional[List[LULCClassDefinition]] = None

class LULCValidationResponse(BaseModel):
    is_valid: bool
    unique_classes: List[int]
    width: int
    height: int
    total_pixels: int
    message: str

# ===================================================
# Multispectral Vegetation Analytics Models (Phase 7)
# ===================================================
class NDVIThresholdRange(BaseModel):
    category: str # Water/Clouds, Bare Soil/Urban, Moderate Veg, Dense Forest
    min_val: float
    max_val: float
    color_hex: str
    pixel_count: int
    area_ha: float
    percentage: float
    description: str

class NDVIAnalysisRequest(BaseModel):
    raster_path: Optional[str] = None
    red_band_idx: Optional[int] = None
    nir_band_idx: Optional[int] = None
    colormap: str = "RdYlGn" # RdYlGn, Viridis, Spectral
    pixel_resolution_m: float = 10.0

class NDVIAnalysisResponse(BaseModel):
    success: bool
    mean_ndvi: float
    median_ndvi: float
    min_ndvi: float
    max_ndvi: float
    std_dev_ndvi: float
    colormap_url: str
    histogram: HistogramData
    threshold_distribution: List[NDVIThresholdRange]
    dominant_vegetation_health: str
    academic_formula: str
    required_bands_present: bool = True
    message: Optional[str] = None

# ===================================================
# Geospatial Data Analytics Dashboard Models (Phase 8)
# ===================================================
class AnalyticsKPICard(BaseModel):
    title: str
    value: float
    unit: str
    subtitle: str
    change_pct: Optional[float] = None
    trend: Optional[str] = None # up, down, neutral

class AnalyticsDashboardResponse(BaseModel):
    kpi_cards: List[AnalyticsKPICard]
    total_study_area_ha: float
    total_study_area_sq_km: float
    lulc_distribution: List[LULCClassMetric]
    year_comparison: List[Dict[str, Any]] # [{year: '2020', vegetation_ha, water_ha, ...}]
    ndvi_summary: Dict[str, Any]
    temporal_net_changes: List[Dict[str, Any]]
    spatial_summary: Dict[str, Any]
    is_empty_state: bool = False

# ===================================================
# Multi-Date Change Detection Models (Phase 9)
# ===================================================
class ChangeDetectionValidationResponse(BaseModel):
    is_compatible: bool
    crs_match: bool
    dimensions_match: bool
    spatial_overlap_pct: float
    t1_crs: str
    t2_crs: str
    t1_dims: List[int]
    t2_dims: List[int]
    messages: List[str]

class ChangeDetectionRequest(BaseModel):
    t1_raster_path: Optional[str] = None
    t2_raster_path: Optional[str] = None
    t1_name: str = "2020 (Baseline - T1)"
    t2_name: str = "2025 (Recent - T2)"
    pixel_resolution_m: float = 10.0

class ChangeDetectionResponse(BaseModel):
    success: bool
    is_compatible: bool
    validation_messages: List[str]
    t1_timestamp: str
    t2_timestamp: str
    total_study_area_ha: float
    unchanged_area_ha: float
    unchanged_percentage: float
    total_changed_area_ha: float
    total_changed_percentage: float
    t1_classes: List[LULCClassMetric]
    t2_classes: List[LULCClassMetric]
    class_changes: List[Dict[str, Any]] # {class_id, class_name, t1_ha, t2_ha, change_ha, change_pct}
    transition_matrix: List[List[float]] # 5x5 matrix in hectares
    transition_labels: List[str]
    most_converted_transition: Dict[str, Any] # {from_class, to_class, area_ha}
    difference_map_url: str
    binary_change_mask_url: str


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
    prompt: str = ""
    active_dataset_id: Optional[str] = None
    active_coordinates: Optional[List[float]] = None
    include_rag_context: bool = True
    session_id: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    document_name: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None
    selected_area_name: Optional[str] = None
    selected_area_details: Optional[Dict[str, Any]] = None

class AskGeoVisionResponse(BaseModel):
    response_text: str
    rag_citations: List[RAGChunkCitation]
    structured_analytics: Optional[Dict[str, Any]] = None
    map_actions: Optional[List[Dict[str, Any]]] = None
    executed_tools: List[str]
    grounding_status: str
    attachment_preview: Optional[Dict[str, Any]] = None

# ===================================================
# Authentication & Role-Based Access Control Models
# ===================================================
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "user"  # "user" | "admin"

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
    required_role: Optional[str] = None
    portal_type: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str
    last_login: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class AdminOverviewResponse(BaseModel):
    total_users: int
    admin_users: int
    total_admins: int
    standard_users: int
    active_analyses_count: int
    active_jobs: int
    system_status: str
    system_health: Dict[str, Any]
    disk_storage_mb: float
    platform_version: str
    recent_activity: List[Dict[str, Any]] = []

