# Design Fix: Remove Section Dividers + Update Header Nav

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-dividers-and-nav.md
**Branch:** block1-e2e
**Scope:** Remove all section divider lines for consistency; update header navigation items

---

## Fix 1: Remove all section divider lines

Currently some sections have a 1px border-top divider and others don't — inconsistent. Remove ALL divider lines between sections. Sections are separated by whitespace and content contrast only.

**Specifically, remove `border-top` from:**
- "Pasirinkite, ką norite išanalizuoti" section (currently has `border-top: 1px solid #E2E8F0`)
- "Kaina nuo" pricing section (currently has `border-top: 1px solid #E2E8F0`)
- Any other section that has a border-top or border-bottom divider

**Check all `<section>` elements** and ensure none has a visible border-top or border-bottom. The page should flow section-to-section with padding only, no lines.

---

## Fix 2: Update header navigation

Current header nav items: **Duomenų blokai** · **Kaina** · **DUK** · **Gauti ataskaitą** (bordered button)

New header nav items: **Kaina** · **Užsakyti ataskaitą** (bordered button)

**Remove:**
- "Duomenų blokai" link — remove entirely
- "DUK" link — remove entirely

**Keep:**
- "Kaina" link — keep as-is

**Change:**
- "Gauti ataskaitą" → **"Užsakyti ataskaitą"** (the bordered CTA button in the header)

---

## What NOT to change

- Header logo "NT Duomenys | ntd.lt" — untouched
- Header layout/styling — untouched (just fewer items)
- All page sections content — untouched
- Footer navigation links — untouched (footer may still reference DUK etc.)

---

## Verification

1. No horizontal divider lines visible between any sections when scrolling the page
2. Header shows only: "Kaina" + "Užsakyti ataskaitą" button
3. No "Duomenų blokai" or "DUK" in the header
4. Header CTA button reads "Užsakyti ataskaitą" (not "Gauti ataskaitą")