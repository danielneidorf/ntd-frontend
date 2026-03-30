# Feature: Ambiguous Resolver — Chooser Screen

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-resolver-chooser.md
**Branch:** block1-e2e
**Scope:** Implement the chooser screen for ambiguous resolver results; add dev link

---

## When this screen appears

After the user clicks "Tęsti" on Screen 1, the resolver runs (R-A loading state). If the resolver returns **AMBIGUOUS** — meaning multiple candidates match the user's input — the flow goes to this Chooser screen instead of directly to Screen 2 (Patvirtinimas).

---

## Dev link — add to the Dev ⚙️ dropdown

| Label | URL |
|---|---|
| R-D: Keli atitikmenys | `/quickscan/?case=existing_object&step=resolver-chooser` |

When `step=resolver-chooser` URL param is present, render the chooser with mock data: 3 candidates at different addresses with different confidence levels.

---

## Layout: title + two-column — map (left) + candidate list (right)

```
Pasirinkite tikslų objektą
Radome kelis galimus atitikmenis. Pasirinkite vieną.

┌──────────────────────────┐  ┌──────────────────────────┐
│                          │  │ Galimi atitikmenys        │
│     Map with numbered    │  │                          │
│     pins (1, 2, 3)       │  │ ● Vilnius, Žirmūnų g. 12│
│                          │  │   NTR: 4400-XXXX-XXXX   │
│                          │  │   Tikslumas: Aukštas  ✓  │
│                          │  │                          │
│                          │  │ ○ Vilnius, Minties g. 3  │
│                          │  │   NTR: 4400-YYYY-YYYY   │
│                          │  │   Tikslumas: Vidutinis   │
│                          │  │                          │
│                          │  │ ○ Vilnius, Žirmūnų g. 8  │
│                          │  │   NTR: 4400-ZZZZ-ZZZZ   │
│                          │  │   Tikslumas: Vidutinis   │
│                          │  │                          │
│  [Keisti vietą]  [Atgal] │  │ ┌──────────────────────┐ │
│                          │  │ │       Tęsti            │ │
│                          │  │ └──────────────────────┘ │
└──────────────────────────┘  └──────────────────────────┘
```

Centered, max-width 1100px.

### Grid

```css
.chooser-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 32px;
}
```

---

## Title area (above the grid)

**Title:** "Pasirinkite tikslų objektą" — 24px semibold, #1A1A2E

**Subtitle:** "Radome kelis galimus atitikmenis. Pasirinkite vieną." — 15px, #64748B

---

## Left card: Map with numbered pins

Same card styling as other screens (white, border, radius, shadow, padding 24px).

### Map

- Uses the existing Google Maps / Leaflet component
- Shows all candidate locations as **numbered pins** (1, 2, 3...)
- Pin numbers match the candidate order in the list
- All pins visible at a zoom level that fits all candidates
- Pin styling: navy (#1E3A5F) circle with white number, 28px diameter

### Selecting a candidate highlights its pin

- When a candidate is selected in the right list → its pin turns teal (#0D7377) and enlarges slightly
- Other pins stay navy
- Clicking a pin on the map selects the corresponding candidate in the list

### Buttons below the map

- **"Keisti vietą"** — outline button, returns to Screen 1 map tab
- **"Atgal"** — muted text button, returns to Screen 1 with all inputs preserved

### Dev mode (no map API)

If Google Maps is unavailable (key issue), show a gray placeholder with pin numbers as simple circles at approximate positions. The chooser functionality (selecting candidates) still works without the map.

---

## Right card: Candidate list

Same card styling.

### Title

**"Galimi atitikmenys"** — 18px semibold, #1A1A2E

### Candidate grouping — by object type (3 buckets)

Candidates are grouped by type. Each group has a subtle header:

| Bucket | Header | Matches |
|---|---|---|
| **Pastatas** | "Pastatai" | kind = whole_building |
| **Patalpos** | "Patalpos pastate" | kind = unit_in_building |
| **Sklypas** | "Žemės sklypai" | kind = land_plot |

Group headers: 13px uppercase, #94A3B8, letter-spacing 0.05em. Only show groups that have candidates — hide empty groups.

Garages/parking are NOT a separate bucket — they appear as a tag within the building bucket (per Decision D1 / Customer Journey).

### Candidate row

Each candidate is a selectable radio-button row:

```css
.candidate-row {
  padding: 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.candidate-row:hover {
  border-color: #0D7377;
  background: #FAFBFC;
}

.candidate-row.selected {
  border-color: #0D7377;
  background: #E8F4F8;
  box-shadow: 0 0 0 1px #0D7377;
}
```

### Candidate row content

Each row shows:

- **Radio button** (left) — circle, teal when selected
- **Pin number** — small navy circle with white number (matches map pin)
- **Address** — 15px semibold, #1A1A2E (e.g., "Vilnius, Žirmūnų g. 12")
- **NTR** — 13px, #64748B (e.g., "Unikalus Nr.: 4400-XXXX-XXXX")
- **Confidence badge:**
  - Aukštas: green badge (#059669 text, #E8F8EE bg)
  - Vidutinis: amber badge (#D97706 text, #FEF3C7 bg)
  - Žemas: red badge (#DC2626 text, #FEE2E2 bg)
- **Additional info** (if available): purpose, area, year — 13px, #94A3B8
- **Bundle note** (if applicable): "Komplekte: garažas, sandėliukas" — 13px, #64748B
- **Checkmark** (✓) on the right when selected

### Pre-selection

The highest-confidence candidate is pre-selected by default. The user can change by clicking another row.

### "Tęsti" button

Below the candidate list, full width:

**"Tęsti"** — navy button, 48px, 16px font. Enabled when any candidate is selected (always, since one is pre-selected).

Clicking "Tęsti" locks the selected candidate and proceeds to Screen 2 (Patvirtinimas ir apmokėjimas) with the selected candidate's data.

---

## Mock data for `step=resolver-chooser`

```javascript
const mockCandidates = [
  {
    id: 'cand-001',
    pin_number: 1,
    address: 'Vilnius, Žirmūnų g. 12',
    ntr_unique_number: '4400-1234-5678',
    municipality: 'Vilniaus m. sav.',
    kind: 'whole_building',
    purpose: 'Gyvenamoji',
    heated_area_m2: 120,
    building_year_built: 1985,
    confidence: 'high',
    bundle_summary: 'Komplekte: garažas, sandėliukas',
    lat: 54.710,
    lng: 25.290,
  },
  {
    id: 'cand-002',
    pin_number: 2,
    address: 'Vilnius, Minties g. 3',
    ntr_unique_number: '4400-2345-6789',
    municipality: 'Vilniaus m. sav.',
    kind: 'unit_in_building',
    purpose: 'Gyvenamoji',
    heated_area_m2: 68,
    building_year_built: 2005,
    confidence: 'medium',
    bundle_summary: null,
    lat: 54.712,
    lng: 25.285,
  },
  {
    id: 'cand-003',
    pin_number: 3,
    address: 'Vilnius, Žirmūnų g. 8',
    ntr_unique_number: '4400-3456-7890',
    municipality: 'Vilniaus m. sav.',
    kind: 'whole_building',
    purpose: 'Gyvenamoji',
    heated_area_m2: 95,
    building_year_built: 1972,
    confidence: 'medium',
    bundle_summary: 'Komplekte: garažas',
    lat: 54.709,
    lng: 25.292,
  }
];
```

---

## What NOT to change

- Screen 1 — untouched
- Screen 2 — untouched
- Resolver loading/failure/nomatch states — untouched
- Backend — untouched

---

## Verification

1. Dev dropdown shows **"R-D: Keli atitikmenys"** link
2. Clicking it renders the chooser with 3 mock candidates
3. Candidates grouped by type (Pastatai / Patalpos pastate)
4. Each candidate shows: address, NTR, confidence badge, area, year
5. Highest-confidence candidate is pre-selected
6. Clicking a candidate row selects it (teal border + background)
7. Map shows numbered pins matching the candidate list (or gray placeholder if map API unavailable)
8. Selecting a candidate highlights its map pin
9. Clicking a map pin selects the corresponding candidate in the list
10. "Tęsti" → proceeds to Screen 2 with selected candidate's data
11. "Atgal" → returns to Screen 1 with inputs preserved