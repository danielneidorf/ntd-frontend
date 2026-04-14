# P7-B8.5 — Cross-Page Voice Navigation

## What
When `show_section` targets content on a different page (e.g., user is on `/quickscan/` Screen 1 and asks "ką gausite ataskaitoje?" — the answer lives on the landing page), the guide navigates there, shows the section, reads its narration, and on "toliau" returns to the original page and tour step. The Realtime voice connection drops on page navigation and reconnects automatically.

## Why / Context
B8.4 built `show_section` for same-page content. Cross-page requests currently return `{ error: "different_page" }` and the model tells the user verbally. The guide should be able to navigate the entire site, not just the current page.

Astro pages are full page loads — the React islands remount, the WebRTC peer connection drops. The tour engine already persists mode + step in `sessionStorage` (from B2, with `autoStart` prop and 300ms delay). We build on that pattern.

## How

### 1. Cross-page state — `sessionStorage` keys

Before navigating to a different page, save:

```typescript
interface CrossPageDetour {
  returnPath: string;        // e.g. "/quickscan/"
  returnTourId: string;      // e.g. "quickscan"
  returnStepIndex: number;   // e.g. 3
  targetTopic: string;       // content map topic to show on arrival
  voiceWasActive: boolean;   // was "Su balsu" mode on?
  seenSteps: number[];       // from seenStepsRef, to preserve skip state
}

sessionStorage.setItem('ntd-guide-detour', JSON.stringify(detour));
```

### 2. Update `show_section` handler — navigate on cross-page

In `AIGuide.tsx`, the existing `show_section` handler returns `{ error: "different_page" }` when `entry.tourId !== currentTourId`. Replace that branch:

```typescript
if (entry.tourId !== currentTourId) {
  // Save current state for return
  const detour: CrossPageDetour = {
    returnPath: window.location.pathname,
    returnTourId: currentTourId,
    returnStepIndex: tour.state.currentStepIndex,
    targetTopic: topic,
    voiceWasActive: voiceState === 'connected',
    seenSteps: Array.from(seenStepsRef.current)
  };
  sessionStorage.setItem('ntd-guide-detour', JSON.stringify(detour));

  // Disconnect voice cleanly (will reconnect on new page)
  if (rt?.isConnected()) {
    rt.disconnect();
  }

  // Navigate — the page path comes from the content map
  const targetPath = getPagePath(entry.tourId);
  window.location.href = targetPath;

  // Return immediately — page will unload
  return JSON.stringify({
    success: true,
    navigating: true,
    message: "Pereinu į kitą puslapį..."
  });
}
```

Add a path lookup:
```typescript
function getPagePath(tourId: string): string {
  switch (tourId) {
    case "landing": return "/";
    case "quickscan": return "/quickscan/";
    case "report": return "/report/"; // or however the report page is routed
    default: return "/";
  }
}
```

### 3. On page load — detect and execute detour

In `AIGuide.tsx`, add a `useEffect` (runs once on mount) that checks for a pending detour:

```typescript
useEffect(() => {
  const raw = sessionStorage.getItem('ntd-guide-detour');
  if (!raw) return;

  const detour: CrossPageDetour = JSON.parse(raw);
  // Don't clear yet — clear after the return navigation

  // Find the target step from the content map
  const entry = findContentByTopic(detour.targetTopic);
  if (!entry) {
    sessionStorage.removeItem('ntd-guide-detour');
    return;
  }

  // Wait for tour to initialize, then jump to the target step
  const jumpToTarget = () => {
    const stepIndex = tour.steps.findIndex(s => s.id === entry.stepId);
    if (stepIndex === -1) {
      sessionStorage.removeItem('ntd-guide-detour');
      return;
    }

    // Mark this as a detour arrival (so tour_next knows to return)
    crossPageReturnRef.current = detour;

    // Jump to the step — this triggers scroll + spotlight + narration
    tour.goToStep(stepIndex);
  };

  // Delay slightly to let the tour engine initialize
  setTimeout(jumpToTarget, 500);

  // Reconnect voice if it was active
  if (detour.voiceWasActive) {
    // Trigger voice connection — same as clicking "Su balsu"
    // The exact mechanism depends on how AIGuide currently starts voice
    setTimeout(() => startVoiceConcierge(), 800);
  }
}, []); // mount only
```

**`crossPageReturnRef`**: A new `useRef<CrossPageDetour | null>` that holds the return info. When set, `tour_next` triggers a return navigation instead of advancing.

### 4. Update `tour_next` — handle cross-page return

```typescript
// Inside tour_next handler, before the existing returnStepRef check:
if (crossPageReturnRef.current) {
  const detour = crossPageReturnRef.current;
  crossPageReturnRef.current = null;

  // Save return state so the original page knows where to resume
  sessionStorage.setItem('ntd-guide-return', JSON.stringify({
    tourId: detour.returnTourId,
    stepIndex: detour.returnStepIndex + 1, // advance past the step they were on
    voiceWasActive: detour.voiceWasActive,
    seenSteps: detour.seenSteps
  }));

  // Clean up detour state
  sessionStorage.removeItem('ntd-guide-detour');

  // Disconnect and navigate back
  if (rt?.isConnected()) rt.disconnect();
  window.location.href = detour.returnPath;

  return JSON.stringify({
    success: true,
    returning: true,
    message: "Grįžtu atgal..."
  });
}
```

### 5. On page load — detect return and resume

Add another check in the mount `useEffect` for `ntd-guide-return`:

```typescript
const returnRaw = sessionStorage.getItem('ntd-guide-return');
if (returnRaw) {
  const returnState = JSON.parse(returnRaw);
  sessionStorage.removeItem('ntd-guide-return');

  // Restore seen steps
  if (returnState.seenSteps) {
    seenStepsRef.current = new Set(returnState.seenSteps);
  }

  // Resume tour at the saved step (already +1 from the pre-detour position)
  setTimeout(() => {
    tour.goToStep(returnState.stepIndex);
  }, 500);

  // Reconnect voice
  if (returnState.voiceWasActive) {
    setTimeout(() => startVoiceConcierge(), 800);
  }
}
```

### 6. System prompt — update model behavior for cross-page

Update the `show_section` tool description to remove the "ask the user" language for cross-page:

```
Jei sekcija yra kitame puslapyje — automatiškai pereis. Trumpai pasakyk "Parodysiu — reikės pereiti į kitą puslapį" ir iškart kvieski show_section.
```

The model shouldn't ask for permission — it should briefly announce and navigate. The return is always one "toliau" away.

### 7. Voice reconnection UX

The voice disconnects during navigation (~2-3s gap). On the new page:
1. Guide appears immediately (tour + spotlight).
2. Voice reconnects in background (ephemeral token → WebRTC → connected).
3. Narration plays once voice is ready.

If the narration `sendNarration` is called before the connection is ready, queue it. Add a simple queue in `AIGuide.tsx`:

```typescript
const pendingNarrationRef = useRef<string | null>(null);

// In the narration useEffect:
if (rt?.isConnected()) {
  rt.sendNarration(narrationText);
} else {
  pendingNarrationRef.current = narrationText;
}

// In the voice state change handler:
if (voiceState === 'connected' && pendingNarrationRef.current) {
  rt.sendNarration(pendingNarrationRef.current);
  pendingNarrationRef.current = null;
}
```

## Constraints

- **Backend: zero changes.**
- **The Realtime connection WILL drop.** Conversation context is lost. The model starts fresh on the new page with a new ephemeral token. This is acceptable — the detour is a brief "look at this" and return, not a continued conversation.
- **`sessionStorage` only.** No `localStorage`, no cookies, no backend persistence.
- **Clean up all detour keys** on successful return. Never leave stale state.
- **Timeout on reconnection.** If voice can't reconnect within 5 seconds, proceed without voice (the visual tour still works). Don't block the detour UX on voice.
- **No infinite loops.** If the target page doesn't have the expected step, clear all detour state and fall back gracefully.
- **Tests:** Add tests for detour state serialization/deserialization, cross-page return logic, narration queuing. Target: 73 + ~5 = ~78.
- **TypeScript, no `any`.**

## Files to touch

### Modified files (frontend `~/dev/ntd`):
- `src/components/guide/AIGuide.tsx` — cross-page navigation in `show_section`, detour detection on mount, return detection on mount, `crossPageReturnRef`, narration queue, voice auto-reconnect
- `src/components/guide/toolDefinitions.ts` — update `show_section` description for cross-page
- `src/components/guide/contentMap.ts` — add `getPagePath()` helper
- `src/components/guide/__tests__/FormActionExecutor.test.ts` — new tests

### Not touched:
- Backend — no changes
- `src/lib/realtimeVoice.ts` — no changes
- `src/components/QuickScanFlow.tsx` — no changes
- Tour config files — no changes

## Verification

1. On `/quickscan/` Screen 1, "Su balsu" mode, step 2.
2. User asks "Ką gausite ataskaitoje?" → model calls `show_section("report_contents")`.
3. Model says "Parodysiu — reikės pereiti į kitą puslapį."
4. Page navigates to `/`. Tour starts at the "Ką gausite" step. Spotlight highlights the grid.
5. Voice reconnects (~2-3s). Narration plays: the existing step narration for that section.
6. User says "toliau" → page navigates back to `/quickscan/`. Tour resumes at step 3 (past the step they were on). Voice reconnects. Narration for step 3 plays.
7. The "Ką gausite" step is in `seenSteps` — if the landing tour is started later, it's skipped.
8. If voice fails to reconnect, visual tour still works. No crash.
9. Build passes, all tests green.