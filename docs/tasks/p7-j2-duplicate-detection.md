# P7-J2 — Duplicate Purchase Detection

## What
Before creating a Stripe payment intent, check if the same `bundle_signature` + `customer_email` combination has a paid order within the last 24 hours. If so, warn the customer instead of silently charging them again.

## Why / Context
A customer who accidentally clicks "Mokėti" twice, or returns to the page after a successful payment and tries again, would currently get charged €39 twice for the same property report. The report is identical — there's no value in the duplicate. This wastes the customer's money and creates a support burden.

## How

### 1. Backend — check in `/payment-intent` handler

In `quickscan_lite.py`, at the top of the payment-intent handler (before creating the Stripe payment intent), add:

```python
# Check for duplicate purchase within 24h
from datetime import datetime, timezone, timedelta

existing = db.query(OrderORM).filter(
    OrderORM.bundle_signature == body.bundle_signature,
    OrderORM.customer_email == body.customer_email,
    OrderORM.status == "paid",
    OrderORM.paid_at >= datetime.now(timezone.utc) - timedelta(hours=24),
).first()

if existing and not body.force_duplicate:
    # Find the report access token for this order
    report_access = db.query(ReportAccessORM).filter(
        ReportAccessORM.order_id == existing.order_id
    ).first()

    return JSONResponse(
        status_code=200,
        content={
            "ok": True,
            "duplicate": True,
            "message": "Ši ataskaita jau buvo užsakyta per pastarines 24 val.",
            "existing_order_id": existing.order_id,
            "report_url": f"{REPORT_BASE_URL}/report/{report_access.access_token}" if report_access else None,
            "paid_at": existing.paid_at.isoformat() if existing.paid_at else None,
        }
    )
```

### 2. Request model — add `force_duplicate` flag

Add to `PaymentIntentRequest`:

```python
force_duplicate: bool = False  # Customer acknowledged duplicate, proceed anyway
```

### 3. Frontend — handle duplicate response

In `QuickScanFlow.tsx`, after the `/payment-intent` fetch, check for the `duplicate` flag:

```typescript
const data = await response.json();

if (data.duplicate) {
  // Show warning modal / inline warning
  setDuplicateWarning({
    message: data.message,
    reportUrl: data.report_url,
    paidAt: data.paid_at,
  });
  return; // Don't proceed to Stripe
}
```

### 4. Duplicate warning UI

Show a warning card (not a modal — stays in the flow) with three options:

```
┌──────────────────────────────────────────────┐
│  ⚠️  Ši ataskaita jau užsakyta               │
│                                              │
│  Šis objektas buvo užsakytas šiandien.       │
│  Ataskaita jau paruošta ir pasiekiama.       │
│                                              │
│  [Atidaryti ataskaitą →]    (primary, teal)  │  → opens report_url
│  [Persiųsti el. paštu]     (secondary)       │  → calls /resend-report
│  [Vis tiek užsakyti]       (text link, gray) │  → re-submits with force_duplicate=true
│                                              │
└──────────────────────────────────────────────┘
```

- **"Atidaryti ataskaitą"** — links directly to the existing report (most common action)
- **"Persiųsti el. paštu"** — re-sends the report email (in case they can't find it)
- **"Vis tiek užsakyti"** — proceeds with payment anyway (re-submits the same `/payment-intent` request with `force_duplicate: true`)

### 5. Resend endpoint

Check if `/resend-report` already exists. If not, add a simple endpoint:

```python
@router.post("/resend-report")
async def resend_report(body: ResendRequest, db: Session = Depends(get_db)):
    """Re-send the report email for an existing order."""
    order = db.query(OrderORM).filter(
        OrderORM.order_id == body.order_id,
        OrderORM.customer_email == body.email,  # verify ownership
    ).first()

    if not order:
        raise HTTPException(404, "Užsakymas nerastas")

    # Find report access
    report_access = db.query(ReportAccessORM).filter(
        ReportAccessORM.order_id == order.order_id
    ).first()

    if not report_access:
        raise HTTPException(404, "Ataskaita dar neparuošta")

    report_url = f"{REPORT_BASE_URL}/report/{report_access.access_token}"

    # Re-send email
    send_quickscan_lite_email(
        to_email=order.customer_email,
        envelope=_build_minimal_envelope(order),
        report_url=report_url,
    )

    return {"ok": True, "message": "Ataskaita išsiųsta pakartotinai"}
```

### 6. Detection criteria

- **Same `bundle_signature`** — this encodes the property + block combination. Same property = same report content.
- **Same `customer_email`** — prevents cross-customer detection (different person ordering for the same property is legitimate).
- **Within 24 hours** — allows re-ordering after a day (data might have been updated, or customer has a new reason).
- **Order status `paid`** — only check completed orders, not abandoned/pending ones.

### 7. Edge cases

- **Customer changes email and reorders**: different email = no duplicate detected. Acceptable — we can't link identities without accounts.
- **Two different customers ordering the same property**: different emails = no duplicate. Both pay. Correct behavior.
- **Customer orders, report fails, reorders**: if `report_sent` is False, the duplicate check still fires (order is `paid`). The warning shows but `report_url` will be None → "Atidaryti ataskaitą" button is hidden, "Persiųsti" is hidden, only "Vis tiek užsakyti" shows. Or: add `report_sent=True` to the query filter so only successfully delivered reports trigger the warning.

## Constraints

- **Don't block legitimate re-purchases.** The "Vis tiek užsakyti" option must always be available.
- **200 status code for duplicate response** — not 409. The frontend needs to parse the JSON, and some fetch wrappers throw on 4xx.
- **`force_duplicate` is a simple boolean** — no CSRF token needed since Stripe handles the actual payment security.
- **24-hour window, not forever.** Property data updates; a customer may legitimately want a fresh report next week.
- **Don't duplicate-check in test/dev payment mode** — or do, since it's useful for testing. Your call.

## Files to touch

### Backend (`~/dev/bustodnr`):
- `bustodnr_api/quickscan_lite.py` — duplicate check in payment-intent handler, add `force_duplicate` to request model, optionally add `/resend-report` endpoint

### Frontend (`~/dev/ntd`):
- `src/components/QuickScanFlow.tsx` — handle `duplicate` response, show warning UI, "Vis tiek užsakyti" re-submit with `force_duplicate: true`

## Verification

1. Order a report for address X with email Y → succeeds normally.
2. Order again for same X + Y within 24h → get `{ duplicate: true }` with report URL.
3. Click "Atidaryti ataskaitą" → opens existing report.
4. Click "Vis tiek užsakyti" → proceeds to Stripe payment normally.
5. Order same X with different email → no duplicate warning.
6. Order after 24h → no duplicate warning.
7. All existing tests pass.