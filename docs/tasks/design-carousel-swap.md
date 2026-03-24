# Design Fix: Hero Scenario Cards — Larger + Continuous Movement

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-carousel-swap.md
**Branch:** block1-e2e
**Scope:** Fix two issues with the hero scenario cards: make them considerably larger and change animation to continuous slow drift

---

## Problem 1: Cards are too small

The cards are currently narrow (~300px) with small text. They feel like minor side-widgets, not prominent hero elements. They need to be wider, taller, with bigger text and more padding — filling the hero right column properly.

### Fix: increase all dimensions

```css
.scenario-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 20px 24px;           /* was 16px 20px — more generous */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);  /* slightly stronger shadow */
  width: 100%;                  /* fill the full right column width */
  max-width: 420px;             /* wider than before */
}

.scenario-card .headline {
  font-size: 16px;              /* was 14px */
  font-weight: 600;
  color: #1E3A5F;
  margin-bottom: 6px;           /* was 4px */
}

.scenario-card .description {
  font-size: 14px;              /* was 13px */
  color: #64748B;
  line-height: 1.5;
}
```

Gap between cards: **12px** (was 10px).

The 4 visible cards should span roughly the full height of the left column's text content — from the headline level down to the last paragraph. The cards are the visual counterweight to the hero text.

---

## Problem 2: Animation is step-based, should be continuous

Currently the cards pause for 8 seconds, then jump. This feels static most of the time.

### Fix: continuous slow upward drift

The cards should move **continuously and slowly upward** — always in motion, like a vertical marquee. No pausing, no steps, no discrete jumps. A perpetual, calm, slow conveyor belt.

**Implementation approach — CSS animation, same technique as the property types marquee but vertical:**

1. Render all 13 cards in a vertical strip (duplicate the full set 2× for seamless looping = 26 cards total in the DOM)
2. The strip is inside a container with `overflow: hidden` (invisible wrapper — no styling)
3. The strip continuously translates upward using a CSS `@keyframes` animation:

```css
@keyframes scroll-up {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }  /* -50% because content is duplicated */
}

.scenario-strip {
  animation: scroll-up 120s linear infinite;  /* slow — full cycle in ~120s */
}
```

4. The visible window shows ~4 cards at a time. As the strip drifts upward, cards slowly exit the top and new ones appear from the bottom — continuously.
5. The speed should be very slow — roughly one card height per 8-10 seconds of drift. With 13 cards at ~90px each + gaps, the full strip is ~1300px. The duplicated strip is ~2600px. At `120s` duration, that's ~22px/second — a gentle drift.

**Adjust the duration to taste:** 120s is a starting point. If it feels too fast, increase to 150s or 180s. If too slow, decrease to 90s.

6. **Pause on hover** — add `animation-play-state: paused` on hover of the container.

**This replaces the JavaScript setInterval approach entirely.** No JS needed for the animation — pure CSS, same as the bottom marquee.

---

## What NOT to change

- Card content (headlines, descriptions) — untouched
- The 13 scenarios — untouched
- Hero left column — untouched
- Report carousel in pricing section — untouched (if already moved there)
- All other sections — untouched

---

## Verification

1. Cards are visibly larger — wider, taller, bigger text than before
2. Cards fill the hero right column properly — they feel like a prominent element, not a side-widget
3. Cards move **continuously upward** — always in motion, no pausing
4. The drift speed is slow and calm — roughly one card passing every 8-10 seconds
5. The loop is seamless — no visible jump when it wraps
6. Hover pauses the movement
7. At least 3-4 cards visible at any time in the right column