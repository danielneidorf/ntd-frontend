# Design Fix: Pricing Card Content Update

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-pricing-card.md
**Branch:** block1-e2e
**Scope:** Update text content in the pricing section's left card

---

## Changes to the pricing card (left side of pricing section)

### Label above price
- Current: "PRIEIGOS KAINA"
- New: **"KAINA NUO"**

### Price
- Current: 79 €
- New: **39 €**

### Subtitle below price
- Current: "Beta kaina. Galutinė kaina — 99 €."
- **Remove entirely.** No subtitle below the price.

### Bullet points (green checkmarks)

Replace the current 4 bullets with these 5:

1. ✅ Vienkartinis mokėjimas, jokių prenumeratų
2. ✅ PDF dokumentas el. paštu per 1 val.
3. ✅ Duomenys iš oficialių duomenų bazių ir jais paremti skaičiavimai
4. ✅ Jokių nepagrįstų prielaidų
5. ✅ Mokėjimas tik jums patvirtinus objektą

### CTA button
- Current: "Gauti ataskaitą" navy button at the bottom
- **Remove entirely.** No button on the pricing card.

---

## What NOT to change

- Pricing card styling (border, shadow, padding, layout) — untouched
- Right side of pricing section (report carousel) — untouched
- "/ objektas" text next to the price — keep
- Section heading, spacing, background — untouched
- All other sections — untouched

---

## Verification

1. Label reads "KAINA NUO" (not "PRIEIGOS KAINA")
2. Price shows "39 €" (not 79)
3. No "Beta kaina" subtitle
4. Five bullet points with updated text
5. No "Gauti ataskaitą" button at the bottom of the card
6. Card still looks clean and balanced without the button