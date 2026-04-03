// P7-B1: Narration bubble — step content + navigation, smart positioning
import { useEffect, useState, useRef } from 'react';
import type { TourStep } from './types';

const MARGIN = 16;

export default function NarrationBubble({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onBack,
  onClose,
}: {
  step: TourStep;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);

    const update = () => {
      if (window.innerWidth < 640) {
        setIsMobile(true);
        setPos(null);
        return;
      }
      setIsMobile(false);

      const target = document.querySelector(step.selector);
      if (!target || !bubbleRef.current) return;

      const tr = target.getBoundingClientRect();
      const br = bubbleRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Prefer below the target
      let top = tr.bottom + MARGIN;
      let left = tr.left + tr.width / 2 - br.width / 2;

      // If below overflows viewport, place above
      if (top + br.height > vh - MARGIN) {
        top = tr.top - br.height - MARGIN;
      }
      // If above overflows, place to the right
      if (top < MARGIN) {
        top = tr.top + tr.height / 2 - br.height / 2;
        left = tr.right + MARGIN;
      }

      // Clamp within viewport
      left = Math.max(MARGIN, Math.min(left, vw - br.width - MARGIN));
      top = Math.max(MARGIN, Math.min(top, vh - br.height - MARGIN));

      setPos({ top, left });
    };

    // Initial + recalc
    requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step.selector]);

  const isLast = stepNumber === totalSteps;
  const isFirst = stepNumber === 1;

  const content = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-lg cursor-pointer bg-transparent border-none leading-none"
        aria-label="Uždaryti"
      >
        ×
      </button>
      <p className="text-sm text-slate-700 leading-relaxed pr-6 mb-3">{step.narration}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {stepNumber} iš {totalSteps}
        </span>
        <div className="flex items-center gap-3">
          {!isFirst && (
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer bg-transparent border-none"
            >
              ◀ Atgal
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="text-sm font-medium text-[#0D7377] hover:text-[#095456] cursor-pointer bg-transparent border-none"
          >
            {isLast ? 'Baigti ✓' : 'Toliau ▶'}
          </button>
        </div>
      </div>
    </>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl shadow-lg p-5">
        {content}
      </div>
    );
  }

  // Desktop: floating bubble
  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 bg-white rounded-xl shadow-lg p-5 max-w-sm transition-all duration-300"
      style={pos ? { top: pos.top, left: pos.left } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    >
      {content}
    </div>
  );
}
