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
}

export interface ImageQualityResponse {
  psnr: number;
  ssim: number;
  mse: number;
  interpretation: string;
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

export interface LULCClassMetric {
  class_id: number;
  class_name: string;
  color_hex: string;
  pixel_count: number;
  area_hectares: number;
  area_sq_km: number;
  percentage: number;
}

export interface LULCClassificationResponse {
  dataset_name: string;
  total_area_hectares: number;
  total_area_sq_km: number;
  classes: LULCClassMetric[];
  classification_map_url: string;
  method_used: string;
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
