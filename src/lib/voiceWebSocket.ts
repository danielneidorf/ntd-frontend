// P7-B7.1: WebSocket client for voice concierge pipeline

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';

export interface VoiceWSCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  /** P7-B8.1: fires on every `partial_transcript` frame from Azure streaming STT.
   *  Use for live-caption UI updates. Optional — batch clients can ignore it. */
  onPartialTranscript?: (text: string) => void;
  onResponseText: (text: string) => void;
  onAudioChunk: (base64Audio: string) => void;
  onAudioEnd: () => void;
  onError: (message: string) => void;
  onClose: () => void;
}

function float32ToBase64(float32: Float32Array): string {
  const bytes = new Uint8Array(float32.buffer, float32.byteOffset, float32.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

class VoiceWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: VoiceWSCallbacks | null = null;

  connect(callbacks: VoiceWSCallbacks): void {
    // Convert HTTP base to WS
    const wsBase = API_BASE.replace(/^http/, 'ws');
    const url = `${wsBase}/v1/ai-guide/voice`;
    console.log('[voiceWS] connect() →', url);

    this.callbacks = callbacks;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[voiceWS] ✓ onopen — readyState:', this.ws?.readyState);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // P7-B8.1: partial_transcript fires ~10 times/sec during speech — don't
        // spam the console with it like the other frame types.
        if (msg.type !== 'partial_transcript') {
          console.log('[voiceWS] ← recv type=%s', msg.type, msg);
        }
        switch (msg.type) {
          case 'transcript':
            this.callbacks?.onTranscript(msg.text, msg.is_final);
            break;
          case 'partial_transcript':
            this.callbacks?.onPartialTranscript?.(msg.text);
            break;
          case 'response_text':
            this.callbacks?.onResponseText(msg.text);
            break;
          case 'audio_chunk':
            this.callbacks?.onAudioChunk(msg.data);
            break;
          case 'audio_end':
            this.callbacks?.onAudioEnd();
            break;
          case 'error':
            this.callbacks?.onError(msg.message);
            break;
        }
      } catch (e) {
        console.warn('[voiceWS] recv parse error:', e, 'data:', event.data);
      }
    };

    this.ws.onclose = (ev) => {
      console.log('[voiceWS] ✗ onclose — code=%d reason=%s wasClean=%s', ev.code, ev.reason, ev.wasClean);
      this.callbacks?.onClose();
    };

    this.ws.onerror = (ev) => {
      console.error('[voiceWS] ✗ onerror', ev);
      this.callbacks?.onError('WebSocket ryšio klaida.');
    };
  }

  sendContext(page: string, stepId: string, propertyContext?: string): void {
    const state = this.ws?.readyState;
    if (state !== WebSocket.OPEN) {
      console.warn('[voiceWS] sendContext DROPPED — readyState=%s (expected OPEN=%d)', state, WebSocket.OPEN);
      return;
    }
    console.log('[voiceWS] → sendContext page=%s stepId=%s', page, stepId);
    this.ws!.send(JSON.stringify({
      type: 'context',
      page,
      step_id: stepId,
      property_context: propertyContext ?? '',
    }));
  }

  sendAudio(audioFloat32: Float32Array, sampleRate: number = 16000): void {
    const state = this.ws?.readyState;
    if (state !== WebSocket.OPEN) {
      console.warn(
        '[voiceWS] sendAudio DROPPED — readyState=%s (expected OPEN=%d), audio samples=%d',
        state, WebSocket.OPEN, audioFloat32.length,
      );
      return;
    }
    const payload = JSON.stringify({
      type: 'audio_data',
      data: float32ToBase64(audioFloat32),
      sample_rate: sampleRate,
    });
    console.log('[voiceWS] → sendAudio samples=%d payload_bytes=%d', audioFloat32.length, payload.length);
    this.ws!.send(payload);
  }

  /** P7-B8.1: tell the backend a new speech segment is starting.
   *  Kicks off Azure continuous recognition on the server side. */
  sendSpeechStart(): void {
    const state = this.ws?.readyState;
    if (state !== WebSocket.OPEN) {
      console.warn('[voiceWS] sendSpeechStart DROPPED — readyState=%s', state);
      return;
    }
    console.log('[voiceWS] → sendSpeechStart');
    this.ws!.send(JSON.stringify({ type: 'speech_start' }));
  }

  /** P7-B8.1: stream one audio frame (Float32, 16kHz) to the backend during
   *  speech. No readyState-drop warning because this fires ~10 times/sec and
   *  would spam the console. Silent no-op if the socket closed mid-utterance. */
  sendAudioChunk(audioFloat32: Float32Array): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'audio_chunk',
      data: float32ToBase64(audioFloat32),
      sample_rate: 16000,
    }));
  }

  /** P7-B8.1: tell the backend the speech segment is over. Triggers Azure
   *  recognition finalization; backend then runs Haiku + TTS on the final
   *  transcript and streams audio_chunk frames back. */
  sendSpeechEnd(): void {
    const state = this.ws?.readyState;
    if (state !== WebSocket.OPEN) {
      console.warn('[voiceWS] sendSpeechEnd DROPPED — readyState=%s', state);
      return;
    }
    console.log('[voiceWS] → sendSpeechEnd');
    this.ws!.send(JSON.stringify({ type: 'speech_end' }));
  }

  /** Barge-in: tell the backend to abort the in-progress Haiku/TTS response.
   *  Called from AIGuide's onSpeechStart when the user starts speaking while
   *  the AI is still talking. No-op if the socket isn't open. */
  sendCancel(): void {
    const state = this.ws?.readyState;
    if (state !== WebSocket.OPEN) {
      console.warn('[voiceWS] sendCancel DROPPED — readyState=%s (expected OPEN=%d)', state, WebSocket.OPEN);
      return;
    }
    console.log('[voiceWS] → sendCancel (barge-in)');
    this.ws!.send(JSON.stringify({ type: 'cancel' }));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks = null;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const voiceWS = new VoiceWebSocket();
