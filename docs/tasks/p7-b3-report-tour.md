# P7-B3: Report Tour — Property-Specific Narrations

## What
Extend the AI Guide tour to the report page (`/report/*`). Add hardcoded Lithuanian narrations that reference actual property data from the report (address, year built, energy class, comfort levels). Steps skip dynamically when sections are absent (e.g., no permits, land-only has no comfort block).

## Why / Context
The report page is where the guide has the **most impact** — the user just paid and is now looking at unfamiliar data. The guide explains what each section means, highlights what's important, and helps the user understand the value of what they received. Unlike landing/QuickScan narrations (generic), report narrations are **personalized to the property**.

## How

### 1. Tour config file

**New file:** `src/components/guide/tours/reportTour.ts`

The report tour is unique: it needs access to the report data to personalize narrations. Since B3 uses hardcoded narrations (AI-generated ones come in B4), we use **template strings with data injection** — the tour config is a function, not a static array:

```typescript
import { TourStep } from '../types';

interface ReportData {
  address: string;
  buildingType: string;       // e.g. "Daugiabutis namas"
  yearBuilt: number;          // e.g. 1985
  energyClass: string;        // e.g. "C"
  winterComfort: string;      // e.g. "C" (Vidutiniškai)
  summerRisk: string;         // e.g. "C" (Vidutinė)
  hasPermits: boolean;
  permitCount: number;
  isLandOnly: boolean;
}

export function buildReportTour(data: ReportData): TourStep[] {
  const steps: TourStep[] = [];
  // ... steps built conditionally based on data
  return steps;
}
```

### 2. Report page sections and steps (up to 9, conditional)

Report page structure (top to bottom):
1. Street View hero photo
2. Property header (address, NTR, type, bundle)
3. "Pastato charakteristikos" — satellite map + building profile table
4. "Vidaus patalpų klimato komfortas" — winter comfort bars + summer risk bars
5. "Ką tai reiškia praktiškai?" — plain language explanation
6. "Pagrindiniai veiksniai" — drivers (energy class, year, ventilation, etc.)
7. "Statybos leidimai" (Infostatyba) — conditional, only if permits exist
8. "Papildomi dokumentai ir šaltiniai" — 5 external links
9. Locked blocks (2–5) — teaser for upcoming blocks
10. "Šaltiniai" — citations

### Tour steps:

```typescript
export function buildReportTour(data: ReportData): TourStep[] {
  const steps: TourStep[] = [
    {
      id: 'street-view',
      selector: '[data-guide="street-view"]',
      narration: `Čia matote jūsų pastato gatvės vaizdą — ${data.address}. Pažiūrėkime, ką sužinojome.`,
    },
    {
      id: 'property-header',
      selector: '[data-guide="property-header"]',
      narration: `Pastato pagrindiniai duomenys: ${data.buildingType}, pastatytas ${data.yearBuilt} m., energinė klasė — ${data.energyClass}. Visa tai gauta iš oficialių registrų.`,
    },
    {
      id: 'property-map',
      selector: '[data-guide="property-map"]',
      narration: 'Čia matote pastato vietą iš viršaus. Galite priartinti ir apžiūrėti aplinką — paspaudę „Padidinti" atsidarys pilno ekrano žemėlapis.',
    },
    {
      id: 'winter-comfort',
      selector: '[data-guide="winter-comfort"]',
      narration: `Žiemos komfortas įvertintas ${data.winterComfort} lygiu. Tai rodo, kiek lengva palaikyti patogią temperatūrą šaltuoju laikotarpiu. A — puikiai, E — labai sunku.`,
      skipIf: () => data.isLandOnly,
    },
    {
      id: 'summer-risk',
      selector: '[data-guide="summer-risk"]',
      narration: `Vasaros perkaitimo rizika — ${data.summerRisk} lygis. Tai rodo, ar per karščio bangas patalpose gali tapti per šilta. A — minimali rizika, E — kritinė.`,
      skipIf: () => data.isLandOnly,
    },
    {
      id: 'drivers',
      selector: '[data-guide="drivers"]',
      narration: 'Čia — pagrindiniai veiksniai, kurie lemia vertinimą. Kiekvienas veiksnys parodo, kaip konkreti savybė veikia jūsų pastato komfortą.',
      skipIf: () => data.isLandOnly,
    },
    {
      id: 'permits',
      selector: '[data-guide="permits"]',
      narration: data.hasPermits
        ? `Radome ${data.permitCount} statybos leidimą šiuo adresu Infostatyba sistemoje. Tai gali reikšti renovaciją, priestatą ar kitą statybos darbą.`
        : 'Šiuo adresu Infostatyba sistemoje statybos leidimų neradome. Tai reiškia, kad pastaruoju metu oficialių statybos ar renovacijos darbų nefiksuota.',
    },
    {
      id: 'documents',
      selector: '[data-guide="documents"]',
      narration: 'Čia rasite nuorodas į papildomus šaltinius — aukštų planus, kadastro žemėlapį, statybos leidimus ir teisinę informaciją. Viską galite peržiūrėti vienu paspaudimu.',
    },
    {
      id: 'locked-blocks',
      selector: '[data-guide="locked-blocks"]',
      narration: 'Tai tik pirma ataskaitos dalis — šiluminis komfortas. Greitai bus prieinamos ir kitos sritys: energijos sąnaudos, 10 metų išlaidos, aplinkos tarša ir teisinės rizikos.',
    },
  ];

  return steps;
}
```

### 3. Data extraction from the DOM

Since B3 uses hardcoded narrations with template strings, the report data needs to be extracted from the DOM or from the React component state. Two approaches:

**Option A (preferred): Read from the existing React state.**
The report page already has a React component (`ReportViewer.tsx` or similar) that holds the report data. The `AIGuide.tsx` component can receive this data as a prop or read it from a shared context/store.

**Option B (fallback): Read from the DOM.**
If the data isn't easily accessible from React state, scrape it from the rendered DOM:

```typescript
function extractReportData(): ReportData {
  const addressEl = document.querySelector('[data-guide="property-header"] h2');
  const address = addressEl?.textContent || 'Jūsų objektas';
  
  // Find building details from the characteristics table
  const yearEl = /* find "Statybos metai" row */;
  const energyEl = /* find "Energinė klasė" row */;
  // ... etc
  
  return { address, buildingType, yearBuilt, energyClass, ... };
}
```

Claude Code should determine which approach is simpler based on the existing report page architecture.

### 4. Add data-guide attributes to report components

Add `data-guide` attributes to the report page sections. These are in the report components (built during P7-A):

- Street View hero → `data-guide="street-view"` (on `PropertyPhoto.tsx` or the hero container)
- Property header (address, NTR, type) → `data-guide="property-header"`
- Satellite map → `data-guide="property-map"` (on `PropertyMap.tsx` wrapper)
- Winter comfort bar section → `data-guide="winter-comfort"` (on the winter `ComfortBar.tsx` wrapper)
- Summer risk bar section → `data-guide="summer-risk"` (on the summer `ComfortBar.tsx` wrapper)
- Drivers section ("Pagrindiniai veiksniai") → `data-guide="drivers"`
- Construction permits → `data-guide="permits"` (on `ConstructionPermits.tsx` wrapper)
- Additional documents → `data-guide="documents"` (on `AdditionalDocuments.tsx` wrapper)
- Locked blocks section → `data-guide="locked-blocks"` (on the container with the 🔒 locked block teasers)

### 5. Page detection and tour loading

In `AIGuide.tsx`, add report page detection to the `TOUR_MAP`:

```typescript
if (pathname.startsWith('/report/')) {
  const reportData = extractReportData(); // or get from React context
  tourSteps = buildReportTour(reportData);
}
```

Add `'report'` to the `tourId` prop options, or detect automatically from the URL.

### 6. Cross-page persistence from QuickScan

If the user completed the QuickScan tour and was redirected to the report page (after payment), the report tour should auto-start if guide mode is still `'guided'` in sessionStorage.

The existing auto-start mechanism from B2 should work here — `AIGuide.tsx` checks sessionStorage on mount and starts the appropriate tour.

### 7. Integration

Add `<AIGuide client:load tourId="report" />` to the report page layout (`/report/[token].astro` or equivalent). If already present from a shared layout, just ensure the tour config detection works.

## Constraints
- Narrations are hardcoded Lithuanian with property data injected via template strings
- AI-generated narrations come in B4 — this brief uses templates only
- The tour adapts to the property: land-only skips comfort/drivers, no permits skips the permits step
- The report page may have async-loaded sections (Street View photo, construction permits) — the tour engine's MutationObserver from B2 should handle these
- All existing B1/B2 tours must continue working
- The Robocat avatar and speech bubble positioning from B1.1–B1.5 apply identically
- All tests must pass, build must succeed

## Files to touch

**New files:**
- `src/components/guide/tours/reportTour.ts` — report tour builder function (up to 9 steps)

**Modified files:**
- `src/components/guide/AIGuide.tsx` — add report page detection, data extraction, tour loading
- Report page components — add `data-guide` attributes:
  - `PropertyPhoto.tsx` or hero container
  - Property header section
  - `PropertyMap.tsx`
  - `ComfortBar.tsx` wrappers (winter + summer)
  - Drivers section
  - `ConstructionPermits.tsx`
  - `AdditionalDocuments.tsx`
  - Locked blocks container
- Report page Astro layout — add `<AIGuide />` island if not already present

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # test on localhost:4321/report/dev-existing
```

## Visual QA
- [ ] Report page loads → Robocat avatar visible in bottom-right
- [ ] Guide mode active → tour starts at Street View hero
- [ ] Step 1: Street View spotlighted, narration mentions the property address
- [ ] Step 2: property header spotlighted, narration mentions building type, year, energy class
- [ ] Step 3: satellite map spotlighted
- [ ] Step 4: winter comfort bar spotlighted, narration mentions actual comfort level
- [ ] Step 5: summer risk bar spotlighted, narration mentions actual risk level
- [ ] Step 6: drivers section spotlighted
- [ ] Step 7: permits spotlighted — narration mentions count if found, or "neradome" if none
- [ ] Step 8: additional documents spotlighted
- [ ] Step 9: locked blocks spotlighted, narration about upcoming blocks
- [ ] All step narrations appear in the avatar speech bubble, not overlapping content
- [ ] Step counter accurate (reflects skipped steps)
- [ ] Tour works on both dev-existing and dev-land mock routes