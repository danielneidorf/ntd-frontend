> ⚠️ SUPERSEDED by design-carousel-swap.md. Do not implement this version.

# Design: Hero — Rotating Block Carousel (All 8 Blocks)

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Replace the entire Hero right column (Block 1 preview + Block 2 teaser) with a single auto-cycling card that rotates through all 8 QuickScan blocks

---

## Context

Currently the Hero right column has a static Block 1 preview card and a Block 2 teaser below it. We're replacing both with a single card that auto-cycles through all 8 data blocks. Each slide shows one block with enough detail (title, key metric, one-line description) to communicate real value. The continuous rotation creates a "this report covers everything" impression.

All 8 blocks are equally valuable — no block gets special treatment.

---

## What to build

Remove the existing Block 1 preview card (`ReportPreview` or equivalent) and the Block 2 teaser. Replace with a single new component.

### Card structure (shared frame, content rotates)

**Persistent header bar** (always visible, does not rotate):
- Navy (#1E3A5F) background, white text
- Left: "NTD"
- Right: "Vilnius, Žirmūnų g. 12" (muted white)

**Rotating content area** — slides horizontally between blocks. Each slide contains:

1. **Block number + title** — e.g. "1) Šiluminis komfortas" (18px semibold, #1A1A2E)
2. **Key metric** — the headline number/value, large and prominent (24px semibold, #1E3A5F navy)
3. **One-line description** — what this block tells the buyer (14px regular, #64748B muted)
4. **Optional second data point** — a supporting detail (14px, #0D7377 teal)

**Persistent footer** (always visible, does not rotate):
- 8 dot indicators showing current position
- Active dot: #0D7377 teal, filled, slightly larger (8px)
- Inactive dots: #E2E8F0, 6px
- Dots are clickable (manual navigation)

### Slide content for each block

**Slide 1 — Šiluminis komfortas**
- Metric: "Vidutiniškai" (with a teal left-border highlight, like the current preview)
- Description: "Žiemos šildymo poreikis ~10–30 % didesnis nei etalone"
- Supporting: "Vasaros perkaitimas: vidutinė rizika"

**Slide 2 — Energijos sąnaudos**
- Metric: "~95 €/mėn."
- Description: "Šildymo ir karšto vandens kaina pagal EPC ir plotą"
- Supporting: "Energijos klasė: B"

**Slide 3 — 10 metų išlaidos**
- Metric: "~48 000 €"
- Description: "Hipoteka + energija + administravimas per 10 metų"
- Supporting: "Iš jų energija: ~11 400 €"

**Slide 4 — Oro ir vandens tarša**
- Metric: "Kokybė: gera"
- Description: "Oro tarša, vanduo ir aplinkos rizikos pagal viešus duomenis"
- Supporting: "Radonas: žemas lygis"

**Slide 5 — Triukšmo tarša**
- Metric: "52 dB — vidutinis"
- Description: "Kelių, geležinkelio ir pramonės triukšmo vertinimas"
- Supporting: "Naktinis triukšmas: 44 dB"

**Slide 6 — Kainos pagrįstumas**
- Metric: "−8 % vs. rinka"
- Description: "Palyginimas su 3 panašiais neseniai parduotais objektais"
- Supporting: "Kaina per m²: 1 850 €"

**Slide 7 — Teisinės rizikos**
- Metric: "Areštų: nėra ✓"
- Description: "Suvaržymai, paveldas, servitutai ir kitos teisinės rizikos"
- Supporting: "Bendrija: rezervas pakankamas"

**Slide 8 — Derybų strategija**
- Metric: "3 argumentai"
- Description: "Siūloma kaina ir derybiniai taškai pagal blokų duomenis"
- Supporting: "Rekomenduojama: −5 % nuo pradinės"

### Animation and cycling behavior

- **Initial entrance:** The card fades in at 0.5s after page load (same fade-in + translateY(8px→0) as before, 0.5s duration). First slide (Block 1) is immediately visible.
- **Auto-cycle:** Every **3.5 seconds**, the content area slides left to reveal the next block. Horizontal slide transition, 0.4s ease-in-out.
- **Loop:** After slide 8, wraps back to slide 1 seamlessly.
- **Pause on hover:** When the user hovers over the card, auto-cycling pauses. Resumes when mouse leaves.
- **Dot click:** Clicking a dot jumps to that slide immediately and resets the auto-cycle timer.
- **No swipe/drag** needed for desktop (keep it simple).

### Slide transition style

- Horizontal slide (translateX), not fade. This feels like flipping through pages of a report.
- Content area has `overflow: hidden` so only one slide is visible at a time.
- The persistent header and footer stay fixed; only the middle content area moves.

### Sizing

- Card max-width: ~400px (slightly wider than the old Block 1 card to give each slide breathing room)
- Card height: fixed at ~280px (header ~44px + content area ~200px + footer dots ~36px). Fixed height prevents layout jumps during transitions.
- White background, border (#E2E8F0), 8px rounded corners, subtle shadow (0 4px 24px rgba(0,0,0,0.08))
- Vertically centered in the right column

### Mobile (< 768px)

- Hide the card entirely (preserve existing pattern)
- We'll address mobile report preview in a future design increment

---

## Implementation notes

- This needs a small amount of JavaScript for the auto-cycling and dot navigation. Implement as an Astro component with `client:load` (it needs to be interactive immediately).
- Use CSS `transform: translateX()` for the slide transitions, not JS-driven positioning.
- Keep the JS minimal: a `setInterval` for auto-advance, `mouseenter`/`mouseleave` for pause, click handlers for dots.
- All text is hardcoded Lithuanian — this is a visual mock.
- Do NOT use any carousel/slider library. Vanilla JS + CSS transitions.

---

## What to remove

- The entire existing Block 1 `ReportPreview` card (or component)
- The Block 2 teaser card
- All associated animation CSS for the old staggered reveal

---

## What NOT to change

- Left column of Hero (headline, value story, CTA) — untouched
- Header.astro — untouched
- Other landing page sections — untouched
- No new npm dependencies

---

## Verification

1. `npm run dev` — hero right column shows the rotating card
2. Card auto-cycles through all 8 blocks every 3.5s with smooth horizontal slide
3. Hover pauses the cycling; mouse leave resumes
4. Dot indicators update correctly; clicking a dot jumps to that slide
5. First slide appears with initial fade-in animation on page load
6. No layout jumps — card height is consistent across all slides
7. Mobile: card hidden
8. The overall impression is "this report gives you a LOT of data"