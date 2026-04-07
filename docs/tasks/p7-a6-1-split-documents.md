# P7-A6.1: Split Additional Documents — Public vs Owner Access

## What
Split the "Papildomi dokumentai ir šaltiniai" section into two separate cards based on access level, and move both cards to the end of the report (after locked blocks, before the citations section). Update the B3 report tour narration accordingly.

## Why
Currently all 5 links are in one card with no indication of which ones require owner/institution login. A user clicking "Kadastro duomenų byla" gets a login wall at RC Savitarna — frustrating. Separating them into public vs restricted sets clear expectations.

## How

### 1. Split into two cards

**Card 1: "Vieši šaltiniai" (Public sources)** — anyone can access

| Link | Target | Description |
|---|---|---|
| Kadastro žemėlapis (REGIA) | regia.lt | Žemės sklypų ribos, pastatų kontūrai ir adresai interaktyviame žemėlapyje. |
| Statybos leidimai (Infostatyba) | planuojustatyti.lt | Statybos leidimai, projektiniai pasiūlymai ir statybos dokumentacija šiuo adresu. |
| Teritorijų planavimo dokumentai (TPDR) | tpdris.lt | Detalieji ir bendrieji planai, specialieji planai, žemėtvarkos projektai. |

**Card 2: "Savininko prieiga" (Owner / institution access)** — requires RC Savitarna login

| Link | Target | Description |
|---|---|---|
| Kadastro duomenų byla ir aukštų planai | RC Savitarna | Savininkai gali užsisakyti detalų aukštų planą, eksplikaciją ir kadastro bylą. Kaina: 0,58–9,27 €. Pristatoma per 1 d. d. |
| Nekilnojamojo turto registras | RC Savitarna | Išsamūs registro duomenys: savininkai, suvaržymai, sandorių istorija ir kita teisinė informacija. |

Card 2 header note (small text below the title):
"Šiems dokumentams reikalinga Registrų centro savitarnos paskyra (savininko arba įgalioto asmens prieiga)."

### 2. Move both cards to end of report

**Current report order:**
1. Street View hero
2. Property header
3. Pastato charakteristikos (map + profile)
4. Klimato komfortas (bars + drivers)
5. Statybos leidimai (Infostatyba)
6. **Papildomi dokumentai** ← currently here
7. Locked blocks (🔒)
8. Šaltiniai (citations)

**New order:**
1. Street View hero
2. Property header
3. Pastato charakteristikos (map + profile)
4. Klimato komfortas (bars + drivers)
5. Statybos leidimai (Infostatyba)
6. Locked blocks (🔒)
7. **Vieši šaltiniai** ← moved here
8. **Savininko prieiga** ← moved here
9. Šaltiniai (citations)

This positions the external links as a "go deeper yourself" section after all NTD analysis is complete, right before the formal citations. The flow is: NTD's analysis → upcoming blocks teaser → external resources → academic sources.

### 3. Visual design

Both cards use the same styling as the current AdditionalDocuments card. The only differences:

**Card 1 (Vieši šaltiniai):**
- Title: "Vieši šaltiniai"
- No special note
- Standard link list with ↗ icons

**Card 2 (Savininko prieiga):**
- Title: "Savininko prieiga"
- Subtitle note: "Šiems dokumentams reikalinga Registrų centro savitarnos paskyra (savininko arba įgalioto asmens prieiga)." in `text-xs text-slate-400` below the title
- Same link list with ↗ icons
- Optional: a small 🔒 icon next to the title or each link to visually signal restricted access

### 4. Update the report tour (B3)

The current B3 tour has one "documents" step. Replace it with two steps:

**Step 7 (was "documents"):** becomes "public-documents"
```typescript
{
  id: 'public-documents',
  selector: '[data-guide="public-documents"]',
  narration: 'Čia rasite viešai prieinamus šaltinius — kadastro žemėlapį, statybos leidimus ir teritorijų planavimo dokumentus. Viskas atvira ir prieinama be registracijos.',
}
```

**Step 8 (new):** "owner-documents"
```typescript
{
  id: 'owner-documents',
  selector: '[data-guide="owner-documents"]',
  narration: 'O šie dokumentai prieinami tik savininko arba įgalioto asmens prieiga per Registrų centro savitarną — kadastro byla, aukštų planai, išsamūs registro duomenys.',
}
```

The step formerly numbered 9 (locked-blocks) becomes step 7 (moved up since documents moved down), and the new document steps are 8 and 9.

**Updated step order:**
1. Street view + identity
2. Building profile
3. Identity + map
4. Climate assessment (skip land-only)
5. Drivers (skip land-only)
6. Permits (always show)
7. Locked blocks
8. Public documents (new position)
9. Owner documents (new position)

### 5. Update data-guide attributes

- Remove `data-guide="documents"` from the old single card
- Add `data-guide="public-documents"` to Card 1
- Add `data-guide="owner-documents"` to Card 2

## Constraints
- Both cards are always shown (not conditional)
- The NTR basic search link is NOT included in either card (removed per decision)
- The Infostatyba permits section higher in the report is unchanged — it shows permit details. The Infostatyba link in Card 1 is for the user to explore further.
- The locked blocks section moves above the document cards
- All tours (landing, QuickScan, report) must continue working
- All tests must pass, build must succeed

## Files to touch
- `src/components/report/AdditionalDocuments.tsx` — split into two cards, remove NTR link, add access note to Card 2
- `src/components/ReportViewer.tsx` — move both document cards below locked blocks, above citations
- `src/components/guide/tours/reportTour.ts` — update document steps (one → two), reorder step numbers
- Add `data-guide="public-documents"` and `data-guide="owner-documents"` to the new cards

## Visual QA
- [ ] Two separate cards visible at the bottom of the report (before citations)
- [ ] Card 1 "Vieši šaltiniai" has 3 links (REGIA, Infostatyba, TPDR)
- [ ] Card 2 "Savininko prieiga" has 2 links (Kadastro byla, NTR registras)
- [ ] Card 2 shows the access note below the title
- [ ] NTR basic search link is NOT present in either card
- [ ] Locked blocks section appears before the document cards
- [ ] Citations section appears after the document cards
- [ ] Report tour step 8 highlights Card 1 with public narration
- [ ] Report tour step 9 highlights Card 2 with owner narration
- [ ] All 3 public links open correct external URLs
- [ ] All 2 owner links open correct RC Savitarna URLs