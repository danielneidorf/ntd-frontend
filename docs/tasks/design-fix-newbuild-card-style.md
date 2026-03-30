> ⚠️ SUPERSEDED by feature-unified-vieta-screen.md. Do not implement this version.

# Design Fix: New-Build Project Card — Match Location Card Styling

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-newbuild-card-style.md
**Branch:** block1-e2e
**Scope:** Update the "Projekto ar skelbimo nuoroda" + "Įkelti projekto dokumentą (PDF)" card on the new_build_project Vieta screen to match the styling of the location cards above it

---

## Problem

On `/quickscan/?case=new_build_project`, the top three location cards (address, NTR, map) have the updated card styling from the existing_object case. But the bottom card containing "Projekto ar skelbimo nuoroda" and "Įkelti projekto dokumentą (PDF)" still uses the old styling — different border treatment, different spacing, different text sizes. It looks like it belongs to a different design system.

---

## Fix

Apply the exact same card styling used by the location cards above to the project info card:

### Card wrapper
```css
/* Must match the location cards exactly */
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
```

### Card title
- "Projekto ar skelbimo nuoroda": **18px** semibold, #1A1A2E (same as "Adresas", "Ieškoti ir pasirinkti žemėlapyje")
- "Įkelti projekto dokumentą (PDF)": **18px** semibold, #1A1A2E

### Input fields
- URL input: height **48px**, font size **16px**, border-radius **8px** (same as address input)
- PDF upload area: same border styling as other input fields, not a different dashed style

### Helper text
- **14px** regular, #64748B (same as location card helpers)

### Spacing
- Gap between the map card and this card: same as gap between other cards (consistent vertical rhythm)
- Internal spacing between "Projekto ar skelbimo nuoroda" and "Įkelti projekto dokumentą (PDF)": **20px**

### Structure decision

Currently both fields (URL + PDF upload) are inside a single card. This is fine — keep them together in one card. But ensure:
- The card title area at the top could be a section label like **"Projekto duomenys (pasirinktinai)"** — matching the card title pattern of other cards
- Below the title: URL input with its helper text
- Below that (20px gap): PDF upload with its helper text
- The "(pasirinktinai)" in the title communicates this is optional, matching the style used elsewhere

---

## What NOT to change

- Card content (URL field, PDF upload, helper texts) — untouched
- Card functionality — untouched
- Location cards above — untouched (they're already correct)
- Other case types (existing_object, land_only) — untouched

---

## Verification

1. Navigate to `/quickscan/?case=new_build_project`
2. Scroll to see all cards — the project info card at the bottom looks identical in border, shadow, radius, and text sizing to the location cards above
3. No visual "break" between the location cards and the project card
4. Input field height and font size match the address input above
5. Helper text is the same size and color as other helpers