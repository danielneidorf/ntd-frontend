// P7-B1 / P7-B2 / P7-B3 / P7-B5: AI Guide root component
// Tour steps resolved internally. Chat via Haiku on any step.
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TourStep, GuideMode, ChatMessage } from './types';
import useTour from './useTour';
import AIGuideToggle from './AIGuideToggle';
import AIGuideOverlay from './AIGuideOverlay';
import NarrationBubble from './NarrationBubble';
import { landingTour } from './tours/landingTour';
import { quickscanTour } from './tours/quickscanTour';
import { buildReportTour, extractReportData } from './tours/reportTour';

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';

const STATIC_TOURS: Record<string, TourStep[]> = {
  landing: landingTour,
  quickscan: quickscanTour,
};

async function sendChatMessage(
  page: string,
  stepId: string,
  message: string,
  history: ChatMessage[],
  reportToken?: string,
  propertyContext?: string
): Promise<string | null> {
  try {
    const resp = await fetch(`${API_BASE}/v1/ai-guide/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page,
        step_id: stepId,
        message,
        report_token: reportToken,
        property_context: propertyContext,
        history: history.slice(-6),
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.source === 'fallback') return data.response;
    return data.response;
  } catch {
    return null;
  }
}

export default function AIGuide({
  tourId,
  autoStart = false,
}: {
  tourId: string;
  autoStart?: boolean;
}) {
  // Report tour is built dynamically from DOM data
  const [reportSteps, setReportSteps] = useState<TourStep[] | null>(null);

  useEffect(() => {
    if (tourId !== 'report') return;
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

  // Tour chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Standalone chat state (when no tour is active)
  const [standaloneChatHistory, setStandaloneChatHistory] = useState<ChatMessage[]>([]);
  const [standaloneChatLoading, setStandaloneChatLoading] = useState(false);

  // Clear tour chat history when step changes or tour stops
  const prevStepRef = useRef(-1);
  useEffect(() => {
    if (tour.state.currentStep !== prevStepRef.current) {
      prevStepRef.current = tour.state.currentStep;
      setChatHistory([]);
    }
  }, [tour.state.currentStep]);

  useEffect(() => {
    if (!tour.state.active) {
      setChatHistory([]);
    }
  }, [tour.state.active]);

  const handleChatSend = useCallback((message: string) => {
    const currentStep = tourSteps[tour.state.currentStep];
    if (!currentStep) return;

    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatLoading(true);

    let reportToken: string | undefined;
    let propertyContext: string | undefined;
    if (tourId === 'report' && typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/report/');
      reportToken = segments[1]?.replace(/\/$/, '') || undefined;

      // Extract property data from the rendered report DOM
      const data = extractReportData();
      propertyContext = [
        `Adresas: ${data.address}`,
        `Pastato tipas: ${data.buildingType}`,
        data.yearBuilt ? `Statybos metai: ${data.yearBuilt}` : null,
        data.energyClass ? `Energinė klasė: ${data.energyClass}` : null,
        `Žiemos komfortas: ${data.winterLevel}`,
        `Vasaros perkaitimo rizika: ${data.summerLevel}`,
        data.hasPermits ? `Statybos leidimai: ${data.permitCount} rasta` : 'Statybos leidimų nerasta',
        data.isLandOnly ? 'Vertinimo tipas: Žemės sklypas' : 'Vertinimo tipas: Esamas pastatas',
      ].filter(Boolean).join('\n');
    }

    sendChatMessage(tourId, currentStep.id, message, [...chatHistory, userMsg], reportToken, propertyContext)
      .then((response) => {
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: response ?? 'Atsiprašau, šiuo metu negaliu atsakyti.',
        };
        setChatHistory((prev) => [...prev, aiMsg]);
      })
      .finally(() => setChatLoading(false));
  }, [tourSteps, tour.state.currentStep, chatHistory, tourId]);

  // Standalone chat handler (no tour active — user asks from hover card)
  const handleStandaloneChatSend = useCallback((message: string) => {
    const userMsg: ChatMessage = { role: 'user', content: message };
    setStandaloneChatHistory((prev) => [...prev, userMsg]);
    setStandaloneChatLoading(true);

    // Determine page and extract property context if on report
    const page = tourId;
    let reportToken: string | undefined;
    let propertyContext: string | undefined;
    if (tourId === 'report' && typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/report/');
      reportToken = segments[1]?.replace(/\/$/, '') || undefined;
      const data = extractReportData();
      propertyContext = [
        `Adresas: ${data.address}`,
        `Pastato tipas: ${data.buildingType}`,
        data.yearBuilt ? `Statybos metai: ${data.yearBuilt}` : null,
        data.energyClass ? `Energinė klasė: ${data.energyClass}` : null,
        `Žiemos komfortas: ${data.winterLevel}`,
        `Vasaros perkaitimo rizika: ${data.summerLevel}`,
      ].filter(Boolean).join('\n');
    }

    sendChatMessage(page, 'standalone', message, [...standaloneChatHistory, userMsg], reportToken, propertyContext)
      .then((response) => {
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: response ?? 'Atsiprašau, šiuo metu negaliu atsakyti.',
        };
        setStandaloneChatHistory((prev) => [...prev, aiMsg]);
      })
      .finally(() => setStandaloneChatLoading(false));
  }, [standaloneChatHistory, tourId]);

  // AI narrations disabled — hardcoded/template narrations used
  const aiNarrations: Map<string, string> | null = null;

  const handleModeChange = (m: GuideMode) => {
    setMode(m);
    sessionStorage.setItem('ntd-guide-mode', m);
  };

  // Auto-start on mount if guide mode is active
  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (mode !== 'guided') return;
    if (tour.state.active) return;
    if (tourSteps.length === 0) return;

    const timer = setTimeout(() => {
      autoStartedRef.current = true;
      tour.start();
    }, 300);

    return () => clearTimeout(timer);
  }, [autoStart, mode, tour.state.active, tourSteps.length]);

  const currentStep = tour.state.active ? tourSteps[tour.state.currentStep] : null;

  const currentNarration = currentStep
    ? aiNarrations?.get(currentStep.id) ?? currentStep.narration
    : '';

  return (
    <>
      <AIGuideToggle
        mode={mode}
        onModeChange={handleModeChange}
        onStart={tour.start}
        onStop={tour.stop}
        active={tour.state.active}
        standaloneChatHistory={standaloneChatHistory}
        standaloneChatLoading={standaloneChatLoading}
        onStandaloneChatSend={handleStandaloneChatSend}
      />

      {tour.state.active && currentStep && (
        <>
          <AIGuideOverlay
            targetSelector={currentStep.selector}
            animation={currentStep.animation}
            onClickOutside={tour.stop}
          />
          <NarrationBubble
            step={{ ...currentStep, narration: currentNarration }}
            stepNumber={tour.visibleStepNumber}
            totalSteps={tour.visibleStepCount}
            onNext={tour.next}
            onBack={tour.back}
            onClose={tour.stop}
            chatHistory={chatHistory}
            chatLoading={chatLoading}
            onChatSend={handleChatSend}
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
