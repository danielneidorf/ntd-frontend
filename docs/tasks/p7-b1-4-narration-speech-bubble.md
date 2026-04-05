# P7-B1.4: Narration as Avatar Speech Bubble

## What
Move the narration bubble from a floating/bottom-anchored position to a **fixed position directly above the Robocat avatar**. The narration becomes the avatar's speech bubble — visually connected to the character, not floating independently on the page.

## Why
The current positioning has two problems:
1. **Floating near the spotlight:** the bubble overlaps the highlighted content, obstructing what the user is supposed to read
2. **Bottom-anchored fallback:** sits on top of the running marquee, distracting and hard to read

Placing the narration above the avatar solves both: it never overlaps page content (it's in the avatar's fixed corner), and it creates a natural "the robot is talking to you" metaphor.

## How

### 1. Position: fixed, above the avatar

The Robocat avatar is at `fixed bottom-24 right-12` (128×128px). The narration bubble renders directly above it:

```
┌──────────────────────────────┐
│ Narration text here.         │  ← speech bubble (fixed, above avatar)
│ 1 iš 6      ◀ Atgal  Toliau ▶│
└──────────────────────────────┘
              △                    ← small triangle pointer toward avatar
          ┌────────┐
          │ 🐱     │              ← Robocat avatar (existing position)
          └────────┘
```

CSS positioning:
```css
.narration-bubble {
  position: fixed;
  bottom: calc(96px + 128px + 12px);  /* avatar bottom offset + avatar height + gap */
  right: 12px;                         /* aligned with avatar right edge */
  max-width: 320px;
  z-index: 51;                         /* above spotlight overlay (z-40) */
}
```

The exact `bottom` value should be calculated dynamically from the avatar's actual position, but the principle is: **bubble bottom edge = avatar top edge + 12px gap**.

### 2. Speech bubble triangle pointer

Add a small CSS triangle at the bottom-right of the bubble pointing down toward the avatar:

```css
.narration-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 40px;
  width: 0; height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid white;  /* matches bubble bg */
}
```

### 3. Remove all floating positioning logic

Delete the entire positioning algorithm from `NarrationBubble.tsx`:
- No more `getBoundingClientRect()` on the target element
- No more "pick best direction" scoring
- No more bottom-anchored fallback
- No more overlap detection

The bubble is **always** in the same fixed position — above the avatar. The only thing that changes between steps is the text content and the step counter.

### 4. Spotlight still highlights the target

The spotlight overlay (`AIGuideOverlay.tsx`) still works exactly as before — it dims the page and cuts out the target element. The user sees:
- The highlighted section on the page (spotlight)
- The narration above the avatar explaining what they're looking at (speech bubble)
- The avatar itself (Robocat, animating)

The narration is spatially separated from the content — the user reads the content in the spotlight area, then glances at the avatar's speech bubble for the explanation.

### 5. Responsive

- Desktop: bubble `max-width: 320px`, right-aligned with avatar
- Mobile (< 640px): bubble `max-width: calc(100vw - 32px)`, centered above the avatar, full width minus padding

## Constraints
- Bubble is ALWAYS fixed above the avatar — no dynamic positioning per step
- Bubble must not extend above the viewport top (clamp if narration text is very long)
- The speech triangle pointer is purely cosmetic — skip if tricky
- The spotlight overlay is unchanged
- Step navigation (Toliau / Atgal / ×) stays in the bubble
- All tests must pass

## Files to touch
- `src/components/guide/NarrationBubble.tsx` — rewrite positioning to fixed above avatar, remove all dynamic placement logic
- `src/components/guide/AIGuideToggle.tsx` — may need to export avatar position for bubble alignment (or just hardcode matching values)

## Visual QA
- [ ] Narration bubble appears directly above the Robocat, not floating on the page
- [ ] Small triangle pointer connects bubble to avatar
- [ ] Bubble never overlaps the spotlighted content area
- [ ] Bubble never overlaps the marquee
- [ ] Step navigation (Toliau / Atgal) works from the bubble
- [ ] On step transitions, bubble text changes but position stays fixed
- [ ] Mobile: bubble is wider, still above avatar
- [ ] Long narration text doesn't push bubble above viewport top