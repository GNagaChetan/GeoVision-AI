import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Users, Shield, ArrowRight, Globe, CheckCircle2 } from 'lucide-react';

export const AuthPortalPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08162B] text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Orbital Rings & Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#176B87]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-[#2E7D5B]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2">
          <Logo theme="dark" size="md" />
        </Link>
        <Link
          to="/"
          className="text-xs text-[#DDF3FA] hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-lg border border-white/10"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Selection Area */}
      <main className="max-w-4xl mx-auto px-6 py-12 w-full z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102A43] border border-[#176B87]/40 text-[#DDF3FA] text-xs font-medium mb-4">
          <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Secure Platform Access Portal</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Welcome to <span className="text-[#38BDF8]">GeoVision AI</span>
        </h1>
        <p className="text-slate-300 text-base max-w-xl mx-auto mb-12">
          Please select your access profile to enter your dedicated geospatial workspace.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* User Access Card */}
          <div className="bg-[#102A43]/80 border border-[#176B87]/30 hover:border-[#38BDF8]/60 transition-all duration-200 rounded-2xl p-8 flex flex-col justify-between shadow-xl backdrop-blur-sm group hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#176B87]/30 border border-[#176B87]/50 flex items-center justify-center mb-6 text-[#38BDF8]">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Public Land Intelligence</h2>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#78A86B] bg-[#2E7D5B]/20 border border-[#2E7D5B]/40 px-2.5 py-0.5 rounded-full">
                  Citizens & Researchers
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Designed for ordinary citizens, landowners, farmers, construction applicants, surveyors, and researchers to explore land, understand satellite imagery, and ask AI questions.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#78A86B]" />
                  <span>Interactive Map & Custom Area Boundary Drawing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#78A86B]" />
                  <span>Multimodal Vision AI for Satellite & Drone Photos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#78A86B]" />
                  <span>Land-cover classification & 5-year change detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#78A86B]" />
                  <span>Ask GeoVision AI plain-English questions & document citations</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/auth/user/login')}
              className="w-full py-3.5 px-4 rounded-xl font-semibold bg-[#176B87] hover:bg-[#1a7f9f] text-white flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-[#176B87]/30"
            >
              <span>Continue as User</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Administrator Access Card */}
          <div className="bg-[#0b1b31]/90 border border-[#1e3a5f] hover:border-[#D6BE8A]/60 transition-all duration-200 rounded-2xl p-8 flex flex-col justify-between shadow-xl backdrop-blur-sm group hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#D6BE8A]/10 border border-[#D6BE8A]/30 flex items-center justify-center mb-6 text-[#D6BE8A]">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Administrator Access</h2>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D6BE8A] bg-[#D6BE8A]/10 border border-[#D6BE8A]/30 px-2.5 py-0.5 rounded-full">
                  Admin Console
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Manage platform users, inspect processing services, review compute logs, and configure intelligence modules.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D6BE8A]" />
                  <span>Role-enforced administrative oversight</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D6BE8A]" />
                  <span>Real-time processing engine telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D6BE8A]" />
                  <span>Secure server-controlled provisioning</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/auth/admin/login')}
              className="w-full py-3.5 px-4 rounded-xl font-semibold bg-[#102A43] hover:bg-[#163657] border border-[#1e3a5f] hover:border-[#D6BE8A]/50 text-white flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-[#102A43]/50"
            >
              <span>Continue as Administrator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-xs text-slate-400 border-t border-white/5 z-10">
        GeoVision AI &copy; 2025. See the Earth. Understand the Change.
      </footer>
    </div>
  );
};
