# Design Fix: Hero Spacing — Fill Empty Areas

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Fix two spacing issues in the Hero section

---

## Problem 1: Empty space above and to the left of hero content

The hero content (headline + value story) starts too far down from the header, and too far from the left edge. There's a large empty region above the headline and to its left that wastes above-the-fold real estate.

**Fix:**
- Reduce the hero section's top padding significantly. The headline should start closer to the header — aim for ~40–60px gap between the bottom of the header bar and the top of the headline (currently appears to be 100px+).
- Ensure the left column content starts at the left edge of the content grid (max-width 1200px container). There should not be extra indentation beyond the normal grid padding.
- The hero section does NOT need to be full viewport height. Let the content determine the height naturally. Remove any `min-height: 100vh` or similar if present.

## Problem 2: Too much empty space inside the rotating card

The card has a fixed height but the content (title + metric + description + supporting detail) doesn't fill it vertically. There's a large gap between the description text and the bottom footer line.

**Fix — choose ONE of these approaches:**

**Option A (preferred): Reduce card height to fit content snugly.**
- Remove the fixed height constraint (or reduce it from ~280px to ~220px). Let the card height be determined by content + consistent padding.
- Keep vertical padding comfortable (16–20px top/bottom inside the content area) but don't force extra space.
- If different slides have slightly different content heights, use a `min-height` that fits the tallest slide rather than a large fixed height.

**Option B: Add more content to fill the space.**
- Add a second supporting detail line to each slide, or increase the description to 2 lines.
- Only use this if Option A makes the card feel too short relative to the left column.

---

## What NOT to change

- Hero text content (the copy itself) — untouched
- Rotating card content (slide text, metrics) — untouched
- Card horizontal sizing, colors, borders, animation — untouched
- Header, footer, other sections — untouched

---

## Verification

1. `npm run dev` — hero headline should be noticeably closer to the header
2. No large empty region above or to the left of the headline
3. The rotating card should have no large internal whitespace gap
4. The overall hero should feel tighter and more content-dense
5. Left column and right column should feel vertically balanced