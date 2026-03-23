# Design: Situation Cards Section ("Kokia jūsų situacija?")

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Add a new section below the Hero with three situation-based entry cards that pre-select the case type in the QuickScan flow

---

## Context

Currently visitors must click "Gauti ataskaitą" and then choose their case type on Screen 1. We're surfacing this choice earlier — on the landing page itself, right below the hero — as three visually distinct situation cards. Each card describes a scenario the visitor is in, with a one-sentence hook and a direct CTA that links to `/quickscan/` with a query parameter pre-selecting the case type.

This maps to the three `evaluation_target` values already in the QuickScan flow: `existing_object`, `new_build_project`, `land_only`.

---

## Placement

**Insert a new section between the Hero and the next section** (currently the HowItWorks strip "01 · Įveskite adresą → 02 · ..."). The new section should have its own vertical spacing consistent with the page's section gaps.

Do NOT move or modify the Hero, HowItWorks, Pricing, or Footer sections.

---

## Section structure

### Section heading

"Kokia jūsų situacija?" — 28px semibold, #1A1A2E, centered. Below it a one-line subheading in muted slate (#64748B, 16px): "Pasirinkite, ir sistema pritaikys paiešką jūsų atvejui."

### Three cards in a horizontal row (3-column grid on desktop)

Each card is a clickable block (`<a>` wrapping the card) that links to `/quickscan/?case=<value>`.

**Card 1 — Esamas objektas**
- Icon/emoji area: 🏠 (or a simple SVG house icon, ~32px)
- Title: "Esamą pastatą ar patalpas" (18px semibold, #1A1A2E)
- Description: "Butas, namas ar komercinės patalpos, kurios jau matomos registruose. Patikrinsime oficialius duomenis ir pateiksime įžvalgas." (14px regular, #64748B)
- CTA text at bottom: "Patikrinti →" in teal (#0D7377, 14px medium)
- Link: `/quickscan/?case=existing_object`

**Card 2 — Naujas projektas**
- Icon/emoji area: 🏗️ (or construction/crane SVG icon)
- Title: "Naujai statomą ar baigtą projektą" (18px semibold, #1A1A2E)
- Description: "Naujas projektas, kuris dar nematomas registruose. Sistema sujungs sklypo ir projekto duomenis." (14px regular, #64748B)
- CTA text at bottom: "Patikrinti →" in teal (#0D7377, 14px medium)
- Link: `/quickscan/?case=new_build_project`

**Card 3 — Žemės sklypas**
- Icon/emoji area: 🌿 (or land/plot SVG icon)
- Title: "Tik žemės sklypą" (18px semibold, #1A1A2E)
- Description: "Tuščias sklypas arba sklypas be šildomų pastatų. Aplinkos, teisiniai ir kainos duomenys." (14px regular, #64748B)
- CTA text at bottom: "Patikrinti →" in teal (#0D7377, 14px medium)
- Link: `/quickscan/?case=land_only`

### Card styling

- White background (#FFFFFF)
- Border: 1px solid #E2E8F0
- Border-radius: 8px
- Padding: 24px
- Hover state: subtle lift (translateY(-2px)), shadow increase (0 8px 24px rgba(0,0,0,0.08)), teal top border appears (2px solid #0D7377)
- Transition: 0.2s ease
- Cards should be equal height (use CSS grid with `align-items: stretch`)
- Gap between cards: 24px

### Responsive

- Desktop (≥1024px): 3 columns side by side
- Tablet (768–1023px): 3 columns but narrower
- Mobile (<768px): single column stack, full width

### Animation

- Section fades in when scrolled into view (Intersection Observer, same pattern as other landing page sections)
- Cards stagger: card 1 at 0s, card 2 at 0.1s, card 3 at 0.2s (relative to section becoming visible)
- Same fade-in + translateY(8px→0) pattern, 0.4s ease-out

---

## Section background

- Use the page's standard off-white (#FAFBFC) background
- Section vertical padding: 80px top, 80px bottom (consistent with existing section spacing)
- Max-width 1200px container, centered

---

## Query parameter handling (NOT part of this brief)

The `/quickscan/` page will eventually need to read `?case=existing_object` and pre-select the corresponding card on Screen 1. This is a separate task — for now, just generate the correct URLs. The links work as navigation even without the query parameter being consumed yet.

---

## What NOT to change

- Hero section — untouched (rotating carousel, copy, CTA)
- HowItWorks strip — untouched (just pushed down by the new section)
- Pricing section — untouched
- Footer — untouched
- QuickScan flow (/quickscan/) — untouched
- No new npm dependencies

---

## Verification

1. `npm run dev` — new section visible below hero, above HowItWorks/pricing
2. Three cards side by side on desktop, stacked on mobile
3. Hovering a card shows subtle lift + teal top border
4. Clicking a card navigates to `/quickscan/?case=<value>`
5. Section heading "Kokia jūsų situacija?" is centered and readable
6. Cards are equal height regardless of description length
7. Scroll-triggered fade-in animation works