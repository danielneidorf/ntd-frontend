// P7-B1–B9: AI Guide root component — tour + chat + voice concierge
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TourStep, GuideMode, ChatMessage } from './types';
import useTour from './useTour';
import AIGuideToggle from './AIGuideToggle';
import AIGuideOverlay from './AIGuideOverlay';
import NarrationBubble from './NarrationBubble';
import { landingTour } from './tours/landingTour';
import { quickscanTour } from './tours/quickscanTour';
import { buildReportTour, extractReportData } from './tours/reportTour';
import { RealtimeVoice } from '../../lib/realtimeVoice';
import { formActions } from './formActionsRegistry';
import { executeFormAction } from './FormActionExecutor';
import { getToolsForScreen } from './toolDefinitions';
import type { ScreenName } from './toolDefinitions';
import { findContentByTopic } from './contentMap';

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

  // Speaking + listening state (for Robocat animation)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceConciergeActive, setVoiceConciergeActive] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  // P7-B9: OpenAI Realtime API WebRTC session
  const realtimeRef = useRef<RealtimeVoice | null>(null);

  // Voice concierge lifecycle — P7-B9: OpenAI Realtime API via WebRTC.
  // The browser connects directly to OpenAI; our backend's only role is
  // to generate the ephemeral token and embed the system prompt.
  const startVoiceConcierge = useCallback(async () => {
    if (voiceConciergeActive) return;

    try {
      const propertyContext = tourId === 'report' ? buildPropertyContext() : undefined;

      const rt = new RealtimeVoice();
      realtimeRef.current = rt;

      let aiResponseAccum = '';

      await rt.connect(
        {
          onUserTranscript: (text) => {
            // Final user transcript — update caption and add to chat history
            setUserTranscript(text);
            setChatHistory((prev) => [...prev, { role: 'user', content: text }]);
          },
          onAITranscript: (text, isFinal) => {
            if (isFinal) {
              // Complete AI response transcript — add to chat history
              setAiResponseText(text);
              setChatHistory((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { role: 'assistant', content: text }];
                }
                return [...prev, { role: 'assistant', content: text }];
              });
            } else {
              // Streaming delta — accumulate for live display
              aiResponseAccum += text;
              setAiResponseText(aiResponseAccum);
            }
          },
          onSpeechStarted: () => {
            setIsListening(true);
            setIsSpeaking(false);
            setUserTranscript('');
            setAiResponseText('');
            aiResponseAccum = '';
          },
          onSpeechStopped: () => {
            setIsListening(false);
          },
          onResponseDone: () => {
            setIsSpeaking(false);
            aiResponseAccum = '';
          },
          onStateChange: (state) => {
            console.log('[AIGuide] RealtimeVoice state:', state);
            if (state === 'connected') {
              setVoiceConciergeActive(true);
            } else if (state === 'disconnected' || state === 'error') {
              setVoiceConciergeActive(false);
              setIsListening(false);
              setIsSpeaking(false);
            }
          },
          onError: (msg) => {
            console.warn('[AIGuide] RealtimeVoice error:', msg);
          },
          onFunctionCall: async (name, args) => {
            return executeFormAction(name, args);
          },
        },
        propertyContext,
      );

      // P7-B8.1: send initial session.update with tools + screen instructions.
      // Derive screen from __screen registry (QuickScanFlow pages) or tourId (landing/report).
      await rt.waitForReady();
      const screenAction = formActions.get('__screen');
      const screen: ScreenName = screenAction
        ? (await screenAction({})) as ScreenName
        : (tourId as ScreenName) ?? 'other';
      // Don't send `instructions` — the backend system prompt has full domain
      // knowledge. session.update instructions would replace it entirely.
      rt.updateSession({
        tools: getToolsForScreen(screen),
        tool_choice: 'auto',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.6,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
        },
      });

      setVoiceConciergeActive(true);
      setIsListening(true);
    } catch (err) {
      console.warn('Voice concierge start failed:', err);
      realtimeRef.current = null;
    }
  }, [voiceConciergeActive, tourId, tourSteps, tour.state.currentStep]);

  const stopVoiceConcierge = useCallback(() => {
    realtimeRef.current?.disconnect();
    realtimeRef.current = null;
    setVoiceConciergeActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setUserTranscript('');
    setAiResponseText('');
  }, []);

  // Auto-start voice concierge when voice mode activates
  useEffect(() => {
    if (mode === 'voice' && tour.state.active && !voiceConciergeActive) {
      // P7-B9: start immediately — no 500ms delay. startVoiceConcierge()
      // P7-B9: start immediately — no delay needed.
      startVoiceConcierge();
      return;
    }
    if (mode !== 'voice' && voiceConciergeActive) {
      stopVoiceConcierge();
    }
  }, [mode, tour.state.active, voiceConciergeActive, startVoiceConcierge, stopVoiceConcierge]);

  // Stop voice concierge on tour stop
  useEffect(() => {
    if (!tour.state.active && voiceConciergeActive) {
      stopVoiceConcierge();
    }
  }, [tour.state.active, voiceConciergeActive]);

  // P7-B8.1: subscribe to form actions registry for screen changes → session.update
  const lastScreenRef = useRef<string | undefined>();
  useEffect(() => {
    const unsub = formActions.subscribe(async () => {
      const screenAction = formActions.get('__screen');
      if (!screenAction) return;
      const screen = (await screenAction({})) as string;
      if (screen === lastScreenRef.current) return;
      lastScreenRef.current = screen;

      const rt = realtimeRef.current;
      if (rt?.connected) {
        rt.updateSession({
          tools: getToolsForScreen(screen as ScreenName),
          tool_choice: 'auto',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.6,
            prefix_padding_ms: 300,
            silence_duration_ms: 800,
          },
        });
      }
    });
    return unsub;
  }, [tourId]);

  // P7-B8.2-fix / B8.4: Tour navigation + show_section actions.
  // toolNavRef prevents auto-narration race; returnStepRef enables detour return.
  // seenStepsRef tracks which steps the user has already seen (linear or detour)
  // so tour_next skips them — no repeated narrations unless explicitly asked.
  const toolNavRef = useRef(false);
  const returnStepRef = useRef<number | null>(null);
  const seenStepsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Find the next unseen step from a given start index (inclusive)
    const findNextUnseen = (from: number): number | null => {
      for (let i = from; i < tourSteps.length; i++) {
        if (!seenStepsRef.current.has(i)) return i;
      }
      return null;
    };

    formActions.register('tour_next', () => {
      if (!tour.state.active) {
        return JSON.stringify({ success: false, error: 'tour_not_active' });
      }

      // Determine where to search from
      const searchFrom = returnStepRef.current !== null
        ? returnStepRef.current + 1  // after detour: resume past where user was
        : tour.state.currentStep + 1; // normal: next after current
      returnStepRef.current = null;

      const nextIdx = findNextUnseen(searchFrom);
      if (nextIdx === null) {
        return JSON.stringify({ success: false, error: 'last_step', message: 'Tai paskutinis žingsnis.' });
      }

      seenStepsRef.current.add(nextIdx);
      toolNavRef.current = true;
      tour.goToStep(nextIdx);
      const step = tourSteps[nextIdx];
      return JSON.stringify({
        success: true,
        step: nextIdx,
        narration: step?.narration ?? '',
        instruction: 'Perskaityk naracijos tekstą žodis žodžiui. Po perskaitymo — tylėk.',
      });
    });

    formActions.register('tour_back', () => {
      if (!tour.state.active) {
        return JSON.stringify({ success: false, error: 'tour_not_active' });
      }
      // Clear any detour on manual back
      returnStepRef.current = null;
      if (tour.state.currentStep <= 0) {
        return JSON.stringify({ success: false, error: 'first_step', message: 'Tai pirmas žingsnis.' });
      }
      const prevIdx = tour.state.currentStep - 1;
      toolNavRef.current = true;
      tour.back();
      const prevStep = tourSteps[prevIdx];
      return JSON.stringify({
        success: true,
        step: prevIdx,
        narration: prevStep?.narration ?? '',
        instruction: 'Perskaityk naracijos tekstą žodis žodžiui. Po perskaitymo — tylėk.',
      });
    });

    // P7-B8.4: show_section — jump to a content section that answers the user's question
    formActions.register('show_section', (args) => {
      const topic = args.topic as string;
      const entry = findContentByTopic(topic);

      if (!entry) {
        return JSON.stringify({ success: false, error: 'unknown_topic', message: `Nežinoma tema: ${topic}` });
      }

      if (entry.tourId !== tourId) {
        const pageLabels: Record<string, string> = {
          landing: 'pagrindiniame puslapyje',
          quickscan: 'užsakymo puslapyje',
          report: 'ataskaitoje',
        };
        return JSON.stringify({
          success: false,
          error: 'different_page',
          message: `Ši informacija yra ${pageLabels[entry.tourId] ?? 'kitame puslapyje'}.`,
          page: entry.tourId,
        });
      }

      const stepIndex = tourSteps.findIndex((s) => s.id === entry.stepId);
      if (stepIndex === -1) {
        return JSON.stringify({ success: false, error: 'step_not_found' });
      }

      returnStepRef.current = tour.state.currentStep;
      seenStepsRef.current.add(stepIndex);
      toolNavRef.current = true;
      tour.goToStep(stepIndex);

      return JSON.stringify({
        success: true,
        label: entry.label,
        narration: tourSteps[stepIndex]?.narration ?? '',
        instruction: 'Perskaityk naracijos tekstą žodis žodžiui. Po perskaitymo — tylėk ir lauk.',
        return_available: true,
      });
    });

    return () => {
      formActions.unregister('tour_next');
      formActions.unregister('tour_back');
      formActions.unregister('show_section');
    };
  }, [tour.state.active, tour.state.currentStep, tourSteps.length, tourId]);

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

  // P7-B10: Tour step narration effect — behavior depends on mode.
  // "Be balso" (guided): narration shown as text in the speech bubble only.
  //   No audio at all — pure reading experience.
  // "Su balsu" (voice): send narration to the Realtime session via
  //   sendTextPrompt(). The AI reads it verbatim — consistent with the
  //   written narration the user sees in the speech bubble.
  useEffect(() => {
    if (!tour.state.active) return;
    const step = tourSteps[tour.state.currentStep];
    if (!step) return;

    // Mark this step as seen (whether tool-driven or auto-narrated)
    seenStepsRef.current.add(tour.state.currentStep);

    // Skip auto-narration if this step change was caused by tour_next/tour_back
    // tool call — the narration text is already in the tool result, and sending
    // sendNarration would race with the tool's response.create.
    if (toolNavRef.current) {
      toolNavRef.current = false;
      return;
    }

    if (mode === 'voice' && voiceConciergeActive && realtimeRef.current) {
      const rt = realtimeRef.current;
      rt.waitForReady().then(() => {
        rt.sendNarration(step.narration);
      });
    }
  }, [tour.state.currentStep, tour.state.active, mode, tourSteps, voiceConciergeActive]);

  // Tour chat handler — P7-B10: routes through Realtime in "Su balsu" mode.
  const handleChatSend = useCallback((message: string) => {
    const currentStep = tourSteps[tour.state.currentStep];
    if (!currentStep) return;

    // "Su balsu" — typed question goes through Realtime, not /chat REST.
    if (mode === 'voice' && voiceConciergeActive && realtimeRef.current) {
      setChatHistory((prev) => [...prev, { role: 'user', content: message }]);
      realtimeRef.current.sendTextPrompt(message);
      return;
    }

    // "Be balso" — text chat via /chat REST endpoint.
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
        // "Be balso" is text-only — no audio.
      })
      .finally(() => setChatLoading(false));
  }, [tourSteps, tour.state.currentStep, chatHistory, tourId, mode, voiceConciergeActive]);

  // Standalone chat handler — P7-B10: same Realtime routing logic.
  const handleStandaloneChatSend = useCallback((message: string) => {
    // "Su balsu" — typed question goes through Realtime.
    if (mode === 'voice' && voiceConciergeActive && realtimeRef.current) {
      setStandaloneChatHistory((prev) => [...prev, { role: 'user', content: message }]);
      realtimeRef.current.sendTextPrompt(message);
      return;
    }

    // "Be balso" — text chat via /chat REST endpoint.
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
        // "Be balso" is text-only — no audio.
      })
      .finally(() => setStandaloneChatLoading(false));
  }, [standaloneChatHistory, tourId, mode, voiceConciergeActive]);

  const handleModeChange = (m: GuideMode) => {
    setMode(m);
    sessionStorage.setItem('ntd-guide-mode', m);
  };

  const handleTourStop = useCallback(() => {
    returnStepRef.current = null;
    seenStepsRef.current.clear();
    stopVoiceConcierge();
    tour.stop();
  }, [tour.stop, stopVoiceConcierge]);

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
        isSpeaking={isSpeaking}
        isListening={isListening}
        voiceConciergeActive={voiceConciergeActive}
        userTranscript={userTranscript}
        aiResponseText={aiResponseText}
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
            voiceMode={mode === 'voice'}
            voiceConciergeActive={voiceConciergeActive}
            isListening={isListening}
            userTranscript={userTranscript}
            aiResponseText={aiResponseText}
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
