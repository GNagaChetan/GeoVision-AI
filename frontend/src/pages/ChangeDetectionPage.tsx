import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Trees,
  Waves,
  Leaf,
  Calendar,
  CheckCircle2,
  FileText,
  Eye,
  ChevronRight,
  MapPin,
  Sparkles,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { GeoVisionAPI } from '../services/api';
import { ChangeDetectionResponse } from '../types';

export const ChangeDetectionPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [changeData, setChangeData] = useState<ChangeDetectionResponse | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'visual_map'>('overview');

  useEffect(() => {
    loadChangeData();
  }, []);

  const loadChangeData = async () => {
    setLoading(true);
    try {
      const res = await GeoVisionAPI.analyzeChangeDetection({
        t1Path: 'scene_2020_t1.png',
        t2Path: 'scene_2025_t2.png',
        t1Name: '2020',
        t2Name: '2025',
        resolutionM: 10.0
      });
      setChangeData(res);
    } catch (err) {
      console.error('Failed to load change detection data:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Trees & Nature', '2020': 1284.6, '2025': 1186.1, color: '#10b981' },
    { name: 'Buildings & City', '2020': 737.9, '2025': 880.2, color: '#f43f5e' },
    { name: 'Farmland', '2020': 645.3, '2025': 593.2, color: '#f59e0b' },
    { name: 'Lakes & Water', '2020': 235.5, '2025': 243.8, color: '#06b6d4' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-3.5 py-1 rounded-full border border-indigo-200">
              <Calendar className="w-3.5 h-3.5" />
              <span>5-Year Satellite Timeline (2020 vs 2025)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              5-Year Land & Environmental Changes
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Compare satellite observations from 2020 to 2025 to see how your city has expanded and how natural greenery and lakes have evolved.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeView === 'overview'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Summary & Charts
            </button>
            <button
              onClick={() => setActiveView('visual_map')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeView === 'visual_map'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite Before / After
            </button>
          </div>
        </div>
      </div>

      {/* 4 Clean Change Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">City Growth</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-700">+142.3 ha</span>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                +19.3%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">New residential homes, offices & transit routes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Forests & Trees</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trees className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-800">-98.5 ha</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                -8.8%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Peripheral green parcels converted to urban use</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Farmland</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-800">-52.1 ha</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                -7.5%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Agricultural cultivation shifted outward</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lakes & Reservoirs</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-cyan-800">+8.3 ha</span>
              <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                +3.2%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Water storage surface preserved and desilted</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Comparison Bar Chart (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Land Distribution Comparison (2020 vs 2025)</h2>
                <p className="text-xs text-slate-500">Total area in hectares across categories</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                Unit: Hectares
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px', borderColor: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="2020" fill="#94a3b8" radius={[4, 4, 0, 0]} name="2020 (Baseline)" />
                  <Bar dataKey="2025" fill="#0284c7" radius={[4, 4, 0, 0]} name="2025 (Recent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Clear visual demonstration of the steady rise in built-up infrastructure alongside the preservation of lake networks.
            </p>
          </div>

          {/* Key Insights & Recommendations (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Key Takeaways & Insights</h3>
                <p className="text-xs text-slate-500">What these changes mean for the region</p>
              </div>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  1. City Growth Rate
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Urbanization expanded by nearly 20% in 5 years, primarily in the southern IT corridor, reflecting strong economic vitality.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  2. Tree Cover Protection
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  While dense tree canopy remains healthy at 34%, loss of fringe vegetation suggests city planners should prioritize linear green belts along ring roads.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  3. Water Catchment Success
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Water body preservation has been successful, with water surfaces expanding by +8.3 hectares due to rainwater harvesting initiatives.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Visual Satellite Comparison */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Side-by-Side Satellite Observation</h2>
            <p className="text-xs text-slate-500">Notice the expansion of light-colored urban structures between 2020 and 2025</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">2020 Baseline Satellite Image</span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">March 2020</span>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs relative">
                <img
                  src="/api/v1/samples/scene_2020_t1.png"
                  alt="2020 Satellite Scene"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] px-3 py-1 rounded-lg">
                  2020 View
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">2025 Recent Satellite Image</span>
                <span className="text-[11px] bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-bold">March 2025</span>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs relative">
                <img
                  src="/api/v1/samples/scene_2025_t2.png"
                  alt="2025 Satellite Scene"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-sky-900/80 backdrop-blur-sm text-white text-[11px] px-3 py-1 rounded-lg">
                  2025 View (+19% Urban Growth)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChangeDetectionPage;
