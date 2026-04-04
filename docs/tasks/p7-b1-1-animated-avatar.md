# P7-B1.1: Animated AI Avatar — Replace Static Toggle Button

## What
Replace the static teal 💬 button (bottom-right) with a lively animated avatar character positioned in the header, next to the "NT Duomenys" title. The avatar is a small, friendly, geometric figure that idles with subtle animations (breathing, bobbing, occasional side-steps), reacts to hover, and opens the mode selector on click. It should feel alive — slightly restless, eager to help — while staying clean and professional (NTD institutional aesthetic).

## Why / Context
The floating teal button is generic — every SaaS has one. A humanised animated character:
1. Immediately signals "this website has an AI assistant" without the user reading anything
2. Creates curiosity and engagement — movement draws the eye
3. Positions NTD as innovative (no Lithuanian proptech does this)
4. The slight restlessness communicates "I'm here and ready to help" without being intrusive

## How

### 1. Avatar design — clean geometric SVG

The avatar is a simple, friendly character built from basic SVG shapes. NTD's institutional aesthetic means no cartoon/chibi — think clean, geometric, slightly abstract:

**Character anatomy (all SVG primitives):**
- Head: circle or rounded rect, teal (#0D7377) fill
- Eyes: two small white circles with dark pupils that occasionally blink (CSS animation)
- Body: rounded trapezoid or pill shape, slightly lighter teal or navy (#1E3A5F)
- Arms: thin rounded paths, one arm subtly waves during idle
- Legs: two small rounded lines, shift position during "walking" animation
- Optional: tiny headset/earpiece detail (signals "communication assistant")

**Size:** ~40–48px tall. Small enough to sit in the header without dominating, large enough for the animations to be visible.

**Colors:** NTD palette — teal body (#0D7377), navy accents (#1E3A5F), white eyes/details.

### 2. Position — header, next to the title

Move the avatar from the bottom-right floating position to the header bar, positioned immediately after "NT Duomenys | ntd.lt":

```
┌──────────────────────────────────────────────────────────────┐
│  NT Duomenys | ntd.lt  🤖(avatar)    Objekto paieška · Kaina │
│                         ↑                                     │
│                    animated character                          │
│                    sits here, next to logo                     │
└──────────────────────────────────────────────────────────────┘
```

The avatar is inline in the header flex layout, vertically centered with the nav. It's part of the page content, not a floating overlay.

### 3. Idle animations (CSS keyframes, always running)

The avatar is never completely still. Multiple subtle animations run simultaneously:

**Breathing (continuous):**
```css
@keyframes avatar-breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.03); }
}
/* Applied to body — 3s cycle, barely perceptible but gives life */
```

**Bobbing (continuous):**
```css
@keyframes avatar-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
/* Applied to whole character — 2.5s cycle */
```

**Eye blink (periodic):**
```css
@keyframes avatar-blink {
  0%, 94%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(0.1); }
}
/* Applied to eyes — 4s cycle, blink lasts ~240ms */
```

**Arm wave (periodic, offset):**
```css
@keyframes avatar-wave {
  0%, 80%, 100% { transform: rotate(0deg); }
  85% { transform: rotate(-15deg); }
  90% { transform: rotate(10deg); }
  95% { transform: rotate(-10deg); }
}
/* Applied to right arm — 8s cycle, waves once every 8 seconds */
```

**Side-step shuffle (periodic):**
```css
@keyframes avatar-shuffle {
  0%, 70%, 100% { transform: translateX(0); }
  75% { transform: translateX(4px); }
  80% { transform: translateX(-3px); }
  85% { transform: translateX(2px); }
}
/* Applied to whole character — 12s cycle, occasional restless shuffle */
```

**Eye tracking (follows cursor, JS):**
Optional enhancement: the avatar's pupils subtly shift toward the user's cursor position. Calculated from `mousemove` event, clamped to ±3px offset from center. This makes the character feel aware. If complex, skip for now.

### 4. Hover state — reacts to attention

When the user hovers over the avatar:
- Eyes widen slightly (pupils grow ~20%)
- A small speech bubble appears above/beside: "Padėti?" in `text-xs`
- The arm wave animation triggers immediately (not waiting for the 8s cycle)
- Body leans slightly toward cursor

```css
.avatar:hover .avatar-body {
  transform: rotate(-3deg);
  transition: transform 0.2s;
}
.avatar:hover .avatar-speech-bubble {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.2s, transform 0.2s;
}
```

The speech bubble cycles through hints (every 10s or on each hover):
- "Padėti?"
- "Turite klausimų?"
- "Galiu paaiškinti!"
- "Paspauskite mane 👆"

### 5. Click — opens mode selector

On click, the avatar triggers the same mode selector panel from B1, but now positioned as a dropdown below the avatar (not a bottom-right popup):

```
  NT Duomenys | ntd.lt  🤖
                          ↓
                    ┌─────────────────────────────┐
                    │ Kaip norite naudotis?         │
                    │                               │
                    │ ○ Savarankiškai               │
                    │ ● Su AI gidu                  │
                    │ ○ Balso asistentas (Greitai!) │
                    │                               │
                    │ [Pradėti ▶]                   │
                    └─────────────────────────────┘
```

### 6. Active tour state — avatar celebrates

When the tour is active, the avatar changes behavior:
- Walks alongside the narration bubble (positioned near the spotlight, not in the header)
- Or: stays in the header but bounces/celebrates at each step transition
- A small "speaking" indicator (animated dots: •••) appears when the narration is displayed
- The mode selector panel is replaced by a small "✕ Baigti turą" button below the avatar

### 7. Reduced motion support

All animations respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .avatar * { animation: none !important; }
}
```
The avatar becomes static but still shows hover tooltip and click functionality.

### 8. Mobile behavior

On mobile (< 640px):
- Avatar is slightly smaller (36px)
- Hover animations don't apply (no hover on mobile)
- Tap opens mode selector as a bottom sheet (same as before)
- Idle animations still run (breathing, blinking — they're lightweight)

## Implementation

### File changes

**New file:** `src/components/guide/AIAvatar.tsx`
- SVG character with CSS animations
- Hover state management
- Speech bubble with rotating hints
- Click handler → opens mode selector

**Modified:** `src/components/guide/AIGuideToggle.tsx`
- Remove the floating bottom-right button
- Render `<AIAvatar />` instead
- Mode selector dropdown positioned relative to avatar

**Modified:** `src/components/Header.astro` (or equivalent)
- Add the `<AIGuide />` island component inline in the header flex layout, after the logo/title
- Or: render `<AIAvatar />` directly in the header and connect it to the guide system

**Modified:** `src/components/guide/AIGuide.tsx`
- Pass the avatar position to the overlay system
- When tour is active, avatar updates its state

**Deleted:** The old floating button CSS/positioning code

### SVG structure (reference — Claude Code should build the actual SVG)

```svg
<svg viewBox="0 0 48 64" class="avatar">
  <g class="avatar-body-group">
    <!-- Body -->
    <rect class="avatar-body" x="12" y="28" width="24" height="24" rx="8" fill="#1E3A5F"/>
    <!-- Head -->
    <circle class="avatar-head" cx="24" cy="18" r="14" fill="#0D7377"/>
    <!-- Eyes -->
    <g class="avatar-eyes">
      <circle cx="19" cy="16" r="3" fill="white"/>
      <circle cx="29" cy="16" r="3" fill="white"/>
      <circle class="avatar-pupil-l" cx="20" cy="16" r="1.5" fill="#1E3A5F"/>
      <circle class="avatar-pupil-r" cx="30" cy="16" r="1.5" fill="#1E3A5F"/>
    </g>
    <!-- Arms -->
    <path class="avatar-arm-l" d="M12,32 Q4,38 8,46" stroke="#1E3A5F" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path class="avatar-arm-r" d="M36,32 Q44,38 40,46" stroke="#1E3A5F" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Legs -->
    <line class="avatar-leg-l" x1="18" y1="52" x2="16" y2="62" stroke="#1E3A5F" stroke-width="3" stroke-linecap="round"/>
    <line class="avatar-leg-r" x1="30" y1="52" x2="32" y2="62" stroke="#1E3A5F" stroke-width="3" stroke-linecap="round"/>
    <!-- Headset (optional) -->
    <path d="M10,14 Q10,6 24,4 Q38,6 38,14" stroke="#0D7377" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>
    <circle cx="10" cy="16" r="3" fill="#0D7377" stroke="#1E3A5F" stroke-width="1"/>
  </g>
</svg>
```

This is a reference — Claude Code should build the actual SVG proportions that look good at 40–48px.

## Constraints
- Pure SVG + CSS animations — no Lottie, no GIF, no canvas
- Animations must be lightweight (no JS animation loops — CSS only, except optional eye tracking)
- Respect `prefers-reduced-motion`
- Avatar lives in the header, not floating — it's part of the page layout
- Keep the existing mode selector logic from B1 intact — just change the trigger and position
- All 38 tests must pass, build must succeed
- The old floating button is removed completely

## Files to touch
- `src/components/guide/AIAvatar.tsx` — NEW: animated SVG character
- `src/components/guide/AIGuideToggle.tsx` — refactor to use avatar instead of button
- `src/components/guide/AIGuide.tsx` — update positioning logic
- `src/components/Header.astro` — integrate avatar inline
- Remove old floating button styles

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev
```

## Visual QA
- [ ] Avatar visible in header, next to "NT Duomenys" title
- [ ] Idle: subtle breathing, bobbing, occasional blink visible
- [ ] Idle: arm waves every ~8 seconds
- [ ] Idle: occasional side-step shuffle
- [ ] Hover: eyes widen, speech bubble "Padėti?" appears
- [ ] Click: mode selector dropdown appears below avatar
- [ ] Tour active: avatar shows speaking indicator
- [ ] Mobile: avatar smaller, tap opens bottom sheet
- [ ] Reduced motion: animations disabled, click still works
- [ ] Avatar doesn't overlap or misalign with header nav items