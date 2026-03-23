# Design Fix: Hero Button Removal + Situation Card CTA Update

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Two small changes

---

## 1. Remove the "Gauti ataskaitą" button from the Hero

The situation cards section below the hero now serves as the primary entry point. The hero button is redundant.

**Action:** In Hero.astro, remove the "Gauti ataskaitą" button entirely (the navy CTA button at the bottom of the left column). Do NOT remove the "Gauti ataskaitą" button in the Header nav — that one stays.

The hero left column should end with the last paragraph of the value story text. The space freed up improves vertical balance with the rotating card on the right.

## 2. Change situation card CTA text

In the situation cards section ("Kokia jūsų situacija?"), change the CTA text on all three cards:

- Current: "Patikrinti →"
- New: **"Užsakyti ataskaitą"**

Style the CTA as a small button-like element (not just text link):
- Background: #1E3A5F (navy), matching the header CTA style
- Text: white, 14px medium
- Padding: 8px 20px
- Border-radius: 6px
- Positioned at the bottom of each card
- Hover: slightly lighter navy or subtle shadow

This makes the cards feel like complete, actionable entry points rather than text links.

---

## What NOT to change

- Header "Gauti ataskaitą" nav button — stays
- Rotating carousel — untouched
- Hero text content — untouched
- Situation cards content (titles, descriptions, icons, links) — untouched except for CTA text and style
- Pricing section — untouched

---

## Verification

1. Hero has no button — ends with the last text paragraph
2. Header still has "Gauti ataskaitą" bordered button
3. Each situation card has a navy "Užsakyti ataskaitą" button at the bottom
4. Card buttons link correctly to `/quickscan/?case=<value>`