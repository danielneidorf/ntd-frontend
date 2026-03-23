# Design: Property Types Bottom Marquee (Landing Page Only)

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** On the landing page only, replace the bottom sources ticker with a two-row property types marquee in the same visual style

---

## Context

Currently, every page has the same bottom ticker scrolling registry source names (NTR, PENS, Kadastras, etc.). We're splitting this:

- **Landing page (index.astro):** Bottom ticker becomes a two-row property types marquee — because the customer needs to see what types of property NTD can analyze
- **All other pages (/quickscan/, etc.):** Keep the existing sources ticker unchanged — because once they're in the flow, source credibility matters more

The marquee must **match the visual style** of the existing sources ticker exactly — same font, same size, same separator dots, same position, same background treatment. Just two rows instead of one, scrolling in opposite directions.

---

## What to change on the landing page

### Replace the bottom sources ticker component with the property types marquee

The existing sources ticker is likely a component rendered at the bottom of the page (fixed or flow-positioned). On the landing page only, swap it for the marquee component.

**Implementation approach:** The simplest way is to conditionally render different bottom ticker content based on the page. Either:
- Pass a prop to the ticker component (e.g. `variant="property-types"` vs `variant="sources"`)
- Or render different components in index.astro vs other pages

### Two-row marquee content

Use the **exact same text styling** as the existing sources ticker: same font size, same color, same " · " separator between items.

**Row 1 — scrolls right → left:**

Namai · Kotedžai · Dvibučiai · Sublokuoti namai · Sodų namai · Butai · Daugiabučiai · Bendrabučiai · Loftai · Studijos · Biurai · Ofisai · Administracinės patalpos · Mokyklos · Darželiai · Universitetai · Kolegijos · Gimnazijos · Mokslo patalpos · Klinikos · Poliklinikos · Gydymo patalpos · Restoranai · Kavinės · Maitinimo patalpos · Parduotuvės · Prekybos centrai · Prekybos patalpos · Sporto salės · Arenos

**Row 2 — scrolls left → right:**

Sporto patalpos · Baseinai · Teatrai · Muziejai · Bibliotekos · Kultūros patalpos · Garažai · Gamyklos · Cechai · Industrinės patalpos · Sandėliai · Logistikos centrai · Sandėliavimo patalpos · Viešbučiai · Svečių namai · Apgyvendinimo patalpos · Paslaugų patalpos · Salonai · Stotys · Terminalai · Transporto patalpos · Poilsio namai · Sanatorijos · Poilsio patalpos · Specialiosios patalpos · Nauji projektai · Komercinės patalpos · Žemės sklypai · Sodų sklypai · Parkavimo vietos · Parkavimo aikštelės

### Visual style (match existing sources ticker exactly)

- Same font size as the current sources ticker
- Same text color as the current sources ticker
- Same " · " dot separator between items
- Same background/overlay treatment (gradient fade at edges, background color, etc.)
- Same position (bottom of page, same height allocation — but doubled for two rows)
- Row 1 scrolls right-to-left, Row 2 scrolls left-to-right (counter-direction)
- Same scroll speed as the current sources ticker
- Same CSS animation technique (translateX keyframes on duplicated content)

### Spacing between the two rows

- Minimal gap: 4–6px between row 1 and row 2
- The total height of the two-row marquee should be roughly 2× the current single-row ticker height

---

## What to change on other pages

**Nothing.** The existing sources ticker on /quickscan/ and any other pages remains exactly as-is.

---

## Gap between hero and situation cards

With the marquee moved to the bottom, the space between hero and "Kokia jūsų situacija?" may look empty. **Reduce the spacing between the hero section and the situation cards section** — tighten the gap so the two sections feel connected. Aim for ~60–80px vertical gap instead of the current large gap.

---

## What NOT to change

- Sources ticker on /quickscan/ and all non-landing pages — untouched
- Hero section — untouched
- "Kokia jūsų situacija?" section — untouched
- Pricing, Footer — untouched

---

## Verification

1. `npm run dev` → landing page: bottom shows two-row property types marquee (not sources)
2. Navigate to /quickscan/ → bottom shows the original sources ticker (not property types)
3. The two marquee rows look identical in style to the sources ticker — same font, color, separators
4. Row 1 scrolls right-to-left, Row 2 scrolls left-to-right
5. Gap between hero and situation cards is tighter than before
6. All 59 property type names present across the two rows