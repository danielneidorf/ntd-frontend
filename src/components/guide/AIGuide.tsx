// P7-B1–B6: AI Guide root component — tour + chat + voice
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TourStep, GuideMode, ChatMessage } from './types';
import useTour from './useTour';
import AIGuideToggle from './AIGuideToggle';
import AIGuideOverlay from './AIGuideOverlay';
import NarrationBubble from './NarrationBubble';
import { landingTour } from './tours/landingTour';
import { quickscanTour } from './tours/quickscanTour';
import { buildReportTour, extractReportData } from './tours/reportTour';
import { ttsService } from '../../lib/ttsService';

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
    return data.response;
  } catch {
    return null;
  }
}

function buildPropertyContext(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const data = extractReportData();
    return [
      `Adresas: ${data.address}`,
      `Pastato tipas: ${data.buildingType}`,
      data.yearBuilt ? `Statybos metai: ${data.yearBuilt}` : null,
      data.energyClass ? `Energinė klasė: ${data.energyClass}` : null,
      `Žiemos komfortas: ${data.winterLevel}`,
      `Vasaros perkaitimo rizika: ${data.summerLevel}`,
      data.hasPermits ? `Statybos leidimai: ${data.permitCount} rasta` : 'Statybos leidimų nerasta',
      data.isLandOnly ? 'Vertinimo tipas: Žemės sklypas' : 'Vertinimo tipas: Esamas pastatas',
    ].filter(Boolean).join('\n');
  } catch {
    return undefined;
  }
}

function getReportToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const segments = window.location.pathname.split('/report/');
  return segments[1]?.replace(/\/$/, '') || undefined;
}

export default function AIGuide({
  tourId,
  autoStart = false,
}: {
  tourId: string;
  autoStart?: boolean;
}) {
  // Report tour built dynamically
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

  // TTS availability
  const [ttsAvailable, setTtsAvailable] = useState(false);
  useEffect(() => {
    fetch(`${API_BASE}/v1/ai-guide/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test', voice: '21m00Tcm4TlvDq8ikWAM' }),
    })
      .then((r) => setTtsAvailable(r.ok || r.status !== 503))
      .catch(() => setTtsAvailable(false));
  }, []);

  // Speaking state (for Robocat animation)
  const [isSpeaking, setIsSpeaking] = useState(false);
  useEffect(() => {
    if (mode !== 'voice') return;
    const interval = setInterval(() => {
      setIsSpeaking(ttsService.isPlaying);
    }, 100);
    return () => clearInterval(interval);
  }, [mode]);

  // Tour chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Standalone chat state
  const [standaloneChatHistory, setStandaloneChatHistory] = useState<ChatMessage[]>([]);
  const [standaloneChatLoading, setStandaloneChatLoading] = useState(false);

  // Clear tour chat on step change
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

  // Voice mode: speak narration on step change
  useEffect(() => {
    if (mode !== 'voice' || !tour.state.active) return;
    const step = tourSteps[tour.state.currentStep];
    if (!step) return;
    const narration = step.narration;
    ttsService.speak(narration);
    return () => ttsService.stop();
  }, [tour.state.currentStep, tour.state.active, mode, tourSteps]);

  // Tour chat handler
  const handleChatSend = useCallback((message: string) => {
    const currentStep = tourSteps[tour.state.currentStep];
    if (!currentStep) return;

    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatLoading(true);

    const reportToken = tourId === 'report' ? getReportToken() : undefined;
    const propertyContext = tourId === 'report' ? buildPropertyContext() : undefined;

    sendChatMessage(tourId, currentStep.id, message, [...chatHistory, userMsg], reportToken, propertyContext)
      .then((response) => {
        const text = response ?? 'Atsiprašau, šiuo metu negaliu atsakyti.';
        const aiMsg: ChatMessage = { role: 'assistant', content: text };
        setChatHistory((prev) => [...prev, aiMsg]);
        if (mode === 'voice') ttsService.speak(text);
      })
      .finally(() => setChatLoading(false));
  }, [tourSteps, tour.state.currentStep, chatHistory, tourId, mode]);

  // Standalone chat handler
  const handleStandaloneChatSend = useCallback((message: string) => {
    const userMsg: ChatMessage = { role: 'user', content: message };
    setStandaloneChatHistory((prev) => [...prev, userMsg]);
    setStandaloneChatLoading(true);

    const reportToken = tourId === 'report' ? getReportToken() : undefined;
    const propertyContext = tourId === 'report' ? buildPropertyContext() : undefined;

    sendChatMessage(tourId, 'standalone', message, [...standaloneChatHistory, userMsg], reportToken, propertyContext)
      .then((response) => {
        const text = response ?? 'Atsiprašau, šiuo metu negaliu atsakyti.';
        const aiMsg: ChatMessage = { role: 'assistant', content: text };
        setStandaloneChatHistory((prev) => [...prev, aiMsg]);
        if (mode === 'voice') ttsService.speak(text);
      })
      .finally(() => setStandaloneChatLoading(false));
  }, [standaloneChatHistory, tourId, mode]);

  const handleModeChange = (m: GuideMode) => {
    setMode(m);
    sessionStorage.setItem('ntd-guide-mode', m);
  };

  const handleTourStop = useCallback(() => {
    ttsService.stop();
    tour.stop();
  }, [tour.stop]);

  // Auto-start
  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (mode !== 'guided' && mode !== 'voice') return;
    if (tour.state.active) return;
    if (tourSteps.length === 0) return;
    const timer = setTimeout(() => {
      autoStartedRef.current = true;
      tour.start();
    }, 300);
    return () => clearTimeout(timer);
  }, [autoStart, mode, tour.state.active, tourSteps.length]);

  const currentStep = tour.state.active ? tourSteps[tour.state.currentStep] : null;
  const currentNarration = currentStep?.narration ?? '';

  return (
    <>
      <AIGuideToggle
        mode={mode}
        onModeChange={handleModeChange}
        onStart={tour.start}
        onStop={handleTourStop}
        active={tour.state.active}
        standaloneChatHistory={standaloneChatHistory}
        standaloneChatLoading={standaloneChatLoading}
        onStandaloneChatSend={handleStandaloneChatSend}
        ttsAvailable={ttsAvailable}
        isSpeaking={isSpeaking}
      />

      {tour.state.active && currentStep && (
        <>
          <AIGuideOverlay
            targetSelector={currentStep.selector}
            animation={currentStep.animation}
            onClickOutside={handleTourStop}
          />
          <NarrationBubble
            step={{ ...currentStep, narration: currentNarration }}
            stepNumber={tour.visibleStepNumber}
            totalSteps={tour.visibleStepCount}
            onNext={tour.next}
            onBack={tour.back}
            onClose={handleTourStop}
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
