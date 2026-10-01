import React from 'react';
import {
  Map,
  SlidersHorizontal,
  PieChart,
  BookOpen,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export type NavTab = 'gis' | 'dip' | 'lulc' | 'rag' | 'assistant';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    {
      id: 'gis' as NavTab,
      label: 'GIS Map & Remote Sensing',
      sublabel: 'Satellite Layers, NDVI, Geodesic Buffers',
      icon: Map,
      badge: 'Interactive'
    },
    {
      id: 'dip' as NavTab,
      label: 'DIP Algorithm Studio',
      sublabel: 'Filters, CLAHE, Canny, FFT, PSNR/SSIM',
      icon: SlidersHorizontal,
      badge: '16+ Algos'
    },
    {
      id: 'lulc' as NavTab,
      label: 'LULC & Temporal Analytics',
      sublabel: '5-Class Matrix, Change Detection, Charts',
      icon: PieChart,
      badge: 'T1 vs T2'
    },
    {
      id: 'rag' as NavTab,
      label: 'RAG Knowledge Base',
      sublabel: 'Vector Retrieval, Citations, Docs',
      icon: BookOpen,
      badge: 'Semantic'
    },
    {
      id: 'assistant' as NavTab,
      label: 'Ask GeoVision Assistant',
      sublabel: 'Grounded AI Decision Support',
      icon: Sparkles,
      badge: 'Gemini AI',
      highlight: true
    },
  ];

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-4 min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Platform Modules
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 flex items-start space-x-3.5 group relative ${
                  isActive
                    ? 'bg-sky-50 text-sky-900 shadow-sm border border-sky-200/80 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div
                  className={`mt-0.5 p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : item.highlight
                      ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-200'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium leading-tight truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-sky-200/60 text-sky-800'
                            : item.highlight
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-normal mt-0.5 truncate">
                    {item.sublabel}
                  </p>
                </div>
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-600 rounded-l-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              Dataset In Memory
            </span>
            <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">Active</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Sentinel-2 MSI Study Area (512x512 px • 10m Ground Sample Dist • EPSG:4326)
          </p>
        </div>
      </div>
    </aside>
  );
};
