# P7-B1.1: Rive Avatar — "Say Hi to the Robo" in Header

## What
Replace the static SVG avatar with the "Robocat" Rive character — an expressive robot cat with multiple interactive states (idle, chat, error, download, cursor-following). The character floats in the bottom-right corner of the viewport (fixed position, visible on all pages), idles with animations, reacts on hover, and opens the AI Guide mode selector on click. The .riv file has been exported with transparent background (Design + Animate backgrounds set to alpha 0%). This is a placeholder character — a commissioned custom NTD character will replace the `.riv` file later without code changes.

## Why / Context
The current SVG avatar (crude geometric figure) doesn't meet the visual standard. The Rive character is professionally animated, interactive, and lightweight. It immediately communicates "this website has an AI assistant" through movement and personality.

**Character:** "Robocat - Expressive Faces, Interactive Fun!" by setyosn
**URL:** https://rive.app/marketplace/12335-23415-robocat-expressive-faces-interactive-fun/
**License:** CC BY
**State machine:** "State Machine" with inputs: "No Internet" (bool), "Error" (bool), "Chat" (bool), "Download" (number), "Reset" (trigger), "Fire" (trigger)
**Artboard:** "Catbot"
**Animations:** Face Idle, Loop, Face to download, Face to chat, Head Rotation, Facial Expression, Reset
**Visual:** Expressive robot cat, white/purple body, green accents. Background set to transparent (alpha 0%).

## How

### 1. Install Rive React runtime

```bash
cd ~/dev/ntd
npm install @rive-app/react-canvas
```

This is the official Rive React package (~40KB). It renders `.riv` files on a canvas element with full state machine support.

### 2. Place the .riv file

The Robocat `.riv` file has already been exported with transparent backgrounds and placed at:

```
public/rive/assistant-robot.riv
```

Using a generic filename (`assistant-robot.riv`) so the commissioned character can replace it later without changing any code references. If the file is not present, download it from the Rive marketplace link above and remix with transparent backgrounds (Design + Animate background alpha → 0%).

### 3. Create RiveAvatar component

File: `src/components/guide/RiveAvatar.tsx`

```typescript
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

interface RiveAvatarProps {
  onClick: () => void;
  isActive: boolean;    // tour is active
  isSpeaking: boolean;  // AI is narrating (future use)
}

export default function RiveAvatar({ onClick, isActive, isSpeaking }: RiveAvatarProps) {
  const { rive, RiveComponent } = useRive({
    src: '/rive/assistant-robot.riv',
    stateMachines: 'State Machine',
    artboard: 'Catbot',
    autoplay: true,
  });

  // State machine inputs from the Robocat file
  const chatInput = useStateMachineInput(rive, 'State Machine', 'Chat');
  const errorInput = useStateMachineInput(rive, 'State Machine', 'Error');

  const handleHover = () => {
    // Trigger chat face on hover (friendly expression)
    if (chatInput) chatInput.value = true;
  };

  const handleHoverEnd = () => {
    if (chatInput) chatInput.value = false;
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleHover}
      onMouseLeave={handleHoverEnd}
      className="cursor-pointer relative"
      style={{ width: 64, height: 64 }}
      title="AI asistentas"
    >
      <RiveComponent style={{ width: 64, height: 64 }} />
    </div>
  );
}
```

**Important:** The state machine name, artboard name, and input names above are based on what was visible in the Rive editor preview. Claude Code should verify these by logging `rive.stateMachineNames` and input names after the Rive instance loads. If names differ, update accordingly.

### 4. Replace AIAvatar with RiveAvatar

**Modified:** `src/components/guide/AIGuideToggle.tsx`
- Remove the old `AIAvatar.tsx` import and SVG character
- Import `RiveAvatar` instead
- Pass `onClick`, `isActive`, and `isSpeaking` props
- The mode selector dropdown positioning stays the same (below the avatar)

**Deleted:** `src/components/guide/AIAvatar.tsx` (the old SVG character)

### 5. Floating position — bottom-right corner

The avatar floats in the bottom-right corner of the viewport, not in the header:

```tsx
<div className="fixed bottom-6 right-6 z-50">
  <div className="group relative">
    <RiveAvatar ... />
    {/* Speech bubble above the avatar */}
    <div className="absolute bottom-full right-0 mb-2
      opacity-0 group-hover:opacity-100 transition-opacity duration-200
      bg-white text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md
      whitespace-nowrap pointer-events-none">
      Padėti?
    </div>
  </div>
</div>
```

The mode selector dropdown opens above the avatar (upward), not below.

### 6. Canvas background transparency

The exported `.riv` file has both Design and Animate artboard backgrounds set to alpha 0% (transparent). The Rive canvas should render with a transparent background by default. Set:

```tsx
<RiveComponent style={{ width: 64, height: 64, background: 'transparent' }} />
```

**Note:** The file contains a "TargetArea" layer (1000×1000 rectangle, fill #747474) used for cursor hit detection. If this renders as a visible gray square, hide it by setting its opacity to 0 via the Rive runtime after load, or by applying `overflow: hidden` with appropriate sizing to crop it out. Test this visually.

### 7. Remove from header

Remove the AIAvatar / AI Guide integration from `Header.astro`. The avatar is now a standalone floating element rendered from `AIGuide.tsx` (which is loaded on every page via the layout).

### 8. Responsive

- Desktop: 64×64px canvas, `bottom-6 right-6`
- Mobile (< 640px): 56×56px canvas, `bottom-4 right-4`
- The Rive character scales smoothly (vector-based rendering)

## Constraints
- The `.riv` file is the only asset to swap when the commissioned character arrives — no code changes
- State machine input names must be discovered from the actual .riv file (don't guess)
- Canvas must render with transparent background. The artboard Design + Animate backgrounds have been set to alpha 0%. If a gray rectangle still appears, the "TargetArea" layer (1000×1000 rect, fill #747474) inside the file may need its opacity set to 0 via the Rive runtime or editor.
- The character must animate on page load (autoplay idle state)
- Hover triggers the "Chat" expression (friendly face)
- All 38 tests must pass, build must succeed
- Keep `@rive-app/react-canvas` as the only new dependency

## Files to touch
- `package.json` — add `@rive-app/react-canvas` (if not already installed)
- `public/rive/assistant-robot.riv` — REPLACE with Robocat .riv file (already placed by Daniel)
- `src/components/guide/RiveAvatar.tsx` — NEW or REWRITE: Rive character component using Robocat state machine
- `src/components/guide/AIGuideToggle.tsx` — use RiveAvatar instead of AIAvatar, floating bottom-right
- `src/components/guide/AIGuide.tsx` — render toggle as floating element, mode selector opens upward
- `src/components/guide/AIAvatar.tsx` — DELETE (replaced by RiveAvatar)
- `src/components/Header.astro` — REVERT: remove the inline AIGuide island (avatar no longer in header)

## Run after
```bash
cd ~/dev/ntd
npm install
npm run build
npm test
npm run dev
```

## Visual QA
- [ ] Robocat character floating in bottom-right corner at 64px
- [ ] Character has idle animation on page load (face idle, subtle movement)
- [ ] Hover triggers "Chat" face expression (friendly eyes)
- [ ] Mouse leave returns to idle face
- [ ] "Padėti?" tooltip appears above the avatar on hover
- [ ] Click opens mode selector dropdown (opens upward, above the avatar)
- [ ] Canvas background is transparent (no dark purple or gray square behind the character)
- [ ] Mobile: slightly smaller (56px), bottom-4 right-4
- [ ] Character doesn't flicker or flash on initial load
- [ ] Avatar is NOT in the header (removed from Header.astro)
- [ ] All existing tour functionality (spotlight, narration, steps) still works
- [ ] Avatar stays visible during scrolling (fixed position)