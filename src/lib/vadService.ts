// P7-B7.1: Browser-side Voice Activity Detection via @ricky0123/vad-web

export interface VADCallbacks {
  onSpeechStart: () => void;
  onSpeechEnd: (audio: Float32Array) => void;
  onVADMisfire: () => void;
  /** P7-B8.1: per-frame audio forwarded for streaming STT.
   *  Fires for every frame between onSpeechStart and onSpeechEnd (inclusive
   *  of a 4-frame pre-roll that is flushed at onSpeechStart to capture the
   *  utterance onset MicVAD's minSpeechFrames gating would otherwise drop).
   *  Optional — omit to keep the batch onSpeechEnd-only behavior. */
  onFrameAudio?: (frame: Float32Array) => void;
}

class VADService {
  private vad: any = null;
  private frameCount = 0;
  private maxProbSeen = 0;
  // P7-B8.1: rolling pre-roll buffer so we don't miss the first ~288ms of
  // each utterance (MicVAD fires onSpeechStart only after minSpeechFrames=3
  // consecutive speech frames).
  private preRollBuffer: Float32Array[] = [];
  private readonly PRE_ROLL_FRAMES = 4;  // ~384ms @ 96ms/frame (legacy model)
  private inSpeechSegment = false;

  async start(callbacks: VADCallbacks): Promise<void> {
    console.log('[vadService] start() called — importing @ricky0123/vad-web');
    // Dynamic import — @ricky0123/vad-web uses ONNX runtime which needs browser context
    const { MicVAD } = await import('@ricky0123/vad-web');
    console.log('[vadService] MicVAD imported — calling MicVAD.new(...)');

    this.frameCount = 0;
    this.maxProbSeen = 0;
    this.preRollBuffer = [];
    this.inSpeechSegment = false;

    this.vad = await MicVAD.new({
      onSpeechStart: () => {
        console.log('[vadService] ▶ onSpeechStart');
        this.inSpeechSegment = true;
        // P7-B8.1: flush pre-roll so streaming STT captures the utterance onset.
        if (callbacks.onFrameAudio && this.preRollBuffer.length > 0) {
          console.log(`[vadService] flushing ${this.preRollBuffer.length} pre-roll frames`);
          for (const frame of this.preRollBuffer) {
            callbacks.onFrameAudio(frame);
          }
        }
        this.preRollBuffer = [];
        callbacks.onSpeechStart();
      },
      onSpeechEnd: (audio: Float32Array) => {
        console.log('[vadService] ■ onSpeechEnd — audio samples:', audio.length);
        this.inSpeechSegment = false;
        callbacks.onSpeechEnd(audio);
      },
      onVADMisfire: () => {
        console.log('[vadService] ✗ onVADMisfire');
        this.inSpeechSegment = false;
        callbacks.onVADMisfire();
      },
      onFrameProcessed: (
        probabilities: { isSpeech: number; notSpeech: number },
        frame: Float32Array,
      ) => {
        this.frameCount++;
        if (probabilities.isSpeech > this.maxProbSeen) {
          this.maxProbSeen = probabilities.isSpeech;
        }
        // Log every 100th frame (≈3s @ ~30fps) so the user sees VAD is alive
        if (this.frameCount % 100 === 0) {
          console.log(
            `[vadService] ${this.frameCount} frames processed, max isSpeech seen so far: ${this.maxProbSeen.toFixed(3)}`
          );
        }
        // Log any frame with non-trivial speech probability so we know the mic is hot
        if (probabilities.isSpeech > 0.1) {
          console.log(`[vadService] frame ${this.frameCount} isSpeech=${probabilities.isSpeech.toFixed(3)}`);
        }

        // P7-B8.1: streaming STT hook.
        if (this.inSpeechSegment) {
          // Inside a speech segment — forward the frame immediately.
          callbacks.onFrameAudio?.(frame);
        } else {
          // Pre-speech — maintain a rolling buffer for pre-roll.
          this.preRollBuffer.push(frame);
          if (this.preRollBuffer.length > this.PRE_ROLL_FRAMES) {
            this.preRollBuffer.shift();
          }
        }
      },
      // P7-B7.3: redemptionFrames bumped 8 → 30 (~960ms of silence required
      // before end-of-speech). Previous value (~267ms) was splitting single
      // utterances into multiple fragments whenever the user paused mid-
      // sentence to breathe or think — Haiku would respond to each fragment,
      // producing "multiple answers with different voices". Siri/Alexa use
      // 800–1200ms for exactly this reason.
      // P7-B8.2: positiveSpeechThreshold bumped 0.5 → 0.65. The Silero
      // default of 0.5 was too sensitive — background noise (typing, HVAC,
      // distant conversation) routinely hit 0.4–0.6 and triggered
      // onSpeechStart, spamming false speech_start messages at the backend.
      // Real speech consistently reaches 0.9+; 0.65 cleanly separates noise
      // from speech. Must stay ≤ 0.75 — earlier testing showed 0.85 caused
      // real speech to be missed.
      // Other values unchanged: 0.35 negative threshold handles natural
      // vowel tails in the 0.25–0.35 range, minSpeechFrames 3 filters
      // single-frame false positives. MicVAD's default getStream/resumeStream
      // (AGC + NS on) are used.
      positiveSpeechThreshold: 0.75,
      negativeSpeechThreshold: 0.35,
      redemptionFrames: 30,
      minSpeechFrames: 3,
      // Load ONNX runtime and model from CDN (avoids local file serving issues with Astro)
      onnxWASMBasePath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/',
      baseAssetPath: 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/',
    });
    console.log('[vadService] MicVAD.new() resolved — VAD is live and listening');
    this.vad.start();
  }

  stop(): void {
    if (this.vad) {
      this.vad.pause();
      this.vad.destroy();
      this.vad = null;
    }
  }

  /** Temporarily stop processing mic frames — used while the app plays TTS
   *  so VAD doesn't hear the AI's own voice through the speakers. */
  pause(): void {
    if (this.vad) {
      console.log('[vadService] ⏸ pause (audio playback started)');
      this.vad.pause();
    }
  }

  /** Resume processing mic frames after a pause. */
  resume(): void {
    if (this.vad) {
      console.log('[vadService] ▶ resume (audio playback finished)');
      this.vad.start();
    }
  }

  get isListening(): boolean {
    return this.vad !== null;
  }
}

export const vadService = new VADService();
