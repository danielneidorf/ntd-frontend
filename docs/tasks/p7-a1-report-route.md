# P7-A1: Interactive Report Page — Astro Route + ReportViewer Shell

## What
Create an Astro dynamic route at `/report/[token]` that renders a React island `ReportViewer.tsx`. The component fetches report data from the backend API and renders the Block-1 interactive report. For now, include a dev mock so the page can be developed and tested before the backend endpoint (P7-D) exists.

## Why / Context
Phase 7's core deliverable is an interactive HTML report at `ntd.lt/report/[token]` instead of a static PDF. This replaces the traditional email-attached PDF with a living web page. The customer receives a link in their email, clicks it, and sees their thermal comfort data rendered interactively.

This is the frontend shell — the visual container. It needs to work with mock data now and real API data later (when P7-D wires the backend).

## How

### 1. Create the Astro dynamic route

File: `src/pages/report/[token].astro`

```astro
---
// No SSR needed — Astro generates a client-side route
// The token is read client-side by the React component
---
<html lang="lt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>NTD Ataskaita</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body class="bg-[#FAFBFC] min-h-screen">
  <ReportViewer client:load />
</body>
</html>
```

Import the ReportViewer component at the top. The component reads the token from `window.location.pathname` client-side (Astro static build doesn't have server-side params for React islands).

### 2. Create the ReportViewer React component

File: `src/components/ReportViewer.tsx`

**State machine:**
```
loading → loaded | error | not_found
```

**On mount:**
1. Extract token from URL: `window.location.pathname.split('/report/')[1]`
2. If no token → show error
3. Fetch: `GET ${API_BASE}/v1/reports/${token}`
4. On 200 → `loaded` state, render report
5. On 404 → `not_found` state
6. On error → `error` state

**Dev mock bypass:**
If token starts with `dev-` (e.g. `/report/dev-existing` or `/report/dev-land`), skip the API call and use hardcoded mock data. This follows the same pattern as QuickScanFlow.tsx's `?step=` dev params.

### 3. Mock data shapes

Create a mock data module that ReportViewer imports when in dev mode:

File: `src/components/report/mockReportData.ts`

```typescript
export interface ReportData {
  address: string;
  ntr_unique_number: string | null;
  municipality: string;
  bundle_items: { kind: string; address?: string }[];
  generated_at: string;
  order_reference: string;
  block1: {
    applicable: boolean;             // false for land-only/unheated
    neutral_message_lt?: string;     // shown when applicable=false
    winter: {
      level: 'GOOD' | 'INTERMEDIATE' | 'WEAK';
      rows: {
        band: string;
        label_lt: string;
        description_lt: string;
        range_lt?: string;           // e.g. "~10–30 %"
        highlighted: boolean;
      }[];
    } | null;
    summer: {
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
      rows: {
        band: string;
        label_lt: string;
        description_lt: string;
        highlighted: boolean;
      }[];
    } | null;
    summary_lt: string;
    drivers: {
      key: string;
      label_lt: string;
      explanation_lt: string;
      active: boolean;
      direction: 'positive' | 'negative';
    }[];
    info_box: {
      items_lt: string[];
    };
    inputs_snapshot: {
      effective_energy_class: string | null;
      effective_epc_kwhm2_year: number | null;
      effective_year_built: number | null;
      glazing_share_percent: number | null;
      ventilation_type: string | null;
      epc_source_class: string;
      epc_confidence_level: string;
      evaluation_target: string;
      epc_plausibility?: string | null;
      epc_plausibility_note_lt?: string | null;
    };
  };
}
```

Provide two mock datasets:

**`MOCK_EXISTING`:** Vilnius, Žirmūnų g. 12, 1985 residential, class C, 120 kWh/m², winter=INTERMEDIATE, summer=MEDIUM, with garažas+sandėliukas in bundle.

**`MOCK_LAND_ONLY`:** Vilniaus r. sav., Sklypas prie kelio, applicable=false, neutral message only.

### 4. ReportViewer layout (component structure)

The component renders these sections in order:

**ReportHeader:**
- NTD logo bar (navy #1E3A5F): "NT Duomenys | ntd.lt"
- No main site navigation (report is standalone)
- Right side: "Atsisiųsti PDF" button (disabled for now — P7-C will wire it)

**PropertyIdentity:**
- Address (bold, large)
- NTR number, municipality (smaller, grey)
- Generated date + order reference (small)
- Bundle note if extras exist (D10 copy): "Šis blokas taikomas pagrindiniam šildomam pastatui šiame komplekte. Komplekte taip pat yra: [items]."

**Block1Section:** (the main content)
- Section title: "1) Šiluminis komfortas"
- Intro paragraph: "Šiame bloke apžvelgiame, kiek lengva šiame būste palaikyti komfortišką temperatūrą žiemą ir kokia yra perkaitimo rizika vasarą."
- WinterTable component (3 rows, highlighted row has teal-left-border + bold)
- SummerTable component (3 rows, same pattern)
- SummarySection: "Ką tai reiškia praktiškai?" — collapsible, default expanded
- DriversSection: active drivers shown as small tags/chips; click → tooltip with explanation_lt
- InfoBox: "Iš ko remiamės šiuo vertinimu?" — collapsible, default collapsed, grey background

**If `block1.applicable === false`:**
- Show only neutral message (D6): "Šiluminio komforto blokas taikomas tik šildomiems pastatams; šiam objektui šis vertinimas neskaičiuojamas."
- No tables, no drivers, no info box

**LockedBlocksPreview:**
- 4 greyed-out cards stacked below Block-1:
  - "2) Energijos sąnaudos — netrukus" 🔒
  - "3) 10 metų išlaidos — netrukus" 🔒
  - "4) Aplinkos tarša — netrukus" 🔒
  - "5) Teisinės rizikos — netrukus" 🔒
- Each: grey background, lock icon, "Šis blokas bus prieinamas vėliau."
- These are static — no data, no computation

**ReportFooter:**
- "Ataskaita sugeneruota: [date]. NT Duomenys | ntd.lt"
- "Klausimai? info@ntd.lt"

### 5. Styling guidelines

- Use Tailwind classes (same config as main site)
- Palette: #1E3A5F (navy headings), #0D7377 (teal accents/highlights), #FAFBFC (page bg), white (card bg)
- Font: Inter (already loaded via Google Fonts in main site)
- Max content width: 800px (narrower than landing page — report is a reading document)
- Cards: white bg, rounded-xl, subtle shadow, 24px padding
- Winter/summer tables: left border on highlighted row (4px solid teal), other rows opacity-60
- Responsive: single-column on mobile, max-width container on desktop
- No horizontal scroll on any viewport

### 6. Dev navigation

Add a new entry to the Dev ⚙️ dropdown in Header.astro (temporary, removed before launch):
- "Ataskaita (mock)" → `/report/dev-existing`
- "Ataskaita (žemė)" → `/report/dev-land`

### 7. Loading and error states

**Loading:** Centered spinner + "Kraunama ataskaita..." (same spinner style as QuickScanFlow resolver loading)

**Not found (404):** Card with message: "Ataskaita nerasta. Nuoroda gali būti netinkama arba pasibaigusi." + "Grįžti į pradžią" button → ntd.lt

**Error:** Card with message: "Nepavyko įkelti ataskaitos. Bandykite dar kartą." + "Bandyti dar kartą" button (reloads page)

## Constraints
- Do NOT create the backend endpoint (`/v1/reports/{token}`) — that's P7-D
- Do NOT implement the AI chat widget — that's P7-B
- Do NOT implement the PDF download — that's P7-C (the button should be visible but disabled/greyed)
- Use dev mock data (token starting with `dev-`) for all visual development
- The Astro build must still succeed (`npm run build`)
- All existing 38 frontend tests must pass
- The report page must NOT appear in any navigation or sitemap — it's only accessible via direct URL
- Lithuanian copy for winter/summer table rows comes from the Script Brief and Thermal Comfort annex — use the exact text from mock data, don't invent new copy

## Files to touch
- `src/pages/report/[token].astro` — NEW: Astro dynamic route
- `src/components/ReportViewer.tsx` — NEW: main report React component
- `src/components/report/mockReportData.ts` — NEW: mock data + TypeScript interface
- `src/components/Header.astro` — add dev links (temporary)

## Run after
```bash
cd ~/dev/ntd
npm run build    # verify Astro build succeeds
npm test         # verify 38 tests still pass
npm run dev      # open /report/dev-existing and /report/dev-land, visual QA
```

## Dev URLs for visual QA
- `http://localhost:4321/report/dev-existing` — full Block-1 report with winter/summer tables
- `http://localhost:4321/report/dev-land` — land-only neutral message
- `http://localhost:4321/report/invalid-token` — error state (API 404 or network error)