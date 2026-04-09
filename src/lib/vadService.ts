// P7-B7.1: Browser-side Voice Activity Detection via @ricky0123/vad-web

export interface VADCallbacks {
  onSpeechStart: () => void;
  onSpeechEnd: (audio: Float32Array) => void;
  onVADMisfire: () => void;
}

class VADService {
  private vad: any = null;
  private frameCount = 0;
  private maxProbSeen = 0;

  async start(callbacks: VADCallbacks): Promise<void> {
    console.log('[vadService] start() called — importing @ricky0123/vad-web');
    // Dynamic import — @ricky0123/vad-web uses ONNX runtime which needs browser context
    const { MicVAD } = await import('@ricky0123/vad-web');
    console.log('[vadService] MicVAD imported — calling MicVAD.new(...)');

    this.frameCount = 0;
    this.maxProbSeen = 0;

    this.vad = await MicVAD.new({
      onSpeechStart: () => {
        console.log('[vadService] ▶ onSpeechStart');
        callbacks.onSpeechStart();
      },
      onSpeechEnd: (audio: Float32Array) => {
        console.log('[vadService] ■ onSpeechEnd — audio samples:', audio.length);
        callbacks.onSpeechEnd(audio);
      },
      onVADMisfire: () => {
        console.log('[vadService] ✗ onVADMisfire');
        callbacks.onVADMisfire();
      },
      onFrameProcessed: (probabilities: { isSpeech: number; notSpeech: number }) => {
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
      },
      // P7-B7.3: redemptionFrames bumped 8 → 30 (~960ms of silence required
      // before end-of-speech). Previous value (~267ms) was splitting single
      // utterances into multiple fragments whenever the user paused mid-
      // sentence to breathe or think — Haiku would respond to each fragment,
      // producing "multiple answers with different voices". Siri/Alexa use
      // 800–1200ms for exactly this reason.
      // Other values unchanged: 0.5 is Silero's default positive threshold,
      // 0.35 negative threshold handles natural vowel tails in the 0.25–0.35
      // range, minSpeechFrames 3 filters single-frame false positives.
      // MicVAD's default getStream/resumeStream (AGC + NS on) are used.
      positiveSpeechThreshold: 0.5,
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
