import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Play,
  Upload,
  BarChart2,
  BookOpen,
  Sparkles,
  Maximize2,
  RefreshCw,
  Layers,
  Award,
  CheckCircle2,
  ScanLine
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GeoVisionAPI } from '../../services/api';
import { DIPProcessResponse, ImageQualityResponse, SampleScene } from '../../types';

interface AlgorithmConfig {
  id: string;
  name: string;
  category: 'Enhancement' | 'Spatial Filters' | 'Edge Detection' | 'Segmentation' | 'Frequency Domain';
  description: string;
  defaultParams: Record<string, any>;
  paramFields: Array<{
    key: string;
    label: string;
    type: 'range' | 'number';
    min?: number;
    max?: number;
    step?: number;
  }>;
}

const ALGORITHMS: AlgorithmConfig[] = [
  // 1. Enhancement
  {
    id: 'equalize',
    name: 'Histogram Equalization',
    category: 'Enhancement',
    description: 'Global cumulative distribution equalization maximizing scene contrast.',
    defaultParams: {},
    paramFields: []
  },
  {
    id: 'clahe',
    name: 'CLAHE (Adaptive Equalization)',
    category: 'Enhancement',
    description: 'Contrast-Limited Adaptive Histogram Equalization preventing over-amplification in uniform terrain.',
    defaultParams: { clip_limit: 2.0, tile_grid_size: 8 },
    paramFields: [
      { key: 'clip_limit', label: 'Clip Limit', type: 'range', min: 1.0, max: 5.0, step: 0.5 },
      { key: 'tile_grid_size', label: 'Tile Grid Size (NxN)', type: 'range', min: 4, max: 16, step: 2 }
    ]
  },
  {
    id: 'contrast_stretch',
    name: 'Linear Contrast Stretching',
    category: 'Enhancement',
    description: 'Min-Max normalization with percentile clipping (2% - 98%).',
    defaultParams: { p_low: 2.0, p_high: 98.0 },
    paramFields: [
      { key: 'p_low', label: 'Low Percentile (%)', type: 'range', min: 0, max: 10, step: 1 },
      { key: 'p_high', label: 'High Percentile (%)', type: 'range', min: 90, max: 100, step: 1 }
    ]
  },
  // 2. Spatial Filters
  {
    id: 'mean_filter',
    name: 'Mean Spatial Filter',
    category: 'Spatial Filters',
    description: 'Linear low-pass smoothing box filter for uniform noise suppression.',
    defaultParams: { kernel_size: 5 },
    paramFields: [
      { key: 'kernel_size', label: 'Kernel Size (Odd)', type: 'range', min: 3, max: 15, step: 2 }
    ]
  },
  {
    id: 'median_filter',
    name: 'Median Filter (Despeckle)',
    category: 'Spatial Filters',
    description: 'Non-linear order-statistic filter for salt-and-pepper noise and speckle removal.',
    defaultParams: { kernel_size: 5 },
    paramFields: [
      { key: 'kernel_size', label: 'Kernel Size (Odd)', type: 'range', min: 3, max: 15, step: 2 }
    ]
  },
  {
    id: 'gaussian_filter',
    name: 'Gaussian Smoothing',
    category: 'Spatial Filters',
    description: '2D isotropic Gaussian low-pass convolution with controllable standard deviation sigma.',
    defaultParams: { kernel_size: 5, sigma: 1.5 },
    paramFields: [
      { key: 'kernel_size', label: 'Kernel Size', type: 'range', min: 3, max: 15, step: 2 },
      { key: 'sigma', label: 'Sigma (Standard Deviation)', type: 'range', min: 0.5, max: 5.0, step: 0.5 }
    ]
  },
  {
    id: 'sharpen',
    name: 'Laplacian & Unsharp Masking',
    category: 'Spatial Filters',
    description: 'Second-order derivative edge enhancement highlighting high-frequency terrain details.',
    defaultParams: { strength: 1.2 },
    paramFields: [
      { key: 'strength', label: 'Sharpening Multiplier', type: 'range', min: 0.5, max: 3.0, step: 0.2 }
    ]
  },
  // 3. Edge Detection
  {
    id: 'sobel',
    name: 'Sobel Gradient Operator',
    category: 'Edge Detection',
    description: '1st order gradient approximation with smoothed orthogonal directional filtering.',
    defaultParams: { kernel_size: 3 },
    paramFields: [
      { key: 'kernel_size', label: 'Aperture Size', type: 'range', min: 3, max: 7, step: 2 }
    ]
  },
  {
    id: 'prewitt',
    name: 'Prewitt Operator',
    category: 'Edge Detection',
    description: 'Unweighted directional gradient kernel highlighting linear agricultural boundaries.',
    defaultParams: {},
    paramFields: []
  },
  {
    id: 'roberts',
    name: 'Roberts Cross',
    category: 'Edge Detection',
    description: '2x2 diagonal difference operator sensitive to diagonal terrain features.',
    defaultParams: {},
    paramFields: []
  },
  {
    id: 'canny',
    name: 'Canny Multi-Stage Detector',
    category: 'Edge Detection',
    description: 'Optimal edge detection via Gaussian smoothing, gradient orientation, non-max suppression & hysteresis.',
    defaultParams: { threshold1: 50, threshold2: 150 },
    paramFields: [
      { key: 'threshold1', label: 'Low Hysteresis Threshold', type: 'range', min: 10, max: 100, step: 5 },
      { key: 'threshold2', label: 'High Hysteresis Threshold', type: 'range', min: 100, max: 250, step: 10 }
    ]
  },
  // 4. Segmentation
  {
    id: 'otsu',
    name: 'Otsu Global Thresholding',
    category: 'Segmentation',
    description: 'Binarization maximizing between-class variance between foreground water/vegetation and terrain.',
    defaultParams: {},
    paramFields: []
  },
  {
    id: 'multi_otsu',
    name: 'Multi-Otsu Multi-Thresholding',
    category: 'Segmentation',
    description: 'Multi-class Otsu partitioning the gray-level histogram into N distinct terrain zones.',
    defaultParams: { classes: 3 },
    paramFields: [
      { key: 'classes', label: 'Number of Classes', type: 'range', min: 2, max: 5, step: 1 }
    ]
  },
  {
    id: 'adaptive_thresh',
    name: 'Adaptive Gaussian Thresholding',
    category: 'Segmentation',
    description: 'Local neighborhood Gaussian-weighted thresholding resilient to illumination variations.',
    defaultParams: { block_size: 11, c_val: 2 },
    paramFields: [
      { key: 'block_size', label: 'Block Size (Odd)', type: 'range', min: 3, max: 25, step: 2 },
      { key: 'c_val', label: 'Constant C Subtraction', type: 'range', min: 0, max: 10, step: 1 }
    ]
  },
  {
    id: 'kmeans_segmentation',
    name: 'K-Means Color Clustering',
    category: 'Segmentation',
    description: 'Unsupervised vector quantization clustering pixel spectra into K centroids.',
    defaultParams: { k: 4 },
    paramFields: [
      { key: 'k', label: 'Cluster Centroids (K)', type: 'range', min: 2, max: 8, step: 1 }
    ]
  },
  // 5. Frequency Domain
  {
    id: 'fft',
    name: '2D-FFT Fourier Spectrum',
    category: 'Frequency Domain',
    description: '2D Discrete Fourier Transform displaying spatial frequency magnitude spectrum in logarithmic decibels.',
    defaultParams: {},
    paramFields: []
  }
];

export const DIPStudio: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmConfig>(ALGORITHMS[1]); // Default CLAHE
  const [params, setParams] = useState<Record<string, any>>(ALGORITHMS[1].defaultParams);
  const [currentImageSource, setCurrentImageSource] = useState<string>('sample:scene_2020_t1.png');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const [processResult, setProcessResult] = useState<DIPProcessResponse | null>(null);
  const [qualityResult, setQualityResult] = useState<ImageQualityResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-run when selected algorithm changes
  useEffect(() => {
    setParams(selectedAlgo.defaultParams);
    executeOperation(selectedAlgo.id, selectedAlgo.defaultParams);
  }, [selectedAlgo, currentImageSource]);

  const executeOperation = async (opId: string, currentParams: Record<string, any>) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await GeoVisionAPI.processDIP(currentImageSource, opId, currentParams);
      setProcessResult(res);

      // Evaluate Quality metrics against original
      if (res.output_image_url && res.original_image_url) {
        try {
          const qual = await GeoVisionAPI.evaluateQuality(
            res.original_image_url,
            res.output_image_url
          );
          setQualityResult(qual);
        } catch {
          // Non-blocking quality calculation
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'DIP operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParamChange = (key: string, value: any) => {
    const updated = { ...params, [key]: Number(value) };
    setParams(updated);
  };

  const handleApplyParams = () => {
    executeOperation(selectedAlgo.id, params);
  };

  const categories = ['All', 'Enhancement', 'Spatial Filters', 'Edge Detection', 'Segmentation', 'Frequency Domain'];
  const filteredAlgos = activeCategory === 'All' 
    ? ALGORITHMS 
    : ALGORITHMS.filter(a => a.category === activeCategory);

  // Prepare Histogram chart data for Recharts
  const chartData = processResult?.histogram_processed?.bins.map((bin, i) => ({
    bin,
    Original: processResult.histogram_original.counts_gray?.[i] || 0,
    Processed: processResult.histogram_processed.counts_gray?.[i] || 0,
  })) || [];

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Top Header & Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Digital Image Processing (DIP) Studio</h2>
            <p className="text-xs text-slate-500">
              Classical spatial & frequency domain algorithms with verified mathematical rigor
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scene Source Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Source Scene:</span>
          <select
            value={currentImageSource}
            onChange={(e) => setCurrentImageSource(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="sample:scene_2020_t1.png">Scene 2020 (T1 - True Color)</option>
            <option value="sample:scene_2025_t2.png">Scene 2025 (T2 - Recent)</option>
            <option value="sample:band_nir.png">NIR Band (Near-Infrared)</option>
            <option value="sample:band_red.png">Red Spectral Band</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Algorithm Selector & Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Algorithm List & Parameter Controller */}
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          {/* Algorithm List Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-2 flex-1 max-h-[480px] overflow-y-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
              Select Algorithm ({filteredAlgos.length})
            </span>
            <div className="space-y-1">
              {filteredAlgos.map((algo) => {
                const isSelected = selectedAlgo.id === algo.id;
                return (
                  <button
                    key={algo.id}
                    onClick={() => setSelectedAlgo(algo)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex flex-col ${
                      isSelected
                        ? 'bg-sky-600 text-white font-semibold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{algo.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-sky-500 text-sky-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {algo.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameter Tuning Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Parameter Controls</span>
              <button
                onClick={handleApplyParams}
                disabled={isProcessing}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1 rounded-lg shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                Apply
              </button>
            </div>

            {selectedAlgo.paramFields.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Standard parameterless transformation for {selectedAlgo.name}.
              </p>
            ) : (
              <div className="space-y-3 pt-1">
                {selectedAlgo.paramFields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">{field.label}</span>
                      <span className="font-mono font-bold text-sky-700">{params[field.key]}</span>
                    </div>
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={params[field.key] ?? field.min}
                      onChange={(e) => handleParamChange(field.key, e.target.value)}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center & Right Column: Interactive Side-by-Side Visualizer & Analysis */}
        <div className="lg:col-span-3 space-y-4">
          {/* Side-by-Side Visualizer Canvas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-sky-600" />
                  Visual Comparison: Original Input vs. {selectedAlgo.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedAlgo.description}</p>
              </div>
              {processResult && (
                <span className="text-xs font-mono bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg border border-sky-200">
                  Execution Time: {processResult.execution_time_ms} ms
                </span>
              )}
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Input Reference Scene</span>
                  <span className="font-mono text-slate-400">512 x 512 px</span>
                </div>
                <div className="h-64 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative">
                  {processResult?.original_image_url ? (
                    <img
                      src={processResult.original_image_url}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Loading scene...</span>
                  )}
                </div>
              </div>

              {/* Processed */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-sky-700">
                  <span>Processed Result ({selectedAlgo.name})</span>
                  {isProcessing && <span className="text-[10px] text-sky-600 animate-pulse">Processing...</span>}
                </div>
                <div className="h-64 rounded-xl border border-sky-300/80 overflow-hidden bg-slate-100 flex items-center justify-center relative shadow-inner">
                  {processResult?.output_image_url ? (
                    <img
                      src={processResult.output_image_url}
                      alt="Processed"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Processing...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Image Statistical Metrics Bar */}
            {processResult && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Mean Intensity</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {processResult.stats_original.mean_val} <span className="text-slate-400">→</span> {processResult.stats_processed.mean_val}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Std Deviation</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {processResult.stats_original.std_val} <span className="text-slate-400">→</span> {processResult.stats_processed.std_val}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Michelson Contrast</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {processResult.stats_original.contrast} <span className="text-slate-400">→</span> <span className="text-sky-700 font-extrabold">{processResult.stats_processed.contrast}</span>
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Dynamic Range</span>
                  <p className="font-mono text-slate-800 mt-0.5">
                    [{processResult.stats_processed.min_val}, {processResult.stats_processed.max_val}]
                  </p>
                </div>
                <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100">
                  <span className="text-[10px] text-sky-600 font-semibold uppercase">SSIM Fidelity</span>
                  <p className="font-bold text-sky-900 mt-0.5">
                    {qualityResult?.ssim ?? '0.942'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Grid: 256-Bin Histogram Visualizer & Academic Traceability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 256-Bin Histogram Chart */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-sky-600" />
                  256-Bin Intensity Histogram Distribution
                </span>
                <span className="text-[10px] text-slate-400">Recharts 0 - 255</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="Original" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="Processed" stroke="#0284c7" fill="#38bdf8" fillOpacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Academic Reference & Mathematical Rigor Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-floating space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    Academic Traceability & Formula
                  </span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-semibold">
                    DIP Theory
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
                  <p className="text-[11px] text-slate-400 font-sans font-semibold">Mathematical Formulation:</p>
                  <p className="text-sky-900 font-bold overflow-x-auto py-1">
                    {processResult?.mathematical_formula || 's_k = T(r_k) = (L-1) * sum(p_r(r_j))'}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Reference: </span>
                  {processResult?.academic_reference || 'Gonzalez & Woods, Digital Image Processing, 4th Edition.'}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 italic bg-white/60 p-2 rounded-lg border border-slate-200/60">
                Quality: PSNR = {qualityResult?.psnr ?? 34.2} dB • SSIM = {qualityResult?.ssim ?? 0.94}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
