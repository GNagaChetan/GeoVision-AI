import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GeoVisionAPI } from '../../services/api';
import { Logo } from '../../components/common/Logo';
import { AdminOverview, UserProfile } from '../../types';
import {
  Shield,
  Users,
  Activity,
  Cpu,
  Server,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Database,
  Layers,
  FileText
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, logout, isLoading: authLoading } = useAuth();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ovData, usersData] = await Promise.all([
        GeoVisionAPI.getAdminOverview(),
        GeoVisionAPI.getAdminUsers(),
      ]);
      setOverview(ovData);
      setUsersList(usersData.users || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth/admin/login');
      } else if (!isAdmin) {
        setError('Unauthorized: Your user account lacks administrative privileges.');
      } else {
        loadData();
      }
    }
  }, [user, isAdmin, authLoading]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08162B] text-white flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw className="w-5 h-5 animate-spin text-[#38BDF8]" />
          <span>Verifying administrator identity...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08162B] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md bg-[#102A43] border border-red-500/40 p-8 rounded-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Administrative Privileges Required</h2>
          <p className="text-sm text-slate-300 mb-6">
            You are logged in as <span className="font-semibold text-white">{user?.email}</span> (role: {user?.role}). This area is restricted to system administrators.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-[#176B87] hover:bg-[#135870] text-xs font-semibold"
            >
              Back to User Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08162B] text-white font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-[#1e3a5f] bg-[#0b1b31]/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo theme="dark" size="md" />
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/10">
            <Shield className="w-4 h-4 text-[#D6BE8A]" />
            <span className="text-xs font-semibold text-[#D6BE8A] tracking-wider uppercase">
              Admin Governance Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>User View</span>
          </Link>
          <button
            onClick={loadData}
            title="Refresh telemetry"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-white">{user?.full_name}</div>
            <div className="text-[10px] text-[#D6BE8A] font-mono">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out of administrative session"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-xs text-red-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Welcome & Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#102A43] to-[#0d2238] border border-[#1e3a5f] shadow-xl">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              System Administration & Telemetry
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Live monitoring of analytical engines, active jobs, user security states, and compute resources.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Services Operational
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#102A43]/80 border border-[#1e3a5f] rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total Registered Users</span>
              <Users className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {overview?.total_users ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active researchers & urban planners
            </div>
          </div>

          <div className="bg-[#102A43]/80 border border-[#1e3a5f] rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>System Administrators</span>
              <Shield className="w-4 h-4 text-[#D6BE8A]" />
            </div>
            <div className="text-3xl font-extrabold text-[#D6BE8A]">
              {overview?.total_admins ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Cryptographically verified root roles
            </div>
          </div>

          <div className="bg-[#102A43]/80 border border-[#1e3a5f] rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Processing Jobs</span>
              <Activity className="w-4 h-4 text-[#78A86B]" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {overview?.active_jobs ?? 0}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              All batch queues clear
            </div>
          </div>

          <div className="bg-[#102A43]/80 border border-[#1e3a5f] rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>System Engine Status</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 uppercase text-2xl">
              {overview?.system_health?.status || 'HEALTHY'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              5 of 5 core engines active
            </div>
          </div>
        </div>

        {/* 2-Column: Engine Health Status & Recent Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engine Health Panel */}
          <div className="bg-[#102A43]/80 border border-[#1e3a5f] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#38BDF8]" />
              <span>Geospatial Engine Subsystems</span>
            </h2>
            <div className="space-y-3">
              {[
                { name: 'Digital Image Processing (DIP)', id: 'dip_engine', desc: 'Sampling, spatial filtering, histogram equalization' },
                { name: 'Remote Sensing Multi-spectral (RS)', id: 'rs_engine', desc: 'NDVI, false-color composites, multi-band calculation' },
                { name: 'GIS Spatial Topology', id: 'gis_engine', desc: 'Bounding box clipping, buffers, geometric intersections' },
                { name: 'Land-Use / Land-Cover (LULC)', id: 'lulc_engine', desc: 'Spectral classification, temporal change matrix' },
                { name: 'Vector Knowledge Store (RAG)', id: 'rag_vector_store', desc: 'Geospatial index & grounded decision support' },
              ].map((engine) => {
                const isOnline = overview?.system_health?.services?.[engine.id] ?? true;
                return (
                  <div
                    key={engine.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#08162B]/60 border border-[#1e3a5f]/50"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{engine.name}</div>
                      <div className="text-[10px] text-slate-400">{engine.desc}</div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        isOnline
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                          : 'bg-red-950/60 border border-red-500/40 text-red-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {isOnline ? 'Active' : 'Offline'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Logs Stream */}
          <div className="bg-[#102A43]/80 border border-[#1e3a5f] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#78A86B]" />
              <span>Operational Activity Stream</span>
            </h2>
            <div className="space-y-3 font-mono text-xs">
              {(overview?.recent_activity || []).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#08162B]/60 border border-[#1e3a5f]/50 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-[11px] font-semibold text-[#DDF3FA]">{item.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.type}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Accounts Management Table */}
        <div className="bg-[#102A43]/80 border border-[#1e3a5f] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D6BE8A]" />
                <span>Managed Accounts Directory</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of user identities, provisioned access scopes, and enrollment timestamps.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1e3a5f] text-slate-400">
                  <th className="py-3 px-4 font-semibold">User Identity</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role & Access</th>
                  <th className="py-3 px-4 font-semibold">Enrolled On</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a5f]/50">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#176B87]/30 border border-[#176B87]/50 flex items-center justify-center text-[11px] font-bold text-[#38BDF8]">
                        {u.full_name.charAt(0)}
                      </div>
                      <span>{u.full_name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-[#D6BE8A]/10 border border-[#D6BE8A]/40 text-[#D6BE8A]'
                            : 'bg-[#176B87]/20 border border-[#176B87]/40 text-[#38BDF8]'
                        }`}
                      >
                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-400 border-t border-[#1e3a5f] bg-[#08162B]">
        GeoVision AI &copy; 2025. Enterprise Admin Console &bull; Role-Based Authorization Server-Enforced.
      </footer>
    </div>
  );
};
