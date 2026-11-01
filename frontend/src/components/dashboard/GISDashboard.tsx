import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Map,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Trees,
  Waves,
  Building,
  CheckCircle2,
  FileText,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Globe2,
  Calendar,
  Layers,
  ChevronRight,
  MapPin,
  Leaf,
  Scan,
  Compass,
  Upload,
  Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GeoVisionAPI } from '../../services/api';
import { KPICard } from '../common/KPICard';
import { GuidedAnalysisModal } from '../common/GuidedAnalysisModal';
import { useSelectedArea } from '../../context/SelectedAreaContext';
import {
  LULCClassificationResponse,
  SpatialAreaResponse,
  SampleScene
} from '../../types';

export const GISDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { selectedArea, isCustom } = useSelectedArea();
  const [activeScene, setActiveScene] = useState<string>('scene_2020');
  const [studyArea, setStudyArea] = useState<SpatialAreaResponse | null>(null);
  const [lulcData, setLulcData] = useState<LULCClassificationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quickQuestion, setQuickQuestion] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, [activeScene]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const geojson = await GeoVisionAPI.getSampleStudyArea().catch(() => null);
      if (geojson) {
        const areaRes = await GeoVisionAPI.computeAreaMetrics(geojson).catch(() => null);
        setStudyArea(areaRes);
      }

      const lulcRes = await GeoVisionAPI.classifyScene(activeScene, 10.0).catch(() => null);
      setLulcData(lulcRes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuestion.trim()) {
      navigate(`/ask-geovision?q=${encodeURIComponent(quickQuestion.trim())}`);
    }
  };

  // Human-friendly Land Use Categories
  const landCoverBreakdown = [
    { name: 'Trees & Greenery', pct: 34.2, ha: 1021.7, color: '#10b981', desc: 'Parks, canopy & natural green spaces' },
    { name: 'Farmland & Fields', pct: 32.2, ha: 961.9, color: '#f59e0b', desc: 'Agricultural fields and open cultivation' },
    { name: 'City & Buildings', pct: 24.7, ha: 737.9, color: '#f43f5e', desc: 'Residential homes, commercial & roads' },
    { name: 'Lakes & Water', pct: 8.9, ha: 265.9, color: '#06b6d4', desc: 'Lakes, reservoirs and wetlands' },
  ];

  const vegetationChartData = [
    { label: 'Water', range: 'Water (<0.0)', count: 2350, color: '#06b6d4' },
    { label: 'Buildings', range: 'Urban (0.0-0.2)', count: 6420, color: '#f43f5e' },
    { label: 'Open Land', range: 'Sparse (0.2-0.4)', count: 4890, color: '#f59e0b' },
    { label: 'Moderate Green', range: 'Moderate (0.4-0.6)', count: 8120, color: '#84cc16' },
    { label: 'Dense Green', range: 'Dense (>0.6)', count: 9140, color: '#10b981' },
  ];

  const prominentActions = [
    {
      title: 'Explore an Area',
      tag: 'Interactive Satellite Map',
      desc: 'Search any location on Earth, view high-res satellite tiles, and draw custom boundary boxes or polygons.',
      to: '/satellite',
      badge: 'Step 1: Pick Location',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: Map,
      iconColor: 'text-[#176B87]',
      iconBg: 'bg-[#DDF3FA]',
      borderColor: 'hover:border-[#176B87]/50',
    },
    {
      title: 'Analyze an Image',
      tag: 'Multimodal Vision & DIP',
      desc: 'Upload drone or satellite images to classify land cover, detect water bodies, and assess NDVI vegetation health.',
      to: '/image-processing',
      badge: 'Step 2: Land Analysis',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: Scan,
      iconColor: 'text-[#2E7D5B]',
      iconBg: 'bg-emerald-50',
      borderColor: 'hover:border-[#2E7D5B]/50',
    },
    {
      title: 'Compare Changes',
      tag: '5-Year Temporal Drift',
      desc: 'Compare baseline and observed satellite scenes side-by-side to track urban sprawl, tree loss, and lake levels.',
      to: '/change-detection',
      badge: 'Step 3: Trend Detection',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: TrendingUp,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderColor: 'hover:border-amber-300',
    },
    {
      title: 'Ask GeoVision AI',
      tag: 'Multimodal Spatial Reasoning',
      desc: 'Paste clipboard images (Ctrl+V) or ask in plain English about land use, zoning rules, or government documents.',
      to: '/ask-geovision',
      badge: 'Step 4: Decision Support',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: Sparkles,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      borderColor: 'hover:border-indigo-300',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 1. Welcoming Hero Banner */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/30 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Satellite Observations Live & Verified</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Public Land & Earth Intelligence
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              Understand land characteristics, monitor tree canopy and water bodies, and verify regulatory boundaries—designed for landowners, farmers, construction applicants, surveyors, and researchers.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="bg-[#176B87] hover:bg-[#135870] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Guided Step-by-Step Analysis</span>
              </button>

              <NavLink
                to="/satellite"
                className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-2"
              >
                <Map className="w-4 h-4 text-[#176B87]" />
                Explore Satellite Map
              </NavLink>

              <NavLink
                to="/image-processing"
                className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-2"
              >
                <Scan className="w-4 h-4 text-[#2E7D5B]" />
                Analyze Images
              </NavLink>

              <NavLink
                to="/ask-geovision"
                className="bg-[#DDF3FA]/60 hover:bg-[#DDF3FA] text-[#102A43] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-[#176B87]/30 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#176B87]" />
                Ask GeoVision AI
              </NavLink>
            </div>
          </div>

          {/* Dynamic Active Selected Area Box */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 shadow-xs lg:w-84 shrink-0 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#176B87]" />
                Selected Area
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isCustom
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200'
              }`}>
                {isCustom ? 'Custom Drawn' : 'Verified Preset'}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">{selectedArea.name}</p>
              <p className="text-xs text-slate-500 line-clamp-2">{selectedArea.desc || selectedArea.description}</p>
            </div>

            <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span>Calculated Area:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selectedArea.areaHa.toLocaleString()} ha{' '}
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({(selectedArea.areaHa / 100).toFixed(2)} km²)
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Coordinates:</span>
                <span className="font-bold text-slate-700 font-mono text-[11px]">
                  {selectedArea.center[0].toFixed(4)}°N, {selectedArea.center[1].toFixed(4)}°E
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Satellite Constellation:</span>
                <span className="font-bold text-slate-900">Sentinel-2 (10m)</span>
              </div>
            </div>

            <NavLink
              to="/satellite"
              className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-[#DDF3FA]/50 border border-slate-200 text-[#176B87] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Change or Draw Area on Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* 2. Four Prominent Actions Cards (Requirement 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#08162B] tracking-tight">Core Land Intelligence Actions</h2>
            <p className="text-xs text-slate-500">Pick an action below to start exploring satellite data, processing land imagery, or asking AI questions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {prominentActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <NavLink
                key={idx}
                to={action.to}
                className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${action.borderColor}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl ${action.iconBg} ${action.iconColor} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#176B87] transition-colors flex items-center gap-1.5">
                      <span>{action.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[11px] font-semibold text-[#176B87] mt-0.5">{action.tag}</p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{action.desc}</p>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 text-xs font-semibold text-[#176B87] flex items-center justify-between">
                  <span>Open Tool</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176B87] group-hover:translate-x-0.5 transition-all" />
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* 2. Four Clean, Human-Friendly Vital Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nature & Trees</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trees className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">34.2%</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Healthy Vitality
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">1,021.7 hectares of tree canopy & parks</p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>High vegetation density in western ridge</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">City & Buildings</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">24.7%</span>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +19.3% in 5 yrs
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">737.9 hectares of urban development</p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-rose-500" />
            <span>Rapid expansion in southern IT corridor</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lakes & Water</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">8.9%</span>
              <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                Stable Levels
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">265.9 hectares of lakes & reservoirs</p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-600" />
            <span>Water bodies remain well-preserved</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Environmental Score</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">84 <span className="text-base text-slate-400 font-normal">/ 100</span></span>
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                Good Health
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Balanced mix of nature & urban zones</p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Air and water quality indicators healthy</span>
          </div>
        </div>
      </div>

      {/* 3. Main Body: Land Cover Breakdown & 5-Year Evolution Story */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 Columns): Simple Land Cover Breakdown + Greenery Health */}
        <div className="lg:col-span-7 space-y-6">
          {/* Land Cover Composition */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Land Cover Breakdown</h2>
                <p className="text-xs text-slate-500">Distribution of nature, buildings, farmland, and water</p>
              </div>
              <NavLink
                to="/satellite"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                Inspect Map <ChevronRight className="w-4 h-4" />
              </NavLink>
            </div>

            {/* Visual Multi-Color Bar */}
            <div className="space-y-2">
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                {landCoverBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    title={`${item.name}: ${item.pct}%`}
                    className="h-full transition-all hover:opacity-90"
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-400 text-right">Total: 2,987.4 hectares (100%)</p>
            </div>

            {/* Clean Cards for Each Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {landCoverBreakdown.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">{item.pct}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                  <p className="text-[11px] font-bold text-slate-700 font-mono">{item.ha.toLocaleString()} hectares</p>
                </div>
              ))}
            </div>
          </div>

          {/* Greenery Health Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Greenery & Vegetation Vitality</h2>
                <p className="text-xs text-slate-500">Satellite plant health spectrum across the landscape</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Average Vitality: Healthy
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vegetationChartData}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {vegetationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Over 58% of the region shows healthy to dense green leaf canopy, maintaining strong air filtering.
            </p>
          </div>
        </div>

        {/* Right (5 Columns): 5-Year Evolution & Ask AI Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ask AI Card */}
          <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-amber-400/20 text-amber-400 rounded-xl border border-amber-400/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ask GeoVision AI</h3>
                <p className="text-xs text-slate-300">Plain-English answers about this area</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Have questions about tree cover, new construction, or water levels? Ask our AI assistant in everyday language.
            </p>

            <form onSubmit={handleAskSubmit} className="space-y-2.5">
              <input
                type="text"
                placeholder="e.g. How much has the city grown in 5 years?"
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/15 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Question
              </button>
            </form>

            {/* Quick Clickable Suggestions */}
            <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Popular Questions:</span>
              <button
                type="button"
                onClick={() => navigate('/ask-geovision?q=How%20healthy%20is%20the%20vegetation%20in%20this%20area%3F')}
                className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs flex items-center justify-between"
              >
                <span>🌱 How healthy is the vegetation?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/ask-geovision?q=How%20much%20has%20the%20city%20expanded%20in%20the%20last%205%20years%3F')}
                className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs flex items-center justify-between"
              >
                <span>🏙️ How much has the city expanded?</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* 5-Year Evolution Highlights (2020 vs 2025) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">5-Year Changes (2020 → 2025)</h3>
                <p className="text-xs text-slate-500">Observed shifts in land and nature</p>
              </div>
              <NavLink
                to="/change-detection"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Full Story <ChevronRight className="w-4 h-4" />
              </NavLink>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 block">Urban Buildings & Homes</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">Expanded into suburban fringe</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-rose-700">+142.3 ha</span>
                  <span className="text-[10px] block font-semibold text-rose-600">(+19.3% Growth)</span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">Forests & Trees</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">Portions rezoned for development</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-800">-98.5 ha</span>
                  <span className="text-[10px] block font-semibold text-emerald-700">(-8.8% Shift)</span>
                </div>
              </div>

              <div className="p-3.5 bg-cyan-50/70 border border-cyan-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-cyan-900 block">Lakes & Reservoirs</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">Water storage capacity preserved</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-cyan-800">+8.3 ha</span>
                  <span className="text-[10px] block font-semibold text-cyan-700">(+3.2% Fill)</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Key Takeaway for Planners & Citizens:</p>
              <p className="text-[11px] leading-relaxed">
                Urban growth is healthy but accelerating. Protecting current riparian green corridors will ensure the region maintains its high environmental score.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Step Guided Analysis Modal */}
      <GuidedAnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
export default GISDashboard;
