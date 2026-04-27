# P7-I8d — Report Page Mobile Responsive

## What
Fix touch targets, table overflow, and minor layout issues on the report page (`/report/[token]`) for screens under 768px. The page is already in decent shape — Street View has `w-full`, containers use `max-w-[1100px]` (not fixed width), and there are no non-responsive multi-column grids.

## Issues found (from audit)

### 1. Touch targets under 44px (WCAG 2.5.5)

| Element | Current | Fix |
|---|---|---|
| "Atsisiųsti PDF" button | 34px | Add `min-h-[44px]` + larger padding on mobile |
| "Apžiūrėti Google Street View" link | 24px | Add `py-2` for touch padding |
| "Padidinti" (map expand) | 34px | Add `min-h-[44px] min-w-[44px]` |
| "Ką tai reiškia praktiškai?" toggle | 28px | Add `min-h-[44px] py-2` |
| Driver pills (energy class, year, ventilation) | 34px | Add `py-2` (bumps to ~42px) |

Google Maps internal controls (40px) — can't change, close enough.

### 2. Table without overflow wrapper

There's a `<table>` (likely the permits table or technical data) without an `overflow-x-auto` wrapper. At 390px a wide table will cause horizontal scroll.

**Fix:** Wrap any `<table>` in `<div className="overflow-x-auto">`.

### 3. Container padding

The main containers use `px-6` which is fine (24px × 2 = 48px, leaving 342px on a 390px screen). No change needed — but verify `px-6` is used consistently, not `px-8` somewhere.

### 4. Street View image height on mobile

Currently `h-[300px]` — takes up most of the mobile viewport. Consider reducing to `h-[200px] md:h-[300px]` so the property identity (address, NTR) is visible without scrolling.

### 5. Google Maps embed height on mobile

The interactive map is likely tall on mobile too. Reduce: `h-[250px] md:h-[400px]` (or whatever the current desktop height is).

### 6. "Komplekte taip pat yra" bundle items

If bundle items (sandėliukas, garažas) are in a flex row, verify they wrap on mobile: `flex flex-wrap`.

### 7. Locked future blocks

The "🔒 netrukus" preview cards — verify they have `w-full` and don't overflow.

### 8. Document links section

The "Vieši šaltiniai" and "Savininko prieiga" links — ensure they have enough padding for mobile touch targets (`py-2` minimum on each link).

## How

Claude Code should:
1. Open `src/components/ReportViewer.tsx`
2. `grep -n "min-h\|py-1\|px-3 py-1\|h-\[300\|Padidinti\|praktiškai\|overflow"` to find the exact elements
3. Add responsive variants and touch target fixes
4. Check the Astro page wrapper (`src/pages/report/[token].astro`) for any container padding issues

## Constraints

- **Desktop unchanged.** All fixes are additive mobile-first or `min-h` additions.
- **Don't touch Google Maps internal styling.** Those controls are rendered by the Google SDK.
- **Street View image already has `w-full h-[300px] object-cover rounded-xl`** — only change height responsively if needed.

## Files to touch

### Modified files (frontend `~/dev/ntd`):
- `src/components/ReportViewer.tsx` — touch targets, table wrapper, responsive heights
- Possibly sub-components imported by ReportViewer

## Verification

1. Desktop (≥768px): report page identical.
2. At 390px: no horizontal scroll.
3. All buttons/links have ≥44px touch targets.
4. Tables scroll horizontally if too wide (not page-level scroll).
5. Street View image doesn't dominate the full viewport on mobile.
6. Build passes, all tests pass.