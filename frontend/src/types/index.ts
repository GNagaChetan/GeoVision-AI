// GeoVision AI - Frontend Type Definitions

export interface HistogramData {
  bins: number[];
  counts_r?: number[];
  counts_g?: number[];
  counts_b?: number[];
  counts_gray?: number[];
}

export interface ImageStats {
  width: number;
  height: number;
  channels: number;
  min_val: number;
  max_val: number;
  mean_val: number;
  std_val: number;
  contrast: number;
}

export interface ImageMetadataResponse {
  width: number;
  height: number;
  channels: number;
  aspect_ratio: string;
  color_model: string;
  bit_depth: string;
  memory_footprint_kb: number;
  min_intensity: number;
  max_intensity: number;
  mean_intensity: number;
  std_deviation: number;
  michelson_contrast: number;
  rms_contrast: number;
  shannon_entropy: number;
  source_path?: string;
}

export interface ColorSpaceResponse {
  bgr_url: string;
  rgb_url: string;
  hsv_url: string;
  lab_url: string;
  ycrcb_url: string;
  color_models: string[];
}

export interface SamplingQuantizationResponse {
  sampled_image_url: string;
  quantized_image_url: string;
  sampling_metrics: Record<string, any>;
  quantization_metrics: Record<string, any>;
}

export interface TextureAnalysisResponse {
  glcm_metrics: Record<string, number>;
  lbp_metrics: Record<string, any>;
  lbp_map_url: string;
}

export interface ImageRegistrationResponse {
  success: boolean;
  num_matches: number;
  homography_matrix?: number[][];
  registered_image_url: string;
  difference_image_url: string;
  alignment_error: number;
  message?: string;
}

export interface DIPProcessResponse {
  success: boolean;
  operation: string;
  output_image_url: string;
  original_image_url: string;
  stats_original: ImageStats;
  stats_processed: ImageStats;
  histogram_original: HistogramData;
  histogram_processed: HistogramData;
  parameters_applied: Record<string, any>;
  academic_reference: string;
  mathematical_formula?: string;
  execution_time_ms: number;
  metrics?: Record<string, any>;
}

export interface ImageQualityResponse {
  psnr: number;
  ssim: number;
  mse: number;
  interpretation: string;
}

export interface BandInfo {
  band_index: number;
  name: string;
  wavelength_nm?: number;
  common_name?: string;
  data_type: string;
  min_val: number;
  max_val: number;
  mean_val: number;
  std_val: number;
  preview_url?: string;
}

export interface RasterMetadata {
  filename: string;
  file_path: string;
  format: string;
  width: number;
  height: number;
  band_count: number;
  data_type: string;
  nodata_value?: number;
  crs: string;
  is_projected: boolean;
  units: string;
  spatial_resolution: [number, number];
  bounds_native: [number, number, number, number];
  bounds_wgs84: [number, number, number, number];
  geographic_extent?: any;
  center_coordinates: [number, number];
  platform?: string;
  sensor?: string;
  acquisition_date?: string;
  bands: BandInfo[];
  is_valid_raster: boolean;
  validation_message?: string;
  is_sample_data?: boolean;
}

export interface RasterValidationResponse {
  is_valid: boolean;
  filename: string;
  format: string;
  band_count: number;
  width: number;
  height: number;
  crs: string;
  message: string;
  has_georeferencing: boolean;
  details: Record<string, any>;
}

export interface BandVisualizationResponse {
  band_index: number;
  band_name: string;
  preview_url: string;
  colormap: string;
  min_val: number;
  max_val: number;
  mean_val: number;
  std_val: number;
  histogram: HistogramData;
}

export interface RGBCompositeResponse {
  success: boolean;
  composite_url: string;
  bands_mapped: Record<string, number>;
  description: string;
}

export interface FalseColorCompositeResponse {
  success: boolean;
  composite_url: string;
  preset_used: string;
  bands_used: Record<string, number>;
  required_bands_present: boolean;
  academic_rationale: string;
  message?: string;
}

export interface SpectralIndexResponse {
  index_type: string;
  mean_value: number;
  min_value: number;
  max_value: number;
  std_value: number;
  colormap_image_url: string;
  histogram: HistogramData;
  academic_formula: string;
  interpretation: string;
  required_bands_present?: boolean;
  message?: string;
}

export interface StudyAreaProject {
  project_id: string;
  project_name: string;
  description: string;
  created_at: string;
  raster_path: string;
  study_area_geojson?: any;
  area_hectares?: number;
  metadata?: RasterMetadata;
}

export interface SampleScene {
  id: string;
  name: string;
  sensor: string;
  spatial_resolution: string;
  acquisition_date: string;
  rgb_url: string;
  file_path: string;
  crs: string;
  bands_available: string[];
  is_sample_data: boolean;
}

export interface SpatialAreaResponse {
  area_sq_meters: number;
  area_hectares: number;
  area_sq_km: number;
  perimeter_meters: number;
  centroid: [number, number];
  bounding_box: [number, number, number, number];
  is_valid: boolean;
}

export interface SpatialBufferResponse {
  buffered_geojson: any;
  original_area_ha: number;
  buffered_area_ha: number;
  distance_meters: number;
}

export interface GeoJSONValidationResponse {
  is_valid: boolean;
  issues: string[];
  feature_count: number;
  geometry_types: string[];
  total_vertices: number;
  repaired_geojson?: any;
}

export interface DistanceSegment {
  segment_index: number;
  from_point: [number, number];
  to_point: [number, number];
  distance_meters: number;
  distance_km: number;
  forward_azimuth_deg: number;
  back_azimuth_deg: number;
}

export interface DistanceCalculationResponse {
  total_distance_meters: number;
  total_distance_km: number;
  total_distance_nautical_miles: number;
  point_count: number;
  segments: DistanceSegment[];
}

export interface PointInPolygonMatch {
  feature_id: string;
  properties: Record<string, any>;
  geometry_type: string;
  area_hectares: number;
  centroid: [number, number];
  bounds: [number, number, number, number];
  contains_point: boolean;
}

export interface PointInPolygonResponse {
  matches: PointInPolygonMatch[];
  point: [number, number];
}

export interface BBoxQueryResponse {
  bbox_queried: [number, number, number, number];
  predicate: string;
  matched_count: number;
  total_queried: number;
  result_geojson: any;
}

export interface SpatialFilterResponse {
  predicate_applied: string;
  matched_count: number;
  total_source_features: number;
  filtered_geojson: any;
}

export interface PolygonStatisticsResponse {
  total_features: number;
  polygon_count: number;
  total_area_hectares: number;
  total_area_sq_km: number;
  mean_area_ha: number;
  median_area_ha: number;
  min_area_ha: number;
  max_area_ha: number;
  std_dev_area_ha: number;
  total_perimeter_km: number;
  mean_perimeter_m: number;
  mean_compactness_score: number;
  total_vertices: number;
  mean_vertices_per_polygon: number;
  dataset_bounding_box: [number, number, number, number];
}

export interface VectorLayer {
  id: string;
  name: string;
  study_area_id?: string;
  layer_type: string;
  feature_count: number;
  crs: string;
  style_config: {
    fill_color?: string;
    stroke_color?: string;
    stroke_width?: number;
    opacity?: number;
    fill_opacity?: number;
  };
  visible: boolean;
  z_index: number;
  geojson_data: any;
  area_hectares?: number;
  perimeter_meters?: number;
  centroid?: [number, number];
  bounding_box?: [number, number, number, number];
  is_valid: boolean;
  validation_issues?: string[];
  created_at: string;
}

export interface RasterLayer {
  id: string;
  name: string;
  study_area_id?: string;
  file_path: string;
  crs: string;
  spatial_resolution_m?: number;
  width?: number;
  height?: number;
  band_count: number;
  bounds_wgs84?: [number, number, number, number];
  geographic_extent?: any;
  colormap: string;
  opacity: number;
  visible: boolean;
  z_index: number;
  created_at: string;
}

export interface StudyArea {
  id: string;
  name: string;
  description?: string;
  dataset_id?: string;
  boundary_geojson: any;
  area_hectares: number;
  area_sq_km: number;
  perimeter_meters: number;
  centroid?: [number, number];
  bbox?: [number, number, number, number];
  is_valid: boolean;
  validation_issues?: string[];
  created_at: string;
}

export interface CRSValidationResponse {
  input_crs: string;
  is_valid: boolean;
  epsg_code?: number;
  formatted_crs?: string;
  name: string;
  type?: string;
  is_geographic?: boolean;
  is_projected?: boolean;
  units?: string;
  axis_info: string[];
  ellipsoid?: string;
  datum?: string;
  proj4?: string;
  error?: string;
}

export interface CRSTransformResponse {
  transformed_geojson: any;
  src_crs: string;
  dst_crs: string;
}

export interface RasterGISMetadataResponse {
  filename: string;
  file_path: string;
  format: string;
  width: number;
  height: number;
  band_count: number;
  crs: string;
  spatial_resolution: [number, number];
  bounds_native: [number, number, number, number];
  bounds_wgs84: [number, number, number, number];
  geographic_extent?: any;
  nodata_value?: number;
  data_types: string[];
  is_valid: boolean;
}


export interface LULCClassMetric {
  class_id: number;
  class_name: string;
  color_hex: string;
  pixel_count: number;
  area_hectares: number;
  area_sq_km: number;
  percentage: number;
}

export interface LULCClassDefinition {
  class_id: number;
  class_name: string;
  color_hex: string;
  description?: string;
}

export interface LULCClassificationResponse {
  dataset_name: string;
  total_area_hectares: number;
  total_area_sq_km: number;
  dominant_class: string;
  classes: LULCClassMetric[];
  classification_map_url: string;
  legend: Array<{
    class_id: number;
    class_name: string;
    color_hex: string;
    description?: string;
  }>;
  method_used: string;
  is_demo_data: boolean;
}

export interface LULCValidationResponse {
  is_valid: boolean;
  unique_classes: number[];
  width: number;
  height: number;
  total_pixels: number;
  message: string;
}

export interface ClassChange {
  class_id: number;
  class_name: string;
  color_hex: string;
  t1_ha: number;
  t2_ha: number;
  change_ha: number;
  change_pct: number;
}

export interface LULCTemporalComparisonResponse {
  t1_timestamp: string;
  t2_timestamp: string;
  total_area_ha: number;
  t1_classes: LULCClassMetric[];
  t2_classes: LULCClassMetric[];
  class_changes: ClassChange[];
  transition_matrix: number[][];
  transition_labels: string[];
  change_map_url: string;
}

export interface NDVIThresholdRange {
  category: string;
  min_val: number;
  max_val: number;
  color_hex: string;
  pixel_count: number;
  area_ha: number;
  percentage: number;
  description: string;
}

export interface NDVIAnalysisResponse {
  success: boolean;
  mean_ndvi: number;
  median_ndvi: number;
  min_ndvi: number;
  max_ndvi: number;
  std_dev_ndvi: number;
  colormap_url: string;
  histogram: HistogramData;
  threshold_distribution: NDVIThresholdRange[];
  dominant_vegetation_health: string;
  academic_formula: string;
  required_bands_present: boolean;
  message?: string;
}

export interface AnalyticsKPICard {
  title: string;
  value: number;
  unit: string;
  subtitle: string;
  change_pct?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AnalyticsDashboardResponse {
  kpi_cards: AnalyticsKPICard[];
  total_study_area_ha: number;
  total_study_area_sq_km: number;
  lulc_distribution: LULCClassMetric[];
  year_comparison: Array<Record<string, any>>;
  ndvi_summary: Record<string, any>;
  temporal_net_changes: Array<Record<string, any>>;
  spatial_summary: {
    active_study_area: string;
    crs: string;
    total_layers: number;
    raster_count: number;
    vector_count: number;
    [key: string]: any;
  };
  is_empty_state: boolean;
}

export interface ChangeDetectionValidationResponse {
  is_compatible: boolean;
  crs_match: boolean;
  dimensions_match: boolean;
  spatial_overlap_pct: number;
  t1_crs: string;
  t2_crs: string;
  t1_dims: [number, number];
  t2_dims: [number, number];
  messages: string[];
}

export interface ChangeDetectionResponse {
  success: boolean;
  is_compatible: boolean;
  validation_messages: string[];
  t1_timestamp: string;
  t2_timestamp: string;
  total_study_area_ha: number;
  unchanged_area_ha: number;
  unchanged_percentage: number;
  total_changed_area_ha: number;
  total_changed_percentage: number;
  t1_classes: LULCClassMetric[];
  t2_classes: LULCClassMetric[];
  class_changes: Array<{
    class_id: number;
    class_name: string;
    color_hex: string;
    t1_ha: number;
    t2_ha: number;
    change_ha: number;
    change_pct: number;
  }>;
  transition_matrix: number[][];
  transition_labels: string[];
  most_converted_transition: {
    from_class?: string;
    to_class?: string;
    area_ha?: number;
    [key: string]: any;
  };
  difference_map_url: string;
  binary_change_mask_url: string;
}

export interface RAGChunkCitation {
  document_name: string;
  page_number?: number;
  chunk_index: number;
  similarity_score: number;
  snippet: string;
}

export interface RAGQueryResponse {
  query: string;
  answer: string;
  citations: RAGChunkCitation[];
  grounded: boolean;
  context_used: string[];
}

export interface IndexedDocument {
  document_name: string;
  chunks_count: number;
  tag: string;
}

export interface AskGeoVisionResponse {
  response_text: string;
  rag_citations: RAGChunkCitation[];
  structured_analytics?: Record<string, any>;
  map_actions?: Array<{
    action: string;
    geojson?: any;
    label?: string;
  }>;
  executed_tools: string[];
  grounding_status: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface AdminOverview {
  total_users: number;
  total_admins: number;
  system_health: {
    status: string;
    services: Record<string, boolean>;
  };
  active_jobs: number;
  recent_activity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}
