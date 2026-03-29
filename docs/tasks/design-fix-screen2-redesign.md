# Design Fix: Screen 2 — Symmetrical Layout + Payment Flow (FINAL)

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-screen2-redesign.md
**Branch:** block1-e2e
**Scope:** Redesign Screen 2; payment card with checkboxes column + expanding fields; inline Stripe

---

## Layout: two cards on top, payment card spanning below

```
┌──────────────────────┐  ┌──────────────────────┐
│ Patvirtinkite objektą│  │ Jūsų ataskaita       │
│ [proof card]         │  │ [8 blocks list]       │
└──────────────────────┘  └──────────────────────┘
┌─────────────────────────────────────────────────┐
│ Payment card (full width)                        │
└─────────────────────────────────────────────────┘
```

### Grid

```css
.screen2-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 32px;
}

.proof-card   { grid-column: 1; grid-row: 1; }
.blocks-card  { grid-column: 2; grid-row: 1; }
.payment-card { grid-column: 1 / -1; grid-row: 2; }
```

All cards: white, border 1px solid #E2E8F0, border-radius 12px, padding 24px, shadow.

---

## Card 1 (top-left): Proof card — "Patvirtinkite objektą"

**Title:** "Patvirtinkite objektą" — 18px semibold, #1A1A2E

**Subtitle:** "Radome atitinkantį įrašą. Patikrinkite, ar tai tas pats objektas." — 14px, #64748B

**Object details:** address (bold 16px), NTR, municipality, bundle summary, "Vertinimas taikomas pagrindiniam šildomam objektui." (13px, #94A3B8)

**Green confirmed box** uses `position: sticky; top: 80px` inside the proof card (per design-fix-screen2-invoice-scroll.md).

**Buttons:** "Taip, teisingas" (teal) / "Ne, ieškoti kito" (muted text)

---

## Card 2 (top-right): Report blocks — "Jūsų ataskaita"

**Title:** "Jūsų ataskaita" — 18px semibold

**Subtitle — case-dependent:**

| Case | Subtitle |
|---|---|
| **existing_object** | "Šie duomenų blokai bus įtraukti į ataskaitą:" |
| **new_build_project** | "...Kadangi projektas gali būti dar neregistruotas, dalis vertinimų remiasi projekto duomenimis:" |
| **land_only** | "...Šiluminio komforto blokai taikomi tik šildomiems pastatams:" |

**8 blocks with case-dependent enabling** (existing: all ✅; new-build: 1–3 noted "(pagal projekto duomenis)"; land: 1–3 greyed "(netaikoma)")

**Footer:** "PDF ataskaita bus išsiųsta el. paštu per 1 val." — 13px, #64748B

---

## Card 3 (bottom, full width): Payment card

### Internal layout — horizontal: price left, rest right

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   39 €        │  El. pašto adresas                          │
│   / objektas  │  [____________________________]             │
│               │  Ataskaitą išsiųsime šiuo adresu.           │
│               │                                             │
│               │  ☐ Sutinku su sąlygomis ir privatumu.       │
│               │                                             │
│               │  ☐ Reikia sąskaitos faktūros                │
│               │     ┌─────────────────────────────────┐     │
│               │     │ Sąskaitos el. paštas            │     │
│               │     │ [____________________________]  │     │
│               │     │ Įveskite, jeigu norite sąskaitą │     │
│               │     │ gauti kitu el. pašto adresu     │     │
│               │     └─────────────────────────────────┘     │
│               │                                             │
│               │  ☐ Juridinis asmuo                          │
│               │     ┌─────────────────────────────────┐     │
│               │     │ Įmonės pavadinimas              │     │
│               │     │ [____________________________]  │     │
│               │     │ Įmonės kodas                    │     │
│               │     │ [____________________________]  │     │
│               │     │ PVM mokėtojo kodas (nebūtina)   │     │
│               │     │ [____________________________]  │     │
│               │     └─────────────────────────────────┘     │
│               │                                             │
│               │  (Stripe card input appears here on click)  │
│               │                                             │
│               │  ┌─────────────────────────────────────┐    │
│               │  │     Mokėti ir gauti ataskaitą        │    │
│               │  └─────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Left section — Price (fixed, doesn't move)

- **"39 €"** — 32px semibold, #1E3A5F (exact price from `/quote`)
- "/ objektas" — 14px, #64748B
- Vertically centered within the left section, or top-aligned

### Right section — vertical flow, top to bottom

Everything in a single column. Three checkboxes are ALWAYS visible. Selecting each expands fields directly below it. The button stays at the very bottom and slides down as fields appear.

**1. Email (always visible):**
- "El. pašto adresas" — 14px medium
- Input: 48px, placeholder "vardas@pastas.lt"
- "Ataskaitą išsiųsime šiuo adresu." — 13px, #64748B

**2. Consent checkbox (always visible):**
- ☐ "Sutinku su paslaugos teikimo sąlygomis ir privatumo nuostatomis." — 14px
- Links "sąlygomis" and "privatumo nuostatomis" are teal clickable links

**3. Invoice checkbox (always visible):**
- ☐ "Reikia sąskaitos faktūros" — 14px

**When checked → fields expand below (0.3s slide-down):**
- "Sąskaitos el. paštas" — input 48px, optional
  - Helper: "Įveskite, jeigu norite sąskaitą gauti kitu el. pašto adresu" — 13px, #64748B
  - Placeholder: main email (greyed)

**4. Juridinis checkbox (always visible):**
- ☐ "Juridinis asmuo" — 14px

**When checked → fields expand below (0.3s slide-down):**
- "Įmonės pavadinimas" — input 48px, required
- "Įmonės kodas" — input 48px, required
- "PVM mokėtojo kodas" — input 48px, optional
  - Helper: "Jei esate PVM mokėtojas" — 13px, #64748B

**5. Stripe card input (appears on button click):**
- See "Payment flow" section below

**6. Pay button (always at the bottom, slides down as fields expand):**
- **"Mokėti ir gauti ataskaitą"** — navy (#1E3A5F), white text, full width of right section, 48px, 16px
- Disabled until: (a) object confirmed, (b) email valid, (c) consent checked, (d) if Juridinis — company name + code filled

### Spacing between elements

- Gap between email block and consent checkbox: 16px
- Gap between checkboxes: 12px
- Gap between checkbox and its expanded fields: 8px (feels connected)
- Gap between last element and button: 24px
- Expanded fields indented 24px from the checkbox (or inside a subtle bordered container)

---

## Payment flow — inline Stripe card input

**When "Mokėti ir gauti ataskaitą" is clicked:**

1. Frontend calls `POST /v1/quickscan-lite/payment-intent` with `{ quote_id, customer_email, invoice_requested, consent_flags, bundle_signature }`
2. Backend validates, creates Order, returns `client_secret`
3. **Stripe Elements card input appears above the button** (inline):

```
Kortelės duomenys
[Card number          ] [MM/YY] [CVC]

┌─────────────────────────────────────┐
│     Patvirtinti mokėjimą 39 €        │
└─────────────────────────────────────┘
```

- Button text changes to **"Patvirtinti mokėjimą 39 €"**
- Button disabled until card input is valid
- Auto-scroll to ensure card input + button visible above marquee

4. Customer fills card, clicks "Patvirtinti mokėjimą 39 €"
5. `stripe.confirmCardPayment(clientSecret)` called
6. On success → **success screen** immediately
7. On failure → error message: "Mokėjimo klaida. Bandykite dar kartą." (14px, #EF4444)

**Stub mode:** `client_secret` starts with `"pi_stub"` → skip Stripe, go to success.

### Error states

| Error | Message |
|---|---|
| quote_expired | "Kainos galiojimas baigėsi. Prašome grįžti ir patvirtinti objektą iš naujo." |
| card_declined | "Mokėjimo klaida. Bandykite dar kartą arba naudokite kitą kortelę." |
| backend_error | "Mokėjimo klaida. Bandykite dar kartą." |

---

## Back navigation preserves case

"Ne, ieškoti kito" → Screen 1 with same case toggle pre-selected (in-memory state). All inputs preserved.

---

## What NOT to change

- Proof card sticky behavior — untouched
- Auto-scroll on field expand — untouched (per design-fix-screen2-invoice-scroll.md)
- Backend endpoints — untouched

---

## Verification

1. Three cards: proof (top-left), blocks (top-right), payment (bottom spanning)
2. Content centered (max-width 1100px)
3. Price on the left, all fields + checkboxes + button in a column on the right
4. **Three checkboxes always visible:** Sutinku, Reikia sąskaitos, Juridinis asmuo
5. Checking "Reikia sąskaitos" → invoice email field slides in below it
6. Checking "Juridinis asmuo" → company fields slide in below it
7. **"Mokėti ir gauti ataskaitą" is always at the bottom** — slides down as fields expand
8. Button disabled until required fields filled
9. Clicking "Mokėti" → Stripe card input appears above button, button text → "Patvirtinti mokėjimą 39 €"
10. Successful payment → success screen
11. "Ne, ieškoti kito" → Screen 1 with correct case