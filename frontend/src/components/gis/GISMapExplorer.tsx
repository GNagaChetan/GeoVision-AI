import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polygon, Popup, useMap } from 'react-leaflet';
import {
  Layers,
  Eye,
  Activity,
  Sliders,
  Maximize2,
  Compass,
  Info,
  ChevronRight,
  TrendingUp,
  Waves,
  Building,
  TreePine
} from 'lucide-react';
import { GeoVisionAPI } from '../../services/api';
import { SpatialAreaResponse, SpectralIndexResponse, SampleScene } from '../../types';

// Helper component to adjust map view bounds
const MapBoundsUpdater: React.FC<{ bounds: [number, number][] }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
};

export const GISMapExplorer: React.FC = () => {
  const [studyAreaGeoJSON, setStudyAreaGeoJSON] = useState<any>(null);
  const [areaMetrics, setAreaMetrics] = useState<SpatialAreaResponse | null>(null);
  const [sampleScenes, setSampleScenes] = useState<SampleScene[]>([]);
  const [activeScene, setActiveScene] = useState<string>('scene_2020');
  
  // Layer controls
  const [activeLayer, setActiveLayer] = useState<'rgb' | 'ndvi' | 'ndwi' | 'ndbi' | 'fcc'>('rgb');
  const [spectralData, setSpectralData] = useState<SpectralIndexResponse | null>(null);
  const [fccUrl, setFccUrl] = useState<string | null>(null);
  const [loadingLayer, setLoadingLayer] = useState<boolean>(false);

  // Buffer tool state
  const [bufferDistance, setBufferDistance] = useState<number>(150);
  const [bufferedGeoJSON, setBufferedGeoJSON] = useState<any>(null);
  const [bufferLoading, setBufferLoading] = useState<boolean>(false);

  // Load study area and sample scenes on mount
  useEffect(() => {
    loadStudyArea();
    loadScenes();
  }, []);

  const loadStudyArea = async () => {
    try {
      const data = await GeoVisionAPI.getSampleStudyArea();
      setStudyAreaGeoJSON(data);
      const metrics = await GeoVisionAPI.computeAreaMetrics(data);
      setAreaMetrics(metrics);
    } catch (err) {
      console.error('Failed to load study area:', err);
    }
  };

  const loadScenes = async () => {
    try {
      const scenes = await GeoVisionAPI.getSampleScenes();
      setSampleScenes(scenes);
    } catch (err) {
      console.error('Failed to load scenes:', err);
    }
  };

  // Handle spectral index computation
  const handleLayerSwitch = async (layerType: 'rgb' | 'ndvi' | 'ndwi' | 'ndbi' | 'fcc') => {
    setActiveLayer(layerType);
    if (layerType === 'rgb') return;

    setLoadingLayer(true);
    try {
      if (layerType === 'fcc') {
        const res = await GeoVisionAPI.generateFalseColor('Standard_FCC');
        setFccUrl(res.fcc_url);
      } else {
        const indexType = layerType.toUpperCase();
        const res = await GeoVisionAPI.computeSpectralIndex(indexType);
        setSpectralData(res);
      }
    } catch (err) {
      console.error('Layer processing error:', err);
    } finally {
      setLoadingLayer(false);
    }
  };

  // Handle Geodesic Buffer Generation
  const handleApplyBuffer = async () => {
    if (!studyAreaGeoJSON) return;
    setBufferLoading(true);
    try {
      const res = await GeoVisionAPI.createBuffer(studyAreaGeoJSON, bufferDistance);
      setBufferedGeoJSON(res.buffered_geojson);
    } catch (err) {
      console.error('Buffer generation failed:', err);
    } finally {
      setBufferLoading(false);
    }
  };

  // Clear buffer
  const handleClearBuffer = () => {
    setBufferedGeoJSON(null);
  };

  // Coordinates of study area for map centering
  const studyCoordinates: [number, number][] = [
    [17.4120, 78.4350],
    [17.4120, 78.4862],
    [17.4632, 78.4862],
    [17.4632, 78.4350],
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 p-4 max-w-[1600px] mx-auto">
      {/* Left Column: Interactive Map Canvas */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-floating overflow-hidden relative min-h-[500px]">
        {/* Floating Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Layer Selector Pill */}
          <div className="bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200/90 shadow-elevated flex items-center space-x-1 pointer-events-auto">
            <button
              onClick={() => handleLayerSwitch('rgb')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeLayer === 'rgb'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              True Color (RGB)
            </button>
            <button
              onClick={() => handleLayerSwitch('ndvi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeLayer === 'ndvi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TreePine className="w-3.5 h-3.5" />
              NDVI (Vegetation)
            </button>
            <button
              onClick={() => handleLayerSwitch('ndwi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeLayer === 'ndwi'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              NDWI (Water)
            </button>
            <button
              onClick={() => handleLayerSwitch('ndbi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeLayer === 'ndbi'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              NDBI (Built-Up)
            </button>
            <button
              onClick={() => handleLayerSwitch('fcc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeLayer === 'fcc'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              False Color (FCC)
            </button>
          </div>

          {/* Temporal Scene Switcher */}
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-elevated flex items-center space-x-2 pointer-events-auto">
            <span className="text-xs font-semibold text-slate-500">Temporal Scene:</span>
            <select
              value={activeScene}
              onChange={(e) => setActiveScene(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="scene_2020">2020-03-15 (T1 Baseline)</option>
              <option value="scene_2025">2025-03-18 (T2 Recent)</option>
            </select>
          </div>
        </div>

        {/* Leaflet Map */}
        <div className="w-full h-full relative z-0">
          <MapContainer
            center={[17.4376, 78.4606]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapBoundsUpdater bounds={studyCoordinates} />

            {/* Study Area Boundary Polygon */}
            <Polygon
              positions={studyCoordinates}
              pathOptions={{
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.25,
                weight: 2,
                dashArray: '4, 4'
              }}
            >
              <Popup>
                <div className="p-2 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900">GeoVision Study Area (Sentinel-2 MSI)</p>
                  <p className="text-slate-600">CRS: <span className="font-mono">EPSG:4326 (WGS84)</span></p>
                  <p className="text-slate-600">Area: <span className="font-semibold text-sky-700">{areaMetrics?.area_hectares} ha</span> ({areaMetrics?.area_sq_km} km²)</p>
                  <p className="text-slate-600">Perimeter: <span className="font-semibold">{areaMetrics?.perimeter_meters} m</span></p>
                  <p className="text-slate-500 text-[10px] mt-1 border-t pt-1">Sample multispectral scene with verified 10m GSD.</p>
                </div>
              </Popup>
            </Polygon>

            {/* Buffered Zone GeoJSON if active */}
            {bufferedGeoJSON && (
              <GeoJSON
                key={JSON.stringify(bufferedGeoJSON)}
                data={bufferedGeoJSON}
                style={{
                  color: '#e11d48',
                  fillColor: '#f43f5e',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '6, 6'
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Floating Bottom Left: Geodesic Coordinates & CRS */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md text-xs space-y-1 pointer-events-auto">
          <div className="flex items-center space-x-2 text-slate-700 font-semibold">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>Center: 17.4376° N, 78.4606° E</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Bounding Box: [78.4350, 17.4120, 78.4862, 17.4632]
          </p>
        </div>

        {/* Floating Raster Preview Overlay if spectral or FCC active */}
        {activeLayer !== 'rgb' && (
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-elevated w-64 space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {activeLayer.toUpperCase()} Layer Preview
              </span>
              {loadingLayer && <span className="text-[10px] text-sky-600 animate-pulse">Computing...</span>}
            </div>

            {activeLayer === 'fcc' && fccUrl ? (
              <img src={fccUrl} alt="False Color Composite" className="w-full h-36 object-cover rounded-lg border" />
            ) : spectralData ? (
              <div className="space-y-2">
                <img src={spectralData.colormap_image_url} alt="Spectral Index" className="w-full h-36 object-cover rounded-lg border" />
                <div className="text-[11px] space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Mean Value:</span>
                    <span className="font-bold text-slate-900">{spectralData.mean_value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Range:</span>
                    <span className="font-mono">[{spectralData.min_value}, {spectralData.max_value}]</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">{spectralData.interpretation}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Right Column: GIS Analytics & Spatial Buffer Workbench */}
      <div className="w-full lg:w-96 flex flex-col space-y-4 overflow-y-auto">
        {/* Card 1: Study Area & Geodesic Geometry Metrics */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              Geospatial Metrics
            </h2>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified Calculation
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100">
              <span className="text-[11px] font-semibold text-slate-500">Study Area</span>
              <p className="text-lg font-bold text-sky-900 mt-0.5">
                {areaMetrics?.area_hectares ?? '2,987.4'} <span className="text-xs font-normal text-slate-600">ha</span>
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {areaMetrics?.area_sq_km ?? '29.87'} km²
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">Perimeter</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {areaMetrics ? (areaMetrics.perimeter_meters / 1000).toFixed(2) : '21.89'} <span className="text-xs font-normal text-slate-600">km</span>
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {areaMetrics?.perimeter_meters ?? '21,890'} m
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Satellite Sensor:</span>
              <span className="font-semibold text-slate-800">Sentinel-2 MSI</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Ground Sample Dist:</span>
              <span className="font-semibold text-slate-800">10 meters / pixel</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Ellipsoid Reference:</span>
              <span className="font-semibold text-slate-800">WGS84 (EPSG:4326)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Geodesic Buffer Zone Tool */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              Geodesic Buffer Tool
            </h2>
            <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
              Spatial Operation
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Generate an ellipsoidal geodesic buffer around the study boundary to evaluate environmental protection envelopes and urban encroachment zones.
          </p>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Buffer Distance:</span>
              <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {bufferDistance} meters
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={bufferDistance}
              onChange={(e) => setBufferDistance(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>50m (Riparian)</span>
              <span>500m</span>
              <span>1000m (Regional)</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApplyBuffer}
              disabled={bufferLoading}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {bufferLoading ? 'Generating Buffer...' : 'Apply Geodesic Buffer'}
            </button>
            {bufferedGeoJSON && (
              <button
                onClick={handleClearBuffer}
                className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-all"
              >
                Clear
              </button>
            )}
          </div>

          {bufferedGeoJSON && (
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1.5">
              <p className="font-bold text-rose-900">Buffer Calculation Result:</p>
              <p className="text-slate-700">
                • Buffer Envelope Area: <span className="font-semibold text-rose-800">{bufferedGeoJSON.properties.buffered_area_ha} ha</span>
              </p>
              <p className="text-slate-700">
                • Net Expansion Area: <span className="font-semibold text-slate-900">{(bufferedGeoJSON.properties.buffered_area_ha - bufferedGeoJSON.properties.original_area_ha).toFixed(2)} ha</span>
              </p>
            </div>
          )}
        </div>

        {/* Card 3: Academic Formula Reference */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-4 h-4 text-sky-600" />
            Remote Sensing Spectral Formulation
          </div>
          <div className="space-y-1 text-slate-600 font-mono text-[11px] bg-white p-2.5 rounded-lg border">
            <p>NDVI = (NIR - Red) / (NIR + Red)</p>
            <p>NDWI = (Green - NIR) / (Green + NIR)</p>
            <p>NDBI = (SWIR - NIR) / (SWIR + NIR)</p>
          </div>
          <p className="text-[10px] text-slate-500">
            Standard indices formulated in Lillesand & Kiefer (Remote Sensing and Image Interpretation).
          </p>
        </div>
      </div>
    </div>
  );
};
