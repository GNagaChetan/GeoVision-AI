import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Layers,
  Map,
  Activity,
  ShieldCheck,
  Printer,
  Sparkles,
  SlidersHorizontal,
  Trees,
  Table,
  Building,
  Check,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { GeoVisionAPI } from '../services/api';
import { DemoDataBadge } from '../components/common/UIState';
import { useSelectedArea } from '../context/SelectedAreaContext';

export const ReportsPage: React.FC = () => {
  const { selectedArea } = useSelectedArea();
  const [report, setReport] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [exported, setExported] = useState<boolean>(false);

  // Section toggle options
  const [includeGeodesic, setIncludeGeodesic] = useState<boolean>(true);
  const [includeLULC, setIncludeLULC] = useState<boolean>(true);
  const [includeNDVI, setIncludeNDVI] = useState<boolean>(true);
  const [includeChangeDetection, setIncludeChangeDetection] = useState<boolean>(true);
  const [includeRAG, setIncludeRAG] = useState<boolean>(true);

  useEffect(() => {
    loadInitialReport();
  }, []);

  const loadInitialReport = async () => {
    setLoading(true);
    try {
      const histRes = await GeoVisionAPI.listReports().catch(() => ({ reports: [] }));
      setHistory(histRes.reports || []);

      if (histRes.reports && histRes.reports.length > 0) {
        const latest = await GeoVisionAPI.getReport(histRes.reports[0].report_id).catch(() => null);
        if (latest) {
          setReport(latest);
          setLoading(false);
          return;
        }
      }

      // Generate initial fresh report
      const fresh = await GeoVisionAPI.generateReport();
      setReport(fresh);
      const updatedHist = await GeoVisionAPI.listReports().catch(() => ({ reports: [] }));
      setHistory(updatedHist.reports || []);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFresh = async () => {
    setGenerating(true);
    try {
      const fresh = await GeoVisionAPI.generateReport();
      setReport(fresh);
      const updatedHist = await GeoVisionAPI.listReports().catch(() => ({ reports: [] }));
      setHistory(updatedHist.reports || []);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectHistorical = async (reportId: string) => {
    setLoading(true);
    try {
      const selected = await GeoVisionAPI.getReport(reportId);
      setReport(selected);
    } catch (err) {
      console.error('Failed to load historical report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_id || 'GeoVision_Report'}.json`;
    a.click();
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !report) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-600" />
        <p className="text-sm font-semibold">Synthesizing comprehensive geospatial analytical report...</p>
      </div>
    );
  }

  const sa = report?.study_area || {};
  const sat = report?.satellite_sensor || {};
  const lulc = report?.lulc_classification || {};
  const veg = report?.vegetation_analytics || {};
  const cd = report?.change_detection || {};
  const gis = report?.gis_spatial_analytics || {};

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">{report?.project_title || 'Executive Geospatial Analytical Report'}</h1>
              <DemoDataBadge label="Live System Telemetry" />
            </div>
            <p className="text-xs text-slate-500">
              Report ID: <span className="font-mono text-slate-700">{report?.report_id}</span> | Generated: {report?.generated_at ? new Date(report.generated_at).toLocaleString() : 'Just now'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateFresh}
            disabled={generating}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-purple-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Compiling...' : 'Re-generate'}
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print / PDF
          </button>

          <button
            onClick={handleExportJSON}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {exported ? <Check className="w-4 h-4 text-emerald-300" /> : <Download className="w-4 h-4" />}
            {exported ? 'JSON Exported' : 'Export JSON'}
          </button>
        </div>
      </div>

      {/* Report History Selector */}
      {history.length > 1 && (
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-600 shrink-0 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Report History:
          </span>
          {history.map((h, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectHistorical(h.report_id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all shrink-0 ${
                report?.report_id === h.report_id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {h.report_id}
            </button>
          ))}
        </div>
      )}

      {/* Section Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
        <span className="flex items-center gap-1.5 font-bold text-slate-900">
          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          Active Report Sections:
        </span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includeGeodesic} onChange={e => setIncludeGeodesic(e.target.checked)} className="rounded text-purple-600" />
          Study Area & GIS
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includeLULC} onChange={e => setIncludeLULC(e.target.checked)} className="rounded text-purple-600" />
          LULC Classification
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includeNDVI} onChange={e => setIncludeNDVI(e.target.checked)} className="rounded text-purple-600" />
          NDVI Analytics
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includeChangeDetection} onChange={e => setIncludeChangeDetection(e.target.checked)} className="rounded text-purple-600" />
          Change Matrix
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={includeRAG} onChange={e => setIncludeRAG(e.target.checked)} className="rounded text-purple-600" />
          RAG Literature
        </label>
      </div>

      {/* Main Report Document Container */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-floating space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Section 1: Study Area & Metadata */}
        {includeGeodesic && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2">
              <Map className="w-4 h-4 text-[#176B87]" />
              1. Study Area & Geographic Extent
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Study Area Name</span>
                <p className="text-xs font-bold text-slate-800">{sa.name || selectedArea.name || 'Bengaluru IT Corridor'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Total Area</span>
                <p className="text-xs font-bold text-[#176B87]">{sa.total_area_ha || selectedArea.areaHa} ha ({sa.total_area_km2 || (selectedArea.areaHa / 100).toFixed(2)} km²)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Spatial Reference</span>
                <p className="text-xs font-bold text-slate-800">{sa.crs || 'EPSG:4326 / WGS84'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Ground Resolution</span>
                <p className="text-xs font-bold text-slate-800">{sa.ground_sampling_distance_m || 10.0} m / pixel</p>
              </div>
            </div>
          </section>
        )}

        {/* Section 2: Sensor Provenance & DIP Operations */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            2. Satellite Sensor Provenance & DIP Pipeline
          </h2>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <p><strong className="text-slate-800">Platform:</strong> {sat.sensor_platform}</p>
            <p><strong className="text-slate-800">Processing Level:</strong> {sat.level}</p>
            <p><strong className="text-slate-800">Spectral Bands:</strong> {sat.bands_processed?.join(', ')}</p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700">Executed Digital Image Processing (DIP) Pipeline:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {report?.image_processing_operations?.map((op: any, i: number) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-800">{op.operation}</p>
                  <p className="text-[11px] text-slate-500">{op.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: LULC Classification */}
        {includeLULC && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2">
              <Trees className="w-4 h-4 text-purple-600" />
              3. Land Use / Land Cover (LULC) Classification
            </h2>
            <p className="text-xs text-slate-600">
              Dominant Class: <strong className="text-emerald-700">{lulc.dominant_class}</strong> | Total Classified Extent: <strong>{lulc.total_classified_ha} ha</strong>
            </p>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-slate-700 font-bold">LULC Class</th>
                    <th className="p-3 text-slate-700 font-bold">2020 Area (ha)</th>
                    <th className="p-3 text-slate-700 font-bold">2020 Ratio</th>
                    <th className="p-3 text-slate-700 font-bold">2025 Area (ha)</th>
                    <th className="p-3 text-slate-700 font-bold">2025 Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lulc.classes_t1_2020?.map((c1: any, i: number) => {
                    const c2 = lulc.classes_t2_2025?.[i] || {};
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c1.color_hex }} />
                          {c1.class_name}
                        </td>
                        <td className="p-3 font-mono">{c1.area_hectares} ha</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{c1.percentage}%</td>
                        <td className="p-3 font-mono">{c2.area_hectares} ha</td>
                        <td className="p-3 font-mono font-bold text-purple-700">{c2.percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 4: NDVI Vegetation Analytics */}
        {includeNDVI && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              4. Multispectral Vegetation Analytics (NDVI)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Mean NDVI</span>
                <p className="text-xs font-bold font-mono text-emerald-900">{veg.mean_ndvi}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Median NDVI</span>
                <p className="text-xs font-bold font-mono text-slate-800">{veg.median_ndvi}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Min NDVI</span>
                <p className="text-xs font-bold font-mono text-slate-800">{veg.min_ndvi}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Max NDVI</span>
                <p className="text-xs font-bold font-mono text-slate-800">{veg.max_ndvi}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Std Deviation</span>
                <p className="text-xs font-bold font-mono text-slate-800">{veg.std_dev}</p>
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Multi-Temporal Change Detection */}
        {includeChangeDetection && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2">
              <Table className="w-4 h-4 text-purple-600" />
              5. Multi-Temporal Change Detection & Transition Matrix
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Unchanged Stable Extent</span>
                <p className="text-xs font-bold text-emerald-700">{cd.unchanged_area_ha} ha ({cd.unchanged_percentage}%)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Total Converted Area</span>
                <p className="text-xs font-bold text-pink-700">{cd.total_changed_area_ha} ha ({cd.total_changed_percentage}%)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Dominant Conversion</span>
                <p className="text-xs font-bold text-slate-800">{cd.most_converted_transition?.from_class} → {cd.most_converted_transition?.to_class} ({cd.most_converted_transition?.area_ha} ha)</p>
              </div>
            </div>

            {/* 5x5 Matrix */}
            {cd.transition_matrix_ha && (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-sans text-slate-700 font-bold">From (T1) \ To (T2)</th>
                      {cd.transition_labels?.map((lbl: string, i: number) => (
                        <th key={i} className="p-3 text-slate-700 font-bold">{lbl}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cd.transition_matrix_ha.map((row: number[], rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="p-3 font-sans font-bold text-slate-800">{cd.transition_labels?.[rIdx]}</td>
                        {row.map((val: number, cIdx: number) => (
                          <td
                            key={cIdx}
                            className={`p-3 ${
                              rIdx === cIdx ? 'bg-emerald-50/70 font-bold text-emerald-800' : 'text-slate-600'
                            }`}
                          >
                            {val.toFixed(2)} ha
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Section 6: Grounded Academic Citations */}
        {includeRAG && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              6. Academic Traceability & Domain Literature Citations
            </h2>
            <div className="space-y-2">
              {report?.rag_sources?.map((src: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{src.document_name} (Section/Page {src.page_number})</span>
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      Match: {(src.similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="italic text-slate-600">"{src.snippet}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 7: Limitations & Quality Governance */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            7. Methodological Limitations & Governance
          </h2>
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
            {report?.limitations_and_provenance?.map((lim: string, idx: number) => (
              <p key={idx} className="flex items-start gap-1.5">
                <span className="font-bold">•</span>
                <span>{lim}</span>
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
