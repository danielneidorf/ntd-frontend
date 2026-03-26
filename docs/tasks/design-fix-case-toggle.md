# Design Fix: Case Toggle — Make It Obviously Clickable

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-case-toggle.md
**Branch:** block1-e2e
**Scope:** Restyle the case type toggle bar so it's unmistakably interactive

---

## Problem

The toggle bar looks like a decorative label strip — three text labels inside one flat bordered box. Nothing signals "click me." The helper text "Pasirinkite, ką norite patikrinti" is small, muted, and below — easy to miss.

---

## Fix: Three separate button-like segments with clear affordances

### Replace the single flat bar with three visually distinct segments

Instead of one box with text labels, render **three separate rounded button-like elements** side by side with a small gap between them:

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  🏠 Pastatas /     │  │  🏗️ Naujas          │  │  🌿 Žemės           │
│     patalpos       │  │     projektas       │  │     sklypas         │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

### Unselected state (all three when no ?case= param)

```css
.case-toggle-segment {
  background: #FFFFFF;
  border: 2px solid #E2E8F0;          /* visible border */
  border-radius: 10px;
  padding: 14px 20px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.case-toggle-segment .label {
  font-size: 15px;
  font-weight: 500;
  color: #1A1A2E;
}

.case-toggle-segment .emoji {
  font-size: 20px;
  display: block;
  margin-bottom: 4px;
}
```

### Hover state (makes clickability obvious)

```css
.case-toggle-segment:hover {
  border-color: #0D7377;              /* teal border on hover */
  background: #E8F4F8;               /* subtle teal tint */
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

### Selected state

```css
.case-toggle-segment.selected {
  border-color: #0D7377;
  background: #E8F4F8;
  box-shadow: 0 0 0 1px #0D7377;     /* double-ring effect */
}

.case-toggle-segment.selected .label {
  font-weight: 600;
  color: #0D7377;                     /* teal text */
}
```

### Layout

- Three segments in a horizontal row with **8px gap** between them
- Each segment equal width (1/3 of the container)
- Height: ~64px (tall enough for emoji + label on two lines)
- Emoji on top, label text below (vertically stacked inside each segment)
- Full width of the content area (same as the grid below)

### Helper text — move INSIDE the toggle area, make it prominent

Remove the small muted helper text below. Instead, when no segment is selected, show a **prompt line above the three segments**:

**"Ką norite patikrinti?"** — 16px semibold, #1E3A5F (navy), left-aligned or centered above the segments.

This is essentially a sub-heading that frames the toggle as a question. Once a segment is selected, this line can fade to muted or stay — it's useful either way as context.

### No red text needed

The prompt "Ką norite patikrinti?" in navy semibold, combined with the visible button-like segments with hover states, makes the interaction obvious without resorting to red warning text. The disabled "Tęsti" button is the enforcement; the visual design is the guidance.

---

## What NOT to change

- Toggle functionality (click to select, state management) — untouched
- Pre-selection from `?case=` param — untouched
- "Tęsti" button disabled logic — untouched
- Layout below the toggle — untouched
- Backend — untouched

---

## Verification

1. Navigate to `/quickscan/` (no case param) — three visually distinct button-like segments visible
2. Hovering over any segment shows teal border + background tint + subtle lift — clearly interactive
3. "Ką norite patikrinti?" prompt visible above the segments
4. Clicking a segment selects it (teal highlight), deselects others
5. Navigate to `/quickscan/?case=existing_object` — first segment pre-selected in teal
6. The toggle feels like buttons, not like labels