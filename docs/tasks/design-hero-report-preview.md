> ⚠️ SUPERSEDED by design-carousel-swap.md. Do not implement this version.

# Design: Hero Report Preview Animation

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Replace the right column of Hero.astro with an animated QuickScan report preview card

---

## Context

The Hero section is a two-column layout. Left side has the headline, value story, input field, and "Gauti įžvalgas" CTA. Right side currently has a static "data blocks preview." We're replacing the right side with an animated card that simulates a QuickScan report fragment — giving visitors an instant mental model of what they'll receive for €79.

This is a **visual-only** change. No backend calls, no real data, no interactive elements. Pure CSS animation with hardcoded Lithuanian content.

**Design system (non-negotiable):**
- Font: Inter (already configured in Tailwind)
- Primary: #1E3A5F (deep navy)
- Secondary: #0D7377 (teal)
- Background: #FAFBFC
- Surface: #FFFFFF
- Text: #1A1A2E
- Muted: #64748B
- Success: #059669
- Border: #E2E8F0
- Accent surface: #E8F4F8

**Aesthetic direction:** Institutional, library-like, data-first. NOT playful/startup. Think Stuttgart Library meets a financial data terminal. Clean lines, confident spacing, subtle motion. The animation should feel like data arriving from official registries — methodical, precise, authoritative — not bouncy or whimsical.

---

## What to build

A single Astro component `ReportPreview.astro` (or inline in Hero.astro if simpler) that renders a card styled like a fragment of the actual QuickScan report. The card animates on page load with staggered reveals — elements appear one by one as if data is being assembled from registries.

### Card structure (top to bottom)

1. **Header bar** — slim, navy (#1E3A5F) background, white text:
   - Left: "NTD" (small logo text)
   - Right: "Vilnius, Žirmūnų g. 12" (example address, muted)

2. **Title line** — appears first in the animation:
   - "1) Šiluminis komfortas" (section heading, ~20px semibold)

3. **Two-column metrics block** — appears second, staggered left then right:
   - Left card: "Žiemos komfortas" label, then a 3-row mini-table:
     - "Gerai" (dimmed)
     - "Vidutiniškai" (highlighted row — light blue background #E8F4F8, left teal border)
     - "Silpnai" (dimmed)
   - Right card: "Vasaros perkaitimas" label, then:
     - "Maža" (dimmed)
     - "Vidutinė" (highlighted, same style)
     - "Didelė" (dimmed)

4. **Key data line** — appears third:
   - "Energijos klasė: B" with a small teal badge
   - "~125 kWh/m² per metus" next to it, muted

5. **Bottom summary line** — appears last:
   - A subtle #E8F4F8 background strip with:
   - "Vertinimas pagal 6 oficialių registrų duomenis" in small muted text

### Animation behavior

- **Trigger:** on page load (CSS `animation-delay`, no JS needed)
- **Style:** fade-in + slight translateY(8px → 0) for each element
- **Timing:**
  - Card container: appears at 0.3s (fade in, subtle shadow grows)
  - Header bar: 0.5s
  - Title: 0.8s
  - Left metric card: 1.1s
  - Right metric card: 1.4s
  - Key data line: 1.7s
  - Bottom summary: 2.0s
- **Duration per element:** 0.5s ease-out
- **After all elements visible:** card stays static. No looping, no continuous animation.
- Optional subtle floating effect on the whole card: very gentle `translateY` oscillation (2px, 6s cycle) — only if it doesn't feel playful. Skip if uncertain.

### Sizing and placement

- Card max-width: ~380px (should not exceed the right column width)
- Card has: white background, subtle border (#E2E8F0), rounded corners (8px), light shadow (0 4px 24px rgba(0,0,0,0.08))
- Card should be vertically centered in the right column
- On mobile (< 768px): hide the card entirely or show it below the hero text at reduced size. Don't let it compete with the CTA on small screens.

---

## Implementation notes

- Use Tailwind classes where possible, `@keyframes` in a `<style>` block for the stagger animation
- All text is hardcoded Lithuanian — this is a visual mock, not dynamic
- The highlighted rows in the metric tables should use the same visual pattern as the actual report: light blue background with a left teal border accent
- Do NOT import any animation libraries. CSS only.
- Inter font is already available via Tailwind config

---

## What NOT to change

- Left column of Hero (headline, value story, input field, CTA) — untouched
- Header.astro — untouched
- Any other landing page sections — untouched
- No new npm dependencies

---

## Verification

After implementation:
1. `npm run dev` and check localhost — the hero right side should show the animated report card
2. The animation should feel calm and methodical, like data assembling — not flashy
3. Mobile responsive: card hidden or gracefully stacked below hero text
4. All existing pages still work (index, /quickscan/)