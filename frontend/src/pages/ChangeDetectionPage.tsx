import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Layers, Table, RefreshCw, FileText } from 'lucide-react';
import { GeoVisionAPI } from '../services/api';
import { LULCTemporalComparisonResponse } from '../types';

export const ChangeDetectionPage: React.FC = () => {
  const [temporalData, setTemporalData] = useState<LULCTemporalComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTemporalData();
  }, []);

  const loadTemporalData = async () => {
    setLoading(true);
    try {
      const res = await GeoVisionAPI.analyzeTemporalChange(10.0);
      setTemporalData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Multi-Date Temporal Change Detection</h2>
            <p className="text-xs text-slate-500">
              Pixel-Level Transition Matrix & Urban Encroachment Dynamics (2020 Baseline → 2025 Recent)
            </p>
          </div>
        </div>

        <button
          onClick={loadTemporalData}
          disabled={loading}
          className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Transitions
        </button>
      </div>

      {/* Net Change Metric Cards */}
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

      {/* Grid: 5x5 Matrix & Difference Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 5x5 Transition Matrix Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Table className="w-4 h-4 text-sky-600" />
                5x5 Cross-Class Transition Matrix (Hectares)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rows: Baseline 2020 (T1) → Columns: Transformed Class in 2025 (T2)
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
                      <td className="p-2.5 font-bold text-slate-800 bg-slate-50/80">{rLabel}</td>
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
        </div>

        {/* Spatial Change Difference Map */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              Spatial Difference Map
            </h3>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold border border-rose-200">
              Multi-Temporal Diff
            </span>
          </div>

          <div className="h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
            {temporalData?.change_map_url ? (
              <img src={temporalData.change_map_url} alt="Difference Map" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-slate-400">Computing differences...</span>
            )}
          </div>

          <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border">
            <span className="font-bold text-slate-800">Difference Color Mapping:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" />Built-up Expansion</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Vegetation Gain</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Vegetation Loss</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />Unchanged Persistent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
