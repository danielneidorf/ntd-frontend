# P7-B8.1 — Form-Filling Agent Plumbing

## What
Add three capabilities to the voice concierge that don't exist today:
1. **Session context updates** — push new instructions + tools to the Realtime API mid-conversation when the user navigates between screens.
2. **Function call handling** — listen for the Realtime model's function calls on the data channel, dispatch them to local handlers, return results so the model can speak about what happened.
3. **FormActionsContext** — a React context that `QuickScanFlow.tsx` populates with its own form handlers, so the function call executor can invoke them without tight coupling.

No actual form actions yet — B8.2 (Screen 1) and B8.3 (Screen 2) wire real handlers. This brief builds the pipe and proves it works with a single stub tool.

## Why / Context
The voice concierge (OpenAI Realtime via WebRTC) can talk about the website but cannot act on it. The original AI Guide concept (B8) envisions the user saying "Žirmūnų gatvė 12" and the AI filling the address field. This requires the Realtime model to call functions that execute DOM actions in the browser.

Current state:
- `realtimeVoice.ts` (~186 lines) is a thin WebRTC transport: `connect()`, `sendTextPrompt()`, `disconnect()`. No `session.update`, no function call listener.
- `AIGuide.tsx` sends property context once at connect time. Step changes only forward narration text via `sendTextPrompt()` — no session instructions update, no tool set change.
- There is no mechanism for form handlers in `QuickScanFlow.tsx` to be callable from the AI guide layer.

## How

### 1. `realtimeVoice.ts` — two new capabilities

#### 1a. `updateSession(config)` method
Sends a `session.update` client event over the data channel. Used by `AIGuide.tsx` to push new tools and instructions when the user changes screens.

```typescript
// Shape of the event sent over dc.send()
{
  type: "session.update",
  session: {
    instructions: string,   // updated system prompt with screen context
    tools: ToolDefinition[], // screen-appropriate function definitions
    tool_choice: "auto"
  }
}
```

Guard: only send if `dc.readyState === "open"`. Log a warning otherwise.

#### 1b. Function call listener + response cycle
In the existing `dc.onmessage` handler, add a branch for `response.output_item.done` events where `item.type === "function_call"`:

```typescript
// Incoming server event shape:
{
  type: "response.output_item.done",
  item: {
    type: "function_call",
    name: string,       // e.g. "get_current_screen"
    call_id: string,    // e.g. "call_abc123"
    arguments: string   // JSON-encoded, e.g. "{}"
  }
}
```

When received:
1. Parse `item.arguments` (JSON string → object).
2. Call a registered callback: `onFunctionCall(name, args, callId)`. This callback is set by `AIGuide.tsx` during connect.
3. The callback returns a `Promise<string>` (JSON-encoded result).
4. Send two events back over the data channel:
```typescript
// Step 1: deliver function output
dc.send(JSON.stringify({
  type: "conversation.item.create",
  item: {
    type: "function_call_output",
    call_id: callId,
    output: resultString  // JSON string returned by callback
  }
}));

// Step 2: ask model to respond based on the output
dc.send(JSON.stringify({
  type: "response.create"
}));
```

#### Updated `connect()` signature
```typescript
interface RealtimeVoiceOptions {
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => Promise<string>;
  // ... existing options (onStateChange, etc.)
}
```

### 2. `FormActionsContext` — new file `src/components/ai-guide/FormActionsContext.tsx`

A React context that holds a registry of callable form actions. `QuickScanFlow.tsx` registers its handlers; the `FormActionExecutor` reads them.

```typescript
interface FormActions {
  // B8.2 will add: fillAddress, selectCaseType, fillNtr, fillEpcOverrides, clickContinue
  // B8.3 will add: fillEmail, toggleConsent, selectPaymentMethod, clickPay, navigateBack
  // For now, only metadata:
  getCurrentScreen: () => FormScreenInfo;
}

interface FormScreenInfo {
  screen: "landing" | "screen1" | "screen2" | "report" | "other";
  caseType?: "existing" | "new_build" | "land_only";
  addressFilled?: boolean;
  currentAddress?: string;
  // extended in B8.2/B8.3
}

const FormActionsContext = React.createContext<FormActions | null>(null);
export const FormActionsProvider = FormActionsContext.Provider;
export const useFormActions = () => React.useContext(FormActionsContext);
```

**Provider location:** `QuickScanFlow.tsx` wraps its JSX (or the relevant subtree) in `<FormActionsProvider>` and passes a `formActions` object built from its own state and handlers.

For B8.1, `getCurrentScreen` is the only action — it reads component state and returns a `FormScreenInfo` describing what's visible. This is enough to test the full pipe.

### 3. `FormActionExecutor` — new file `src/components/ai-guide/FormActionExecutor.ts`

A plain function (not a component) that maps function call names to `FormActions` methods:

```typescript
export async function executeFormAction(
  name: string,
  args: Record<string, unknown>,
  formActions: FormActions | null
): Promise<string> {
  if (!formActions) {
    return JSON.stringify({ error: "form_actions_unavailable", message: "Formos veiksmai nepasiekiami." });
  }

  switch (name) {
    case "get_current_screen":
      return JSON.stringify({ success: true, data: formActions.getCurrentScreen() });

    // B8.2 and B8.3 will add cases here

    default:
      return JSON.stringify({ error: "unknown_action", message: `Nežinomas veiksmas: ${name}` });
  }
}
```

### 4. `AIGuide.tsx` wiring

#### 4a. On step/screen change → `updateSession()`
Add a `useEffect` keyed on the current screen (not every step — only when the screen changes between landing/screen1/screen2/report):

```typescript
useEffect(() => {
  if (!rt || !rt.isConnected()) return;

  const screenTools = getToolsForScreen(currentScreen);
  const screenInstructions = buildScreenInstructions(currentScreen, propertyContext);

  rt.updateSession({
    instructions: screenInstructions,
    tools: screenTools,
    tool_choice: "auto"
  });
}, [currentScreen]);
```

Where `currentScreen` is derived from the tour engine's step state or from observing which component is mounted.

#### 4b. Connect the function call handler
When calling `rt.connect()`, pass an `onFunctionCall` callback that reads `FormActionsContext` and delegates to `executeFormAction`:

```typescript
const formActions = useFormActions();

// In connect():
rt.connect({
  // ...existing options
  onFunctionCall: async (name, args, callId) => {
    return executeFormAction(name, args, formActions);
  }
});
```

**Note:** Because `formActions` comes from context and may update, store the latest ref in a `useRef` and read from that inside the callback to avoid stale closures.

#### 4c. Tool definitions — new file `src/components/ai-guide/formTools.ts`

```typescript
// Tool definition shape (OpenAI Realtime API format)
interface ToolDefinition {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// B8.1 stub tool — proves the pipe works
export const TOOLS_COMMON: ToolDefinition[] = [
  {
    type: "function",
    name: "get_current_screen",
    description: "Sužinoti, kuriame puslapyje dabar yra naudotojas ir kokia dabartinė formos būsena. Naudok prieš bet kokį veiksmą, jei nesi tikras, kuriame žingsnyje naudotojas yra.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

// B8.2 will export TOOLS_SCREEN1, B8.3 will export TOOLS_SCREEN2
export function getToolsForScreen(screen: string): ToolDefinition[] {
  // For now, all screens get the same common tools
  return [...TOOLS_COMMON];
}
```

#### 4d. Screen-aware instructions builder — in `formTools.ts`

```typescript
export function buildScreenInstructions(screen: string, propertyContext?: string): string {
  const base = `Tu esi NTD balso asistentas. Kalbi lietuviškai, trumpai (1-2 sakiniai).
Dabar naudotojas yra: ${screenLabel(screen)}.
Gali naudoti įrankius formos veiksmams atlikti.
Prieš bet kokį negrįžtamą veiksmą (mokėjimas, sutikimai) — VISADA paklausk patvirtinimo ir lauk "taip" arba "sutinku".`;

  const contextBlock = propertyContext ? `\nTurto duomenys: ${propertyContext}` : "";

  return base + contextBlock;
}

function screenLabel(screen: string): string {
  switch (screen) {
    case "landing": return "pagrindiniame puslapyje";
    case "screen1": return "1 žingsnyje (vietos pasirinkimas)";
    case "screen2": return "2 žingsnyje (patvirtinimas ir apmokėjimas)";
    case "report": return "ataskaitoje";
    default: return "nežinomame puslapyje";
  }
}
```

### 5. `QuickScanFlow.tsx` — provide FormActionsContext

Add a `useMemo` that builds the `formActions` object from existing state:

```typescript
const formActions: FormActions = useMemo(() => ({
  getCurrentScreen: () => ({
    screen: currentStep >= SCREEN2_START ? "screen2" : "screen1",
    caseType: selectedCaseType || undefined,
    addressFilled: !!confirmedAddress,
    currentAddress: confirmedAddress || addressInput || undefined,
  })
}), [currentStep, selectedCaseType, confirmedAddress, addressInput]);
```

Wrap the existing JSX return in `<FormActionsProvider value={formActions}>`.

**Important:** The exact state variable names (`currentStep`, `selectedCaseType`, `confirmedAddress`, `addressInput`) must be read from the actual code. Claude Code should inspect `QuickScanFlow.tsx` to find the real names and adapt.

## Constraints

- **Backend: zero changes.** The `/voice-session` endpoint stays as-is. Tools are defined client-side via `session.update`, not baked into the ephemeral token.
- **No real form actions yet.** Only `get_current_screen` is wired. B8.2 and B8.3 add the real ones. The executor's `switch` has a `default` branch that returns an error for unknown actions.
- **Don't break existing voice flow.** `sendTextPrompt()` for tour narrations must continue working. The function call listener is additive — it handles a new event type on the data channel alongside existing ones.
- **Stale closure prevention.** The `onFunctionCall` callback is set once at connect time but must read current `formActions`. Use `useRef` for the latest value.
- **Keep `realtimeVoice.ts` thin.** It gets two methods (`updateSession`, function call dispatch) and one new callback option. It does NOT import React, context, or form logic. It's still a transport layer.
- **TypeScript.** All new files must be `.ts` or `.tsx` with proper types. No `any`.
- **Tests.** Add Vitest tests for `FormActionExecutor` — at minimum: known action returns success, unknown action returns error, null formActions returns error. Target: 38 + 3 = 41 Vitest.

## Files to touch

### New files (frontend `~/dev/ntd`):
- `src/components/ai-guide/FormActionsContext.tsx` — React context + provider + hook
- `src/components/ai-guide/FormActionExecutor.ts` — name→handler dispatcher
- `src/components/ai-guide/formTools.ts` — tool definitions + screen instructions builder
- `src/components/ai-guide/__tests__/FormActionExecutor.test.ts` — Vitest

### Modified files (frontend):
- `src/components/ai-guide/realtimeVoice.ts` — add `updateSession()`, function call listener, `onFunctionCall` option
- `src/components/ai-guide/AIGuide.tsx` — wire `updateSession` on screen change, pass `onFunctionCall` to connect, read FormActionsContext via ref
- `src/components/QuickScanFlow.tsx` — wrap JSX in `<FormActionsProvider>`, build `formActions` from state

### Not touched:
- Backend (`~/dev/bustodnr`) — no changes
- Tour configs (`landingTour.ts`, `quickscanTour.ts`, `reportTour.ts`) — no changes
- `AIGuideToggle.tsx` — no changes

## Verification

After implementation, the following should work in "Su balsu" mode:
1. Connect voice → model receives initial tools including `get_current_screen`.
2. Ask the model "Kuriame puslapyje aš esu?" ("Which page am I on?").
3. Model calls `get_current_screen` → executor returns `{ screen: "screen1", ... }` → model responds verbally: "Jūs esate pirmame žingsnyje — vietos pasirinkime."
4. Navigate to Screen 2 → `session.update` fires with updated instructions mentioning Screen 2.
5. Ask again → model correctly reports Screen 2.

If the data channel is not open when `updateSession` is called, a console warning appears but nothing crashes.