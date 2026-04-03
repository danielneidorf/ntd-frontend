# P7-B1: Tour Engine + Mode Selector + Landing Page Tour

## What
Build the core AI Guide tour engine, a floating mode selector toggle, and the landing page tour with 7 steps of hardcoded Lithuanian narrations. This is the foundation for all three modes (Savarankiškai / Su AI gidu / Balso asistentas). Only Mode 2 (visual guide + text) is functional after this brief — Modes 1 and 3 are shown in the toggle but Mode 1 does nothing (current behavior) and Mode 3 shows "Greitai!" (Coming soon).

## Why / Context
This is Phase B1 of the AI Guide concept (see `NTD_AI_Guide_Concept.md` in project knowledge). The tour engine is the shared foundation for all three modes. Building it with hardcoded narrations first lets us validate the visual UX without backend complexity or API costs. The Lithuanian copy is manually written — perfect, not AI-generated.

## How

### 1. AIGuideToggle — floating mode selector

File: `src/components/guide/AIGuideToggle.tsx`

A floating button in the bottom-right corner of every page (z-50, above all content but below modals).

**Default state (collapsed):** A circular teal (#0D7377) button with a simple icon (💬 or a small robot/assistant icon via Lucide `MessageCircle` or `Sparkles`). 48×48px, subtle shadow.

**Expanded state (on click):** A small card pops up above the button with three mode options:

```
┌─────────────────────────────────┐
│ Kaip norite naudotis?            │
│                                  │
│ ○ Savarankiškai                  │  ← default, current behavior
│ ● Su AI gidu                     │  ← enables tour
│ ○ Balso asistentas  (Greitai!)   │  ← disabled, coming soon
│                                  │
│ [Pradėti ▶]                     │
└─────────────────────────────────┘
```

- Radio buttons for mode selection
- "Balso asistentas" is visually dimmed with "(Greitai!)" badge
- "Pradėti" button starts the tour (Mode 2) or closes the panel (Mode 1)
- Selected mode stored in `sessionStorage` key `ntd-guide-mode`
- Toggle button visible on all pages: landing, /quickscan/, /report/*
- When tour is active, the toggle button changes to a "pause" or "X" button to exit the tour

### 2. AIGuideOverlay — spotlight + animations

File: `src/components/guide/AIGuideOverlay.tsx`

The visual overlay system that highlights elements during the tour.

**Spotlight effect:**
- Full-page overlay: `position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.5)`
- Rectangular cutout around the target element using CSS `clip-path: polygon()` or an SVG mask
- Cutout has a 12px padding around the target element
- 2px teal (#0D7377) glow border around the cutout (use `box-shadow` on a positioned div matching the cutout)
- Smooth transition between steps: cutout animates position/size over 300ms (`transition: all 0.3s ease`)

**Target element positioning:**
- Use `getBoundingClientRect()` on the target element to compute the cutout rectangle
- Recalculate on window resize and scroll
- Before spotlighting, scroll the target into view: `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`

### 3. NarrationBubble — step content + navigation

File: `src/components/guide/NarrationBubble.tsx`

A floating white card positioned near the spotlighted element.

**Content:**
- Narration text (Lithuanian, 1–3 sentences)
- Step counter: "2 iš 7" in `text-xs text-slate-400`
- Navigation buttons: "◀ Atgal" (back), "Toliau ▶" (next), "✕ Uždaryti" (close tour)
- On the last step: "Toliau ▶" becomes "Baigti ✓" (finish)

**Positioning logic:**
1. Get target element rect
2. Check available space: above, below, left, right
3. Place bubble on the side with most space (prefer below, then right, then above, then left)
4. Keep bubble fully within viewport (clamp to edges with 16px margin)
5. On mobile (< 640px): always render as a bottom sheet (fixed at bottom of viewport, full width, rounded top corners)

**Styling:**
- `bg-white rounded-xl shadow-lg p-5 max-w-sm`
- Narration text: `text-sm text-slate-700 leading-relaxed`
- Navigation: flex row with `gap-3`, buttons are `text-sm font-medium`
- "Toliau ▶" button: teal text (`text-[#0D7377]`)
- "Uždaryti": `text-slate-400` small × in top-right corner

### 4. Tour engine — state machine

File: `src/components/guide/useTour.ts` (React hook)

```typescript
interface TourStep {
  id: string;
  selector: string;                // CSS selector for target element
  narration: string;               // Lithuanian text to display
  position?: 'above' | 'below' | 'left' | 'right' | 'auto';
  animation?: 'pulse' | 'ring' | 'arrow' | 'sequence';
  scrollBehavior?: 'center' | 'start' | 'nearest';
}

interface TourState {
  active: boolean;
  currentStep: number;
  steps: TourStep[];
  mode: 'self' | 'guided' | 'voice';
}

function useTour(steps: TourStep[]) {
  // Returns: { state, start, next, back, goToStep, stop }
  // Handles: step navigation, scroll-to-element, overlay visibility
}
```

The hook manages:
- Starting/stopping the tour
- Step navigation (next, back, go to specific step)
- Auto-scrolling to the target element before showing the spotlight
- Calling `getBoundingClientRect()` on the target element to position overlay + bubble
- Keyboard navigation: → (next), ← (back), Escape (close tour)

### 5. Landing page tour config

File: `src/components/guide/tours/landingTour.ts`

7 steps with hardcoded Lithuanian narrations. The `selector` values reference existing DOM elements on the landing page — add `data-guide` attributes to the Astro components as needed.

```typescript
export const landingTour: TourStep[] = [
  {
    id: 'hero',
    selector: '[data-guide="hero"]',
    narration: 'Sveiki! Aš jūsų NT Duomenų asistentas. Padėsiu suprasti, ką šis įrankis gali pasakyti apie jūsų būstą. Spauskite „Toliau" ir apžvelgsime kartu.',
    animation: 'pulse',
  },
  {
    id: 'situation-cards',
    selector: '[data-guide="situation-cards"]',
    narration: 'Pirmiausia — kokia jūsų situacija? Perkate, nuomojate, renovuojate, ar tiesiog domitės? Pasirinkite, ir pradėsime.',
    animation: 'sequence',
  },
  {
    id: 'data-categories',
    selector: '[data-guide="data-categories"]',
    narration: 'NTD analizuoja 5 sritis: šiluminį komfortą, triukšmą, energijos sąnaudas, teisines rizikas ir vietos kontekstą. Kiekviena sritis — atskiras ataskaitos blokas.',
    animation: 'sequence',
  },
  {
    id: 'how-it-works',
    selector: '[data-guide="how-it-works"]',
    narration: 'Procesas paprastas: nurodote objektą, apmokate, ir gaunate ataskaitą el. paštu. Viskas užtrunka kelias minutes.',
    animation: 'pulse',
  },
  {
    id: 'sources',
    selector: '[data-guide="sources"]',
    narration: 'Duomenys gaunami iš oficialių Lietuvos registrų — Nekilnojamojo turto registro, Kadastro, PENS ir kitų šaltinių. Jokių spėliojimų.',
    animation: 'pulse',
  },
  {
    id: 'pricing',
    selector: '[data-guide="pricing"]',
    narration: 'Viena ataskaita kainuoja 39 €. Tai vienkartinis mokėjimas — jokių prenumeratų ar paslėptų mokesčių.',
    animation: 'ring',
  },
  {
    id: 'cta',
    selector: '[data-guide="situation-cards"]',
    narration: 'Pasiruošę? Pasirinkite savo situaciją viršuje ir pradėkime! Arba galite uždaryti gidą ir naršyti savarankiškai.',
    animation: 'pulse',
  },
];
```

### 6. Add data-guide attributes to landing page components

Add `data-guide` attributes to the existing Astro components so the tour engine can find them:

- `Hero.astro`: add `data-guide="hero"` to the hero section wrapper
- Situation cards section: add `data-guide="situation-cards"` to the section containing the 3 situation cards (near `#pasirinkite`)
- `DataCategories.astro` (or equivalent): add `data-guide="data-categories"` 
- `HowItWorks.astro`: add `data-guide="how-it-works"`
- Sources section: add `data-guide="sources"`
- Pricing section: add `data-guide="pricing"`

These are non-breaking additions — just a `data-guide` attribute on existing wrapper elements.

### 7. AIGuide root component

File: `src/components/guide/AIGuide.tsx`

The root component that renders on every page. Wraps the toggle, overlay, and narration bubble.

```typescript
export default function AIGuide({ tourSteps }: { tourSteps: TourStep[] }) {
  const tour = useTour(tourSteps);
  const [mode, setMode] = useState<'self' | 'guided' | 'voice'>('self');

  return (
    <>
      <AIGuideToggle mode={mode} onModeChange={setMode} onStart={tour.start} active={tour.state.active} onStop={tour.stop} />
      {tour.state.active && (
        <>
          <AIGuideOverlay targetSelector={tourSteps[tour.state.currentStep]?.selector} />
          <NarrationBubble
            step={tourSteps[tour.state.currentStep]}
            stepNumber={tour.state.currentStep + 1}
            totalSteps={tourSteps.length}
            onNext={tour.next}
            onBack={tour.back}
            onClose={tour.stop}
          />
        </>
      )}
    </>
  );
}
```

### 8. Integration into pages

Add `<AIGuide client:load tourSteps={landingTour} />` to the landing page layout (e.g., in `BaseLayout.astro` or `index.astro`). The component is a React island — Astro renders it client-side.

For now, only the landing page gets the tour. QuickScan and report page tours come in B2 and B3.

### 9. Animations

File: `src/components/guide/animations.css` (or inline Tailwind)

**Pulse animation** (for buttons/inputs):
```css
@keyframes guide-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(13, 115, 119, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(13, 115, 119, 0); }
}
.guide-pulse { animation: guide-pulse 2s ease-in-out infinite; }
```

**Ring animation** (for results):
```css
@keyframes guide-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
```

The overlay adds the appropriate animation class to a positioned div over the target element.

## Constraints
- Frontend-only — no backend changes, no API calls, zero cost
- No external tour libraries (Shepherd.js, Driver.js, etc.) — custom-built
- All narrations are hardcoded Lithuanian strings (AI-generated ones come in B4)
- The tour must not break the existing landing page functionality
- Clicking outside the overlay or pressing Escape closes the tour
- All 38 existing tests must pass, build must succeed
- Responsive: works on mobile (bottom sheet narration) and desktop (floating bubble)
- The overlay must not trap keyboard focus (accessibility)

## Files to touch

**New files:**
- `src/components/guide/AIGuide.tsx` — root component
- `src/components/guide/AIGuideToggle.tsx` — floating mode selector
- `src/components/guide/AIGuideOverlay.tsx` — spotlight overlay
- `src/components/guide/NarrationBubble.tsx` — step content + navigation
- `src/components/guide/useTour.ts` — tour state machine hook
- `src/components/guide/tours/landingTour.ts` — landing page 7 steps
- `src/components/guide/types.ts` — shared TypeScript interfaces

**Modified files:**
- `src/pages/index.astro` (or `BaseLayout.astro`) — add `<AIGuide />` island
- Landing page Astro components (Hero, etc.) — add `data-guide` attributes

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # test on localhost:4321
```

## Visual QA
- [ ] Floating teal toggle button visible in bottom-right on landing page
- [ ] Clicking toggle opens mode selector card
- [ ] "Balso asistentas" is dimmed with "(Greitai!)" badge
- [ ] Selecting "Su AI gidu" + "Pradėti" starts the tour
- [ ] Step 1: hero section spotlighted, narration bubble with Lithuanian text
- [ ] "Toliau" advances to step 2 (situation cards spotlighted)
- [ ] Smooth scroll between steps when target is off-screen
- [ ] Spotlight cutout animates smoothly between elements
- [ ] Step counter shows "1 iš 7", "2 iš 7", etc.
- [ ] "Atgal" goes to previous step
- [ ] Step 7: "Toliau" becomes "Baigti ✓", closes tour
- [ ] Escape key closes tour
- [ ] Clicking overlay (outside cutout) closes tour
- [ ] Mobile: narration renders as bottom sheet
- [ ] Tour does not break landing page functionality
- [ ] Mode persists in sessionStorage across page reload