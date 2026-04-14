// P7-B5.3 / B7: Chat input card with mic button for voice mode
import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from './types';
import { sttService, transcribeAudio } from '../../lib/sttService';
import { analytics } from '../../lib/guideAnalytics';

const MAX_EXPANDED = '400px';

export default function ChatInputCard({
  chatHistory,
  chatLoading,
  onSend,
  showTriangle,
  triangleDirection,
  avatarSize,
  voiceMode,
  voiceConciergeActive,
  isListening,
  userTranscript,
  aiResponseText,
}: {
  chatHistory: ChatMessage[];
  chatLoading: boolean;
  onSend: (message: string) => void;
  showTriangle?: boolean;
  triangleDirection?: 'down' | 'right';
  avatarSize?: number;
  voiceConciergeActive?: boolean;
  isListening?: boolean;
  userTranscript?: string;
  aiResponseText?: string;
  voiceMode?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');
  const [hovered, setHovered] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const msg = inputValue.trim();
    if (!msg || chatLoading) return;
    setInputValue('');
    setHovered(true);
    analytics.track('chat_message');
    onSend(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording → transcribe → auto-send
      setIsRecording(false);
      setIsTranscribing(true);
      setHovered(true);

      try {
        const audioBlob = await sttService.stopRecording();
        const transcription = await transcribeAudio(audioBlob);
        setIsTranscribing(false);

        if (transcription) {
          onSend(transcription);
        }
      } catch {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      try {
        await sttService.startRecording();
        setIsRecording(true);
        setHovered(true);

        // Auto-stop after 60 seconds
        setTimeout(() => {
          if (sttService.isRecording) {
            handleMicClick();
          }
        }, 60000);
      } catch {
        // Mic permission denied or not available
      }
    }
  };

  // Auto-scroll to bottom when new messages arrive while expanded
  useEffect(() => {
    if (threadRef.current && hovered) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [chatHistory.length, hovered]);

  useEffect(() => {
    if (chatLoading) setHovered(true);
  }, [chatLoading]);

  const hasConversation = chatHistory.length > 0;
  const size = avatarSize ?? 128;
  const isCollapsed = !hovered && hasConversation;

  return (
    <div
      className="bg-white rounded-xl shadow-xl relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!chatLoading && !isRecording) setHovered(false); }}
    >
      {/* Conversation thread */}
      {hasConversation && (
        <div
          ref={threadRef}
          className="px-4 pt-3 pb-1 overflow-y-auto space-y-2 transition-all duration-300"
          style={{ maxHeight: isCollapsed ? '72px' : MAX_EXPANDED }}
        >
          {isCollapsed ? (
            <>
              {chatHistory.length >= 2 && chatHistory[chatHistory.length - 2]?.role === 'user' && (
                <div className="text-right">
                  <span className="inline-block text-xs leading-relaxed px-2.5 py-1 rounded-lg max-w-[90%] bg-[#0D7377] text-white truncate">
                    {chatHistory[chatHistory.length - 2].content}
                  </span>
                </div>
              )}
              <div>
                <span className="inline-block text-xs leading-relaxed px-2.5 py-1 rounded-lg max-w-[90%] bg-slate-100 text-slate-700 line-clamp-2">
                  {chatHistory[chatHistory.length - 1]?.content}
                </span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* Input row */}
      <div className={`px-4 py-3 flex items-center gap-2 ${hasConversation ? 'border-t border-slate-100' : ''}`}>
        {voiceConciergeActive ? (
          // Voice concierge mode — show live state indicators
          isListening ? (
            <>
              <span className="text-red-500 text-sm shrink-0 animate-pulse">🔴</span>
              <span className="flex-1 text-sm text-slate-600">
                {userTranscript || 'Klausau...'}
              </span>
            </>
          ) : aiResponseText ? (
            <>
              <span className="text-[#0D7377] text-sm shrink-0">🔊</span>
              <span className="flex-1 text-sm text-slate-700">{aiResponseText}</span>
            </>
          ) : (
            <>
              <span className="text-green-500 text-sm shrink-0 animate-pulse">🟢</span>
              <span className="flex-1 text-sm text-slate-500">Klausau — kalbėkite...</span>
            </>
          )
        ) : isRecording ? (
          // B7 click-to-record mode (fallback)
          <>
            <span className="text-red-500 text-sm shrink-0 animate-pulse">🔴</span>
            <span className="flex-1 text-sm text-slate-500">Klausau...</span>
            <button
              type="button"
              onClick={handleMicClick}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-all text-xs"
            >
              ⏹
            </button>
          </>
        ) : isTranscribing ? (
          <>
            <span className="text-slate-400 text-sm shrink-0">⏳</span>
            <span className="flex-1 text-sm text-slate-500 animate-pulse">Atpažįstame...</span>
          </>
        ) : (
          // Normal input state
          <>
            <span className="text-slate-400 text-sm shrink-0">💬</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setHovered(true)}
              disabled={chatLoading}
              placeholder={voiceMode ? 'Klauskite balsu arba raštu...' : 'Turite klausimų? Klauskite...'}
              className="flex-1 text-sm text-slate-600 placeholder-slate-400 bg-transparent border-none outline-none"
            />
            {voiceMode && (
              <button
                type="button"
                onClick={handleMicClick}
                className="shrink-0 w-10 h-10 md:w-7 md:h-7 rounded-lg flex items-center justify-center border-none cursor-pointer bg-slate-100 text-slate-500 hover:bg-[#0D7377] hover:text-white transition-all text-sm"
                title="Klauskite balsu"
              >
                🎤
              </button>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || chatLoading}
              className={`shrink-0 w-10 h-10 md:w-7 md:h-7 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all text-sm ${
                inputValue.trim() && !chatLoading
                  ? 'bg-[#0D7377] text-white hover:bg-[#095456]'
                  : 'bg-slate-100 text-slate-300'
              }`}
            >
              ➤
            </button>
          </>
        )}
      </div>

      {/* Triangle pointer */}
      {showTriangle && triangleDirection === 'right' && (
        <div className="absolute" style={{
          right: -8, top: '50%', transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
          borderLeft: '8px solid white',
          filter: 'drop-shadow(2px 0 2px rgba(0,0,0,0.05))',
        }} />
      )}
      {showTriangle && triangleDirection !== 'right' && (
        <div className="absolute" style={{
          bottom: -8, right: size / 2 - 8,
          width: 0, height: 0,
          borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
          borderTop: '8px solid white',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.05))',
        }} />
      )}
    </div>
  );
}
