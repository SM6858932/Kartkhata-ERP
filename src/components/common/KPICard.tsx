import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useReducedMotion } from 'framer-motion';

export interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { direction: 'up' | 'down'; percent: number };
  isLoading?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  valueSuffix?: string;
}

const variantStyles: Record<string, { iconBg: string; trendColor: string }> = {
  default: { iconBg: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400', trendColor: 'text-indigo-500' },
  success: { iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', trendColor: 'text-emerald-500' },
  danger: { iconBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400', trendColor: 'text-rose-500' },
  warning: { iconBg: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400', trendColor: 'text-orange-500' },
};

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon,
  trend,
  isLoading = false,
  variant = 'default',
  valueSuffix,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const styles = variantStyles[variant];

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-md">
        <div className="animate-pulse space-y-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border shadow-md bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center', styles.iconBg)}>
          {icon}
        </div>
        {trend && (
          <div className={clsx('flex items-center gap-0.5 text-xs font-bold', styles.trendColor)}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.percent}%</span>
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
        {label}
      </span>
      <p className="text-xl sm:text-2xl font-black font-outfit mt-0.5 text-slate-900 dark:text-white">
        {value}{valueSuffix && <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 ml-0.5">{valueSuffix}</span>}
      </p>
    </div>
  );
};
