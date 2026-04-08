// P7-B6: Text-to-Speech service — Google Cloud TTS via backend proxy

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';

class TTSService {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;

  async speak(text: string): Promise<void> {
    this.stop();

    try {
      const response = await fetch(`${API_BASE}/v1/ai-guide/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: '21m00Tcm4TlvDq8ikWAM', speed: 1.0 }),
      });

      if (!response.ok) return; // silent failure

      const blob = await response.blob();
      this.objectUrl = URL.createObjectURL(blob);

      this.audio = new Audio(this.objectUrl);
      this.audio.onended = () => this.cleanup();
      this.audio.onerror = () => this.cleanup();

      await this.audio.play();
    } catch {
      this.cleanup();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.audio = null;
  }

  get isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }
}

export const ttsService = new TTSService();
