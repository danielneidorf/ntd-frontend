// P7-B9: Lightweight event logging for AI Guide interactions.
// Batches events and flushes every 10s + on beforeunload.
// Analytics never blocks UX — all errors silently dropped.

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';

export interface GuideEvent {
  ts: string;
  session_id: string;
  page: string;
  event: string;
  data?: Record<string, unknown>;
  duration_ms?: number;
  success?: boolean;
  error?: string;
}

class GuideAnalytics {
  private queue: GuideEvent[] = [];
  private sessionId: string;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.sessionId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => this.flush(), 10_000);
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  track(event: string, extra?: Partial<Omit<GuideEvent, 'ts' | 'session_id' | 'page' | 'event'>>) {
    this.queue.push({
      ts: new Date().toISOString(),
      session_id: this.sessionId,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      event,
      ...extra,
    });
  }

  private flush() {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      // Use sendBeacon for beforeunload reliability, fall back to fetch
      const body = JSON.stringify({ events: batch });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(`${API_BASE}/v1/ai-guide/events`, body);
      } else {
        fetch(`${API_BASE}/v1/ai-guide/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Silently drop — analytics should never block UX
    }
  }

  /** Reset session ID (e.g. on new voice connection). */
  newSession() {
    this.sessionId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  }
}

export const analytics = new GuideAnalytics();
