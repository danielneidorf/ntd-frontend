# P7-A6: "Papildomi dokumentai" Links Section

## What
Add a "Papildomi dokumentai ir šaltiniai" section to the interactive report, between the Block-1 card and the locked blocks preview. This is a card with direct links to official Lithuanian data sources where the customer can find additional information about their property — floor plans, construction permits, planning documents, cadastral maps.

## Why / Context
The report can't include everything — floor plans require owner authorization, construction drawings are access-restricted, zoning data needs separate tooling. But we can **point the customer directly to the right place**. This turns NTD into a guide, not just a data product. A buyer who sees these links thinks: "NTD knows the Lithuanian data ecosystem and is helping me navigate it."

## How

### 1. Create the component

File: `src/components/report/AdditionalDocuments.tsx`

Props: `{ address: string }`

The component renders a white card with the section title and a vertical list of links. Each link has: an external link icon (↗ or use Lucide `ExternalLink`), a bold label, and a one-line grey helper text.

### 2. Links (in this order)

**Link 1: RC Savitarna — floor plans and cadastral files**
- Label: `Kadastro duomenų byla ir aukštų planai`
- Helper: `Savininkai gali užsisakyti detalų aukštų planą, eksplikaciją ir kadastro bylą. Kaina: 0,58–9,27 €. Pristatoma per 1 d. d.`
- URL: `https://www.registrucentras.lt/savitarna`
- Note: This is the highest-value link — it's the only way to get floor plans.

**Link 2: REGIA — cadastral map**
- Label: `Kadastro žemėlapis (REGIA)`
- Helper: `Žemės sklypų ribos, pastatų kontūrai ir adresai interaktyviame žemėlapyje.`
- URL: `https://www.regia.lt/lt/zemelapis/`
- Note: Free public preview. Could potentially deep-link with coordinates in future.

**Link 3: Infostatyba — construction permits**
- Label: `Statybos leidimai (Infostatyba)`
- Helper: `Statybos leidimai, projektiniai pasiūlymai ir statybos dokumentacija šiuo adresu.`
- URL: `https://infostatyba.planuojustatau.lt/`
- Note: Static link for now. Deep-linking with address may be possible but needs URL format research.

**Link 4: TPDR — territorial planning**
- Label: `Teritorijų planavimo dokumentai`
- Helper: `Detalieji ir bendrieji planai, specialieji planai, žemėtvarkos projektai.`
- URL: `https://external.tpdr.lt/?formId=tpsearch`

**Link 5: NTR search — registry data**
- Label: `Nekilnojamojo turto registras`
- Helper: `Viešai prieinami registro duomenys apie nekilnojamąjį turtą.`
- URL: `https://www.registrucentras.lt/ntr/`

### 3. Visual design

- White card (`bg-white rounded-xl shadow-sm p-6`), same style as other report cards
- Section title: **"Papildomi dokumentai ir šaltiniai"** in navy, same size as other card titles (h2)
- Each link item:
  - Row layout: icon (left) + text block (right)
  - Icon: small external link icon in teal (`text-[#0D7377]`), 16×16px
  - Label: `text-base font-medium text-[#1E3A5F]` — clickable, underline on hover
  - Helper: `text-sm text-slate-500` — below the label, not clickable
  - Vertical spacing between items: `space-y-4`
- All links open in a new tab (`target="_blank" rel="noopener noreferrer"`)
- No card borders between items — clean vertical list with generous spacing

### 4. Section order in ReportViewer (updated)

1. ReportHeader
2. PropertyIdentity (with bundle info)
3. Pastato charakteristikos card
4. Energinis naudingumas card
5. Block-1: Vidaus patalpų klimato komfortas
6. **Papildomi dokumentai ir šaltiniai** ← NEW
7. Locked blocks preview (2–5)
8. Citations ("Šaltiniai")
9. ReportFooter

### 5. Land-only case

Show all 5 links — they're all useful for land plots too (cadastral map for parcel boundaries, NTR for registry data, TPDR for zoning). The Savitarna link's helper text is still relevant (owners can order cadastral files for land plots).

## Constraints
- Frontend-only — no backend changes
- All links are static URLs (no dynamic deep-linking with address for now)
- All links open in new tab
- Do NOT add any `fetch` calls or API integrations — this is purely a list of links
- All 38 tests must pass, build must succeed

## Files to touch
- `src/components/report/AdditionalDocuments.tsx` — NEW
- `src/components/ReportViewer.tsx` — import and render between Block-1 and locked blocks

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # check /report/dev-existing and /report/dev-land
```

## Visual QA
- [ ] "Papildomi dokumentai ir šaltiniai" card visible between Block-1 and locked blocks
- [ ] 5 links with external link icons, bold labels, grey helper text
- [ ] All links open in new tab
- [ ] Links are clickable and go to the correct URLs
- [ ] Card styling matches other report cards (white, rounded, shadow)
- [ ] Land-only shows the same 5 links