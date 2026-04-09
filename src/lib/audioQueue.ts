// P7-B7.1: Sequential audio chunk playback for streaming TTS

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

class AudioQueue {
  private queue: string[] = [];
  private _isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;
  public onPlaybackStart: (() => void) | null = null;
  public onPlaybackEnd: (() => void) | null = null;

  enqueue(base64Audio: string): void {
    this.queue.push(base64Audio);
    if (!this._isPlaying) this.playNext();
  }

  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this._isPlaying = false;
      this.onPlaybackEnd?.();
      return;
    }

    this._isPlaying = true;
    this.onPlaybackStart?.();

    const base64 = this.queue.shift()!;
    const blob = base64ToBlob(base64, 'audio/mpeg');
    this.currentUrl = URL.createObjectURL(blob);

    this.currentAudio = new Audio(this.currentUrl);
    this.currentAudio.onended = () => {
      this.cleanup();
      this.playNext();
    };
    this.currentAudio.onerror = () => {
      this.cleanup();
      this.playNext();
    };

    try {
      await this.currentAudio.play();
    } catch {
      this.cleanup();
      this.playNext();
    }
  }

  private cleanup(): void {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
    this.currentAudio = null;
  }

  stop(): void {
    this.queue = [];
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    this.cleanup();
    this._isPlaying = false;
    this.onPlaybackEnd?.();
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }
}

export const audioQueue = new AudioQueue();
