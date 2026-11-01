import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import { DemoDataBadge } from './UIState';

export interface KPICardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  unit?: string;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  icon?: React.ElementType;
  colorScheme?: 'sky' | 'emerald' | 'indigo' | 'amber' | 'cyan' | 'slate' | 'rose';
  isDemo?: boolean;
  tooltip?: string;
  progressPercent?: number;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subvalue,
  unit,
  trend,
  icon: Icon,
  colorScheme = 'sky',
  isDemo = false,
  tooltip,
  progressPercent,
  className = ''
}) => {
  const schemeStyles = {
    sky: {
      border: 'border-slate-200/90 hover:border-sky-300',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
      valueColor: 'text-slate-900',
      progressBg: 'bg-sky-500'
    },
    emerald: {
      border: 'border-slate-200/90 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      valueColor: 'text-slate-900',
      progressBg: 'bg-emerald-500'
    },
    indigo: {
      border: 'border-slate-200/90 hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      valueColor: 'text-slate-900',
      progressBg: 'bg-indigo-500'
    },
    amber: {
      border: 'border-slate-200/90 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      valueColor: 'text-slate-900',
      progressBg: 'bg-amber-500'
    },
    cyan: {
      border: 'border-slate-200/90 hover:border-cyan-300',
      iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
      valueColor: 'text-slate-900',
      progressBg: 'bg-cyan-500'
    },
    slate: {
      border: 'border-slate-200/90 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
      valueColor: 'text-slate-900',
      progressBg: 'bg-slate-600'
    },
    rose: {
      border: 'border-slate-200/90 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      valueColor: 'text-slate-900',
      progressBg: 'bg-rose-500'
    }
  }[colorScheme];

  return (
    <div
      className={`bg-white rounded-2xl p-5 border ${schemeStyles.border} shadow-floating hover:shadow-elevated transition-all duration-200 flex flex-col justify-between space-y-3 relative group ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {Icon && (
            <div className={`p-2 rounded-xl ${schemeStyles.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {isDemo && <DemoDataBadge label="Demo" />}
          {tooltip && (
            <div className="relative group/tooltip">
              <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-help" />
              <div className="absolute right-0 bottom-full mb-1 hidden group-hover/tooltip:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-20 pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="space-y-1">
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-2xl sm:text-3xl font-extrabold ${schemeStyles.valueColor} tracking-tight font-mono`}>
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
        </div>

        {subvalue && (
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {subvalue}
          </p>
        )}
      </div>

      {/* Optional Progress Bar or Trend */}
      {(progressPercent !== undefined || trend) && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          {progressPercent !== undefined && (
            <div className="w-full space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>Coverage</span>
                <span>{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${schemeStyles.progressBg} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            </div>
          )}

          {trend && (
            <div className="flex items-center space-x-1.5">
              <span
                className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  trend.isNeutral
                    ? 'bg-slate-100 text-slate-600'
                    : trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {trend.isNeutral ? (
                  <Minus className="w-3 h-3 mr-0.5" />
                ) : trend.isPositive ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {trend.value}
              </span>
              {trend.label && (
                <span className="text-[11px] text-slate-400 font-medium">{trend.label}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
