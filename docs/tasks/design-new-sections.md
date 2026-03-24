# Design: Two New Landing Page Sections

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-new-sections.md
**Branch:** block1-e2e
**Scope:** Add two new sections and reorder one existing section on the landing page

---

## Page flow after implementation

1. Hero (existing — "why" scenarios carousel per design-carousel-swap.md)
2. Property types marquee at bottom (existing)
3. **NEW — Section A: Mini-mockup grid** ("Ką gausite ataskaitoje")
4. Situation cards (existing — MOVES DOWN, after mini-mockups)
5. **NEW — Section B: Comparison cards** ("Kaip tai palyginti")
6. Pricing section (existing — report carousel per design-carousel-swap.md)
7. Footer (existing)

**Key change:** The existing situation cards section moves below the new mini-mockup grid.

**NOTE:** The "Tai jums, jei..." checklist is NOT built as a standalone section — it has been absorbed into the hero's "why" scenarios carousel (see design-carousel-swap.md).

---

## Section A: Mini-Mockup Grid ("Ką gausite ataskaitoje")

### Layout
- Heading: **"Ką gausite ataskaitoje"** — 32px semibold, #1A1A2E, centered
- 4×2 grid (4 columns, 2 rows) on desktop
- 2×4 on tablet, 1×8 stacked on mobile
- Grid gap: 20px
- Max-width: 1200px container, centered
- Section padding: 80px top, 60px bottom

### Each mini-card

**Card shell:**
- Background: #FFFFFF
- Border: 1px solid #E2E8F0
- Border-radius: 12px
- Padding: 24px
- Min-height: 200px
- Shadow: 0 2px 12px rgba(0,0,0,0.04)
- Hover: translateY(-2px), shadow grows

**Card content:**
1. Small emoji (24px) + block name (15px semibold, #1A1A2E) — one line
2. Mini-visualization area (~80px) — data-like HTML/CSS element
3. One-line insight (13px, #64748B)

### Mini-visualizations

**1) 🌡️ Šiluminis komfortas**
- Viz: Three bars "Gerai / Vidutiniškai / Silpnai", middle highlighted with teal left border
- Insight: "Žiemos ir vasaros komforto lygis"

**2) ⚡ Energijos sąnaudos**
- Viz: Large "~95 €" with "/mėn.", thin gauge bar below
- Insight: "Mėnesinė šildymo kaina pagal EPC"

**3) 📊 10 metų išlaidos**
- Viz: Three stacked rows: "Hipoteka 36 600 €" / "Energija 11 400 €" / "Kita 2 400 €" with proportional colored bars (navy / teal / slate)
- Insight: "Pilna nuosavybės kaina per 10 metų"

**4) 🌿 Oro ir vandens tarša**
- Viz: Three green dots: "Oras", "Vanduo", "Radonas"
- Insight: "Aplinkos kokybė pagal viešus duomenis"

**5) 🔇 Triukšmo tarša**
- Viz: Horizontal scale, marker at "52 dB", "Ramu" left / "Triukšminga" right
- Insight: "Dienos ir nakties triukšmo vertinimas"

**6) 💰 Kainos pagrįstumas**
- Viz: "−8 %" in teal + tiny "Jūsų" vs "Rinka" bar comparison
- Insight: "Palyginimas su panašiais objektais"

**7) ⚖️ Teisinės rizikos**
- Viz: Three checkmarks: "✓ Areštai / ✓ Servitutai / ✓ Paveldas"
- Insight: "Suvaržymai, hipotekos ir paveldas"

**8) 🎯 Derybų strategija**
- Viz: "3 argumentai" in navy + three decreasing-length bars
- Insight: "Derybiniai taškai pagal blokų duomenis"

### Implementation
- Pure HTML/CSS — styled divs, not images
- Tailwind classes for bars, dots, checkmarks
- 3-5 HTML elements per viz max

---

## Section B: Comparison Cards ("Kaip tai palyginti")

### Layout
- Heading: **"Kaip tai palyginti"** — 32px semibold, #1A1A2E, centered
- 3-column grid, equal width cards
- Grid gap: 24px
- Max-width: 1100px, centered
- Section padding: 80px top, 80px bottom
- Mobile: stacked single column

### Card 1 — NTD ataskaita (HIGHLIGHTED)

**Visual treatment — stands out:**
- Background: #FFFFFF
- Border: **2px solid #0D7377** (teal, thicker)
- Top accent: **4px solid #0D7377** teal bar at top edge
- Shadow: **0 8px 32px rgba(13, 115, 119, 0.12)** (teal-tinted, prominent)
- Badge at top: **"Rekomenduojama"** — 11px uppercase, white on #0D7377 teal, pill-shaped

**Content:**
- Title: **"NTD ataskaita"** — 20px semibold, #0D7377
- Divider: 1px #E2E8F0
- **Kaina:** "79 €" — 28px semibold, #1E3A5F
- **Trukmė:** "<1 val." — 16px regular, #1A1A2E
- **Vizitas:** "Nereikalingas" — 16px regular, #1A1A2E
- **Šaltiniai:** "6 oficialūs registrai" — 16px regular, #1A1A2E
- **Rezultatas:** "PDF su duomenų blokais" — 16px regular, #1A1A2E
- Divider: 1px #E2E8F0
- CTA: **"Užsakyti ataskaitą"** — navy button, full width, 14px medium, padding 12px, border-radius 8px

### Card 2 — Ekspertinis patikrinimas (neutral)

- Border: 1px solid #E2E8F0
- Shadow: 0 2px 12px rgba(0,0,0,0.04)
- No badge, no accent
- Title: **"Ekspertinis patikrinimas"** — 20px semibold, #1A1A2E
- **Kaina:** "250–700 €"
- **Trukmė:** "3–5 darbo dienos"
- **Vizitas:** "Būtinas"
- **Šaltiniai:** "Ekspertinis vertinimas"
- **Rezultatas:** "Rašytinė išvada"
- No CTA button

### Card 3 — Tikrinti pačiam (neutral)

- Same styling as Card 2
- Title: **"Tikrinti pačiam"** — 20px semibold, #1A1A2E
- **Kaina:** "Nemokama"
- **Trukmė:** "Valandos–dienos"
- **Vizitas:** "—" (#64748B)
- **Šaltiniai:** "Portalai, EPC PDF"
- **Rezultatas:** "Fragmentiški duomenys"
- No CTA button

### Card shared styling

- Border-radius: 16px
- Padding: 32px
- Each data row: small label (12px uppercase, #64748B, tracking 0.05em: "KAINA", "TRUKMĖ", "VIZITAS", "ŠALTINIAI", "REZULTATAS") + value below
- Row spacing: 20px between label+value pairs
- Cards equal height (flex/grid stretch)
- Hover on Card 1 only: translateY(-3px), shadow grows

---

## Animation (both sections)

Each section fades in on scroll (Intersection Observer):
- fade-in + translateY(12px → 0), 0.5s ease-out
- Mini-mockup grid: cards stagger 50ms each
- Comparison cards: single fade-in

---

## What NOT to change

- Hero — untouched (carousel swap is a separate brief)
- Property types marquee — untouched
- Situation cards content/styling — untouched (only position moves)
- Pricing section — untouched (carousel move is a separate brief)
- Footer — untouched
- No new npm dependencies

---

## Verification

1. Page flow: hero → marquee → **mini-mockups** → situation cards → **comparison cards** → pricing
2. Situation cards appear AFTER the mini-mockup grid
3. Mini-mockup cards have data-like HTML/CSS visualizations
4. Three comparison cards float side by side — NTD highlighted with teal border, badge, and CTA
5. **No "Tai jums, jei..." standalone section exists**
6. All sections animate on scroll
7. Responsive on mobile