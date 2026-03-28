# Design Fix: Screen 2 — Symmetrical Layout with Report Blocks (FINAL)

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-screen2-redesign.md
**Branch:** block1-e2e
**Scope:** Redesign Screen 2 with symmetrical three-section layout; case-dependent blocks; invoice logic; exact price; back navigation

---

## Layout: two cards on top, payment card spanning below

```
┌──────────────────────┐  ┌──────────────────────┐
│ Patvirtinkite objektą│  │ Jūsų ataskaita       │
│ [proof card]         │  │ [8 blocks list]       │
│ [Ne, ieškoti kito]   │  │ [case-dependent note] │
└──────────────────────┘  └──────────────────────┘
┌─────────────────────────────────────────────────┐
│ 39 € · El. paštas · Sutikimas · [Mokėti]        │
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

All cards: white, border 1px solid #E2E8F0, border-radius 12px, padding 24px, shadow 0 2px 8px rgba(0,0,0,0.04).

---

## Card 1 (top-left): Proof card — "Patvirtinkite objektą"

**Title:** "Patvirtinkite objektą" — 18px semibold, #1A1A2E

**Subtitle:** "Radome atitinkantį įrašą. Patikrinkite, ar tai tas pats objektas." — 14px, #64748B

**Object details:**
- Address (bold 16px): "Vilnius, Žirmūnų g. 12"
- Unikalus Nr.: 4400-XXXX-XXXX — 14px, #64748B
- Savivaldybė: Vilniaus m. sav. — 14px, #64748B
- Bundle: "Komplekte taip pat yra: garažas, sandėliukas." — 14px, #64748B
- "Vertinimas taikomas pagrindiniam šildomam objektui." — 13px, #94A3B8

**Buttons:**
- "Taip, teisingas" — teal outline button
- "Ne, ieškoti kito" — muted text button

Once confirmed: green border/checkmark, payment card becomes active.

---

## Card 2 (top-right): Report blocks — "Jūsų ataskaita"

### Title
**"Jūsų ataskaita"** — 18px semibold, #1A1A2E

### Subtitle — CHANGES BASED ON CASE

| Case | Subtitle text |
|---|---|
| **existing_object** | "Šie duomenų blokai bus įtraukti į ataskaitą:" |
| **new_build_project** | "Šie duomenų blokai bus įtraukti į ataskaitą. Kadangi projektas gali būti dar neregistruotas, dalis vertinimų remiasi projekto duomenimis:" |
| **land_only** | "Šie duomenų blokai bus įtraukti į ataskaitą. Šiluminio komforto blokai taikomi tik šildomiems pastatams:" |

Subtitle: 14px, #64748B.

### Block list — all 8 blocks with case-dependent states

**existing_object — all enabled:**
```
✅ 🌡️ Šiluminis komfortas
✅ ⚡ Energijos sąnaudos
✅ 📊 10 metų išlaidos
✅ 🌿 Oro ir vandens tarša
✅ 🔇 Triukšmo tarša
✅ 💰 Kainos pagrįstumas
✅ ⚖️ Teisinės rizikos
✅ 🎯 Derybų strategija
```

**new_build_project — all enabled, blocks 1–3 noted:**
```
✅ 🌡️ Šiluminis komfortas (pagal projekto duomenis)
✅ ⚡ Energijos sąnaudos (pagal projekto duomenis)
✅ 📊 10 metų išlaidos (pagal projekto duomenis)
✅ 🌿 Oro ir vandens tarša
✅ 🔇 Triukšmo tarša
✅ 💰 Kainos pagrįstumas
✅ ⚖️ Teisinės rizikos
✅ 🎯 Derybų strategija
```
Notes "(pagal projekto duomenis)" in 12px, #94A3B8.

**land_only — blocks 1–3 disabled:**
```
— 🌡️ Šiluminis komfortas (netaikoma)
— ⚡ Energijos sąnaudos (netaikoma)
— 📊 10 metų išlaidos (netaikoma)
✅ 🌿 Oro ir vandens tarša
✅ 🔇 Triukšmo tarša
✅ 💰 Kainos pagrįstumas
✅ ⚖️ Teisinės rizikos
✅ 🎯 Derybų strategija
```
Disabled rows: text #C4C4C4, "—" instead of ✅.

Row styling: ~36px height, 4px gap, emoji 18px, name 14px medium #1A1A2E.

### Footer
"PDF ataskaita bus išsiųsta el. paštu per 1 val." — 13px, #64748B

---

## Card 3 (bottom, full width): Payment card

### Internal horizontal layout — three sections

**Left — Price:**
- **"39 €"** — 32px semibold, #1E3A5F (exact calculated price from `/quote`)
- "/ objektas" — 14px, #64748B

**Center — Email:**
- Label: "El. pašto adresas" — 14px medium, #1A1A2E
- Input: 48px height, 16px font, placeholder "vardas@pastas.lt"
- Helper: "Ataskaitą išsiųsime šiuo adresu." — 13px, #64748B

**Right — Consent + Button:**
- Checkbox: "Sutinku su paslaugos teikimo sąlygomis ir privatumo nuostatomis." — 14px
- Button: **"Mokėti ir gauti ataskaitą"** — navy, white text, 48px, 16px
- Button disabled until: (a) object confirmed, (b) email entered, (c) consent checked

### Invoice section — below the three-column row, inside the same card

**Checkbox:** ☐ **"Reikia sąskaitos faktūros"** — 14px, #1A1A2E

When checked, the following fields expand below (smooth 0.3s slide-down):

**For BOTH fizinis and juridinis:**

- **"Sąskaitos el. paštas"** — text input, 48px
  - Helper: **"Įveskite, jeigu norite sąskaitą gauti kitu el. pašto adresu"** — 13px, #64748B
  - Optional — if left empty, invoice goes to the main email above
  - Placeholder: greyed-out main email address (visual hint that it defaults there)

**Fizinis / Juridinis toggle** (two radio buttons or small segmented control):
- **"Fizinis asmuo"** (default)
- **"Juridinis asmuo"**

**When "Juridinis asmuo" selected — additional fields expand below:**
- "Įmonės pavadinimas" — text input, 48px, required
- "Įmonės kodas" — text input, 48px, required
- "PVM mokėtojo kodas" — text input, 48px, optional
  - Helper: "Jei esate PVM mokėtojas" — 13px, #64748B

**Summary of what's visible at each state:**

| State | Visible fields |
|---|---|
| "Reikia sąskaitos" unchecked | Nothing extra |
| Checked + Fizinis asmuo | Sąskaitos el. paštas (optional) |
| Checked + Juridinis asmuo | Sąskaitos el. paštas (optional) + Įmonės pavadinimas + Įmonės kodas + PVM kodas (optional) |

---

## Back navigation preserves case

"Ne, ieškoti kito" → Screen 1 with same case toggle pre-selected (use in-memory state). All Screen 1 inputs preserved.

---

## What to remove

- ~~"KAINA NUO" label~~ — price is exact
- ~~"Standard" badge~~ — removed
- ~~Old EPC override card~~ — already removed
- ~~Old asymmetric layout~~ — replaced

## What NOT to change

- Proof card data content — untouched
- Payment functionality (Stripe) — untouched
- Backend endpoints — untouched

---

## Verification

1. Three cards: proof (top-left), blocks (top-right), payment (bottom spanning)
2. Content centered (max-width 1100px)
3. Blocks card subtitle changes by case
4. Block enabling matches case type
5. Price is exact (no "KAINA NUO")
6. "Reikia sąskaitos faktūros" checkbox — when checked, shows: sąskaitos el. paštas + Fizinis/Juridinis toggle
7. Sąskaitos el. paštas has helper "Įveskite, jeigu norite sąskaitą gauti kitu el. pašto adresu" — visible for BOTH fizinis and juridinis
8. "Juridinis asmuo" selected → additional company fields appear (pavadinimas, kodas, PVM)
9. "Fizinis asmuo" selected → no company fields, only optional email
10. "Ne, ieškoti kito" → Screen 1 with correct case pre-selected
11. Payment button disabled until required fields filled