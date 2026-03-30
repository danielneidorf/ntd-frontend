# Feature: Inline Stripe Elements Card Input

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-stripe-inline-card.md
**Branch:** block1-e2e
**Scope:** When "Mokėti ir gauti ataskaitą" is clicked, call /payment-intent, then show inline Stripe Elements card input above the button; on confirm, process payment and transition to success screen

---

## Context

Currently the "Mokėti ir gauti ataskaitą" button either calls the payment-intent endpoint and goes straight to success (stub mode), or does nothing useful. This task adds the real Stripe.js card input inline within the payment card.

The backend `/v1/quickscan-lite/payment-intent` endpoint already exists and returns `{ ok: true, data: { client_secret, order_id } }`. The `PAYMENT_MODE` env var controls stub/test/live behavior.

---

## Step 1: Load Stripe.js SDK

Add the Stripe.js script to the page. Load it **lazily** — only when the payment card becomes active (after object confirmation), not on initial page load.

```typescript
// src/lib/stripe.ts (new file)

let stripePromise: Promise<any> | null = null;

export function getStripe(): Promise<any> {
  if (!stripePromise) {
    // Load Stripe.js dynamically
    stripePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        const key = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (key) {
          resolve((window as any).Stripe(key));
        } else {
          // No key = stub mode — resolve null, caller handles it
          resolve(null);
        }
      };
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }
  return stripePromise;
}
```

The `PUBLIC_STRIPE_PUBLISHABLE_KEY` env var controls behavior:
- **Set** (pk_test_* or pk_live_*): real Stripe flow
- **Not set**: stub mode — skip Stripe.js, go straight to success

---

## Step 2: Payment button click — call /payment-intent

When "Mokėti ir gauti ataskaitą" is clicked:

### 2a. Validate prerequisites

Button must already be disabled unless: object confirmed + email valid + consent checked + (if Juridinis: company name + code filled). So by the time the button is clickable, all prerequisites are met.

### 2b. Show loading state on button

```
Button text: "Mokėti ir gauti ataskaitą" → "Ruošiamas mokėjimas..." (with spinner)
Button disabled: true
```

### 2c. Call /payment-intent

```typescript
const response = await fetch('/api/v1/quickscan-lite/payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quote_id: state.quoteId,
    customer_email: state.email,
    invoice_requested: state.invoiceRequested,
    consent_flags: {
      terms_accepted: true,
      privacy_accepted: true,
      marketing_consent: false,
      timestamp: new Date().toISOString()
    },
    bundle_signature: state.bundleSignature
  })
});

const result = await response.json();
```

### 2d. Handle response

**Success (result.ok === true):**
- Extract `client_secret` from `result.data.client_secret`
- Check for stub mode: if `client_secret.startsWith('pi_stub')` → skip to Step 4 (success screen)
- Otherwise: proceed to Step 3 (show Stripe card input)

**Error:**

| Error code | UI message |
|---|---|
| `quote_expired` | "Kainos galiojimas baigėsi. Prašome grįžti ir patvirtinti objektą iš naujo." |
| Other / network error | "Mokėjimo klaida. Bandykite dar kartą." |

Show error message below the button in red (14px, #EF4444). Reset button to original state.

---

## Step 3: Show inline Stripe Elements card input

After receiving `client_secret`, render the Stripe Elements card input **above** the button, inside the payment card.

### 3a. Create Stripe Elements

```typescript
const stripe = await getStripe();
if (!stripe) {
  // Stub mode — skip to success
  goToSuccessScreen();
  return;
}

const elements = stripe.elements({
  clientSecret: clientSecret,
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#1E3A5F',        // NTD navy
      colorBackground: '#FFFFFF',
      colorText: '#1A1A2E',
      colorDanger: '#EF4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      fontSizeBase: '16px',
    },
    rules: {
      '.Input': {
        border: '1px solid #E2E8F0',
        padding: '12px 16px',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: '1px solid #0D7377',
        boxShadow: '0 0 0 1px #0D7377',
      },
      '.Label': {
        fontWeight: '500',
        marginBottom: '6px',
      }
    }
  },
  locale: 'lt',  // Lithuanian
});
```

### 3b. Mount the Payment Element

Use Stripe's `PaymentElement` (not the legacy `CardElement`) — it handles card, plus future payment methods:

```typescript
const paymentElement = elements.create('payment', {
  layout: 'tabs',  // compact layout
});

// Mount into a container div that appears above the button
const mountPoint = document.getElementById('stripe-card-mount');
paymentElement.mount(mountPoint);
```

### 3c. DOM structure after card input appears

The card input container slides in (0.3s animation) above the button:

```html
<!-- Inside the payment card, after checkboxes/fields, before button -->
<div id="stripe-card-mount" class="stripe-card-container">
  <!-- Stripe.js mounts here -->
</div>

<div id="stripe-error" class="stripe-error-message hidden">
  <!-- Error messages appear here -->
</div>

<button class="pay-button">
  Patvirtinti mokėjimą 39 €
</button>
```

### 3d. Styling for the card input container

```css
.stripe-card-container {
  margin-top: 16px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FAFBFC;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; max-height: 0; margin-top: 0; padding: 0; }
  to   { opacity: 1; max-height: 200px; margin-top: 16px; padding: 16px; }
}

.stripe-error-message {
  color: #EF4444;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.stripe-error-message.hidden {
  display: none;
}
```

### 3e. Button text changes

- Before card input: **"Mokėti ir gauti ataskaitą"**
- After card input appears: **"Patvirtinti mokėjimą 39 €"** (showing exact price)
- Button remains disabled until Stripe reports the card input is valid

Listen for the `change` event on the payment element:

```typescript
paymentElement.on('change', (event) => {
  const confirmBtn = document.getElementById('pay-button');
  if (event.complete) {
    confirmBtn.disabled = false;
  } else {
    confirmBtn.disabled = true;
  }
  
  // Show validation errors
  const errorEl = document.getElementById('stripe-error');
  if (event.error) {
    errorEl.textContent = event.error.message;
    errorEl.classList.remove('hidden');
  } else {
    errorEl.classList.add('hidden');
  }
});
```

### 3f. Auto-scroll

After the card input mounts, auto-scroll so the card input + button are visible above the marquee (same pattern as invoice field expand — 100px gap above marquee).

---

## Step 4: Confirm payment

When "Patvirtinti mokėjimą 39 €" is clicked:

### 4a. Show processing state

```
Button text: "Apdorojamas mokėjimas..." (with spinner)
Button disabled: true
Card input disabled: true (prevent edits during processing)
```

### 4b. Call stripe.confirmPayment

```typescript
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    // No return_url — we handle the redirect ourselves
  },
  redirect: 'if_required'  // only redirect if 3D Secure needed
});
```

### 4c. Handle result

**Success (paymentIntent.status === 'succeeded'):**
- Transition immediately to the **success screen**
- No waiting for the webhook — the success screen is the reassurance screen
- The backend webhook will fire separately and trigger the report job

**Error:**

```typescript
if (error) {
  const errorEl = document.getElementById('stripe-error');
  
  if (error.type === 'card_error' || error.type === 'validation_error') {
    errorEl.textContent = error.message;  // Stripe provides localized message
  } else {
    errorEl.textContent = 'Mokėjimo klaida. Bandykite dar kartą.';
  }
  
  errorEl.classList.remove('hidden');
  
  // Reset button
  confirmBtn.textContent = 'Patvirtinti mokėjimą 39 €';
  confirmBtn.disabled = false;
  // Card input stays mounted — user can fix and retry
}
```

**Requires action (3D Secure):**
- `stripe.confirmPayment` with `redirect: 'if_required'` handles 3D Secure automatically
- The user sees a Stripe-hosted modal for authentication
- After authentication, the promise resolves with success or error

---

## Step 5: Stub mode shortcut

If `PUBLIC_STRIPE_PUBLISHABLE_KEY` is not set, or if `client_secret` starts with `"pi_stub"`:

1. Skip loading Stripe.js
2. Skip mounting card input
3. Go directly to success screen after a brief delay (500ms — feels intentional, not broken)

```typescript
if (!stripe || clientSecret.startsWith('pi_stub')) {
  // Stub mode — simulate success
  setButtonText('Apdorojamas mokėjimas...');
  setButtonDisabled(true);
  await new Promise(r => setTimeout(r, 500));
  goToSuccessScreen();
  return;
}
```

---

## State flow summary

```
[Mokėti ir gauti ataskaitą] (enabled)
         │
         ▼ click
[Ruošiamas mokėjimas...] (disabled, spinner)
         │
         ▼ POST /payment-intent
         │
    ┌────┴────┐
    │         │
  error    success
    │         │
    ▼         ├── stub? → [500ms delay] → SUCCESS SCREEN
  show      │
  error     ▼
  reset   [Stripe card input appears]
  button  [Patvirtinti mokėjimą 39 €] (disabled until card valid)
              │
              ▼ click (card valid)
         [Apdorojamas mokėjimas...] (disabled, spinner)
              │
              ▼ stripe.confirmPayment
              │
         ┌────┴────┐
         │         │
       error    success
         │         │
         ▼         ▼
       show     SUCCESS SCREEN
       error
       (card stays mounted, retry possible)
```

---

## Files to touch

| File | Change |
|---|---|
| `src/lib/stripe.ts` | **NEW** — lazy Stripe.js loader + getStripe() |
| `src/components/QuickScanFlow.tsx` | Add stripe card state, mount logic, confirm logic |
| `.env` / `.env.example` | Add `PUBLIC_STRIPE_PUBLISHABLE_KEY` (empty for stub) |
| `astro.config.mjs` | Ensure env var is passed through (Astro uses `import.meta.env`) |

---

## What NOT to change

- Backend `/payment-intent` endpoint — untouched
- Backend `/payment-webhook` endpoint — untouched
- Payment card layout / checkbox order — untouched (per design-fix-screen2-redesign.md)
- Success screen — untouched (per design-success-screen.md)
- Proof card / blocks card — untouched

---

## Verification

1. In **stub mode** (no Stripe key): click "Mokėti ir gauti ataskaitą" → brief loading → success screen. No Stripe.js loaded, no card input shown.
2. In **test mode** (pk_test_* key set): click "Mokėti ir gauti ataskaitą" → loading → Stripe card input slides in above the button → button text changes to "Patvirtinti mokėjimą 39 €"
3. Card input uses NTD styling (navy primary, Inter font, rounded borders)
4. Card input in Lithuanian locale
5. Button disabled until card is valid (number + expiry + CVC filled)
6. Enter test card `4242 4242 4242 4242`, any future expiry, any CVC → click confirm → loading → success screen
7. Enter decline test card `4000 0000 0000 0002` → error message appears below card input → button re-enabled for retry
8. Card input container slides in with animation (0.3s)
9. Auto-scroll ensures card input + button visible above marquee
10. 3D Secure test card `4000 0025 0000 3155` → Stripe authentication modal → success after completing