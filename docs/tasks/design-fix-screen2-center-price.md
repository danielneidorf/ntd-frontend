# Design Fix: Screen 2 — Center, Price, Back Navigation

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-screen2-center-price.md
**Branch:** block1-e2e
**Scope:** Center Screen 2 content; fix price to 39 €; preserve case selection on back navigation

---

## Fix 1: Center content on screen

Screen 2's two-column layout is left-aligned — the right half of the viewport is empty.

```css
.screen2-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 32px;
}

.screen2-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}
```

---

## Fix 2: Update price

- Current: **89.00 €** with "✓ Standard" badge
- New: **39 €** (no decimals)
- Add **"KAINA NUO"** label above (12px uppercase, #64748B, letter-spacing 0.05em)
- **Remove** the "Standard" badge
- Keep address line below the price

---

## Fix 3: Preserve case selection on "Ne, ieškoti kito"

When the user clicks "Ne, ieškoti kito" (or "Keisti vietą" / "Atgal") on Screen 2, they return to Screen 1. The case toggle on Screen 1 must show the **same case that was selected when they left** — not default to the first card or reset.

### How it should work

The `evaluation_target` value (e.g., `new_build_project`) is already stored in the component state from Screen 1. When navigating back:

1. All Screen 1 inputs are preserved (location, URL, PDF, kWh — this should already work)
2. **The case toggle must also be preserved** — the previously selected segment stays highlighted
3. The URL should still contain the correct `?case=` parameter

### The bug

Currently, when returning to Screen 1, the case toggle resets to the first option ("Esamą pastatą ar patalpas") regardless of what was originally selected. This happens because either:
- The state is reset on back navigation, or
- The component re-reads the URL `?case=` param which defaults to `existing_object`

### Fix approach

When navigating back from Screen 2 to Screen 1:
- Do NOT re-read the URL `?case=` parameter — use the in-memory state
- OR update the URL `?case=` parameter to match the stored `evaluation_target` before navigating back
- The toggle segment matching the stored `evaluation_target` must be visually selected

This applies to ALL back-navigation paths:
- "Ne, ieškoti kito" button on the proof card
- "Keisti vietą" button
- "Atgal" button
- Browser back button (if supported)

---

## What NOT to change

- Screen 2 proof card content — untouched
- Email, consent, invoice fields — untouched
- Payment button functionality — untouched
- Screen 1 layout — untouched
- Backend — untouched

---

## Verification

1. Screen 2 content is **centered** in the viewport
2. Price shows **39 €** with "KAINA NUO" label, no "Standard" badge
3. Navigate to `/quickscan/?case=new_build_project` → select location → proceed to Screen 2 → click "Ne, ieškoti kito" → **Screen 1 shows "Naujai statomą, nebaigtą projektą" pre-selected** (not the first card)
4. Same test with `?case=land_only` → back → "Tik žemės sklypą" stays selected
5. All Screen 1 inputs (address, URL, PDF) are also preserved on back navigation