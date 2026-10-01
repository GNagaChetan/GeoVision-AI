import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Satellite,
  SlidersHorizontal,
  PieChart,
  TrendingUp,
  Map,
  BarChart3,
  BookOpen,
  Sparkles,
  FileText,
  Settings as SettingsIcon,
  Globe2,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

interface AppLayoutProps {
  systemHealth: boolean;
}

const NAV_SECTIONS = [
  {
    title: 'Core Workspaces',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Overview' },
      { path: '/satellite', label: 'Satellite Explorer', icon: Satellite, badge: 'Sentinel-2' },
      { path: '/gis', label: 'GIS Map & Buffers', icon: Map, badge: 'Leaflet' },
      { path: '/image-processing', label: 'DIP Algorithm Studio', icon: SlidersHorizontal, badge: '16+ Algos' },
      { path: '/lulc', label: 'LULC Analytics', icon: PieChart, badge: '5 Classes' },
      { path: '/change-detection', label: 'Temporal Change', icon: TrendingUp, badge: 'T1 → T2' },
    ]
  },
  {
    title: 'Intelligence & Decision Support',
    items: [
      { path: '/ask-geovision', label: 'Ask GeoVision AI', icon: Sparkles, badge: 'Gemini 2.5', highlight: true },
      { path: '/knowledge-base', label: 'RAG Knowledge Base', icon: BookOpen, badge: 'Citations' },
      { path: '/analytics', label: 'Geospatial Analytics', icon: BarChart3, badge: 'Recharts' },
      { path: '/reports', label: 'Reports & Exports', icon: FileText, badge: 'Academic' },
      { path: '/settings', label: 'System Settings', icon: SettingsIcon, badge: 'Config' },
    ]
  }
];

export const AppLayout: React.FC<AppLayoutProps> = ({ systemHealth }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Top Navigation Bar */}
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
                  v1.0 Academic Production
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Satellite Remote Sensing • GIS Analytics • DIP Engine • RAG Decision Support
              </p>
            </div>
          </div>

          {/* Right: Telemetry Badges */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Globe2 className="w-4 h-4 text-sky-600" />
              <span>WGS84 / EPSG:4326</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-700">10m Sentinel-2 MSI</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-0.5"></span>
              <Activity className="w-3.5 h-3.5" />
              <span>{systemHealth ? 'All Engines Online' : 'Connecting...'}</span>
            </div>

            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-sky-800 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Gemini Grounded</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar and Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-3 min-h-[calc(100vh-65px)] overflow-y-auto">
          <div className="space-y-5">
            {NAV_SECTIONS.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-1">
                  {sec.title}
                </p>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 flex items-center justify-between group ${
                          isActive
                            ? 'bg-sky-50 text-sky-900 font-semibold border border-sky-200/80 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`
                      }
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            location.pathname === item.path
                              ? 'bg-sky-600 text-white'
                              : item.highlight
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            location.pathname === item.path
                              ? 'bg-sky-200/60 text-sky-800'
                              : item.highlight
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer Info Box */}
          <div className="mt-auto pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  Active Study Scene
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  2,987.4 ha
                </span>
              </div>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Sentinel-2 MSI Multi-spectral Scene (512x512 px • WGS84)
              </p>
            </div>
          </div>
        </aside>

        {/* Dynamic Route Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
