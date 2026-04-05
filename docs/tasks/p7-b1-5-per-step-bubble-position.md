# P7-B1.5: Per-Step Bubble Positioning

## What
Two adjustments to the narration bubble positioning:
1. **Step 1 (hero):** Move the bubble to the **left of the avatar**, below the highlighted hero area — not above. The hero takes the full viewport, so a bubble above the avatar still overlaps the hero text.
2. **Steps 2–6:** Keep the bubble above the avatar, but make it **narrower and taller** (less horizontal spread = less encroachment on the highlighted sections to the left).

## How

### Step 1 positioning: left of avatar

When `stepNumber === 1`, the bubble renders to the **left** of the avatar instead of above:

```
                              ┌──────────────────────────┐
                              │ Sveiki! Padėsiu          │
                              │ apžvelgti svetainę...    │
                              │ 1 iš 6   ◀ Atgal Toliau ▶│
                              └──────────────────────────┘ ──△──┐
                                                          │ 🐱 │
                                                          └─────┘
```

CSS for step 1:
```css
position: fixed;
bottom: 96px;             /* same vertical level as avatar */
right: 176px;             /* avatar right (48px) + avatar width (128px) + gap (0px but adjust) */
max-width: 320px;
```

The speech triangle points **right** toward the avatar (instead of down):
```css
.narration-bubble.step-1::after {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid white;
}
```

### Steps 2–6 positioning: narrower, above avatar

For all other steps, keep the bubble above the avatar but reduce width:

```css
position: fixed;
bottom: 236px;            /* existing: above avatar */
right: 48px;              /* existing: aligned with avatar */
max-width: 260px;         /* was 360px — narrower to reduce encroachment */
```

Narrower means the text wraps into more lines (taller bubble), but it intrudes less into the page content area to the left.

### Implementation

In `NarrationBubble.tsx`, use the `stepNumber` prop (already available) to switch positioning:

```typescript
const isFirstStep = stepNumber === 1;

const bubbleStyle = isFirstStep
  ? {
      position: 'fixed' as const,
      bottom: '96px',
      right: '176px',
      maxWidth: '320px',
    }
  : {
      position: 'fixed' as const,
      bottom: '236px',
      right: '48px',
      maxWidth: '260px',
    };
```

The triangle pointer direction also changes: right-pointing for step 1, down-pointing for steps 2–6.

## Constraints
- Only `NarrationBubble.tsx` changes
- Step 1 bubble must not extend beyond the left edge of the viewport
- Steps 2–6 bubble at 260px width must still fit all narration text (may need to test the longest narration)
- Triangle pointer direction changes per step
- All tests must pass

## Files to touch
- `src/components/guide/NarrationBubble.tsx` — conditional positioning based on `stepNumber`

## Visual QA
- [ ] Step 1: bubble appears to the left of the avatar, below the hero area
- [ ] Step 1: triangle points right toward the avatar
- [ ] Step 1: bubble does not overlap hero text or the marquee
- [ ] Steps 2–6: bubble appears above the avatar, narrower (260px)
- [ ] Steps 2–6: triangle points down toward the avatar
- [ ] Steps 2–6: reduced encroachment on highlighted content compared to before
- [ ] All narration texts fit without clipping at the new widths