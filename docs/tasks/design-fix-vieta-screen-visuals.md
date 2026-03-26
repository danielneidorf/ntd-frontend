# Design Fix: Vieta Screen — Text Size, Card Styles, Map Button Overlap

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-vieta-screen-visuals.md
**Branch:** block1-e2e
**Scope:** Fix three visual issues on the Vieta screen (/quickscan/)

---

## Problem 1: Text size smaller than landing page

The Vieta screen uses smaller text and input fields compared to the landing page. The screen feels like a secondary form page rather than a continuation of the same brand experience.

### Fix

Match all text sizes and styles to the landing page:

- **Page title** ("Nurodykite objekto vietą"): **32px** semibold, #1A1A2E (same as landing page section headings)
- **Step indicator** ("1 Vieta → 2 Patvirtinimas ir apmokėjimas"): **15px** regular, #64748B
- **Card titles** ("Adresas", "Taškas žemėlapyje", etc.): **18px** semibold, #1A1A2E
- **Input fields**: height **48px**, font size **16px**, border-radius **8px**
- **Helper text** below inputs: **14px** regular, #64748B
- **"Tęsti" button**: **16px** medium, padding **14px 32px**, same navy styling as landing page CTA buttons
- **"Turite unikalų numerį? →" link**: **16px** medium, #0D7377 teal

Overall, the Vieta screen should feel like the same design system as the landing page — same font sizes, same spacing, same visual weight.

---

## Problem 2: Inconsistent card styles

Currently:
- **Cards 1 (Adresas) and 2 (NTR)**: solid dark border, active appearance
- **Card 3 (Taškas žemėlapyje)**: lighter border, number badge "3", dashed inner area — looks different
- **Card 4 (Skelbimo nuoroda)**: very light/muted border, faded number badge "4", muted text, "Netrukus" label — clearly styled as inactive

### Fix

**All four cards must use the same card style:**

```css
.location-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
```

Specifically:
- **Remove** the number badges (the navy/muted circles with "1", "2", "3", "4") from all cards. The cards don't need sequential numbers — the visual hierarchy (address is biggest/first) already guides the user.
- **Remove** the dashed border inside the map card — use the same solid card style
- **Card 4 (Skelbimo nuoroda)**: keep the "Netrukus" label to indicate coming soon, but the card itself should have the same border, background, and shadow as the others. The "Netrukus" label should be a small pill/badge (e.g., 12px, #64748B text, #F0F4F8 background, rounded) — not achieved by making the entire card look faded.
- All card titles should be the same font size and color (#1A1A2E, 18px semibold)
- The input field disabled state inside Card 4 is fine (greyed out input) — just the card wrapper should look the same as the others

---

## Problem 3: Map confirmation button hidden behind marquee

When the user opens the map and drops a pin, a teal confirmation button appears at the bottom of the map view. This button is partially hidden behind the fixed-position sources marquee at the bottom of the viewport.

### Fix

The map overlay/modal needs sufficient bottom padding so the confirmation button sits above the marquee:

- Add **padding-bottom: 70px** to the map container/overlay (or the element that contains the confirmation button)
- This ensures the button is fully visible and clickable, clearing the ~50-60px marquee height plus a comfortable gap
- Alternatively, if the map takes the full viewport height, reduce its height by 70px (`height: calc(100vh - 70px)`) or `max-height: calc(100vh - 70px)` so the bottom area is above the marquee

The confirmation button should be fully visible and easily clickable without scrolling.

---

## What NOT to change

- Card content (titles, descriptions, inputs, links) — untouched
- Card order (Address first, NTR second, Map third, Listing URL fourth) — untouched
- "Tęsti" button functionality — untouched
- Map functionality (pin dropping, search) — untouched
- Step indicator content — untouched
- Backend — untouched

---

## Verification

1. Page title "Nurodykite objekto vietą" is 32px — same weight as landing page headings
2. All input fields are 48px height with 16px text
3. All four location cards have identical border, shadow, and background styling
4. No number badges on cards
5. Card 4 has "Netrukus" as a small badge but the card itself looks the same as others
6. Open the map, drop a pin → confirmation button is fully visible above the marquee
7. The Vieta screen feels like the same design system as the landing page