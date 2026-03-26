# Design Fix: Footer — Compress + Update Content

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-footer.md
**Branch:** block1-e2e
**Scope:** Make footer more compact, update tagline, remove Produktas column

---

## Fix 1: Compress footer spacing

The footer is too airy. Tighten all vertical spacing:

- Footer section top padding: reduce to **32px** (from current ~60px+)
- Footer section bottom padding: reduce to **24px**
- Gap between the footer columns row and the copyright line: reduce to **24px** (from current ~40px+)
- Gap between column heading and first link: **8px**
- Gap between links within a column: **6px**
- The footer should feel like a compact reference strip, not a full section

---

## Fix 2: Update tagline

In the left column under "ntd.lt":

- Current: "Nekilnojamojo turto duomenys iš oficialių Lietuvos registrų."
- New: **"Nekilnojamojo turto duomenys iš oficialių Lietuvos registrų, duomenų bazių."**

---

## Fix 3: Remove entire PRODUKTAS column

Remove the "PRODUKTAS" column and all its links:
- ~~Duomenų blokai~~
- ~~Kaina~~
- ~~DUK~~

The footer now has 3 columns instead of 4:

| NT Duomenys (logo + tagline) | INFORMACIJA | KONTAKTAI |
|---|---|---|
| ntd.lt | Apie NTD | info@ntd.lt |
| Nekilnojamojo turto duomenys iš oficialių Lietuvos registrų, duomenų bazių. | Privatumo politika | |
| | Naudojimo sąlygos | |

Adjust the grid layout from 4-column to **3-column** so the remaining columns space out evenly.

---

## What NOT to change

- Copyright line "© 2026 NT Duomenys..." — untouched
- "LT · EN" language switcher — untouched
- INFORMACIJA links (Apie NTD, Privatumo politika, Naudojimo sąlygos) — untouched
- KONTAKTAI (info@ntd.lt) — untouched
- Footer background color — untouched

---

## Verification

1. Footer feels compact — noticeably less whitespace than before
2. No "PRODUKTAS" column (no Duomenų blokai, Kaina, DUK links)
3. Tagline reads "...registrų, duomenų bazių."
4. Three-column layout (logo+tagline, Informacija, Kontaktai) looks balanced
5. Copyright line and language switcher still present at bottom