# Design Fix: New-Build Vieta Screen — Two-Column Layout

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-newbuild-two-column.md
**Branch:** block1-e2e
**Scope:** Rearrange the new_build_project Vieta screen into a two-column layout with equal width and height; fix project card styling

---

## Problem

On `/quickscan/?case=new_build_project`, all cards are stacked vertically in a single left-aligned column. The entire right side of the screen is empty — wasted space. The project info card also uses old styling.

---

## Fix: Two-column layout — equal width AND equal height

### Structure

**Two columns, equal width and equal height, centered within the 1200px container:**

| Left column — "Vieta" | Right column — "Projekto duomenys" |
|---|---|
| Address card | Project info card |
| NTR expander | (fills to match left column height) |
| Map card | |

### Equal height requirement — CRITICAL

Both columns MUST be the same height. Use CSS grid with `align-items: stretch`:

```css
.vieta-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: stretch;  /* BOTH columns same height */
  max-width: 1200px;
  margin: 0 auto;
}
```

The right column (project card) stretches to match the left column's height. The project card's content is top-aligned inside, with the remaining space as natural whitespace at the bottom of the card. This makes both columns feel like two equal visual blocks sitting side by side.

- On mobile (<768px): single column (`grid-template-columns: 1fr`), project card below location cards
- Centered on screen

### Page title

Keep: **"Nurodykite projekto ar sklypo vietą"** — spans full width above both columns.

### Left column content (location)

The three existing location cards, exactly as they appear now (with updated styling):

1. **Address card** — "Ieškoti pagal adresą" with input + helper
2. **NTR expander** — "Turite unikalų numerį? →"
3. **Map card** — "Ieškoti ir pasirinkti žemėlapyje"

These are stacked vertically inside the left column wrapper.

### Right column content (project info)

One single card that fills the entire right column height:

**Card wrapper:**
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
height: 100%;              /* fill the column height */
display: flex;
flex-direction: column;
```

**Card title:** **"Projekto duomenys"** — 18px semibold, #1A1A2E

**Subtitle:** "Pasirinktinai — padės tiksliau įvertinti projektą." — 14px regular, #64748B

**Inside the card (top to bottom):**

1. **Projekto ar skelbimo nuoroda**
   - Label: 15px medium, #1A1A2E
   - Input: height 48px, font 16px, border-radius 8px
   - Helper: "Projekto puslapis, kūrėjo svetainė ar skelbimas portale (Aruodas.lt, Domoplius.lt ir kt.)" — 14px, #64748B
   - Placeholder: "pvz., https://..."

2. **Gap: 20px**

3. **Įkelti projekto dokumentą (PDF)**
   - Label: 15px medium, #1A1A2E
   - Upload area: solid 1px #E2E8F0, border-radius 8px, min-height 48px
   - Helper: "Techninis projektas, pasiūlymas ar bukletas. Nebūtina." — 14px, #64748B

Content is top-aligned. The card stretches to match the left column — any extra space is natural whitespace at the bottom of the card.

### "Tęsti" button

Below both columns, centered or left-aligned. Same styling as existing_object case.

---

## Only applies to `?case=new_build_project`

The `existing_object` and `land_only` cases keep their current single-column layout.

---

## What NOT to change

- Location cards content and functionality — untouched
- Project card content (URL field, PDF upload) — untouched
- existing_object and land_only Vieta screens — untouched
- "Tęsti" button functionality — untouched
- Backend — untouched

---

## Verification

1. Navigate to `/quickscan/?case=new_build_project`
2. Two-column layout: location cards on left, project card on right
3. **Both columns are the same height** — the project card stretches to match the left column
4. **Both columns are equal width** — 1fr 1fr grid
5. Layout is centered on screen
6. Project card styling matches location cards (same border, shadow, radius, text sizes)
7. Input fields in project card are 48px / 16px (matching location cards)
8. On mobile: single column, project card below location cards
9. `/quickscan/?case=existing_object` unchanged (single column)