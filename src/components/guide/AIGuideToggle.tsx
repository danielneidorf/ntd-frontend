// P7-B1.2: Floating AI Guide toggle — hover-to-open mode selector
import { useState, useRef, useEffect } from 'react';
import type { GuideMode } from './types';
import RiveAvatar from './RiveAvatar';

export default function AIGuideToggle({
  mode,
  onModeChange,
  onStart,
  onStop,
  active,
}: {
  mode: GuideMode;
  onModeChange: (m: GuideMode) => void;
  onStart: () => void;
  onStop: () => void;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (active) return;
    hoverTimeoutRef.current = setTimeout(() => setOpen(true), 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setOpen(false);
  };

  const handleStart = () => {
    if (mode === 'guided') {
      sessionStorage.setItem('ntd-guide-mode', mode);
      onStart();
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed bottom-24 right-12 sm:bottom-24 sm:right-12 z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Mode selector dropdown — opens upward, fade-in animation */}
      {open && !active && (
        <div
          className="absolute bottom-full right-0 mb-3 bg-white rounded-xl shadow-xl p-5 w-[280px] transition-all duration-200"
          style={{ animation: 'fadeSlideUp 200ms ease-out' }}
        >
          <p className="text-base font-semibold text-[#1E3A5F] mb-3">
            Kaip norite naudotis?
          </p>

          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input
              type="radio"
              name="guide-mode"
              checked={mode === 'self'}
              onChange={() => onModeChange('self')}
              className="accent-[#0D7377]"
            />
            <span className="text-sm text-slate-700">Savarankiškai</span>
          </label>

          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input
              type="radio"
              name="guide-mode"
              checked={mode === 'guided'}
              onChange={() => onModeChange('guided')}
              className="accent-[#0D7377]"
            />
            <span className="text-sm text-slate-700">Su AI gidu</span>
          </label>

          <label className="flex items-center gap-3 py-2 cursor-not-allowed opacity-50">
            <input
              type="radio"
              name="guide-mode"
              disabled
              className="accent-[#0D7377]"
            />
            <span className="text-sm text-slate-500">
              Balso asistentas{' '}
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                Greitai!
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={handleStart}
            disabled={mode === 'self'}
            className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer ${
              mode === 'guided'
                ? 'bg-[#0D7377] text-white hover:bg-[#095456]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Pradėti ▶
          </button>
        </div>
      )}

      <div className="relative">
        {/* Rive avatar */}
        <RiveAvatar
          onClick={() => {
            if (active) {
              onStop();
            } else {
              setOpen(!open);
            }
          }}
          active={active}
        />

        {/* "Stop tour" label when active */}
        {active && (
          <button
            type="button"
            onClick={onStop}
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-600 text-white text-xs flex items-center justify-center cursor-pointer border-none hover:bg-slate-800 transition-colors"
            title="Uždaryti gidą"
          >
            ✕
          </button>
        )}
      </div>

      {/* Fade-slide animation */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
