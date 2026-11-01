import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Layers,
  MapPin,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileJson,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  TreePine,
  Waves,
  Building,
  Wheat,
  Mountain,
  Table,
  Sparkles,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import { GeoVisionAPI } from '../services/api';
import { AnalyticsDashboardResponse, AnalyticsKPICard } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTableTab, setActiveTableTab] = useState<'distribution' | 'temporal'>('distribution');
  const [chartMode, setChartMode] = useState<'donut' | 'bar'>('donut');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await GeoVisionAPI.getAnalyticsDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Analytics loading error:', err);
      setErrorMsg(err?.response?.data?.detail || 'Failed to fetch analytics dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geospatial_analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClassIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'vegetation': return TreePine;
      case 'water': return Waves;
      case 'built-up': return Building;
      case 'agriculture': return Wheat;
      default: return Mountain;
    }
  };

  const lulcPieData = data?.lulc_distribution.map(c => ({
    name: c.class_name,
    value: c.area_hectares,
    percentage: c.percentage,
    color: c.color_hex
  })) || [];

  const yearCompData = data?.year_comparison || [];
  const netChangesData = data?.temporal_net_changes || [];

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl border border-sky-100 shadow-2xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Geospatial Data Analytics & Statistical Engine</h2>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full border border-sky-200">
                Phase 8
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Aggregated PostGIS spatial vector summaries, 5-class LULC dynamics, temporal delta metrics & NDVI spectral moments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </button>
          <button
            onClick={handleExportJSON}
            disabled={!data}
            className="text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-3.5 py-2 rounded-xl border border-sky-200 flex items-center gap-1.5 transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs font-medium">{errorMsg}</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="text-xs font-bold underline hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !errorMsg ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200 shadow-floating flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
          <p className="text-sm font-bold text-slate-700">Computing Geospatial Analytics & Trends...</p>
          <p className="text-xs text-slate-400">Aggregating PostGIS vectors, multi-date scenes and spectral moments via Pandas & NumPy.</p>
        </div>
      ) : data?.is_empty_state ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-16 border border-slate-200 shadow-floating text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Active Study Area or Project Data Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Analytics require at least one verified study area polygon or multi-spectral scene layer.
            </p>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Load Reference Sample Data
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {data?.kpi_cards.map((kpi, idx) => {
              const isUp = kpi.trend === 'up';
              const isDown = kpi.trend === 'down';

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-2 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {kpi.title}
                    </span>
                    {kpi.change_pct !== undefined && kpi.change_pct !== null && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center ${
                          isUp
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isDown
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : isDown ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
                        {kpi.change_pct > 0 ? `+${kpi.change_pct}` : kpi.change_pct}%
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{kpi.unit}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{kpi.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart 1: LULC Distribution (Donut / Bar switchable) */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <PieIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">LULC Area Distribution</h3>
                    <p className="text-[11px] text-slate-400">5-Class Proportion of Total Study Area</p>
                  </div>
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setChartMode('donut')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      chartMode === 'donut' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Donut
                  </button>
                  <button
                    onClick={() => setChartMode('bar')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      chartMode === 'bar' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'donut' ? (
                    <PieChart>
                      <Pie
                        data={lulcPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                      >
                        {lulcPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val} ha`, 'Area']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={lulcPieData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(val: any) => [`${val} ha`, 'Area']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {lulcPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-100 text-center text-[10px] font-semibold text-slate-600">
                {data?.lulc_distribution.map((c) => (
                  <div key={c.class_id} className="flex flex-col items-center gap-0.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color_hex }} />
                    <span className="truncate max-w-full">{c.class_name}</span>
                    <span className="font-mono text-slate-400">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Multi-Year Temporal Aggregation */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Multi-Year Class Comparison</h3>
                    <p className="text-[11px] text-slate-400">Baseline (2020) vs Recent (2025) in Hectares</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded font-bold">
                  Hectares ($ha$)
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearCompData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Vegetation" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Water" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Built-up" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Agriculture" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Bare Land" fill="#a16207" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>Data Source: Verified Multi-Date Sentinel-2 Scenes</span>
                <span className="font-semibold text-slate-700">5-Year Temporal Interval</span>
              </div>
            </div>
          </div>

          {/* Secondary Grid: Net Changes & Spatial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Net Gain/Loss Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Net Hectare Changes (2020 → 2025)</h3>
                    <p className="text-[11px] text-slate-400">Class Expansion (+) vs Contraction (-)</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  $\Delta A_k = T_2 - T_1$
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={netChangesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="class_name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val > 0 ? `+${val}` : val} ha`, 'Net Change']}
                      contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="change_ha" radius={[4, 4, 0, 0]}>
                      {netChangesData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.change_ha >= 0 ? '#10b981' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Spatial Context HUD */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  Spatial Metadata & Context Summary
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                  PostGIS Live
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-medium">Active Study Area:</span>
                  <span className="font-bold text-slate-900">{data?.spatial_summary?.active_study_area}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-medium">Coordinate System (CRS):</span>
                  <span className="font-mono font-bold text-slate-900">{data?.spatial_summary?.crs}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-medium">Active Vector / Raster Layers:</span>
                  <span className="font-bold text-slate-900">
                    {data?.spatial_summary?.total_layers} ({data?.spatial_summary?.vector_count} Vector • {data?.spatial_summary?.raster_count} Raster)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-medium">Total Spatial Extent:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {data?.total_study_area_ha} ha ({data?.total_study_area_sq_km} km²)
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-50/70 p-2.5 rounded-xl border leading-relaxed">
                🔒 All metrics derived strictly from actual spatial vector boundaries on the WGS84 ellipsoid and verified 10m Sentinel-2 raster pixel matrices.
              </p>
            </div>
          </div>

          {/* Tables Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Table className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Tabular Analytics Data</h3>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActiveTableTab('distribution')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTableTab === 'distribution'
                      ? 'bg-white text-sky-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Class Statistics
                </button>
                <button
                  onClick={() => setActiveTableTab('temporal')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTableTab === 'temporal'
                      ? 'bg-white text-sky-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Temporal Changes (2020 → 2025)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTableTab === 'distribution' ? (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-3">Class ID</th>
                      <th className="p-3">Color</th>
                      <th className="p-3">Class Name</th>
                      <th className="p-3 text-right">Pixel Count (px)</th>
                      <th className="p-3 text-right">Area (Hectares)</th>
                      <th className="p-3 text-right">Area (Sq Km)</th>
                      <th className="p-3 text-right">Percentage (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.lulc_distribution.map((cls) => (
                      <tr key={cls.class_id} className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-slate-400">{cls.class_id}</td>
                        <td className="p-3">
                          <span
                            className="inline-block w-4 h-4 rounded-md border border-slate-300"
                            style={{ backgroundColor: cls.color_hex }}
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-800">{cls.class_name}</td>
                        <td className="p-3 text-right font-mono text-slate-600">{cls.pixel_count.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{cls.area_hectares.toFixed(2)} ha</td>
                        <td className="p-3 text-right font-mono text-slate-600">{cls.area_sq_km.toFixed(3)} km²</td>
                        <td className="p-3 text-right font-bold text-sky-700">{cls.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-3">Class ID</th>
                      <th className="p-3">Class Name</th>
                      <th className="p-3 text-right">2020 Baseline (ha)</th>
                      <th className="p-3 text-right">2025 Recent (ha)</th>
                      <th className="p-3 text-right">Net Change (ha)</th>
                      <th className="p-3 text-right">Rate of Change (%)</th>
                      <th className="p-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.temporal_net_changes.map((ch) => {
                      const isPositive = ch.change_ha >= 0;
                      return (
                        <tr key={ch.class_id} className="border-b border-slate-100 hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-slate-400">{ch.class_id}</td>
                          <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color_hex }} />
                            {ch.class_name}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">{ch.t1_ha} ha</td>
                          <td className="p-3 text-right font-mono text-slate-600">{ch.t2_ha} ha</td>
                          <td className={`p-3 text-right font-mono font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {ch.change_ha > 0 ? `+${ch.change_ha}` : ch.change_ha} ha
                          </td>
                          <td className={`p-3 text-right font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {ch.change_pct > 0 ? `+${ch.change_pct}` : ch.change_pct}%
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                isPositive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {isPositive ? 'Expansion' : 'Reduction'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
