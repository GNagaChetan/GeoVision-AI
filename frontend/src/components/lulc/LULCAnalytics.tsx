import React, { useState, useEffect } from 'react';
import {
  PieChart as PieChartIcon,
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
  Mountain
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
  LULCTemporalComparisonResponse,
  LULCClassMetric
} from '../../types';

export const LULCAnalytics: React.FC = () => {
  const [activeSceneId, setActiveSceneId] = useState<string>('scene_2020');
  const [lulcData, setLulcData] = useState<LULCClassificationResponse | null>(null);
  const [temporalData, setTemporalData] = useState<LULCTemporalComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'distribution' | 'temporal'>('distribution');

  useEffect(() => {
    loadLULCData();
  }, [activeSceneId]);

  const loadLULCData = async () => {
    setLoading(true);
    try {
      const singleRes = await GeoVisionAPI.classifyScene(activeSceneId, 10.0);
      setLulcData(singleRes);

      const tempRes = await GeoVisionAPI.analyzeTemporalChange(10.0);
      setTemporalData(tempRes);
    } catch (err) {
      console.error('LULC loading error:', err);
    } finally {
      setLoading(false);
    }
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
    color: c.color_hex
  })) || [];

  const changeChartData = temporalData?.class_changes.map(c => ({
    name: c.class_name,
    T1_2020: c.t1_ha,
    T2_2025: c.t2_ha,
    Net_Change: c.change_ha,
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
            <h2 className="text-base font-bold text-slate-900">
              Land Use & Land Cover (LULC) Analytics
            </h2>
            <p className="text-xs text-slate-500">
              5-Class Spectral Segmentation and Multi-Temporal Transition Matrix (2020 - 2025)
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

        {/* Scene Selector */}
        {activeTab === 'distribution' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Active Scene:</span>
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
      </div>

      {/* Main Content Area */}
      {activeTab === 'distribution' ? (
        <div className="space-y-4">
          {/* 5 Class Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {lulcData?.classes.map((cls) => {
              const Icon = getClassIcon(cls.class_name);
              return (
                <div
                  key={cls.class_id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-2 relative overflow-hidden"
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
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  LULC 5-Class Classification Map
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  10m Resolution
                </span>
              </div>

              <div className="h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                {lulcData?.classification_map_url ? (
                  <img
                    src={lulcData.classification_map_url}
                    alt="LULC Map"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Classifying scene...</span>
                )}
              </div>

              {/* Legend Bar */}
              <div className="grid grid-cols-5 gap-1 pt-1 text-[11px] font-semibold text-center text-slate-700">
                {lulcData?.classes.map(c => (
                  <div key={c.class_id} className="flex items-center justify-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color_hex }} />
                    <span className="truncate">{c.class_name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution Recharts Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-sky-600" />
                  Class Area Distribution (Hectares)
                </h3>
                <span className="text-xs font-bold text-slate-700">
                  Total Area: {lulcData?.total_area_hectares} ha
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
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
                </ResponsiveContainer>
              </div>
            </div>
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
                {temporalData?.change_map_url ? (
                  <img
                    src={temporalData.change_map_url}
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
