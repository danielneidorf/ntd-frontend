# P7-B2: QuickScan Tour — Screen 1 + Screen 2

## What
Extend the AI Guide tour engine to the QuickScan flow (`/quickscan/`). Add hardcoded Lithuanian narrations for Screen 1 (Vieta — property identification) and Screen 2 (Patvirtinimas — confirmation + payment). The guide persists across the landing→QuickScan transition and across Screen 1→Screen 2 navigation.

## Why / Context
B1 delivered the landing page tour. B2 extends it to the purchase flow — this is where the guide has the most value, because the QuickScan screens have inputs, tabs, and optional fields that users may not understand. The guide explains what each section does and why it matters.

## How

### 1. Tour config files

**New file:** `src/components/guide/tours/quickscanTour.ts`

Contains two exported arrays — one for Screen 1, one for Screen 2. The tour engine detects which screen is active (via URL param `step=1` vs `step=2`, or via the presence of specific DOM elements) and loads the appropriate step array.

### 2. Screen 1 Steps (7 steps)

Screen 1 layout (top to bottom):
- "Ką norite patikrinti?" heading
- Case type cards: Esamą pastatą / Naujai statomą / Tik žemės sklypą
- Location card: Address tab / NTR tab / Map tab
- Listing URL card (right column)
- Document upload card — EPC (left column, bottom)
- Energy consumption card — kWh/m² (right column, bottom)
- "Tęsti" button
- Sources/registries marquee at bottom

```typescript
export const quickscanScreen1Tour: TourStep[] = [
  {
    id: 'case-cards',
    selector: '[data-guide="case-cards"]',
    narration: 'Pirmiausia nurodykite, ką tiksliai norite patikrinti — esamą pastatą ar patalpas, naują projektą, ar žemės sklypą. Dauguma renkasi pirmą variantą.',
  },
  {
    id: 'location',
    selector: '[data-guide="location"]',
    narration: 'Čia nurodote objekto vietą. Lengviausia — pradėkite rašyti adresą ir sistema pasiūlys variantus. Jei žinote NTR numerį — galite naudoti ir jį.',
  },
  {
    id: 'listing-url',
    selector: '[data-guide="listing-url"]',
    narration: 'Jei turite skelbimo nuorodą, pvz., iš aruodas.lt — įklijuokite čia. Tai padės patikslinti objekto duomenis. Jei neturite — tiesiog praleiskite.',
  },
  {
    id: 'epc-upload',
    selector: '[data-guide="epc-upload"]',
    narration: 'Jei turite energinio naudingumo sertifikatą ar kitą dokumentą — galite jį įkelti čia. Vertinimas bus tiksliau pritaikytas jūsų pastatui.',
  },
  {
    id: 'energy-input',
    selector: '[data-guide="energy-input"]',
    narration: 'Žinote faktines energijos sąnaudas iš sąskaitų? Įveskite čia — tai vienas tiksliausių būdų įvertinti šiluminį komfortą.',
  },
  {
    id: 'sources-marquee',
    selector: '[data-guide="sources"]',
    narration: 'Apačioje matote šaltinius, iš kurių renkame duomenis — Nekilnojamojo turto registras, Kadastras, PENS, Infostatyba ir kiti oficialūs registrai, papildyti moksliniais tyrimais.',
  },
  {
    id: 'submit',
    selector: '[data-guide="submit"]',
    narration: 'Kai viskas paruošta — spauskite „Tęsti". Sistema pradės ieškoti jūsų objekto registruose. Tai užtrunka kelias sekundes.',
  },
];
```

### 3. Screen 2 Steps (5 steps)

Screen 2 layout (top to bottom):
- Proof card: property details (address, NTR, municipality) + "Taip, teisingas" / "Ne, ieškoti kito"
- Report blocks card: 8 data blocks included in the report
- Payment card (appears after confirmation): price, email, consent, payment methods
- Sources/registries marquee at bottom (same as Screen 1)

```typescript
export const quickscanScreen2Tour: TourStep[] = [
  {
    id: 'proof-card',
    selector: '[data-guide="proof-card"]',
    narration: 'Sistema rado jūsų objektą. Patikrinkite — ar adresas, NTR numeris ir savivaldybė teisingi? Jei viskas gerai, spauskite „Taip, teisingas".',
  },
  {
    id: 'report-blocks',
    selector: '[data-guide="report-blocks"]',
    narration: 'Čia matote, kokias sritis apims jūsų ataskaita — šiluminis komfortas, energija, triukšmas, teisinės rizikos ir dar kelios. Viskas vienoje ataskaitoje.',
  },
  {
    id: 'payment-card',
    selector: '[data-guide="payment-card"]',
    narration: 'Patvirtinus objektą, čia matysite kainą ir galėsite užsakyti. El. paštas, sutikimas ir mokėjimo būdas — viskas vienoje vietoje.',
  },
  {
    id: 'email-consent',
    selector: '[data-guide="email-consent"]',
    narration: 'Įveskite el. paštą, kuriuo gausite ataskaitą, ir sutikite su sąlygomis. Ataskaitą gausite iškart po apmokėjimo.',
  },
  {
    id: 'payment-methods',
    selector: '[data-guide="payment-methods"]',
    narration: 'Pasirinkite mokėjimo būdą — banko pavedimas, kortelė, ar kitas būdas. Apmokėjus, ataskaita parengiama automatiškai.',
  },
];
```

**Note on Screen 2 steps:** Steps 3–5 (payment-card, email-consent, payment-methods) may not be visible until the user confirms the property ("Taip, teisingas"). The tour should handle this gracefully — see adaptive step skipping below.

### 4. Add data-guide attributes to QuickScan components

Add `data-guide` attributes to the relevant elements in the QuickScan flow. These are inside `QuickScanFlow.tsx` (the main React island component):

**Screen 1:**
- Case type cards container → `data-guide="case-cards"`
- Location card (address/NTR/map tabs) → `data-guide="location"`
- Listing URL card → `data-guide="listing-url"`
- Document upload card → `data-guide="epc-upload"`
- Energy consumption card → `data-guide="energy-input"`
- "Tęsti" button → `data-guide="submit"`
- Sources marquee already has `data-guide="sources"` (from B1.3)

**Screen 2:**
- Proof card → `data-guide="proof-card"`
- Report blocks card → `data-guide="report-blocks"`
- Payment card (the full payment section) → `data-guide="payment-card"`
- Email + consent area → `data-guide="email-consent"`
- Payment methods grid → `data-guide="payment-methods"`

### 5. Cross-page guide persistence

The guide must persist when navigating from landing to /quickscan/ and from Screen 1 to Screen 2.

**Current mechanism:** Guide mode is stored in `sessionStorage` key `ntd-guide-mode`. This already persists across page navigations.

**What's new:** When the user finishes the landing tour (step 6/6 "Pradėkime!") and navigates to /quickscan/, the QuickScan tour should **start automatically** if the guide mode is still `'guided'` in sessionStorage. 

Logic in `AIGuide.tsx`:
1. On mount, check `sessionStorage.getItem('ntd-guide-mode')`
2. If `'guided'` and current page is /quickscan/ → load the appropriate Screen 1 or Screen 2 tour config
3. If tour was just completed on the landing page (check `sessionStorage.getItem('ntd-guide-landing-complete')`) → auto-start the QuickScan tour

### 6. Adaptive step skipping

If the user has already filled a field before the guide reaches that step, skip it. For example, if the user typed an address before starting the guide, skip the location step.

Logic per step:
- Check if the target element exists (`document.querySelector(selector)`)
- If it doesn't exist (e.g., payment card before confirmation), skip the step
- If the input inside the target has a value, skip the step

This is a best-effort optimization — not all fields can be reliably checked. At minimum:
- Skip `location` step if the address input already has a value
- Skip `payment-card` / `email-consent` / `payment-methods` if the payment section is not yet visible (user hasn't confirmed)

### 7. Page detection

The `AIGuide.tsx` component must detect which page/screen it's on and load the appropriate tour config:

```typescript
const pathname = window.location.pathname;
const searchParams = new URLSearchParams(window.location.search);

if (pathname === '/' || pathname === '') {
  tourSteps = landingTour;
} else if (pathname.startsWith('/quickscan')) {
  const step = searchParams.get('step');
  if (step === '2') {
    tourSteps = quickscanScreen2Tour;
  } else {
    tourSteps = quickscanScreen1Tour;
  }
}
```

Alternatively, detect by DOM presence: if `[data-guide="case-cards"]` exists → Screen 1; if `[data-guide="proof-card"]` exists → Screen 2.

### 8. Integration into QuickScan page

Add `<AIGuide client:load />` to the QuickScan page layout (likely `/quickscan/index.astro` or wherever the QuickScan flow is rendered), the same way it was added to the landing page in B1. If the component is already rendered from a shared layout, no additional integration is needed — just the tour config detection.

## Constraints
- All narrations are hardcoded Lithuanian strings (AI-generated comes in B4)
- The existing landing tour must continue working unchanged
- The QuickScan tour does NOT start automatically unless the user has the guide mode active
- The Robocat avatar, hover-to-open mode selector, and speech bubble positioning from B1.1–B1.5 apply identically on /quickscan/
- Skipping steps where the target element doesn't exist must not break the tour
- All 38 tests must pass, build must succeed

## Files to touch

**New files:**
- `src/components/guide/tours/quickscanTour.ts` — Screen 1 (7 steps) + Screen 2 (5 steps) tour configs

**Modified files:**
- `src/components/guide/AIGuide.tsx` — page detection logic to load correct tour config, auto-start on /quickscan/ if guide mode is active
- `src/components/QuickScanFlow.tsx` (or equivalent) — add `data-guide` attributes to Screen 1 and Screen 2 elements
- Possibly `/quickscan/index.astro` — add `<AIGuide />` island if not already present from shared layout

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # test on localhost:4321/quickscan/
```

## Visual QA
**Screen 1:**
- [ ] Guide mode active → tour starts with step 1 (case cards) on /quickscan/
- [ ] Step 1: case cards highlighted, narration about choosing object type
- [ ] Step 2: location card highlighted, narration about entering address
- [ ] Step 3: listing URL card highlighted
- [ ] Step 4: document upload card highlighted
- [ ] Step 5: energy input card highlighted
- [ ] Step 6: sources marquee highlighted with registries narration
- [ ] Step 7: "Tęsti" button highlighted
- [ ] Narration bubble is above/beside avatar, not overlapping content
- [ ] Step navigation (Toliau / Atgal / Escape) works

**Screen 2:**
- [ ] After navigating to Screen 2, tour continues with proof card step
- [ ] Step 1: proof card highlighted with confirmation narration
- [ ] Step 2: report blocks card highlighted
- [ ] Steps 3–5: skipped if payment section is not yet visible (pre-confirmation state)
- [ ] After confirmation, payment steps become available if tour is restarted

**Cross-page:**
- [ ] Landing tour ends → navigate to /quickscan/ → QuickScan tour starts automatically (if guide mode active)
- [ ] Closing the guide on /quickscan/ → mode selector still works to restart
- [ ] Guide mode persists across page reload