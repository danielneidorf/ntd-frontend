# P7-B1.3: Rewrite Landing Tour Narrations

## What
Rewrite all hardcoded narrations in `landingTour.ts`. Merge the hero and situation cards into one step (they're one visual area), bringing the total from 7 to 6 steps. Fix factual issues (delivery, pricing, sources) and rewrite the tone from formal/self-describing to warm, observational, and gently persuasive.

## Why
Current narrations read like a brochure explaining itself. The guide should sound like a person walking you through: "Čia matote…", "Atkreipkite dėmesį…" — describing what's on screen, then adding a subtle value nudge.

## Structural Change

Merge steps 1 (hero) and 2 (situation-cards) into a single step. The hero section visually encompasses both the headline text (left) and the situation cards carousel (right) — spotlighting them separately is redundant. The merged step targets `[data-guide="hero"]`.

**Before:** 7 steps (hero → situation-cards → data-categories → how-it-works → sources → pricing → cta)
**After:** 6 steps (hero → data-categories → how-it-works → sources → pricing → cta)

## New Narrations (6 steps)

### Step 1: Hero + Situation Cards (id: 'hero')
**Selector:** `[data-guide="hero"]`

"Sveiki! Padėsiu apžvelgti svetainę. Čia matote pagrindinį puslapį — trumpai, NT Duomenys padeda sužinoti apie būstą tai, ko skelbime nematysite. O dešinėje — dešimtys situacijų, kurioms ataskaita praverčia. Eime toliau?"

### Step 2: Data Categories (id: 'data-categories')
**Selector:** `[data-guide="data-categories"]`

"Ataskaitoje rasite penkias sritis: šiluminis komfortas, triukšmas, energija, teisinės rizikos ir vietos kontekstas. Visa tai — vienoje vietoje, iš oficialių šaltinių. Dauguma šios informacijos kitur kainuoja šimtus eurų ir trunka savaites."

### Step 3: HowItWorks (id: 'how-it-works')
**Selector:** `[data-guide="how-it-works"]`

"Procesas paprastas — trys žingsniai. Nurodote adresą, apmokate, ir ataskaitą gaunate iškart. Nereikia niekur važiuoti ar laukti savaičių."

### Step 4: Sources (id: 'sources')
**Selector:** `[data-guide="sources"]`

"Čia — duomenų šaltiniai. Viskas gaunama tiesiai iš oficialių Lietuvos registrų: NTR, Kadastras, PENS, Infostatyba, papildyta moksliniais tyrimais. Tai tie patys duomenys, kuriais remiasi bankai ir notarai."

### Step 5: Pricing (id: 'pricing')
**Selector:** `[data-guide="pricing"]`

"Kaina — nuo 39 €, priklauso nuo objekto sudėtingumo. Vienkartinis mokėjimas, jokių prenumeratų. Palyginkite: nepriklausomo vertintojo vizitas kainuoja 150–300 €, o čia gaunate panašų informacijos kiekį per kelias minutes."

### Step 6: CTA (id: 'cta')
**Selector:** `[data-guide="situation-cards"]`

"Viskas — tiek reikia žinoti. Pasirinkite savo situaciją ir pradėkime! O jei norite naršyti patys — tiesiog uždarykite gidą."

## Tone Principles
- **Observational first:** "Čia matote…" / "Čia — …" / "Ataskaitoje rasite…"
- **Value nudge second:** saves money, saves time, gives advantage
- **Never use "blokas"** — say "sritis", "dalis", "tema" instead
- **Never self-describe NTD in third person** — use "jūs gausite" / "čia rasite"
- **Contrast when possible:** "…kitur kainuoja šimtus eurų" / "…bankai ir notarai"
- **Delivery is not email-only** — say "iškart" / "greitai", not "el. paštu"

## Files to touch
- `src/components/guide/tours/landingTour.ts` — replace step array (7 → 6 steps), update narration strings

## Constraints
- Lithuanian only
- Each narration: 1–3 sentences, max ~50 words
- Remove the old step 2 (situation-cards) entirely from the array
- Update the last step (CTA) selector to still point at `[data-guide="situation-cards"]` — it scrolls back up
- The step counter will now show "1 iš 6" instead of "1 iš 7"
- All tests must pass