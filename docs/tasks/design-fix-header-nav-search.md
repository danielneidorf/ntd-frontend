# Design Fix: Add "Objekto paieška" to Header Nav

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-header-nav-search.md
**Branch:** block1-e2e
**Scope:** Add a new navigation link to the header

---

## Change

Current header nav: **Kaina** · **[Užsakyti ataskaitą]** (bordered button)

New header nav: **Objekto paieška** · **Kaina** · **[Užsakyti ataskaitą]** (bordered button)

### "Objekto paieška" link

- Text: **"Objekto paieška"**
- Link: `/quickscan/?case=existing_object`
- Style: same as "Kaina" — plain text link, same font size and color, no border/button treatment
- Position: first item, before "Kaina"

---

## What NOT to change

- "Kaina" link — untouched
- "Užsakyti ataskaitą" button — untouched (still scrolls to situation cards on landing page)
- Header logo "NT Duomenys | ntd.lt" — untouched
- Header styling/layout — untouched

---

## Verification

1. Header shows: **Objekto paieška** · **Kaina** · **[Užsakyti ataskaitą]**
2. Clicking "Objekto paieška" navigates to `/quickscan/?case=existing_object`
3. The Vieta screen loads with address as primary input (no case selector)