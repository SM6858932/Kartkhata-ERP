import { useCallback, useRef } from 'react';

export function useRipple() {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  const createRipple = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      top: ${y}px;
      left: ${x}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      transform: scale(0);
      animation: ripple-effect 0.5s ease-out forwards;
      pointer-events: none;
    `;
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }, []);

  return { ref, createRipple };
}
