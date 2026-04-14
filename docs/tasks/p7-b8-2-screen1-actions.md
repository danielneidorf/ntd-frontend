# P7-B8.2 — Screen 1 Form-Filling Actions

## What
Wire five voice-driven form actions for Screen 1 (Vieta) through the B8.1 plumbing: `select_case_type`, `fill_address` (with async geocode + candidate selection), `select_address_candidate`, `fill_ntr`, and `click_continue`. After this, a user in "Su balsu" mode can say "Noriu patikrinti butą Žirmūnų gatvėje 12" and the AI fills the address, confirms, and advances.

## Why / Context
B8.1 built the pipe: `formActionsRegistry` singleton, function call handler in `realtimeVoice.ts`, `FormActionExecutor` dispatch, `session.update` on screen change. The pipe works end-to-end with a stub `get_current_screen` tool. B8.2 connects real Screen 1 form handlers to that pipe.

Screen 1 has: a case type toggle (3 options), a tabbed location card (Adresas/NTR/Žemėlapis), and a Tęsti button. The address tab has a geocode-driven autocomplete: `handleAddressChange` fetches from `/v1/quickscan-lite/geocode?q=...`, populates `addressCandidates` state, and `handleAddressSelect` confirms a choice + fetches lat/lng via a second geocode call with `place_id`. All React-controlled — no third-party DOM widget.

## How

### 1. Tool definitions — update `toolDefinitions.ts`

Add `TOOLS_SCREEN1` array exported alongside `TOOLS_COMMON`. `getToolsForScreen("screen1")` returns `[...TOOLS_COMMON, ...TOOLS_SCREEN1]`.

```typescript
export const TOOLS_SCREEN1: ToolDefinition[] = [
  {
    type: "function",
    name: "select_case_type",
    description: "Pasirinkti vertinimo tipą. Naudok kai naudotojas pasako, kokio tipo objektą nori patikrinti.",
    parameters: {
      type: "object",
      properties: {
        case_type: {
          type: "string",
          enum: ["existing_object", "new_build_project", "land_only"],
          description: "existing_object = esamas pastatas, new_build_project = naujai statomas, land_only = tik žemės sklypas"
        }
      },
      required: ["case_type"]
    }
  },
  {
    type: "function",
    name: "fill_address",
    description: "Įvesti adresą ir ieškoti autocomplete pasiūlymų. Grąžina rastus kandidatus. Jei rastas vienas — automatiškai pasirenka. Jei keli — paklausk naudotojo, kurį pasirinkti, tada naudok select_address_candidate.",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Adresas arba jo dalis, pvz. 'Žirmūnų g. 12' arba 'Gedimino pr. 1, Vilnius'"
        }
      },
      required: ["address"]
    }
  },
  {
    type: "function",
    name: "select_address_candidate",
    description: "Pasirinkti adreso kandidatą iš fill_address grąžintų rezultatų pagal indeksą.",
    parameters: {
      type: "object",
      properties: {
        index: {
          type: "number",
          description: "Kandidato indeksas (pradedant nuo 0) iš fill_address rezultatų"
        }
      },
      required: ["index"]
    }
  },
  {
    type: "function",
    name: "fill_ntr",
    description: "Įvesti NTR unikalų numerį. Formatas: 1234-5678-9012 arba 1234-5678-9012:1. Naudok tik kai naudotojas aiškiai pateikia NTR numerį.",
    parameters: {
      type: "object",
      properties: {
        ntr: {
          type: "string",
          description: "NTR unikalus numeris, pvz. '1234-5678-9012'"
        }
      },
      required: ["ntr"]
    }
  },
  {
    type: "function",
    name: "click_continue",
    description: "Paspausti 'Tęsti' mygtuką ir pereiti į kitą žingsnį. SVARBU: prieš kviečiant šį įrankį, visada pasakyk naudotojui ką ketini daryti, pvz. 'Viskas paruošta, ieškome jūsų objekto.' ir trumpai palūkėk.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];
```

### 2. Register actions from `QuickScanFlow.tsx`

Add/expand the `useEffect` that registers actions in the `formActionsRegistry`. All five actions are registered alongside the existing `get_current_screen` and `__screen`.

**Important:** Claude Code must inspect `QuickScanFlow.tsx` to find the actual state variable names and handler function names. The names below are from project docs — the real code may differ slightly.

#### `select_case_type`
```typescript
formActionsRegistry.register('select_case_type', async (args) => {
  const caseType = args.case_type as string;
  const valid = ["existing_object", "new_build_project", "land_only"];
  if (!valid.includes(caseType)) {
    return JSON.stringify({ success: false, error: "invalid_case_type" });
  }
  // Call the existing case type handler (likely setCaseType or similar)
  setCaseType(caseType);
  return JSON.stringify({ success: true, case_type: caseType });
});
```

#### `fill_address` — the complex one
This action must: (1) update the address input visually, (2) call the geocode API, (3) auto-select if one result, (4) return candidates if multiple.

```typescript
formActionsRegistry.register('fill_address', async (args) => {
  const query = args.address as string;
  if (!query?.trim()) {
    return JSON.stringify({ success: false, error: "empty_address" });
  }

  // 1. Set the input field (visual feedback for the user)
  setAddressInput(query);

  // 2. Switch to address tab if not already active
  setActiveLocationTab("address"); // or equivalent

  // 3. Fetch geocode candidates (same API the existing handler calls)
  try {
    const resp = await fetch(
      `${API_BASE}/v1/quickscan-lite/geocode?q=${encodeURIComponent(query)}`
    );
    const data = await resp.json();
    const candidates = data.candidates || data.predictions || [];

    if (candidates.length === 0) {
      return JSON.stringify({
        success: false,
        error: "no_results",
        message: "Pagal šį adresą nieko nerasta. Pabandykite tiksliau."
      });
    }

    // 4. Show candidates in the UI dropdown
    setAddressCandidates(candidates);

    if (candidates.length === 1) {
      // Auto-select the only candidate
      handleAddressSelect(candidates[0]);
      return JSON.stringify({
        success: true,
        auto_selected: true,
        address: candidates[0].formatted_address || candidates[0].description
      });
    }

    // Multiple candidates — store for select_address_candidate, return list
    pendingCandidatesRef.current = candidates;
    return JSON.stringify({
      success: true,
      needs_selection: true,
      candidates: candidates.map((c, i) => ({
        index: i,
        address: c.formatted_address || c.description
      }))
    });
  } catch (err) {
    return JSON.stringify({ success: false, error: "geocode_failed" });
  }
});
```

**`pendingCandidatesRef`**: A new `useRef` in `QuickScanFlow.tsx` that holds the latest candidates array so `select_address_candidate` can access them without depending on async state updates.

#### `select_address_candidate`
```typescript
formActionsRegistry.register('select_address_candidate', async (args) => {
  const index = args.index as number;
  const candidates = pendingCandidatesRef.current;

  if (!candidates || !candidates[index]) {
    return JSON.stringify({ success: false, error: "invalid_index" });
  }

  handleAddressSelect(candidates[index]);
  pendingCandidatesRef.current = null;
  return JSON.stringify({
    success: true,
    address: candidates[index].formatted_address || candidates[index].description
  });
});
```

#### `fill_ntr`
```typescript
formActionsRegistry.register('fill_ntr', async (args) => {
  const ntr = args.ntr as string;
  const NTR_RE = /^\d{4}-\d{4}-\d{4}(:\d{1,6})?$/;

  if (!NTR_RE.test(ntr)) {
    return JSON.stringify({
      success: false,
      error: "invalid_format",
      message: "Neteisingas NTR formatas. Teisingas: 1234-5678-9012"
    });
  }

  setNtrInput(ntr);
  // Switch to NTR tab if not active
  setActiveLocationTab("ntr"); // or equivalent
  return JSON.stringify({ success: true, ntr });
});
```

#### `click_continue`
```typescript
formActionsRegistry.register('click_continue', async () => {
  // Check if form is ready (case selected + location valid)
  const ready = isContinueEnabled(); // read from existing validation logic
  if (!ready) {
    return JSON.stringify({
      success: false,
      error: "form_not_ready",
      message: "Negalima tęsti — pasirinkite objekto tipą ir nurodykite vietą."
    });
  }

  // Trigger the same action as clicking the Tęsti button
  handleContinue(); // or the onSubmit/onResolve handler
  return JSON.stringify({ success: true });
});
```

**Note on actual handler names:** Claude Code must inspect the component to find the real names. Look for: the case type setter, the address input setter, the geocode fetch function, the address selection handler, the NTR input setter, the tab switcher, the continue/submit handler, and the validation function that gates the Tęsti button.

### 3. Update `FormActionExecutor.ts`

Add `switch` cases for all five new actions. Same pattern as `get_current_screen` — look up the action in the registry and call it.

Since B8.1 established the registry pattern, the executor should delegate all actions through the registry rather than special-casing each one. If the executor currently has explicit `case` branches, refactor to a single registry lookup:

```typescript
export async function executeFormAction(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const action = formActionsRegistry.get(name);
  if (!action) {
    return JSON.stringify({ error: "unknown_action", message: `Nežinomas veiksmas: ${name}` });
  }
  try {
    return await action(args);
  } catch (err) {
    return JSON.stringify({ error: "action_failed", message: String(err) });
  }
}
```

This makes the executor generic — any registered action works without touching the executor. Check if B8.1 already did this; if not, refactor now.

### 4. Update system prompt instructions

In `buildScreenInstructions()` for `screen1`, add guidance for the model:

```
Naudotojas yra 1 žingsnyje — vietos pasirinkimas.
Padėk jam pasirinkti objekto tipą ir nurodyti vietą.

VEIKSMAI:
- Jei naudotojas pasako objekto tipą → select_case_type
- Jei naudotojas pasako adresą → fill_address. Jei grąžina kelis kandidatus, perskaityk juos ir paklausk kurį pasirinkti, tada select_address_candidate.
- Jei naudotojas duoda NTR numerį → fill_ntr
- Kai viskas paruošta → pasakyk "Ieškome jūsų objekto" ir click_continue

SVARBU: Naudotojas gali pasakyti viską vienu sakiniu, pvz. "Noriu patikrinti butą Žirmūnų gatvėje 12" — tada iškart select_case_type(existing_object) IR fill_address("Žirmūnų g. 12").
```

## Constraints

- **Backend: zero changes.** The geocode API call is made from the frontend (same `fetch` as the existing handler).
- **Don't duplicate the geocode fetch.** `fill_address` calls the same `/v1/quickscan-lite/geocode` endpoint and uses the same handlers that the manual typing path uses. Don't create a parallel fetch path.
- **The AI cannot type card details.** No payment-related actions in this brief. That's B8.3.
- **Confirmation tier for `click_continue`:** Navigational. The model is instructed via system prompt to announce before executing. The executor does NOT gate on confirmation — the prompt handles it.
- **Error messages in Lithuanian** for anything the model will speak. Internal errors can be English.
- **`pendingCandidatesRef`** must be a `useRef` (not state) to avoid stale closure issues in the async action callback.
- **Existing tests must not break.** Target: 43 (current) + new tests for the five actions = ~48+.
- **TypeScript, no `any`.**

## Files to touch

### Modified files (frontend `~/dev/ntd`):
- `src/components/guide/toolDefinitions.ts` — add `TOOLS_SCREEN1`, update `getToolsForScreen`
- `src/components/guide/FormActionExecutor.ts` — refactor to generic registry lookup if needed
- `src/components/QuickScanFlow.tsx` — register 5 new actions, add `pendingCandidatesRef`
- `src/components/guide/__tests__/FormActionExecutor.test.ts` — add tests for new actions

### Not touched:
- `src/lib/realtimeVoice.ts` — no changes (B8.1 pipe is sufficient)
- `src/components/guide/AIGuide.tsx` — no changes (already wires session.update on screen change)
- Backend — no changes

## Verification

In "Su balsu" mode on Screen 1:
1. Say "Noriu patikrinti esamą pastatą" → model calls `select_case_type(existing_object)` → case toggle updates.
2. Say "Adresas — Žirmūnų gatvė 12, Vilnius" → model calls `fill_address` → geocode runs → if one result, address auto-selects and model confirms: "Radau — Žirmūnų g. 12, Vilnius. Ar teisingai?"
3. If multiple candidates → model reads them and asks → user says "pirmas" → model calls `select_address_candidate(0)`.
4. Say "Tęsti" → model announces "Ieškome jūsų objekto" → calls `click_continue` → resolver transition starts.
5. Say "NTR numeris 1234-5678-9012" → model calls `fill_ntr` → NTR field updates.
6. Say everything in one sentence: "Noriu patikrinti butą Žirmūnų gatvėje dvylika" → model calls both `select_case_type` and `fill_address` in one turn.

Build passes, all tests green.