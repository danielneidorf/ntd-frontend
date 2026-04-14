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

  // P7-B10: selection state for the segmented toggle.
  // 'guided' = "Be balso" (silent), 'voice' = "Su balsu" (voiced).
  const [selectedOption, setSelectedOption] = useState<'guided' | 'voice'>('guided');

  const handleStart = () => {
    onModeChange(selectedOption);
    sessionStorage.setItem('ntd-guide-mode', selectedOption);
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
          {/* P7-B10: unified guide selection card with voice toggle */}
          <div className="bg-white rounded-xl shadow-xl p-5">
            <p className="text-sm font-semibold text-[#1E3A5F] mb-3">
              Naršyti su gido pagalba
            </p>

            {/* Segmented toggle: Be balso / Su balsu */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 mb-3">
              <button
                type="button"
                onClick={() => setSelectedOption('guided')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-150 border-none cursor-pointer ${
                  selectedOption === 'guided'
                    ? 'bg-[#0D7377] text-white shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📖 Be balso
              </button>
              <button
                type="button"
                onClick={() => setSelectedOption('voice')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-150 border-none cursor-pointer ${
                  selectedOption === 'voice'
                    ? 'bg-[#0D7377] text-white shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                🎙 Su balsu
              </button>
            </div>

            {/* Dynamic description */}
            <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[2.5rem]">
              {selectedOption === 'guided'
                ? 'Gidas parodys kiekvieną ataskaitos dalį — skaitysite patys'
                : 'Gidas papasakos apie ataskaitą balsu ir atsakys į jūsų klausimus'}
            </p>

            {/* Single action button */}
            <button
              type="button"
              onClick={handleStart}
              className="group w-full text-center px-4 py-3 rounded-lg text-sm font-semibold text-white bg-[#0D7377] hover:bg-[#095456] active:bg-[#073f41] transition-all duration-150 border-none cursor-pointer shadow-sm hover:shadow-md"
            >
              Pradėti <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </button>
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
