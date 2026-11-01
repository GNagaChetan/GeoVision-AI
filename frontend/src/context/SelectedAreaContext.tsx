import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AreaStats {
  greenery: string;
  urban: string;
  water: string;
  total: string;
}

export interface MapArea {
  id: string;
  name: string;
  locationLabel: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  desc: string;
  description?: string;
  stats: AreaStats;
  boundary: [number, number][]; // [[lat, lng], ...]
  areaHa: number;
  areaKm2: number;
  isCustom: boolean;
  createdAt?: string;
}

export const PRESET_AREAS: Record<string, MapArea> = {
  hyderabad: {
    id: 'hyderabad',
    name: 'Hyderabad IT Corridor',
    locationLabel: 'Telangana, India (17.448°N, 78.372°E)',
    center: [17.4485, 78.3725],
    zoom: 13,
    desc: 'HITEC City & Financial District tech corridor, Durgam Cheruvu lake basin, and urban parks.',
    stats: { greenery: '34.2%', urban: '42.7%', water: '8.9%', total: '2,987 ha' },
    boundary: [
      [17.420, 78.345],
      [17.420, 78.400],
      [17.475, 78.400],
      [17.475, 78.345]
    ],
    areaHa: 2987.4,
    areaKm2: 29.87,
    isCustom: false
  },
  godavari: {
    id: 'godavari',
    name: 'Godavari Basin',
    locationLabel: 'Andhra Pradesh, India (16.989°N, 81.784°E)',
    center: [16.9891, 81.7840],
    zoom: 13,
    desc: 'River riparian corridor, natural wetlands, delta agriculture, and irrigation networks.',
    stats: { greenery: '42.1%', urban: '14.2%', water: '18.4%', total: '3,420 ha' },
    boundary: [
      [16.965, 81.750],
      [16.965, 81.820],
      [17.015, 81.820],
      [17.015, 81.750]
    ],
    areaHa: 3420.0,
    areaKm2: 34.20,
    isCustom: false
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru IT Corridor',
    locationLabel: 'Karnataka, India (12.935°N, 77.695°E)',
    center: [12.9352, 77.6946],
    zoom: 13,
    desc: 'Outer Ring Road (ORR), Bellandur lake basin, and Whitefield technology cluster.',
    stats: { greenery: '28.4%', urban: '54.6%', water: '6.8%', total: '3,120 ha' },
    boundary: [
      [12.910, 77.660],
      [12.910, 77.730],
      [12.970, 77.730],
      [12.970, 77.660]
    ],
    areaHa: 3120.0,
    areaKm2: 31.20,
    isCustom: false
  }
};

/**
 * Geodesic / spherical polygon area calculation (in hectares and km2)
 * using the Shoelace formula on spherical projection.
 */
export function calculateGeodesicArea(coords: [number, number][]): { areaHa: number; areaKm2: number } {
  if (coords.length < 3) return { areaHa: 0, areaKm2: 0 };
  const radius = 6378137; // Earth's mean radius in meters
  let total = 0;

  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    const lat1 = (p1[0] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const lon1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[1] * Math.PI) / 180;

    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const areaSqMeters = Math.abs((total * radius * radius) / 2.0);
  const areaHa = Math.round((areaSqMeters / 10000) * 100) / 100;
  const areaKm2 = Math.round((areaSqMeters / 1000000) * 100) / 100;
  return { areaHa, areaKm2 };
}

interface SelectedAreaContextType {
  selectedArea: MapArea;
  isCustom: boolean;
  setSelectedArea: (area: MapArea) => void;
  selectPreset: (key: 'hyderabad' | 'godavari' | 'bengaluru') => void;
  setCustomSelection: (
    name: string,
    center: [number, number],
    boundary: [number, number][],
    zoom?: number
  ) => MapArea;
  presets: Record<string, MapArea>;
}

const SelectedAreaContext = createContext<SelectedAreaContextType | undefined>(undefined);

export const SelectedAreaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedArea, setSelectedAreaState] = useState<MapArea>(() => {
    try {
      const saved = localStorage.getItem('geovision_selected_area');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return PRESET_AREAS.hyderabad;
  });

  useEffect(() => {
    try {
      localStorage.setItem('geovision_selected_area', JSON.stringify(selectedArea));
    } catch {
      // ignore
    }
  }, [selectedArea]);

  const selectPreset = (key: 'hyderabad' | 'godavari' | 'bengaluru') => {
    if (PRESET_AREAS[key]) {
      setSelectedAreaState(PRESET_AREAS[key]);
    }
  };

  const setCustomSelection = (
    name: string,
    center: [number, number],
    boundary: [number, number][],
    zoom = 14
  ): MapArea => {
    const { areaHa, areaKm2 } = calculateGeodesicArea(boundary);
    const customArea: MapArea = {
      id: `custom_${Date.now()}`,
      name: name.trim() || 'Custom Selected Area',
      locationLabel: `Coordinates (${center[0].toFixed(4)}°N, ${center[1].toFixed(4)}°E)`,
      center,
      zoom,
      desc: `User-defined boundary enclosing ${areaHa.toLocaleString()} ha (${areaKm2} km²).`,
      description: `User-defined boundary enclosing ${areaHa.toLocaleString()} ha (${areaKm2} km²).`,
      stats: {
        greenery: 'Estimated ~30%',
        urban: 'Estimated ~45%',
        water: 'Estimated ~5%',
        total: `${areaHa.toLocaleString()} ha`
      },
      boundary,
      areaHa,
      areaKm2,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    setSelectedAreaState(customArea);
    return customArea;
  };

  return (
    <SelectedAreaContext.Provider
      value={{
        selectedArea,
        isCustom: selectedArea.isCustom,
        setSelectedArea: setSelectedAreaState,
        selectPreset,
        setCustomSelection,
        presets: PRESET_AREAS
      }}
    >
      {children}
    </SelectedAreaContext.Provider>
  );
};

export const useSelectedArea = (): SelectedAreaContextType => {
  const context = useContext(SelectedAreaContext);
  if (!context) {
    throw new Error('useSelectedArea must be used within a SelectedAreaProvider');
  }
  return context;
};
