# Design Fix: Screen 2 Cleanup + kWh Card on Screen 1 (existing_object only)

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-screen2-cleanup.md
**Branch:** block1-e2e
**Scope:** Clean up Screen 2; move kWh input to Screen 1 for existing_object case only; update price

---

## Fix 1: Screen 2 — Change confirmation title

- Current: **"Ar tai teisingas objektas?"**
- New: **"Patvirtinkite objektą"**

Subtitle "Radome atitinkantį įrašą. Patikrinkite, ar tai tas pats objektas." can stay.

---

## Fix 2: Screen 2 — Remove entire EPC override card

Remove the "Energijos naudingumo duomenys (pasirinktinai)" card from Screen 2 entirely — redundant because Screen 1 already handles PDF upload and URL.

**Remove:**
- ~~Energijos naudingumo klasė dropdown~~
- ~~Metinės šildymo energijos sąnaudos (kWh/m²)~~
- ~~Sertifikato metai~~
- ~~Nežinau / neturiu po ranka checkbox~~
- ~~The entire card~~

---

## Fix 3: Screen 2 — Update price

Price on Screen 2 must show **39 €** (not 79 €). No "Beta kaina" subtitle.

---

## Fix 4: Screen 2 — Remove case selector

If the "Ką tiksliai norite įvertinti šiuo QuickScan?" case selector is still present on Screen 2, remove it entirely.

---

## Fix 5: Screen 1 — Add kWh card for `existing_object` ONLY

The "Faktinės energijos sąnaudos" manual kWh input moves to Screen 1, but **only appears when `existing_object` is selected** in the case toggle. For `new_build_project` and `land_only`, this card is hidden.

### Layout when `existing_object` is selected — 2×2 grid

```
┌───────────────────────┐  ┌───────────────────────┐
│ Tabbed location card  │  │ URL card              │
└───────────────────────┘  └───────────────────────┘
┌───────────────────────┐  ┌───────────────────────┐
│ Įkelkite dokumentą    │  │ Faktinės energijos    │
│ (PDF)                 │  │ sąnaudos              │
└───────────────────────┘  └───────────────────────┘
```

Four cards in a 2×2 grid. All equal width. Heights follow natural content (`align-items: start`).

### Layout when `new_build_project` or `land_only` is selected — inverted-T

```
┌───────────────────────┐  ┌───────────────────────┐
│ Tabbed location card  │  │ URL card              │
└───────────────────────┘  └───────────────────────┘
┌─────────────────────────────────────────────────────┐
│ Įkelkite dokumentą (PDF) — full width               │
└─────────────────────────────────────────────────────┘
```

Three cards: two on top, one spanning below. Same as the original inverted-T layout.

### Layout when NO case is selected — inverted-T (default)

Same as new_build_project/land_only layout. The kWh card only appears after the user selects "Esamą pastatą ar patalpas."

### The kWh card (bottom-right, existing_object only)

**Card wrapper:** same styling as all other cards

**Card title:** **"Faktinės energijos sąnaudos"** — 15px medium, #1A1A2E

**Input:** Numeric field, height 48px, font 16px
- Placeholder: "pvz., 120"
- Unit label inline to the right: **"kWh/m² per metus"**

**Scope selector below input:**

Two radio buttons:
- **"Tik šildymas"** (default selected)
- **"Visas komfortas (šildymas + karštas vanduo + vėsinimas)"**

Helper text below "Visas komfortas" radio:
**"Bendra energija patalpų šildymui, karšto vandens ruošimui ir vėsinimui."** — 13px, #94A3B8

**Card helper text:**
"Jei žinote faktines sąnaudas iš sąskaitų ar skaitiklių — įveskite čia. Padės tiksliau įvertinti komfortą. Nebūtina." — 14px, #64748B

### Transition animation

When the user selects "Esamą pastatą ar patalpas" in the toggle:
- The "Įkelkite dokumentą" card narrows from full-width to half-width
- The kWh card fades in to the right (opacity 0→1, 0.3s ease)

When switching away from "Esamą pastatą ar patalpas":
- The kWh card fades out (opacity 1→0, 0.2s ease)
- The "Įkelkite dokumentą" card expands to full width

This should feel smooth, not jarring. Use CSS transitions on grid-column and opacity.

---

## What NOT to change

- Screen 2 proof card (object details, map, bundle summary) — untouched
- Screen 2 payment fields (email, consent, invoice) — untouched
- Screen 1 tabbed location card — untouched
- Screen 1 URL card — untouched
- Backend — untouched

---

## Verification

1. Screen 2 title: **"Patvirtinkite objektą"**
2. **No EPC card** on Screen 2
3. Screen 2 price: **39 €**
4. No case selector on Screen 2
5. Select "Esamą pastatą ar patalpas" on Screen 1 → **four cards** in 2×2 grid (kWh card appears bottom-right)
6. Select "Naujas projektas" → **three cards** in inverted-T (kWh card hidden, PDF card spans full width)
7. Select "Žemės sklypas" → same inverted-T (no kWh card)
8. No case selected → inverted-T (no kWh card)
9. kWh card has scope selector with "Tik šildymas" default
10. "Visas komfortas" radio has helper text explaining what it includes
11. Smooth transition when kWh card appears/disappears