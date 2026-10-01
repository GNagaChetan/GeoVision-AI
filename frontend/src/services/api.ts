import axios from 'axios';
import {
  DIPProcessResponse,
  ImageQualityResponse,
  SpectralIndexResponse,
  SampleScene,
  SpatialAreaResponse,
  SpatialBufferResponse,
  LULCClassificationResponse,
  LULCTemporalComparisonResponse,
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
    const res = await api.post('/image-processing/register', {
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

  computeSpectralIndex: async (indexType: string = 'NDVI') => {
    const res = await api.post<SpectralIndexResponse>(`/remote-sensing/spectral-index?index_type=${indexType}`);
    return res.data;
  },

  generateFalseColor: async (preset: string = 'Standard_FCC') => {
    const res = await api.post(`/remote-sensing/false-color?preset=${preset}`);
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

  // LULC Services
  classifyScene: async (sceneId: string = 'scene_2020', resolutionM: number = 10.0) => {
    const res = await api.post<LULCClassificationResponse>(
      `/lulc/classify?scene_id=${sceneId}&resolution_m=${resolutionM}`
    );
    return res.data;
  },

  analyzeTemporalChange: async (resolutionM: number = 10.0) => {
    const res = await api.post<LULCTemporalComparisonResponse>(
      `/lulc/temporal-change?resolution_m=${resolutionM}`
    );
    return res.data;
  },

  // RAG Services
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

  initDefaultKnowledge: async () => {
    const res = await api.post('/rag/initialize-defaults');
    return res.data;
  },

  // Ask GeoVision
  askGeoVision: async (prompt: string, activeDatasetId?: string, includeRAG: boolean = true) => {
    const res = await api.post<AskGeoVisionResponse>('/ask-geovision/chat', {
      prompt,
      active_dataset_id: activeDatasetId,
      include_rag_context: includeRAG,
    });
    return res.data;
  },
};
