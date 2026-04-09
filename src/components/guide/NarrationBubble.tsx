// P7-B5.1 / B5.3: Narration + chat as flex column pair above avatar
import { useState, useRef } from 'react';
import type { TourStep, ChatMessage } from './types';
import ChatInputCard from './ChatInputCard';

// Avatar geometry (must match AIGuideToggle.tsx)
const AVATAR_BOTTOM = 96;
const AVATAR_SIZE = 128;
const AVATAR_RIGHT = 48;
const GAP = 12;
const BUBBLE_BOTTOM = AVATAR_BOTTOM + AVATAR_SIZE + GAP;
const BUBBLE_RIGHT_LEFT = AVATAR_RIGHT + AVATAR_SIZE + GAP;

export default function NarrationBubble({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onBack,
  onClose,
  chatHistory,
  chatLoading,
  onChatSend,
  voiceMode,
  voiceConciergeActive,
  isListening,
  userTranscript,
  aiResponseText,
}: {
  step: TourStep;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  chatHistory: ChatMessage[];
  chatLoading: boolean;
  onChatSend: (message: string) => void;
  voiceMode?: boolean;
  voiceConciergeActive?: boolean;
  isListening?: boolean;
  userTranscript?: string;
  aiResponseText?: string;
}) {
  const isLast = stepNumber === totalSteps;
  const isFirst = stepNumber === 1;
  const [chatMode, setChatMode] = useState(false);

  // Reset chat mode when step changes
  const stepIdRef = useRef(step.id);
  if (step.id !== stepIdRef.current) {
    stepIdRef.current = step.id;
    if (chatMode) setChatMode(false);
  }

  const handleChatSend = (msg: string) => {
    setChatMode(true);
    onChatSend(msg);
  };

  const containerStyle: React.CSSProperties = isFirst
    ? { bottom: AVATAR_BOTTOM, right: BUBBLE_RIGHT_LEFT, maxHeight: `calc(100vh - ${AVATAR_BOTTOM + 16}px)` }
    : { bottom: BUBBLE_BOTTOM, right: AVATAR_RIGHT, maxHeight: `calc(100vh - ${BUBBLE_BOTTOM + 16}px)` };

  const widthClass = isFirst
    ? 'w-[min(320px,calc(100vw-32px))] sm:w-[320px]'
    : 'w-[min(280px,calc(100vw-32px))] sm:w-[280px]';

  return (
    <div className={`fixed z-[51] ${widthClass}`} style={containerStyle}>
      <div className="flex flex-col gap-2">
        {/* Narration card */}
        <div className="bg-white rounded-xl shadow-xl p-5 relative overflow-y-auto" style={{ maxHeight: 'calc(60vh)' }}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-lg cursor-pointer bg-transparent border-none leading-none z-10"
            aria-label="Uždaryti"
          >
            ×
          </button>

          {chatMode && chatHistory.length > 0 ? (
            <div className="space-y-3 mb-2">
              {chatHistory.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
                  <span className={`inline-block text-sm leading-relaxed px-3 py-1.5 rounded-lg max-w-[90%] ${
                    msg.role === 'user'
                      ? 'bg-[#0D7377] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {msg.content}
                  </span>
                </div>
              ))}
              {chatLoading && (
                <div>
                  <span className="inline-block text-sm text-slate-400 px-3 py-1.5 bg-slate-100 rounded-lg animate-pulse">
                    •••
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setChatMode(false)}
                className="text-xs text-[#0D7377] hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                ↩ Grįžti prie apžvalgos
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed pr-6 mb-2">{step.narration}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">{stepNumber} iš {totalSteps}</span>
            <div className="flex items-center gap-3">
              {!isFirst && (
                <button type="button" onClick={onBack}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 cursor-pointer bg-transparent border-none">
                  ◀ Atgal
                </button>
              )}
              <button type="button" onClick={onNext}
                className="text-sm font-medium text-[#0D7377] hover:text-[#095456] cursor-pointer bg-transparent border-none">
                {isLast ? 'Baigti ✓' : 'Toliau ▶'}
              </button>
            </div>
          </div>
        </div>

        {/* Chat card */}
        <ChatInputCard
          chatHistory={[]}
          chatLoading={chatLoading}
          onSend={handleChatSend}
          showTriangle
          triangleDirection={isFirst ? 'right' : 'down'}
          avatarSize={AVATAR_SIZE}
          voiceMode={voiceMode}
          voiceConciergeActive={voiceConciergeActive}
          isListening={isListening}
          userTranscript={userTranscript}
          aiResponseText={aiResponseText}
        />
      </div>
    </div>
  );
}
