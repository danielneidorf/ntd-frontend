# Design Fix: Screen 2 — Auto-scroll + Sticky Green Proof Box

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-screen2-invoice-scroll.md
**Branch:** block1-e2e
**Scope:** Auto-scroll when invoice fields expand; green confirmed box slides down inside proof card to stay visible

---

## Problem

1. When invoice fields expand, they end up too close to the marquee.
2. When the user scrolls down to interact with invoice fields, the green confirmed proof box (address, NTR, municipality) scrolls off the top and the user loses sight of which object they're paying for.

---

## Fix 1: Auto-scroll when fields expand

When "Reikia sąskaitos faktūros" or "Juridinis asmuo" is checked, auto-scroll so the last expanded field has **100px gap** above the marquee:

```javascript
function scrollToShowExpandedFields() {
  setTimeout(() => {
    const lastField = document.querySelector('.invoice-section :last-child');
    if (!lastField) return;
    
    const rect = lastField.getBoundingClientRect();
    const marqueeHeight = 60;
    const desiredGap = 100;
    const viewportBottom = window.innerHeight - marqueeHeight - desiredGap;
    
    if (rect.bottom > viewportBottom) {
      window.scrollBy({
        top: rect.bottom - viewportBottom + 40,
        behavior: 'smooth'
      });
    }
  }, 350);
}
```

Triggers on each checkbox/toggle change that adds fields.

---

## Fix 2: Green confirmed box slides down INSIDE the proof card

The green confirmed sub-element (the box with green border containing "Vilnius, Žirmūnų g. 12", NTR, Savivaldybė, bundle info) should use **CSS `position: sticky`** within the proof card. As the page scrolls, the green box sticks to the viewport — but stays contained within the proof card boundaries, stopping when it touches the proof card's bottom padding.

### How it works

The proof card is the containing block. The green box is a child inside it. With `position: sticky`, the green box scrolls normally until the top of the viewport reaches it, then it "sticks" — but it can never leave its parent's boundaries.

### CSS

```css
/* The proof card — must NOT have overflow: hidden */
.proof-card {
  position: relative;
  /* Remove any overflow: hidden if present — sticky won't work inside overflow: hidden */
}

/* The green confirmed box inside the proof card */
.proof-confirmed-box {
  position: sticky;
  top: 80px;              /* sticks 80px below the top of viewport (below the header) */
  z-index: 5;
  /* All existing green border, background, padding styles stay unchanged */
  transition: box-shadow 0.3s ease;
}
```

### Behavior

1. **Initial state (no scroll):** The green box sits in its natural position inside the proof card — nothing special.
2. **User scrolls down (or auto-scroll from invoice expand):** The green box sticks at `top: 80px` (just below the fixed header). The rest of the proof card scrolls away, but the green box stays visible.
3. **As the proof card's bottom edge approaches:** The green box stops sliding and stays at the bottom of the proof card. CSS sticky handles this natively — no JavaScript needed.
4. **User scrolls back up:** The green box slides back to its natural position.

### Important constraints

- The proof card **must not have `overflow: hidden` or `overflow: auto`** — sticky positioning doesn't work inside overflow containers. If the proof card currently has overflow set, remove it.
- The proof card needs enough height for the green box to slide within. Since the proof card also contains the title, subtitle, and buttons ("Taip, teisingas" / "Ne, ieškoti kito"), there's plenty of vertical space for the green box to travel.

### What stays the same about the green box

- The full green box with all its content (address, NTR, municipality, bundle info, ✓ checkmark)
- Its width, padding, border, background — all unchanged
- It does NOT collapse into a one-liner — it stays exactly as it is, just moves down

---

## Fix 3: Bottom padding

```css
.screen2-container {
  padding-bottom: 120px;
}
```

---

## What NOT to change

- Green box content — untouched (address, NTR, municipality, bundle, all text)
- Green box visual styling — untouched (same size, border, background)
- Invoice field content/logic — untouched
- Payment card — untouched
- Marquee — untouched
- Backend — untouched

---

## Verification

1. Confirm object → check "Reikia sąskaitos faktūros" → page auto-scrolls → **green box slides down inside the proof card**, staying visible below the header
2. Check "Juridinis asmuo" → page auto-scrolls further → green box still visible, stuck at `top: 80px`
3. Green box **stops sliding** when it reaches the bottom of the proof card — doesn't overflow or escape the card
4. Green box retains its **full content** (address, NTR, municipality, bundle, checkmark) — NOT a one-liner
5. Scroll back up → green box slides back to its original position
6. All invoice fields have comfortable gap above the marquee