# P7-B8.3 — Screen 2 Form-Filling Actions + Confirmation Safety

## What
Wire six voice-driven form actions for Screen 2 (Patvirtinimas ir apmokėjimas): `confirm_property`, `fill_email`, `toggle_consent`, `toggle_invoice`, `select_payment_method`, and `click_pay`. The last one is irreversible-tier — the model must get explicit verbal confirmation before executing.

## Why / Context
B8.2 completed Screen 1 actions. The customer can now voice-navigate through address entry and case selection. Screen 2 is the payment screen — once the resolver confirms the property, the customer needs to: confirm the proof card, enter email, accept terms, optionally request invoice, choose payment method, and pay. All of these have existing React handlers in `QuickScanFlow.tsx`.

Screen 2 layout: proof card (top-left, sticky), report blocks checklist (top-right), payment card (bottom full-width) with email → three checkboxes → expanding invoice fields → payment method grid → "Mokėti ir gauti ataskaitą" button.

## How

### 1. Tool definitions — add `TOOLS_SCREEN2` to `toolDefinitions.ts`

```typescript
export const TOOLS_SCREEN2: ToolDefinition[] = [
  {
    type: "function",
    name: "confirm_property",
    description: "Patvirtinti rastą objektą proof card'e. Naudok kai naudotojas sako 'taip, teisingas' arba 'patvirtinu'. Jei sako 'ne' — naudok navigate_back.",
    parameters: { type: "object", properties: {}, required: [] }
  },
  {
    type: "function",
    name: "fill_email",
    description: "Įvesti naudotojo el. pašto adresą. Naudok kai naudotojas pasako savo el. paštą.",
    parameters: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "El. pašto adresas, pvz. 'jonas@gmail.com'"
        }
      },
      required: ["email"]
    }
  },
  {
    type: "function",
    name: "toggle_consent",
    description: "Pažymėti arba atžymėti sutikimo su sąlygomis varnelę. Naudok kai naudotojas sako 'sutinku su sąlygomis' arba 'taip, sutinku'.",
    parameters: {
      type: "object",
      properties: {
        checked: {
          type: "boolean",
          description: "true = pažymėti, false = atžymėti"
        }
      },
      required: ["checked"]
    }
  },
  {
    type: "function",
    name: "toggle_invoice",
    description: "Pažymėti arba atžymėti 'Reikia sąskaitos faktūros' varnelę. Naudok tik kai naudotojas aiškiai prašo sąskaitos.",
    parameters: {
      type: "object",
      properties: {
        checked: {
          type: "boolean",
          description: "true = reikia sąskaitos, false = nereikia"
        }
      },
      required: ["checked"]
    }
  },
  {
    type: "function",
    name: "select_payment_method",
    description: "Pasirinkti mokėjimo būdą. Galimi: 'stripe' (kortelė Visa/MC), 'apple_pay', 'google_pay', 'paypal', 'swedbank', 'seb', 'luminor', 'citadele', 'revolut', 'paysera'.",
    parameters: {
      type: "object",
      properties: {
        method: {
          type: "string",
          description: "Mokėjimo būdo ID"
        }
      },
      required: ["method"]
    }
  },
  {
    type: "function",
    name: "click_pay",
    description: "Paspausti 'Mokėti ir gauti ataskaitą' mygtuką. ⚠️ NEGRĮŽTAMAS VEIKSMAS. PRIVALOMA: prieš kviečiant šį įrankį, VISADA pasakyk naudotojui tikslią kainą ir paklausk patvirtinimo: 'Patvirtinkite — apmokame [kaina] €?' Lauk kol naudotojas aiškiai pasakys 'taip', 'sutinku', 'mokėk' ar panašiai. Jei naudotojas nepatvirtina — NEKVIESTI šio įrankio.",
    parameters: { type: "object", properties: {}, required: [] }
  }
];
```

Update `getToolsForScreen`:
```typescript
case "quickscan-step2":
  return [...TOOLS_COMMON, ...TOOLS_SCREEN2];
```

### 2. Register actions from `QuickScanFlow.tsx`

Add to the existing `useEffect` that registers Screen 2 actions. Claude Code must inspect the component to find actual handler and state names.

#### `confirm_property`
```typescript
formActionsRegistry.register('confirm_property', async () => {
  // Call the existing "Taip, teisingas" button handler
  handleConfirmProperty(); // or equivalent
  return JSON.stringify({ success: true });
});
```

#### `fill_email`
```typescript
formActionsRegistry.register('fill_email', async (args) => {
  const email = args.email as string;
  // Basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return JSON.stringify({
      success: false,
      error: "invalid_email",
      message: "Neteisingas el. pašto formatas."
    });
  }
  setEmail(email); // or equivalent setter
  return JSON.stringify({ success: true, email });
});
```

#### `toggle_consent`
```typescript
formActionsRegistry.register('toggle_consent', async (args) => {
  const checked = args.checked as boolean;
  setConsentChecked(checked); // or equivalent
  return JSON.stringify({ success: true, consent: checked });
});
```

#### `toggle_invoice`
```typescript
formActionsRegistry.register('toggle_invoice', async (args) => {
  const checked = args.checked as boolean;
  setInvoiceRequested(checked); // or equivalent
  return JSON.stringify({ success: true, invoice: checked });
});
```

#### `select_payment_method`
```typescript
formActionsRegistry.register('select_payment_method', async (args) => {
  const method = args.method as string;
  const validMethods = [
    'stripe', 'apple_pay', 'google_pay', 'paypal',
    'swedbank', 'seb', 'luminor', 'citadele', 'revolut', 'paysera'
  ];
  if (!validMethods.includes(method)) {
    return JSON.stringify({
      success: false,
      error: "invalid_method",
      message: `Nežinomas mokėjimo būdas: ${method}`
    });
  }
  setSelectedPaymentMethod(method); // or equivalent
  return JSON.stringify({ success: true, method });
});
```

#### `click_pay` — irreversible tier
```typescript
formActionsRegistry.register('click_pay', async () => {
  // Check all prerequisites
  if (!email || !consentChecked || !selectedPaymentMethod) {
    const missing: string[] = [];
    if (!email) missing.push("el. paštas");
    if (!consentChecked) missing.push("sutikimas su sąlygomis");
    if (!selectedPaymentMethod) missing.push("mokėjimo būdas");
    return JSON.stringify({
      success: false,
      error: "missing_fields",
      message: `Trūksta: ${missing.join(", ")}.`
    });
  }

  // Trigger the payment
  handlePayment(); // or equivalent — the same handler as the button click
  return JSON.stringify({ success: true });
});
```

**Note on confirmation safety:** The confirmation is enforced at the prompt level — the tool description tells the model it MUST ask and wait for "taip" before calling `click_pay`. The executor does NOT gate on verbal confirmation (it can't — it doesn't have transcript context). The safety net is: the model is strongly instructed, and the payment button itself may have its own validation (Stripe requires card input for card payments, bank links redirect to bank auth). The model cannot bypass PCI-compliant card entry.

### 3. System prompt for Screen 2

In `buildScreenInstructions` for `screen2`:

```
Naudotojas yra 2 žingsnyje — patvirtinimas ir apmokėjimas.

VEIKSMAI:
- Pirmiausia paklausk ar objektas teisingas → confirm_property
- Paklausk el. pašto → fill_email
- Paklausk ar sutinka su sąlygomis → toggle_consent(true)
- Jei naudotojas prašo sąskaitos → toggle_invoice(true)
- Paklausk mokėjimo būdo → select_payment_method
- Kai viskas paruošta → pasakyk tikslią kainą, paklausk "Ar apmokame?" ir TIK gavęs "taip" → click_pay

⚠️ MOKĖJIMAS YRA NEGRĮŽTAMAS. Prieš click_pay VISADA:
1. Pasakyk kainą: "Ataskaita kainuoja [X] eurų."
2. Paklausk: "Ar patvirtinate mokėjimą?"
3. LAUK atsakymo. Tik "taip", "sutinku", "mokėk", "patvirtinu" = leidimas.
4. "Ne", "palaukite", "dar ne" = NEMOKĖTI.

Naudotojas gali pasakyti viską iš karto: "El. paštas jonas@gmail.com, sutinku, mokėsiu kortele" → fill_email + toggle_consent + select_payment_method vienu metu. Bet VISADA paklausk patvirtinimo prieš click_pay.
```

### 4. `navigate_back` tool

Add to `TOOLS_SCREEN2` (or `TOOLS_COMMON` if useful everywhere):

```typescript
{
  type: "function",
  name: "navigate_back",
  description: "Grįžti atgal į 1 žingsnį (vietos pasirinkimą). Naudok kai naudotojas sako objektas neteisingas arba nori keisti adresą.",
  parameters: { type: "object", properties: {}, required: [] }
}
```

Register from `QuickScanFlow.tsx`:
```typescript
formActionsRegistry.register('navigate_back', async () => {
  handleBack(); // the existing "Ne, ieškoti kito" handler
  return JSON.stringify({ success: true });
});
```

## Constraints

- **Backend: zero changes.**
- **Confirmation enforcement is prompt-level only.** The executor trusts the model. The real safety nets are: Stripe requires card details (the model can't enter those), bank links require bank authentication (redirect), and the consent checkbox is a prerequisite checked by the executor.
- **The model cannot enter card details.** This is a PCI requirement. For card payments, the model selects Stripe and the inline Stripe PaymentElement handles card entry. The model says: "Įveskite kortelės duomenis formoje."
- **Registration must be conditional** — Screen 2 actions only register when Screen 2 is active. Deregister on unmount or screen change.
- **Error messages in Lithuanian** for spoken errors.
- **Tests:** Add tests for all 7 new actions (valid + invalid paths). Target: 63 + ~10 = ~73.
- **TypeScript, no `any`.**

## Files to touch

### Modified files (frontend `~/dev/ntd`):
- `src/components/guide/toolDefinitions.ts` — add `TOOLS_SCREEN2`, update `getToolsForScreen`, add Screen 2 system prompt
- `src/components/QuickScanFlow.tsx` — register 7 new actions for Screen 2
- `src/components/guide/__tests__/FormActionExecutor.test.ts` — new tests

### Not touched:
- `src/lib/realtimeVoice.ts` — no changes
- `src/components/guide/AIGuide.tsx` — no changes (session.update already fires on screen change)
- Backend — no changes

## Verification

In "Su balsu" mode on Screen 2:
1. Model confirms property: "Radome Žirmūnų g. 12, Vilnius. Ar teisingas?" → user says "taip" → `confirm_property` fires.
2. "El. paštas jonas@gmail.com" → `fill_email` → email field fills.
3. "Sutinku su sąlygomis" → `toggle_consent(true)` → checkbox checks.
4. "Reikia sąskaitos" → `toggle_invoice(true)` → invoice section expands.
5. "Mokėsiu kortele" → `select_payment_method("stripe")` → Stripe tile highlighted.
6. Model says: "Ataskaita kainuoja 39 eurų. Ar patvirtinate mokėjimą?" → user says "taip" → `click_pay` fires.
7. If user says everything at once: "paštas jonas@gmail.com, sutinku, kortele" → all three fire, model still asks confirmation before payment.
8. "Ne, ne tas objektas" → `navigate_back` → returns to Screen 1.
9. Build passes, all tests green.