# Design: Four New Landing Page Sections

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Add four new sections between the situation cards and the pricing section

---

## Page flow after implementation

1. Hero (existing)
2. Property types marquee at bottom (existing)
3. Situation cards (existing)
4. **NEW — Section A: Mini-mockup grid** ("Ką gausite ataskaitoje")
5. **NEW — Section B: Stats strip**
6. **NEW — Section C: "Tai jums, jei..."**
7. **NEW — Section D: Comparison table**
8. Pricing section (existing)
9. Footer (existing)

All four new sections are inserted IN ORDER between the situation cards and the pricing section. Do NOT rearrange existing sections.

---

## Section A: Mini-Mockup Grid ("Ką gausite ataskaitoje")

### Purpose
Show all 8 report blocks as a static grid of mini-UI cards. Each card looks like a tiny fragment of the real report — not abstract icons, but data-like visuals. This complements the rotating hero carousel (which shows blocks one at a time) by letting visitors scan ALL 8 at a glance.

### Layout
- Section heading: **"Ką gausite ataskaitoje"** — 32px semibold, #1A1A2E, centered
- 4×2 grid (4 columns, 2 rows) on desktop
- 2×4 on tablet, 1×8 stacked on mobile
- Grid gap: 20px
- Max-width: 1200px container, centered
- Section padding: 80px top, 60px bottom

### Each mini-card structure

Each card represents one block and contains a **tiny mock visualization** that looks like real report data, not an icon.

**Card shell:**
- Background: #FFFFFF
- Border: 1px solid #E2E8F0
- Border-radius: 12px
- Padding: 24px
- Min-height: 200px
- Subtle shadow: 0 2px 12px rgba(0,0,0,0.04)
- Hover: translateY(-2px), shadow grows slightly

**Card content (top to bottom):**
1. Small emoji (24px) + block name (15px semibold, #1A1A2E) — on one line
2. **Mini-visualization area** (~80px height) — the "looks like real data" element
3. One-line insight (13px, #64748B) — what the buyer learns from this block

### Mini-visualizations per block (these should look like data fragments, not decorations)

**1) Šiluminis komfortas**
- Viz: Three horizontal bars labeled "Gerai / Vidutiniškai / Silpnai", middle one highlighted with teal left border (same pattern as hero carousel)
- Insight: "Žiemos ir vasaros komforto lygis"

**2) Energijos sąnaudos**
- Viz: Large number "~95 €" with small "/mėn." next to it, and a thin horizontal bar underneath showing a position marker (like a gauge)
- Insight: "Mėnesinė šildymo kaina pagal EPC"

**3) 10 metų išlaidos**
- Viz: Three stacked mini-rows: "Hipoteka 36 600 €" / "Energija 11 400 €" / "Kita 2 400 €" — each with a proportional thin colored bar (navy / teal / slate)
- Insight: "Pilna nuosavybės kaina per 10 metų"

**4) Oro ir vandens tarša**
- Viz: Three dots in a row: green dot + "Oras", green dot + "Vanduo", green dot + "Radonas" — like a status dashboard
- Insight: "Aplinkos kokybė pagal viešus duomenis"

**5) Triukšmo tarša**
- Viz: A simple horizontal scale with a marker at "52 dB", labels "Ramu" on left, "Triukšminga" on right
- Insight: "Dienos ir nakties triukšmo vertinimas"

**6) Kainos pagrįstumas**
- Viz: "−8 %" in large teal text + small text "vs. rinkos vidurkis" + a tiny bar comparing "Jūsų" (shorter, teal) vs "Rinka" (longer, slate)
- Insight: "Palyginimas su panašiais objektais"

**7) Teisinės rizikos**
- Viz: Three rows with green checkmarks: "✓ Areštai" / "✓ Servitutai" / "✓ Paveldas" — checklist style
- Insight: "Suvaržymai, hipotekos ir paveldas"

**8) Derybų strategija**
- Viz: "3 argumentai" in navy semibold + three short horizontal lines of decreasing length below (like a prioritized list)
- Insight: "Derybiniai taškai pagal blokų duomenis"

### Implementation notes for mini-visualizations
- These are pure HTML/CSS — tiny styled divs, not images or SVGs
- Use Tailwind utility classes for the bars, dots, checkmarks
- The visualizations don't need to be pixel-perfect replicas of the report — they just need to LOOK like data, not like marketing illustrations
- Keep each viz to ~3-5 HTML elements max

---

## Section B: Stats Strip

### Purpose
Compact horizontal row of 3-4 credibility numbers. Scannable in 2 seconds.

### Layout
- Full-width band with subtle background: #F0F4F8 (slightly darker than page #FAFBFC — creates a visual break)
- Content centered in 1200px container
- 4 stats in a horizontal row, evenly spaced
- Section padding: 48px top, 48px bottom
- On mobile: 2×2 grid

### Stats content

Each stat: large number (28px semibold, #1E3A5F) + label below (14px regular, #64748B)

| Number | Label |
|---|---|
| **6** | oficialių registrų šaltinių |
| **8** | duomenų blokai ataskaitoje |
| **<24 val.** | pristatymas el. paštu |
| **0,1 %** | pirkinio vertės |

### Styling
- No borders between stats — separation through spacing only
- Optionally, a thin vertical hairline (#E2E8F0) between each stat for structure
- Numbers and labels centered within each column

---

## Section C: "Tai jums, jei..."

### Purpose
Help visitors self-identify. A checklist of scenarios where NTD is the right tool. Builds confidence: "yes, this is exactly my situation."

### Layout
- Section heading: **"Tai jums, jei..."** — 32px semibold, #1A1A2E, centered
- Two-column layout: 4 items per column (8 total), or single column of 6–8 items
- Max-width: 900px (narrower than full grid — creates focus)
- Section padding: 80px top, 60px bottom

### Checklist items

Each item: teal checkmark (#0D7377) + text (16px regular, #1A1A2E)

1. ✓ Ketinate pirkti butą ar namą ir norite žinoti tikrąsias energijos sąnaudas
2. ✓ Žiūrite skelbimus ir norite greitai palyginti objektus
3. ✓ Norite patikrinti, ar kaina atitinka rinką — prieš derybas
4. ✓ Reikia nepriklausomų duomenų — ne iš brokerio ar pardavėjo
5. ✓ Svarstote naują projektą ir norite įvertinti būsimą komfortą
6. ✓ Nuomojate ir norite suprasti, ar nuomos kaina pagrįsta
7. ✓ Norite patikrinti teisines rizikas — areštus, servitutus, paveldą
8. ✓ Neturite laiko ar biudžeto pilnai ekspertizei, bet norite faktų

### Styling
- Each row: 12px gap between checkmark and text
- Row gap: 16px between items
- Checkmarks: teal circles (20px) with white ✓ inside, or simple teal ✓ characters
- Background: page default (#FAFBFC) — no distinct band
- Clean, scannable — no cards, no boxes, just the checklist

---

## Section D: Comparison Table

### Purpose
Crystallize why NTD is the right choice vs alternatives. Not aggressive "we're better" marketing — factual positioning.

### Layout
- Section heading: **"Kaip tai palyginti"** — 32px semibold, #1A1A2E, centered
- Centered table, max-width: 900px
- Section padding: 80px top, 80px bottom

### Table structure

4 columns × 5 rows:

| Kriterijus | NTD ataskaita | NT ekspertas / patikra | Tikrinti pačiam |
|---|---|---|---|
| **Kaina** | 79 € | 250–700 € | Nemokama |
| **Trukmė** | <24 val. | 3–5 d.d. | Valandos–dienos |
| **Vizitas vietoje** | Nereikalingas | Būtinas | — |
| **Duomenų šaltiniai** | 6 oficialūs registrai | Ekspertinis vertinimas | Portalai, EPC PDF |
| **Rezultatas** | PDF su 8 blokais | Rašytinė išvada | Fragmentiški duomenys |

### Styling

- White background card with 12px border-radius, subtle shadow (0 4px 20px rgba(0,0,0,0.06))
- Padding: 32px inside the card
- Header row: #F0F4F8 background, 14px medium, #1A1A2E
- **NTD column highlighted:** light teal tint (#E8F4F8) on the entire NTD column background, making it visually stand out without being aggressive
- "NTD ataskaita" column header: #0D7377 teal, semibold
- Cell text: 15px regular, #1A1A2E
- Cell padding: 16px vertical, 20px horizontal
- Row borders: 1px solid #E2E8F0 between rows
- On mobile: horizontal scroll or reformat as stacked cards per criterion

---

## Animation (all four sections)

Each section fades in when scrolled into view:
- Intersection Observer trigger
- fade-in + translateY(12px → 0), 0.5s ease-out
- For the mini-mockup grid: cards stagger (each card delays 50ms after the previous)
- For the checklist: items stagger (each item delays 60ms)
- Stats and table: single fade-in for the whole block

---

## What NOT to change

- Hero — untouched
- Property types marquee — untouched
- Situation cards — untouched
- Pricing section — untouched (these 4 new sections go ABOVE pricing)
- Footer — untouched
- No new npm dependencies

---

## Verification

1. `npm run dev` → scroll through the page: situation cards → mini-mockup grid → stats strip → "Tai jums, jei..." → comparison table → pricing
2. Mini-mockup cards have tiny data-like visualizations (bars, numbers, checkmarks, scales) — not icons
3. Stats strip shows 4 numbers in a horizontal row with distinct background band
4. Checklist has 8 scannable items with teal checkmarks
5. Comparison table has NTD column highlighted in light teal
6. All sections animate on scroll (fade-in)
7. Responsive: all sections work on mobile (grids collapse, table scrolls)
8. Overall page tells a complete story: what is it → what types → pick your path → what you get → the numbers → it's for you → how it compares → the price