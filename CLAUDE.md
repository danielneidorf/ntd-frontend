# CLAUDE.md — NTD Frontend (ntd.lt)

## Identity

NTD (NT Duomenys) — Lithuanian proptech platform at ntd.lt.
Brand: **NTD**. Never use "Būsto DNR" (deprecated).
Colors: #1E3A5F (deep navy), #0D7377 (teal), #FAFBFC (background).
Font: Inter.

## Stack

Astro v5 · Tailwind CSS · TypeScript · React islands.
Deploy: Hostinger (static HTML + JS islands).
Backend API: api.staging.bustodnr.lt (CORS-enabled).

## Critical Rules

- **NTD branding only.** Never output "Būsto DNR" in any component or copy.
- **Lithuanian copy guidelines:**
  - Avoid "ataskaita" → use "įžvalgos", "duomenų rinkinys", "objekto profilis"
  - Avoid "pirkti" → use "prieiga", "gauti"
  - Avoid "patikrinkite" → use "gauti duomenis", "gauti įžvalgas"
  - Never imply NTD is a government registry. Use "iš oficialių registrų", not "oficialus registras".
- **Astro islands**: use `client:load` for interactive components, `client:visible` for below-fold.
- **All API calls** go through `src/lib/api.ts` — never call the backend directly from components.
- **NTD design principles**: light theme, institutional aesthetic, generous spacing (100–140px sections), subtle animations only.

## Documentation

Project planning happens in Claude Chat, which produces **task briefs** — self-contained .md files with everything needed for a specific coding task. These are placed in `docs/tasks/`.

Most product documentation (specs, annexes, decisions) lives in the **backend repo** (`~/dev/bustodnr/docs/`). Read those only when a task brief points you to a specific file.

## What Exists

### Landing page (index.astro)
Scroll page: Header → Hero → HowItWorks → Sources → Pricing → Footer.
Hero contains input field + "Gauti įžvalgas" CTA.

### QuickScan flow (/quickscan route)
`quickscan.astro` → renders `QuickScanFlow.tsx` (React island).
Implements Screens 1→2→3 for the QuickScan-Lite purchase flow.
Test file: `src/components/__tests__/QuickScanFlow.test.tsx`.

### Component inventory
| Component | Type | Purpose |
|-----------|------|---------|
| Header.astro | Static | Nav bar with NTD logo + CTA |
| Hero.astro | Static | Two-column: headline + data blocks preview |
| HowItWorks.astro | Static | 3-step strip (01→02→03) |
| Sources.astro | Static | Registry source logos (NTR, RC, Kadastras, PENS) |
| Pricing.astro | Static | "Nuo 79 €" pricing section |
| Footer.astro | Static | NTD branding + links |
| AddressLookup.astro | Island | Object type cards + location inputs (Screen 1 seed) |
| QuickScanFlow.tsx | Island | Full Screen 1→2→3 React component |

## Repo Layout

```
src/
├── components/          # Astro + React components
│   └── __tests__/       # Component tests
├── layouts/             # BaseLayout.astro
├── pages/               # index.astro, quickscan.astro
├── lib/                 # api.ts (backend client)
└── styles/              # Tailwind + global CSS
docs/
└── tasks/               # ★ Task briefs from Claude Chat (read these first)
```

## Common Commands

```bash
npm run dev      # Dev server (localhost:4321)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```
