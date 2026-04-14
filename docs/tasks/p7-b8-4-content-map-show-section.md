# P7-B8.4 — Content Map + Show-Don't-Tell Navigation

## What
When the user asks about something that's already shown on the website (e.g. "iš ko susideda ataskaita?"), the guide should scroll to that section, spotlight it, read its narration, and wait. On "toliau" — return to the previous tour step and continue. Today the model improvises a verbal explanation instead.

Build a **content map** (topic → tour step) and a **`show_section`** tool. Same-page sections only for now.

## Why / Context
The website already has rich visual content: the "Ką gausite ataskaitoje" grid on landing, pricing cards, data sources marquee, situation cards, and all report blocks. Every one of these has a tour step with a hardcoded Lithuanian narration and a `data-guide` selector for spotlighting. The model doesn't know this — it answers questions from its system prompt instead of showing the relevant section.

The tour engine already supports jumping to arbitrary steps (it's a state machine with `goToStep(index)` or equivalent). The overlay and narration infrastructure is all there. We just need the model to know *which step shows what* and to be able to jump there and back.

## How

### 1. Content map — new file `src/components/guide/contentMap.ts`

A static lookup: topic keywords → tour step references. Each entry has:
- `topic`: machine-readable key
- `keywords`: Lithuanian phrases that should trigger this topic (for the model's tool description)
- `tourId`: which tour config contains this step (`"landing"`, `"quickscan"`, `"report"`)
- `stepId`: the step's `id` field within that tour config
- `label`: human-readable Lithuanian label (for the model to speak)

```typescript
export interface ContentMapEntry {
  topic: string;
  keywords: string[];  // for tool description, not runtime matching
  tourId: string;
  stepId: string;
  label: string;
}

export const CONTENT_MAP: ContentMapEntry[] = [
  // Landing page
  {
    topic: "report_contents",
    keywords: ["ataskaita", "kas įeina", "iš ko susideda", "ką gausite", "blokai"],
    tourId: "landing",
    stepId: "data-categories",  // the mini-mockup grid step
    label: "Ką gausite ataskaitoje"
  },
  {
    topic: "pricing",
    keywords: ["kaina", "kainuoja", "kiek kainuoja", "mokėjimas"],
    tourId: "landing",
    stepId: "pricing",
    label: "Kaina"
  },
  {
    topic: "how_it_works",
    keywords: ["kaip veikia", "procesas", "kaip užsakyti", "žingsniai"],
    tourId: "landing",
    stepId: "how-it-works",
    label: "Kaip tai veikia"
  },
  {
    topic: "situations",
    keywords: ["situacijos", "kam tinka", "kokiems atvejams", "pirkti", "parduoti", "nuomoti"],
    tourId: "landing",
    stepId: "situation-cards",
    label: "Situacijos, kurioms tinka ataskaita"
  },
  {
    topic: "property_types",
    keywords: ["objektų tipai", "kokie objektai", "butai", "namai", "sklypai"],
    tourId: "landing",
    stepId: "property-types",
    label: "Nekilnojamojo turto tipai"
  },
  {
    topic: "data_sources",
    keywords: ["duomenų šaltiniai", "registrai", "iš kur duomenys", "NTR", "REGIA", "kadastras"],
    tourId: "quickscan",
    stepId: "sources",  // if sources step exists on quickscan page
    label: "Duomenų šaltiniai ir registrai"
  },
  // Report page sections (conditional — only on report page)
  {
    topic: "thermal_comfort",
    keywords: ["šiluminis komfortas", "žiemos komfortas", "perkaitimas", "šildymas"],
    tourId: "report",
    stepId: "block-thermal",
    label: "Šiluminis komfortas"
  },
  // ... more report blocks as needed
];
```

**Important:** Claude Code must inspect the actual tour config files (`landingTour.ts`, `quickscanTour.ts`, `reportTour.ts` or equivalent) to find the real step `id` values. The IDs above are illustrative — use the real ones.

Also export a lookup helper:
```typescript
export function findContentByTopic(topic: string): ContentMapEntry | undefined {
  return CONTENT_MAP.find(e => e.topic === topic);
}

export function getContentTopicsForPage(tourId: string): ContentMapEntry[] {
  return CONTENT_MAP.filter(e => e.tourId === tourId);
}
```

### 2. Tool definition — `show_section`

Add to `TOOLS_COMMON` in `toolDefinitions.ts`:

```typescript
{
  type: "function",
  name: "show_section",
  description: `Parodyti naudotojui svetainės sekciją, kuri vizualiai atsako į jo klausimą. VISADA naudok šį įrankį vietoj žodinio aiškinimo, jei atitinkama sekcija egzistuoja.

Galimos temos:
- report_contents — ką gausite ataskaitoje (blokai, duomenys)
- pricing — kaina
- how_it_works — kaip veikia procesas
- situations — situacijos, kurioms tinka ataskaita
- property_types — nekilnojamojo turto tipai
- data_sources — duomenų šaltiniai ir registrai
- thermal_comfort — šiluminis komfortas (tik ataskaitoje)

Jei tema yra kitame puslapyje nei dabartiniame — pasakyk naudotojui ir paklausk ar nori pereiti.`,
  parameters: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        enum: ["report_contents", "pricing", "how_it_works", "situations", "property_types", "data_sources", "thermal_comfort"],
        description: "Sekcijos tema"
      }
    },
    required: ["topic"]
  }
}
```

### 3. Action handler — register `show_section` from `AIGuide.tsx`

`AIGuide.tsx` owns the tour state, so this registration happens there (same pattern as `tour_next`/`tour_back`):

```typescript
formActionsRegistry.register('show_section', async (args) => {
  const topic = args.topic as string;
  const entry = findContentByTopic(topic);

  if (!entry) {
    return JSON.stringify({ success: false, error: "unknown_topic" });
  }

  // Check if content is on the current page
  const currentTourId = tour.tourId; // or however the current tour is identified
  if (entry.tourId !== currentTourId) {
    return JSON.stringify({
      success: false,
      error: "different_page",
      message: `Ši informacija yra ${pageLabel(entry.tourId)}. Naudotojas turi pereiti ten.`,
      page: entry.tourId
    });
  }

  // Find the step index by stepId
  const steps = tour.steps; // the current tour's steps array
  const stepIndex = steps.findIndex(s => s.id === entry.stepId);
  if (stepIndex === -1) {
    return JSON.stringify({ success: false, error: "step_not_found" });
  }

  // Save current position for return
  returnStepRef.current = tour.state.currentStepIndex;

  // Jump to the target step
  tour.goToStep(stepIndex);
  // The step-change useEffect will handle scroll, spotlight, and sendNarration

  return JSON.stringify({
    success: true,
    label: entry.label,
    narration: steps[stepIndex].narration,  // include so model knows what's being shown
    return_available: true
  });
});
```

**`returnStepRef`**: A new `useRef<number | null>` in `AIGuide.tsx`. When set, the next `tour_next` call returns to this step instead of advancing sequentially.

### 4. Modify `tour_next` to handle return

Update the existing `tour_next` handler:

```typescript
formActionsRegistry.register('tour_next', async () => {
  if (!tour || !tour.state.isActive) {
    return JSON.stringify({ success: false, error: "tour_not_active" });
  }

  // Check if we need to return from a show_section detour
  if (returnStepRef.current !== null) {
    const returnTo = returnStepRef.current;
    returnStepRef.current = null;
    tour.goToStep(returnTo);
    const step = tour.steps[returnTo];
    return JSON.stringify({
      success: true,
      returned: true,
      step: returnTo,
      narration: step?.narration || ""
    });
  }

  // Normal next
  const hasNext = tour.state.currentStepIndex < tour.state.totalSteps - 1;
  if (!hasNext) {
    return JSON.stringify({ success: false, error: "last_step" });
  }
  tour.next();
  const nextStep = tour.steps[tour.state.currentStepIndex + 1];
  return JSON.stringify({
    success: true,
    step: tour.state.currentStepIndex + 1,
    narration: nextStep?.narration || ""
  });
});
```

### 5. System prompt update

Add to `buildScreenInstructions` (all screens):

```
TAISYKLĖ: Kai naudotojas klausia apie temą, kurią galima PARODYTI svetainėje — VISADA naudok show_section vietoj žodinio aiškinimo. Parodyk, nekartok.
Kai naudotojas pasako "toliau" po show_section — grąžink jį atgal į ekskursijos žingsnį, kuriame jis buvo.
```

### 6. Tour engine check — `goToStep`

Claude Code must verify that `useTour` exposes a `goToStep(index)` method (or equivalent like `setStep`, `jumpTo`). If not, it needs to be added — a simple state setter that updates `currentStepIndex` and triggers the same scroll/spotlight/narration effects as `next()`.

Check the `useTour.ts` implementation. If only `next()` and `back()` exist, add:
```typescript
goToStep(index: number) {
  if (index >= 0 && index < steps.length) {
    setState(prev => ({ ...prev, currentStepIndex: index }));
  }
}
```

The step-change `useEffect` in `AIGuide.tsx` already handles scroll + spotlight + narration for any step index change — so `goToStep` should trigger all of that automatically.

## Constraints

- **Same-page only.** If the requested content is on a different page, the tool returns `{ error: "different_page" }` and the model tells the user. Cross-page navigation is a future B8.5.
- **No new narrations.** Every content map entry points to an existing tour step with an existing narration. No new text.
- **Don't break the linear tour.** `show_section` is a detour. After the user says "toliau", they return to where they were. The tour doesn't skip or lose state.
- **Backend: zero changes.**
- **The `returnStepRef` must be cleared** if the user manually navigates (clicks a tour control, changes mode, etc.). Add a cleanup in the mode-change handler.
- **Tool description contains the full topic list.** The model needs to see what topics are available to route correctly. Don't rely on the model's system prompt memory — put the topic list in the tool's `description` field.
- **Tests:** Add tests for `show_section` (valid topic same page, valid topic different page, unknown topic) and `tour_next` return behavior. Target: ~63.
- **TypeScript, no `any`.**

## Files to touch

### New files (frontend `~/dev/ntd`):
- `src/components/guide/contentMap.ts` — content map data + lookup helpers

### Modified files (frontend):
- `src/components/guide/toolDefinitions.ts` — add `show_section` to `TOOLS_COMMON`, add system prompt rule
- `src/components/guide/AIGuide.tsx` — register `show_section`, add `returnStepRef`, update `tour_next` for return
- `src/hooks/useTour.ts` (or equivalent) — add `goToStep(index)` if it doesn't exist
- `src/components/guide/__tests__/FormActionExecutor.test.ts` — new tests

### Not touched:
- Backend — no changes
- `src/lib/realtimeVoice.ts` — no changes
- `src/components/QuickScanFlow.tsx` — no changes
- Tour config files (`landingTour.ts`, etc.) — no changes (just reading existing step IDs)

## Verification

1. On landing page in "Su balsu" mode, tour is on step 1 (hero).
2. User asks "Kas įeina į ataskaitą?" ("What's in the report?")
3. Model calls `show_section("report_contents")` → tour jumps to the "Ką gausite" grid step → scrolls + spotlights + reads that step's narration.
4. User says "toliau" → model calls `tour_next` → `returnStepRef` is set → tour returns to step 1 (hero) → reads hero narration.
5. User says "toliau" again → normal tour progression to step 2.
6. User asks about pricing → `show_section("pricing")` → jumps to pricing step → reads pricing narration.
7. User asks about thermal comfort (on landing page, content is on report page) → model responds: "Ši informacija yra ataskaitoje. Norėtumėte pereiti?" — no scroll, no crash.
8. Build passes, all tests green.