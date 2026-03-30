> ⚠️ SUPERSEDED by design-fix-vieta-tabs.md. Do not implement this version.

# Design Fix: Right Column Card — Better Content Distribution

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-right-column-spacing.md
**Branch:** block1-e2e
**Scope:** Fix the cramped content distribution in the "Nuoroda ar dokumentas" right column card

---

## Problem

The right column card stretches to match the left column's height (correct), but all the content is packed at the top with a large empty space at the bottom. The URL field, helper text, PDF upload, and its helper are clustered tightly together, making the top feel cramped while the bottom half is wasted.

---

## Fix: Distribute content evenly within the card

The card already uses `display: flex; flex-direction: column;`. Now make it distribute the space:

### Increase internal spacing

- Card padding: increase to **32px** (from 24px)
- Gap between the URL section and the PDF section: increase to **32px** (from ~20px)
- Gap between card title/subtitle and the first field: **24px**

### Make the PDF upload area taller

The PDF drop zone should fill the available remaining space, becoming a proper large drop target:

```css
.pdf-upload-area {
  flex-grow: 1;          /* absorbs remaining vertical space */
  min-height: 120px;     /* never shorter than this */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #E2E8F0;  /* dashed border for drop zone feel */
  border-radius: 8px;
  background: #FAFBFC;
}
```

This turns the PDF upload from a thin single-line input into a generous drag-and-drop area that fills the bottom portion of the card. The centered "Pasirinkite PDF failą arba nutempkite čia" text sits in the middle of this area.

### Content layout within the card

```
┌──────────────────────────────┐
│ Nuoroda ar dokumentas        │  ← title (18px semibold)
│ Pasirinktinai — padės...     │  ← subtitle (14px muted)
│                              │  ← 24px gap
│ Skelbimo ar projekto nuoroda │  ← label (15px)
│ [________________________]   │  ← input (48px)
│ helper text                  │  ← helper (14px muted)
│                              │  ← 32px gap
│ Įkelti dokumentą (PDF)       │  ← label (15px)
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │   📄 Pasirinkite PDF     │ │  ← grows to fill
│ │      failą arba          │ │     remaining space
│ │      nutempkite čia      │ │
│ │                          │ │
│ └──────────────────────────┘ │
│ helper text                  │  ← helper (14px muted)
└──────────────────────────────┘
```

The upload area expands to use the available vertical space, making the card feel balanced and purposeful rather than top-heavy.

---

## What NOT to change

- Left column cards — untouched
- Card content (text, labels, placeholders) — untouched
- Grid layout (two-column, equal height) — untouched
- Backend — untouched

---

## Verification

1. Right column card content is distributed evenly — no large empty gap at the bottom
2. PDF upload area is visibly larger — a proper drag-and-drop zone, not a thin line
3. Upload area has a dashed border and subtle background distinguishing it from the URL input
4. The overall card feels balanced — content uses the full height comfortably
5. Spacing between sections (URL and PDF) is generous, not cramped