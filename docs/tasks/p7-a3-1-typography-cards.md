# P7-A3.1: Report Typography Alignment + Property Profile Card Separation

## What
Two changes to the interactive report page:
1. **Typography:** Scale up all text in the report to match the NTD website's type system
2. **Card layout:** Split the single "Objekto profilis" card into separate cards per group

## Why / Context
The report page currently uses much smaller text than the main website. A visitor who browses ntd.lt and then opens their report sees a jarring mismatch — the report feels like a different product. The website uses a generous, institutional type scale (h1=49px, h2=32px, body=16px); the report uses a compact scale (h1=22px, h2=18px, body=14px). They should feel like the same product.

The property profile currently shows all groups (Pastato charakteristikos, Energinis naudingumas, Namų ūkio komplektas) inside a single card. Splitting them into separate cards gives each group visual breathing room and makes the page scan better.

## How

### 1. Typography scale-up

Apply these changes across `ReportViewer.tsx`, `PropertyProfile.tsx`, and any sub-components:

**Target type scale for the report:**

| Element | Current | Target | Tailwind class |
|---|---|---|---|
| Property address (h1) | text-xl (22px) or similar | **text-3xl** (~30px) | `text-3xl font-semibold` |
| Section titles (h2) — "Objekto profilis", "1) Šiluminis komfortas" | text-lg (18px) | **text-2xl** (~24px) | `text-2xl font-semibold` |
| Sub-section titles (h3) — "Žiemos šiluminis komfortas", "Vasaros perkaitimo rizika" | text-[15px] | **text-lg** (~18px) | `text-lg font-semibold` |
| Body text / paragraphs | text-sm (14px) | **text-base** (16px) | `text-base` |
| Property profile labels | text-xs (13px) | **text-sm** (14px) | `text-sm text-slate-500` |
| Property profile values | text-sm (14px) | **text-base** (16px) | `text-base font-medium` |
| Group headers (PASTATO CHARAKTERISTIKOS) | text-xs (12px) | **text-xs** (12px) — keep as is | `text-xs uppercase tracking-wide text-slate-400` |
| Driver tag text | whatever current | **text-sm** (14px) | `text-sm` |
| Info box items | whatever current | **text-sm** (14px) | `text-sm` |
| Winter/summer row band names | whatever current | **text-base** (16px) | `text-base` |
| Winter/summer expanded description | whatever current | **text-sm** (14px) | `text-sm text-slate-600` |
| NTR, municipality, date | whatever current | **text-base** (16px) | `text-base text-slate-500` |
| Bundle note | whatever current | **text-sm** (14px) | `text-sm text-slate-600` |
| Footer text | whatever current | **text-sm** (14px) | `text-sm text-slate-400` |
| Locked block titles | whatever current | **text-base** (16px) | `text-base text-slate-400` |
| Locked block subtitles | whatever current | **text-sm** (14px) | `text-sm text-slate-300` |

**Key principle:** Body text = `text-base` (16px) everywhere. This matches the website's body text. Headings scale proportionally above that. Small/secondary text uses `text-sm` (14px). Nothing smaller than 12px.

**Font weight:** Use `font-semibold` (600) for headings — matches the website's heading weight. The website does NOT use `font-bold` (700) for headings.

**Line height:** Let Tailwind defaults handle it. The website uses generous line heights (1.5× for body). Ensure no `leading-tight` or `leading-none` classes are on body text.

**Color:** Ensure heading color is `text-[#1E3A5F]` (navy) — same as website headings. Body text should be `text-slate-700` or `text-[#1A1A2E]` — same as website body.

### 2. Split PropertyProfile into separate cards

Currently in `PropertyProfile.tsx`:
```
<div class="card"> <!-- single card -->
  <h2>Objekto profilis</h2>
  <Group: PASTATO CHARAKTERISTIKOS>
  <Group: ENERGINIS NAUDINGUMAS>
  <Group: NAMŲ ŪKIO KOMPLEKTAS>
</div>
```

Change to:
```
<!-- No wrapper "Objekto profilis" title — each card is self-titled -->

<div class="card"> <!-- Card 1 -->
  <h2>Pastato charakteristikos</h2>
  <!-- two-column grid of fields -->
</div>

<div class="card"> <!-- Card 2 -->
  <h2>Energinis naudingumas</h2>
  <!-- two-column grid with EPC badge -->
</div>

<div class="card"> <!-- Card 3 -->
  <h2>Namų ūkio komplektas</h2>
  <!-- evaluation target + bundle items -->
</div>
```

- Remove the "Objekto profilis" wrapper heading
- Each group becomes its own white card (`bg-white rounded-xl shadow-sm p-6`)
- Remove the group sub-headers (PASTATO CHARAKTERISTIKOS in uppercase) — they're now redundant since each card has its own h2 title
- The h2 title on each card uses the same navy color as section titles
- Cards have the same gap between them as between other report sections
- If a group has no available fields (all null), hide the entire card
- Land-only: only show "Namų ūkio komplektas" card (others hidden since all building fields are null)

### 3. Section spacing

Ensure consistent vertical spacing between all report sections:
- Between header and first card: `mt-6` or `mt-8`
- Between cards: `space-y-6` or `gap-6`
- Between the last profile card and Block-1 section: same gap

## Constraints
- Do NOT change the data shape or mock data — only visual/layout changes
- Do NOT change the interactive behavior (expand/collapse, tooltips)
- All 38 tests must pass
- Astro build must succeed
- The report should feel like a natural extension of the ntd.lt website

## Files to touch
- `src/components/ReportViewer.tsx` — typography classes throughout
- `src/components/report/PropertyProfile.tsx` — split into separate cards, update typography

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # visual QA at /report/dev-existing and /report/dev-land
```

## Visual QA checklist
- [ ] Address heading is visually prominent (≥28px)
- [ ] Section titles ("1) Šiluminis komfortas") feel the same weight as website h2s
- [ ] Body text is 16px — readable, not cramped
- [ ] Property profile is 3 separate white cards (or 1 for land-only)
- [ ] No "Objekto profilis" wrapper title — each card is self-titled
- [ ] EPC badge still renders correctly in the Energinis naudingumas card
- [ ] Consistent vertical spacing between all sections
- [ ] Overall page feels like the same product as ntd.lt