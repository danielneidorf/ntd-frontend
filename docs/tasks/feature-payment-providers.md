# Feature: Payment Integration — Flat Method Grid (Lithuanian Style)

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-payment-providers.md
**Branch:** block1-e2e
**Scope:** Show all payment methods as individual options in a flat grid; Stripe + Paysera PIS backend

---

## Strategy: Two backend providers, one flat UI

| Backend provider | Methods it handles | Cost per €39 |
|---|---|---|
| **Paysera PIS** | Swedbank, SEB, Luminor, Citadele, Revolut, Paysera | ~€0.35 |
| **Stripe** | Visa/MC card, Apple Pay, Google Pay, PayPal | ~€0.84 |

**Kevin. is dead** (bankruptcy Sep 2024). Do not integrate.

The customer sees **one flat grid of all methods** — they don't know or care which backend provider handles their choice.

---

## UX: Flat payment method grid

When "Mokėti ir gauti ataskaitą" is clicked, the payment method grid slides in above the button. All options visible at once — no categories, no grouping, no tabs.

### Layout

```
Pasirinkite mokėjimo būdą:

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ [Swedbank] │ │   [SEB]    │ │ [Luminor]  │ │ [Citadele] │
│   logo     │ │   logo     │ │   logo     │ │   logo     │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ [Revolut]  │ │ [Paysera]  │ │  [Visa/MC] │ │[Apple Pay] │
│   logo     │ │   logo     │ │   logo     │ │   logo     │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
┌────────────┐ ┌────────────┐
│[Google Pay]│ │  [PayPal]  │
│   logo     │ │   logo     │
└────────────┘ └────────────┘

┌─────────────────────────────────────────────────┐
│         Patvirtinti mokėjimą 39 €                │
└─────────────────────────────────────────────────┘
```

### Grid styling

```css
.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 16px 0;
}

.payment-method-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 8px;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #FFFFFF;
  min-height: 56px;
}

.payment-method-tile:hover {
  border-color: #0D7377;
  background: #FAFBFC;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.payment-method-tile.selected {
  border-color: #0D7377;
  background: #E8F4F8;
  box-shadow: 0 0 0 1px #0D7377;
}

.payment-method-tile img {
  max-height: 28px;
  max-width: 80px;
  object-fit: contain;
}
```

### Each tile shows a logo only

No text labels — just the recognizable brand logo. Lithuanian customers instantly recognize Swedbank's orange, SEB's green, Luminor's purple, etc. The logo does the communication.

If a logo can't load, fall back to the brand name as text (14px medium, #1A1A2E).

### Prompt text above the grid

**"Pasirinkite mokėjimo būdą:"** — 15px medium, #1A1A2E

### No default selection

Customer must click one tile. "Patvirtinti mokėjimą 39 €" button is disabled until a method is selected.

### Mobile (< 768px)

Switch to `grid-template-columns: repeat(3, 1fr)` — 3 per row instead of 4.

---

## Payment method order (left-to-right, top-to-bottom)

Banks first (most popular in Lithuania), then cards/wallets:

1. **Swedbank** — logo: Swedbank orange swoosh (Paysera PIS)
2. **SEB** — logo: SEB green (Paysera PIS)
3. **Luminor** — logo: Luminor purple (Paysera PIS)
4. **Citadele** — logo: Citadele blue (Paysera PIS)
5. **Revolut** — logo: Revolut dark (Paysera PIS)
6. **Paysera** — logo: Paysera teal (Paysera PIS)
7. **Visa / Mastercard** — logo: both card network logos side by side (Stripe)
8. **Apple Pay** — logo: Apple Pay mark (Stripe)
9. **Google Pay** — logo: Google Pay mark (Stripe)
10. **PayPal** — logo: PayPal blue (Stripe)

### Conditional display

- **Apple Pay:** only show on Safari / devices with Apple Pay capability. Use `window.ApplePaySession?.canMakePayments()` check.
- **Google Pay:** only show on Chrome / devices with Google Pay. Use Stripe's `paymentRequest.canMakePayment()` check.
- All bank options always shown.

---

## What happens when a method is selected

### Banks (tiles 1–6) → Paysera PIS redirect

1. Frontend calls `POST /v1/quickscan-lite/payment-init-paysera` with `{ quote_id, customer_email, invoice_requested, consent_flags, bundle_signature, bank_code }` — the `bank_code` identifies which bank was selected (e.g., "swedbank", "seb", "luminor")
2. Backend creates Order, calls Paysera API with the specific bank pre-selected
3. Returns Paysera redirect URL — customer goes directly to their bank's auth (skipping Paysera's own bank selector since we already know which bank)
4. Customer authenticates in their bank → Paysera redirects back → success screen
5. Paysera callback confirms payment server-to-server

### Visa/Mastercard (tile 7) → Stripe card input inline

1. Frontend calls `POST /v1/quickscan-lite/payment-intent`
2. Backend returns `client_secret`
3. Stripe card input (number, expiry, CVC) appears inline below the grid, above the button
4. Button text stays "Patvirtinti mokėjimą 39 €"
5. Customer fills card → click → `stripe.confirmPayment()` → success screen

### Apple Pay (tile 8) → Stripe Apple Pay

1. Frontend calls `POST /v1/quickscan-lite/payment-intent`
2. Backend returns `client_secret`
3. Apple Pay sheet appears (native iOS/Safari prompt) — customer authenticates with Face ID / Touch ID
4. Payment confirmed → success screen

### Google Pay (tile 9) → Stripe Google Pay

1. Same as Apple Pay but with Google Pay sheet
2. Customer authenticates via Google → success screen

### PayPal (tile 10) → Stripe PayPal redirect

1. Frontend calls `POST /v1/quickscan-lite/payment-intent`
2. Stripe redirects customer to PayPal
3. Customer logs in, confirms → redirected back → success screen

---

## Logos — source files

Store payment method logos in `public/images/payment/`:

```
public/images/payment/
  swedbank.svg
  seb.svg
  luminor.svg
  citadele.svg
  revolut.svg
  paysera.svg
  visa-mastercard.svg
  apple-pay.svg
  google-pay.svg
  paypal.svg
```

Use official brand SVGs from each provider's press/brand kit. These are typically freely available for merchant use. Keep them small (~2KB each), single-color where possible.

---

## Stripe.js lazy loading

Only load when a Stripe-handled method is selected (card, Apple Pay, Google Pay, PayPal), not on page load:

```typescript
// src/lib/stripe.ts
let stripePromise: Promise<any> | null = null;

export function getStripe(): Promise<any> {
  if (!stripePromise) {
    stripePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        const key = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (key) resolve((window as any).Stripe(key));
        else resolve(null);
      };
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }
  return stripePromise;
}
```

---

## Stripe Dashboard configuration

Enable in Stripe Dashboard (no code changes — PaymentElement auto-shows):

| Method | Dashboard action |
|---|---|
| Cards | Enabled by default |
| Apple Pay | Enable + upload domain verification file to `.well-known/` |
| Google Pay | Enable |
| PayPal | Enable + connect PayPal merchant account |

---

## Paysera configuration

1. Register at paysera.com, create payment collection project for ntd.lt
2. Enable PIS for Lithuania — all banks
3. Get Project ID + Project Password
4. Set callback URL: `https://api.ntd.lt/v1/quickscan-lite/paysera-callback`
5. Submit for review (1 business day)

Environment variables:
```
PAYSERA_PROJECT_ID=xxxxx
PAYSERA_PROJECT_PASSWORD=xxxxx
PAYSERA_TEST_MODE=true
```

---

## Stub mode

**Stripe:** no `PUBLIC_STRIPE_PUBLISHABLE_KEY` → card/wallet tiles skip Stripe.js, 500ms delay, success screen.

**Paysera:** `PAYSERA_TEST_MODE=true` → bank tiles return fake redirect URL pointing to `/quickscan/payment-success?order_id=stub-xxx`. Shows success screen without real bank redirect.

---

## Error handling

| Scenario | Message |
|---|---|
| Quote expired | "Kainos galiojimas baigėsi. Prašome grįžti ir patvirtinti objektą iš naujo." |
| Card declined | "Mokėjimo klaida. Bandykite dar kartą arba naudokite kitą kortelę." |
| Paysera cancelled | "Mokėjimas atšauktas. Galite bandyti dar kartą." |
| Paysera failed | "Mokėjimo klaida. Bandykite dar kartą arba pasirinkite kitą banką." |
| Backend error | "Mokėjimo klaida. Bandykite dar kartą." |

---

## Button states

```
[Mokėti ir gauti ataskaitą] (enabled)
         │ click
         ▼
[Payment method grid slides in — 10 tiles]
[Patvirtinti mokėjimą 39 €] (disabled until selection)
         │
    select a tile
         │
    ┌────┴──────────────────────┐
    │                           │
  bank tile              card/wallet tile
    │                           │
    ▼                           ▼
  POST /payment-           POST /payment-intent
  init-paysera                  │
    │                    ┌──────┴──────┐
    ▼                    │             │
  redirect to         card input   Apple/Google/
  bank auth           inline       PayPal sheet
    │                    │             │
  authenticate       fill + confirm   auth
    │                    │             │
  redirect back          │             │
    │                    │             │
    ▼                    ▼             ▼
         SUCCESS SCREEN (all paths)
```

---

## Files to touch

| File | Change |
|---|---|
| `src/lib/stripe.ts` | **NEW** — lazy Stripe.js loader |
| `src/lib/paysera.ts` | **NEW** — Paysera redirect handler |
| `src/components/QuickScanFlow.tsx` | Payment method grid, routing logic |
| `public/images/payment/*.svg` | **NEW** — 10 logo files |
| `public/.well-known/apple-developer-merchantid-domain-association` | **NEW** — Apple Pay verification |
| `.env` / `.env.example` | Add keys for both providers |
| Backend: `bustodnr_api/payments/paysera_client.py` | **NEW** |
| Backend: `bustodnr_api/quickscan_lite.py` | Add `/payment-init-paysera` + `/paysera-callback` |

---

## Verification

1. Click "Mokėti ir gauti ataskaitą" → flat grid of **all payment methods** slides in (no grouping)
2. Each tile shows a **logo only** — recognizable brand icons
3. Banks first (Swedbank, SEB, Luminor, Citadele, Revolut, Paysera), then cards/wallets
4. **No default selection** — customer must pick one
5. Selecting a bank tile → hover/selected state → click confirm → redirect to that specific bank
6. Selecting Visa/MC tile → Stripe card input appears inline below the grid
7. Selecting Apple Pay → Apple Pay sheet (on supported devices only)
8. Selecting Google Pay → Google Pay sheet (on supported devices only)
9. Apple Pay tile hidden on non-Apple devices
10. Google Pay tile hidden on non-Chrome/non-Google devices
11. All paths end at the same success screen
12. Stub mode works for both providers