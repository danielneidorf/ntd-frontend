# Design Fix: Hero Bottom Spacing + "Ką gausite" Title Visible on First Screen

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-hero-spacing.md
**Branch:** block1-e2e
**Scope:** Tighten spacing so "Ką gausite ataskaitoje" heading is visible on the first screen; move scroll indicator to bottom-right

---

## Problem

1. There is a **massive empty gap** between the hero section and the next content (the "Ką gausite ataskaitoje" mini-mockup grid or situation cards). The visitor sees nothing but white space after scrolling past the hero.

2. The "Ką gausite ataskaitoje" heading should be **visible at the bottom of the first screen** (above the property types marquee), teasing the visitor that there's more valuable content below — encouraging them to scroll.

3. The scroll-down chevron indicator (≫) is currently centered below the hero text. It should be in the **bottom-right corner** instead.

---

## Fix 1: Reduce hero bottom padding / eliminate the gap

The hero section likely has excessive bottom padding or margin, or there's an empty container between the hero and the next content block.

**Action:**
- Reduce the hero section's bottom padding to **20–30px** (just enough space before the next section)
- Remove any empty container/div between the hero and the "Ką gausite ataskaitoje" section
- The "Ką gausite ataskaitoje" section's top padding should be **40px** (not 80px — we want it close to the hero)

The goal: when the page loads, the visitor sees the hero content (text + scenario cards) filling most of the viewport, and at the very bottom — just above the marquee — the heading "Ką gausite ataskaitoje" is partially or fully visible, inviting them to scroll down.

## Fix 2: Move scroll-down indicator to bottom-right

The scroll-down chevron (the ≫ animated arrows currently centered at ~y=660) should move to:

- **Position:** bottom-right corner of the hero section
- **Right offset:** 40px from the right edge
- **Bottom offset:** 20px above the marquee
- **Size:** keep current size, or slightly smaller (the indicator is secondary, not primary UI)
- **Keep the animation** (pulsing/bouncing chevrons)

## Fix 3: Eliminate massive gap between sections

If there are empty sections or excessive padding between the hero and the pricing section, collapse them. The page should flow tightly:

hero → "Ką gausite ataskaitoje" → situation cards → comparison cards → pricing → footer

No full-viewport empty gaps between any sections.

---

## What NOT to change

- Hero left column text — untouched
- Scenario cards chain — untouched
- Property types marquee — untouched (stays at bottom of page)
- "Ką gausite ataskaitoje" content — untouched (just its position/spacing changes)
- Pricing section — untouched
- Footer — untouched

---

## Verification

1. On page load: hero text + scenario cards visible, AND the heading "Ką gausite ataskaitoje" is visible at the bottom of the viewport (just above the marquee)
2. Scroll-down indicator is in the bottom-right corner, not centered
3. No massive empty gap when scrolling — sections flow tightly one after another
4. The page feels dense and informative, not sparse