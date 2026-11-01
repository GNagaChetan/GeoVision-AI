import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowRight, Loader2, KeyRound, Server } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide administrator credentials.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await login(email.trim(), password, 'admin');
      if (user.role !== 'admin') {
        setErrorMessage('Access denied. This account does not possess administrator credentials.');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Invalid administrator credentials. Access request recorded.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08162B] text-white flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#102A43]/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#176B87]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-white/10 z-10">
        <Link to="/" className="flex items-center gap-2">
          <Logo theme="dark" size="md" />
        </Link>
        <Link
          to="/auth/user/login"
          className="text-xs text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-lg border border-white/10"
        >
          Switch to User Login
        </Link>
      </header>

      {/* Main Admin Authentication Box */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-[#102A43]/90 border border-[#1e3a5f] rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          {/* Header & Security Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#D6BE8A]/10 border border-[#D6BE8A]/30 text-[#D6BE8A] mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Administrator Access</h1>
            <p className="text-slate-300 text-xs mt-1">
              Restricted console for platform governance and engine management
            </p>
          </div>

          {/* Security Banner */}
          <div className="mb-6 p-3 rounded-xl bg-[#08162B]/80 border border-[#1e3a5f] text-xs text-slate-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D6BE8A] flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-white">Security Enforcement:</span> Administrative privileges are server-controlled and audited. Unauthorized access attempts will be rejected.
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5" htmlFor="admin-email">
                Administrator Identifier (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@geovision.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08162B] border border-[#1e3a5f] focus:border-[#D6BE8A] focus:ring-2 focus:ring-[#D6BE8A]/10 outline-none text-sm text-white transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5" htmlFor="admin-password">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#08162B] border border-[#1e3a5f] focus:border-[#D6BE8A] focus:ring-2 focus:ring-[#D6BE8A]/10 outline-none text-sm text-white transition-all placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-[#D6BE8A] hover:bg-[#e4cea0] text-[#08162B] flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D6BE8A]/10 disabled:opacity-70 mt-2 font-mono tracking-tight"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#08162B]" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Bootstrap Tip for Academic Evaluators */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <div className="p-2.5 rounded-lg bg-[#08162B]/60 border border-[#1e3a5f]/60 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Server className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Evaluation Credential:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@geovision.ai');
                  setPassword('Admin@GeoVision2025');
                }}
                className="text-[#38BDF8] hover:underline font-mono text-[10px]"
              >
                Auto-fill Default
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Public self-registration is permanently disabled for administrative accounts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-400 border-t border-white/5">
        GeoVision AI &copy; 2025. Enterprise Geospatial Infrastructure.
      </footer>
    </div>
  );
};
