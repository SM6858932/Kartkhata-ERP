import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'gold' | 'silver' | 'bronze' | 'neutral' | 'success' | 'danger' | 'warning';

export interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  icon?: React.ReactNode;
  pulsate?: boolean;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  gold: 'bg-amber-500/20 text-amber-300 border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300',
  silver: 'bg-slate-300/20 text-slate-200 border-slate-300/40 dark:bg-slate-300/20 dark:text-slate-200',
  bronze: 'bg-orange-600/20 text-orange-300 border-orange-600/40 dark:bg-orange-600/20 dark:text-orange-300',
  neutral: 'bg-slate-700 text-slate-400 border-slate-600 dark:bg-slate-700 dark:text-slate-400',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-400',
  danger: 'bg-rose-500/20 text-rose-400 border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-400',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  icon,
  pulsate = false,
  className,
}) => {
  return (
    <span
      className={clsx(
        'px-2.5 py-1 text-[10px] font-extrabold border rounded-lg inline-flex items-center gap-1',
        badgeStyles[variant],
        pulsate && 'animate-pulse',
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
};
