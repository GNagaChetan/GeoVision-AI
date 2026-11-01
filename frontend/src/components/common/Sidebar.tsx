import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  MapPin,
  Camera,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSelectedArea } from '../../context/SelectedAreaContext';

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Summary & vital indicators' },
  { path: '/satellite', label: 'Explore Map', icon: Map, description: 'Interactive satellite views' },
  { path: '/image-processing', label: 'Analyze Images', icon: Camera, description: 'Filters, bands & enhancements' },
  { path: '/change-detection', label: 'Compare Changes', icon: TrendingUp, description: '5-year landscape shifts' },
  { path: '/analytics', label: 'Insights', icon: BarChart3, description: 'Geospatial trends & metrics' },
  { path: '/ask-geovision', label: 'Ask GeoVision AI', icon: Sparkles, description: 'Plain English decision help', highlight: true },
  { path: '/reports', label: 'My Reports', icon: FileText, description: 'Automated executive briefs' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenProjects?: () => void;
  activeProjectName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onOpenProjects
}) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { selectedArea } = useSelectedArea();

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-300 min-h-[calc(100vh-65px)] select-none font-sans ${
        collapsed ? 'w-20 p-2.5' : 'w-64 p-3.5'
      }`}
    >
      {/* Top Nav Items */}
      <div className="space-y-4">
        {/* Workspace Quick Header */}
        {!collapsed && (
          <div className="px-2 pt-1 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Main Navigation
            </span>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {collapsed && onToggleCollapse && (
          <div className="flex justify-center pb-2">
            <button
              onClick={onToggleCollapse}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/satellite' && location.pathname === '/gis') ||
              (item.path === '/dashboard' &&
                (location.pathname === '/' ||
                  location.pathname === '/analytics' ||
                  location.pathname === '/lulc'));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`w-full text-left rounded-xl transition-all duration-150 flex items-center group relative ${
                  collapsed
                    ? 'justify-center p-3 my-1'
                    : 'justify-between px-3.5 py-3'
                } ${
                  isActive
                    ? 'bg-[#DDF3FA] text-[#08162B] font-bold border border-[#176B87]/40 shadow-xs'
                    : item.highlight
                    ? 'bg-[#DDF3FA]/30 hover:bg-[#DDF3FA]/60 text-[#102A43] font-semibold border border-[#176B87]/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#08162B] font-medium'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl transition-colors shrink-0 ${
                      isActive
                        ? 'bg-[#176B87] text-white shadow-xs'
                        : item.highlight
                        ? 'bg-[#102A43] text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!collapsed && (
                    <div className="min-w-0">
                      <span className="text-xs truncate font-bold block leading-tight">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5 truncate">{item.description}</span>
                    </div>
                  )}
                </div>

                {!collapsed && item.highlight && !isActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#176B87]/15 text-[#176B87] shrink-0">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Admin Navigation Option */}
          {isAdmin && (
            <div className="pt-2">
              {!collapsed && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D6BE8A]">
                  Administration
                </div>
              )}
              <NavLink
                to="/admin/dashboard"
                className={`w-full text-left rounded-xl transition-all duration-150 flex items-center group relative ${
                  collapsed ? 'justify-center p-3 my-1' : 'justify-between px-3.5 py-3'
                } ${
                  location.pathname === '/admin/dashboard'
                    ? 'bg-[#102A43] text-[#D6BE8A] font-bold border border-[#D6BE8A]/40'
                    : 'bg-[#102A43]/5 hover:bg-[#102A43]/10 text-slate-700 hover:text-slate-900 font-medium'
                }`}
                title={collapsed ? 'Admin Governance' : undefined}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 rounded-xl bg-[#D6BE8A]/20 text-[#D6BE8A] shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  {!collapsed && (
                    <div className="min-w-0">
                      <span className="text-xs truncate font-bold block leading-tight">Admin Console</span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5 truncate">
                        Platform telemetry & users
                      </span>
                    </div>
                  )}
                </div>
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Study Area Card */}
      {!collapsed ? (
        <div className="mt-auto pt-3 border-t border-slate-100 space-y-2">
          <div
            onClick={onOpenProjects}
            className="p-3 bg-[#F7FBFD] hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs space-y-1.5 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between text-slate-800 font-bold">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-[#176B87]" />
                Observing Area
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                selectedArea.isCustom
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {selectedArea.isCustom ? 'Custom' : 'Calibrated'}
              </span>
            </div>
            <p className="text-[#08162B] text-xs font-semibold truncate">
              {selectedArea.name}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
              <span>{selectedArea.areaHa.toLocaleString()} ha</span>
              <span className="text-[#176B87] font-bold group-hover:underline">Switch Area &rarr;</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-3 border-t border-slate-100 flex justify-center">
          <button
            onClick={onOpenProjects}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600"
            title={`Active Area: ${selectedArea.name}`}
          >
            <MapPin className="w-4 h-4 text-[#176B87]" />
          </button>
        </div>
      )}
    </aside>
  );
};
