import React, { useState, useEffect } from 'react';
import { Settings, Database, Key, Globe, Shield, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { GeoVisionAPI } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await GeoVisionAPI.checkHealth();
      setHealthData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">System & Engine Settings</h2>
            <p className="text-xs text-slate-500">
              Database Connectivity, Sensor Resolutions, CRS Reference & AI Model Telemetry
            </p>
          </div>
        </div>

        <button
          onClick={loadHealth}
          className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Subsystem Health Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-floating space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Subsystem Operational Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {healthData?.services && Object.entries(healthData.services).map(([key, val]) => (
            <div
              key={key}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
            >
              <span className="font-semibold text-slate-700 capitalize">
                {key.replace('_', ' ')}
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                val ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
              }`}>
                {val ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {val ? 'Operational' : 'Offline / Standalone Fallback'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Specifications */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-floating space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Default Geospatial Constants
        </h3>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 block">Default CRS Datum</span>
              <span className="text-slate-400 text-[11px]">WGS84 Reference Ellipsoid</span>
            </div>
            <span className="font-mono font-bold bg-white px-3 py-1 rounded-lg border">EPSG:4326</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 block">Sentinel-2 MSI Ground Sample Distance</span>
              <span className="text-slate-400 text-[11px]">Bands 2, 3, 4, 8 Native Resolution</span>
            </div>
            <span className="font-mono font-bold bg-white px-3 py-1 rounded-lg border">10.0 meters / pixel</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 block">AI Reasoning Engine</span>
              <span className="text-slate-400 text-[11px]">Multi-modal Decision Support Model</span>
            </div>
            <span className="font-mono font-bold bg-white px-3 py-1 rounded-lg border">gemini-2.5-flash</span>
          </div>
        </div>
      </div>
    </div>
  );
};
