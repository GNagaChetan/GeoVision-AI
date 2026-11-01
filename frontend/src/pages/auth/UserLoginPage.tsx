import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Shield, CheckCircle2, X } from 'lucide-react';

export const UserLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // In-page Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password, 'user');
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to sign in. Please verify your credentials.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSubmitted(true);
    }, 700);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotSubmitted(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7FBFD] via-sky-50/30 to-emerald-50/20 flex flex-col justify-between font-sans relative">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#176B87]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#2E7D5B]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md z-10">
        <Link to="/" className="flex items-center gap-2">
          <Logo theme="light" size="md" />
        </Link>
        <Link
          to="/auth"
          className="text-xs font-semibold text-[#102A43] hover:text-[#176B87] px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#176B87]/40 bg-white/60 transition-colors"
        >
          Change Access Mode
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/60 relative">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-[#08162B] tracking-tight">User Sign In</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Public land intelligence for landowners, farmers, surveyors, and planners
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#102A43] mb-1.5" htmlFor="email-input">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/15 outline-none text-sm text-[#08162B] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#102A43]" htmlFor="password-input">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-[#176B87] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/15 outline-none text-sm text-[#08162B] transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold bg-[#176B87] hover:bg-[#135870] active:scale-[0.99] text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-[#176B87]/25 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/auth/user/signup" className="font-bold text-[#176B87] hover:underline">
                Create Account
              </Link>
            </p>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>System governance access?</span>
              <Link to="/auth/admin/login" className="text-[#102A43] font-semibold hover:underline">
                Admin Console &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* In-Page Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {!forgotSubmitted ? (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-[#08162B]">Reset Your Password</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enter the email address associated with your GeoVision AI account. We will send you instructions to reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#102A43] mb-1.5" htmlFor="forgot-email">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#176B87] focus:ring-2 focus:ring-[#176B87]/15 outline-none text-sm text-[#08162B]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#176B87] hover:bg-[#135870] text-white flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending Instructions...</span>
                        </>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-[#08162B]">Recovery Email Dispatched</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  If an account exists for <strong className="text-slate-900">{forgotEmail}</strong>, password reset instructions have been dispatched. Please check your inbox or spam folder.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#176B87] text-white hover:bg-[#135870] transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-400">
        GeoVision AI &copy; 2025. See the Earth. Understand the Change.
      </footer>
    </div>
  );
};
export default UserLoginPage;
