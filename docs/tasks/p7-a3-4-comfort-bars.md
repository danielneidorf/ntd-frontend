# P7-A3.4: EPC-Style Comfort Rating Bars

## What
Replace the current inline text segments (Gerai / ✓Vidutiniškai / Silpnai) with EPC-certificate-style stacked colored bars — the same visual language Lithuanian property buyers already recognize from energy performance certificates. Each bar has 5 levels (A–E) with ascending width, colored green→red, and an arrow marker showing "Jūsų pastatas" (Your building) at the property's level.

## Why / Context
The current text-based segments look like radio buttons, not results. The EPC-style bars are:
1. **Instantly recognizable** — Lithuanian buyers see this format on every PENS energy certificate
2. **More granular** — 5 levels instead of 3 gives more context about where the property falls
3. **Visually impactful** — color + width + arrow creates an immediate "how good is this?" signal
4. **Self-explanatory** — the widening bars create a "narrower = better" metaphor without needing text

## How

### 1. Create ComfortBar component

File: `src/components/report/ComfortBar.tsx`

Props:
```typescript
{
  title: string;                    // "Žiemos komfortas" or "Vasaros perkaitimo rizika"
  activeLevel: 'A' | 'B' | 'C' | 'D' | 'E';
  levels: {
    key: string;                    // 'A', 'B', 'C', 'D', 'E'
    label: string;                  // e.g. "Puikiai", "Gerai", "Vidutiniškai", "Silpnai", "Labai silpnai"
    color: string;                  // hex color
    width: string;                  // Tailwind width or percentage
  }[];
  description: string;              // expanded explanation text
}
```

### 2. Visual design — EPC-style stacked bars

Each bar is a horizontal colored rectangle with ascending width from A (shortest) to E (longest). The active level has a right-pointing arrow marker and "Jūsų pastatas" label:

```
  ┌──────────────┐
  │ A — Puikiai   │
  ├──────────────────┐
  │ B — Gerai        │
  ├──────────────────────┐
  │ C — Vidutiniškai     │◄── Jūsų pastatas
  ├──────────────────────────┐
  │ D — Silpnai              │
  ├──────────────────────────────┐
  │ E — Labai silpnai            │
  └──────────────────────────────┘
```

**Bar styling:**
- Each bar: rounded left corners (`rounded-l-md`), flat right edge
- 2px vertical gap between bars
- Height: 28–32px per bar
- Width progression: A=45%, B=60%, C=75%, D=87%, E=100% of available space
- Text inside bar: white, 12px, font-medium, left-aligned with padding
- Active bar: slightly taller (34px) or same height with the arrow indicator

**Color scheme (matches European EPC certificate colors):**
| Level | Winter label | Summer label | Color |
|---|---|---|---|
| A | Puikiai | Minimali | #059669 (emerald green) |
| B | Gerai | Maža | #16a34a (green) |
| C | Vidutiniškai | Vidutinė | #ca8a04 (amber) |
| D | Silpnai | Didelė | #ea580c (orange) |
| E | Labai silpnai | Kritinė | #dc2626 (red) |

**Active level indicator:**
- A right-pointing triangle (▶) attached to the right edge of the active bar
- "Jūsų pastatas" label text to the right of the arrow, in `text-sm font-medium text-slate-900`
- Non-active bars: slightly dimmed (opacity-80 or no change — test visually)

### 3. Mapping backend levels to 5-level display

The backend currently outputs 3 levels. Map to the 5-level visual:

**Winter:**
| Backend level | Display level |
|---|---|
| `GOOD` | **B** — "Gerai" |
| `INTERMEDIATE` | **C** — "Vidutiniškai" |
| `WEAK` | **D** — "Silpnai" |

**Summer:**
| Backend level | Display level |
|---|---|
| `LOW` | **B** — "Maža" |
| `MEDIUM` | **C** — "Vidutinė" |
| `HIGH` | **D** — "Didelė" |

Levels A and E are shown in the bar (for context — the full scale is visible) but are not currently used by the backend. When the backend gains finer granularity (future phase), the component is already ready.

Note: mapping GOOD→B (not A) and WEAK→D (not E) is intentional. A and E are reserved for exceptional cases — this avoids implying a property is "perfect" or "catastrophic" with only 3 data points.

### 4. Update mock data

In `mockReportData.ts`, the existing `winter.level` and `summer.risk_level` fields already contain the values needed. The ComfortBar component maps them internally.

For MOCK_EXISTING:
- Winter: `level: 'INTERMEDIATE'` → displays as C bar highlighted
- Summer: `risk_level: 'MEDIUM'` → displays as C bar highlighted

### 5. Layout — two columns

Keep the current two-column layout (winter left, summer right):

```
┌─────────────────────────────────────────────────────────┐
│ (tinted background area)                                 │
│                                                          │
│  Žiemos komfortas          Vasaros perkaitimo rizika     │
│  ┌──────────┐              ┌──────────┐                  │
│  │A Puikiai  │             │A Minimali │                  │
│  ├─────────────┐           ├─────────────┐               │
│  │B Gerai      │           │B Maža       │               │
│  ├────────────────┐        ├────────────────┐            │
│  │C Vidutiniškai  │◄       │C Vidutinė     │◄            │
│  ├───────────────────┐     ├───────────────────┐         │
│  │D Silpnai          │     │D Didelė          │         │
│  ├──────────────────────┐  ├──────────────────────┐     │
│  │E Labai silpnai       │  │E Kritinė            │     │
│  └──────────────────────┘  └──────────────────────┘     │
│                                                          │
│  description text...       description text...           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

The tinted background (from the previous visual emphasis spec) wraps both columns. On mobile (<640px), stack to single column.

### 6. Description text below bars

Below each bar chart, show the expanded description (currently the click-to-expand text). Since we agreed all sections should be open by default, this text is always visible:

- `text-sm text-slate-600`
- 12px top margin below the bars
- Same text as currently in the expanded row descriptions

### 7. Remove the old inline segments

The old `[Gerai] [✓Vidutiniškai] [Silpnai]` inline segments are fully replaced. Remove them. The ComfortBar component is the new visual.

## Constraints
- Do NOT change the backend — the 3-level mapping to 5-level display happens in the frontend
- The component must handle all 3 backend winter levels (GOOD, INTERMEDIATE, WEAK) and all 3 summer levels (LOW, MEDIUM, HIGH)
- Colors must be hardcoded (not CSS variables) since they represent a fixed scale — same in light and dark mode
- All 38 tests must pass, build must succeed
- Responsive: two columns on desktop, single column on mobile

## Files to touch
- `src/components/report/ComfortBar.tsx` — NEW
- `src/components/ReportViewer.tsx` — replace old inline segments with ComfortBar components
- Remove or refactor whatever sub-component currently renders the inline segments

## Run after
```bash
cd ~/dev/ntd
npm run build
npm test
npm run dev    # visual QA at /report/dev-existing
```

## Visual QA
- [ ] Winter bars: 5 colored bars (A–E), ascending width, C highlighted with arrow + "Jūsų pastatas"
- [ ] Summer bars: 5 colored bars (A–E), ascending width, C highlighted with arrow + "Jūsų pastatas"
- [ ] Two columns on desktop, single column on mobile
- [ ] Tinted background wraps both bar charts
- [ ] Description text visible below each bar chart
- [ ] Old inline text segments fully removed
- [ ] Colors match the EPC certificate palette (green → amber → red)
- [ ] Non-active bars are visible but clearly secondary to the active bar