// P7-B5.3: Reusable chat input card — expands on hover, collapses on leave
import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from './types';

const HEADER_HEIGHT = 64;
const AVATAR_BOTTOM = 96;
const AVATAR_SIZE = 128;
const GAP = 12;
// Max expanded height: hard cap at 300px — keeps the card compact
const MAX_EXPANDED = '400px';

export default function ChatInputCard({
  chatHistory,
  chatLoading,
  onSend,
  showTriangle,
  triangleDirection,
  avatarSize,
}: {
  chatHistory: ChatMessage[];
  chatLoading: boolean;
  onSend: (message: string) => void;
  showTriangle?: boolean;
  triangleDirection?: 'down' | 'right';
  avatarSize?: number;
}) {
  const [inputValue, setInputValue] = useState('');
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const msg = inputValue.trim();
    if (!msg || chatLoading) return;
    setInputValue('');
    setHovered(true); // keep expanded after sending
    onSend(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive while expanded
  useEffect(() => {
    if (threadRef.current && hovered) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [chatHistory.length, hovered]);

  // Keep expanded while loading
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
      onMouseLeave={() => { if (!chatLoading) setHovered(false); }}
    >
      {/* Conversation thread */}
      {hasConversation && (
        <div
          ref={threadRef}
          className="px-4 pt-3 pb-1 overflow-y-auto space-y-2 transition-all duration-300"
          style={{ maxHeight: isCollapsed ? '72px' : MAX_EXPANDED }}
        >
          {isCollapsed ? (
            // Collapsed: last question + truncated response
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
            // Expanded: full conversation
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
        <span className="text-slate-400 text-sm shrink-0">💬</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setHovered(true)}
          disabled={chatLoading}
          placeholder="Turite klausimų? Klauskite..."
          className="flex-1 text-sm text-slate-600 placeholder-slate-400 bg-transparent border-none outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputValue.trim() || chatLoading}
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all text-sm ${
            inputValue.trim() && !chatLoading
              ? 'bg-[#0D7377] text-white hover:bg-[#095456]'
              : 'bg-slate-100 text-slate-300'
          }`}
        >
          ➤
        </button>
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
