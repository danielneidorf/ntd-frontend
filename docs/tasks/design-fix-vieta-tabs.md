# Design Fix: Vieta Screen — Three-Card Layout with Case-Dependent Helpers (FINAL)

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-vieta-tabs.md
**Branch:** block1-e2e
**Scope:** Remove step indicator; three-card inverted-T layout; updated Lithuanian labels; case-dependent helper texts

---

## Fix 1: Remove step indicator

Remove "1 Vieta → 2 Patvirtinimas ir apmokėjimas" entirely.

---

## Fix 2: Page title and case toggle

### Page title (above everything)

**"Ką norite patikrinti?"** — 32px semibold, #1A1A2E

### Case toggle prompt

**"Nurodykite objektą"** — 16px semibold, #1E3A5F, above the three toggle segments

### Three toggle segments (unchanged styling from design-fix-case-toggle.md)

| Segment | Label | Maps to |
|---|---|---|
| 1 | 🏠 Pastatas / patalpos | `existing_object` |
| 2 | 🏗️ Naujas projektas | `new_build_project` |
| 3 | 🌿 Žemės sklypas | `land_only` |

No default when from "Objekto paieška" (`/quickscan/` without `?case=`). Pre-selected when from landing page situation card.

---

## Fix 3: Three-card inverted-T layout

### Grid

```css
.vieta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.tabbed-card { grid-column: 1; grid-row: 1; }
.url-card    { grid-column: 2; grid-row: 1; }
.pdf-card    { grid-column: 1 / -1; grid-row: 2; }
```

Mobile (<768px): single column, all stacked.

### All three cards — same wrapper styling

```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
```

---

## Card 1 (top-left): Tabbed location card

### Helper text inside card, above tabs

**"Nurodykite vietą jums tinkamiausiu būdu"** — 15px medium, #1A1A2E

### Tab headers

**"Adresas"** (default active) · **"Unikalus Nr."** with "Tiksliausias" badge · **"Žemėlapis"**

Active tab: background #E8F4F8, border-bottom 2px solid #0D7377, color #1E3A5F, font-weight 600, 14px, padding 10px 16px, border-radius 6px 6px 0 0

Inactive tab: transparent, border-bottom 2px transparent, color #64748B, font-weight 500

Inactive hover: background #FAFBFC, color #1A1A2E

### "Tiksliausias" badge

Next to "Unikalus Nr.": 10px uppercase, letter-spacing 0.05em, #0D7377, background #E8F4F8, padding 1px 5px, border-radius 3px

### Tab content

**Tab 1 — Adresas (default):**
- Input: "Pradėkite rašyti adresą (gatvė, numeris, miestas)...", 48px, 16px
- Helper: "Pasirinkite adresą iš pasiūlymų — sistema ras objektą automatiškai."

**Tab 2 — Unikalus Nr.:**
- Input: "pvz., 1234-5678-9012", 48px, 16px
- Helper: "Tiksliausias būdas — kiekvienas objektas turi unikalų numerį Nekilnojamojo turto registre."
- Teal link: "Kur rasti unikalų numerį? ↗" → `https://www.registrucentras.lt/ntr/p/` (new tab)

**Tab 3 — Žemėlapis:**
- Clickable trigger that opens the **full-screen map overlay** (same as before)
- Trigger: 📍 icon + "Spustelėkite, kad atidarytumėte žemėlapį" (14px, #64748B)
- Background #F0F4F8, hover #E8F4F8, cursor pointer

Switching tabs preserves entered data. No map previews, no static map images.

---

## Card 2 (top-right): URL card

### Card title

**"Pridėkite skelbimo ar projekto nuorodą (jeigu turite)"** — 15px medium, #1A1A2E

### Input

Height 48px, font 16px, placeholder "pvz., https://www.aruodas.lt/..."

### Helper text — CHANGES BASED ON SELECTED CASE TOGGLE

| Selected case | Helper text |
|---|---|
| **existing_object** | "Jei turite skelbimo nuorodą — padės patikslinti objekto duomenis." |
| **new_build_project** | "Nauji projektai registruose dažnai dar nematomi — jūsų pateikta nuoroda labai padės tiksliau įvertinti." |
| **land_only** | "Jei turite skelbimo nuorodą — padės identifikuoti sklypą." |
| **No case selected** | "Skelbimas portale, projekto svetainė ar kitas šaltinis." |

Helper text: 14px, #64748B. Transitions smoothly (opacity fade) when case toggle changes.

---

## Card 3 (bottom, full width): PDF upload card

### Card title

**"Įkelkite dokumentą"** — 15px medium, #1A1A2E

### Upload area

- Border: 1px dashed #E2E8F0
- Background: #FAFBFC
- Border-radius: 8px
- Min-height: 64px
- Centered: 📄 icon + "Pasirinkite PDF failą arba nutempkite čia" (14px, #64748B)
- Cursor: pointer

### Helper text — CHANGES BASED ON SELECTED CASE TOGGLE

| Selected case | Helper text |
|---|---|
| **existing_object** | "Energijos naudingumo sertifikatas ar kitas dokumentas. Jei turite — padės patikslinti vertinimą. Nebūtina." |
| **new_build_project** | "Projekto brošiūra, techninis projektas ar energijos sertifikatas — padės tiksliau įvertinti, nes registruose šio projekto duomenų gali nebūti." |
| **land_only** | "Sklypo dokumentas ar planavimo medžiaga. Nebūtina." |
| **No case selected** | "Energijos sertifikatas, projekto aprašymas ar kitas dokumentas. Nebūtina." |

Helper text: 14px, #64748B. Same smooth transition as the URL card.

---

## "Tęsti" button

Below the PDF card. Enabled when: (a) case toggle selected AND (b) at least one location method valid. Disabled otherwise.

---

## Why the helpers change by case — documentation basis

Per project documentation (Block-1 Detailed Plan Phase 6, sections 2.3.3, Decision D13, D14):

- **existing_object:** System has registry data (NTR, PENS, Kadastras). User documents are supplementary — nice to have, not critical. EPC merge order: registry → user.
- **new_build_project:** Registries often have NO data for new builds. Project documents and URLs are the **primary data sources** (D14: "derive as much as possible from project hints, documents, websites"). EPC merge order is **reversed**: project docs/URLs → user → registry. The helper text must actively encourage the user to provide these.
- **land_only:** Block-1 thermal comfort is not applicable (D6). Documents are least useful. Helper text is minimal.

---

## What to remove

- Step indicator
- Three separate location cards → one tabbed card
- Old right card title and subtitle
- All static map images
- Old page title "Nurodykite objekto vietą"

## What NOT to change

- Case toggle styling (from design-fix-case-toggle.md) — untouched
- Full-screen map overlay — untouched
- "Tęsti" button logic — untouched
- Backend — untouched

---

## Verification

1. Page title is **"Ką norite patikrinti?"**
2. Case toggle prompt is **"Nurodykite objektą"**
3. Three cards: tabbed location (top-left), URL (top-right), PDF (bottom full-width)
4. Tabbed card helper: **"Nurodykite vietą jums tinkamiausiu būdu"**
5. URL card title: **"Pridėkite skelbimo ar projekto nuorodą (jeigu turite)"**
6. PDF card title: **"Įkelkite dokumentą"**
7. Select "Pastatas / patalpos" → URL helper shows "Jei turite skelbimo nuorodą — padės patikslinti..."
8. Select "Naujas projektas" → URL helper shows "Nauji projektai registruose dažnai dar nematomi..." (stronger encouragement)
9. Select "Žemės sklypas" → URL helper shows "Jei turite skelbimo nuorodą — padės identifikuoti sklypą."
10. Same pattern for PDF card helpers
11. Helper text transitions smoothly when switching case toggles
12. Žemėlapis tab opens full-screen overlay
13. No Google Maps Static API calls
14. "Tęsti" visible without scrolling