# Feature: Unified Vieta Screen with Case Toggle

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-unified-vieta-screen.md
**Branch:** block1-e2e
**Scope:** One Vieta screen layout for all cases; add a compact case toggle bar at the top

---

## Rationale

The Vieta screen layout is now identical for all three cases. But the backend still needs `evaluation_target` to run the correct model. Users coming from the landing page situation cards already have `?case=` set; users coming from "Objekto paieška" in the header do not. A compact toggle bar at the top solves this: it forces a choice when needed and confirms the choice when pre-set.

---

## Case toggle bar

### Placement

At the top of the Vieta screen, **below the page title** ("Nurodykite objekto vietą") and **above the two-column grid** of location cards.

### Visual: three-segment toggle

A single horizontal row of three segments, like a tab bar or segmented control:

```
┌──────────────────┬──────────────────┬──────────────────┐
│  🏠 Pastatas /   │  🏗️ Naujas       │  🌿 Žemės        │
│     patalpos     │     projektas    │     sklypas      │
└──────────────────┴──────────────────┴──────────────────┘
```

**Styling:**
- Full width of the content area (same max-width as the two-column grid below)
- Height: ~48px
- Border: 1px solid #E2E8F0
- Border-radius: 10px (the whole bar is one rounded shape)
- Background: #FFFFFF
- Each segment is 1/3 width

**Unselected segment:** white background, #64748B text, 14px medium
**Selected segment:** #E8F4F8 background (teal tint), #1E3A5F text (navy), 14px semibold, subtle inner shadow or teal bottom border (2px)
**Hover (unselected):** #FAFBFC background

Clicking a segment selects it and deselects the others. The selection updates `evaluation_target` in the component state.

### Behavior based on entry path

**From landing page situation card** (`?case=existing_object` or `new_build_project` or `land_only`):
- The corresponding segment is **pre-selected** on page load
- User sees their choice confirmed, can change it with one click
- "Tęsti" button is enabled (a case is selected)

**From "Objekto paieška" header link** (`/quickscan/` with no `?case=` param):
- **No segment is selected** — all three are in the unselected state
- A small helper text appears below the toggle: "Pasirinkite, ką norite patikrinti" — 14px, #64748B
- **"Tęsti" button is disabled** until the user selects a segment
- The location cards below are **visible and interactive** — the user can start typing an address while deciding. But they cannot submit until a case is chosen.

### Segment labels

| Segment | Label | Maps to |
|---|---|---|
| 1 | 🏠 Pastatas / patalpos | `existing_object` |
| 2 | 🏗️ Naujas projektas | `new_build_project` |
| 3 | 🌿 Žemės sklypas | `land_only` |

---

## "Objekto paieška" header link

- Current: `/quickscan/?case=existing_object`
- New: **`/quickscan/`** (no `?case=` param)

This forces the toggle choice. Users who want the shortcut still get to the Vieta screen instantly; they just pick their case type with one click on the toggle.

---

## Unified two-column layout (ALL cases, same as before)

### Left column — Location methods

1. **Address card** — "Ieškoti pagal adresą"
2. **NTR card** — "Unikalus numeris (NTR)" (always visible, "Kur rasti?" link)
3. **Map card** — "Ieškoti ir pasirinkti žemėlapyje"

### Right column — URL + Document card

One card: "Nuoroda ar dokumentas" with URL field + PDF upload.

Both columns equal width and height. Same as the current unified layout.

---

## "Tęsti" button logic

Enabled when:
- (a) A case segment is selected in the toggle, **AND**
- (b) At least one location method is valid (NTR, address, or map pin)

If no case is selected → button is disabled with a muted appearance. Clicking it does nothing. No error message needed — the helper text under the toggle already says "Pasirinkite, ką norite patikrinti."

---

## What to remove

- Any remaining case-specific conditional rendering on the Vieta screen
- Case-specific page title variants (one title for all: "Nurodykite objekto vietą")

## What NOT to change

- Backend `/resolve` endpoint — untouched (still receives `evaluation_target`)
- Screen 2 (Patvirtinimas ir apmokėjimas) — untouched
- Landing page situation cards — untouched (still link to `/quickscan/?case=<value>`)
- "Užsakyti ataskaitą" header button — untouched (still scrolls to situation cards)

---

## Verification

1. From landing page situation card → toggle is pre-selected, "Tęsti" enabled once location is provided
2. From "Objekto paieška" header link → no toggle selected, helper text shows, "Tęsti" disabled
3. Clicking a toggle segment selects it (teal highlight), deselects others
4. After selecting a segment + providing a location → "Tęsti" becomes enabled
5. All three cases show identical layout below the toggle
6. Toggle is compact (~48px) — not a full card or decision page
7. `evaluation_target` sent to backend matches the selected toggle segment