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
  Tag,
  Trash2,
  AlertCircle,
  HelpCircle
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
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

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

  const handleSearch = async (e?: React.FormEvent, searchQuery?: string) => {
    if (e) e.preventDefault();
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    try {
      const res = await GeoVisionAPI.queryRAG(q, 4);
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

  const handleDeleteDocument = async (docName: string) => {
    if (!window.confirm(`Are you sure you want to remove '${docName}' from the RAG knowledge index?`)) return;
    setDeletingDoc(docName);
    try {
      await GeoVisionAPI.deleteDocument(docName);
      setUploadStatus(`Removed '${docName}' from vector index.`);
      loadDocuments();
      if (citations.some(c => c.document_name === docName)) {
        setCitations(prev => prev.filter(c => c.document_name !== docName));
      }
    } catch (err: any) {
      setUploadStatus(err.response?.data?.detail || 'Failed to delete document.');
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleInitDefaults = async () => {
    setUploadStatus('Indexing pre-loaded academic library...');
    try {
      await GeoVisionAPI.initDefaultKnowledge();
      setUploadStatus('Pre-loaded domain knowledge base indexed successfully.');
      loadDocuments();
    } catch (err) {
      setUploadStatus('Failed to initialize default knowledge.');
    }
  };

  const REQUIRED_QUERIES = [
    "What is remote sensing?",
    "What is the difference between raster and vector data?",
    "Explain histogram equalization.",
    "What is LULC?",
    "What does NDVI represent?",
    "What image-processing method was used?"
  ];

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
              Grounded Academic Literature, Remote Sensing Principles, GIS Standards & Ingested Project Reports
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleInitDefaults}
            className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3.5 py-2 rounded-xl border border-sky-200 transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-index Domain Library
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

            {documents.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No documents indexed yet.</p>
                <button
                  onClick={handleInitDefaults}
                  className="text-xs text-sky-600 font-semibold hover:underline"
                >
                  Load Pre-loaded Knowledge Library
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate" title={doc.document_name}>{doc.document_name}</span>
                      </span>
                      <button
                        onClick={() => handleDeleteDocument(doc.document_name)}
                        disabled={deletingDoc === doc.document_name}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        title="Delete document and re-index"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
            )}

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed space-y-1">
              <p className="flex items-center gap-1 text-slate-500 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Prompt Injection Defense Enabled
              </p>
              <p>Untrusted documents are sanitized, control directives are neutralized, and citations are isolated from system instructions.</p>
            </div>
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
                  placeholder="Ask a scientific question or search concepts (e.g. 'What is remote sensing?')..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {isSearching ? 'Searching...' : 'Vector Search'}
              </button>
            </form>

            {/* Academic Syllabus Quick Queries */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-sky-600" />
                Standard Domain Questions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED_QUERIES.map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setQuery(k);
                      handleSearch(undefined, k);
                    }}
                    className="bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-sky-200 transition-all text-left"
                  >
                    {k}
                  </button>
                ))}
              </div>
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
                  Cosine Similarity Ranking
                </span>
              )}
            </div>

            {citations.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2 text-slate-400">
                <Bookmark className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Select a standard domain question or enter a search query above.</p>
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
