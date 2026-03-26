# Design Fix: Vieta Screen — Tabbed Location Card (FINAL)

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-vieta-tabs.md
**Branch:** block1-e2e
**Scope:** Remove step indicator; tabbed location card; natural card heights (no stretch); no map previews; Žemėlapis opens full-screen; no right card title

---

## ⚠️ PREVIOUS IMPLEMENTATION ISSUES

1. Static map images in Adresas/NTR tabs are **billed per Google Maps API call** — every render, every tab switch. No revenue return for a preview placeholder. **Remove all static map images.**
2. Empty CSS placeholder boxes look bad — don't replace maps with gray boxes.
3. Žemėlapis tab must open the **full-screen overlay**, not render inline.

**Solution: drop `align-items: stretch`. Use `align-items: start` (top-aligned, natural height). No filler content needed.**

---

## Fix 1: Remove step indicator

Remove "1 Vieta → 2 Patvirtinimas ir apmokėjimas" entirely.

---

## Fix 2: Tabbed location card (left column)

### Card wrapper

```css
.tabbed-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
```

### Helper text inside card, above tabs

**"Pakanka vieno iš šių būdų:"** — 15px medium, #1A1A2E

### Tab headers

**"Adresas"** (default active) · **"Unikalus Nr."** with "Tiksliausias" badge · **"Žemėlapis"**

Active tab: background #E8F4F8, border-bottom 2px solid #0D7377, color #1E3A5F, font-weight 600, 14px, padding 10px 16px, border-radius 6px 6px 0 0

Inactive tab: transparent, border-bottom 2px transparent, color #64748B, font-weight 500

Inactive hover: background #FAFBFC, color #1A1A2E

1px bottom border (#E2E8F0) under all tabs; active tab's 2px teal overlaps it.

### "Tiksliausias" badge

Next to "Unikalus Nr.": 10px uppercase, letter-spacing 0.05em, #0D7377, background #E8F4F8, padding 1px 5px, border-radius 3px

### Tab content — ONLY the input, nothing else

**Tab 1 — Adresas (default):**
- Input: "Pradėkite rašyti adresą (gatvė, numeris, miestas)...", 48px, 16px
- Helper: "Pasirinkite adresą iš pasiūlymų — sistema ras objektą automatiškai."
- **No map preview. No placeholder. Nothing else.**

**Tab 2 — Unikalus Nr.:**
- Input: "pvz., 1234-5678-9012", 48px, 16px
- Helper: "Tiksliausias būdas — kiekvienas objektas turi unikalų numerį Nekilnojamojo turto registre."
- Teal link: "Kur rasti unikalų numerį? ↗" → `https://www.registrucentras.lt/ntr/p/` (new tab)
- **No map preview. No placeholder. Nothing else.**

**Tab 3 — Žemėlapis:**
- A clickable trigger area that opens the **full-screen map overlay** (same overlay as before — search bar, close ✕ button, full viewport, pin drop, dragging, confirmation):

```css
.map-open-trigger {
  min-height: 100px;
  border-radius: 8px;
  background: #F0F4F8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.map-open-trigger:hover {
  background: #E8F4F8;
}
```

Content: map pin icon (📍, ~32px) + "Spustelėkite, kad atidarytumėte žemėlapį" (14px, #64748B)

Clicking opens the **existing full-screen map overlay**. The overlay code stays untouched — just triggered from here.

After confirming a location in the overlay: show "✓ Vieta pasirinkta" + reverse-geocoded address inside the trigger area.

### Switching tabs preserves entered data

---

## Fix 3: Grid layout — natural heights, NOT stretched

```css
.vieta-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;   /* natural height — NOT stretch */
}
```

Both cards sit at their natural content height, top-aligned. The left card (tabbed) will be shorter than the right card (URL + PDF upload). **This is fine** — it looks clean and intentional. No empty space to fill, no expensive map previews, no gray placeholder boxes.

---

## Fix 4: Remove right card title and subtitle

Remove:
- ~~"Nuoroda ar dokumentas"~~ — removed
- ~~"Pasirinktinai — padės greičiau ir tiksliau identifikuoti objektą."~~ — removed

Right card starts directly with:
1. **"Skelbimo ar projekto nuoroda"** — label 15px medium
2. Input — 48px, placeholder "pvz., https://www.aruodas.lt/..."
3. Helper — 14px, #64748B
4. **Gap 24px**
5. **"Įkelti dokumentą (PDF)"** — label 15px medium
6. Upload area — dashed border, #FAFBFC background, min-height 120px
7. Helper — 14px, #64748B

The right card is taller because of the PDF upload area. The left card is shorter. Both top-aligned. Clean.

---

## What to remove

- Step indicator
- Three separate location cards → one tabbed card
- Right card title and subtitle
- **All static map images / map preview attempts** — no Google Maps Static API calls
- **All CSS placeholder boxes** in Adresas/NTR tabs

## What NOT to change

- Case toggle at top — untouched
- Full-screen map overlay code — untouched (just triggered from Žemėlapis tab)
- "Tęsti" button — untouched
- Backend — untouched

---

## Verification

1. No step indicator
2. Tabbed card with Adresas / Unikalus Nr. (Tiksliausias) / Žemėlapis
3. "Pakanka vieno iš šių būdų:" visible above tabs
4. Adresas tab shows ONLY: input + helper text. **No map preview, no placeholder box**
5. NTR tab shows ONLY: input + helper + "Kur rasti?" link. **No map preview, no placeholder box**
6. Žemėlapis tab shows clickable trigger that opens **full-screen map overlay** (NOT inline map)
7. **No Google Maps Static API calls** on the page
8. Left card is shorter than right card — both top-aligned (`align-items: start`)
9. No title/subtitle on right card
10. "Tęsti" visible without scrolling