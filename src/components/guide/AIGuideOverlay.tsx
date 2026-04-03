// P7-B1: Spotlight overlay — dims page, cuts out target element
import { useEffect, useState } from 'react';

const PADDING = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function AIGuideOverlay({
  targetSelector,
  animation,
  onClickOutside,
}: {
  targetSelector: string;
  animation?: string;
  onClickOutside: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(targetSelector);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
    };

    update();
    // Recompute on scroll/resize with debounce
    let raf = 0;
    const onUpdate = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onUpdate, true);
    window.addEventListener('resize', onUpdate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onUpdate, true);
      window.removeEventListener('resize', onUpdate);
    };
  }, [targetSelector]);

  if (!rect) return null;

  // Build clip-path polygon: full screen with rectangular hole
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const { top, left, width, height } = rect;
  const r = left + width;
  const b = top + height;

  const clipPath = `polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${left}px ${top}px, ${left}px ${b}px, ${r}px ${b}px, ${r}px ${top}px, ${left}px ${top}px
  )`;

  return (
    <>
      {/* Dark overlay with cutout */}
      <div
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          clipPath,
        }}
        onClick={onClickOutside}
      />

      {/* Teal glow border around cutout */}
      <div
        className="fixed z-40 pointer-events-none rounded-lg transition-all duration-300"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: '0 0 0 2px #0D7377, 0 0 16px rgba(13, 115, 119, 0.3)',
        }}
      />

      {/* Animation overlay on target */}
      {animation === 'pulse' && (
        <div
          className="fixed z-40 pointer-events-none rounded-lg"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            animation: 'guide-pulse 2s ease-in-out infinite',
          }}
        />
      )}
    </>
  );
}
