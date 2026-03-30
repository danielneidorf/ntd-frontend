> ⚠️ SUPERSEDED by feature-unified-vieta-screen.md. Do not implement this version.

# Design Fix: Existing Object Vieta Screen — Two-Column Layout

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-existing-two-column.md
**Branch:** block1-e2e
**Scope:** Move "Skelbimo nuoroda" card to the right column on the existing_object Vieta screen

---

## Problem

On `/quickscan/?case=existing_object`, all four location cards are stacked vertically in a single left-aligned column. The entire right side of the screen is empty.

---

## Fix: Two-column layout

### Structure

Same grid pattern as the new_build_project layout:

```css
.vieta-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: stretch;  /* both columns same height */
  max-width: 1200px;
  margin: 0 auto;
}
```

| Left column — Location methods | Right column — Skelbimo nuoroda |
|---|---|
| Address card ("Ieškoti pagal adresą") | Listing URL card |
| NTR card ("Unikalus numeris") | |
| Map card ("Ieškoti ir pasirinkti žemėlapyje") | |

- Both columns equal width and equal height (`align-items: stretch`)
- Right column's card stretches to fill the full height, top-aligned with the address card
- On mobile (<768px): single column, listing URL card below location cards

### Left column

The three location cards, stacked vertically:
1. Address card
2. NTR card (always visible, with "Kur rasti?" link)
3. Map card

No changes to these cards' content or styling.

### Right column — Skelbimo nuoroda card

The listing URL card, stretched to match the left column's full height:

**Card styling** — matches location cards:
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
display: flex;
flex-direction: column;
```

**Card title:** **"Skelbimo nuoroda"** — 18px semibold, #1A1A2E

**Input field:** height 48px, font 16px, border-radius 8px
- Placeholder: "pvz., https://www.aruodas.lt/..."

**Helper text:** "Aruodas.lt, Domoplius.lt ir kt. — sistema pati identifikuos objektą." — 14px, #64748B

Since the card stretches to the full column height (matching the 3 stacked cards on the left), it will have extra vertical space. Let the content stay at the top (default flex behavior) — the empty space below is fine and makes the card feel spacious.

### "Tęsti" button

Below both columns, same as current.

---

## Also applies to `?case=land_only`

The land_only case currently has the same 4 cards (address, NTR, map, listing URL). Apply the same two-column layout: location cards left, listing URL right.

---

## What NOT to change

- Card content and functionality — untouched
- new_build_project layout — untouched (it has its own two-column brief with project card on the right)
- "Tęsti" button — untouched
- Backend — untouched

---

## Verification

1. `/quickscan/?case=existing_object` — two-column layout: 3 location cards left, listing URL card right
2. Both columns equal width and equal height
3. Listing URL card is top-aligned with the address card
4. Listing URL card stretches to fill the full right column height
5. `/quickscan/?case=land_only` — same two-column layout
6. `/quickscan/?case=new_build_project` — untouched (already has its own two-column layout with project card)
7. Mobile: single column, listing URL below location cards