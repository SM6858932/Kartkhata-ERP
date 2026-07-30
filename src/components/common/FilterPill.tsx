import React from 'react';
import { clsx } from 'clsx';

export interface FilterPillProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

const variantStyles: Record<string, { active: string; inactive: string }> = {
  default: {
    active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 dark:bg-indigo-600',
    inactive: 'bg-slate-100 text-slate-600 border border-slate-300 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-slate-200',
  },
  danger: {
    active: 'bg-rose-600 text-white shadow-md shadow-rose-600/30 dark:bg-rose-600',
    inactive: 'bg-slate-100 text-slate-600 border border-slate-300 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-slate-200',
  },
  success: {
    active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 dark:bg-emerald-600',
    inactive: 'bg-slate-100 text-slate-600 border border-slate-300 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-slate-200',
  },
  warning: {
    active: 'bg-orange-600 text-white shadow-md shadow-orange-600/30 dark:bg-orange-600',
    inactive: 'bg-slate-100 text-slate-600 border border-slate-300 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-slate-200',
  },
};

export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  count,
  isActive,
  onClick,
  variant = 'default',
}) => {
  const styles = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={clsx(
        'px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition active:scale-95',
        isActive ? styles.active : styles.inactive
      )}
    >
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  );
};
