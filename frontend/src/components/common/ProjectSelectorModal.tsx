import React from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Globe2,
  Calendar,
  Satellite,
  Layers,
  MapPin,
  Upload,
  PlusCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Modal, DemoDataBadge } from './UIState';

export interface ProjectMetadata {
  id: string;
  name: string;
  location: string;
  description: string;
  sensor: string;
  groundSampleDistance: string;
  crs: string;
  totalAreaHa: number;
  totalAreaKm2: number;
  acquisitionDates: string[];
  bandsAvailable: string[];
  isDemo: boolean;
  active: boolean;
  status: 'Ready' | 'Indexing' | 'Cached';
}

export const SAMPLE_PROJECTS: ProjectMetadata[] = [
  {
    id: 'hyderabad_urban',
    name: 'Hyderabad Urban & IT Corridor',
    location: 'Telangana, India (17.448°N, 78.372°E)',
    description: 'Multi-spectral scene capturing urban expansion, lake networks, and peri-urban vegetation dynamics.',
    sensor: 'Sentinel-2 MSI (Level-2A BOA Reflectance)',
    groundSampleDistance: '10.0 meters / pixel',
    crs: 'WGS84 (EPSG:4326) / UTM Zone 44N',
    totalAreaHa: 2987.4,
    totalAreaKm2: 29.87,
    acquisitionDates: ['2020-03-15 (T1)', '2025-03-18 (T2)'],
    bandsAvailable: ['B2 Blue', 'B3 Green', 'B4 Red', 'B8 NIR', 'B11 SWIR'],
    isDemo: true,
    active: true,
    status: 'Ready'
  },
  {
    id: 'godavari_basin',
    name: 'Godavari River Basin & Riparian Zone',
    location: 'Andhra Pradesh, India (16.989°N, 81.784°E)',
    description: 'Hydrological buffer analysis, water index (NDWI) temporal tracking, and agricultural runoff assessment.',
    sensor: 'Sentinel-2 MSI (10m Multi-spectral)',
    groundSampleDistance: '10.0 meters / pixel',
    crs: 'WGS84 (EPSG:4326) / UTM Zone 44N',
    totalAreaHa: 3420.0,
    totalAreaKm2: 34.20,
    acquisitionDates: ['2021-11-10', '2024-11-15'],
    bandsAvailable: ['B2 Blue', 'B3 Green', 'B4 Red', 'B8 NIR'],
    isDemo: true,
    active: false,
    status: 'Ready'
  },
  {
    id: 'bengaluru_it_corridor',
    name: 'Bengaluru IT Corridor',
    location: 'Karnataka, India (12.935°N, 77.695°E)',
    description: 'Outer Ring Road (ORR), Bellandur lake basin, and Whitefield technology cluster land dynamics.',
    sensor: 'Sentinel-2 MSI (Level-2A BOA Reflectance)',
    groundSampleDistance: '10.0 meters / pixel',
    crs: 'WGS84 (EPSG:4326) / UTM Zone 43N',
    totalAreaHa: 3120.0,
    totalAreaKm2: 31.20,
    acquisitionDates: ['2020-02-14 (T1)', '2025-02-20 (T2)'],
    bandsAvailable: ['B2 Blue', 'B3 Green', 'B4 Red', 'B8 NIR', 'B11 SWIR'],
    isDemo: true,
    active: false,
    status: 'Ready'
  }
];

interface ProjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenUpload: () => void;
}

export const ProjectSelectorModal: React.FC<ProjectSelectorModalProps> = ({
  isOpen,
  onClose,
  activeProjectId,
  onSelectProject,
  onOpenUpload
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project & Study Area Selector"
      subtitle="Switch active geospatial workspace or import custom multispectral scene"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Project List */}
        <div className="space-y-3">
          {SAMPLE_PROJECTS.map((proj) => {
            const isSelected = proj.id === activeProjectId;
            return (
              <div
                key={proj.id}
                onClick={() => {
                  onSelectProject(proj.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                  isSelected
                    ? 'bg-sky-50/70 border-sky-300 shadow-sm ring-2 ring-sky-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2.5 rounded-xl mt-0.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900">{proj.name}</h4>
                        {proj.isDemo && <DemoDataBadge label="Demo Scene" />}
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {proj.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-800 block">
                      {proj.totalAreaHa.toLocaleString()} ha
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {proj.totalAreaKm2} km²
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {proj.description}
                </p>

                {/* Metadata Pills */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Satellite className="w-3.5 h-3.5 text-sky-600" />
                      {proj.sensor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                      {proj.crs}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {proj.acquisitionDates.join(' & ')}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-sky-700 flex items-center gap-1">
                    {isSelected ? 'Currently Selected' : 'Switch to Project →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenUpload();
            }}
            className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-4 py-2.5 rounded-xl border border-sky-200 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Custom GeoTIFF / GeoJSON Scene
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
