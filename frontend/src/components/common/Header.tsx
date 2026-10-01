import React from 'react';
import { Globe2, Satellite, Activity, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  systemHealth: boolean;
}

export const Header: React.FC<HeaderProps> = ({ systemHealth }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3 shadow-subtle">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Satellite className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                GeoVision <span className="text-sky-600 font-extrabold">AI</span>
              </h1>
              <span className="bg-sky-50 text-sky-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-sky-200">
                v1.0 Academic
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Satellite Remote Sensing • GIS Analytics • DIP Engine • RAG Decision Support
            </p>
          </div>
        </div>

        {/* Right: Status & Academic Tags */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Globe2 className="w-4 h-4 text-sky-600" />
            <span>WGS84 / EPSG:4326</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-700">10m Sentinel-2 MSI</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1"></span>
            <Activity className="w-3.5 h-3.5" />
            <span>{systemHealth ? 'Engines Online' : 'Connecting...'}</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-sky-800 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Gemini 2.5 Grounded</span>
          </div>
        </div>
      </div>
    </header>
  );
};
