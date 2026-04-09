// P7-B1–B7.1: AI Guide root component — tour + chat + voice concierge
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
import { vadService } from '../../lib/vadService';
import { voiceWS } from '../../lib/voiceWebSocket';
import { audioQueue } from '../../lib/audioQueue';

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

  useEffect(() => {
    if (mode !== 'voice') return;
    // P7-B7.4 barge-in: VAD must stay HOT during AI playback so onSpeechStart
    // can fire and trigger voiceWS.sendCancel(). The previous pause/resume
    // gate (disabled here) prevented speaker→mic feedback loops when the user
    // wasn't wearing headphones. With the gate removed, users on open speakers
    // may occasionally hear the AI cut itself off as its own voice leaks back
    // into the mic — the fix for that is headphones (user confirmed) or
    // better echo cancellation in a future task.
    const interval = setInterval(() => {
      setIsSpeaking(ttsService.isPlaying || audioQueue.isPlaying);
    }, 100);
    return () => clearInterval(interval);
  }, [mode]);

  // Voice concierge lifecycle
  const startVoiceConcierge = useCallback(async () => {
    if (voiceConciergeActive) return;

    try {
      // Connect WebSocket
      voiceWS.connect({
        onTranscript: (text, isFinal) => {
          if (isFinal && text) {
            setUserTranscript(text);
            setChatHistory((prev) => [...prev, { role: 'user', content: text }]);
          }
        },
        onResponseText: (text) => {
          setAiResponseText((prev) => (prev ? prev + ' ' + text : text));
          setChatHistory((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { role: 'assistant', content: last.content + ' ' + text }];
            }
            return [...prev, { role: 'assistant', content: text }];
          });
        },
        onAudioChunk: (base64) => {
          audioQueue.enqueue(base64);
        },
        onAudioEnd: () => {
          setAiResponseText('');
        },
        onError: (msg) => {
          console.warn('Voice WS error:', msg);
        },
        onClose: () => {
          setVoiceConciergeActive(false);
          setIsListening(false);
        },
      });

      // Wait for WebSocket to connect
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (voiceWS.connected) { clearInterval(check); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(check); resolve(); }, 2000);
      });

      // Send page context
      const propertyContext = tourId === 'report' ? buildPropertyContext() : undefined;
      const currentStep = tourSteps[tour.state.currentStep];
      console.log('[AIGuide] about to sendContext — voiceWS.connected=', voiceWS.connected, 'voiceWS instance:', voiceWS);
      voiceWS.sendContext(tourId, currentStep?.id ?? 'standalone', propertyContext);

      // Start VAD
      await vadService.start({
        onSpeechStart: () => {
          // User started speaking — barge-in: stop local playback AND tell
          // the backend to abort the in-progress response so we don't keep
          // burning ElevenLabs/Haiku tokens on audio nobody will hear.
          console.log('[AIGuide] onSpeechStart callback fired');
          if (ttsService.isPlaying || audioQueue.isPlaying) {
            voiceWS.sendCancel();
          }
          audioQueue.stop();
          ttsService.stop();
          setIsSpeaking(false);
          setIsListening(true);
          setUserTranscript('');
          setAiResponseText('');
        },
        onSpeechEnd: (audio) => {
          // User stopped speaking — send audio to backend
          console.log('[AIGuide] onSpeechEnd callback fired — audio samples:', audio.length, 'voiceWS.connected=', voiceWS.connected);
          setIsListening(false);
          voiceWS.sendAudio(audio, 16000);
          console.log('[AIGuide] voiceWS.sendAudio(...) returned');
        },
        onVADMisfire: () => {
          console.log('[AIGuide] onVADMisfire callback fired');
          setIsListening(false);
        },
      });

      setVoiceConciergeActive(true);
      setIsListening(true);
    } catch (err) {
      console.warn('Voice concierge start failed:', err);
    }
  }, [voiceConciergeActive, tourId, tourSteps, tour.state.currentStep]);

  const stopVoiceConcierge = useCallback(() => {
    vadService.stop();
    voiceWS.disconnect();
    audioQueue.stop();
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
      // Small delay to ensure tour state has settled
      const timer = setTimeout(() => startVoiceConcierge(), 500);
      return () => clearTimeout(timer);
    }
    if (mode !== 'voice' && voiceConciergeActive) {
      stopVoiceConcierge();
    }
  }, [mode, tour.state.active, voiceConciergeActive, startVoiceConcierge, stopVoiceConcierge]);

  // Update WebSocket context when tour step changes
  useEffect(() => {
    if (!voiceConciergeActive) return;
    const currentStep = tourSteps[tour.state.currentStep];
    const propertyContext = tourId === 'report' ? buildPropertyContext() : undefined;
    voiceWS.sendContext(tourId, currentStep?.id ?? 'standalone', propertyContext);
  }, [tour.state.currentStep, voiceConciergeActive]);

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
