# P7-B8.2-fix — Narration Double-Speak + Tour Navigation Tools

## What
Two targeted fixes for issues found during live "Su balsu" testing:

1. **Narration double-speak:** When `sendTextPrompt` sends a tour narration, the Realtime model reads the narration AND then improvises/paraphrases the same content in its own words. The user hears everything twice.
2. **"Toliau" does nothing:** The user says "toliau" (next) to advance the tour, but no tool exists for tour step navigation. The model can read narrations but cannot control the tour.

## Why / Context
The `sendTextPrompt` call in `AIGuide.tsx` (~line 286) sends narration text prefixed with something like "Perskaityk šį tekstą balsu, žodis žodžiui:". The model reads the text, then — because it's a conversational model — generates its own follow-up response about the same content. Two audio outputs overlap or play back-to-back.

The tour engine (`useTour`) exposes `tour.next()` and `tour.back()`, but these are not registered as tools in the Realtime session. The model has no way to advance or rewind the tour.

## How

### Fix A: Stop narration double-speak

The problem is in how `sendTextPrompt` frames narration text. The model treats it as conversational input and responds after reading.

**Option 1 (preferred): Tighter prompt instruction.** Change the narration prefix sent by `AIGuide.tsx` when forwarding step narrations:

Current (approximate):
```
"Perskaityk šį tekstą balsu, žodis žodžiui: [narration text]"
```

Replace with:
```
"[NARACIJA] Perskaityk tiksliai šį tekstą. Po perskaitymo — tylėk ir lauk. Nieko nepridėk, nekomentuok, nekartok kitais žodžiais.\n\n[narration text]"
```

**Option 2 (belt-and-suspenders): System prompt reinforcement.** In `buildScreenInstructions()` (or in the base system prompt passed at session creation via `/voice-session`), add a rule:

```
Kai gauni žinutę prasidedančią [NARACIJA] — perskaityk tekstą tiksliai žodis žodžiui. Baigęs — tylėk. NIEKADA nekomentuok, neperfrazuok ir nepridėk savo žodžių po naracijos.
```

Apply both options. The `[NARACIJA]` tag gives the model a clear signal to switch to verbatim-read mode.

**Where to change:**
- `AIGuide.tsx` — the `useEffect` that calls `rt.sendTextPrompt(...)` on step change. Update the prefix string.
- `toolDefinitions.ts` or the backend `/voice-session` system prompt — add the `[NARACIJA]` rule to instructions.

### Fix B: Tour navigation tools

Add two tools to `TOOLS_COMMON` in `toolDefinitions.ts`:

```typescript
{
  type: "function",
  name: "tour_next",
  description: "Pereiti į kitą gido žingsnį. Naudok kai naudotojas sako 'toliau', 'kitas', 'pirmyn', 'eime' ar panašiai.",
  parameters: { type: "object", properties: {}, required: [] }
},
{
  type: "function",
  name: "tour_back",
  description: "Grįžti į ankstesnį gido žingsnį. Naudok kai naudotojas sako 'atgal', 'grįžk', 'ankstesnis' ar panašiai.",
  parameters: { type: "object", properties: {}, required: [] }
}
```

**Register from `AIGuide.tsx`** (not `QuickScanFlow.tsx`) because `AIGuide` owns the tour state:

```typescript
// In the useEffect that currently registers __screen / get_current_screen
formActionsRegistry.register('tour_next', async () => {
  if (!tour || !tour.state.isActive) {
    return JSON.stringify({ success: false, error: "tour_not_active" });
  }
  const hasNext = tour.state.currentStepIndex < tour.state.totalSteps - 1;
  if (!hasNext) {
    return JSON.stringify({ success: false, error: "last_step", message: "Tai paskutinis žingsnis." });
  }
  tour.next();
  return JSON.stringify({ success: true, step: tour.state.currentStepIndex + 1 });
});

formActionsRegistry.register('tour_back', async () => {
  if (!tour || !tour.state.isActive) {
    return JSON.stringify({ success: false, error: "tour_not_active" });
  }
  const hasBack = tour.state.currentStepIndex > 0;
  if (!hasBack) {
    return JSON.stringify({ success: false, error: "first_step", message: "Tai pirmas žingsnis." });
  }
  tour.back();
  return JSON.stringify({ success: true, step: tour.state.currentStepIndex - 1 });
});
```

**Note:** Claude Code must inspect `AIGuide.tsx` and `useTour` to find the exact API — `tour.next()`, `tour.back()`, `tour.state.currentStepIndex`, etc. The names above are from project docs; adapt to the real code.

When `tour_next` fires and the tour advances, the existing step-change `useEffect` will send the new narration via `sendTextPrompt` (now with the fixed `[NARACIJA]` prefix) and call `session.update` with screen-appropriate tools. No extra wiring needed.

### Fix B system prompt addition

In `buildScreenInstructions()`, add to all screens:

```
Kai naudotojas sako "toliau", "kitas", "pirmyn" — naudok tour_next.
Kai sako "atgal", "grįžk" — naudok tour_back.
```

## Constraints

- **Don't touch Azure TTS code.** Leave `/tts` endpoint and all Azure TTS code as-is.
- **Don't touch `realtimeVoice.ts`.** The B8.1 pipe is sufficient.
- **Keep `[NARACIJA]` prefix simple.** One clear tag, one clear instruction. Don't over-engineer.
- **Tour tools are common** — available on all screens (landing, screen1, screen2, report). They go in `TOOLS_COMMON`.
- **Deregister on unmount.** The `tour_next`/`tour_back` registrations in `AIGuide.tsx` should be cleaned up in the useEffect return (same pattern as existing registrations).
- **Tests:** Add 2–4 tests for tour_next/tour_back (active tour, inactive tour, first/last step boundaries). Target: 55 + 4 = ~59.

## Files to touch

### Modified files (frontend `~/dev/ntd`):
- `src/components/guide/AIGuide.tsx` — update `sendTextPrompt` narration prefix to `[NARACIJA]` format; register `tour_next` and `tour_back` actions
- `src/components/guide/toolDefinitions.ts` — add tour tools to `TOOLS_COMMON`; add `[NARACIJA]` rule and tour-nav hints to `buildScreenInstructions`
- `src/components/guide/__tests__/FormActionExecutor.test.ts` — add tour navigation tests

### Not touched:
- `src/lib/realtimeVoice.ts` — no changes
- `src/components/QuickScanFlow.tsx` — no changes
- Backend — no changes

## Verification

1. Start "Su balsu" mode on landing page.
2. Tour narration plays once — model reads the text and stops. No paraphrasing after.
3. Say "toliau" → tour advances to next step → new narration reads (once).
4. Say "atgal" → tour goes back one step.
5. On last step, "toliau" → model says "Tai paskutinis žingsnis" or similar.
6. All existing tests pass + new tour nav tests pass.