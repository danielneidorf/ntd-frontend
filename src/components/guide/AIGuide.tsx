// P7-B1: AI Guide root component — wraps toggle, overlay, and narration
import { useState } from 'react';
import type { TourStep, GuideMode } from './types';
import useTour from './useTour';
import AIGuideToggle from './AIGuideToggle';
import AIGuideOverlay from './AIGuideOverlay';
import NarrationBubble from './NarrationBubble';

export default function AIGuide({ tourSteps }: { tourSteps: TourStep[] }) {
  const tour = useTour(tourSteps);
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
            stepNumber={tour.state.currentStep + 1}
            totalSteps={tourSteps.length}
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
