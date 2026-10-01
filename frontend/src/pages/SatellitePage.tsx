import React, { useState, useEffect } from 'react';
import {
  Satellite,
  Layers,
  Calendar,
  Compass,
  Eye,
  Info,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { GeoVisionAPI } from '../services/api';
import { SampleScene } from '../types';

export const SatellitePage: React.FC = () => {
  const [scenes, setScenes] = useState<SampleScene[]>([]);
  const [activeScene, setActiveScene] = useState<string>('scene_2020');
  const [activeBand, setActiveBand] = useState<string>('rgb');
  const [fccUrl, setFccUrl] = useState<string | null>(null);
  const [loadingFCC, setLoadingFCC] = useState<boolean>(false);

  useEffect(() => {
    GeoVisionAPI.getSampleScenes().then(setScenes).catch(console.error);
  }, []);

  const handleGenerateFCC = async (preset: string) => {
    setLoadingFCC(true);
    setActiveBand('fcc');
    try {
      const res = await GeoVisionAPI.generateFalseColor(preset);
      setFccUrl(res.fcc_url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFCC(false);
    }
  };

  const currentSceneObj = scenes.find(s => s.id === activeScene) || scenes[0];

  const bands = [
    { id: 'rgb', name: 'True Color (RGB)', desc: 'B4 (Red), B3 (Green), B2 (Blue)', url: currentSceneObj?.rgb_url },
    { id: 'nir', name: 'Band 8 (Near-Infrared)', desc: '0.84 µm (10m Resolution) - High Vegetation Reflectance', url: '/api/v1/samples/band_nir.png' },
    { id: 'red', name: 'Band 4 (Red)', desc: '0.66 µm (10m Resolution) - Chlorophyll Absorption', url: '/api/v1/samples/band_red.png' },
    { id: 'green', name: 'Band 3 (Green)', desc: '0.56 µm (10m Resolution) - Water & Vegetation Peak', url: '/api/v1/samples/band_green.png' },
    { id: 'swir', name: 'Band 11 (SWIR)', desc: '1.61 µm (20m Resolution) - Built-up & Moisture', url: '/api/v1/samples/band_swir.png' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Satellite Multispectral Explorer</h2>
            <p className="text-xs text-slate-500">
              Sentinel-2 MSI Optical Sensor Bands, Spectral Profiles & False Color Composites
            </p>
          </div>
        </div>

        {/* Scene Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Selected Scene:</span>
          <select
            value={activeScene}
            onChange={(e) => setActiveScene(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="scene_2020">2020-03-15 (T1 Baseline)</option>
            <option value="scene_2025">2025-03-18 (T2 Recent)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Band Viewer & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Band Selector & FCC Presets */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Individual Spectral Channels
            </span>
            <div className="space-y-1.5">
              {bands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBand(b.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex flex-col ${
                    activeBand === b.id
                      ? 'bg-sky-600 text-white font-semibold shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="font-bold">{b.name}</span>
                  <span className={`text-[11px] mt-0.5 ${activeBand === b.id ? 'text-sky-100' : 'text-slate-400'}`}>
                    {b.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* False Color Composite Trigger */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-800">False Color Composite (FCC)</span>
              <button
                onClick={() => handleGenerateFCC('Standard_FCC')}
                disabled={loadingFCC}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  activeBand === 'fcc'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {loadingFCC ? 'Generating FCC...' : 'Standard FCC (NIR-Red-Green)'}
              </button>
            </div>
          </div>

          {/* Sensor Specifications Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-sky-600" />
              Sensor Specifications
            </div>
            <div className="space-y-1.5 text-slate-600 bg-white p-3 rounded-xl border">
              <div className="flex justify-between">
                <span>Constellation:</span>
                <span className="font-semibold text-slate-800">ESA Copernicus Sentinel-2</span>
              </div>
              <div className="flex justify-between">
                <span>Payload Sensor:</span>
                <span className="font-semibold text-slate-800">MultiSpectral Instrument (MSI)</span>
              </div>
              <div className="flex justify-between">
                <span>Spectral Bands:</span>
                <span className="font-semibold text-slate-800">13 Bands (VNIR / SWIR)</span>
              </div>
              <div className="flex justify-between">
                <span>Spatial Resolution:</span>
                <span className="font-semibold text-sky-700">10m / 20m / 60m</span>
              </div>
              <div className="flex justify-between">
                <span>Temporal Revisit:</span>
                <span className="font-semibold text-slate-800">5 Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: High-Resolution Viewport Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeBand === 'fcc' ? 'Standard False Color Composite (NIR-Red-Green)' : bands.find(b => b.id === activeBand)?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {currentSceneObj?.name} • Acquisition: {currentSceneObj?.acquisition_date}
                </p>
              </div>
              <span className="text-xs font-mono bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg border border-sky-200">
                512 x 512 px • EPSG:4326
              </span>
            </div>

            <div className="h-96 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative shadow-inner">
              {activeBand === 'fcc' && fccUrl ? (
                <img src={fccUrl} alt="False Color Composite" className="w-full h-full object-cover" />
              ) : (
                <img
                  src={bands.find(b => b.id === activeBand)?.url || currentSceneObj?.rgb_url}
                  alt="Band Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border space-y-1">
              <span className="font-bold text-slate-800">Band Interpretation Guide:</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {activeBand === 'nir' && 'Near-Infrared reflectance peaks in the spongy mesophyll layer of green leaves, distinguishing healthy canopy from soil.'}
                {activeBand === 'red' && 'Red band experiences strong chlorophyll absorption, appearing dark in forested areas and bright over bare soil.'}
                {activeBand === 'swir' && 'SWIR channel is sensitive to soil moisture and roof materials, highlighting urban impervious boundaries.'}
                {activeBand === 'fcc' && 'Standard FCC maps NIR to Red, Red to Green, and Green to Blue. Healthy vegetation appears vibrant red/magenta.'}
                {activeBand === 'rgb' && 'True color visual composite approximating human eye spectral perception.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
