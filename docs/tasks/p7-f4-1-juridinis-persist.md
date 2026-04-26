# P7-F4.1 — Persist Juridinis Buyer Fields

## What
Add company fields to the Order model, include them in the payment-intent request, and pass them to the invoice renderer. Without this, juridinis invoices render with just the customer's email — missing the company name, code, and PVM code that the customer typed on Screen 2.

## Current flow (broken for juridinis)

1. Screen 2: customer checks "Juridinis asmuo", types company name, code, PVM code → **React state only**
2. "Mokėti" click → `POST /v1/quickscan-lite/payment-intent` with `{ quote_id, customer_email, invoice_requested, consent_flags, bundle_signature }` → **no company fields sent**
3. Backend creates Order with email, invoice_requested → **no company fields stored**
4. Webhook fires → report job runs → invoice renderer builds buyer from Order → **fizinis only** (no company data available)

## Fixed flow

1. Screen 2: same as before
2. "Mokėti" click → `POST /v1/quickscan-lite/payment-intent` with `{ ..., buyer_type, company_name, company_code, company_vat_code }` → **company fields included**
3. Backend creates Order with company fields → **stored in DB**
4. Webhook fires → invoice renderer reads company fields from Order → **correct juridinis invoice**

## How

### 1. Migration — add columns to orders table

```python
op.add_column("orders", sa.Column("buyer_type", sa.String(20), nullable=True))        # "fizinis" or "juridinis"
op.add_column("orders", sa.Column("company_name", sa.String(200), nullable=True))
op.add_column("orders", sa.Column("company_code", sa.String(20), nullable=True))
op.add_column("orders", sa.Column("company_vat_code", sa.String(20), nullable=True))
```

All nullable — existing orders stay fizinis by default. No backfill needed.

### 2. Update OrderORM model

Add the four fields to the Order model (wherever it's defined):

```python
buyer_type = Column(String(20), nullable=True)          # "fizinis" or "juridinis"
company_name = Column(String(200), nullable=True)
company_code = Column(String(20), nullable=True)
company_vat_code = Column(String(20), nullable=True)
```

### 3. Frontend — include in payment-intent request

In `QuickScanFlow.tsx`, find the `POST /v1/quickscan-lite/payment-intent` call. Add the company fields from React state:

```typescript
const body = {
  quote_id,
  customer_email: email,
  invoice_requested: invoiceRequested,
  consent_flags,
  bundle_signature,
  // NEW — juridinis fields
  buyer_type: isJuridinis ? "juridinis" : "fizinis",
  company_name: isJuridinis ? companyName : undefined,
  company_code: isJuridinis ? companyCode : undefined,
  company_vat_code: isJuridinis ? companyVatCode : undefined,
};
```

Claude Code must find the exact state variable names for the company fields in `QuickScanFlow.tsx`. They were implemented in Phase 6 Screen 2.

### 4. Backend — accept and store in payment-intent endpoint

In the `/payment-intent` handler (likely in `quickscan_lite.py`), accept the new fields from the request body and store on the Order:

```python
order.buyer_type = body.get("buyer_type", "fizinis")
order.company_name = body.get("company_name")
order.company_code = body.get("company_code")
order.company_vat_code = body.get("company_vat_code")
```

### 5. Update invoice renderer — remove buyer_override, read from Order

Now that the Order has company fields, F3's `_build_buyer(order)` can read them directly:

```python
def _build_buyer(order) -> dict:
    buyer_type = _get_attr(order, "buyer_type") or "fizinis"
    
    if buyer_type == "juridinis":
        return {
            "type": "juridinis",
            "name": _get_attr(order, "company_name") or "",
            "email": _get_attr(order, "customer_email") or "",
            "company_code": _get_attr(order, "company_code") or "",
            "vat_code": _get_attr(order, "company_vat_code") or "",
            "address": "",  # not collected on Screen 2 currently
        }
    else:
        return {
            "type": "fizinis",
            "name": _get_attr(order, "customer_name") or "",
            "email": _get_attr(order, "customer_email") or "",
        }
```

The `buyer_override` param in F3 can stay for testing convenience but is no longer needed in production.

### 6. Update report_task.py — remove _build_buyer_override

F4 currently has a `_build_buyer_override` that returns None (since the data wasn't persisted). Now that the data IS on the Order, the invoice renderer reads it directly. Remove the override logic and just pass the order:

```python
invoice_pdf_bytes = render_invoice_pdf(
    invoice_number=invoice_number,
    order=order,
    order_item=order_item,
    address=envelope.address or "",
    # No buyer_override needed — Order now has company fields
)
```

## Constraints

- **All new columns nullable.** Existing orders unaffected.
- **Frontend sends `undefined` (not empty string) for fizinis.** The backend stores `None`.
- **Backend validates:** if `buyer_type == "juridinis"`, `company_name` and `company_code` are required. Return 400 if missing.
- **Don't break existing payment flow.** Fizinis orders (no company fields) must continue working identically.

## Files to touch

### Backend (`~/dev/bustodnr`):
- New migration: add 4 columns to `orders`
- Order model file — add 4 fields
- Payment-intent endpoint — accept and store company fields
- `bustodnr_api/reports/invoice_renderer.py` — update `_build_buyer` to read from Order directly
- `bustodnr_api/payments/report_task.py` — simplify buyer handling

### Frontend (`~/dev/ntd`):
- `src/components/QuickScanFlow.tsx` — add company fields to payment-intent fetch body

## Verification

1. Fizinis flow: order created with `buyer_type=None` or "fizinis", no company fields → invoice renders as before.
2. Juridinis flow: check "Juridinis asmuo", fill company name + code + PVM → pay → order has all 4 fields stored → invoice shows company details in PIRKĖJAS section.
3. Dev invoice preview at `/v1/reports/dev/invoice/juridinis` still works (uses mock data).
4. All existing tests pass.