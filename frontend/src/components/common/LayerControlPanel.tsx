import React from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Sliders,
  Palette,
  GripVertical,
  ChevronDown,
  Info
} from 'lucide-react';

export interface MapLayerConfig {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'index';
  visible: boolean;
  opacity: number;
  colormap?: string;
  resolution?: string;
  legend?: {
    min: string;
    max: string;
    gradient: string;
  };
}

interface LayerControlPanelProps {
  layers: MapLayerConfig[];
  onToggleVisibility: (layerId: string) => void;
  onChangeOpacity: (layerId: string, opacity: number) => void;
  onChangeColormap?: (layerId: string, colormap: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  onToggleVisibility,
  onChangeOpacity,
  onChangeColormap,
  isOpen,
  onToggleOpen
}) => {
  const COLORMAPS = ['Viridis', 'Magma', 'Spectral', 'Plasma', 'Turbo', 'Grayscale'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated overflow-hidden transition-all duration-200 w-80">
      {/* Header */}
      <div
        onClick={onToggleOpen}
        className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900">
            Active Layer Stack ({layers.filter(l => l.visible).length}/{layers.length})
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Layer List */}
      {isOpen && (
        <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`p-3 rounded-xl border transition-all space-y-2 ${
                layer.visible
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200/50 opacity-60'
              }`}
            >
              {/* Layer Title & Visibility */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab" />
                  <span className="text-xs font-bold text-slate-800">{layer.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {layer.resolution && (
                    <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {layer.resolution}
                    </span>
                  )}
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    className={`p-1 rounded-lg transition-colors ${
                      layer.visible
                        ? 'text-sky-600 hover:bg-sky-50'
                        : 'text-slate-400 hover:bg-slate-200'
                    }`}
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                  >
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Opacity Slider */}
              {layer.visible && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-slate-400" />
                      Opacity
                    </span>
                    <span className="font-mono">{Math.round(layer.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layer.opacity}
                    onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                </div>
              )}

              {/* Optional Colormap Selector */}
              {layer.visible && layer.colormap && onChangeColormap && (
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-400" />
                    Colormap
                  </span>
                  <select
                    value={layer.colormap}
                    onChange={(e) => onChangeColormap(layer.id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-700 focus:ring-1 focus:ring-sky-500"
                  >
                    {COLORMAPS.map((cm) => (
                      <option key={cm} value={cm}>{cm}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Optional Legend Bar */}
              {layer.visible && layer.legend && (
                <div className="pt-1 text-[10px] space-y-0.5">
                  <div
                    className="h-2 rounded-full w-full"
                    style={{ background: layer.legend.gradient }}
                  />
                  <div className="flex justify-between text-slate-400 font-mono">
                    <span>{layer.legend.min}</span>
                    <span>{layer.legend.max}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
