# P7-B9 — Event Logging + Mobile Voice UX

## What
Two deliverables completing the original B9 scope:

1. **Level 1 event logging** — every tool call, narration, and voice session lifecycle event is logged to a lightweight backend endpoint. Structured JSON, queryable with `grep`/`jq`. No dashboard, no database — just a log file on disk.
2. **Mobile voice UX** — responsive adaptations for the guide on small screens: narration bubble becomes a bottom sheet, Robocat moves to bottom-center, voice controls are thumb-friendly.

Level 2 analytics (database storage, dashboards, funnels, conversation quality scoring) is explicitly deferred to backlog — build when there's real user volume to analyze.

## Part 1: Event Logging

### What gets logged

Every interaction with the guide, from either mode:

```typescript
interface GuideEvent {
  ts: string;              // ISO timestamp
  session_id: string;      // random ID per voice session or page visit
  page: string;            // current path: "/", "/quickscan/", "/report/"
  mode: "voice" | "text" | "tour"; // which mode is active
  event: string;           // event type (see below)
  data?: Record<string, unknown>; // event-specific payload
  duration_ms?: number;    // for timed events
  success?: boolean;       // for tool calls
  error?: string;          // error message if failed
}
```

**Event types:**

| Event | When | Data |
|---|---|---|
| `voice_connect` | Realtime session connected | `{ model, voice }` |
| `voice_disconnect` | Session ended | `{ duration_ms, reason }` |
| `tool_call` | Any function call from model | `{ tool, args, success, error, duration_ms }` |
| `narration` | Step narration sent | `{ step_id, tour_id }` |
| `tour_start` | Tour activated | `{ tour_id, mode }` |
| `tour_end` | Tour stopped/completed | `{ tour_id, steps_seen, total_steps }` |
| `detour` | show_section used | `{ topic, same_page }` |
| `cross_page` | Cross-page navigation | `{ from, to, topic }` |
| `chat_message` | Text chat sent | `{ step_id }` (no message content — privacy) |
| `mode_switch` | User switches Be balso/Su balsu | `{ from, to }` |

### Backend endpoint

New endpoint: `POST /v1/ai-guide/events`

```python
@router.post("/events")
async def log_guide_events(request: Request):
    """Append guide events to a structured log file."""
    body = await request.json()
    events = body.get("events", [])

    for event in events:
        event["ip"] = request.client.host  # for rough geo later
        event["ua"] = request.headers.get("user-agent", "")
        logger.info("guide_event: %s", json.dumps(event))

    return {"ok": True, "count": len(events)}
```

Events are written to the existing Python logger — they'll appear in the application log file alongside other backend logs. No new database table, no new dependencies.

### Frontend event collector

New file: `src/lib/guideAnalytics.ts`

A lightweight collector that batches events and sends them periodically:

```typescript
class GuideAnalytics {
  private queue: GuideEvent[] = [];
  private sessionId: string;
  private flushInterval: number;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.flushInterval = setInterval(() => this.flush(), 10_000); // every 10s
    window.addEventListener('beforeunload', () => this.flush());
  }

  track(event: string, data?: Record<string, unknown>) {
    this.queue.push({
      ts: new Date().toISOString(),
      session_id: this.sessionId,
      page: window.location.pathname,
      mode: this.getCurrentMode(),
      event,
      ...data
    });
  }

  private async flush() {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      await fetch(`${API_BASE}/v1/ai-guide/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch })
      });
    } catch {
      // Silently drop — analytics should never block UX
    }
  }
}

export const analytics = new GuideAnalytics();
```

**Singleton** — imported and used directly. The ESM module pattern (same as `formActionsRegistry`) means both Astro islands share the same instance.

### Integration points

Add `analytics.track()` calls to:

- `realtimeVoice.ts` — `voice_connect`, `voice_disconnect`
- `FormActionExecutor.ts` — wrap every handler call with timing: `tool_call` with `success`, `error`, `duration_ms`
- `AIGuide.tsx` — `tour_start`, `tour_end`, `narration`, `mode_switch`, `detour`, `cross_page`
- `ChatInputCard.tsx` — `chat_message` (step_id only, no content)

Each is 1-2 lines. The `FormActionExecutor` wrapper is the most important — it gives tool-level success/failure data for every voice command.

### Privacy

- No message content logged (chat or voice transcripts)
- No email addresses
- No payment details
- Session ID is random, not tied to identity
- IP logged for rough geographic distribution only

## Part 2: Mobile Voice UX

### Current state

The Robocat is `fixed bottom-24 right-12` (128×128px). The narration bubble floats above it (260-320px wide). The mode selector ("Be balso" / "Su balsu") appears on hover. On mobile: the Robocat is partially off-screen or overlaps content, the bubble is too wide, hover doesn't work (no mouse), and the voice button is too small for thumb tapping.

### Changes

**Breakpoint:** `max-width: 768px` (Tailwind `md` breakpoint). All changes scoped to this.

#### Robocat repositioning
- Move from `bottom-24 right-12` → `bottom-4 left-1/2 -translate-x-1/2` (bottom-center)
- Reduce to 96×96px on mobile
- Tap to open mode selector (hover already falls back to click from B1.2)

#### Narration bubble → bottom sheet
On mobile, the narration bubble becomes a bottom sheet:
- Full-width, anchored to bottom of viewport
- Above the Robocat (which sits at the very bottom)
- Max height 40vh, scrollable if narration is long
- Rounded top corners, subtle shadow
- Step counter + close button at top
- Swipe-down to dismiss (CSS + touch event)

```css
@media (max-width: 768px) {
  .narration-bubble {
    position: fixed;
    bottom: 100px; /* above Robocat */
    left: 0;
    right: 0;
    width: 100%;
    max-height: 40vh;
    border-radius: 16px 16px 0 0;
    overflow-y: auto;
  }
}
```

#### Voice mode controls
- "Su balsu" button: minimum 48×48px touch target (accessibility)
- When voice is active: pulsing mic indicator centered above Robocat
- Subtle waveform animation when AI is speaking (CSS only — pulse + scale)
- "Sustabdyti" (stop) button clearly visible, same 48px minimum

#### Spotlight overlay on mobile
- Spotlight cutout padding increased to 12px (easier to see target on small screens)
- If target is behind the bottom sheet, auto-scroll to put it above the sheet

#### Mode selector on mobile
- Full-width bottom card instead of floating popup
- Two large buttons stacked vertically: "📖 Be balso" / "🎙 Su balsu"
- Clear tap targets, no hover dependency

### Chat on mobile
- `ChatInputCard.tsx` goes full-width at bottom
- Input field with send button, 48px height
- Conversation scrolls above
- Keyboard-aware: when soft keyboard opens, sheet adjusts

## Constraints

- **Backend: one new endpoint** (`/events`) — append to log file only.
- **No database tables** for analytics. Log file is the store.
- **Analytics must never block UX.** All `fetch` calls are fire-and-forget with try/catch that swallows errors.
- **No user content in logs.** Transcript text, chat messages, email addresses — none of these go to the events endpoint.
- **Mobile CSS only — no separate mobile components.** Same React components with responsive Tailwind classes and one `@media` block.
- **Touch targets: 48px minimum** per WCAG 2.5.5.
- **Tests:** Add tests for `GuideAnalytics` (batching, flush, event shape). Mobile CSS is tested via Chrome MCP visual inspection, not Vitest. Target: 95 + ~4 = ~99.

## Backlog note (Level 2 — NOT this brief)

For future implementation when user volume justifies it:
- Database table for events (PostgreSQL `guide_events`)
- PostHog or Mixpanel integration
- Drop-off funnel: tour_start → tool_call(fill_address) → tool_call(click_continue) → tool_call(click_pay)
- Common questions extraction from chat messages
- Conversation quality score (tools called / errors / completion)
- A/B: voice vs self-guided conversion rate
- Session replay for voice interactions

## Files to touch

### New files:
- `src/lib/guideAnalytics.ts` — event collector singleton
- Backend: new route or addition to `bustodnr_api/ai_guide.py` — `/events` endpoint

### Modified files:
- `src/lib/realtimeVoice.ts` — `analytics.track` for connect/disconnect
- `src/components/guide/FormActionExecutor.ts` — wrapper with timing + tracking
- `src/components/guide/AIGuide.tsx` — tour lifecycle + mode switch tracking
- `src/components/guide/AIGuideToggle.tsx` — mobile layout (responsive classes)
- `src/components/guide/AIGuideOverlay.tsx` — mobile spotlight padding
- `src/components/guide/NarrationBubble.tsx` — bottom sheet on mobile
- `src/components/guide/RiveAvatar.tsx` — mobile size + position
- `src/components/guide/ChatInputCard.tsx` — mobile full-width + chat_message tracking

## Verification

### Analytics
1. Open guide in voice mode, navigate a few steps, use show_section.
2. Check backend log: `grep guide_event` shows structured JSON lines.
3. Each line has `session_id`, `event`, `page`, `mode`, `ts`.
4. `tool_call` events have `tool`, `success`, `duration_ms`.
5. No transcript text or personal data in any event.
6. Close tab → `beforeunload` flushes remaining events.

### Mobile
1. Open Chrome DevTools → device toolbar → iPhone 14 (390px).
2. Robocat is bottom-center, 96px.
3. Tap Robocat → mode selector shows as full-width bottom card.
4. Select "Su balsu" → mic indicator visible, 48px+ tap target.
5. Narration appears as bottom sheet, full-width, max 40vh.
6. Spotlight highlights target element, scrolls into view above sheet.
7. Swipe down on sheet → dismisses.
8. All interactive elements are at least 48×48px.

Build passes, all tests green.