# Feature: Duplicate Purchase Warning

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-duplicate-purchase-warning.md
**Branch:** block1-e2e
**Scope:** Show a warning when the same property + same email was recently ordered; add dev link

---

## When this warning appears

On Screen 2, when the customer clicks **"Mokėti ir gauti ataskaitą"**, the frontend calls `/payment-intent`. Before creating the Order, the backend checks whether an order with the same `bundle_signature` + same `customer_email` was paid within a recent time window (e.g., 24 hours).

If a duplicate is detected, the backend returns a specific response:

```json
{
  "ok": false,
  "error_code": "duplicate_order",
  "data": {
    "existing_order_id": "uuid-xxx",
    "paid_at": "2026-03-30T10:15:00Z",
    "address": "Vilnius, Žirmūnų g. 12"
  }
}
```

The frontend shows the warning **inline on Screen 2** — not a modal, not a separate screen. It replaces the pay button area temporarily.

---

## Dev link — add to the Dev ⚙️ dropdown

| Label | URL |
|---|---|
| S5: Dublikatas | `/quickscan/?case=existing_object&step=duplicate` |

When `step=duplicate` URL param is present, render Screen 2 in the confirmed state with the duplicate warning visible (simulating the state after "Mokėti" was clicked and the backend returned `duplicate_order`).

---

## Warning UI — inline, inside the payment card

The warning replaces the Stripe card input area and the pay button. It appears inside the payment card, below the checkboxes/fields, where the button normally sits.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Payment card (existing content above: price, email, etc.)   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  ⚠️  Panašu, kad neseniai jau užsakėte ataskaitą       │ │
│ │      šiam objektui.                                     │ │
│ │                                                         │ │
│ │  Vilnius, Žirmūnų g. 12                                 │ │
│ │  Užsakyta: 2026-03-30, 10:15                            │ │
│ │                                                         │ │
│ │  ┌─────────────────┐  ┌──────────────────────────────┐  │ │
│ │  │ Persiųsti paskut.│  │  Vis tiek užsakyti iš naujo  │  │ │
│ │  │    ataskaitą      │  │                              │  │ │
│ │  └─────────────────┘  └──────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Warning box styling

```css
.duplicate-warning {
  background: #FEF3C7;          /* warm amber background */
  border: 1px solid #F59E0B;
  border-radius: 8px;
  padding: 24px;
  margin-top: 16px;
  animation: slideDown 0.3s ease;
}
```

### Content

**Icon + title:**
- ⚠️ icon (24px, #D97706)
- **"Panašu, kad neseniai jau užsakėte ataskaitą šiam objektui."** — 16px semibold, #92400E

**Details:**
- **Address** from the existing order — 15px semibold, #1A1A2E (e.g., "Vilnius, Žirmūnų g. 12")
- **Date/time:** "Užsakyta: 2026-03-30, 10:15" — 14px, #92400E

### Two action buttons (side by side)

**Left button — "Persiųsti paskutinę ataskaitą":**
- Outline button, amber border (#F59E0B), amber text (#D97706)
- On click: calls a backend endpoint to re-send the last report to the same email
- After sending: shows brief confirmation "✓ Ataskaita išsiųsta iš naujo" in green, then fades the warning away

**Right button — "Vis tiek užsakyti iš naujo":**
- Navy filled button (#1E3A5F), white text
- On click: proceeds with the normal payment flow (calls `/payment-intent` again with a `force_duplicate=true` flag or similar)
- The backend creates a new Order and returns `client_secret` as normal

### Button sizing

Both buttons equal width, side by side with 12px gap. Height 44px, font 14px medium.

---

## Backend requirement (brief note for backend task)

The `/payment-intent` endpoint needs a duplicate check:

1. Before creating Order, query: `SELECT * FROM orders WHERE bundle_signature = ? AND customer_email = ? AND status = 'paid' AND paid_at > (now - 24h) LIMIT 1`
2. If found, return `{ ok: false, error_code: "duplicate_order", data: { existing_order_id, paid_at, address } }`
3. If the frontend re-calls with `force_duplicate: true`, skip the check and proceed normally

A separate endpoint for resending: `POST /v1/quickscan-lite/resend-report` with `{ order_id }` — finds the existing order, re-triggers the email send. Returns success/failure.

**These backend changes are noted here for reference but are NOT in scope for this frontend brief. They will need a separate backend task.**

---

## State flow

```
Customer clicks "Mokėti ir gauti ataskaitą"
         │
         ▼
POST /payment-intent
         │
    ┌────┴──────────────┐
    │                   │
  normal              duplicate_order
  (proceed to         │
   Stripe card)       ▼
                   Show warning box
                      │
              ┌───────┴────────┐
              │                │
     "Persiųsti"        "Vis tiek užsakyti"
              │                │
              ▼                ▼
    POST /resend-report    POST /payment-intent
              │            (force_duplicate=true)
              ▼                │
    "✓ Išsiųsta"            Normal Stripe flow
    (warning fades)         (card input → pay → success)
```

---

## Mock behavior for `step=duplicate`

When `step=duplicate` is detected:
- Render Screen 2 in confirmed state (same as `step=2` with object confirmed)
- Payment card shows email filled, consent checked
- The duplicate warning box is visible below the checkboxes, replacing the pay button
- Mock data: existing order from "2026-03-30, 10:15", address "Vilnius, Žirmūnų g. 12"
- "Persiųsti" button: shows "✓ Ataskaita išsiųsta iš naujo" inline (no real API call)
- "Vis tiek užsakyti" button: proceeds to normal payment flow (stub mode → success screen)

---

## What NOT to change

- Screen 2 layout — untouched (warning is additive, inside the existing payment card)
- Payment flow — untouched (warning only intercepts before Stripe card input)
- Backend — noted but not in scope for this brief
- Other screens — untouched

---

## Verification

1. Dev dropdown shows **"S5: Dublikatas"** link
2. Clicking it renders Screen 2 with the duplicate warning box visible
3. Warning has amber background, ⚠️ icon, address, order date
4. Two buttons side by side: "Persiųsti paskutinę ataskaitą" and "Vis tiek užsakyti iš naujo"
5. "Persiųsti" → shows "✓ Ataskaita išsiųsta iš naujo" confirmation
6. "Vis tiek užsakyti" → proceeds to normal payment flow
7. Warning box slides in with animation (0.3s)
8. Pay button is hidden while warning is visible
9. Warning is polite — no blame, helpful tone