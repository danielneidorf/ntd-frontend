// P7-B1.4 / P7-B1.5: Narration as speech bubble — per-step positioning
import type { TourStep } from './types';

// Avatar geometry (must match AIGuideToggle.tsx positioning):
//   fixed bottom-24 right-12 → 96px bottom, 48px right
//   RiveAvatar: 128×128px
//   Gap between bubble and avatar: 12px
const AVATAR_BOTTOM = 96;
const AVATAR_SIZE = 128;
const AVATAR_RIGHT = 48;
const GAP = 12;

// Default (steps 2+): bubble above the avatar
const BUBBLE_BOTTOM_ABOVE = AVATAR_BOTTOM + AVATAR_SIZE + GAP; // 236
// Step 1: bubble to the left of the avatar (same vertical level)
const BUBBLE_RIGHT_LEFT = AVATAR_RIGHT + AVATAR_SIZE + GAP; // 188

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
  const isLast = stepNumber === totalSteps;
  const isFirst = stepNumber === 1;

  // Step 1: to the left of the avatar, triangle points right
  // Steps 2+: above the avatar, triangle points down
  const bubbleStyle: React.CSSProperties = isFirst
    ? {
        bottom: AVATAR_BOTTOM,
        right: BUBBLE_RIGHT_LEFT,
        maxHeight: `calc(100vh - ${AVATAR_BOTTOM + 16}px)`,
      }
    : {
        bottom: BUBBLE_BOTTOM_ABOVE,
        right: AVATAR_RIGHT,
        maxHeight: `calc(100vh - ${BUBBLE_BOTTOM_ABOVE + 16}px)`,
      };

  const bubbleWidthClass = isFirst
    ? 'w-[min(320px,calc(100vw-32px))] sm:w-[320px]'
    : 'w-[min(260px,calc(100vw-32px))] sm:w-[260px]';

  return (
    <div
      className={`fixed z-[51] bg-white rounded-xl shadow-xl p-5 ${bubbleWidthClass}`}
      style={bubbleStyle}
    >
      {/* Speech triangle pointer */}
      {isFirst ? (
        // Right-pointing triangle (toward avatar on the right)
        <div
          className="absolute"
          style={{
            right: -8,
            top: AVATAR_SIZE / 2 - 8,
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '8px solid white',
            filter: 'drop-shadow(2px 0 2px rgba(0,0,0,0.05))',
          }}
        />
      ) : (
        // Down-pointing triangle (toward avatar below)
        <div
          className="absolute"
          style={{
            bottom: -8,
            right: AVATAR_SIZE / 2 - 8,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid white',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.05))',
          }}
        />
      )}

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
    </div>
  );
}
