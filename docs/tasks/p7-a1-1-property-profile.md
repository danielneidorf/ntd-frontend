# P7-A1.1: Property Profile Section + Wider Report Layout

## What
Add a comprehensive "Objekto profilis" (Property Profile) section at the top of the report page, before the Block-1 thermal section. This section displays all available property information from NTR, EPC, and internal sources in a structured, scannable layout. Also widen the report content from the current max-width to use more of the available screen space.

## Why / Context
The report currently jumps straight to the thermal comfort analysis. A property buyer or renter first wants to see: what exactly is this property? When was it built? What materials? How big? What's the energy class? The profile section establishes the property's identity and key characteristics before diving into the thermal assessment. This data comes from NTR, PENS (EPC), and our internal reference tables — most of it is already in the `inputs_snapshot` or `ResolvedProperty`.

## How

### 1. Widen the report layout

In `ReportViewer.tsx`, change the max-width of the main content container:
- **Current:** `max-w-[800px]` (or similar narrow constraint)
- **New:** `max-w-[1100px]`

This uses the same 1100–1200px content width as the main NTD landing page. The report is a data document, not a narrow article — it benefits from the extra space, especially for the property profile grid and the winter/summer tables.

### 2. Add the Property Profile section

Insert a new section between the PropertyIdentity header and the Block-1 section. Title: **"Objekto profilis"**.

Layout: **Two-column grid of key-value pairs** inside a white card. Each item is a label (small, grey) + value (normal weight, dark). Group related items visually.

### 3. Property Profile fields

Organise into groups. Show a field only if the value is available (non-null). If a group has no available fields, hide the entire group.

**Group 1: Identifikavimas (Identification)**
| Field | Label (LT) | Source | Mock value |
|---|---|---|---|
| address | Adresas | resolver | Vilnius, Žirmūnų g. 12 |
| ntr_unique_number | Unikalus NTR numeris | resolver | 4400-1234-5678 |
| municipality | Savivaldybė | resolver | Vilniaus m. sav. |
| cadastral_ref | Kadastro numeris | NTR (future) | null (hide) |

**Group 2: Pastato charakteristikos (Building characteristics)**
| Field | Label (LT) | Source | Mock value |
|---|---|---|---|
| purpose | Paskirtis | NTR / resolver | Gyvenamoji |
| premises_type | Tipas | NTR / resolver | Daugiabutis namas |
| usage_group_label | Naudojimo grupė (STR 2.01.02) | internal CSV | Gyvenamieji daugiabučiai pastatai |
| year_built | Statybos metai | NTR / resolver | 1985 |
| floors | Aukštų skaičius | NTR (future) | 5 |
| total_area_m2 | Bendras plotas | NTR / resolver | 68.5 m² |
| heated_area_m2 | Šildomas plotas | NTR / resolver | 62.0 m² |
| wall_material | Sienų medžiaga | NTR (future) | Gelžbetonio plokštės |
| heating_type | Šildymo tipas | NTR / resolver | Centrinis šildymas |
| ventilation_type | Ventiliacijos tipas | snapshot | Natūrali ventiliacija |

**Group 3: Energinis naudingumas (Energy performance)**
| Field | Label (LT) | Source | Mock value |
|---|---|---|---|
| energy_class | Energinė klasė | PENS / user | C |
| epc_kwhm2_year | Energijos sąnaudos | PENS / user | 120 kWh/m² per metus |
| epc_source | Duomenų šaltinis | computed | Registras (PENS) |
| epc_confidence | Duomenų patikimumas | computed | Vidutinis |
| glazing_percent | Langų dalis fasade | typology CSV | ~20% (pagal tipologiją) |
| glazing_source | Langų duomenų šaltinis | computed | Statybos periodo ir tipo numatytoji reikšmė |

**Group 4: Namų ūkio komplektas (Household bundle)**
| Field | Label (LT) | Source | Mock value |
|---|---|---|---|
| primary_object | Vertinamas objektas | resolver | Gyvenamasis pastatas (šildomas) |
| bundle_items | Komplekte taip pat yra | resolver | garažas, sandėliukas |
| evaluation_target | Vertinimo tipas | computed | Esamas pastatas |

### 4. Visual design

**Card layout:**
- White card with rounded corners (same as other report cards)
- Title: "Objekto profilis" (section heading, navy, same size as "1) Šiluminis komfortas")
- Content: CSS grid, 2 columns on desktop, 1 column on mobile
- Each field: label above (13px, text-slate-500), value below (16px, text-slate-900, font-medium)
- Group headers: small uppercase labels (12px, text-slate-400, tracking-wide) with subtle bottom border
- Null/unavailable fields: completely hidden (not "Nežinoma")

**Energy class badge:**
- If energy_class is available, show it as a colored badge (like EPC certificates):
  - A++/A+/A: green (#059669)
  - B: light green (#16a34a)
  - C: yellow (#ca8a04)
  - D: orange (#ea580c)
  - E/F/G: red (#dc2626)
- Badge: rounded, bold letter, colored background, white text
- Placed next to the energy class label, not as a separate row

**Special case: land-only**
- Show only Group 1 (Identification) + Group 4 (Bundle) with `evaluation_target = "Žemės sklypas"`
- Groups 2 and 3 hidden entirely (no building characteristics for land)

### 5. Update mock data

In `src/components/report/mockReportData.ts`, extend the `ReportData` interface and both mock datasets:

Add to `ReportData`:
```typescript
property_profile: {
  purpose: string | null;
  premises_type: string | null;
  usage_group_label: string | null;
  year_built: number | null;
  floors: number | null;
  total_area_m2: number | null;
  heated_area_m2: number | null;
  wall_material: string | null;
  heating_type: string | null;
  ventilation_type: string | null;
  energy_class: string | null;
  epc_kwhm2_year: number | null;
  epc_source: string | null;
  epc_confidence: string | null;
  glazing_percent: number | null;
  glazing_source: string | null;
  cadastral_ref: string | null;
  evaluation_target: string;
};
```

**MOCK_EXISTING** property_profile:
```typescript
{
  purpose: "Gyvenamoji",
  premises_type: "Daugiabutis namas",
  usage_group_label: "Gyvenamieji daugiabučiai pastatai",
  year_built: 1985,
  floors: 5,
  total_area_m2: 68.5,
  heated_area_m2: 62.0,
  wall_material: "Gelžbetonio plokštės",
  heating_type: "Centrinis šildymas",
  ventilation_type: "Natūrali ventiliacija",
  energy_class: "C",
  epc_kwhm2_year: 120,
  epc_source: "Registras (PENS)",
  epc_confidence: "Vidutinis",
  glazing_percent: 20,
  glazing_source: "Statybos periodo ir tipo numatytoji reikšmė",
  cadastral_ref: null,
  evaluation_target: "Esamas pastatas"
}
```

**MOCK_LAND_ONLY** property_profile:
```typescript
{
  purpose: null,
  premises_type: null,
  usage_group_label: null,
  year_built: null,
  floors: null,
  total_area_m2: null,
  heated_area_m2: null,
  wall_material: null,
  heating_type: null,
  ventilation_type: null,
  energy_class: null,
  epc_kwhm2_year: null,
  epc_source: null,
  epc_confidence: null,
  glazing_percent: null,
  glazing_source: null,
  cadastral_ref: null,
  evaluation_target: "Žemės sklypas"
}
```

### 6. Component structure

Create a new component:
- File: `src/components/report/PropertyProfile.tsx`
- Props: `{ profile: ReportData['property_profile'], bundleItems: { kind: string }[] }`
- Renders the grouped grid layout described in §4
- Imported and rendered in `ReportViewer.tsx` between the header and Block-1 section

### 7. Section order in ReportViewer (updated)

1. ReportHeader (NTD logo bar + PDF button)
2. PropertyIdentity (address, NTR, date — compact bar)
3. **PropertyProfile** ← NEW (full property characteristics grid)
4. Block1Section (thermal comfort analysis)
5. LockedBlocksPreview (Blocks 2–8 teasers)
6. ReportFooter

## Constraints
- Do NOT change the backend — this is frontend-only, using mock data
- Fields with null values must be completely hidden, not shown as "—" or "Nežinoma"
- Land-only case shows minimal profile (identification + evaluation target only)
- The energy class badge colors are the only non-NTD-palette colors allowed (they follow the standard European EPC certificate coloring)
- All labels must be in Lithuanian
- All 38 existing frontend tests must pass
- Astro build must succeed

## Files to touch
- `src/components/ReportViewer.tsx` — widen max-width, add PropertyProfile
- `src/components/report/PropertyProfile.tsx` — NEW: property profile component
- `src/components/report/mockReportData.ts` — extend interface + mock data

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # check /report/dev-existing and /report/dev-land
```

## Visual QA
- `/report/dev-existing`: PropertyProfile shows all fields in 2-column grid, energy class C in yellow badge, wall material "Gelžbetonio plokštės", 5 floors, etc. Block-1 section follows below.
- `/report/dev-land`: PropertyProfile shows only identification (address, NTR, municipality) + evaluation target "Žemės sklypas". No building characteristics, no energy section.
- Resize to mobile (375px): grid collapses to single column, all content readable without horizontal scroll.