# P7-I8b — Landing Page Mobile Responsive

## What
Fix non-responsive grids, padding, and typography on the landing page (`src/pages/index.astro` and its component imports) for screens under 768px.

## Current issues

### 1. Excessive padding at mobile widths
Multiple sections use `px-8` or `px-16` — at 390px viewport, `px-16` (64px × 2 = 128px) leaves only 262px for content. These need responsive padding.

**Fix pattern:** Replace fixed `px-8` or `px-16` with `px-4 md:px-8` or `px-4 md:px-16` throughout.

Affected containers (Claude Code must find all):
- `max-w-[1200px] mx-auto px-8` → `px-4 md:px-8`
- `max-w-[1200px] mx-auto px-16` → `px-4 md:px-16`
- `max-w-[1100px] mx-auto px-8` → `px-4 md:px-8`
- `flex flex-col px-8 pt-[72px]` → `px-4 md:px-8`
- Any `gap-24` → `gap-8 md:gap-24`
- Any `gap-16` → `gap-6 md:gap-16`

### 2. Non-responsive multi-column grids
Five grids use `grid-cols-2` or `grid-cols-3` without mobile breakpoints:

| Section | Current | Fix |
|---|---|---|
| "Ką tiksliai norite patikrinti?" | `grid grid-cols-2 gap-8` | `grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8` |
| "Rastas objektas" (mock result) | `grid grid-cols-2 gap-8` | `grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8` |
| Old pricing (79€) | `grid grid-cols-2 gap-8` | `grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8` |
| New pricing (39€) | `grid grid-cols-2 gap-24` | `grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24` |
| Footer | `grid grid-cols-3 gap-16` | `grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-16` |

### 3. Already responsive (no changes needed)
These sections already have mobile breakpoints:
- ✅ Mockup grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- ✅ Situation cards: `grid-cols-1 md:grid-cols-3`
- ✅ Comparison cards: `grid-cols-1 md:grid-cols-3`

### 4. Hero section typography
The hero heading may be too large at mobile. Check and add responsive sizing if needed:
- `text-[40px]` or similar → add `text-[28px] md:text-[40px]`
- Subtitle: ensure it wraps cleanly

### 5. Situation cards sidebar
The hero area has a two-column layout: prose left + situation cards right. At mobile, cards should stack below the prose, not beside it.

Check if this is a `flex` row — if so, add `flex-col md:flex-row`.

### 6. Scrolling ticker (property types)
The horizontal ticker at the bottom with property type labels. Check if it has `overflow-x: hidden` or if it causes horizontal scroll on the page at 390px. If it causes page-level horizontal scroll, add `overflow-x: hidden` on the ticker container.

## How

Claude Code should:
1. Open `src/pages/index.astro`
2. Search for every `px-8`, `px-16`, `gap-16`, `gap-24` and add responsive variants
3. Search for every `grid-cols-2` and `grid-cols-3` that lacks `md:` prefix and add `grid-cols-1` mobile default
4. Check hero section for two-column layout and add `flex-col md:flex-row`
5. Check heading font sizes and add mobile variants
6. Check the ticker for horizontal overflow

**Method:** `grep -n "grid-cols-[23]\|px-16\|px-8\|gap-16\|gap-24" src/pages/index.astro` to find all instances, then fix each.

## Constraints

- **Tailwind responsive classes only.** No custom CSS, no media queries.
- **Desktop layout unchanged.** All changes are additive mobile-first defaults with `md:` desktop overrides.
- **Don't touch already-responsive grids** (mockup grid, situation cards, comparison cards).
- **Test by checking the `scrollWidth` vs `clientWidth` at the end** — no horizontal scroll at any point on the page.

## Files to touch

### Modified files (frontend `~/dev/ntd`):
- `src/pages/index.astro` — responsive padding, grids, typography
- Any imported components that contain non-responsive layouts (Claude Code follows the imports)

## Verification

1. Desktop (≥768px): landing page looks identical to current.
2. At 390px (check via JS: `document.body.scrollWidth <= window.innerWidth`): no horizontal scroll.
3. All grids stack to single column on mobile.
4. Footer stacks to single column.
5. Hero text readable, doesn't overflow.
6. Situation cards stack below hero prose.
7. Build passes, all tests pass.