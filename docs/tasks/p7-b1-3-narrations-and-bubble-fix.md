# P7-B1.3: Rewrite Landing Tour Narrations + Fix Bubble Positioning

## What
Three changes:
1. **Add a property types marquee step** — the scrolling marquee at the bottom of the first viewport ("Namai · Butai · Biurai…") needs its own narration about the breadth of property types.
2. **Remove the sources/registries step** — the registries narration ("Viskas gaunama tiesiai iš oficialių Lietuvos registrų…") does NOT belong in the landing tour. That marquee is on the QuickScan screens (Screen 1/2), not the landing page. This narration moves to the B2 QuickScan tour later.
3. **Fix narration bubble obstruction** — the bubble currently renders on top of the highlighted content, covering it. The bubble must avoid overlapping the spotlighted area.

## Tour Steps (6 total)

Landing page structure from top to bottom:
1. Hero + situation cards carousel
2. Property types marquee ("Namai · Butai · Biurai · Ofisai…")
3. "Ką gausite ataskaitoje" — data category cards
4. How it works — process strip
5. Pricing section
6. CTA — scroll back to situation cards

### Step 1: Hero + Situation Cards (id: 'hero')
**Selector:** `[data-guide="hero"]`

"Sveiki! Padėsiu apžvelgti svetainę. Čia matote pagrindinį puslapį — trumpai, NT Duomenys padeda sužinoti apie būstą tai, ko skelbime nematysite. O dešinėje — dešimtys situacijų, kurioms ataskaita praverčia. Eime toliau?"

### Step 2: Property Types Marquee (id: 'property-types') — NEW STEP
**Selector:** Add `data-guide="property-types"` to the scrolling property types marquee element at the bottom of the first viewport.

"Matote, kiek skirtingų objektų tipų galima patikrinti — butai, namai, biurai, sandėliai, sklypai ir dar dešimtys kitų. Nesvarbu, koks turtas — kiekvienas vertinamas vienodai nuodugniai."

### Step 3: Data Categories (id: 'data-categories')
**Selector:** `[data-guide="data-categories"]`

"Ataskaitoje rasite penkias sritis: šiluminis komfortas, triukšmas, energija, teisinės rizikos ir vietos kontekstas. Visa tai — vienoje vietoje, iš oficialių šaltinių. Dauguma šios informacijos kitur kainuoja šimtus eurų ir trunka savaites."

### Step 4: HowItWorks (id: 'how-it-works')
**Selector:** `[data-guide="how-it-works"]`

"Procesas paprastas — trys žingsniai. Nurodote adresą, apmokate, ir ataskaitą gaunate iškart. Nereikia niekur važiuoti ar laukti savaičių."

### Step 5: Pricing (id: 'pricing')
**Selector:** `[data-guide="pricing"]`

"Kaina — nuo 39 €, priklauso nuo objekto sudėtingumo. Vienkartinis mokėjimas, jokių prenumeratų. Palyginkite: nepriklausomo vertintojo vizitas kainuoja 150–300 €, o čia gaunate panašų informacijos kiekį per kelias minutes."

### Step 6: CTA (id: 'cta')
**Selector:** `[data-guide="situation-cards"]`

"Viskas — tiek reikia žinoti. Pasirinkite savo situaciją ir pradėkime! O jei norite naršyti patys — tiesiog uždarykite gidą."

### REMOVED: Sources step
The registries narration ("Viskas gaunama tiesiai iš oficialių Lietuvos registrų: NTR, Kadastras, PENS, Infostatyba…") is deferred to the **B2 QuickScan tour** — that's where the sources/registries marquee actually lives.

## Bubble Positioning Fix

**Problem:** The narration bubble renders on top of the spotlighted element, covering the content the user is supposed to be looking at. Most visible on step 1 (hero) where the bubble sits right over the hero text.

**Fix in `NarrationBubble.tsx`:**

The positioning logic must enforce a rule: the bubble NEVER overlaps the spotlight cutout rectangle. The algorithm:

1. Get the target element's `getBoundingClientRect()` → this is the spotlight area
2. Calculate available space in all four directions: above, below, left, right of the spotlight
3. Place the bubble in the direction with the most space
4. If the bubble would still overlap the spotlight in any direction, offset it further
5. Minimum gap between spotlight edge and bubble edge: **16px**

For the hero section specifically (tall element filling most of the viewport), the bubble should render **below the spotlight** or as a **bottom sheet** pinned to the bottom of the viewport, rather than floating in the middle of the highlighted area.

**Fallback for very tall elements:** If the spotlighted element is taller than 60% of the viewport height, render the bubble as a bottom-anchored card (`position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%)`) so it doesn't float inside the highlighted area.

## Files to touch
- `src/components/guide/tours/landingTour.ts` — replace step array (remove sources step, add property-types step, update all narration strings)
- `src/components/guide/NarrationBubble.tsx` — fix positioning to avoid overlapping the spotlight
- Landing page marquee component — add `data-guide="property-types"` attribute to the property types marquee element
- Remove `data-guide="sources"` from the sources section on the landing page (if present) — this step no longer exists in the landing tour

## Constraints
- Lithuanian only
- Each narration: 1–3 sentences, max ~50 words
- Total steps: 6 (was 7, removed sources, added property-types)
- Bubble must never overlap the spotlighted area
- All tests must pass