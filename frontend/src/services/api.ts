import axios from 'axios';
import {
  DIPProcessResponse,
  ImageQualityResponse,
  ImageMetadataResponse,
  ColorSpaceResponse,
  SamplingQuantizationResponse,
  TextureAnalysisResponse,
  ImageRegistrationResponse,
  RasterMetadata,
  RasterValidationResponse,
  BandInfo,
  BandVisualizationResponse,
  RGBCompositeResponse,
  FalseColorCompositeResponse,
  StudyAreaProject,
  SpectralIndexResponse,
  SampleScene,
  SpatialAreaResponse,
  SpatialBufferResponse,
  GeoJSONValidationResponse,
  DistanceCalculationResponse,
  PointInPolygonResponse,
  BBoxQueryResponse,
  SpatialFilterResponse,
  PolygonStatisticsResponse,
  VectorLayer,
  RasterLayer,
  StudyArea,
  CRSValidationResponse,
  CRSTransformResponse,
  RasterGISMetadataResponse,
  LULCClassificationResponse,
  LULCValidationResponse,
  LULCTemporalComparisonResponse,
  NDVIAnalysisResponse,
  AnalyticsDashboardResponse,
  ChangeDetectionValidationResponse,
  ChangeDetectionResponse,
  RAGQueryResponse,
  IndexedDocument,
  AskGeoVisionResponse
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('geovision_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const GeoVisionAPI = {
  // Health
  checkHealth: async () => {
    const res = await axios.get('/health');
    return res.data;
  },

  // DIP Services
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/image-processing/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getImageMetadata: async (imagePath: string) => {
    const formData = new FormData();
    formData.append('image_path', imagePath);
    const res = await api.post<ImageMetadataResponse>('/image-processing/metadata', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  convertColorSpace: async (imagePath: string) => {
    const formData = new FormData();
    formData.append('image_path', imagePath);
    const res = await api.post<ColorSpaceResponse>('/image-processing/colorspace', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  demoSamplingQuantization: async (imagePath: string, factor: number = 4, levels: number = 8) => {
    const res = await api.post<SamplingQuantizationResponse>('/image-processing/sampling-quantization', {
      image_path: imagePath,
      sampling_factor: factor,
      quantization_levels: levels,
    });
    return res.data;
  },

  analyzeTexture: async (imagePath: string) => {
    const res = await api.post<TextureAnalysisResponse>('/image-processing/texture', {
      image_path: imagePath,
    });
    return res.data;
  },

  processDIP: async (imagePath: string, operation: string, params: Record<string, any> = {}) => {
    const formData = new FormData();
    formData.append('image_path', imagePath);
    formData.append('operation', operation);
    formData.append('params_json', JSON.stringify(params));
    const res = await api.post<DIPProcessResponse>('/image-processing/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  evaluateQuality: async (refPath: string, distPath: string) => {
    const res = await api.post<ImageQualityResponse>('/image-processing/quality', {
      reference_image_path: refPath,
      distorted_image_path: distPath,
    });
    return res.data;
  },

  registerImages: async (refPath: string, movPath: string, featureType: string = 'ORB') => {
    const res = await api.post<ImageRegistrationResponse>('/image-processing/register', {
      reference_image_path: refPath,
      moving_image_path: movPath,
      feature_type: featureType,
    });
    return res.data;
  },

  // Remote Sensing Services
  getSampleScenes: async () => {
    const res = await api.get<{ scenes: SampleScene[] }>('/remote-sensing/sample-scenes');
    return res.data.scenes;
  },

  uploadRaster: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/remote-sensing/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  validateRaster: async (rasterPath: string) => {
    const formData = new FormData();
    formData.append('raster_path', rasterPath);
    const res = await api.post<RasterValidationResponse>('/remote-sensing/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getRasterMetadata: async (rasterPath: string) => {
    const formData = new FormData();
    formData.append('raster_path', rasterPath);
    const res = await api.post<RasterMetadata>('/remote-sensing/metadata', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  inspectRasterBands: async (rasterPath: string) => {
    const formData = new FormData();
    formData.append('raster_path', rasterPath);
    const res = await api.post<{ bands: BandInfo[]; total_bands: number }>('/remote-sensing/bands/inspect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  visualizeBand: async (rasterPath: string, bandIndex: number = 1, colormap: string = 'grayscale') => {
    const res = await api.post<BandVisualizationResponse>('/remote-sensing/bands/visualize', {
      raster_path: rasterPath,
      band_index: bandIndex,
      colormap: colormap,
    });
    return res.data;
  },

  createRGBComposite: async (rasterPath: string, rIdx: number = 1, gIdx: number = 2, bIdx: number = 3) => {
    const res = await api.post<RGBCompositeResponse>('/remote-sensing/composite/rgb', {
      raster_path: rasterPath,
      r_band_idx: rIdx,
      g_band_idx: gIdx,
      b_band_idx: bIdx,
    });
    return res.data;
  },

  createFalseColorComposite: async (rasterPath: string, preset: string = 'Color_Infrared', rIdx?: number, gIdx?: number, bIdx?: number) => {
    const res = await api.post<FalseColorCompositeResponse>('/remote-sensing/composite/false-color', {
      raster_path: rasterPath,
      preset: preset,
      r_band_idx: rIdx,
      g_band_idx: gIdx,
      b_band_idx: bIdx,
    });
    return res.data;
  },

  computeSpectralIndex: async (
    indexType: string = 'NDVI',
    rasterPath?: string,
    nirIdx?: number,
    redIdx?: number,
    greenIdx?: number,
    swirIdx?: number
  ) => {
    let url = `/remote-sensing/spectral-index?index_type=${indexType}`;
    if (rasterPath) url += `&raster_path=${encodeURIComponent(rasterPath)}`;
    if (nirIdx) url += `&nir_band_idx=${nirIdx}`;
    if (redIdx) url += `&red_band_idx=${redIdx}`;
    if (greenIdx) url += `&green_band_idx=${greenIdx}`;
    if (swirIdx) url += `&swir_band_idx=${swirIdx}`;

    const res = await api.post<SpectralIndexResponse>(url);
    return res.data;
  },

  generateFalseColor: async (preset: string = 'Standard_FCC') => {
    const res = await api.post(`/remote-sensing/false-color?preset=${preset}`);
    return res.data;
  },

  createStudyAreaProject: async (projectName: string, rasterPath: string, description: string = '') => {
    const formData = new FormData();
    formData.append('project_name', projectName);
    formData.append('raster_path', rasterPath);
    formData.append('description', description);
    const res = await api.post<StudyAreaProject>('/remote-sensing/study-area', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  listStudyAreaProjects: async () => {
    const res = await api.get<StudyAreaProject[]>('/remote-sensing/study-area/list');
    return res.data;
  },

  // GIS Services
  getSampleStudyArea: async () => {
    const res = await api.get('/gis/sample-study-area');
    return res.data;
  },

  computeAreaMetrics: async (geojson: any) => {
    const res = await api.post<SpatialAreaResponse>('/gis/area-metrics', { geojson });
    return res.data;
  },

  createBuffer: async (geojson: any, distanceMeters: number) => {
    const res = await api.post<SpatialBufferResponse>('/gis/buffer', {
      geojson,
      distance_meters: distanceMeters,
    });
    return res.data;
  },

  validateGeoJSON: async (geojson: any) => {
    const res = await api.post<GeoJSONValidationResponse>('/gis/validate-geojson', { geojson });
    return res.data;
  },

  uploadGeoJSONFile: async (file: File, layerName?: string, studyAreaId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (layerName) formData.append('layer_name', layerName);
    if (studyAreaId) formData.append('study_area_id', studyAreaId);
    const res = await api.post('/gis/upload-geojson', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  calculateDistance: async (coordinates: [number, number][]) => {
    const res = await api.post<DistanceCalculationResponse>('/gis/distance', { coordinates });
    return res.data;
  },

  queryPointInPolygon: async (point: [number, number], layerId?: string, geojson?: any) => {
    const res = await api.post<PointInPolygonResponse>('/gis/query/point-in-polygon', {
      point,
      layer_id: layerId,
      geojson,
    });
    return res.data;
  },

  queryBBox: async (bbox: [number, number, number, number], layerId?: string, geojson?: any, predicate: string = 'intersects') => {
    const res = await api.post<BBoxQueryResponse>('/gis/query/bbox', {
      bbox,
      layer_id: layerId,
      geojson,
      predicate,
    });
    return res.data;
  },

  filterSpatial: async (targetGeojson: any, referenceGeojson: any, predicate: string = 'intersects') => {
    const res = await api.post<SpatialFilterResponse>('/gis/query/spatial-filter', {
      target_geojson: targetGeojson,
      reference_geojson: referenceGeojson,
      predicate,
    });
    return res.data;
  },

  getPolygonStatistics: async (geojson?: any, layerId?: string) => {
    const res = await api.post<PolygonStatisticsResponse>('/gis/polygon-statistics', {
      geojson,
      layer_id: layerId,
    });
    return res.data;
  },

  listVectorLayers: async (studyAreaId?: string) => {
    const url = studyAreaId ? `/gis/vector-layers?study_area_id=${studyAreaId}` : '/gis/vector-layers';
    const res = await api.get<VectorLayer[]>(url);
    return res.data;
  },

  createVectorLayer: async (payload: { name: string; geojson: any; study_area_id?: string; style_config?: any; layer_type?: string }) => {
    const res = await api.post<VectorLayer>('/gis/vector-layers', payload);
    return res.data;
  },

  getVectorLayer: async (layerId: string) => {
    const res = await api.get<VectorLayer>(`/gis/vector-layers/${layerId}`);
    return res.data;
  },

  updateVectorLayer: async (layerId: string, updates: Partial<VectorLayer>) => {
    const res = await api.patch<VectorLayer>(`/gis/vector-layers/${layerId}`, updates);
    return res.data;
  },

  deleteVectorLayer: async (layerId: string) => {
    const res = await api.delete(`/gis/vector-layers/${layerId}`);
    return res.data;
  },

  exportVectorLayerGeoJSON: async (layerId: string) => {
    const res = await api.get(`/gis/vector-layers/${layerId}/export`);
    return res.data;
  },

  listRasterLayers: async (studyAreaId?: string) => {
    const url = studyAreaId ? `/gis/raster-layers?study_area_id=${studyAreaId}` : '/gis/raster-layers';
    const res = await api.get<RasterLayer[]>(url);
    return res.data;
  },

  createRasterLayer: async (payload: { name: string; file_path: string; study_area_id?: string; colormap?: string; opacity?: number }) => {
    const res = await api.post<RasterLayer>('/gis/raster-layers', payload);
    return res.data;
  },

  updateRasterLayer: async (layerId: string, updates: Partial<RasterLayer>) => {
    const res = await api.patch<RasterLayer>(`/gis/raster-layers/${layerId}`, updates);
    return res.data;
  },

  deleteRasterLayer: async (layerId: string) => {
    const res = await api.delete(`/gis/raster-layers/${layerId}`);
    return res.data;
  },

  reorderLayers: async (orderedLayerIds: string[]) => {
    const res = await api.post('/gis/layers/reorder', { ordered_layer_ids: orderedLayerIds });
    return res.data;
  },

  listStudyAreas: async () => {
    const res = await api.get<StudyArea[]>('/gis/study-areas');
    return res.data;
  },

  createStudyArea: async (payload: { name: string; boundary_geojson: any; description?: string; dataset_id?: string }) => {
    const res = await api.post<StudyArea>('/gis/study-areas', payload);
    return res.data;
  },

  deleteStudyArea: async (studyAreaId: string) => {
    const res = await api.delete(`/gis/study-areas/${studyAreaId}`);
    return res.data;
  },

  validateCRS: async (crs: string) => {
    const res = await api.post<CRSValidationResponse>('/gis/crs/validate', { crs });
    return res.data;
  },

  transformCRS: async (geojson: any, srcCrs: string = 'EPSG:4326', dstCrs: string = 'EPSG:3857') => {
    const res = await api.post<CRSTransformResponse>('/gis/crs/transform', {
      geojson,
      src_crs: srcCrs,
      dst_crs: dstCrs,
    });
    return res.data;
  },

  getRasterGISMetadata: async (filePath: string) => {
    const res = await api.post<RasterGISMetadataResponse>('/gis/raster-metadata', { file_path: filePath });
    return res.data;
  },

  // LULC Services (Phase 6)
  validateLULC: async (rasterPath: string) => {
    const formData = new FormData();
    formData.append('raster_path', rasterPath);
    const res = await api.post<LULCValidationResponse>('/lulc/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  classifyScene: async (
    sceneId: string = 'scene_2020',
    resolutionM: number = 10.0,
    rasterPath?: string
  ) => {
    let url = `/lulc/classify?resolution_m=${resolutionM}`;
    if (rasterPath) {
      url += `&raster_path=${encodeURIComponent(rasterPath)}`;
    } else if (sceneId) {
      url += `&scene_id=${encodeURIComponent(sceneId)}`;
    }
    const res = await api.post<LULCClassificationResponse>(url);
    return res.data;
  },

  exportLULCCSV: (sceneId: string = 'scene_2020', resolutionM: number = 10.0) => {
    return `/api/v1/lulc/export/csv?scene_id=${sceneId}&resolution_m=${resolutionM}`;
  },

  // Multispectral Vegetation Analytics Services (Phase 7)
  calculateNDVI: async (params: {
    rasterPath?: string;
    redBandIdx?: number;
    nirBandIdx?: number;
    colormap?: string;
    resolutionM?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.rasterPath) query.append('raster_path', params.rasterPath);
    if (params.redBandIdx !== undefined && params.redBandIdx !== null) query.append('red_band_idx', String(params.redBandIdx));
    if (params.nirBandIdx !== undefined && params.nirBandIdx !== null) query.append('nir_band_idx', String(params.nirBandIdx));
    if (params.colormap) query.append('colormap', params.colormap);
    if (params.resolutionM) query.append('resolution_m', String(params.resolutionM));

    const res = await api.post<NDVIAnalysisResponse>(`/vegetation/ndvi?${query.toString()}`);
    return res.data;
  },

  // Geospatial Data Analytics Services (Phase 8)
  getAnalyticsDashboard: async () => {
    const res = await api.get<AnalyticsDashboardResponse>('/analytics/dashboard');
    return res.data;
  },

  // Multi-Date Change Detection Services (Phase 9)
  validateChangeScenes: async (t1Path?: string, t2Path?: string) => {
    const query = new URLSearchParams();
    if (t1Path) query.append('t1_raster_path', t1Path);
    if (t2Path) query.append('t2_raster_path', t2Path);
    const res = await api.post<ChangeDetectionValidationResponse>(`/change-detection/validate?${query.toString()}`);
    return res.data;
  },

  analyzeChangeDetection: async (params?: {
    t1Path?: string;
    t2Path?: string;
    t1Name?: string;
    t2Name?: string;
    resolutionM?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.t1Path) query.append('t1_raster_path', params.t1Path);
    if (params?.t2Path) query.append('t2_raster_path', params.t2Path);
    if (params?.t1Name) query.append('t1_name', params.t1Name);
    if (params?.t2Name) query.append('t2_name', params.t2Name);
    if (params?.resolutionM) query.append('resolution_m', String(params.resolutionM));

    const res = await api.post<ChangeDetectionResponse>(`/change-detection/analyze?${query.toString()}`);
    return res.data;
  },

  analyzeTemporalChange: async (resolutionM: number = 10.0) => {
    const res = await api.post<ChangeDetectionResponse>(
      `/change-detection/analyze?resolution_m=${resolutionM}`
    );
    return res.data;
  },

  // RAG Knowledge Base Services (Phase 10)
  ingestDocument: async (file: File, docTag: string = 'Domain') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_tag', docTag);
    const res = await api.post('/rag/ingest', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  queryRAG: async (query: string, topK: number = 4) => {
    const res = await api.post<RAGQueryResponse>('/rag/query', {
      query,
      top_k: topK,
    });
    return res.data;
  },

  listDocuments: async () => {
    const res = await api.get<{ total_documents: number; total_chunks: number; documents: IndexedDocument[] }>(
      '/rag/documents'
    );
    return res.data;
  },

  deleteDocument: async (documentName: string) => {
    const res = await api.delete(`/rag/documents/${encodeURIComponent(documentName)}`);
    return res.data;
  },

  initDefaultKnowledge: async () => {
    const res = await api.post('/rag/initialize-defaults');
    return res.data;
  },

  // Ask GeoVision Decision Support (Phase 11)
  askGeoVision: async (prompt: string, activeDatasetId?: string, includeRAG: boolean = true) => {
    const res = await api.post<AskGeoVisionResponse>('/ask-geovision/chat', {
      prompt,
      active_dataset_id: activeDatasetId,
      include_rag_context: includeRAG,
    });
    return res.data;
  },

  // Automated Geospatial Reports (Phase 12)
  generateReport: async (projectTitle?: string, author?: string, resolutionM: number = 10.0) => {
    const query = new URLSearchParams();
    if (projectTitle) query.append('project_title', projectTitle);
    if (author) query.append('author', author);
    query.append('resolution_m', String(resolutionM));
    const res = await api.post(`/reports/generate?${query.toString()}`);
    return res.data;
  },

  listReports: async () => {
    const res = await api.get<{ reports: any[] }>('/reports/history');
    return res.data;
  },

  getReport: async (reportId: string) => {
    const res = await api.get(`/reports/${encodeURIComponent(reportId)}`);
    return res.data;
  },

  getReportMarkdownUrl: (reportId: string) => {
    return `/api/v1/reports/${encodeURIComponent(reportId)}/markdown`;
  },

  // Authentication & RBAC (Section 12)
  login: async (email: string, password: string, portalType?: string) => {
    const res = await api.post('/auth/login', { email, password, portal_type: portalType });
    return res.data;
  },

  signup: async (full_name: string, email: string, password: string) => {
    const res = await api.post('/auth/signup', { full_name, email, password });
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  getAdminOverview: async () => {
    const res = await api.get('/auth/admin/overview');
    return res.data;
  },

  getAdminUsers: async () => {
    const res = await api.get('/auth/admin/users');
    return res.data;
  },

  // Multimodal Chat Attachments (Section 13)
  uploadChatPicture: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/ask-geovision/upload-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  uploadChatDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/ask-geovision/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  askGeoVisionEnhanced: async (payload: {
    prompt: string;
    active_dataset_id?: string;
    include_rag_context?: boolean;
    image_url?: string;
    image_urls?: string[];
    document_name?: string;
    history?: { role: string; text?: string; content?: string }[];
    selected_area_name?: string;
    selected_area_details?: Record<string, any>;
  }) => {
    const res = await api.post<AskGeoVisionResponse>('/ask-geovision/chat', payload);
    return res.data;
  },
};
