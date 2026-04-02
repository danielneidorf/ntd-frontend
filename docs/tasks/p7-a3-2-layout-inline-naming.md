# P7-A3.2: Layout Harmonisation, Inline Tables + Naming Change

## What
Three changes to the interactive report page:
1. **Komplektas card:** Widen and harmonise with the header area — reduce the dead space gap
2. **Winter/summer tables:** Change from vertical column to inline horizontal layout (three segments in a row)
3. **Naming:** Replace "Šiluminis komfortas" with "Vidaus patalpų klimato komfortas" everywhere in the report

## Why / Context
The current layout has two visual problems: (a) the small Komplektas card floats in the top-right leaving a large empty gap between the address header and the first full-width card; (b) the winter/summer band tables take up too much vertical space with each band on its own row. Making the bands inline (horizontal) makes the section more compact and scannable. The naming change reflects a broader framing — "indoor climate comfort" rather than just "thermal comfort."

## How

### 1. Komplektas card — widen and integrate

**Current:** The Komplektas card sits top-right, narrow (~250px), next to the address block. Big empty space below the address and above "Pastato charakteristikos."

**Target:** Make the Komplektas card **full-width** below the address identity block, as a horizontal bar rather than a small floating card. Layout:

```
┌──────────────────────────────────────────────────────────┐
│ Vilnius, Žirmūnų g. 12-5  (large heading)               │
│ NTR: 4400-1234-5678 · Vilniaus m. sav.                  │
│ Sugeneruota: 2026-04-01 · NTD-2026-0042                 │
├──────────────────────────────────────────────────────────┤
│ Vertinimo tipas: Esamas pastatas                         │
│ Komplekte taip pat yra: sandėliukas, garažas             │
└──────────────────────────────────────────────────────────┘
```

- Remove the separate Komplektas card entirely
- Merge the bundle info (evaluation target + bundle items) into the address/identity section as additional lines
- The identity section becomes a single cohesive block: address → NTR/municipality → date → evaluation target → bundle items
- Use slightly smaller/greyer text for the bundle items line (it's supplementary info, not a headline)
- This eliminates the dead space completely

**Alternative if the above looks too cramped:** keep it as a card but make it full-width directly below the address block (no side-by-side layout). Same content, just wider.

### 2. Winter/summer tables — inline horizontal layout

**Current:** Vertical stack — each band is a full-width row:
```
Gerai
✓ Vidutiniškai  [expanded description when clicked]
Silpnai
```

**Target:** Horizontal inline — three segments in a row:
```
┌─────────┬──────────────────┬─────────┐
│  Gerai  │ ✓ Vidutiniškai   │ Silpnai │
└─────────┴──────────────────┴─────────┘
```

Implementation:
- Three segments in a `flex` or `grid` row, equal width (or the highlighted one slightly wider)
- **Highlighted segment:** teal left border (4px) or teal background tint, bold text, checkmark icon
- **Dimmed segments:** lighter text (text-slate-400), no border accent
- **Click behavior preserved:** clicking the highlighted segment still expands the description below the entire row (as a full-width block beneath the three segments)
- **Responsive:** on mobile (<640px), stack vertically (current behavior) — only go horizontal on `sm:` and up

Apply the same pattern to both winter and summer tables.

**Sub-section titles also go inline:**

Current:
```
Žiemos vidaus klimato komfortas
[table]

Vasaros perkaitimo rizika
[table]
```

Target: Place both side by side if space allows:
```
┌─ Žiemos komfortas ──────────┬─ Vasaros perkaitimo rizika ──┐
│ [Gerai] [✓Vidut.] [Silpnai] │ [Maža] [✓Vidutinė] [Didelė]  │
└─────────────────────────────┴──────────────────────────────┘
```

Two columns on desktop (each with its title + inline segments). Single column on mobile. This halves the vertical space of the block.

### 3. Naming change: "Šiluminis komfortas" → "Vidaus patalpų klimato komfortas"

Replace everywhere in the report page:

| Current text | New text |
|---|---|
| `1) Šiluminis komfortas` | `1) Vidaus patalpų klimato komfortas` |
| `Šiame bloke apžvelgiame, kiek lengva šiame būste palaikyti komfortišką temperatūrą žiemą ir kokia yra perkaitimo rizika vasarą.` | Keep as is — this sentence doesn't use "šiluminis" |
| `Žiemos šiluminis komfortas` | `Žiemos komfortas` |
| Any other occurrence of "šiluminis komfortas" | Replace with "vidaus klimato komfortas" or "klimato komfortas" as appropriate |

Also update in mock data (`mockReportData.ts`) if the section title is stored there.

**Note:** Do NOT change the backend Block-1 model field names or the backend copy tables — this is frontend-only labeling for now. The backend still uses `thermal_comfort_proxy` internally.

## Constraints
- Do NOT change mock data shape (only label strings if stored in mock)
- Preserve all interactive behavior (click-to-expand on highlighted segment, driver tooltips, collapsible info box)
- **All helper/explanatory sections open by default on page load:**
  - "Ką tai reiškia praktiškai?" summary → expanded (▼)
  - "Iš ko remiamės šiuo vertinimu?" info box → expanded (▼)
  - Winter highlighted row description → expanded (visible below the inline segments)
  - Summer highlighted row description → expanded (visible below the inline segments)
  - All sections remain foldable (▼ → ► toggle), but initial state = open
  - Rationale: the customer paid for this report — show them the value immediately, don't hide it behind clicks
- Responsive: inline layout on desktop, stacked on mobile
- All 38 tests must pass
- Astro build must succeed

## Files to touch
- `src/components/ReportViewer.tsx` — merge Komplektas into identity section, update section title
- `src/components/report/PropertyProfile.tsx` — remove Komplektas card if it's a separate component
- Any winter/summer table sub-component — change to horizontal inline layout
- `src/components/report/mockReportData.ts` — update label strings if stored there

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # visual QA at /report/dev-existing
```

## Visual QA
- [ ] No dead space gap between address block and first card
- [ ] Bundle info (evaluation target + items) visible in the identity section, not a separate card
- [ ] Winter bands are inline (3 horizontal segments) on desktop
- [ ] Summer bands are inline (3 horizontal segments) on desktop
- [ ] Winter + summer side by side in two columns on desktop
- [ ] On mobile: stacks vertically
- [ ] Clicking highlighted segment still expands/collapses description below
- [ ] Section title reads "1) Vidaus patalpų klimato komfortas"
- [ ] No occurrence of "šiluminis komfortas" anywhere on the page
- [ ] All helper sections open by default on page load
- [ ] Collapse arrows (▼/►) still work to fold/unfold