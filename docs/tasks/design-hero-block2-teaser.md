# Design: Hero Report Preview — Add Block 2 Teaser Card

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Add a second, smaller card below the existing Block 1 report preview in the Hero right column

---

## Context

The Block 1 "Šiluminis komfortas" report preview card is implemented and working in the Hero right column. It looks good but feels small — the left column's text content is taller than the card, creating visual imbalance.

Fix: add a second, more compact card below it that previews a different data category (energy costs). This hints that the report contains more than just thermal comfort, without committing to the full block design. The two cards together should roughly match the left column's content height.

This card should animate in AFTER the Block 1 card finishes (continuing the staggered reveal sequence).

---

## What to build

A second card directly below the existing ReportPreview card (or appended inside the same wrapper). Smaller and simpler than Block 1 — this is a teaser, not a full preview.

### Card structure

1. **Title line:** "2) Energijos sąnaudos" (section heading, same style as Block 1 title but slightly smaller, ~16px semibold)

2. **Single key metric row:**
   - Left: "Šildymo kaina" label (muted, 13px)
   - Right: "~95 €/mėn." in navy semibold

3. **Second metric row:**
   - Left: "10 metų išlaidos" label (muted, 13px)
   - Right: "~48 000 €" in navy semibold

4. **Dimmed footer line:** "Ir dar 4 duomenų blokai..." in muted/slate text (13px), subtly communicating that the full report covers more

### Visual treatment

- Same white background, same border (#E2E8F0), same 8px rounded corners as Block 1 card
- BUT slightly reduced padding (16px instead of 20-24px) and no navy header bar — to visually differentiate it as a secondary/teaser element
- A thin top border accent in teal (#0D7377, 2px) instead of the full navy header — this creates visual continuity without duplicating the Block 1 header pattern
- Subtle left margin alignment with the Block 1 card above
- Gap between the two cards: 12px

### Animation

- Continue the stagger sequence from Block 1
- The Block 1 card's last element animates at ~2.0s
- Block 2 teaser card fades in at **2.4s** (same fade-in + translateY(8px→0) pattern, 0.5s duration)
- The "Ir dar 4 duomenų blokai..." line fades in at **2.8s**

### Sizing

- Same max-width as Block 1 card (~380px)
- This card should be noticeably shorter than Block 1 (roughly 40-50% of Block 1's height)
- Together, both cards should vertically span roughly the same height as the left column content

---

## What NOT to change

- The existing Block 1 report preview card — do not modify its content, styling, or animation timing
- Left column of Hero — untouched
- No new dependencies

---

## Verification

1. `npm run dev` — both cards visible, stagger animation plays smoothly with Block 2 appearing after Block 1
2. The two cards together should feel balanced against the left column text height
3. Block 2 teaser should feel lighter/secondary to Block 1 — a hint, not a full preview
4. Mobile: both cards hidden (existing mobile behavior preserved)