# CLAUDE.md — NTD Frontend (ntd.lt)

## Identity

NTD (NT Duomenys) — Lithuanian proptech platform at ntd.lt.
Brand: **NTD**. Never use "Būsto DNR" (deprecated).
Colors: #1E3A5F (deep navy), #0D7377 (teal), #FAFBFC (background).
Font: Inter. Max-width: 1200px.

## Stack

Astro v5 · Tailwind CSS v4 · TypeScript · React 19 islands.
Deploy: Hostinger (static HTML + JS islands).
Backend API: api.ntd.lt (CORS-enabled), branch block1-e2e.
Payment: Stripe (cards, Apple Pay, Google Pay, PayPal) + Paysera PIS (Lithuanian bank links).

## Screens

Landing → Screen 1 (Vieta, case toggle + tabbed location) → Resolver states (R-A loading, R-B failure, R-C no-match, R-D chooser) → Screen 2 (Patvirtinimas + payment, merged) → Payment method grid → Success.

## Critical Rules

- **NTD branding only.** Never output "Būsto DNR" in any component or copy.
- **Astro islands**: use `client:load` for interactive components, `client:visible` for below-fold.
- **NTD design principles**: light theme, institutional aesthetic, generous spacing, subtle animations only.
- **Dev ⚙️ dropdown** in header is TEMPORARY — remove before production deploy.

## Documentation

Task briefs in `docs/tasks/` (46 briefs from March 2026 sessions).
Full design reference: `docs/NTD_Frontend_Design_As_Implemented.docx`.
Phase 6 status: `docs/phase6_frontend_status.md`.

## Key Files

| File | Purpose |
|------|---------|
| `src/components/QuickScanFlow.tsx` | Main React component (~1,700 lines) — all screens |
| `src/lib/stripe.ts` | Lazy Stripe.js loader |
| `src/lib/paysera.ts` | Paysera redirect helper |
| `src/components/Header.astro` | Nav bar + Dev dropdown |
| `src/components/Hero.astro` | Landing hero + WhyScenariosCarousel |
| `src/components/MiniMockupGrid.astro` | 8-block report preview grid |
| `src/components/SituationCards.astro` | 3 case type entry cards |
| `src/components/ComparisonTable.astro` | NTD vs alternatives cards |
| `src/components/Pricing.astro` | Pricing card + ReportCarousel |
| `src/components/Sources.astro` | Property types marquee / sources ticker |

## Repo Layout

```
src/
├── components/          # Astro + React components
├── layouts/             # BaseLayout.astro
├── pages/               # index.astro, quickscan.astro
├── lib/                 # stripe.ts, paysera.ts
└── styles/              # Tailwind + global CSS
docs/
├── tasks/               # ★ Task briefs (read these first)
└── NTD_Frontend_Design_As_Implemented.docx
```

## Common Commands

```bash
npm run dev      # Dev server (localhost:4321)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```
