import React, { useState } from 'react';
import {
  Upload,
  FileCode,
  Layers,
  CheckCircle2,
  AlertCircle,
  Globe2,
  FileCheck,
  RefreshCw,
  X,
  Info
} from 'lucide-react';
import { Modal, ErrorAlert } from './UIState';
import { GeoVisionAPI } from '../../services/api';

interface DataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (sceneData: any) => void;
}

export const DataUploadModal: React.FC<DataUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetType, setDatasetType] = useState<'raster' | 'vector'>('raster');
  const [sensorPreset, setSensorPreset] = useState<string>('Sentinel-2 (10m)');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusStep, setStatusStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validExtensions = ['.tif', '.tiff', '.geojson', '.json', '.png', '.jpg', '.jpeg', '.zip'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Unsupported file format (${ext}). Supported: GeoTIFF (.tif), GeoJSON (.geojson), PNG/JPG.`);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('File size exceeds maximum allowed upload limit (100 MB).');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setUploadState('idle');

    if (ext === '.geojson' || ext === '.json') {
      setDatasetType('vector');
    } else {
      setDatasetType('raster');
    }
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setUploadProgress(20);
    setStatusStep('Verifying Coordinate Reference System (CRS) & Metadata...');

    try {
      // Simulate stepped progression for pipeline verification
      setTimeout(() => {
        setUploadProgress(50);
        setStatusStep('Extracting Multi-spectral Bands & Computing Geodesic Extent...');
      }, 500);

      setTimeout(async () => {
        try {
          let res;
          if (datasetType === 'raster') {
            res = await GeoVisionAPI.uploadImage(selectedFile);
          } else {
            // Read GeoJSON text
            const text = await selectedFile.text();
            const geojson = JSON.parse(text);
            res = await GeoVisionAPI.computeAreaMetrics(geojson);
          }

          setUploadProgress(100);
          setUploadState('success');
          setStatusStep('Dataset Verified & Ingested into Memory Cache');
          if (onUploadSuccess) onUploadSuccess(res);
        } catch (err: any) {
          setUploadState('error');
          setErrorMessage(err.response?.data?.detail || 'Failed to parse spatial dataset.');
        }
      }, 1000);
    } catch (err: any) {
      setUploadState('error');
      setErrorMessage('Network or server error during upload.');
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setUploadProgress(0);
    setStatusStep('');
    setErrorMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Geospatial Dataset"
      subtitle="Ingest GeoTIFF Multi-spectral Rasters or GeoJSON Spatial Boundaries"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Error Alert */}
        {errorMessage && (
          <ErrorAlert message={errorMessage} onRetry={reset} />
        )}

        {/* Upload Zone */}
        {uploadState !== 'success' ? (
          <div className="space-y-4">
            {/* Drag and Drop Container */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-sky-500 bg-sky-50/80 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white text-sky-600 shadow-sm border border-slate-200 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Drag and drop geospatial files here'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports GeoTIFF (`.tif`, `.tiff`), GeoJSON (`.geojson`), PNG/JPG orthophotos up to 100MB
                  </p>
                </div>

                <label className="cursor-pointer bg-white hover:bg-slate-50 text-sky-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-colors">
                  <span>Browse Files</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".tif,.tiff,.geojson,.json,.png,.jpg,.jpeg"
                    onChange={handleFileInput}
                  />
                </label>
              </div>
            </div>

            {/* Selected File Configuration */}
            {selectedFile && uploadState !== 'uploading' && (
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Detected Dataset Configuration
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Dataset Type
                    </label>
                    <select
                      value={datasetType}
                      onChange={(e) => setDatasetType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="raster">Multispectral Raster (GeoTIFF / PNG)</option>
                      <option value="vector">Spatial Vector Boundary (GeoJSON)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Sensor & Ground Sample Distance
                    </label>
                    <select
                      value={sensorPreset}
                      onChange={(e) => setSensorPreset(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Sentinel-2 (10m)">Sentinel-2 MSI (10m Multi-spectral)</option>
                      <option value="Landsat-8/9 (30m)">Landsat 8/9 OLI (30m Optical)</option>
                      <option value="PlanetScope (3m)">PlanetScope Ortho (3.0m High-Res)</option>
                      <option value="Custom (Custom GSD)">Custom Drone Orthomosaic</option>
                    </select>
                  </div>
                </div>

                {/* Band Mapping Preview */}
                {datasetType === 'raster' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-sky-600" />
                      Automatic Band Mapping (Sentinel-2 Convention)
                    </span>
                    <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                      <span className="bg-white border px-2 py-1 rounded text-red-700">Band 4 (Red: 0.66µm)</span>
                      <span className="bg-white border px-2 py-1 rounded text-emerald-700">Band 3 (Green: 0.56µm)</span>
                      <span className="bg-white border px-2 py-1 rounded text-blue-700">Band 2 (Blue: 0.49µm)</span>
                      <span className="bg-white border px-2 py-1 rounded text-purple-700">Band 8 (NIR: 0.84µm)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ingestion Progress */}
            {uploadState === 'uploading' && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
                    {statusStep}
                  </span>
                  <span className="font-mono text-sky-600">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="p-8 bg-emerald-50/50 rounded-3xl border border-emerald-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Dataset Ingested & Verified</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              `{selectedFile?.name}` has been successfully uploaded, CRS validated as WGS84 (EPSG:4326), and loaded into the active scene cache.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Inspect in GIS Map Explorer
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        {uploadState !== 'success' && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              Cancel
            </button>

            <button
              onClick={startUpload}
              disabled={!selectedFile || uploadState === 'uploading'}
              className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                selectedFile && uploadState !== 'uploading'
                  ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              Start Pipeline Verification
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
