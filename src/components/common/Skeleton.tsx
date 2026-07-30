import React from 'react';
import { clsx } from 'clsx';

type SkeletonVariant = 'card' | 'text' | 'avatar' | 'listItem' | 'circle';

export interface SkeletonProps {
  variant: SkeletonVariant;
  count?: number;
  className?: string;
}

const variantClasses: Record<SkeletonVariant, string> = {
  card: 'h-28 w-full rounded-2xl',
  text: 'h-4 w-full rounded',
  avatar: 'h-10 w-10 rounded-xl',
  circle: 'h-9 w-9 rounded-full',
  listItem: 'h-16 w-full rounded-xl',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant,
  count = 1,
  className,
}) => {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={clsx(
            'animate-pulse bg-slate-200 dark:bg-slate-700/80',
            variantClasses[variant],
            className
          )}
          aria-hidden="true"
        />
      ))}
    </>
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
    <div className="animate-pulse space-y-3">
      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      >
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
