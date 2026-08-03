// P7-B9: OpenAI Realtime API — WebRTC connection manager for voice concierge.
// Replaces the multi-provider pipeline (Silero VAD + Azure STT + Haiku + Azure TTS)
// with a single WebRTC connection to OpenAI's gpt-realtime model.
//
// The browser connects directly to OpenAI — no audio passes through our backend.
// Our backend's only role is to generate an ephemeral token via /voice-session.

import { analytics } from './guideAnalytics';

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';

export interface RealtimeCallbacks {
  /** User's speech transcribed by OpenAI (final transcript after each turn) */
  onUserTranscript?: (text: string) => void;
  /** AI's response text — either a streaming delta (isFinal=false) or the
   *  complete transcript of the finished audio response (isFinal=true). */
  onAITranscript?: (text: string, isFinal: boolean) => void;
  /** OpenAI's server-side VAD detected speech onset */
  onSpeechStarted?: () => void;
  /** OpenAI's server-side VAD detected speech offset */
  onSpeechStopped?: () => void;
  /** Full response (including audio) is complete */
  onResponseDone?: () => void;
  /** Model invoked a function — return the JSON result string */
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => Promise<string>;
  /** Connection lifecycle state change */
  onStateChange?: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  /** Error from any stage (token, mic, SDP, runtime) */
  onError?: (message: string) => void;
}

export class RealtimeVoice {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private micStream: MediaStream | null = null;
  private callbacks: RealtimeCallbacks = {};
  private _connected = false;
  private _connectedAt = 0;
  /** Resolves when the data channel is open and ready for sendTextPrompt(). */
  private _readyResolve: (() => void) | null = null;
  private _readyPromise: Promise<void>;
  /** A4.2 — resolves once the Art. 50 disclosure is on screen. Every path that
   *  can trigger the model's first turn awaits this. */
  private _disclosureResolve: (() => void) | null = null;
  private _disclosurePromise: Promise<void>;
  /** raw narration → backend-expanded form. Empty means speak raw. */
  private _prepared = new Map<string, string>();

  constructor() {
    // Create an in-memory audio element for WebRTC playback — no JSX ref needed.
    this.audioEl = document.createElement('audio');
    this.audioEl.autoplay = true;
    this._readyPromise = new Promise((resolve) => { this._readyResolve = resolve; });
    this._disclosurePromise = new Promise((resolve) => { this._disclosureResolve = resolve; });
  }

  /** A4.2 — declare that the Art. 50 disclosure is on screen, releasing the
   *  model's first turn. Call as soon as the on-screen line renders, before
   *  connect() has a chance to produce a turn.
   *
   *  Why a gate at all, when the line renders immediately? Because Art. 50(1)
   *  wants the person informed *at the latest at first interaction*, and this is
   *  what makes that an ordering guarantee rather than a race. There is no
   *  automatic first turn — the model speaks only on `response.create` — so
   *  gating every sender is sufficient, and it is done HERE rather than in the
   *  caller because a user who types the moment the card opens would otherwise
   *  reach the model through sendTextPrompt() first.
   *
   *  A4.1 history: this originally awaited a pre-rendered spoken clip, and the
   *  gate existed to stop the model talking over it. The clip was deferred to
   *  backlog on 2026-07-31 — reaching voice already passes three always-visible
   *  disclosures, and the session then carries this line plus live subtitles. It
   *  reopens only if voice activation ever gains a path that bypasses the avatar
   *  surface. See `docs/deferred_backlog.md` in bustodnr. */
  markDisclosureShown(): void {
    this._disclosureResolve?.();
    this._disclosureResolve = null;
  }

  /**
   * Connect to OpenAI's Realtime API via WebRTC.
   *
   * 1. Fetches an ephemeral token from our backend (/voice-session)
   * 2. Creates an RTCPeerConnection
   * 3. Captures the mic and adds the audio track
   * 4. Opens a data channel for events (transcripts, VAD signals)
   * 5. Exchanges SDP with OpenAI and establishes the connection
   *
   * Throws on any failure; the caller should handle the error and show
   * appropriate UI (e.g. "Voice unavailable").
   */
  async connect(
    callbacks: RealtimeCallbacks,
    propertyContext?: string,
    narrations: string[] = [],
  ): Promise<void> {
    this.callbacks = callbacks;
    this.callbacks.onStateChange?.('connecting');

    try {
      // 1. Get ephemeral token from our backend
      const tokenRes = await fetch(`${API_BASE}/v1/ai-guide/voice-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // P7-VOICE-FIX: the tour's narration strings ride along so the backend
        // can expand Lithuanian abbreviations („g." → „gatvė") before the model
        // speaks them. Batched onto a call that already happens, so nothing is
        // added to the speech path itself.
        body: JSON.stringify({
          property_context: propertyContext ?? null,
          narrations,
        }),
      });

      if (!tokenRes.ok) {
        const detail = await tokenRes.text();
        throw new Error(`Token request failed: ${tokenRes.status} ${detail}`);
      }

      const { client_secret, model, prepared_narrations } = await tokenRes.json();
      console.log('[RealtimeVoice] ephemeral token obtained, model:', model);
      // FAIL-OPEN, deliberately: if the backend returned nothing usable, the map
      // stays empty and every narration is spoken raw. Less well pronounced is a
      // far better failure than silence.
      if (Array.isArray(prepared_narrations)
          && prepared_narrations.length === narrations.length) {
        narrations.forEach((raw, i) => this._prepared.set(raw, prepared_narrations[i]));
      } else if (prepared_narrations !== undefined) {
        console.warn('[RealtimeVoice] prepared narrations unusable — speaking raw');
      }

      // 2. Create WebRTC peer connection
      this.pc = new RTCPeerConnection();

      // 3. Audio output — OpenAI sends audio via WebRTC track
      this.pc.ontrack = (e) => {
        console.log('[RealtimeVoice] audio track received');
        this.audioEl.srcObject = e.streams[0];
      };

      // 4. Capture mic and add to peer connection
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = this.micStream.getAudioTracks()[0];
      this.pc.addTrack(audioTrack, this.micStream);
      console.log('[RealtimeVoice] mic track added');

      // 5. Data channel for events (transcripts, VAD signals, etc.)
      this.dc = this.pc.createDataChannel('oai-events');
      this.dc.onopen = () => {
        console.log('[RealtimeVoice] data channel open');
        this._connected = true;
        this._readyResolve?.();
        this._connectedAt = Date.now();
        analytics.track('voice_connect', { data: { model } });
        this.callbacks.onStateChange?.('connected');
      };
      this.dc.onclose = () => {
        console.log('[RealtimeVoice] data channel closed');
        this._connected = false;
        this.callbacks.onStateChange?.('disconnected');
      };
      this.dc.onmessage = (e) => this._handleEvent(JSON.parse(e.data));

      // 6. ICE connection state monitoring
      this.pc.oniceconnectionstatechange = () => {
        const state = this.pc?.iceConnectionState;
        console.log('[RealtimeVoice] ICE state:', state);
        if (state === 'failed' || state === 'disconnected') {
          this.callbacks.onStateChange?.('error');
        }
      };

      // 7. Create offer and exchange SDP with OpenAI
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // GA SDP exchange. The beta shape — `/v1/realtime?model=…`, model in the
      // query string — was disabled by OpenAI and returns 400
      // `beta_api_shape_disabled`. Under GA the model comes from the session the
      // ephemeral key was minted against, so it is NOT sent here.
      //
      // Verified 2026-08-03 with a real audio offer against all three candidates:
      //   /v1/realtime?model=…  -> 400 beta_api_shape_disabled
      //   /v1/realtime          -> 400 beta_api_shape_disabled
      //   /v1/realtime/calls    -> 201 + SDP answer  ✓
      // Note the middle one: OpenAI's own error text says "Please use /v1/realtime
      // for the GA API", and that advice is wrong — it fails identically. Trust
      // the probe, not the message.
      const sdpRes = await fetch(
        'https://api.openai.com/v1/realtime/calls',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${client_secret}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        },
      );

      if (!sdpRes.ok) {
        const detail = await sdpRes.text();
        throw new Error(`SDP exchange failed: ${sdpRes.status} ${detail}`);
      }

      const answerSdp = await sdpRes.text();
      await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      console.log('[RealtimeVoice] WebRTC connected');

    } catch (err) {
      console.error('[RealtimeVoice] connect failed:', err);
      this.callbacks.onStateChange?.('error');
      this.callbacks.onError?.(String(err));
      this.disconnect();
      throw err;
    }
  }

  /** Handle events from the OpenAI data channel. */
  private _handleEvent(event: any): void {
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        console.log('[RealtimeVoice] speech started (server VAD)');
        this.callbacks.onSpeechStarted?.();
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('[RealtimeVoice] speech stopped (server VAD)');
        this.callbacks.onSpeechStopped?.();
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User's speech transcribed by OpenAI
        if (event.transcript) {
          console.log('[RealtimeVoice] user transcript:', event.transcript);
          this.callbacks.onUserTranscript?.(event.transcript);
        }
        break;

      case 'response.audio_transcript.delta':
        // Streaming AI response text delta
        if (event.delta) {
          this.callbacks.onAITranscript?.(event.delta, false);
        }
        break;

      case 'response.audio_transcript.done':
        // Final AI response text (complete transcript of the spoken response)
        if (event.transcript) {
          console.log('[RealtimeVoice] AI transcript:', event.transcript);
          this.callbacks.onAITranscript?.(event.transcript, true);
        }
        break;

      case 'response.function_call_arguments.done':
        // Model completed a function call — dispatch to callback and return result
        if (this.callbacks.onFunctionCall && event.name && event.call_id) {
          const callId = event.call_id as string;
          const fnName = event.name as string;
          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(event.arguments || '{}');
          } catch { /* empty args */ }

          console.log('[RealtimeVoice] function call:', fnName, parsedArgs);

          this.callbacks.onFunctionCall(fnName, parsedArgs, callId).then((result) => {
            if (!this.dc || this.dc.readyState !== 'open') return;
            this.dc.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: callId,
                output: result,
              },
            }));
            this.dc.send(JSON.stringify({ type: 'response.create' }));
            console.log('[RealtimeVoice] → function result sent for', fnName);
          });
        }
        break;

      case 'response.done':
        this.callbacks.onResponseDone?.();
        break;

      case 'error':
        console.error('[RealtimeVoice] server error:', event);
        this.callbacks.onError?.(event.message || 'Unknown server error');
        break;

      default:
        // Don't log raw audio frame events (response.audio.delta fires ~50x/sec)
        if (event.type && !event.type.startsWith('response.audio.')) {
          console.debug('[RealtimeVoice] event:', event.type);
        }
        break;
    }
  }

  /** Tear down the WebRTC connection and release mic/audio resources. */
  disconnect(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    // Stop mic tracks so the browser releases the microphone indicator
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.audioEl.srcObject = null;
    // Release the gate on teardown so nothing is left awaiting a promise that
    // can no longer resolve — e.g. a queued narration when the user aborts
    // before the disclosure rendered.
    this.markDisclosureShown();
    if (this._connected) {
      analytics.track('voice_disconnect', { duration_ms: this._connectedAt ? Date.now() - this._connectedAt : undefined });
    }
    this._connected = false;
    this._connectedAt = 0;
    console.log('[RealtimeVoice] disconnected');
  }

  /** Push updated session config (instructions, tools) to the Realtime model mid-conversation. */
  updateSession(config: Record<string, unknown>): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('[RealtimeVoice] updateSession — data channel not open');
      return;
    }
    this.dc.send(JSON.stringify({
      type: 'session.update',
      session: config,
    }));
    console.log('[RealtimeVoice] → session.update');
  }

  /** Send a text message to the Realtime model and trigger a spoken response.
   *
   *  Used for two purposes:
   *  1. Tour step narrations in "Su balsu" mode — AI reads the narration in
   *     its own words (natural, not robotic text-to-speech).
   *  2. Typed chat messages during voiced mode (instead of the /chat REST
   *     endpoint) — AI responds with speech.
   *
   *  Sends two data channel events: `conversation.item.create` (adds a text
   *  message to the conversation) + `response.create` (tells the model to
   *  generate and speak a response). */
  async sendTextPrompt(text: string): Promise<void> {
    // A4.2 — never let the model's first turn land on top of the disclosure.
    await this._disclosurePromise;
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('[RealtimeVoice] sendTextPrompt — data channel not open');
      return;
    }
    this.dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    }));
    this.dc.send(JSON.stringify({ type: 'response.create' }));
    console.log('[RealtimeVoice] → sendTextPrompt:', text.slice(0, 80));
  }

  /** Send a narration text for the model to read verbatim, then stop.
   *
   *  Uses per-response instructions to override the session-level prompt
   *  for this turn only — the model reads the text and stays silent after. */
  async sendNarration(text: string): Promise<void> {
    // A4.2 — in tour voice mode this is the first turn, fired by the narration
    // effect the moment the session connects. It must queue behind the clip.
    await this._disclosurePromise;
    if (!this.dc || this.dc.readyState !== 'open') {
      console.warn('[RealtimeVoice] sendNarration — data channel not open');
      return;
    }
    this.dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        // Speak the backend-expanded form when we have it („Žirmūnų g. 12-5" →
        // „Žirmūnų gatvė dvylika penki"); fall back to raw, never to silence.
        content: [{ type: 'input_text', text: `[NARACIJA]\n${this._prepared.get(text) ?? text}` }],
      },
    }));
    this.dc.send(JSON.stringify({
      type: 'response.create',
      response: {
        instructions: 'Perskaityk tiksliai naudotojo pateiktą tekstą po [NARACIJA] žymos. Skaityk žodis žodžiui. Baigęs — TYLĖK. Nieko nepridėk. Nelaukdamas atsakymo, tiesiog nutilk.',
      },
    }));
    console.log('[RealtimeVoice] → sendNarration:', text.slice(0, 80));
  }

  /** Returns a promise that resolves when the data channel is open and
   *  ready for sendTextPrompt(). Use this to gate the first narration send
   *  on connection readiness — avoids a race where the tour step effect
   *  fires before the data channel has finished opening. */
  waitForReady(): Promise<void> {
    return this._readyPromise;
  }

  /** Whether the WebRTC data channel is currently open. */
  get connected(): boolean {
    return this._connected;
  }
}
