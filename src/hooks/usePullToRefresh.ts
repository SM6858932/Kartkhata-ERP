import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  pullStartY: number;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const pulling = useRef(false);

  const onTouchStartCb = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMoveCb = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, threshold * 1.5));
    }
  }, [threshold]);

  const onTouchEndCb = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      Promise.resolve(onRefresh()).finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    pullStartY: pullStartY.current,
    onTouchStart: onTouchStartCb,
    onTouchMove: onTouchMoveCb,
    onTouchEnd: onTouchEndCb,
  };
}
