import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Upload,
  FileText,
  Bookmark,
  Sparkles,
  Layers,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Tag
} from 'lucide-react';
import { GeoVisionAPI } from '../../services/api';
import { RAGChunkCitation, IndexedDocument } from '../../types';

export const RAGKnowledgeBase: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [citations, setCitations] = useState<RAGChunkCitation[]>([]);
  const [documents, setDocuments] = useState<IndexedDocument[]>([]);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await GeoVisionAPI.listDocuments();
      setDocuments(res.documents);
      setTotalChunks(res.total_chunks);
    } catch (err) {
      console.error('Failed to list documents:', err);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await GeoVisionAPI.queryRAG(query, 5);
      setCitations(res.citations);
    } catch (err) {
      console.error('RAG query failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Uploading & chunking document...');
    try {
      const res = await GeoVisionAPI.ingestDocument(file, 'Uploaded Research');
      setUploadStatus(`Indexed "${res.filename}" into ${res.num_chunks} vector chunks.`);
      loadDocuments();
    } catch (err: any) {
      setUploadStatus(err.response?.data?.detail || 'Upload failed.');
    }
  };

  const handleInitDefaults = async () => {
    setUploadStatus('Indexing pre-loaded academic library...');
    try {
      await GeoVisionAPI.initDefaultKnowledge();
      setUploadStatus('Pre-loaded knowledge base indexed successfully.');
      loadDocuments();
    } catch (err) {
      setUploadStatus('Failed to initialize default knowledge.');
    }
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">RAG Domain Knowledge Base</h2>
            <p className="text-xs text-slate-500">
              Vectorized Academic Literature, Remote Sensing Textbooks & GIS Planning Standards
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleInitDefaults}
            className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-xl border border-sky-200 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Domain Library
          </button>

          <label className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Upload Document (PDF/MD/TXT)
            <input
              type="file"
              accept=".pdf,.md,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {uploadStatus && (
        <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium rounded-xl flex items-center justify-between">
          <span>{uploadStatus}</span>
          <button onClick={() => setUploadStatus(null)} className="text-sky-600 hover:text-sky-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Search & Documents Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Indexed Knowledge Documents */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-floating space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                Indexed Repositories ({documents.length})
              </span>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {totalChunks} Chunks Total
              </span>
            </div>

            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      {doc.document_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {doc.tag}
                    </span>
                    <span className="font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {doc.chunks_count} chunks
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
              Semantic sliding-window chunking (500 chars with 80 chars overlap) preserves section context and page metadata.
            </p>
          </div>
        </div>

        {/* Right Column: Semantic Vector Search & Live Chunk Citations */}
        <div className="lg:col-span-8 space-y-4">
          {/* Vector Search Input Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search literature (e.g. 'NDVI formula', 'CLAHE clipping threshold', 'Transition matrix', 'Canny hysteresis')..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Vector Search'}
              </button>
            </form>

            {/* Quick Keyword Suggestions */}
            <div className="flex flex-wrap gap-1.5 items-center text-xs text-slate-500">
              <span className="text-[11px] font-semibold text-slate-400">Quick Queries:</span>
              {['NDVI Spectral Index', 'CLAHE Clipping Limit', 'Canny Edge Detection', 'LULC Transition Matrix', '2D-DFT Frequency Spectrum'].map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setQuery(k);
                    GeoVisionAPI.queryRAG(k, 4).then(res => setCitations(res.citations));
                  }}
                  className="bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 transition-all"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Retrieved Citations List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Retrieved Vector Citations ({citations.length})
              </span>
              {citations.length > 0 && (
                <span className="text-xs text-slate-500">
                  Ranked by Cosine Similarity Metric
                </span>
              )}
            </div>

            {citations.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2 text-slate-400">
                <Bookmark className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Enter a query above to retrieve grounded literature citations.</p>
              </div>
            ) : (
              citations.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {c.document_name}
                      </span>
                      {c.page_number && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          Section/Page {c.page_number}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Similarity: {(c.similarity_score * 100).toFixed(1)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/70 p-3 rounded-xl border border-slate-100 italic">
                    "{c.snippet}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
