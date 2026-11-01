import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  MapPin,
  ChevronDown,
  FileText,
  User,
  Shield,
  LogOut,
  LogIn
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { useSelectedArea } from '../../context/SelectedAreaContext';

interface HeaderProps {
  systemHealth: boolean;
  activeProjectName?: string;
  onOpenProjects: () => void;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  systemHealth,
  onOpenProjects
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { selectedArea, selectPreset } = useSelectedArea();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/ask-geovision?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-xs font-sans">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Location Selector */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <NavLink to="/dashboard" className="flex items-center space-x-2.5 group">
            <Logo size="md" theme="light" />
          </NavLink>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Location Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setRegionMenuOpen(!regionMenuOpen)}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 text-[#08162B] px-3.5 py-1.5 rounded-xl border border-slate-200 transition-all text-xs font-semibold text-left group"
              title="Change observing location"
            >
              <MapPin className="w-4 h-4 text-[#176B87] shrink-0" />
              <div className="min-w-0 max-w-[180px] sm:max-w-[220px]">
                <span className="text-[10px] text-slate-400 block leading-none">Observing Location</span>
                <span className="truncate text-xs font-bold text-[#08162B] block mt-0.5">{selectedArea.name}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-1 shrink-0" />
            </button>

            {regionMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setRegionMenuOpen(false)}
              >
                <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                  <p className="text-xs font-bold text-[#08162B]">Select Study Area</p>
                  <p className="text-[11px] text-slate-500">Explore satellite views for calibrated regions</p>
                </div>
                <button
                  onClick={() => {
                    selectPreset('hyderabad');
                    setRegionMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    selectedArea.id === 'hyderabad' ? 'bg-[#DDF3FA] text-[#176B87]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#176B87]" />
                    Hyderabad IT Corridor
                  </span>
                  {selectedArea.id === 'hyderabad' && (
                    <span className="text-[10px] bg-sky-100 px-1.5 py-0.5 rounded text-sky-700">Active</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    selectPreset('godavari');
                    setRegionMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    selectedArea.id === 'godavari' ? 'bg-[#DDF3FA] text-[#176B87]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    Godavari Basin
                  </span>
                  {selectedArea.id === 'godavari' && (
                    <span className="text-[10px] bg-cyan-100 px-1.5 py-0.5 rounded text-cyan-700">Active</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    selectPreset('bengaluru');
                    setRegionMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    selectedArea.id === 'bengaluru' ? 'bg-[#DDF3FA] text-[#176B87]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Bengaluru IT Corridor
                  </span>
                  {selectedArea.id === 'bengaluru' && (
                    <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-700">Active</span>
                  )}
                </button>

                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      navigate('/satellite');
                      setRegionMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#176B87] hover:bg-[#DDF3FA]/40 flex items-center justify-between"
                  >
                    <span>Draw or Search Custom Area...</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Plain-English Search */}
        <div className="flex-1 max-w-lg hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Ask anything about this area (e.g. How green is the canopy?)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#176B87] rounded-xl pl-9 pr-20 py-2 text-xs text-[#08162B] placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#176B87]/15"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <button
              type="submit"
              className="absolute right-1.5 top-1 bg-[#176B87] hover:bg-[#135870] text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3 h-3" />
              Ask AI
            </button>
          </form>
        </div>

        {/* Right: Actions & User Session */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Quick Direct Link to AI Assistant */}
          <NavLink
            to="/ask-geovision"
            className="hidden sm:flex items-center space-x-1.5 bg-[#DDF3FA]/70 hover:bg-[#DDF3FA] text-[#102A43] border border-[#176B87]/30 px-3 py-1.5 rounded-xl font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#176B87]" />
            <span>Ask GeoVision AI</span>
          </NavLink>

          {/* Quick Direct Link to Reports */}
          <NavLink
            to="/reports"
            className="hidden lg:flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>My Reports</span>
          </NavLink>

          {/* Engine Status Indicator */}
          <div
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl font-semibold border text-[11px] bg-emerald-50 text-emerald-800 border-emerald-200"
            title="Satellite Intelligence Engine Operational"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready</span>
          </div>

          {/* Authentication Session / User Profile Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#102A43] text-white flex items-center justify-center font-bold text-xs">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-bold text-[#08162B] leading-tight truncate max-w-[120px]">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="p-3 border-b border-slate-100 bg-[#F7FBFD] rounded-xl mb-1">
                    <p className="font-bold text-[#08162B]">{user.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#176B87] bg-[#DDF3FA] px-2 py-0.5 rounded">
                      {user.role} scope
                    </span>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-xl font-semibold text-[#08162B] hover:bg-[#DDF3FA] flex items-center gap-2 transition-colors mb-1"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#D6BE8A]" />
                      <span>Admin Governance</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 bg-[#102A43] hover:bg-[#163657] text-white px-3.5 py-1.5 rounded-xl font-semibold transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
