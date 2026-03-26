# Design Fix: Footer Hidden Behind Marquee

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-footer-marquee-overlap.md
**Branch:** block1-e2e
**Scope:** Add bottom padding so the footer copyright line is fully visible above the marquee

---

## Problem

When scrolled to the very bottom of the page, the footer text ("© 2026 NT Duomenys. Duomenys iš oficialių Lietuvos registrų." and "LT · EN") is partially covered by the fixed-position property types marquee at the bottom of the viewport.

## Fix

Add `padding-bottom` to the `<body>`, the footer, or a wrapper — enough to push the footer content above the marquee's height.

The marquee is two rows of scrolling text, roughly **50–60px** tall. Add **60px of padding-bottom** to the page (or the footer specifically) so that when the user scrolls to the very bottom, the copyright line sits comfortably above the marquee with a small gap.

```css
/* Add to the footer or body */
padding-bottom: 60px;  /* clears the two-row marquee */
```

If the marquee is `position: fixed` at the bottom, the padding needs to be on the page content itself (body or a main wrapper). If the marquee is in the document flow, the padding goes on the footer.

Check which approach applies and add the padding accordingly.

---

## What NOT to change

- Marquee position, height, styling — untouched
- Footer content — untouched
- All other sections — untouched

---

## Verification

1. Scroll to the very bottom of the page
2. "© 2026 NT Duomenys..." and "LT · EN" are fully visible with a comfortable gap above the marquee
3. The marquee still scrolls normally at the bottom of the viewport