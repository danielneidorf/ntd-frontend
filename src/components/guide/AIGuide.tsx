// P7-B1 / P7-B2 / P7-B3: AI Guide root component
// Tour steps resolved internally to preserve skipIf functions
// Report tour uses deferred data extraction from the DOM
import { useState, useEffect, useRef, useMemo } from 'react';
import type { TourStep, GuideMode } from './types';
import useTour from './useTour';
import AIGuideToggle from './AIGuideToggle';
import AIGuideOverlay from './AIGuideOverlay';
import NarrationBubble from './NarrationBubble';
import { landingTour } from './tours/landingTour';
import { quickscanTour } from './tours/quickscanTour';
import { buildReportTour, extractReportData } from './tours/reportTour';

const STATIC_TOURS: Record<string, TourStep[]> = {
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
  // Report tour is built dynamically from DOM data after the page renders
  const [reportSteps, setReportSteps] = useState<TourStep[] | null>(null);

  useEffect(() => {
    if (tourId !== 'report') return;
    // Short delay to let the report components render
    const timer = setTimeout(() => {
      const data = extractReportData();
      setReportSteps(buildReportTour(data));
    }, 100);
    return () => clearTimeout(timer);
  }, [tourId]);

  const tourSteps = useMemo(() => {
    if (tourId === 'report') return reportSteps ?? [];
    return STATIC_TOURS[tourId] ?? [];
  }, [tourId, reportSteps]);

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
    if (tourSteps.length === 0) return; // wait for report steps to be built

    const timer = setTimeout(() => {
      autoStartedRef.current = true;
      tour.start();
    }, 300);

    return () => clearTimeout(timer);
  }, [autoStart, mode, tour.state.active, tourSteps.length]);

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

      <style>{`
        @keyframes guide-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(13, 115, 119, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(13, 115, 119, 0); }
        }
      `}</style>
    </>
  );
}
