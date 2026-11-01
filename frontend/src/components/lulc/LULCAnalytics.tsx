import React, { useState, useEffect } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Table,
  TreePine,
  Waves,
  Building,
  Wheat,
  Mountain,
  Download,
  FileSpreadsheet,
  FileJson,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { GeoVisionAPI } from '../../services/api';
import {
  LULCClassificationResponse,
  ChangeDetectionResponse,
  LULCClassMetric,
  LULCValidationResponse
} from '../../types';

export const LULCAnalytics: React.FC = () => {
  const [activeSceneId, setActiveSceneId] = useState<string>('scene_2020');
  const [customRasterPath, setCustomRasterPath] = useState<string>('');
  const [lulcData, setLulcData] = useState<LULCClassificationResponse | null>(null);
  const [temporalData, setTemporalData] = useState<ChangeDetectionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'distribution' | 'temporal' | 'table'>('distribution');
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');
  const [validationResult, setValidationResult] = useState<LULCValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  useEffect(() => {
    loadLULCData();
  }, [activeSceneId]);

  const loadLULCData = async (overrideRaster?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const targetPath = overrideRaster || (activeSceneId === 'custom' ? customRasterPath : undefined);
      const singleRes = await GeoVisionAPI.classifyScene(
        activeSceneId === 'custom' ? 'custom' : activeSceneId,
        10.0,
        targetPath
      );
      setLulcData(singleRes);

      const tempRes = await GeoVisionAPI.analyzeTemporalChange(10.0);
      setTemporalData(tempRes);
    } catch (err: any) {
      console.error('LULC loading error:', err);
      setErrorMsg(err?.response?.data?.detail || 'Failed to load LULC classification data.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateRaster = async () => {
    if (!customRasterPath.trim()) return;
    setIsValidating(true);
    try {
      const res = await GeoVisionAPI.validateLULC(customRasterPath);
      setValidationResult(res);
      if (res.is_valid) {
        loadLULCData(customRasterPath);
      }
    } catch (err: any) {
      setValidationResult({
        is_valid: false,
        unique_classes: [],
        width: 0,
        height: 0,
        total_pixels: 0,
        message: err?.response?.data?.detail || 'Validation failed: Image could not be decoded.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleExportCSV = () => {
    window.open(GeoVisionAPI.exportLULCCSV(activeSceneId, 10.0), '_blank');
  };

  const handleExportJSON = () => {
    if (!lulcData) return;
    const blob = new Blob([JSON.stringify(lulcData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lulc_statistics_${activeSceneId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper icon for LULC classes
  const getClassIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'vegetation': return TreePine;
      case 'water': return Waves;
      case 'built-up': return Building;
      case 'agriculture': return Wheat;
      default: return Mountain;
    }
  };

  // Prepare chart data
  const pieData = lulcData?.classes.map(c => ({
    name: c.class_name,
    value: c.area_hectares,
    percentage: c.percentage,
    color: c.color_hex
  })) || [];

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Top Controls & Scene Switcher */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Land Use & Land Cover (LULC) Analysis
              </h2>
              {lulcData?.is_demo_data && (
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                  Demo Dataset (Sentinel-2 10m)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              5-Class Spectral Segmentation, Exact Area Calculation ($ha$, $km^2$) & Multi-Temporal Transitions
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'distribution'
                ? 'bg-white text-sky-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scene Classification
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-white text-sky-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-slate-600" />
            Class Statistics Table
          </button>
          <button
            onClick={() => setActiveTab('temporal')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'temporal'
                ? 'bg-white text-sky-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
            Temporal Transition (T1 → T2)
          </button>
        </div>

        {/* Scene Selector & Export Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'distribution' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Scene:</span>
              <select
                value={activeSceneId}
                onChange={(e) => setActiveSceneId(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="scene_2020">2020 Scene (T1 Baseline)</option>
                <option value="scene_2025">2025 Scene (T2 Recent)</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
              title="Download CSV Statistics"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              CSV Export
            </button>
            <button
              onClick={handleExportJSON}
              className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
              title="Download JSON Summary"
            >
              <FileJson className="w-3.5 h-3.5 text-sky-600" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs font-medium">{errorMsg}</p>
          </div>
          <button
            onClick={() => loadLULCData()}
            className="text-xs font-bold underline hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !errorMsg ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-floating flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-sm font-bold text-slate-700">Computing 5-Class LULC Pixel Metrics...</p>
          <p className="text-xs text-slate-400">Executing spectral decision-tree segmentation and area integration.</p>
        </div>
      ) : activeTab === 'distribution' ? (
        <div className="space-y-4">
          {/* Top Summary Banner: Dominant Class & Total Study Area */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-floating flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Dataset: {lulcData?.dataset_name}
                </p>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-2xl font-black text-white">
                    {lulcData?.total_area_hectares.toLocaleString()} <span className="text-sm font-normal text-slate-300">ha</span>
                  </h3>
                  <span className="text-sm font-mono text-slate-300">
                    ({lulcData?.total_area_sq_km.toLocaleString()} km²)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Dominant Class</p>
                <p className="text-base font-extrabold text-emerald-400">
                  {lulcData?.dominant_class}
                </p>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Spatial Grid</p>
                <p className="text-xs font-mono font-semibold text-slate-200">10m GSD • 5 Classes</p>
              </div>
            </div>
          </div>

          {/* 5 Class Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {lulcData?.classes.map((cls) => {
              const Icon = getClassIcon(cls.class_name);
              return (
                <div
                  key={cls.class_id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-2 relative overflow-hidden transition-all hover:border-slate-300"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: cls.color_hex }}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: `${cls.color_hex}15`, color: cls.color_hex }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{cls.class_name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {cls.percentage}%
                    </span>
                  </div>

                  <div className="pt-1">
                    <p className="text-xl font-extrabold text-slate-900">
                      {cls.area_hectares} <span className="text-xs font-normal text-slate-500">ha</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {cls.area_sq_km} km² • {cls.pixel_count.toLocaleString()} px
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Classification Map Visualizer & Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LULC 5-Class Map Image */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  LULC 5-Class Classification Map
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  10m Resolution
                </span>
              </div>

              <div className="h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative group">
                {lulcData?.classification_map_url ? (
                  <>
                    <img
                      src={lulcData.classification_map_url}
                      alt="LULC Map"
                      className="w-full h-full object-cover"
                    />
                    <a
                      href={lulcData.classification_map_url}
                      download={`lulc_map_${activeSceneId}.png`}
                      className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Save Map
                    </a>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">Classifying scene...</span>
                )}
              </div>

              {/* Legend Bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-700">Class Legend & Spectral Encoding</p>
                <div className="grid grid-cols-5 gap-1 text-[10px] font-semibold text-center text-slate-700">
                  {lulcData?.classes.map(c => (
                    <div key={c.class_id} className="flex flex-col items-center gap-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color_hex }} />
                      <span className="truncate">{c.class_name}</span>
                      <span className="text-[9px] text-slate-400">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution Recharts Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-sky-600" />
                  Class Area Distribution ({chartType === 'bar' ? 'Hectares' : 'Percentage'})
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        chartType === 'bar' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Bar
                    </button>
                    <button
                      onClick={() => setChartType('donut')}
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        chartType === 'donut' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Donut
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={pieData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any) => [`${val} ha`, 'Area']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val} ha`, 'Area']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                      />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>Method: {lulcData?.method_used}</span>
                <span className="font-semibold text-slate-700">Total: {lulcData?.total_area_hectares} ha</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'table' ? (
        /* Class Statistics Table View */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-floating space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-sky-600" />
                LULC Class Area & Pixel Statistics Breakdown
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact pixel count, surface area in hectares ($ha$) and square kilometers ($km^2$), and overall distribution percentage.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV Table
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="p-3">Class ID</th>
                  <th className="p-3">Color Swatch</th>
                  <th className="p-3">Class Name</th>
                  <th className="p-3 text-right">Pixel Count (px)</th>
                  <th className="p-3 text-right">Area (Hectares)</th>
                  <th className="p-3 text-right">Area (Sq Km)</th>
                  <th className="p-3 text-right">Percentage (%)</th>
                  <th className="p-3">Standard Academic Definition</th>
                </tr>
              </thead>
              <tbody>
                {lulcData?.classes.map((cls) => {
                  const legendInfo = lulcData.legend.find(l => l.class_id === cls.class_id);
                  return (
                    <tr key={cls.class_id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-500">{cls.class_id}</td>
                      <td className="p-3">
                        <span
                          className="inline-block w-4 h-4 rounded-md border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: cls.color_hex }}
                        />
                      </td>
                      <td className="p-3 font-bold text-slate-900">{cls.class_name}</td>
                      <td className="p-3 text-right font-mono text-slate-700">{cls.pixel_count.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{cls.area_hectares.toFixed(2)} ha</td>
                      <td className="p-3 text-right font-mono text-slate-700">{cls.area_sq_km.toFixed(3)} km²</td>
                      <td className="p-3 text-right font-bold text-sky-700">{cls.percentage}%</td>
                      <td className="p-3 text-slate-500 text-[11px]">{legendInfo?.description || 'Standard land cover category'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={3} className="p-3">Total Study Area Sum</td>
                  <td className="p-3 text-right font-mono">
                    {lulcData?.classes.reduce((acc, c) => acc + c.pixel_count, 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700">
                    {lulcData?.total_area_hectares} ha
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700">
                    {lulcData?.total_area_sq_km} km²
                  </td>
                  <td className="p-3 text-right font-bold text-sky-800">100.0%</td>
                  <td className="p-3 text-[11px] text-slate-400">Strict area sum conservation</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Multi-Temporal Change & Transition Matrix View */
        <div className="space-y-4">
          {/* Net Change Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {temporalData?.class_changes.map((ch) => {
              const isPositive = ch.change_ha >= 0;
              return (
                <div
                  key={ch.class_id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-1"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>{ch.class_name}</span>
                    <span
                      className={`flex items-center text-[11px] font-extrabold px-1.5 py-0.5 rounded ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {ch.change_pct > 0 ? `+${ch.change_pct}` : ch.change_pct}%
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {ch.t1_ha} <span className="text-slate-400 font-normal">→</span> {ch.t2_ha} ha
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Net: <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                      {ch.change_ha > 0 ? `+${ch.change_ha}` : ch.change_ha} ha
                    </span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Temporal Transition Matrix Table & Spatial Difference Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* NxN Transition Matrix Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Table className="w-4 h-4 text-sky-600" />
                    5x5 Multi-Temporal Transition Matrix (Hectares)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Row: Baseline 2020 (T1) → Column: Transition to 2025 (T2)
                  </p>
                </div>
                <span className="text-xs font-semibold bg-sky-50 text-sky-800 px-2.5 py-1 rounded-lg border border-sky-200">
                  Diagonal = Persistence
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="p-2.5 font-bold">2020 \ 2025</th>
                      {temporalData?.transition_labels.map((lbl, idx) => (
                        <th key={idx} className="p-2.5 font-semibold text-slate-800">
                          {lbl}
                        </th>
                      ))}
                      <th className="p-2.5 font-bold text-slate-900 bg-slate-100">T1 Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {temporalData?.transition_matrix.map((row, rIdx) => {
                      const rowTotal = row.reduce((acc, v) => acc + v, 0);
                      const rLabel = temporalData.transition_labels[rIdx];
                      return (
                        <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-800 bg-slate-50/80">
                            {rLabel}
                          </td>
                          {row.map((val, cIdx) => {
                            const isDiagonal = rIdx === cIdx;
                            return (
                              <td
                                key={cIdx}
                                className={`p-2.5 font-mono ${
                                  isDiagonal
                                    ? 'bg-sky-50/80 font-bold text-sky-900'
                                    : val > 5
                                    ? 'text-rose-700 font-semibold'
                                    : 'text-slate-600'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                          <td className="p-2.5 font-bold text-slate-900 bg-slate-50/80 font-mono">
                            {rowTotal.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border">
                💡 <span className="font-semibold text-slate-700">Interpretation: </span>
                Noticeable transition of bare land and peripheral croplands into Built-up urban infrastructure between 2020 and 2025.
              </p>
            </div>

            {/* Spatial Change Difference Map */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  Spatial Change Difference Map
                </h3>
                <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-semibold border border-rose-200">
                  T1 vs T2 Diff
                </span>
              </div>

              <div className="h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                {temporalData?.difference_map_url ? (
                  <img
                    src={temporalData.difference_map_url}
                    alt="Change Map"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Computing differences...</span>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border">
                <p className="font-bold text-slate-800">Change Map Color Encoding:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    Built-up Expansion
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Vegetation Gain
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Vegetation Reduction
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    Unchanged Persistent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
