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
import { ttsService } from '../../lib/ttsService';
import { RealtimeVoice } from '../../lib/realtimeVoice';

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
    // Voice ID comes from the backend (ELEVENLABS_VOICE_ID env var); omit it here.
    fetch(`${API_BASE}/v1/ai-guide/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' }),
    })
      .then((r) => setTtsAvailable(r.ok || r.status !== 503))
      .catch(() => setTtsAvailable(false));
  }, []);

  // Speaking + listening state (for Robocat animation)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceConciergeActive, setVoiceConciergeActive] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  // P7-B9: OpenAI Realtime API WebRTC session
  const realtimeRef = useRef<RealtimeVoice | null>(null);

  useEffect(() => {
    if (mode !== 'voice') return;
    // Track whether ttsService (Mode 2 tour narrations) is currently playing,
    // for the Robocat speaking animation.
    const interval = setInterval(() => {
      setIsSpeaking(ttsService.isPlaying);
    }, 100);
    return () => clearInterval(interval);
  }, [mode]);

  // Voice concierge lifecycle — P7-B9: OpenAI Realtime API via WebRTC.
  // The browser connects directly to OpenAI; our backend's only role is
  // to generate the ephemeral token and embed the system prompt.
  const startVoiceConcierge = useCallback(async () => {
    if (voiceConciergeActive) return;

    // P7-B10: stop any Azure TTS narration that might be playing from a
    // previous session, but DON'T stop the tour — "Su balsu" runs voice
    // alongside the tour (AI speaks step narrations via Realtime).
    ttsService.stop();

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
        },
        propertyContext,
      );

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
    // Also stop any Mode 2 tour narration audio that might be playing
    ttsService.stop();
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
      // already calls ttsService.stop() + tour.stop() before connecting
      // WebRTC, so there's no race with Azure narration. The previous delay
      // was causing a 500ms window where Azure TTS and OpenAI Realtime
      // fought for the speaker.
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

    if (mode === 'voice' && voiceConciergeActive && realtimeRef.current) {
      const rt = realtimeRef.current;
      // Wait for the data channel to be ready before sending the first
      // narration — avoids a race where the effect fires before the
      // WebRTC connection has fully established.
      rt.waitForReady().then(() => {
        rt.sendTextPrompt(
          `Perskaityk šį tekstą balsu, žodis žodžiui: ${step.narration}`
        );
      });
    }
    // "Be balso" (mode === 'guided') — no audio. Azure TTS code kept but not called.
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
        // "Be balso" is fully silent — no ttsService.speak.
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
        // "Be balso" is fully silent — no ttsService.speak.
      })
      .finally(() => setStandaloneChatLoading(false));
  }, [standaloneChatHistory, tourId, mode, voiceConciergeActive]);

  const handleModeChange = (m: GuideMode) => {
    setMode(m);
    sessionStorage.setItem('ntd-guide-mode', m);
  };

  const handleTourStop = useCallback(() => {
    ttsService.stop();
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
        ttsAvailable={ttsAvailable}
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
