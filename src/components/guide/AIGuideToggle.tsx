// P7-B1: Floating mode selector toggle
import { useState } from 'react';
import type { GuideMode } from './types';

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

  const handleStart = () => {
    if (mode === 'guided') {
      sessionStorage.setItem('ntd-guide-mode', mode);
      onStart();
    }
    setOpen(false);
  };

  // When tour is active, show stop button
  if (active) {
    return (
      <button
        type="button"
        onClick={() => { onStop(); setOpen(false); }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#0D7377] text-white shadow-lg flex items-center justify-center cursor-pointer border-none hover:bg-[#095456] transition-colors text-lg"
        title="Uždaryti gidą"
      >
        ✕
      </button>
    );
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#0D7377] text-white shadow-lg flex items-center justify-center cursor-pointer border-none hover:bg-[#095456] transition-colors text-xl"
        title="AI gidas"
      >
        💬
      </button>

      {/* Mode selector panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-6 z-50 bg-white rounded-xl shadow-xl p-5 w-[280px]">
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
        </>
      )}
    </>
  );
}
