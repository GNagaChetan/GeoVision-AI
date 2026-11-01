import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map as MapIcon,
  Search,
  MapPin,
  Trees,
  Waves,
  Building,
  Camera,
  CheckCircle2,
  Sparkles,
  Info,
  Maximize2,
  Square,
  Pentagon,
  Trash2,
  Save,
  Navigation,
  ArrowRight,
  Layers,
  Compass,
  Move,
  RotateCcw,
  Sliders,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSelectedArea, PRESET_AREAS, calculateGeodesicArea, MapArea } from '../context/SelectedAreaContext';

// Fix default Leaflet marker icon issue in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Helper component to pan/zoom when center or bounds change
const MapViewController: React.FC<{
  center: [number, number];
  zoom: number;
  bounds?: [number, number][];
}> = ({ center, zoom, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, bounds, map]);
  return null;
};

// Map click event listener for drawing
interface MapDrawerEventsProps {
  drawMode: 'none' | 'rectangle' | 'polygon';
  polygonPoints: [number, number][];
  onMapClick: (lat: number, lng: number) => void;
}

const MapDrawerEvents: React.FC<MapDrawerEventsProps> = ({ drawMode, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (drawMode !== 'none') {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

export const SatellitePage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedArea, setSelectedArea, selectPreset, setCustomSelection, presets } = useSelectedArea();

  // Active visual layer
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'street' | 'topo' | 'dark'>('satellite');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Drawing & Custom Area states
  const [drawMode, setDrawMode] = useState<'none' | 'rectangle' | 'polygon'>('none');
  const [customBoundary, setCustomBoundary] = useState<[number, number][]>([]);
  const [polygonDraft, setPolygonDraft] = useState<[number, number][]>([]);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [squareSideKm, setSquareSideKm] = useState<number>(3.0); // default 3km side for instant box

  // Map view states
  const [mapCenter, setMapCenter] = useState<[number, number]>(selectedArea.center);
  const [mapZoom, setMapZoom] = useState<number>(selectedArea.zoom || 13);
  const [targetBounds, setTargetBounds] = useState<[number, number][] | undefined>(selectedArea.boundary);

  // Update map position when selectedArea changes externally
  useEffect(() => {
    setMapCenter(selectedArea.center);
    setMapZoom(selectedArea.zoom || 13);
    setTargetBounds(selectedArea.boundary);
    if (selectedArea.isCustom) {
      setCustomBoundary(selectedArea.boundary);
    }
  }, [selectedArea.id]);

  // Tile layers config
  const tileLayers = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; High-Resolution Satellite'
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Style: OpenTopoMap'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO'
    }
  };

  // -------------------------------------------------------------
  // Location Search Handler (Coordinates or Place Name)
  // -------------------------------------------------------------
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearchError(null);
    setIsSearching(true);

    // 1. Check if user typed coordinates like "17.448, 78.372"
    const coordMatch = query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        applyNewLocation([lat, lng], `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`);
        setIsSearching(false);
        setSearchResults([]);
        return;
      }
    }

    // 2. Query OpenStreetMap Nominatim for geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      if (!response.ok) throw new Error('Geocoding service unavailable');
      const data = await response.json();

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchError(`No locations found for "${query}". Try adding city or country.`);
      }
    } catch (err: any) {
      setSearchError('Search failed. Check your internet connection or enter coordinates.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    applyNewLocation([lat, lng], item.display_name.split(',')[0]);
    setSearchResults([]);
    setSearchQuery(item.display_name.split(',')[0]);
  };

  // Apply location and generate a calibrated bounding square around it
  const applyNewLocation = (center: [number, number], name: string) => {
    const [lat, lng] = center;
    const deltaLat = (squareSideKm / 111.0) / 2.0;
    const deltaLng = (squareSideKm / (111.0 * Math.cos((lat * Math.PI) / 180))) / 2.0;

    const squareBoundary: [number, number][] = [
      [lat - deltaLat, lng - deltaLng],
      [lat - deltaLat, lng + deltaLng],
      [lat + deltaLat, lng + deltaLng],
      [lat + deltaLat, lng - deltaLng]
    ];

    const custom = setCustomSelection(name, center, squareBoundary, 14);
    setMapCenter(center);
    setMapZoom(14);
    setTargetBounds(squareBoundary);
    setCustomBoundary(squareBoundary);
  };

  // -------------------------------------------------------------
  // Custom Drawing & Polygon Creation
  // -------------------------------------------------------------
  const handleMapClick = (lat: number, lng: number) => {
    if (drawMode === 'rectangle') {
      // Create a centered square around the clicked point
      const deltaLat = (squareSideKm / 111.0) / 2.0;
      const deltaLng = (squareSideKm / (111.0 * Math.cos((lat * Math.PI) / 180))) / 2.0;

      const square: [number, number][] = [
        [lat - deltaLat, lng - deltaLng],
        [lat - deltaLat, lng + deltaLng],
        [lat + deltaLat, lng + deltaLng],
        [lat + deltaLat, lng - deltaLng]
      ];

      setCustomBoundary(square);
      setCustomSelection('Custom Selected Boundary', [lat, lng], square);
      setDrawMode('none');
    } else if (drawMode === 'polygon') {
      const nextPoints: [number, number][] = [...polygonDraft, [lat, lng]];
      setPolygonDraft(nextPoints);
    }
  };

  const handleFinishPolygon = () => {
    if (polygonDraft.length < 3) return;
    const centerLat = polygonDraft.reduce((acc, p) => acc + p[0], 0) / polygonDraft.length;
    const centerLng = polygonDraft.reduce((acc, p) => acc + p[1], 0) / polygonDraft.length;

    setCustomBoundary(polygonDraft);
    setCustomSelection('Custom Selected Polygon', [centerLat, centerLng], polygonDraft);
    setPolygonDraft([]);
    setDrawMode('none');
  };

  const handleClearSelection = () => {
    setCustomBoundary([]);
    setPolygonDraft([]);
    setDrawMode('none');
    selectPreset('hyderabad');
  };

  const handleSaveSelection = () => {
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  // Calculate live metrics for currently displayed boundary
  const activeBoundary = customBoundary.length >= 3 ? customBoundary : selectedArea.boundary;
  const liveMetrics = calculateGeodesicArea(activeBoundary);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5 font-sans">
      {/* 1. Header & Location Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[#176B87] bg-[#DDF3FA] text-xs font-bold px-3 py-1 rounded-full border border-[#176B87]/30">
              <Camera className="w-3.5 h-3.5" />
              <span>Public Land Intelligence & Satellite Map</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#08162B] tracking-tight">
              Explore Map & Choose Any Geographic Area
            </h1>
            <p className="text-xs text-slate-500">
              Select one of the three verified region presets or search & draw your own custom boundary anywhere on Earth.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Region Presets:</span>
            <button
              onClick={() => {
                selectPreset('hyderabad');
                setCustomBoundary([]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedArea.id === 'hyderabad'
                  ? 'bg-[#176B87] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Hyderabad IT Corridor</span>
            </button>

            <button
              onClick={() => {
                selectPreset('godavari');
                setCustomBoundary([]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedArea.id === 'godavari'
                  ? 'bg-[#176B87] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Godavari Basin</span>
            </button>

            <button
              onClick={() => {
                selectPreset('bengaluru');
                setCustomBoundary([]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedArea.id === 'bengaluru'
                  ? 'bg-[#176B87] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Bengaluru IT Corridor</span>
            </button>
          </div>
        </div>

        {/* 2. Global Search & Map Layer Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any place, city, district, or coordinates (e.g. 17.448, 78.372)..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 focus:border-[#176B87] text-xs sm:text-sm text-[#08162B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176B87]/20 transition-all bg-slate-50/60 focus:bg-white"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 px-3 py-1.5 bg-[#176B87] hover:bg-[#135870] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Search Autocomplete Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#DDF3FA]/30 text-xs transition-colors flex items-start gap-2.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#176B87] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#08162B]">{item.display_name.split(',')[0]}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-md">{item.display_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <div className="absolute top-full left-0 right-0 mt-1 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 z-50">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Layer Mode Selector */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:inline">Layer:</span>
            <button
              onClick={() => setActiveLayer('satellite')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLayer === 'satellite'
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Satellite Photo
            </button>
            <button
              onClick={() => setActiveLayer('street')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLayer === 'street'
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setActiveLayer('topo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLayer === 'topo'
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Topography
            </button>
            <button
              onClick={() => setActiveLayer('dark')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLayer === 'dark'
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Night Dark
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Map & Drawing Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left/Center: Interactive Map Container (8 or 9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-3xl p-3 border border-slate-200 shadow-xs overflow-hidden relative">
          {/* Top Drawing Control Toolbar */}
          <div className="mb-2 p-2.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 z-10 relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                Area Tools:
              </span>

              {/* Draw Rectangle Tool */}
              <button
                type="button"
                onClick={() => {
                  setDrawMode(drawMode === 'rectangle' ? 'none' : 'rectangle');
                  setPolygonDraft([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  drawMode === 'rectangle'
                    ? 'bg-[#176B87] text-white shadow-xs ring-2 ring-[#176B87]/30'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
                title="Click anywhere on map to drop a square boundary"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Draw Square / Box</span>
              </button>

              {/* Draw Polygon Tool */}
              <button
                type="button"
                onClick={() => {
                  setDrawMode(drawMode === 'polygon' ? 'none' : 'polygon');
                  setPolygonDraft([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  drawMode === 'polygon'
                    ? 'bg-[#176B87] text-white shadow-xs ring-2 ring-[#176B87]/30'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
                title="Click points on map to draw a custom shape"
              >
                <Pentagon className="w-3.5 h-3.5" />
                <span>Draw Polygon</span>
              </button>

              {/* Square Side Size Selector */}
              {drawMode === 'rectangle' && (
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Box Size:</span>
                  <select
                    value={squareSideKm}
                    onChange={(e) => setSquareSideKm(parseFloat(e.target.value))}
                    className="font-bold text-[#08162B] bg-transparent focus:outline-none"
                  >
                    <option value="1">1 km × 1 km (100 ha)</option>
                    <option value="2">2 km × 2 km (400 ha)</option>
                    <option value="3">3 km × 3 km (900 ha)</option>
                    <option value="5">5 km × 5 km (2,500 ha)</option>
                    <option value="8">8 km × 8 km (6,400 ha)</option>
                  </select>
                </div>
              )}

              {/* Finish Polygon button */}
              {drawMode === 'polygon' && polygonDraft.length >= 3 && (
                <button
                  type="button"
                  onClick={handleFinishPolygon}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs animate-pulse"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Finish Polygon ({polygonDraft.length} pts)</span>
                </button>
              )}
            </div>

            {/* Clear & Save Controls */}
            <div className="flex items-center gap-2">
              {(customBoundary.length > 0 || polygonDraft.length > 0) && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 font-semibold"
                  title="Clear custom boundary and revert to preset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveSelection}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                title="Save this boundary as active platform context"
              >
                {isSavedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Area</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Tool Instructions Banner */}
          {drawMode !== 'none' && (
            <div className="mb-2 p-2.5 bg-[#DDF3FA] border border-[#176B87]/30 rounded-xl text-xs text-[#08162B] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#176B87]" />
                {drawMode === 'rectangle' &&
                  `Click anywhere on the map to place a calibrated ${squareSideKm}km × ${squareSideKm}km boundary.`}
                {drawMode === 'polygon' &&
                  `Click on the map to add vertices (${polygonDraft.length} added). Click 'Finish Polygon' when done.`}
              </span>
              <button
                type="button"
                onClick={() => setDrawMode('none')}
                className="font-bold text-[#176B87] hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Leaflet Map Canvas */}
          <div className="h-[560px] w-full rounded-2xl overflow-hidden relative z-0">
            <MapContainer
              key={`${selectedArea.id}-${activeLayer}`}
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer url={tileLayers[activeLayer].url} attribution={tileLayers[activeLayer].attribution} />

              <MapViewController center={mapCenter} zoom={mapZoom} bounds={targetBounds} />

              <MapDrawerEvents
                drawMode={drawMode}
                polygonPoints={polygonDraft}
                onMapClick={handleMapClick}
              />

              {/* Observed Boundary Polygon */}
              {activeBoundary.length >= 3 && (
                <Polygon
                  positions={activeBoundary}
                  pathOptions={{
                    color: selectedArea.isCustom ? '#f59e0b' : '#0284c7',
                    fillColor: selectedArea.isCustom ? '#fbbf24' : '#38bdf8',
                    weight: 3,
                    fillOpacity: 0.18,
                    dashArray: selectedArea.isCustom ? undefined : '5, 6'
                  }}
                >
                  <Popup>
                    <div className="p-2 text-xs space-y-1">
                      <p className="font-bold text-slate-900">{selectedArea.name}</p>
                      <p className="text-slate-600">{selectedArea.desc}</p>
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                        Geodesic Area: {liveMetrics.areaHa.toLocaleString()} ha ({liveMetrics.areaKm2} km²)
                      </p>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* Polygon draft preview line */}
              {drawMode === 'polygon' && polygonDraft.length > 0 && (
                <>
                  <Polyline positions={polygonDraft} pathOptions={{ color: '#f59e0b', weight: 2.5, dashArray: '4, 4' }} />
                  {polygonDraft.map((pt, idx) => (
                    <CircleMarker
                      key={idx}
                      center={pt}
                      radius={4}
                      pathOptions={{ color: '#d97706', fillColor: '#fbbf24', fillOpacity: 1 }}
                    />
                  ))}
                </>
              )}

              {/* Center point marker */}
              <Marker position={mapCenter}>
                <Popup>
                  <div className="p-1 text-xs">
                    <strong>{selectedArea.name}</strong>
                    <p className="text-slate-500 font-mono text-[10px]">
                      {mapCenter[0].toFixed(4)}°N, {mapCenter[1].toFixed(4)}°E
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Floating Map Status Overlay */}
            <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${selectedArea.isCustom ? 'bg-amber-500' : 'bg-[#176B87]'}`} />
              <span>{selectedArea.isCustom ? 'Custom Selected Area' : selectedArea.name}</span>
            </div>
          </div>
        </div>

        {/* Right Info & Actions Sidebar (3 or 4 cols) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Active Area Telemetry Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Selected Area
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  selectedArea.isCustom
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {selectedArea.isCustom ? 'User Defined' : 'Verified Preset'}
              </span>
            </div>

            <div>
              <h2 className="text-base font-extrabold text-[#08162B]">{selectedArea.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{selectedArea.locationLabel}</p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedArea.desc}</p>
            </div>

            {/* Area Dimensions Stats */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Calculated Area</span>
                <span className="font-extrabold text-[#08162B]">
                  {liveMetrics.areaHa.toLocaleString()} ha
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Square Kilometers</span>
                <span className="font-extrabold text-[#08162B]">{liveMetrics.areaKm2} km²</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Center Coordinates</span>
                <span className="font-mono text-[11px] text-slate-700 font-bold">
                  {mapCenter[0].toFixed(3)}°, {mapCenter[1].toFixed(3)}°
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5 text-emerald-600" />
                  Estimated Greenery
                </span>
                <span className="font-extrabold text-emerald-800">{selectedArea.stats.greenery}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <span className="text-rose-800 font-medium flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-rose-600" />
                  Urban Built-up
                </span>
                <span className="font-extrabold text-rose-800">{selectedArea.stats.urban}</span>
              </div>
            </div>

            {/* Quick Action Navigation Links */}
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(`/ask-geovision?area=${encodeURIComponent(selectedArea.name)}`)}
                className="w-full bg-[#176B87] hover:bg-[#135870] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask AI About This Area</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/image-processing')}
                className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#176B87]" />
                <span>Analyze Area Images</span>
              </button>
            </div>
          </div>

          {/* Useful Context Tip Card */}
          <div className="p-4 bg-[#DDF3FA]/50 rounded-2xl border border-[#176B87]/20 text-xs text-[#102A43] space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-[#176B87]">
              <Info className="w-4 h-4" />
              <span>Context Preserved Across Platform</span>
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              When you select or draw an area here, its coordinates and boundary are automatically shared with
              <strong> Ask GeoVision AI</strong>, <strong>Image Analysis</strong>, and <strong>My Reports</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatellitePage;
