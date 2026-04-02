# P7-A3.3: Citations Section ("Šaltiniai") — LST ISO 690

## What
Add a "Šaltiniai" (Sources) section at the bottom of the interactive report, before the footer. Lists every data source used to create this specific report, formatted according to the LST ISO 690 Lithuanian national citation standard. The list is dynamic — only sources actually used for this property appear.

## Why / Context
Citations lend credibility to the report for three audiences: property buyers (trust that data comes from official sources), professionals (brokers, notaries who can reference the report), and academics (the reports become citable artifacts with traceable methodology). This is low-cost to build but fundamentally changes how the product is perceived — from "trust us" to "here's exactly where this data comes from."

Critically, citations show **what data came from where** without revealing **how we score and weight it**. The inner calculation logic stays proprietary; the data provenance becomes transparent.

## How

### 1. Create Citations component

File: `src/components/report/Citations.tsx`

Props: `{ snapshot: ReportData['block1']['inputs_snapshot'], generatedAt: string }`

The component builds a numbered citation list based on which sources were used, determined by inspecting the snapshot fields.

### 2. Citation format: LST ISO 690

LST ISO 690 is the Lithuanian national standard for bibliographic references (adopted from ISO 690 by Lietuvos standartizacijos departamentas). It's the recommended default across all Lithuanian universities (VDU, KTU, Vilnius Tech, VU).

**Key formatting rules:**
- Organisation as author: UPPERCASE NAME
- Online resource indicator: `[interaktyvus]` after title
- Access date: `[žiūrėta YYYY-MM-DD]`
- URL prefix: `Prieiga per internetą:`
- Regulations: Ministry/body. Title. City, year.
- Journal articles: AUTHOR, Initials. Title. *Journal name*, year, vol., no. ISSN.
- Numbered references: [1], [2], etc.

### 3. Dynamic citation entries

Each citation is conditionally included based on snapshot data:

**[1] NTR — always included** (property identification always comes from NTR):
```
[1] VĮ REGISTRŲ CENTRAS. Nekilnojamojo turto registras: objekto
    duomenys [interaktyvus]. Vilnius: VĮ Registrų centras
    [žiūrėta {generatedAt date}]. Prieiga per internetą:
    https://www.registrucentras.lt
```

**[2] PENS — only if `epc_source_class === 'REGISTRY'`:**
```
[2] VĮ REGISTRŲ CENTRAS. Pastatų energinio naudingumo sertifikatų
    registras (PENS): energinio naudingumo sertifikatas [interaktyvus].
    Vilnius: VĮ Registrų centras [žiūrėta {generatedAt date}].
    Prieiga per internetą: https://www.registrucentras.lt
```

**[2 alt] Customer-supplied EPC — if `epc_source_class === 'USER'`:**
```
[2] Kliento pateikti duomenys: energinė klasė ir (arba) metinės
    energijos sąnaudos. Pateikta užsakymo metu, {generatedAt date}.
```

**[N] STR — always included** (usage group classification):
```
[N] Lietuvos Respublikos aplinkos ministerija. Statybos techninis
    reglamentas STR 2.01.02:2016 „Pastatų energinio naudingumo
    projektavimas ir sertifikavimas". Vilnius, 2016.
```

**[N] EPC studies — only if `glazing_source` contains "numatytoji" or "tipolog"` (glazing typology defaults were used):**
```
[N] BIEKŠA, D., ŠIUPŠINSKAS, G., MARTINAITIS, V. ir JARAMINIENĖ, E.
    Energy Efficiency Challenges in Multi-Apartment Building Renovation
    in Lithuania. Energies, 2024, t. 17, Nr. 3. ISSN 1996-1073.

[N] MALŪNAVIČIŪTĖ, R., et al. Analysis of Energy Performance
    Certificates for Single-Family and Duplex Residential Buildings
    in Lithuania. 2023.

[N] PUPEIKIS, D., MONSTVILAS, E. ir BIEKŠA, D. Analysis of Improvement
    in the Energy Efficiency of Office Buildings Based on Energy
    Performance Certificates. Buildings, 2024, t. 14, Nr. 9.
    ISSN 2075-5309.
```

**[N] NTD baseline — always included:**
```
[N] NT DUOMENYS. Vidaus klimato etalono bazė v2026.1: lyginamieji
    parametrai pagal pastato tipą ir statybos laikotarpį. Vilnius:
    NT Duomenys, 2026.
```

### 4. Conditional logic summary

| Citation | Condition | Mock existing | Mock land-only |
|---|---|---|---|
| NTR | Always | ✅ | ✅ |
| PENS registry | `epc_source_class === 'REGISTRY'` | ✅ | ❌ |
| Customer EPC | `epc_source_class === 'USER'` | ❌ | ❌ |
| STR 2.01.02 | Always (heated buildings) | ✅ | ❌ |
| EPC studies (3) | `glazing_source` contains "numatytoji" or "tipolog" | ✅ | ❌ |
| NTD baseline | Always | ✅ | ✅ |

For the mock existing property: 7 citations (NTR + PENS + STR + 3 EPC studies + NTD baseline).
For the mock land-only property: 2 citations (NTR + NTD baseline).

### 5. Visual design

- Position: below the locked blocks preview, before the footer
- Section title: **"Šaltiniai"** in navy (`text-[#1E3A5F] text-xl font-semibold`)
- Subtle grey top border separating from the content above
- Each citation: numbered `[1]`, `[2]`, etc.
- Text: `text-sm text-slate-600` (slightly smaller than body — this is reference material)
- Hanging indent: first line flush, continuation lines indented (~24px)
- No card wrapper — just a flat section with the grey top border
- Compact vertical spacing between citations (`mb-3`)

### 6. Section order in ReportViewer (updated)

1. ReportHeader
2. PropertyIdentity (with bundle info)
3. Pastato charakteristikos card
4. Energinis naudingumas card
5. Block-1: Vidaus patalpų klimato komfortas
6. Locked blocks preview (2–5)
7. **Citations ("Šaltiniai")** ← NEW
8. ReportFooter

## Constraints
- Do NOT change any existing components or layout — only add the new Citations component
- Citations must be dynamic — only show sources that were actually used
- Do NOT reveal any scoring methodology, weights, or calculation formulas in the citations
- Use LST ISO 690 formatting exactly (UPPERCASE authors, [interaktyvus], [žiūrėta ...], etc.)
- Numbers auto-increment — if PENS is skipped, STR becomes [2] not [3]
- All 38 tests must pass, build must succeed

## Files to touch
- `src/components/report/Citations.tsx` — NEW
- `src/components/ReportViewer.tsx` — import and render Citations before footer

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # check /report/dev-existing (7 citations) and /report/dev-land (2 citations)
```

## Visual QA
- [ ] "Šaltiniai" section visible between locked blocks and footer
- [ ] dev-existing shows 7 numbered citations
- [ ] dev-land shows only 2 citations (NTR + NTD baseline)
- [ ] Citations use LST ISO 690 format (UPPERCASE org names, [interaktyvus], [žiūrėta ...])
- [ ] No calculation methodology or scoring logic exposed in citations
- [ ] Hanging indent on multi-line citations
- [ ] Numbers are sequential with no gaps