# Task Brief: P6-C Screen 3 — Quote Display, Email/Consent, Payment, Reassurance

**Repo:** `~/dev/ntd` (frontend)  
**File:** `src/components/QuickScanFlow.tsx`  
**Branch:** `block1-e2e`

---

## What

Replace the current Screen 3 stub with the full payment screen, plus the
reassurance screen shown after payment success. Also fix the breadcrumb
active-step highlight (cosmetic bug from Screen 2).

Screen 3 has two sub-states:
1. **Payment form** — quote display + email/consent/invoice + pay button
2. **Reassurance** — shown immediately after payment succeeds, replaces entire screen

---

## Entry point

Screen 3 is reached when `handleConfirmCandidate()` succeeds (POST `/quote` → 200),
setting `state.quote` and `state.step = 3`. The full quote object is already in state.

---

## Current state additions needed

Add to `QuickScanState`:
```ts
email: string                    // delivery email
consent_accepted: boolean        // terms + privacy consent checkbox
invoice_requested: boolean       // invoice checkbox
invoice_name: string             // captured but not sent to backend in P6-C
invoice_is_company: boolean      // individual vs. company toggle
invoice_company_name: string     // if invoice_is_company
invoice_email: string            // defaults to email, can be overridden
order_id: string | null          // returned by /payment-intent
payment_complete: boolean        // true after Stripe confirms; triggers reassurance
```

Initialise all to `""` / `false` / `null` as appropriate in the initial state object.

---

## Screen 3 layout

Page title: `"Kaina ir paslauga"`  
(No subtitle needed)

### Section 1 — Quote card

Display from `state.quote`:

- **Price:** `{state.quote.final_price_eur} €` — large font, prominent
- **Pricing label badge** next to price: `state.quote.pricing_label` (e.g. "Standartinis")
  with a checkmark icon
- **If `state.quote.special_discount_applied`:** show original price `{state.quote.base_price_eur} €`
  struck through before the final price

**Service bullets** (static copy, always shown):
- `"Šiluminio komforto vertinimas pagrindiniam pastatui šiame komplekte."`
- `"PDF ataskaita el. paštu."`

### Section 2 — "Kodėl tokia kaina?" block

Section heading: `"Kodėl tokia kaina?"`

Render `state.quote.ui_explanation_block` as a list of paragraphs/bullets — one
element per string in the array. The backend provides these strings; render as-is,
do not hardcode.

If `state.quote.special_discount_applied === true`, append as the final item:
`"Šiuo metu jums taikoma speciali nuolaida."`

### Section 3 — Email + Consent + Invoice

**Email field** (required):
- Label: `"El. pašto adresas"`
- Placeholder: `"vardas@pastas.lt"`
- Validate: must be non-empty and match basic email pattern on submit
- Error: `"Įveskite teisingą el. pašto adresą."`

**Invoice checkbox** (optional):
- Label: `"Reikia sąskaitos faktūros"`
- When checked, reveal invoice fields below:
  - **Individual/company toggle:** two buttons — `"Fizinis asmuo"` / `"Juridinis asmuo"`
    (default: Fizinis asmuo)
  - **Name field:** label `"Vardas, pavardė"` (if Fizinis asmuo) or `"Kontaktinis asmuo"` (if Juridinis)
  - **Company name field:** label `"Įmonės pavadinimas"` — shown only if Juridinis asmuo
  - **Invoice email:** label `"Sąskaitos el. paštas"`, placeholder mirrors delivery email,
    defaults to `state.email` when the delivery email is filled

  These fields are captured in state but **not sent to the backend in P6-C**.
  Invoice PDF generation is Phase 7 scope. Just store the values.

**Consent checkbox** (required to proceed):
- Label: `"Sutinku su "` + link `"paslaugos teikimo sąlygomis"` + `" ir "` +
  link `"privatumo nuostatomis"` + `"."`
- Links: `href="/salygos"` and `href="/privatumas"` (static placeholder paths, fine for now)
- Must be checked before payment button is active

### Section 4 — Action buttons

**"Atgal" button** (secondary): returns to `step: 2`. All step-3 state (email, consent etc.)
is preserved — do not clear it on back navigation.

**"Mokėti ir siųsti ataskaitą" button** (primary, teal):
- Disabled when: email invalid OR consent not checked OR payment in flight
- On click: run validation, then call `handlePayment()`

---

## handlePayment()

```
1. Validate: email format, consent_accepted === true
2. Set loading state (button disabled + "Kraunama…")
3. POST /v1/quickscan-lite/payment-intent
4. On success: extract client_secret and order_id
5. If stub mode (see below): skip Stripe, set payment_complete = true
6. Else: load Stripe.js, show card form, confirmCardPayment
7. On Stripe success: set payment_complete = true → show reassurance
8. On any error: show inline error, re-enable button
```

### POST /v1/quickscan-lite/payment-intent — request

```ts
{
  quote_id: state.quote.quote_id,
  customer_email: state.email,
  invoice_requested: state.invoice_requested,
  bundle_signature: state.selected_candidate_id ?? state.quote.bundle_id ?? ""
  // consent_flags: omitted in P6-C — added in P6-D migration
}
```

### POST /v1/quickscan-lite/payment-intent — response

```ts
{
  ok: boolean,
  data: {
    client_secret: string,
    order_id: string
  }
}
```

On `ok: false` or HTTP error:
- If `error_code === "quote_expired"`: show `"Jūsų užklausa pasibaigė. Grįžkite ir pradėkite iš naujo."` + "Atgal" button
- Otherwise: `"Mokėjimo klaida. Bandykite dar kartą."` with retry

### Stub mode detection

Backend is running `PAYMENT_MODE=stub` on staging. In stub mode, the `/payment-intent`
endpoint returns a fake `client_secret` that starts with `"pi_stub_"` or equals `"stub"`.

**If `client_secret.startsWith("pi_stub") || client_secret === "stub"`:**
- Skip Stripe.js entirely
- Set `state.order_id = order_id`, `state.payment_complete = true`
- Transition to reassurance immediately

This allows the full UI flow to be exercised without real Stripe credentials.
Stub detection will be removed in P6-D when Stripe test mode is configured.

### Stripe.js (non-stub path)

Load Stripe.js dynamically: `https://js.stripe.com/v3/`

Publishable key: read from `import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY`.
If the env var is not set, fall back to stub mode (treat as stub payment).

After receiving `client_secret`:
```ts
const stripe = Stripe(publishableKey)
const elements = stripe.elements()
const cardElement = elements.create('card')
cardElement.mount('#stripe-card-element')  // div inside the payment section

const result = await stripe.confirmCardPayment(client_secret, {
  payment_method: { card: cardElement }
})

if (result.error) {
  // show result.error.message inline
} else if (result.paymentIntent.status === 'succeeded') {
  setState(s => ({ ...s, payment_complete: true }))
}
```

Mount the card element inside a `<div id="stripe-card-element">` that appears in the
payment section after clicking the button (replace the button area with the card form).

---

## Reassurance screen

When `state.payment_complete === true`, replace the entire step 3 content with:

```
[Large checkmark icon or success indicator]

"Patvirtinome jūsų užsakymą."

"Pradėjome informacijos paiešką registruose, duomenų tikrinimą ir visų blokų
skaičiavimus. Ataskaitą el. paštu paprastai išsiunčiame greitai, bet gali
užtrukti iki 1 valandos."
```

No buttons. No "Atgal". No further navigation. The flow is complete.

The breadcrumb should show all three steps as completed/inactive at this point.

---

## Breadcrumb fix (cosmetic bug)

Currently the active step highlight in the breadcrumb (`1 Vieta → 2 Patvirtinimas → 3 Užsakymas ir apmokėjimas`) doesn't update — step 1 stays bold regardless of current step.

Fix: the active step should track `state.step`:
- step 1: "1 Vieta" bold/active
- step 2: "2 Patvirtinimas" bold/active
- step 3: "3 Užsakymas ir apmokėjimas" bold/active

---

## Constraints / do-nots

- Do not send invoice name/company fields to the backend — they are collected only
  in state for Phase 7 use
- Do not block the pay button on invoice field completeness — invoice fields are optional
  metadata even when the checkbox is checked (Phase 7 will enforce completeness)
- Do not add `consent_flags` to the `/payment-intent` request body — this is P6-D scope
  (requires a backend Alembic migration first)
- Do not show a waiting spinner after the reassurance screen — the customer sees
  reassurance immediately, no polling
- The reassurance text must match exactly as specified above (from Decision D8)
- Quote TTL: the `/quote` response includes `expires_at`. Display is not required, but
  if the quote is expired when the user clicks pay (backend returns `quote_expired`),
  show the expiry error and prompt to restart

---

## Files to touch

- `src/components/QuickScanFlow.tsx` — all Screen 3 logic lives here
- `src/pages/quickscan.astro` — no changes expected unless env var needs wiring

No backend changes needed. All endpoints are live at `api.staging.bustodnr.lt`.

---

## Test expectations (manual smoke test)

1. From Screen 2, click "Tęsti" → `/quote` succeeds → Screen 3 shows price +
   pricing_label badge + service bullets + "Kodėl tokia kaina?" section
2. Breadcrumb shows "3 Užsakymas ir apmokėjimas" as active
3. Pay button disabled with empty email or unchecked consent
4. Fill email + check consent → pay button enabled
5. Check invoice → invoice fields appear (name, email); company fields hidden initially
6. Toggle to "Juridinis asmuo" → company name field appears
7. Click "Mokėti ir siųsti ataskaitą" → button shows "Kraunama…" → POST /payment-intent fires
8. Stub mode: client_secret starts with "pi_stub_" → skip Stripe → reassurance shown
9. Reassurance screen: correct Lithuanian text, no buttons, breadcrumb inactive
10. "Atgal" from step 3 → returns to step 2, email and consent values preserved