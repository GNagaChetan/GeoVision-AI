import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trees,
  Waves,
  Building,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  MapPin,
  Leaf,
  Compass,
  Image as ImageIcon,
  Paperclip,
  X,
  FileText,
  UploadCloud,
  Loader2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { GeoVisionAPI } from '../../services/api';
import { MarkdownMessage } from '../common/MarkdownMessage';
import { useSelectedArea } from '../../context/SelectedAreaContext';
import { RAGChunkCitation } from '../../types';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  summaryPill?: string;
  imageUrl?: string;
  documentName?: string;
  citations?: RAGChunkCitation[];
  isError?: boolean;
}

const HELPFUL_TOPICS = [
  {
    icon: Trees,
    color: 'text-[#2E7D5B] bg-[#2E7D5B]/10',
    title: 'Vegetation & Trees',
    question: 'How healthy is the vegetation and tree canopy in this area?'
  },
  {
    icon: Building,
    color: 'text-rose-600 bg-rose-50',
    title: 'City Expansion',
    question: 'How much has the city expanded over the past 5 years?'
  },
  {
    icon: Waves,
    color: 'text-[#176B87] bg-[#DDF3FA]',
    title: 'Lakes & Water Bodies',
    question: 'Are local water bodies, lakes, and rivers stable or encroached?'
  },
  {
    icon: Leaf,
    color: 'text-[#78A86B] bg-[#78A86B]/15',
    title: 'Planning Guidance',
    question: 'What land preservation recommendations apply to this region?'
  }
];

export const AskGeoVisionAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedArea } = useSelectedArea();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your GeoVision AI land intelligence assistant.\n\nI can help you explore locations, understand satellite imagery, analyze land characteristics, and answer questions about images, survey reports, and government land notices—all in plain, direct English.\n\nYou can ask any question, attach satellite pictures, paste images with Ctrl+V, or drag and drop documents.",
      timestamp: 'Just now',
      summaryPill: 'Land Intelligence AI'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Multimodal Attachments
  const [attachedImage, setAttachedImage] = useState<{ url: string; name: string; sizeKb?: number } | null>(null);
  const [attachedDoc, setAttachedDoc] = useState<{ name: string; chunks: number } | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Drag-and-drop state
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Location affirmation state for image upload (Requirement 9)
  const [imageLocationAffirmed, setImageLocationAffirmed] = useState<boolean | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle URL query parameter ?q=... or ?area=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const areaParam = params.get('area');
    if (q && q.trim()) {
      handleSend(q.trim());
    } else if (areaParam && areaParam.trim()) {
      setInputPrompt(`Analyze the land characteristics, tree cover, and recent changes in ${areaParam.trim()}.`);
    }
  }, [location.search]);

  // -------------------------------------------------------------
  // Clipboard Paste Handler (Ctrl+V Image Support)
  // -------------------------------------------------------------
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let imageFile: File | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (imageFile) {
      // Prevent default ONLY if an image was pasted, so normal text paste works!
      e.preventDefault();
      await processImageUpload(imageFile);
    }
  };

  // -------------------------------------------------------------
  // Drag and Drop Handlers
  // -------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (file.type.startsWith('image/') || ['tif', 'tiff', 'webp'].includes(ext || '')) {
      await processImageUpload(file);
    } else if (['pdf', 'txt', 'md', 'json'].includes(ext || '')) {
      await processDocUpload(file);
    } else {
      setUploadError(`Unsupported file format '.${ext}'. Please upload an image or PDF/TXT/MD document.`);
    }
  };

  // Image Upload Processor
  const processImageUpload = async (file: File) => {
    setIsUploadingAttachment(true);
    setUploadError(null);
    setImageLocationAffirmed(null);

    try {
      const res = await GeoVisionAPI.uploadChatPicture(file);
      setAttachedImage({
        url: res.url,
        name: res.filename || file.name,
        sizeKb: res.file_size_kb || Math.round(file.size / 1024)
      });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err.response?.data?.detail || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploadingAttachment(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Document Upload Processor
  const processDocUpload = async (file: File) => {
    setIsUploadingAttachment(true);
    setUploadError(null);

    try {
      const res = await GeoVisionAPI.uploadChatDocument(file);
      setAttachedDoc({
        name: res.filename || file.name,
        chunks: res.chunks_indexed || 1
      });
    } catch (err: any) {
      console.error('Document upload failed:', err);
      setUploadError(err.response?.data?.detail || 'Failed to parse and index document.');
    } finally {
      setIsUploadingAttachment(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------
  // Send Message Handler
  // -------------------------------------------------------------
  const handleSend = async (promptToSend?: string) => {
    const rawText = promptToSend !== undefined ? promptToSend : inputPrompt;
    const text = rawText.trim();

    if ((!text && !attachedImage && !attachedDoc) || isLoading) return;

    // Build the user message
    const userMsgText = text || (attachedImage ? 'Inspect and analyze this attached satellite/land image.' : 'Analyze this uploaded document.');
    const currentImg = attachedImage;
    const currentDoc = attachedDoc;

    const userMsg: Message = {
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: currentImg?.url,
      documentName: currentDoc?.name
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setAttachedImage(null);
    setAttachedDoc(null);
    setUploadError(null);
    setIsLoading(true);

    // Build conversation history for multi-turn reasoning
    const historyPayload = messages
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

    try {
      const res = await GeoVisionAPI.askGeoVisionEnhanced({
        prompt: userMsgText,
        active_dataset_id: 'scene_2020',
        include_rag_context: true,
        image_url: currentImg?.url,
        document_name: currentDoc?.name,
        history: historyPayload,
        selected_area_name: selectedArea.name,
        selected_area_details: {
          location: selectedArea.locationLabel,
          center: selectedArea.center,
          areaHa: selectedArea.areaHa,
          areaKm2: selectedArea.areaKm2,
          isCustom: selectedArea.isCustom
        }
      });

      const assistantMsg: Message = {
        sender: 'assistant',
        text: res.response_text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summaryPill: currentImg ? 'Vision Analysis' : currentDoc ? 'Document Grounded' : 'Satellite Verified',
        citations: res.rag_citations
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const detail = err.response?.data?.detail || err.message || 'Error communicating with AI service.';

      const errorMsg: Message = {
        sender: 'assistant',
        text: `Unable to complete your request: ${detail}\n\nPlease check your server configuration and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summaryPill: 'Service Notice',
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div
      ref={chatContainerRef}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="h-[calc(100vh-80px)] p-4 sm:p-6 max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-5 font-sans relative"
    >
      {/* Floating Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-4 z-50 bg-[#08162B]/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#38BDF8] flex flex-col items-center justify-center text-white pointer-events-none animate-in fade-in">
          <UploadCloud className="w-16 h-16 text-[#38BDF8] animate-bounce mb-3" />
          <h3 className="text-xl font-extrabold">Drop your satellite photo or document here</h3>
          <p className="text-xs text-slate-300 mt-1">Supports PNG, JPG, TIFF, WEBP, PDF, TXT, MD</p>
        </div>
      )}

      {/* Left Sidebar: Active Area & Topic Starters */}
      <div className="w-full lg:w-80 flex flex-col space-y-4 shrink-0">
        {/* Active Context Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-[#DDF3FA] text-[#176B87] rounded-xl">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#08162B]">Active Study Area</h3>
                <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{selectedArea.name}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selectedArea.isCustom ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {selectedArea.isCustom ? 'Custom Box' : 'Preset'}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Area:</span>
              <span className="font-bold text-[#08162B]">{selectedArea.areaHa.toLocaleString()} ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Center:</span>
              <span className="font-mono text-[11px] text-slate-700">
                {selectedArea.center[0].toFixed(3)}°, {selectedArea.center[1].toFixed(3)}°
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/satellite')}
            className="w-full text-xs font-bold text-[#176B87] bg-[#DDF3FA]/60 hover:bg-[#DDF3FA] py-2 rounded-xl border border-[#176B87]/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Change Area on Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Helpful Suggested Questions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 flex-1 overflow-y-auto">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#176B87]" />
            Suggested Questions
          </span>
          <div className="space-y-2.5">
            {HELPFUL_TOPICS.map((topic, idx) => {
              const Icon = topic.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(topic.question)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#176B87]/50 hover:bg-[#DDF3FA]/30 transition-all text-xs space-y-1.5 group"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${topic.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-[#08162B] group-hover:text-[#176B87]">{topic.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">{topic.question}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Chat Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Chat Stream Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-[#F7FBFD]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#102A43] to-[#176B87] text-white flex items-center justify-center font-bold shadow-xs">
              <Bot className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#08162B] flex items-center gap-2">
                <span>Ask GeoVision AI</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Vision & Multimodal
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Ask arbitrary questions, paste satellite pictures (Ctrl+V), or upload land notices
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setMessages([
                {
                  sender: 'assistant',
                  text: 'Conversation cleared. I am ready to assist with any satellite, land-use, or planning questions.',
                  timestamp: 'Just now',
                  summaryPill: 'Ready'
                }
              ])
            }
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Clear Chat Conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={idx} className={`flex gap-3 text-xs sm:text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#102A43] text-[#38BDF8] flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 space-y-2 shadow-xs ${
                    isUser
                      ? 'bg-[#176B87] text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
                      : 'bg-[#F7FBFD] text-[#08162B] border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  {/* Badge & Pill */}
                  {!isUser && msg.summaryPill && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-1 border ${
                        msg.isError
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {msg.isError ? (
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{msg.summaryPill}</span>
                    </div>
                  )}

                  {/* Attached Image Thumbnail */}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/20 my-2 max-w-xs bg-slate-900/10">
                      <img src={msg.imageUrl} alt="Attached satellite" className="w-full h-40 object-cover" />
                    </div>
                  )}

                  {/* Attached Document Pill */}
                  {msg.documentName && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-mono my-1 border border-white/20">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{msg.documentName}</span>
                    </div>
                  )}

                  {/* Message Content Rendered Safely */}
                  {isUser ? (
                    <div className="whitespace-pre-line font-normal leading-relaxed">{msg.text}</div>
                  ) : (
                    <MarkdownMessage content={msg.text} citations={msg.citations} />
                  )}

                  {!isUser && !msg.isError && (
                    <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopy(msg.text, idx)}
                        className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                        title="Copy text"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {msg.isError && (
                    <div className="pt-2 mt-2 border-t border-rose-200 flex items-center justify-between">
                      <button
                        onClick={() => handleSend()}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry Question</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-[#DDF3FA] text-[#176B87] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-[#F7FBFD] rounded-2xl border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#176B87] animate-ping" />
                <span>GeoVision AI is analyzing satellite imagery & domain context...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Previews & Location Affirmation Banner */}
        {(attachedImage || attachedDoc || isUploadingAttachment || uploadError) && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-2">
            {isUploadingAttachment && (
              <div className="flex items-center gap-2 text-xs text-[#176B87] font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading and preparing attachment...</span>
              </div>
            )}

            {uploadError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  {uploadError}
                </span>
                <button onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {attachedImage && (
                <div className="inline-flex items-center gap-2 p-1.5 pr-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
                  <img src={attachedImage.url} alt="Attached" className="w-8 h-8 rounded-lg object-cover" />
                  <div>
                    <span className="font-bold text-[#08162B] block truncate max-w-[150px]">
                      {attachedImage.name}
                    </span>
                    {attachedImage.sizeKb && (
                      <span className="text-[10px] text-slate-400 font-mono">{attachedImage.sizeKb} KB</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setAttachedImage(null);
                      setImageLocationAffirmed(null);
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 ml-1"
                    title="Remove attached image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {attachedDoc && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
                  <FileText className="w-4 h-4 text-[#176B87]" />
                  <div>
                    <span className="font-bold text-[#08162B] block truncate max-w-[160px]">
                      {attachedDoc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {attachedDoc.chunks} chunks indexed in RAG
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachedDoc(null)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 ml-1"
                    title="Remove attached document"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Location Affirmation check (Requirement 9) */}
            {attachedImage && imageLocationAffirmed === null && (
              <div className="p-2.5 bg-[#DDF3FA] border border-[#176B87]/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[#08162B] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#176B87] shrink-0" />
                  Does this image belong to <strong>{selectedArea.name}</strong>?
                </span>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setImageLocationAffirmed(true)}
                    className="px-2.5 py-1 bg-[#176B87] text-white rounded-lg text-xs font-bold"
                  >
                    Yes, same area
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageLocationAffirmed(false)}
                    className="px-2.5 py-1 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Different location
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Input Field & Upload Triggers */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,.tif,.tiff,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processImageUpload(file);
            }}
          />
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.txt,.md,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processDocUpload(file);
            }}
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Picture Button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Attach satellite picture or photo (or paste with Ctrl+V)"
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#176B87] hover:bg-[#DDF3FA]/30 text-slate-500 hover:text-[#176B87] transition-all flex items-center gap-1"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Document Button */}
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              title="Attach document or report (PDF, TXT, MD)"
              className="p-2.5 rounded-xl border border-slate-200 hover:border-[#176B87] hover:bg-[#DDF3FA]/30 text-slate-500 hover:text-[#176B87] transition-all flex items-center gap-1"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Ask anything about land, images, or notices (paste images with Ctrl+V)..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#176B87] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#08162B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176B87]/20 transition-all"
            />

            <button
              type="submit"
              disabled={isLoading || (!inputPrompt.trim() && !attachedImage && !attachedDoc)}
              className="bg-[#176B87] hover:bg-[#135870] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 text-xs sm:text-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskGeoVisionAssistant;
