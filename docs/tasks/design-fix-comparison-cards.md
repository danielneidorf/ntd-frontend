# Design Fix: Comparison Cards — Compact Spacing + Tone Down NTD

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-comparison-cards.md
**Branch:** block1-e2e
**Scope:** Make comparison cards more compact internally; adjust NTD card content to be confident but not pushy

---

## Fix 1: Compact internal spacing

The cards have too much vertical space between the data rows. Tighten:

- Row spacing (gap between label+value pairs): reduce from 20px to **12px**
- Label margin-bottom (gap between label and value): reduce from 4–6px to **2px**
- Card padding: reduce from 32px to **24px**
- Overall effect: cards should feel dense and scannable, like a fact sheet — not airy

---

## Fix 2: NTD card content changes

### Price — show but don't emphasise
- Current: "79 €" at 28px semibold (the biggest text on the card)
- New: **"79 €"** at **20px** semibold — same size as the other values, not visually dominant

### Šaltiniai — reword
- Current: "6 oficialūs registrai"
- New: **"Oficialūs registrai ir duomenimis paremti skaičiavimai"**

### Rezultatas — reword
- Current: "PDF su duomenų blokais"
- New: **"Ataskaita elektroniniu paštu"**

### Remove CTA button
- Current: "Užsakyti ataskaitą" navy button at the bottom of the NTD card
- **Remove it entirely.** No button on any of the three cards. The comparison speaks for itself.

---

## Fix 3: Keep the NTD card visually distinct but not aggressive

The teal border and "Rekomenduojama" badge are fine — they subtly signal which option is ours without being pushy. Keep them. The removal of the CTA button and the de-emphasised price already tone it down significantly.

---

## What NOT to change

- Card titles — untouched
- Card 2 (Ekspertinis patikrinimas) content — untouched
- Card 3 (Tikrinti pačiam) content — untouched
- Section heading "Kaip tai palyginti" — untouched
- NTD card teal border, badge, shadow — untouched
- Layout (3-column grid) — untouched

---

## Verification

1. Cards feel tighter internally — less whitespace between rows
2. NTD price "79 €" is the same text size as other values — not visually dominant
3. NTD Šaltiniai reads "Oficialūs registrai ir duomenimis paremti skaičiavimai"
4. NTD Rezultatas reads "Ataskaita elektroniniu paštu"
5. No "Užsakyti ataskaitą" button on any card
6. NTD card still has teal border and "Rekomenduojama" badge