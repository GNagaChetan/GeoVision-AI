import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Layers,
  Activity,
  SlidersHorizontal,
  Map,
  BookOpen,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  category: 'Processing' | 'GIS' | 'RAG' | 'System';
  read: boolean;
  actionPath?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'FastAPI Geospatial Engines Synchronized',
    message: 'DIP OpenCV engine, Rasterio Remote Sensing, and Shapely Geodesic calculators initialized successfully.',
    timestamp: '2 mins ago',
    category: 'System',
    read: false
  },
  {
    id: 'n2',
    title: 'Sentinel-2 Multi-spectral Bands Cached',
    message: 'Bands 2, 3, 4, 8, and 11 loaded at 10m Ground Sample Distance (EPSG:4326).',
    timestamp: '15 mins ago',
    category: 'Processing',
    read: false
  },
  {
    id: 'n3',
    title: 'Geodesic Buffer Calculator Ready',
    message: 'WGS84 ellipsoidal geometry engine configured with dynamic local UTM projection.',
    timestamp: '1 hour ago',
    category: 'GIS',
    read: true
  },
  {
    id: 'n4',
    title: 'RAG Academic Literature Indexed',
    message: 'Pre-loaded 4 core textbooks (Gonzalez & Woods, Lillesand RS) into 68 vector chunks.',
    timestamp: '2 hours ago',
    category: 'RAG',
    read: true
  }
];

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<'All' | 'Processing' | 'GIS' | 'RAG' | 'System'>('All');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => filter === 'All' || n.category === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Processing': return SlidersHorizontal;
      case 'GIS': return Map;
      case 'RAG': return BookOpen;
      default: return Activity;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[10px] font-extrabold bg-sky-600 text-white px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">Pipeline telemetry and system events</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs bg-white">
          <div className="flex items-center space-x-1">
            {(['All', 'Processing', 'GIS', 'System'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filter === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <button
              onClick={markAllAsRead}
              className="text-sky-700 hover:text-sky-800 font-semibold flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Read all
            </button>
            <span className="text-slate-200">•</span>
            <button
              onClick={clearAll}
              className="text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
              <Bell className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-semibold">No notifications in this category</p>
            </div>
          ) : (
            filtered.map(item => {
              const Icon = getCategoryIcon(item.category);
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                    item.read
                      ? 'bg-white border-slate-200/80 text-slate-700'
                      : 'bg-sky-50/40 border-sky-200/90 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <Icon className="w-3.5 h-3.5 text-sky-600" />
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.message}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="font-semibold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-sky-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center text-xs text-slate-500">
          GeoVision AI Continuous Event Monitor
        </div>
      </div>
    </div>
  );
};
