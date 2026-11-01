import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Map,
  SlidersHorizontal,
  PieChart,
  BookOpen,
  Sparkles,
  FileText,
  Upload,
  FolderKanban,
  Layers,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Workspace' | 'Algorithm' | 'Layer' | 'Action';
  path?: string;
  action?: () => void;
  icon: React.ElementType;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjects: () => void;
  onOpenUpload: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenProjects,
  onOpenUpload
}) => {
  const [search, setSearch] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items: CommandItem[] = [
    // Workspaces
    { id: 'ws_gis', title: 'Interactive GIS Map & Buffers', category: 'Workspace', path: '/gis', icon: Map, shortcut: 'G' },
    { id: 'ws_dip', title: 'DIP Algorithm Studio (16+ Operators)', category: 'Workspace', path: '/image-processing', icon: SlidersHorizontal, shortcut: 'D' },
    { id: 'ws_lulc', title: 'LULC & 5x5 Transition Matrix', category: 'Workspace', path: '/lulc', icon: PieChart, shortcut: 'L' },
    { id: 'ws_assistant', title: 'Ask GeoVision AI Decision Support', category: 'Workspace', path: '/ask-geovision', icon: Sparkles, shortcut: 'A' },
    { id: 'ws_rag', title: 'RAG Academic Knowledge Base', category: 'Workspace', path: '/knowledge-base', icon: BookOpen, shortcut: 'K' },
    { id: 'ws_change', title: 'Multi-Date Change Detection (T1 → T2)', category: 'Workspace', path: '/change-detection', icon: TrendingUp },
    { id: 'ws_reports', title: 'Executive Geospatial Analytical Report', category: 'Workspace', path: '/reports', icon: FileText, shortcut: 'R' },

    // Actions
    { id: 'act_project', title: 'Switch Study Area / Project', category: 'Action', action: onOpenProjects, icon: FolderKanban, shortcut: 'P' },
    { id: 'act_upload', title: 'Upload GeoTIFF / GeoJSON Dataset', category: 'Action', action: onOpenUpload, icon: Upload, shortcut: 'U' },

    // Specific Algorithms & Layers
    { id: 'algo_clahe', title: 'CLAHE (Adaptive Histogram Equalization)', category: 'Algorithm', path: '/image-processing', icon: SlidersHorizontal },
    { id: 'algo_canny', title: 'Canny Multi-Stage Edge Detector', category: 'Algorithm', path: '/image-processing', icon: SlidersHorizontal },
    { id: 'algo_fft', title: '2D-FFT Fourier Frequency Spectrum', category: 'Algorithm', path: '/image-processing', icon: SlidersHorizontal },
    { id: 'layer_ndvi', title: 'NDVI Vegetation Health Index', category: 'Layer', path: '/gis', icon: Layers },
    { id: 'layer_fcc', title: 'False Color Composite (Standard FCC)', category: 'Layer', path: '/satellite', icon: Layers },
  ];

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item: CommandItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search workspaces, algorithms, layers, or spatial actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-bold bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-md">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching tools or workspaces found for "{search}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between transition-colors text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-sky-600 transition-colors block">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.shortcut && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {item.shortcut}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-mono">GeoVision Quick Command v1.0</span>
        </div>
      </div>
    </div>
  );
};
