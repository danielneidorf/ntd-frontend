# Feature: Visible Discount UI on Screen 2

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-discount-display.md
**Branch:** block1-e2e
**Scope:** Show strikethrough base price + discount badge when `special_discount_applied` is true; add dev link

---

## Problem

The backend already returns discount information in the `/quote` response:

```json
{
  "final_price_eur": 39.00,
  "base_price_eur": 49.00,
  "special_discount_applied": true,
  "discount_amount_eur": 10.00,
  "pricing_label": "Standartinis"
}
```

The frontend captures `?token=` from the URL and passes it to `/quote` (as `promo`) and `/payment-intent` (as `discount_token`). But the payment card on Screen 2 just shows `final_price_eur` — the customer who clicked a discount link has **no visual feedback** that their discount was applied.

---

## Dev link — add to Dev ⚙️ dropdown

| Label | URL |
|---|---|
| Nuolaida | `/quickscan/?case=existing_object&step=2&discount=true` |

When `discount=true` param is present alongside `step=2`, render Screen 2 with mock quote data that has `special_discount_applied: true`:

```javascript
const mockQuoteWithDiscount = {
  final_price_eur: 39.00,
  base_price_eur: 49.00,
  special_discount_applied: true,
  discount_amount_eur: 10.00,
  pricing_label: "Standartinis",
  ui_explanation_block: [
    "Kaina apskaičiuota pagal registrų duomenis ir vertinimo apimtį.",
    "Šiuo metu jums taikoma speciali nuolaida."
  ]
};
```

---

## UI: Price display in the payment card

### When NO discount (`special_discount_applied === false` or not present)

Current behavior — no change:

```
39 €
/ objektas
```

- **"39 €"** — 32px semibold, #1E3A5F
- "/ objektas" — 14px, #64748B

### When discount IS applied (`special_discount_applied === true`)

```
~~49 €~~  39 €   ✓ Nuolaida pritaikyta
/ objektas        -10 €
```

#### Layout (left section of payment card)

```html
<div class="price-section">
  <div class="price-row">
    <span class="price-original">49 €</span>
    <span class="price-final">39 €</span>
    <span class="discount-badge">✓ Nuolaida pritaikyta</span>
  </div>
  <div class="price-sub-row">
    <span class="price-per">/ objektas</span>
    <span class="discount-amount">-10 €</span>
  </div>
</div>
```

#### Styling

```css
.price-original {
  font-size: 20px;
  font-weight: 500;
  color: #94A3B8;
  text-decoration: line-through;
  margin-right: 8px;
}

.price-final {
  font-size: 32px;
  font-weight: 600;
  color: #1E3A5F;
}

.discount-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #059669;              /* green */
  background: #E8F8EE;
  padding: 3px 8px;
  border-radius: 4px;
  margin-left: 10px;
  vertical-align: middle;
}

.discount-amount {
  font-size: 14px;
  font-weight: 500;
  color: #059669;              /* green */
  margin-left: 8px;
}

.price-per {
  font-size: 14px;
  color: #64748B;
}
```

#### Visual result

- **~~49 €~~** — strikethrough, muted gray, smaller (20px)
- **39 €** — bold navy, large (32px) — the real price
- **✓ Nuolaida pritaikyta** — small green badge to the right
- **-10 €** — green text below, next to "/ objektas"

The strikethrough + green badge makes it instantly clear the discount worked. The customer sees what they would have paid vs. what they're actually paying.

---

## Also update the "Patvirtinti mokėjimą" button

When discount is applied, the button still shows the **final** (discounted) price:

- No discount: **"Patvirtinti mokėjimą 39 €"**
- With discount: **"Patvirtinti mokėjimą 39 €"** (same — always shows final_price_eur)

Don't show the original price on the button — keep it simple.

---

## Conditional rendering logic

```typescript
// In the payment card component
const showDiscount = quote?.special_discount_applied === true 
  && quote?.base_price_eur > quote?.final_price_eur;

// Price display
{showDiscount ? (
  <>
    <span className="price-original">{quote.base_price_eur} €</span>
    <span className="price-final">{quote.final_price_eur} €</span>
    <span className="discount-badge">✓ Nuolaida pritaikyta</span>
    <div className="price-sub-row">
      <span className="price-per">/ objektas</span>
      <span className="discount-amount">-{quote.discount_amount_eur} €</span>
    </div>
  </>
) : (
  <>
    <span className="price-final">{quote.final_price_eur} €</span>
    <div className="price-sub-row">
      <span className="price-per">/ objektas</span>
    </div>
  </>
)}
```

---

## What NOT to change

- Discount token capture from URL (`?token=`) — already implemented
- Backend `/quote` and `/payment-intent` endpoints — untouched
- Screen 1 — untouched (no discount indication needed there)
- Payment method grid — untouched
- Success screen — untouched (could show discount info in future, but not now)

---

## Verification

1. Dev dropdown shows **"Nuolaida"** link
2. Clicking it renders Screen 2 with discount applied
3. Price section shows: ~~49 €~~ **39 €** ✓ Nuolaida pritaikyta
4. Below: "/ objektas" and **-10 €** in green
5. Strikethrough is visually clear — muted gray, smaller font
6. Green badge is visible and aligned with the price
7. Without discount (normal `step=2`): price shows just **39 €** with no strikethrough or badge
8. "Patvirtinti mokėjimą" button shows final (discounted) price