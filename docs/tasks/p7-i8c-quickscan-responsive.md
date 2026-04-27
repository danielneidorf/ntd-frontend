# P7-I8c — QuickScan Page Mobile Responsive

## What
Fix non-responsive layouts in the QuickScan order flow (`/quickscan/`) for screens under 768px. Covers Screen 1 (case type + address input) and Screen 2 (property confirmation + payment).

## Current issues

### 1. Page container padding
`max-w-[1200px] mx-auto px-8 py-8` — at 390px, `px-8` (32px × 2) wastes 64px.

**Fix:** `px-4 md:px-8`

### 2. Case type cards — 3-column grid at all widths
`grid grid-cols-3 gap-2 mb-6` — three cards at 373px each. At 390px they overflow or squish to unreadable.

**Fix:** `grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2 mb-6`

Each card should be full-width on mobile with a horizontal layout (icon left, text right) instead of the desktop vertical card. Alternatively, keep vertical cards but stack them — simpler implementation.

### 3. Input fields not full-width
Address input is 506px fixed — overflows at 390px.

**Fix:** Ensure all inputs have `w-full` class. Claude Code should check every `<input>`, `<select>`, and `<textarea>` in `QuickScanFlow.tsx` for explicit width classes and replace with `w-full`.

### 4. Location tabs (address / map / URL / NTR)
The tab row may overflow on narrow screens if tabs are fixed-width.

**Fix:** Tabs should scroll horizontally or wrap: `flex flex-wrap` or `overflow-x-auto`. Each tab should have `whitespace-nowrap` and minimum touch target `min-h-[44px]`.

### 5. Map container
The Google Maps embed container may have a fixed height that's too tall on mobile, pushing the form below the fold.

**Fix:** Reduce map height on mobile: `h-[300px] md:h-[400px]` or similar.

### 6. Screen 2 — payment method buttons
If payment buttons (Kortelė, Swedbank, etc.) are in a row, they need to stack or wrap on mobile.

**Fix:** `flex flex-wrap gap-2` or `grid grid-cols-2 md:grid-cols-4 gap-2`.

### 7. Screen 2 — consent checkbox area
The consent text with links to `/salygos` and `/privatumas` may wrap awkwardly at narrow widths.

**Fix:** Ensure the checkbox container has proper padding and the text wraps cleanly. Checkbox + label should be `flex items-start gap-2` (not `items-center` — the checkbox should align to the top of wrapping text).

### 8. CTA buttons
"Tęsti" and "Mokėti" buttons should be full-width on mobile:

**Fix:** `w-full md:w-auto` on primary action buttons.

### 9. Touch targets
4 of 10 buttons under 44px height.

**Fix:** Add `min-h-[44px]` to all interactive elements (buttons, tabs, clickable cards). This is a WCAG requirement.

### 10. Large gaps
4 gaps (likely `gap-8` or larger) without responsive variants.

**Fix:** `gap-4 md:gap-8` pattern throughout.

## How

Claude Code should:
1. Open `src/components/QuickScanFlow.tsx`
2. Search for: `px-8`, `grid-cols-3`, `gap-8`, `gap-12`, fixed width classes
3. Add responsive variants following the patterns above
4. Check the Astro wrapper (`src/pages/quickscan.astro` or equivalent) for container padding
5. Verify all `<input>` elements have `w-full`
6. Add `min-h-[44px]` to buttons and tabs

**Note:** `QuickScanFlow.tsx` is ~1700 lines. Claude Code should use `grep -n` to find specific classes rather than reading the whole file.

## Constraints

- **Desktop layout unchanged above 768px.**
- **Tailwind responsive classes only** — no custom CSS.
- **Don't break the flow logic.** Only change className strings, not component structure or state management.
- **Touch targets: 44px minimum** on all interactive elements.
- **Test by checking `scrollWidth <= clientWidth`** at mobile widths.

## Files to touch

### Modified files (frontend `~/dev/ntd`):
- `src/components/QuickScanFlow.tsx` — responsive classes throughout
- `src/pages/quickscan.astro` (or the wrapper) — container padding if it's here

## Verification

1. Desktop (≥768px): QuickScan flow looks identical.
2. At 390px: case type cards stack vertically, readable.
3. Address input fills available width.
4. Tabs don't overflow — they wrap or scroll.
5. Payment buttons accessible on mobile.
6. Consent checkbox text wraps cleanly.
7. CTA buttons full-width on mobile.
8. No horizontal scroll at any point.
9. Build passes, all tests pass.