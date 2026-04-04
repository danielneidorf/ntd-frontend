// P7-B1.1: Animated AI avatar — geometric SVG character with CSS idle animations
import { useState, useEffect } from 'react';

const HINTS = ['Padėti?', 'Turite klausimų?', 'Galiu paaiškinti!', 'Paspauskite mane'];

export default function AIAvatar({
  onClick,
  active,
}: {
  onClick: () => void;
  active: boolean;
}) {
  const [hintIndex, setHintIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;
    const t = setInterval(() => setHintIndex((i) => (i + 1) % HINTS.length), 3000);
    return () => clearInterval(t);
  }, [hovered]);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center cursor-pointer bg-transparent border-none p-0 ml-4 group"
      title="AI gidas"
      aria-label="AI gidas"
    >
      {/* Speech bubble */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[#1E3A5F] text-[11px] font-medium px-2 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none transition-all duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          transform: `translateX(-50%) translateY(${hovered ? '0' : '4px'})`,
        }}
      >
        {HINTS[hintIndex]}
      </div>

      {/* SVG avatar */}
      <svg
        viewBox="0 0 48 64"
        className="w-[40px] h-[52px] sm:w-[44px] sm:h-[56px] avatar-root"
        aria-hidden="true"
      >
        <g className="avatar-bob">
          <g className="avatar-shuffle">
            {/* Body */}
            <rect
              className="avatar-breathe"
              x="12" y="28" width="24" height="22" rx="8"
              fill="#1E3A5F"
              style={{ transformOrigin: '24px 39px' }}
            />

            {/* Head */}
            <circle cx="24" cy="18" r="13" fill="#0D7377" />

            {/* Eyes */}
            <g className="avatar-blink" style={{ transformOrigin: '24px 16px' }}>
              <circle cx="19" cy="16" r="3" fill="white" />
              <circle cx="29" cy="16" r="3" fill="white" />
              <circle
                className={`transition-all duration-200 ${hovered ? 'scale-[1.2]' : ''}`}
                cx="20" cy="16" r="1.5" fill="#1E3A5F"
                style={{ transformOrigin: '20px 16px' }}
              />
              <circle
                className={`transition-all duration-200 ${hovered ? 'scale-[1.2]' : ''}`}
                cx="30" cy="16" r="1.5" fill="#1E3A5F"
                style={{ transformOrigin: '30px 16px' }}
              />
            </g>

            {/* Mouth — small smile */}
            <path d="M20,22 Q24,26 28,22" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />

            {/* Left arm */}
            <path
              d="M12,32 Q6,38 9,44"
              stroke="#1E3A5F" strokeWidth="3" fill="none" strokeLinecap="round"
            />

            {/* Right arm — waves */}
            <path
              className="avatar-wave"
              d="M36,32 Q42,38 39,44"
              stroke="#1E3A5F" strokeWidth="3" fill="none" strokeLinecap="round"
              style={{ transformOrigin: '36px 32px' }}
            />

            {/* Legs */}
            <line x1="18" y1="50" x2="17" y2="60" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" />
            <line x1="30" y1="50" x2="31" y2="60" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" />

            {/* Headset arc */}
            <path d="M11,14 Q11,5 24,3 Q37,5 37,14" stroke="#0D7377" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
            <circle cx="11" cy="15" r="2.5" fill="#0D7377" stroke="#1E3A5F" strokeWidth="0.8" opacity="0.6" />
          </g>
        </g>

        {/* Speaking indicator when tour is active */}
        {active && (
          <g className="avatar-speaking" opacity="0.7">
            <circle cx="40" cy="10" r="1.5" fill="white" className="avatar-dot1" />
            <circle cx="44" cy="8" r="1.5" fill="white" className="avatar-dot2" />
            <circle cx="46" cy="12" r="1.5" fill="white" className="avatar-dot3" />
          </g>
        )}
      </svg>

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes avatar-bob-kf {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes avatar-breathe-kf {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.03); }
        }
        @keyframes avatar-blink-kf {
          0%, 93%, 100% { transform: scaleY(1); }
          95.5% { transform: scaleY(0.1); }
        }
        @keyframes avatar-wave-kf {
          0%, 80%, 100% { transform: rotate(0deg); }
          84% { transform: rotate(-15deg); }
          88% { transform: rotate(12deg); }
          92% { transform: rotate(-8deg); }
          96% { transform: rotate(5deg); }
        }
        @keyframes avatar-shuffle-kf {
          0%, 72%, 100% { transform: translateX(0); }
          76% { transform: translateX(3px); }
          80% { transform: translateX(-2px); }
          84% { transform: translateX(1px); }
        }
        @keyframes avatar-dot-kf {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .avatar-bob { animation: avatar-bob-kf 2.5s ease-in-out infinite; }
        .avatar-breathe { animation: avatar-breathe-kf 3s ease-in-out infinite; }
        .avatar-blink { animation: avatar-blink-kf 4s ease-in-out infinite; }
        .avatar-wave { animation: avatar-wave-kf 8s ease-in-out infinite; }
        .avatar-shuffle { animation: avatar-shuffle-kf 12s ease-in-out infinite; }
        .avatar-dot1 { animation: avatar-dot-kf 1.2s ease-in-out infinite; }
        .avatar-dot2 { animation: avatar-dot-kf 1.2s ease-in-out infinite 0.2s; }
        .avatar-dot3 { animation: avatar-dot-kf 1.2s ease-in-out infinite 0.4s; }

        .group:hover .avatar-wave {
          animation: avatar-wave-kf 2s ease-in-out 1;
        }
        .group:hover .avatar-breathe {
          transform: rotate(-3deg);
          transition: transform 0.2s;
        }

        @media (prefers-reduced-motion: reduce) {
          .avatar-root * { animation: none !important; }
        }
      `}</style>
    </button>
  );
}
