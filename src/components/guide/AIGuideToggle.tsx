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
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (active) return;
    // Cancel any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Open after 300ms hover delay
    openTimeoutRef.current = setTimeout(() => setOpen(true), 300);
  };

  const handleMouseLeave = () => {
    // Cancel pending open if mouse left before it fired
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    // Delay close by 800ms so the user has time to reach the card
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 800);
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
      {/* pb-3 on outer wrapper bridges the gap to the avatar so hover doesn't break */}
      {open && !active && (
        <div
          className="absolute bottom-full right-0 pb-3 w-[280px]"
          style={{ animation: 'fadeSlideUp 200ms ease-out' }}
        >
        <div className="bg-white rounded-xl shadow-xl p-5 transition-all duration-200">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
            Pasirinkite
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onModeChange('guided');
                sessionStorage.setItem('ntd-guide-mode', 'guided');
                onStart();
                setOpen(false);
              }}
              className="group w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-white bg-[#0D7377] hover:bg-[#095456] active:bg-[#073f41] transition-all duration-150 border-none cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between"
            >
              <span>Naršyti padedant AI gidui?</span>
              <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </button>

            <button
              type="button"
              disabled
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 border border-dashed border-slate-200 cursor-not-allowed flex items-center justify-between"
            >
              <span>Su balso asistentu?</span>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                Greitai
              </span>
            </button>
          </div>
        </div>
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
