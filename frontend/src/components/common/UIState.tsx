import React from 'react';
import { AlertCircle, RefreshCw, Layers, ShieldAlert, Sparkles, X, Info } from 'lucide-react';

/**
 * Clean Loading Spinner with customizable size and label
 */
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}> = ({ size = 'md', label, className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-slate-500 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-sky-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="loading"
      />
      {label && <p className="text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
};

/**
 * Skeleton Loader for cards, maps, and tables
 */
export const SkeletonLoader: React.FC<{
  type?: 'card' | 'text' | 'table' | 'map' | 'chart';
  count?: number;
  className?: string;
}> = ({ type = 'card', count = 1, className = '' }) => {
  const renderItem = (index: number) => {
    switch (type) {
      case 'text':
        return (
          <div key={index} className={`space-y-2 ${className}`}>
            <div className="h-3.5 bg-slate-200 rounded skeleton-shimmer w-3/4" />
            <div className="h-3 bg-slate-100 rounded skeleton-shimmer w-1/2" />
          </div>
        );
      case 'table':
        return (
          <div key={index} className={`space-y-2 p-3 bg-white rounded-xl border border-slate-200 ${className}`}>
            <div className="h-4 bg-slate-200 rounded skeleton-shimmer w-full" />
            <div className="h-3 bg-slate-100 rounded skeleton-shimmer w-5/6" />
            <div className="h-3 bg-slate-100 rounded skeleton-shimmer w-4/6" />
          </div>
        );
      case 'chart':
        return (
          <div key={index} className={`h-64 bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between ${className}`}>
            <div className="h-4 bg-slate-200 rounded skeleton-shimmer w-1/3" />
            <div className="h-40 bg-slate-100 rounded-xl skeleton-shimmer w-full" />
            <div className="h-3 bg-slate-200 rounded skeleton-shimmer w-1/2" />
          </div>
        );
      case 'map':
        return (
          <div key={index} className={`h-96 bg-slate-100 rounded-2xl border border-slate-200 p-6 flex items-center justify-center ${className}`}>
            <div className="flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-slate-300 animate-pulse" />
              <div className="h-3 bg-slate-200 rounded skeleton-shimmer w-32" />
            </div>
          </div>
        );
      case 'card':
      default:
        return (
          <div key={index} className={`p-5 bg-white rounded-2xl border border-slate-200 shadow-floating space-y-3 ${className}`}>
            <div className="h-3 bg-slate-200 rounded skeleton-shimmer w-1/3" />
            <div className="h-7 bg-slate-200 rounded skeleton-shimmer w-2/3" />
            <div className="h-3 bg-slate-100 rounded skeleton-shimmer w-1/2" />
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => renderItem(i))}
    </>
  );
};

/**
 * Clean Empty State with icon, title, description, and action button
 */
export const EmptyState: React.FC<{
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}> = ({
  icon: Icon = Layers,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-floating flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-xl border border-sky-200 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/**
 * Actionable Error Alert
 */
export const ErrorAlert: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Processing Anomaly Detected',
  message,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`p-4 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-rose-950">{title}</p>
          <p className="text-rose-700 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 font-bold bg-white text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-300 transition-all flex items-center gap-1 shadow-sm"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
};

/**
 * Demo Data Badge to transparently indicate sample dataset provenance
 */
export const DemoDataBadge: React.FC<{ label?: string; className?: string }> = ({
  label = 'Demo Dataset',
  className = ''
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 tracking-wide uppercase ${className}`}
      title="Verified sample dataset grounded in real Sentinel-2 satellite telemetry for demonstration"
    >
      <Info className="w-3 h-3 text-amber-600" />
      {label}
    </span>
  );
};

/**
 * Academic Foundation Reference Tag
 */
export const AcademicReferenceBadge: React.FC<{ reference: string; className?: string }> = ({
  reference,
  className = ''
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 ${className}`}
      title={reference}
    >
      <Sparkles className="w-3 h-3 text-sky-600" />
      <span className="truncate max-w-[200px]">{reference}</span>
    </span>
  );
};

/**
 * Accessible Reusable Modal Dialog
 */
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'xl'
}) => {
  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full ${maxWidthClass} bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
