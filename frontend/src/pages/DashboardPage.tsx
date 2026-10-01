import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Satellite,
  Map,
  SlidersHorizontal,
  PieChart,
  TrendingUp,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Trees,
  Waves,
  Building,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const kpiStats = [
    { label: 'Total Study Area', value: '2,987.4 ha', subvalue: '29.87 km²', color: 'text-sky-900', bg: 'bg-sky-50', border: 'border-sky-200' },
    { label: 'Ground Sample Dist', value: '10 meters', subvalue: 'Sentinel-2 MSI', color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'DIP Operators Ready', value: '16 Algorithms', subvalue: 'Spatial & Frequency', color: 'text-indigo-900', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { label: 'LULC Classes', value: '5 Core Classes', subvalue: '99.8% Classified', color: 'text-emerald-900', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ];

  const quickLinks = [
    { title: 'Interactive GIS Map', desc: 'Inspect raster layers, study area boundary & geodesic buffer zones.', path: '/gis', icon: Map, color: 'text-sky-600', bg: 'bg-sky-50' },
    { title: 'DIP Algorithm Studio', desc: '16+ image processing filters, CLAHE, Canny, 2D-FFT, and PSNR/SSIM.', path: '/image-processing', icon: SlidersHorizontal, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'LULC & Change Detection', desc: '5-Class distribution charts and 5x5 multi-temporal transition matrix.', path: '/lulc', icon: PieChart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Ask GeoVision AI', desc: 'Multi-modal decision assistant grounded in project analytics & RAG literature.', path: '/ask-geovision', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50', highlight: true },
    { title: 'RAG Knowledge Base', desc: 'Search indexed remote sensing textbooks, DIP theory, and GIS standards.', path: '/knowledge-base', icon: BookOpen, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Executive Reports', desc: 'Generate verified summary reports and export GeoJSON spatial layers.', path: '/reports', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Executive Hero Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 text-white rounded-3xl p-8 shadow-elevated relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-sky-500/20 text-sky-200 text-xs font-semibold px-3 py-1 rounded-full border border-sky-400/30 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Academic Production-Grade Geospatial Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Satellite Image Processing & Geospatial Decision Support
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Unifying Digital Image Processing, Multispectral Remote Sensing, PostGIS Spatial Analytics, LULC Temporal Transition Matrices, and RAG Knowledge Synthesis.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <NavLink
              to="/gis"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Map className="w-4 h-4" />
              Open GIS Map Explorer
            </NavLink>
            <NavLink
              to="/ask-geovision"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Ask GeoVision Assistant
            </NavLink>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-2xl p-5 border ${stat.border} shadow-floating space-y-1`}
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </span>
            <p className={`text-2xl font-extrabold ${stat.color} tracking-tight`}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 font-medium">{stat.subvalue}</p>
          </div>
        ))}
      </div>

      {/* Workspaces Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            Specialized Workspaces
          </h3>
          <span className="text-xs text-slate-500">6 Core Geospatial Domains</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={idx}
                to={link.path}
                className="bg-white hover:bg-slate-50/80 rounded-2xl p-5 border border-slate-200 shadow-floating transition-all duration-200 flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${link.bg} ${link.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {link.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {link.desc}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center text-[11px] font-semibold text-sky-700">
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Active Scene & Sensor Telemetry Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-sky-600" />
            Verified Pipeline Status & Integrity
          </span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
            Zero-Hallucination Safe Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800">Satellite Sensor Telemetry</span>
            <p className="text-slate-600">Sentinel-2 MSI (10m Band 2, 3, 4, 8; 20m Band 11 SWIR)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800">Geodetic Spatial Reference</span>
            <p className="text-slate-600">WGS84 Ellipsoid (EPSG:4326) with dynamic local UTM projection</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800">Unified Persistence</span>
            <p className="text-slate-600">PostgreSQL 16 + PostGIS 3.4 + pgvector vector embeddings</p>
          </div>
        </div>
      </div>
    </div>
  );
};
