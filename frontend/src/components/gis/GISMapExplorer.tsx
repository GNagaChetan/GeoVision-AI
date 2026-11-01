import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON as LeafletGeoJSON,
  Polygon as LeafletPolygon,
  Polyline as LeafletPolyline,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet';
import {
  Layers,
  Eye,
  EyeOff,
  Activity,
  Sliders,
  Compass,
  Info,
  ChevronRight,
  TrendingUp,
  Waves,
  Building,
  TreePine,
  Ruler,
  Palette,
  MapPin,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  Upload,
  Download,
  Trash2,
  MoveUp,
  MoveDown,
  MousePointer,
  Square,
  Crosshair,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FolderPlus,
  Globe,
  Settings,
  HelpCircle,
  BarChart3,
  X
} from 'lucide-react';
import { GeoVisionAPI } from '../../services/api';
import {
  VectorLayer,
  RasterLayer,
  StudyArea,
  SpatialAreaResponse,
  SpatialBufferResponse,
  DistanceCalculationResponse,
  PointInPolygonMatch,
  BBoxQueryResponse,
  PolygonStatisticsResponse,
  GeoJSONValidationResponse,
  CRSValidationResponse
} from '../../types';
import { DemoDataBadge, ErrorAlert } from '../common/UIState';

// Base Tile Providers
const BASE_MAPS = {
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    name: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  topo: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
  },
  dark: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  }
};

// Map View Bounds Updater
const MapBoundsUpdater: React.FC<{ bounds?: [number, number][] }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
};

// Map Events & Tool Handler
interface MapInteractionProps {
  activeTool: 'navigate' | 'identify' | 'distance' | 'area' | 'pip' | 'bbox';
  onMapClick: (lat: number, lng: number) => void;
  onMouseMove: (lat: number, lng: number) => void;
}

const MapInteractionHandler: React.FC<MapInteractionProps> = ({
  activeTool,
  onMapClick,
  onMouseMove
}) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    mousemove(e) {
      onMouseMove(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

export const GISMapExplorer: React.FC = () => {
  // ----------------------------------------------------
  // Core GIS Data States
  // ----------------------------------------------------
  const [vectorLayers, setVectorLayers] = useState<VectorLayer[]>([]);
  const [rasterLayers, setRasterLayers] = useState<RasterLayer[]>([]);
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [activeStudyAreaId, setActiveStudyAreaId] = useState<string>('study_area_default');
  const [selectedStudyArea, setSelectedStudyArea] = useState<StudyArea | null>(null);

  // Map Display States
  const [selectedBaseMap, setSelectedBaseMap] = useState<keyof typeof BASE_MAPS>('osm');
  const [activeTab, setActiveTab] = useState<'layers' | 'inspector' | 'tools' | 'statistics' | 'legend'>('layers');
  const [activeTool, setActiveTool] = useState<'navigate' | 'identify' | 'distance' | 'area' | 'pip' | 'bbox'>('navigate');
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({ lat: 17.4376, lng: 78.4606 });
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Measure / Interactive Drawing States
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [distanceResult, setDistanceResult] = useState<DistanceCalculationResponse | null>(null);
  const [areaResult, setAreaResult] = useState<SpatialAreaResponse | null>(null);

  // Inspector / Selection State
  const [inspectedFeature, setInspectedFeature] = useState<{
    feature: any;
    layerName: string;
    areaHa?: number;
    coords?: [number, number];
  } | null>(null);

  // Point in Polygon Matches
  const [pipMatches, setPipMatches] = useState<PointInPolygonMatch[]>([]);

  // Bounding Box Query State
  const [bboxBounds, setBboxBounds] = useState<[number, number, number, number]>([78.435, 17.412, 78.486, 17.463]);
  const [bboxResult, setBboxResult] = useState<BBoxQueryResponse | null>(null);

  // Geodesic Buffer State
  const [bufferDistance, setBufferDistance] = useState<number>(200);
  const [bufferedGeoJSON, setBufferedGeoJSON] = useState<any>(null);
  const [bufferResult, setBufferResult] = useState<SpatialBufferResponse | null>(null);
  const [bufferLoading, setBufferLoading] = useState<boolean>(false);

  // Statistics State
  const [datasetStats, setDatasetStats] = useState<PolygonStatisticsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [newStudyAreaModalOpen, setNewStudyAreaModalOpen] = useState<boolean>(false);
  const [crsModalOpen, setCrsModalOpen] = useState<boolean>(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLayerName, setUploadLayerName] = useState<string>('');
  const [uploadValidation, setUploadValidation] = useState<GeoJSONValidationResponse | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // New Study Area Form State
  const [newSaName, setNewSaName] = useState<string>('');
  const [newSaDescription, setNewSaDescription] = useState<string>('');
  const [newSaGeoJSONStr, setNewSaGeoJSONStr] = useState<string>('');

  // CRS Form State
  const [crsQuery, setCrsQuery] = useState<string>('EPSG:4326');
  const [crsInfo, setCrsInfo] = useState<CRSValidationResponse | null>(null);

  // ----------------------------------------------------
  // Initial Data Loading
  // ----------------------------------------------------
  useEffect(() => {
    loadAllGISData();
  }, []);

  const loadAllGISData = async () => {
    setLoading(true);
    try {
      const [vLayers, rLayers, sAreas] = await Promise.all([
        GeoVisionAPI.listVectorLayers(),
        GeoVisionAPI.listRasterLayers(),
        GeoVisionAPI.listStudyAreas()
      ]);
      setVectorLayers(vLayers);
      setRasterLayers(rLayers);
      setStudyAreas(sAreas);

      if (sAreas.length > 0) {
        const defaultSa = sAreas.find(s => s.id === activeStudyAreaId) || sAreas[0];
        setSelectedStudyArea(defaultSa);
        setActiveStudyAreaId(defaultSa.id);
      }

      // Load initial polygon statistics
      loadPolygonStats();
    } catch (err) {
      console.error('Failed to load GIS data:', err);
      setStatusMessage('Error loading GIS layer database.');
    } finally {
      setLoading(false);
    }
  };

  const loadPolygonStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await GeoVisionAPI.getPolygonStatistics();
      setDatasetStats(stats);
    } catch (err) {
      console.error('Failed to calculate polygon statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Map Interaction & Tool Click Handling
  // ----------------------------------------------------
  const handleMapClick = async (lat: number, lng: number) => {
    const lonLat: [number, number] = [Number(lng.toFixed(6)), Number(lat.toFixed(6))];

    if (activeTool === 'identify') {
      // Query point in polygon across all active vector layers
      try {
        const res = await GeoVisionAPI.queryPointInPolygon(lonLat);
        setPipMatches(res.matches);
        if (res.matches.length > 0) {
          const match = res.matches[0];
          setInspectedFeature({
            feature: { properties: match.properties, geometry_type: match.geometry_type },
            layerName: `Feature ${match.feature_id}`,
            areaHa: match.area_hectares,
            coords: lonLat
          });
          setActiveTab('inspector');
        } else {
          setInspectedFeature(null);
          setStatusMessage(`No vector feature found at coordinates [${lonLat[0]}, ${lonLat[1]}].`);
        }
      } catch (err) {
        console.error('Point query failed:', err);
      }
    } else if (activeTool === 'distance') {
      const updated = [...measurePoints, lonLat];
      setMeasurePoints(updated);
      if (updated.length >= 2) {
        try {
          const res = await GeoVisionAPI.calculateDistance(updated);
          setDistanceResult(res);
        } catch (err) {
          console.error('Distance calculation failed:', err);
        }
      }
    } else if (activeTool === 'area') {
      const updated = [...measurePoints, lonLat];
      setMeasurePoints(updated);
      if (updated.length >= 3) {
        // Construct closed polygon
        const closedCoords = [...updated, updated[0]];
        const polyGeoJSON = {
          type: 'Polygon',
          coordinates: [closedCoords]
        };
        try {
          const res = await GeoVisionAPI.computeAreaMetrics(polyGeoJSON);
          setAreaResult(res);
        } catch (err) {
          console.error('Area measurement failed:', err);
        }
      }
    } else if (activeTool === 'pip') {
      try {
        const res = await GeoVisionAPI.queryPointInPolygon(lonLat);
        setPipMatches(res.matches);
        setActiveTab('tools');
      } catch (err) {
        console.error('PIP failed:', err);
      }
    }
  };

  const resetMeasureTools = () => {
    setMeasurePoints([]);
    setDistanceResult(null);
    setAreaResult(null);
  };

  // ----------------------------------------------------
  // Layer Management Actions
  // ----------------------------------------------------
  const handleToggleVectorVisibility = async (layerId: string) => {
    const layer = vectorLayers.find(l => l.id === layerId);
    if (!layer) return;
    const newVis = !layer.visible;
    setVectorLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: newVis } : l));
    try {
      await GeoVisionAPI.updateVectorLayer(layerId, { visible: newVis });
    } catch (err) {
      console.error('Failed to update layer visibility:', err);
    }
  };

  const handleUpdateVectorOpacity = async (layerId: string, opacity: number) => {
    setVectorLayers(prev => prev.map(l => l.id === layerId ? {
      ...l,
      style_config: { ...l.style_config, opacity, fill_opacity: opacity * 0.3 }
    } : l));
  };

  const handleUpdateVectorColor = async (layerId: string, fillColor: string) => {
    const layer = vectorLayers.find(l => l.id === layerId);
    setVectorLayers(prev => prev.map(l => l.id === layerId ? {
      ...l,
      style_config: { ...l.style_config, fill_color: fillColor }
    } : l));
    try {
      await GeoVisionAPI.updateVectorLayer(layerId, {
        style_config: { ...(layer?.style_config || {}), fill_color: fillColor }
      });
    } catch (err) {
      console.error('Failed to update layer color:', err);
    }
  };

  const handleMoveLayer = async (layerId: string, direction: 'up' | 'down') => {
    const index = vectorLayers.findIndex(l => l.id === layerId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === vectorLayers.length - 1) return;

    const newLayers = [...vectorLayers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newLayers[index];
    newLayers[index] = newLayers[targetIndex];
    newLayers[targetIndex] = temp;

    // Update z_index order
    const orderedIds = newLayers.map(l => l.id);
    setVectorLayers(newLayers);
    try {
      await GeoVisionAPI.reorderLayers(orderedIds);
    } catch (err) {
      console.error('Failed to reorder layers:', err);
    }
  };

  const handleDeleteVectorLayer = async (layerId: string) => {
    if (!confirm('Are you sure you want to delete this vector layer?')) return;
    try {
      await GeoVisionAPI.deleteVectorLayer(layerId);
      setVectorLayers(prev => prev.filter(l => l.id !== layerId));
      setStatusMessage('Layer deleted successfully.');
    } catch (err) {
      console.error('Failed to delete layer:', err);
    }
  };

  const handleExportLayerGeoJSON = async (layerId: string, layerName: string) => {
    try {
      const geojson = await GeoVisionAPI.exportVectorLayerGeoJSON(layerId);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojson, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${layerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.geojson`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to export GeoJSON:', err);
    }
  };

  // ----------------------------------------------------
  // Geodesic Buffer Execution
  // ----------------------------------------------------
  const handleApplyGeodesicBuffer = async () => {
    const activeVector = vectorLayers.find(l => l.visible && l.geojson_data);
    const targetGeoJSON = activeVector ? activeVector.geojson_data : selectedStudyArea?.boundary_geojson;
    if (!targetGeoJSON) {
      setStatusMessage('Please select or enable a vector layer to apply buffer.');
      return;
    }

    setBufferLoading(true);
    try {
      const res = await GeoVisionAPI.createBuffer(targetGeoJSON, bufferDistance);
      setBufferedGeoJSON(res.buffered_geojson);
      setBufferResult(res);
      setStatusMessage(`Geodesic buffer of ${bufferDistance}m generated on WGS84 ellipsoid.`);
    } catch (err) {
      console.error('Buffer calculation failed:', err);
      setStatusMessage('Buffer calculation error.');
    } finally {
      setBufferLoading(false);
    }
  };

  // ----------------------------------------------------
  // Bounding Box Query Execution
  // ----------------------------------------------------
  const handleExecuteBBoxQuery = async () => {
    try {
      const res = await GeoVisionAPI.queryBBox(bboxBounds, undefined, undefined, 'intersects');
      setBboxResult(res);
      setStatusMessage(`Bounding box query matched ${res.matched_count} features.`);
    } catch (err) {
      console.error('BBox query failed:', err);
    }
  };

  // ----------------------------------------------------
  // GeoJSON Upload Handling
  // ----------------------------------------------------
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadLayerName(file.name.replace(/\.[^/.]+$/, ''));

    // Validate geometry structure
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const val = await GeoVisionAPI.validateGeoJSON(parsed);
      setUploadValidation(val);
    } catch (err) {
      console.error('Validation error:', err);
      setUploadValidation({
        is_valid: false,
        issues: ['Could not parse file as valid GeoJSON.'],
        feature_count: 0,
        geometry_types: [],
        total_vertices: 0
      });
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setUploadLoading(true);
    try {
      const res = await GeoVisionAPI.uploadGeoJSONFile(uploadFile, uploadLayerName, activeStudyAreaId);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadValidation(null);
      setVectorLayers(prev => [...prev, res.layer]);
      setStatusMessage(`Layer '${uploadLayerName}' uploaded and registered.`);
      loadPolygonStats();
    } catch (err) {
      console.error('Upload failed:', err);
      setStatusMessage('Failed to upload vector layer.');
    } finally {
      setUploadLoading(false);
    }
  };

  // ----------------------------------------------------
  // Study Area Switcher & Creation
  // ----------------------------------------------------
  const handleSwitchStudyArea = (saId: string) => {
    setActiveStudyAreaId(saId);
    const sa = studyAreas.find(s => s.id === saId);
    if (sa) setSelectedStudyArea(sa);
  };

  const handleCreateStudyArea = async () => {
    if (!newSaName || !newSaGeoJSONStr) return;
    try {
      const parsed = JSON.parse(newSaGeoJSONStr);
      const newSa = await GeoVisionAPI.createStudyArea({
        name: newSaName,
        description: newSaDescription,
        boundary_geojson: parsed
      });
      setStudyAreas(prev => [...prev, newSa]);
      setActiveStudyAreaId(newSa.id);
      setSelectedStudyArea(newSa);
      setNewStudyAreaModalOpen(false);
      setNewSaName('');
      setNewSaDescription('');
      setNewSaGeoJSONStr('');
      setStatusMessage(`Study area '${newSa.name}' created.`);
    } catch (err) {
      console.error('Failed to create study area:', err);
      alert('Invalid GeoJSON boundary string.');
    }
  };

  // ----------------------------------------------------
  // CRS Validation Modal
  // ----------------------------------------------------
  const handleValidateCRS = async () => {
    try {
      const info = await GeoVisionAPI.validateCRS(crsQuery);
      setCrsInfo(info);
    } catch (err) {
      console.error('CRS validation failed:', err);
    }
  };

  // Study area coordinates for map focus
  const mapCenter: [number, number] = selectedStudyArea?.centroid
    ? [selectedStudyArea.centroid[1], selectedStudyArea.centroid[0]]
    : [17.4376, 78.4606];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 p-2 sm:p-4 max-w-[1800px] mx-auto">
      {/* ----------------------------------------------------
          Left: Interactive Leaflet GIS Map Canvas
      ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-floating overflow-hidden relative min-h-[580px]">
        {/* Top Floating Action Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Spatial Tools Toolbar */}
          <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-elevated flex items-center space-x-1 pointer-events-auto">
            <button
              onClick={() => { setActiveTool('navigate'); resetMeasureTools(); }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTool === 'navigate' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Pan & Navigate"
            >
              <MousePointer className="w-4 h-4" />
              <span className="hidden md:inline">Navigate</span>
            </button>
            <button
              onClick={() => { setActiveTool('identify'); resetMeasureTools(); }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTool === 'identify' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Identify Feature Attributes"
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline">Identify</span>
            </button>
            <button
              onClick={() => { setActiveTool('distance'); resetMeasureTools(); }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTool === 'distance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Measure Geodesic Distance"
            >
              <Ruler className="w-4 h-4" />
              <span className="hidden md:inline">Measure Dist</span>
            </button>
            <button
              onClick={() => { setActiveTool('area'); resetMeasureTools(); }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTool === 'area' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Measure Geodesic Area"
            >
              <Crosshair className="w-4 h-4" />
              <span className="hidden md:inline">Measure Area</span>
            </button>
            <button
              onClick={() => { setActiveTool('pip'); resetMeasureTools(); }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTool === 'pip' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Point-in-Polygon Query"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden md:inline">PIP Query</span>
            </button>
          </div>

          {/* Base Layer Switcher & Study Area Controls */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            {/* Base Layer Picker */}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-elevated flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <select
                value={selectedBaseMap}
                onChange={(e) => setSelectedBaseMap(e.target.value as keyof typeof BASE_MAPS)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="osm">OpenStreetMap</option>
                <option value="satellite">Esri Satellite</option>
                <option value="topo">OpenTopoMap</option>
                <option value="dark">CartoDB Dark</option>
              </select>
            </div>

            {/* Study Area Picker */}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-elevated flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500">AOI:</span>
              <select
                value={activeStudyAreaId}
                onChange={(e) => handleSwitchStudyArea(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {studyAreas.map(sa => (
                  <option key={sa.id} value={sa.id}>{sa.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl shadow-xs text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Layer
            </button>
          </div>
        </div>

        {/* Live Status Toast Banner if active */}
        {statusMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-elevated text-xs flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Map Container */}
        <div className="w-full h-full relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution={BASE_MAPS[selectedBaseMap].attribution}
              url={BASE_MAPS[selectedBaseMap].url}
            />

            <MapInteractionHandler
              activeTool={activeTool}
              onMapClick={handleMapClick}
              onMouseMove={(lat, lng) => setCursorCoords({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) })}
            />

            {/* Study Area Boundary if selected */}
            {selectedStudyArea?.boundary_geojson && (
              <LeafletGeoJSON
                key={`sa_${selectedStudyArea.id}`}
                data={selectedStudyArea.boundary_geojson}
                style={{
                  color: '#0284c7',
                  fillColor: '#38bdf8',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '4, 4'
                }}
              />
            )}

            {/* Vector Layers Rendering */}
            {vectorLayers.filter(l => l.visible && l.geojson_data).map(layer => (
              <LeafletGeoJSON
                key={`vl_${layer.id}_${layer.style_config.fill_color}_${layer.style_config.opacity}`}
                data={layer.geojson_data}
                style={{
                  color: layer.style_config.stroke_color || '#0284c7',
                  fillColor: layer.style_config.fill_color || '#38bdf8',
                  fillOpacity: layer.style_config.fill_opacity ?? 0.3,
                  weight: layer.style_config.stroke_width || 2
                }}
                onEachFeature={(feature, leafletLayer) => {
                  leafletLayer.on({
                    click: () => {
                      setInspectedFeature({
                        feature,
                        layerName: layer.name,
                        areaHa: layer.area_hectares
                      });
                      setActiveTab('inspector');
                    }
                  });
                }}
              />
            ))}

            {/* Buffered Polygon GeoJSON if active */}
            {bufferedGeoJSON && (
              <LeafletGeoJSON
                key={JSON.stringify(bufferedGeoJSON)}
                data={bufferedGeoJSON}
                style={{
                  color: '#e11d48',
                  fillColor: '#f43f5e',
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: '6, 6'
                }}
              />
            )}

            {/* Interactive Measurement Points & Path */}
            {measurePoints.length > 0 && (
              <>
                {measurePoints.map((pt, idx) => (
                  <CircleMarker
                    key={`pt_${idx}`}
                    center={[pt[1], pt[0]]}
                    radius={5}
                    pathOptions={{ color: '#0284c7', fillColor: '#38bdf8', fillOpacity: 0.9, weight: 2 }}
                  />
                ))}
                {activeTool === 'distance' && measurePoints.length >= 2 && (
                  <LeafletPolyline
                    positions={measurePoints.map(p => [p[1], p[0]])}
                    pathOptions={{ color: '#10b981', weight: 3, dashArray: '5, 5' }}
                  />
                )}
                {activeTool === 'area' && measurePoints.length >= 3 && (
                  <LeafletPolygon
                    positions={measurePoints.map(p => [p[1], p[0]])}
                    pathOptions={{ color: '#d97706', fillColor: '#f59e0b', fillOpacity: 0.25, weight: 2 }}
                  />
                )}
              </>
            )}
          </MapContainer>
        </div>

        {/* Floating Bottom Left: Geodesic Coordinates & CRS HUD */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-elevated text-xs space-y-1 pointer-events-auto">
          <div className="flex items-center space-x-2 text-slate-800 font-bold">
            <Compass className="w-4 h-4 text-sky-600" />
            <span>Cursor: {cursorCoords.lat}° N, {cursorCoords.lng}° E</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>CRS: WGS84 (EPSG:4326)</span>
            <button
              onClick={() => { setCrsModalOpen(true); handleValidateCRS(); }}
              className="text-sky-600 hover:underline font-sans font-bold"
            >
              Inspect CRS
            </button>
          </div>
        </div>

        {/* Floating Bottom Right: Measurement & Tool Feedback Overlay */}
        {(distanceResult || areaResult || (measurePoints.length > 0 && activeTool !== 'navigate')) && (
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-elevated max-w-sm text-xs space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-sky-600" />
                Live Geodesic Tool Result
              </span>
              <button onClick={resetMeasureTools} className="text-[10px] font-bold text-rose-600 hover:underline">
                Clear
              </button>
            </div>

            {distanceResult && (
              <div className="space-y-1 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-950 font-mono">
                <div className="flex justify-between">
                  <span>Geodesic Length:</span>
                  <span className="font-bold">{distanceResult.total_distance_km} km ({distanceResult.total_distance_meters} m)</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-800">
                  <span>Points Clicked:</span>
                  <span>{distanceResult.point_count}</span>
                </div>
              </div>
            )}

            {areaResult && (
              <div className="space-y-1 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-950 font-mono">
                <div className="flex justify-between">
                  <span>Geodesic Area:</span>
                  <span className="font-bold">{areaResult.area_hectares} ha ({areaResult.area_sq_km} km²)</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-800">
                  <span>Perimeter:</span>
                  <span>{areaResult.perimeter_meters} m</span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 italic">
              Computed on WGS84 Reference Ellipsoid via pyproj.Geod.
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          Right: Professional GIS Workbench & Tabbed Control Panel
      ---------------------------------------------------- */}
      <div className="w-full lg:w-[460px] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-floating overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-1">
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'layers' ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Layers</span>
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'inspector' ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'tools' ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Tools</span>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'statistics' ? 'bg-white text-purple-700 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('legend')}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'legend' ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Legend</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* ----------------------------------------------------
              Tab 1: Layer Switcher & Symbology
          ---------------------------------------------------- */}
          {activeTab === 'layers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600" />
                  Vector Layer Stack ({vectorLayers.length})
                </span>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Vector
                </button>
              </div>

              {vectorLayers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No vector layers loaded. Upload a GeoJSON file to begin.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {vectorLayers.map((layer, idx) => (
                    <div
                      key={layer.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleVectorVisibility(layer.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                              layer.visible ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">{layer.name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {layer.layer_type.toUpperCase()} • {layer.feature_count} features
                            </span>
                          </div>
                        </div>

                        {/* Reorder & Export Controls */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleMoveLayer(layer.id, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveLayer(layer.id, 'down')}
                            disabled={idx === vectorLayers.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExportLayerGeoJSON(layer.id, layer.name)}
                            className="p-1 text-slate-500 hover:text-sky-600"
                            title="Export GeoJSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVectorLayer(layer.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete Layer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Styling & Opacity Slider */}
                      {layer.visible && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 font-semibold">Color:</span>
                            <input
                              type="color"
                              value={layer.style_config.fill_color || '#38bdf8'}
                              onChange={(e) => handleUpdateVectorColor(layer.id, e.target.value)}
                              className="w-6 h-6 rounded-md border border-slate-300 cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 font-semibold">Opacity:</span>
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.1"
                              value={layer.style_config.opacity ?? 1.0}
                              onChange={(e) => handleUpdateVectorOpacity(layer.id, parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Raster Layer Subsection */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Raster Layer Catalog ({rasterLayers.length})
                </span>
                {rasterLayers.map(raster => (
                  <div key={raster.id} className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs space-y-1">
                    <p className="font-bold text-emerald-950">{raster.name}</p>
                    <div className="flex justify-between text-[11px] text-emerald-800 font-mono">
                      <span>CRS: {raster.crs}</span>
                      <span>Res: {raster.spatial_resolution_m}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              Tab 2: Feature Information & Inspector
          ---------------------------------------------------- */}
          {activeTab === 'inspector' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Feature Attribute Inspector
                </span>
                {inspectedFeature && (
                  <button onClick={() => setInspectedFeature(null)} className="text-[10px] text-slate-400 hover:underline">
                    Clear Selection
                  </button>
                )}
              </div>

              {inspectedFeature ? (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Identified Layer</span>
                    <p className="text-sm font-black text-indigo-950">{inspectedFeature.layerName}</p>
                    {inspectedFeature.areaHa && (
                      <p className="text-xs text-indigo-800 font-semibold">
                        Geodesic Area: <span className="font-bold">{inspectedFeature.areaHa} ha</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">Feature Properties:</span>
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Attribute Key</th>
                            <th className="p-2.5">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {Object.entries(inspectedFeature.feature.properties || {}).map(([k, v]) => (
                            <tr key={k} className="hover:bg-slate-100/50 font-mono text-[11px]">
                              <td className="p-2.5 font-bold text-slate-700">{k}</td>
                              <td className="p-2.5 text-slate-900">{String(v)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <MousePointer className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Feature Selected</p>
                  <p className="text-[11px] text-slate-500">
                    Switch to the <strong>Identify Tool</strong> on the top map toolbar and click on any vector feature.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------
              Tab 3: Spatial Analytics & Geodesic Tools
          ---------------------------------------------------- */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              {/* Tool 1: Geodesic Buffer */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    Geodesic Buffer Tool
                  </span>
                  <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    UTM Projected
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Buffer Radius:</span>
                    <span className="font-mono text-sky-700">{bufferDistance} meters</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="25"
                    value={bufferDistance}
                    onChange={(e) => setBufferDistance(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                </div>

                <button
                  onClick={handleApplyGeodesicBuffer}
                  disabled={bufferLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  {bufferLoading ? 'Projecting Buffer...' : 'Apply Geodesic Buffer'}
                </button>

                {bufferResult && (
                  <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-rose-900">Buffer Envelope Area: {bufferResult.buffered_area_ha} ha</p>
                    <p className="text-[11px] text-slate-600">Net Expansion: +{(bufferResult.buffered_area_ha - bufferResult.original_area_ha).toFixed(2)} ha</p>
                  </div>
                )}
              </div>

              {/* Tool 2: Bounding Box Spatial Query */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Square className="w-4 h-4 text-purple-600" />
                    Bounding Box Spatial Query
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <input
                    type="number"
                    step="0.001"
                    value={bboxBounds[0]}
                    onChange={(e) => setBboxBounds([parseFloat(e.target.value), bboxBounds[1], bboxBounds[2], bboxBounds[3]])}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-center"
                    placeholder="Min Lon"
                  />
                  <input
                    type="number"
                    step="0.001"
                    value={bboxBounds[1]}
                    onChange={(e) => setBboxBounds([bboxBounds[0], parseFloat(e.target.value), bboxBounds[2], bboxBounds[3]])}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-center"
                    placeholder="Min Lat"
                  />
                  <input
                    type="number"
                    step="0.001"
                    value={bboxBounds[2]}
                    onChange={(e) => setBboxBounds([bboxBounds[0], bboxBounds[1], parseFloat(e.target.value), bboxBounds[3]])}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-center"
                    placeholder="Max Lon"
                  />
                  <input
                    type="number"
                    step="0.001"
                    value={bboxBounds[3]}
                    onChange={(e) => setBboxBounds([bboxBounds[0], bboxBounds[1], bboxBounds[2], parseFloat(e.target.value)])}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-center"
                    placeholder="Max Lat"
                  />
                </div>
                <button
                  onClick={handleExecuteBBoxQuery}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 rounded-xl transition-all"
                >
                  Execute Spatial Envelope Query
                </button>

                {bboxResult && (
                  <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1 font-mono">
                    <p className="font-bold text-purple-900">Matched: {bboxResult.matched_count} / {bboxResult.total_queried} Features</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              Tab 4: Polygon Descriptive Statistics
          ---------------------------------------------------- */}
          {activeTab === 'statistics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Polygon Dataset Statistics
                </span>
                <button onClick={loadPolygonStats} className="text-xs text-sky-600 font-bold hover:underline">
                  Refresh
                </button>
              </div>

              {statsLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">Computing spatial statistics...</div>
              ) : datasetStats ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                      <span className="text-[10px] font-bold text-purple-600">Total Area</span>
                      <p className="text-base font-black text-purple-950 mt-0.5">{datasetStats.total_area_hectares} ha</p>
                      <p className="text-[10px] text-purple-700 font-mono">{datasetStats.total_area_sq_km} km²</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500">Polygon Count</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">{datasetStats.polygon_count}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{datasetStats.total_vertices} vertices</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Mean Area:</span>
                      <span className="font-bold text-slate-800 font-mono">{datasetStats.mean_area_ha} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Median Area:</span>
                      <span className="font-bold text-slate-800 font-mono">{datasetStats.median_area_ha} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Standard Deviation:</span>
                      <span className="font-bold text-slate-800 font-mono">{datasetStats.std_dev_area_ha} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Compactness Score:</span>
                      <span className="font-bold text-slate-800 font-mono">{datasetStats.mean_compactness_score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Total Perimeter:</span>
                      <span className="font-bold text-slate-800 font-mono">{datasetStats.total_perimeter_km} km</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">No polygon statistics available.</div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------
              Tab 5: Dynamic Map Legend
          ---------------------------------------------------- */}
          {activeTab === 'legend' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Palette className="w-4 h-4 text-amber-600" />
                Active Map Legend
              </span>

              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-2.5">
                  <div className="w-4 h-4 rounded-md border-2 border-sky-600 bg-sky-200" />
                  <span className="text-xs font-bold text-slate-800">Study Area Boundary (EPSG:4326)</span>
                </div>

                {vectorLayers.filter(l => l.visible).map(layer => (
                  <div key={layer.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-4 h-4 rounded-md border"
                        style={{
                          backgroundColor: layer.style_config.fill_color || '#38bdf8',
                          borderColor: layer.style_config.stroke_color || '#0284c7'
                        }}
                      />
                      <span className="text-xs font-bold text-slate-800">{layer.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{layer.feature_count} feats</span>
                  </div>
                ))}

                {bufferedGeoJSON && (
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center space-x-2.5">
                    <div className="w-4 h-4 rounded-md border-2 border-dashed border-rose-600 bg-rose-200" />
                    <span className="text-xs font-bold text-rose-900">Geodesic Buffer Zone ({bufferDistance}m)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          Modal: Upload Vector Layer
      ---------------------------------------------------- */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-600" />
                Upload Vector Layer (GeoJSON)
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Layer Name</label>
                <input
                  type="text"
                  value={uploadLayerName}
                  onChange={(e) => setUploadLayerName(e.target.value)}
                  placeholder="e.g. Hyderabad Green Belts 2026"
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select .geojson or .json file</label>
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
              </div>

              {uploadValidation && (
                <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                  uploadValidation.is_valid ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {uploadValidation.is_valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    <span>{uploadValidation.is_valid ? 'Valid GeoJSON Geometry' : 'Geometry Issues Detected'}</span>
                  </div>
                  <p className="text-[11px]">
                    Features: <strong>{uploadValidation.feature_count}</strong> • Types: <strong>{uploadValidation.geometry_types.join(', ')}</strong> • Vertices: <strong>{uploadValidation.total_vertices}</strong>
                  </p>
                  {uploadValidation.issues.length > 0 && (
                    <ul className="list-disc pl-4 text-[10px] text-rose-800 space-y-0.5">
                      {uploadValidation.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadFile || uploadLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl disabled:opacity-50 shadow-xs"
              >
                {uploadLoading ? 'Uploading...' : 'Register Layer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          Modal: CRS Inspector
      ---------------------------------------------------- */}
      {crsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-600" />
                Coordinate Reference System (CRS) Inspector
              </h3>
              <button onClick={() => setCrsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={crsQuery}
                  onChange={(e) => setCrsQuery(e.target.value)}
                  placeholder="e.g. EPSG:4326, EPSG:32643, EPSG:3857"
                  className="flex-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                <button
                  onClick={handleValidateCRS}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Inspect
                </button>
              </div>

              {crsInfo && crsInfo.is_valid && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">CRS Name:</span>
                    <span className="font-bold text-slate-900">{crsInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Type:</span>
                    <span className="font-bold text-sky-700">{crsInfo.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Ellipsoid / Datum:</span>
                    <span className="font-mono text-slate-800">{crsInfo.ellipsoid} ({crsInfo.datum})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Units:</span>
                    <span className="font-mono text-slate-800">{crsInfo.units}</span>
                  </div>
                  {crsInfo.proj4 && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-semibold">PROJ4 Definition:</span>
                      <p className="text-[10px] font-mono text-slate-600 break-all bg-white p-2 rounded-lg border border-slate-200 mt-1">
                        {crsInfo.proj4}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setCrsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
