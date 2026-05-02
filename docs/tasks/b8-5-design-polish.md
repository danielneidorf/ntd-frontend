# B8-5 — Block 8 Visual Design Polish

## What
Restyle `Block8Section.tsx` from a flat text block into a structured, scannable section that visually communicates severity and breaks content into distinct cards. No content changes, no backend changes — purely frontend styling within the existing NTD design system.

## Why / Context
B8-4 copy review confirmed the content is useful, but the current rendering is a heading followed by a wall of text. Block 1 already uses cards, coloured accents, and bordered callouts — Block 8 should match that visual language while adding a severity signal that Block 1 doesn't need (Block 1 shows a matrix; Block 8 needs a single verdict).

## How

### 1. Pattern verdict banner

Add a coloured banner immediately below the `h2` heading. It shows the pattern name and a one-line summary in Lithuanian.

Colour mapping (use existing NTD palette + Tailwind utilities):

| Pattern | Label | Colour | Tailwind bg / border / text |
|---------|-------|--------|-----------------------------|
| A | Komfortiškas pastatas | Green (#059669 success) | `bg-emerald-50 border-emerald-200 text-emerald-800` |
| B | Šildymo iššūkis | Amber | `bg-amber-50 border-amber-200 text-amber-800` |
| C | Perkaitimo rizika | Amber | `bg-amber-50 border-amber-200 text-amber-800` |
| D | Dviguba rizika | Red-tinted | `bg-red-50 border-red-200 text-red-800` |

Structure:
```
┌─────────────────────────────────────────────┐
│  ● Šildymo iššūkis                         │
│  Šildymo sąnaudos gali būti reikšmingai    │
│  didesnės nei efektyviame pastate.          │
└─────────────────────────────────────────────┘
```

The `●` is a small filled circle in the pattern colour — a simple severity dot. The one-line summary is the first sentence of `intro_lt`, truncated at the first period. Or just use the full `intro_lt` inside the banner instead of repeating it below — avoids duplication.

**Decision for Claude Code:** Either put the full `intro_lt` inside the banner (and remove the standalone `<p>` below), or keep the banner as label-only and leave `intro_lt` as a paragraph. The first option is cleaner — the intro becomes the banner body. Try it and see which looks better.

### 2. Caveat callout (conditional)

When `caveat_lt` is present (low confidence), render it as a bordered callout box above the banner:

```
┌─ ⚠ ─────────────────────────────────────────┐
│  Vertinimas remiasi ribotais duomenimis...   │
└──────────────────────────────────────────────┘
```

Styling: `bg-amber-50 border-l-4 border-amber-400 p-4 text-sm text-amber-900`. This matches the warning callout pattern used elsewhere in the report.

### 3. Two-card layout for viewing questions + negotiation angles

Replace the flat `<ul>` lists with two side-by-side cards (stacking vertically on mobile). Each card has a heading and numbered items.

```
┌──────────────────────┐  ┌──────────────────────┐
│ Ką patikrinti        │  │ Derybų kampai        │
│ apžiūros metu        │  │                      │
│                      │  │                      │
│ 1. Patikrinkite...   │  │ 1. Pagal mūsų...    │
│ 2. Apžiūrėkite...   │  │ 2. Šio laikotarpio..│
│ 3. Paklauskite...    │  │                      │
└──────────────────────┘  └──────────────────────┘
```

Card styling:
- White background (`bg-white`)
- Border: `border border-slate-200 rounded-lg`
- Shadow: `shadow-sm`
- Padding: `p-5`
- Heading: `text-base font-semibold text-slate-800 mb-3`
- Items: ordered list, `text-sm text-slate-700 leading-relaxed`
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-4`

Numbered items instead of bullets — numbers signal "do these in order during your viewing" rather than "here's a random list."

### 4. Forward note

Render as a subtle footer inside the section, not a separate card:

```
→ Tikslesnį šildymo ir vėsinimo kainų įvertinimą rasite 2 bloke (Energijos sąnaudos)...
```

Styling: `text-sm text-slate-500 mt-4` with a `→` arrow prefix. No card, no border — it's a gentle nudge, not a content block.

### 5. Scope disclaimer

Keep the existing `ℹ️` prefix. Style as `text-xs text-slate-400 mt-6 border-t border-slate-100 pt-4`. The border-top separates it from content. Small text signals "this is fine print" without a heavy box.

### 6. Overall section wrapper

The whole Block 8 section should be wrapped in a card matching the existing report section style:

```tsx
<section
  data-guide="block8"
  className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8"
>
```

This matches the other report sections (Block 1, Infostatyba, Energy performance).

## Constraints

- **Tailwind core utilities only.** No custom CSS, no Tailwind compiler — we use pre-defined classes.
- **NTD palette.** Green = `#059669` (success), amber and red via Tailwind's built-in amber/red scales. Navy `#1E3A5F` for headings if needed (via existing custom class or inline style).
- **Responsive.** Two-card grid collapses to single column below `md` breakpoint.
- **No content changes.** All strings come from the backend data unchanged. This is pure presentation.
- **No backend changes.** The `Block8Output` model and API response are untouched.
- **`data-guide="block8"` attribute preserved** on the root element.
- **Pattern colour must be derived from `data.pattern`** field ("A"/"B"/"C"/"D"), not from the text content. Simple map in the component.

## Files to touch

### Frontend (`~/dev/ntd`):
**Modify:**
- `src/components/report/Block8Section.tsx` — restyle with banner, cards, colour mapping

### Not touched:
- Backend — no changes
- `mockReportData.ts` — no changes (data shape unchanged)
- Tests — existing tests verify content rendering, not styling. No test changes unless DOM structure queries change (e.g. if tests query `<ul>` and we change to `<ol>`).

## Verification

1. `/report/dev-existing` with Pattern B mock — amber banner with "Šildymo iššūkis", two cards side by side, numbered items
2. Swap mock to Pattern A — green banner
3. Swap mock to Pattern D — red-tinted banner
4. Resize browser to mobile width — cards stack vertically
5. `/report/dev-land` — Block 8 section still hidden
6. `npm test` — all 100 tests pass
7. `npm run build` — clean