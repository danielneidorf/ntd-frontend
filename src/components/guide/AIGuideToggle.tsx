// P7-B5.3: Floating AI Guide toggle — hover shows mode selector + chat card
import { useState, useRef, useEffect } from 'react';
import type { GuideMode, ChatMessage } from './types';
import RiveAvatar from './RiveAvatar';
import ChatInputCard from './ChatInputCard';

export default function AIGuideToggle({
  mode,
  onModeChange,
  onStart,
  onStop,
  active,
  standaloneChatHistory,
  standaloneChatLoading,
  onStandaloneChatSend,
  ttsAvailable,
  isSpeaking,
  isListening,
  voiceConciergeActive,
  userTranscript,
  aiResponseText,
}: {
  mode: GuideMode;
  onModeChange: (m: GuideMode) => void;
  onStart: () => void;
  onStop: () => void;
  active: boolean;
  standaloneChatHistory: ChatMessage[];
  standaloneChatLoading: boolean;
  onStandaloneChatSend: (message: string) => void;
  ttsAvailable: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  voiceConciergeActive?: boolean;
  userTranscript?: string;
  aiResponseText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
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
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    openTimeoutRef.current = setTimeout(() => setOpen(true), 300);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    // Don't close if input is focused or there's an active conversation
    if (inputFocused) return;
    const delay = standaloneChatHistory.length > 0 ? 3000 : 800;
    closeTimeoutRef.current = setTimeout(() => setOpen(false), delay);
  };

  const handleStart = () => {
    onModeChange('guided');
    sessionStorage.setItem('ntd-guide-mode', 'guided');
    onStart();
    setOpen(false);
  };

  // Keep open when chat input is focused
  const handleInputFocus = () => {
    setInputFocused(true);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };

  // Close on Escape when input is focused
  useEffect(() => {
    if (!inputFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInputFocused(false);
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputFocused]);

  return (
    <div
      className="fixed bottom-24 right-12 sm:bottom-24 sm:right-12 z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cards stack: mode selector + chat input */}
      {open && !active && (
        <div
          className="flex flex-col gap-2 mb-2 w-[280px]"
          style={{ animation: 'fadeSlideUp 200ms ease-out' }}
        >
          {/* Mode selector */}
          <div className="bg-white rounded-xl shadow-xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
              Pasirinkite
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleStart}
                className="group w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-white bg-[#0D7377] hover:bg-[#095456] active:bg-[#073f41] transition-all duration-150 border-none cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between"
              >
                <span>Naršyti padedant AI gidui?</span>
                <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </button>

              {ttsAvailable ? (
                <button
                  type="button"
                  onClick={() => {
                    onModeChange('voice');
                    sessionStorage.setItem('ntd-guide-mode', 'voice');
                    onStart();
                    setOpen(false);
                  }}
                  className="group w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-[#1E3A5F] bg-slate-50 hover:bg-[#0D7377] hover:text-white transition-all duration-150 border border-slate-200 hover:border-transparent cursor-pointer flex items-center justify-between"
                >
                  <span>🔊 Su balso asistentu</span>
                  <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                </button>
              ) : (
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
              )}
            </div>
          </div>

          {/* Standalone chat card */}
          <div onFocus={handleInputFocus} onBlur={handleInputBlur}>
            <ChatInputCard
              chatHistory={standaloneChatHistory}
              chatLoading={standaloneChatLoading}
              onSend={onStandaloneChatSend}
              showTriangle
              triangleDirection="down"
              avatarSize={128}
              voiceMode={mode === 'voice'}
              voiceConciergeActive={voiceConciergeActive}
              isListening={isListening}
              userTranscript={userTranscript}
              aiResponseText={aiResponseText}
            />
          </div>
        </div>
      )}

      <div className="relative">
        <RiveAvatar
          onClick={() => {
            if (active) {
              onStop();
            } else {
              setOpen(!open);
            }
          }}
          active={active}
          isSpeaking={isSpeaking}
        />

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

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
