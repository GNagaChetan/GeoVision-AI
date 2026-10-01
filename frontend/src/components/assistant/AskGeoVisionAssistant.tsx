import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  BookOpen,
  Layers,
  Activity,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { GeoVisionAPI } from '../../services/api';
import { AskGeoVisionResponse, RAGChunkCitation } from '../../types';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  citations?: RAGChunkCitation[];
  structuredAnalytics?: Record<string, any>;
  executedTools?: string[];
  groundingStatus?: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "Analyze urban built-up expansion into vegetation and croplands between 2020 and 2025.",
  "Evaluate a 150m riparian buffer zone around the river basin and calculate affected land area.",
  "What is the mathematical formulation of NDVI and how do reflectance thresholds distinguish vegetation?",
  "Compare the computational steps and edge detection accuracy of Sobel vs. Canny operators."
];

export const AskGeoVisionAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Welcome to **Ask GeoVision Decision Support**. I can analyze your active satellite imagery, calculate verified GIS spatial buffers, extract LULC transition metrics, and ground recommendations in remote sensing and DIP academic literature.\n\nHow can I assist your geospatial analysis today?",
      timestamp: 'Just now',
      executedTools: ['geovision_core_engine'],
      groundingStatus: 'Ready with Active Dataset & Domain RAG'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSend = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await GeoVisionAPI.askGeoVision(text, 'scene_2020', true);
      const assistantMsg: Message = {
        sender: 'assistant',
        text: res.response_text,
        citations: res.rag_citations,
        structuredAnalytics: res.structured_analytics,
        executedTools: res.executed_tools,
        groundingStatus: res.grounding_status,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        sender: 'assistant',
        text: "I encountered an error executing your geospatial query. Please verify the backend connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] p-4 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-4">
      {/* Left Sidebar: Suggested Queries & Context Badge */}
      <div className="w-full lg:w-80 flex flex-col space-y-4 shrink-0">
        {/* Active Context Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Decision Engine Context</h3>
              <p className="text-[11px] text-slate-400">Fused Analytics Pipeline</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border">
            <div className="flex justify-between">
              <span>Active Study Area:</span>
              <span className="font-semibold text-slate-800">2,987.4 ha</span>
            </div>
            <div className="flex justify-between">
              <span>Sensor:</span>
              <span className="font-semibold text-slate-800">Sentinel-2 (10m)</span>
            </div>
            <div className="flex justify-between">
              <span>RAG Knowledge:</span>
              <span className="font-semibold text-emerald-700">Indexed & Active</span>
            </div>
            <div className="flex justify-between">
              <span>SQL Safety:</span>
              <span className="font-semibold text-sky-700">Structured Only</span>
            </div>
          </div>
        </div>

        {/* Suggested Queries */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-floating space-y-2 flex-1 overflow-y-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Suggested Analysis Prompts
          </span>
          <div className="space-y-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="w-full text-left p-3 rounded-xl text-xs bg-slate-50 hover:bg-sky-50 hover:text-sky-900 border border-slate-200 transition-all font-medium text-slate-700 leading-relaxed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-floating flex flex-col overflow-hidden">
        {/* Chat Feed Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ask GeoVision Assistant</h3>
              <p className="text-[11px] text-slate-400">Grounded Multi-Modal Geospatial Reasoning</p>
            </div>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-Hallucination Safe Mode
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isUser ? 'bg-slate-800 text-white' : 'bg-sky-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-2 flex-1">
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                      isUser
                        ? 'bg-slate-900 text-white font-medium rounded-tr-none'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {msg.text}
                    </div>

                    {/* Grounded Tool Badges */}
                    {msg.executedTools && msg.executedTools.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200/60 text-[10px]">
                        {msg.executedTools.map((tool, tIdx) => (
                          <span
                            key={tIdx}
                            className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-mono font-medium"
                          >
                            ⚙ {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Retrieved Citations Drawer */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="space-y-1.5 pl-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-sky-600" />
                        Grounded Literature Citations ({msg.citations.length}):
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {msg.citations.map((cit, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-sky-50/60 p-2 rounded-xl border border-sky-200/80 text-[11px] text-slate-700 space-y-1"
                          >
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>[{cIdx + 1}] {cit.document_name}</span>
                              <span className="text-emerald-700 font-mono">
                                Match: {(cit.similarity_score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="italic text-slate-600">"{cit.snippet}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-md">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl rounded-tl-none border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping"></span>
                <span>Fusing GIS analytics & retrieving grounded citations...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask GeoVision about NDVI metrics, LULC changes, buffer zones, or DIP theory..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask GeoVision</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
