# Dev + Design: Success Screen + Temporary Access Link

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-success-screen.md
**Branch:** block1-e2e
**Scope:** Implement the post-payment success screen; add temp dev header link

---

## ⚠️ TEMPORARY DEV LINK — Remove before production deploy

Add a header link for development access:

**Text:** "Sėkmė ⚙️"
**Style:** amber (#E8A040), italic — same as the "Patvirtinimas ⚙️" dev link
**Position:** after "Patvirtinimas ⚙️" in the header
**Link:** `/quickscan/?case=existing_object&step=success`

In QuickScanFlow.tsx, handle `step=success` by rendering the success screen with mock data (same pattern as `step=2`).

---

## Success screen layout

Shown immediately after payment success. No waiting for backend report job. Centered, max-width 1100px.

### Structure: green banner on top, two cards below

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Užsakymas priimtas.                                  │
│  Pradėjome informacijos paiešką registruose, duomenų    │
│  tikrinimą ir visų blokų skaičiavimus. Ataskaitą el.    │
│  paštu paprastai išsiunčiame greitai, bet gali užtrukti │
│  iki 1 valandos.                                        │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ Jūsų užsakymas           │  │ Pristatymas              │
│                          │  │                          │
│ Vilnius, Žirmūnų g. 12   │  │ Ataskaita bus išsiųsta   │
│ NTR: 4400-XXXX-XXXX      │  │ adresu:                  │
│ Savivaldybė: Vilniaus m.  │  │ vardas@pastas.lt         │
│                          │  │                          │
│ Namų ūkio komplektas:    │  │ Jei laiško nematysite,   │
│ • Pagrindinis objektas:   │  │ patikrinkite "Šlamštas"  │
│   Gyvenamasis pastatas    │  │ ar "Reklamos" aplankus.  │
│ • Komplekte: garažas,     │  │                          │
│   sandėliukas            │  │ ┌──────────────────────┐ │
│                          │  │ │ Grįžti į pradžią     │ │
│ Ataskaitos blokai:        │  │ └──────────────────────┘ │
│ ✅ Šiluminis komfortas    │  │                          │
│ ✅ Energijos sąnaudos     │  │ Peržiūrėti dar vieną    │
│ ✅ 10 metų išlaidos       │  │ objektą →                │
│ ✅ Oro ir vandens tarša   │  │                          │
│ ✅ Triukšmo tarša         │  │                          │
│ ✅ Kainos pagrįstumas     │  │                          │
│ ✅ Teisinės rizikos       │  │                          │
│ ✅ Derybų strategija      │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

---

## Green banner — reassurance message

Full-width (within 1100px container), spanning both columns.

```css
.success-banner {
  background: #E8F8EE;
  border: 1px solid #34D399;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}
```

**Content:**
- Green checkmark (✅, 24px) + **"Užsakymas priimtas."** — 20px semibold, #1A1A2E
- Below: **"Pradėjome informacijos paiešką registruose, duomenų tikrinimą ir visų blokų skaičiavimus. Ataskaitą el. paštu paprastai išsiunčiame greitai, bet gali užtrukti iki 1 valandos."** — 15px regular, #1A1A2E

---

## Card 1 (bottom-left): Order summary — "Jūsų užsakymas"

Same card styling as other screens (white, border, radius, shadow, padding 24px).

**Title:** "Jūsų užsakymas" — 18px semibold, #1A1A2E

**Object details:**
- Address (bold 16px)
- Unikalus Nr. — 14px, #64748B
- Savivaldybė — 14px, #64748B
- Bundle summary — 14px, #64748B

**Report blocks list** (same as Screen 2's "Jūsų ataskaita" card):
- All 8 blocks with case-dependent enabling (✅ or — with notes)
- This confirms exactly what the customer paid for

---

## Card 2 (bottom-right): Delivery info — "Pristatymas"

Same card styling.

**Title:** "Pristatymas" — 18px semibold, #1A1A2E

**Content:**
- "Ataskaita bus išsiųsta adresu:" — 14px, #64748B
- **"vardas@pastas.lt"** — 16px semibold, #1A1A2E (the actual email the customer entered)
- Spacer (16px)
- "Jei laiško nematysite per 1 valandą, patikrinkite „Šlamštas" (Spam) ar „Reklamos" (Promotions) aplankus." — 14px, #64748B
- Spacer (24px)
- **"Grįžti į pradžią"** — navy button, full width, links to `/` (landing page)
- **"Peržiūrėti dar vieną objektą →"** — teal text link below the button, links to `/quickscan/` (new flow)

---

## Grid

```css
.success-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 32px;
}

.success-banner { grid-column: 1 / -1; }
.order-card     { grid-column: 1; }
.delivery-card  { grid-column: 2; }
```

Mobile (<768px): single column, stacked.

---

## No header step indicator on this screen

The success screen is the end of the flow. No "1 Vieta → 2 Patvirtinimas" indicator needed. The header shows the normal nav links.

---

## Mock data for `?step=success`

When `step=success` URL param is detected, render the success screen with:
- Address: "Vilnius, Žirmūnų g. 12"
- NTR: "4400-1234-5678"
- Municipality: "Vilniaus m. sav."
- Bundle: "Gyvenamasis pastatas (šildomas). Komplekte: garažas, sandėliukas."
- Email: "vardas@pastas.lt"
- All 8 blocks enabled (existing_object case)

---

## What NOT to change

- Payment flow — untouched
- Backend — untouched
- Other screens — untouched

---

## Verification

1. Header shows amber "Sėkmė ⚙️" dev link
2. Clicking it loads the success screen with mock data
3. Green banner spans full width with reassurance message
4. Left card shows order summary with object details + 8 report blocks
5. Right card shows email address + spam folder hint + "Grįžti į pradžią" button + "Peržiūrėti dar vieną objektą" link
6. "Grįžti į pradžią" → landing page
7. "Peržiūrėti dar vieną objektą" → `/quickscan/` (fresh flow)
8. Content centered (max-width 1100px)
9. No step indicator on this screen