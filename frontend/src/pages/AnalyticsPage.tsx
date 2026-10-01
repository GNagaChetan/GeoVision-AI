import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Download, FileSpreadsheet } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { GeoVisionAPI } from '../services/api';
import { LULCClassificationResponse, LULCTemporalComparisonResponse } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [lulc2020, setLulc2020] = useState<LULCClassificationResponse | null>(null);
  const [lulc2025, setLulc2025] = useState<LULCClassificationResponse | null>(null);
  const [temporalData, setTemporalData] = useState<LULCTemporalComparisonResponse | null>(null);

  useEffect(() => {
    GeoVisionAPI.classifyScene('scene_2020').then(setLulc2020);
    GeoVisionAPI.classifyScene('scene_2025').then(setLulc2025);
    GeoVisionAPI.analyzeTemporalChange().then(setTemporalData);
  }, []);

  const comparisonBarData = lulc2020?.classes.map((c, i) => ({
    name: c.class_name,
    '2020 (ha)': c.area_hectares,
    '2025 (ha)': lulc2025?.classes[i]?.area_hectares || 0,
    color: c.color_hex
  })) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Geospatial Analytics & Statistical Trends</h2>
            <p className="text-xs text-slate-500">
              Comparative LULC Distributions, Multi-Temporal Dynamics & Quantitative Summaries
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Year-Wise Multi-Temporal Comparison Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              Year-Wise Class Comparison (2020 vs 2025)
            </h3>
            <span className="text-xs font-semibold text-slate-400">Hectares</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="2020 (ha)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="2025 (ha)" fill="#0369a1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Net Change Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Net Hectare Changes (2020 → 2025)
            </h3>
            <span className="text-xs font-semibold text-slate-400">Gain / Loss</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temporalData?.class_changes || []}>
                <XAxis dataKey="class_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Bar dataKey="change_ha" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {temporalData?.class_changes.map((entry, index) => (
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
      </div>
    </div>
  );
};
