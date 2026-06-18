# CLAUDE.md — NTD Frontend (ntd.lt)

## Identity

NTD (NT Duomenys) — Lithuanian proptech platform at ntd.lt.
Brand: **NTD**. Never use "Būsto DNR" (deprecated).
Colors: #1E3A5F (deep navy), #0D7377 (teal), #FAFBFC (background).
Font: Inter. Max-width: 1200px.

## Legal & Entity

Backend `CLAUDE.md` is canonical for entity facts (`~/dev/bustodnr/CLAUDE.md`, §"Entity Identifiers" + §"IP Layer Status"). Condensed for frontend use:

- **Legal entity:** Mažoji bendrija NTD · įmonės kodas `307659223` · PVM kodas `LT100020078513` (SVS, effective 2026-05-11).
- **Buveinė (registered, on ToS §1.2):** Saulėtekio al. 15-1, LT-10224 Vilnius. SS MTP confirmed 15 Jun 2026 (JAR-1-E Nr. 49086085, status Įvykdytas). Supersedes the interim Eureka address (Laisvės al. 85E-5, LT-44297 Kaunas). Mirrored on `salygos.astro` §1.2 + the backend invoice issuer.
- **License Agt:** MB-NTD-IP-2026-01 (signed 2026-05-17).
- **Contact address (decided 2026-06-03):** `ntd@ntd.lt` is the **only** contact address. Do not introduce `founder@` / `info@`. Aligned across the surface via commit `db7f1a9` (Footer.astro:31 · ReportViewer.tsx:313 · QuickScanFlow already aligned).
- **TM scope post-IP-04 (2026-05-30):** **NTD wordmark only.** No QuickScan-Lite filing. No logo SVG/PNG. Brand work stays wordmark-centric — do not commission/use a logo asset until IP-07 ships (2026-06-30) and post-launch logo work is greenlit separately.

Legal pages shipped:

- **`/salygos`** — Naudojimo sąlygos, shipped 2026-06-03. IP-05 ToS clauses live at §7.1–7.8 (ownership · license · registry-data status · methodology = trade secret · DB rights cite Direktyva 96/9/EB + LR Autorių teisių XI sk. · no reverse-engineering · AI content · feedback). Governing law §8.2 = LR teisė + LT courts. Source: `src/pages/salygos.astro`.
- **`/privatumas`** — status to verify.

Pre-launch TODOs visible from the legal surface:

- `salygos.astro` line: `Galioja nuo: 2026 m. ____ d.` — fill on launch day, not commit day (existing `TODO(deploy)` comment).
- Header **Dev ⚙️ dropdown** removal — flagged in existing Critical Rules; remains a launch-blocker.

## Stack

Astro v5 · Tailwind CSS v4 · TypeScript · React 19 islands.
Deploy: Hostinger (static HTML + JS islands).
Backend API: api.ntd.lt (CORS-enabled), branch block1-e2e.
Payment: Stripe (cards, Apple Pay, Google Pay, PayPal) + Paysera PIS (Lithuanian bank links).

## Screens

Landing → Screen 1 (Vieta, case toggle + tabbed location) → Resolver states (R-A loading, R-B failure, R-C no-match, R-D chooser) → Screen 2 (Patvirtinimas + payment, merged) → Payment method grid → Success.

## Critical Rules

- **NTD branding only.** Never output "Būsto DNR" in any component or copy.
- **Single contact address.** `ntd@ntd.lt` is the only public-facing address. Never wire `info@`, `founder@`, `support@`, `hello@`, etc. — even as placeholders. Verified clean as of `db7f1a9`.
- **NTD wordmark only.** No logo asset exists or should be used. Brand work stays wordmark-centric until IP-07 (TM filing 2026-06-30) ships and post-launch logo work is greenlit separately.
- **Astro islands**: use `client:load` for interactive components, `client:visible` for below-fold.
- **NTD design principles**: light theme, institutional aesthetic, generous spacing, subtle animations only.
- **Dev ⚙️ dropdown** in header is TEMPORARY — remove before production deploy.
- **Buveinė address** on the ToS (`salygos.astro` §1.2) = Saulėtekio al. 15-1, LT-10224 Vilnius (SS MTP, confirmed 15 Jun 2026 via JAR-1-E Nr. 49086085, status Įvykdytas). The interim Eureka address (Laisvės al. 85E-5, LT-44297 Kaunas) has been superseded.

## Documentation

Task briefs in `docs/tasks/` (46 briefs from March 2026 sessions + IP-05 ToS brief 2026-06-03).
Full design reference: `docs/NTD_Frontend_Design_As_Implemented.docx`.
Phase 6 status: `docs/phase6_frontend_status.md`.

Cross-repo planning artifacts (canonical operational state):

- **Progress log** (commits + decisions): `~/Desktop/Weekly planning_Cowork/ntd_progress_log.md`.
- **Current 9-day Gantt**: `~/Desktop/Weekly planning_Cowork/ntd_9day_gantt_3_11_jun.html`.
- **Backend CLAUDE.md** (canonical entity facts): `~/dev/bustodnr/CLAUDE.md`.

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
