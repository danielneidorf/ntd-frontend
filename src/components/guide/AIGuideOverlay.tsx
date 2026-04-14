// P7-B1 / P7-B2: Spotlight overlay — dims page, cuts out target element
// Adapts cutout to include overflow children (e.g. autocomplete dropdowns)
import { useEffect, useState, useRef } from 'react';

const PADDING = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Compute the visual bounds of an element including any visible overflow children
 * (absolutely positioned dropdowns, tooltips, autocomplete suggestions, etc.)
 */
function getVisualBounds(el: Element): DOMRect {
  const base = el.getBoundingClientRect();
  let top = base.top;
  let left = base.left;
  let right = base.right;
  let bottom = base.bottom;

  // Check all descendants for overflow
  const children = el.querySelectorAll('*');
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const cs = window.getComputedStyle(child);
    // Only check positioned elements that might overflow
    if (cs.position === 'absolute' || cs.position === 'fixed') {
      const cr = child.getBoundingClientRect();
      // Only include if the child is visible (has size and isn't hidden)
      if (cr.width > 0 && cr.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden') {
        top = Math.min(top, cr.top);
        left = Math.min(left, cr.left);
        right = Math.max(right, cr.right);
        bottom = Math.max(bottom, cr.bottom);
      }
    }
  }

  return new DOMRect(left, top, right - left, bottom - top);
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
  const rafRef = useRef(0);

  useEffect(() => {
    const update = () => {
      // Support comma-separated selectors — compute union bounding rect
      const selectors = targetSelector.split(',').map((s) => s.trim());
      let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
      let found = false;

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) continue;
        found = true;
        const r = getVisualBounds(el);
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      }

      if (!found) {
        setRect(null);
        return;
      }
      setRect({
        top: top - PADDING,
        left: left - PADDING,
        width: right - left + PADDING * 2,
        height: bottom - top + PADDING * 2,
      });
    };

    update();

    // Continuous polling via rAF — catches dropdowns, animations, any DOM change
    let running = true;
    const poll = () => {
      if (!running) return;
      update();
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);

    // Also listen to scroll/resize for immediate response
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [targetSelector]);

  if (!rect) return null;

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
