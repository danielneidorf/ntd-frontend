// P7-B1 / P7-B2: AI Guide root component — wraps toggle, overlay, and narration
// Tour steps are resolved internally (not passed as Astro props) to preserve skipIf functions
import { useState, useEffect, useRef, useMemo } from 'react';
import type { TourStep, GuideMode } from './types';
import useTour from './useTour';
import AIGuideToggle from './AIGuideToggle';
import AIGuideOverlay from './AIGuideOverlay';
import NarrationBubble from './NarrationBubble';
import { landingTour } from './tours/landingTour';
import { quickscanTour } from './tours/quickscanTour';

const TOUR_MAP: Record<string, TourStep[]> = {
  landing: landingTour,
  quickscan: quickscanTour,
};

export default function AIGuide({
  tourId,
  autoStart = false,
}: {
  tourId: string;
  autoStart?: boolean;
}) {
  const tourSteps = useMemo(() => TOUR_MAP[tourId] ?? [], [tourId]);
  const tour = useTour(tourSteps);
  const autoStartedRef = useRef(false);
  const [mode, setMode] = useState<GuideMode>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('ntd-guide-mode') as GuideMode) || 'self';
    }
    return 'self';
  });

  const handleModeChange = (m: GuideMode) => {
    setMode(m);
    sessionStorage.setItem('ntd-guide-mode', m);
  };

  // Auto-start on mount if guide mode is active
  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (mode !== 'guided') return;
    if (tour.state.active) return;

    const timer = setTimeout(() => {
      autoStartedRef.current = true;
      tour.start();
    }, 300);

    return () => clearTimeout(timer);
  }, [autoStart, mode, tour.state.active]);

  const currentStep = tour.state.active ? tourSteps[tour.state.currentStep] : null;

  return (
    <>
      <AIGuideToggle
        mode={mode}
        onModeChange={handleModeChange}
        onStart={tour.start}
        onStop={tour.stop}
        active={tour.state.active}
      />

      {tour.state.active && currentStep && (
        <>
          <AIGuideOverlay
            targetSelector={currentStep.selector}
            animation={currentStep.animation}
            onClickOutside={tour.stop}
          />
          <NarrationBubble
            step={currentStep}
            stepNumber={tour.visibleStepNumber}
            totalSteps={tour.visibleStepCount}
            onNext={tour.next}
            onBack={tour.back}
            onClose={tour.stop}
          />
        </>
      )}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes guide-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(13, 115, 119, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(13, 115, 119, 0); }
        }
      `}</style>
    </>
  );
}
