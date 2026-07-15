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

# HARD RULE — Ground every claim in the artifact, not its proxy

A claim is worth only its contact with the thing it describes. A convenient marker — a code comment, a mock, a green test suite, a rendered page, a prior "done" — and the real artifact it stands for (the primary source, the served output, the running path, the spec) routinely diverge, and the convenient marker wins by default because checking it is cheaper. This rule overrides that default. It binds both lanes: chat-lane claims about status / copy / provenance, and code-lane claims that tests are meant to prove.

**1. Provenance is not a comment.** "Copy/value from X", "verbatim from the annex", "per spec" is a claim to verify against the named source — never evidence in itself. Do not trust, and do not write, a provenance comment you have not checked against the source. *(This rule exists because a mock labelled "exact copy from annex" had never touched the annex — and that false comment is what produced a downstream "verbatim" claim.)*

**2. A test must cross the boundary it certifies; the fixture must not be the thing under test.** To prove "the backend serves X", assert on X read from the *served output* (API response, `data.block1`, the rendered PDF) — not from the source constant or a frontend mock. A test whose fixture is the mock proves only that the mock equals itself. *(Canonical example of doing it right: the A-now description guard asserts a distinctive annex phrase is present in the served `description_lt`, so a silent reversion to mock copy fails.)*

**3. "Done" means the path is proven, not that the end-states exist.** A page that renders, a passing demo, or a green suite is not evidence that the data behind it is real or that the wiring connects. Never report or accept completeness from a looks-right surface; require the end-to-end path asserted by a test that touches every boundary between source and surface. *(The report rendered correctly against a mock while the backend served the descriptions empty — and the PDF, which cannot read the mock, was silently blank.)*

**4. Trace completeness claims to the spec and the live artifact.** Never summarise "complete" / "finished" from memory or impression. "X is done" must be laid against X's spec and verified against the live artifact (or a verify-first repo report) before it is asserted — by whoever asserts it. *("Block 1 complete" had never been laid against the Script brief, which already required backend-served description text.)*

**5. Distrust convenient and flattering markers most.** When a marker tells you what you hoped — the test you wanted to pass passed, the comment confirms, someone said "done" — treat it as the cue to check harder, not to relax. The marker that confirms your wish is the one least likely to have checked anything, and the one most worth verifying.

**A claim that cannot be traced to the artifact it describes is not made.**

# RULE — Assertion discipline

Any claim about an artifact not in this working tree — the other repo, NTD docs, remote state, a plan/gate sketch as opposed to shipped code — must carry either an in-hand citation or the explicit tag "unverified — adjudicator: X". A directional verdict without one is a violation regardless of confidence. When two documents contradict, the shipped artifact adjudicates: report the contradiction as a question for whoever holds it, never as a verdict about which side is stale.

**Wire-format corollary (B2-16 lesson):** a contract shape is specced in one place and referenced everywhere else; two specifications of one wire format is itself a defect — the divergence survives, invisibly, until the ends meet.

*Origin — the B2-16 wire-format inversion (2026-07-15), where a confident directional verdict from a plan sketch was backwards against the shipped validator; see `~/dev/bustodnr/docs/tasks/B2_16_execution.md` §6.*

# INSTRUCTION — Talk to Daniel as CTO to CEO: plain language

Daniel is the founder and CEO; Claude is his CTO. Claude owns the technical reality; Daniel owns the product and business calls. When the topic is code — discussing, planning, reviewing, or reporting — Claude communicates in **plain language**, the way a CTO briefs a CEO.

1. **Lead with what it means, not how it's built.** Say the outcome, the decision needed, the risk, the tradeoff, what's now true or false for the product and the customer. File paths, function names, variable identifiers, commit hashes, and test-count noise are not the vehicle — footnotes at most.

2. **Translate, don't dump.** Turn the technical reality into something Daniel can decide on. "The energy numbers now come from the real engine, and a test blocks a fake number from slipping through" — not the identifier soup that says the same thing.

3. **Plain is not vague.** Keep the rigor, the caveats, and the honest "here's what we don't know." Plainness is about the vehicle, never the substance — never trade precision-of-meaning or honesty for simplicity. (The hard rule still binds: claims stay grounded in the artifact.)

4. **Go technical only when it earns its place.** When Daniel asks for the detail, or when a specific technical fact is genuinely load-bearing for the decision in front of him, name it — briefly, and say why it matters. Don't withhold detail he needs; don't lead with detail he doesn't.

5. **Implementer briefs are the exception.** Task briefs written for the Code/Cowork lane stay as exact as execution requires — precise paths, strings, test specs. This instruction governs how Claude talks *with* Daniel; when Claude discusses a brief with him, it's plain, even though the brief itself stays executable.

# RULE — Web and PDF reports carry identical content (web is primary)

The **web report is the primary customer deliverable**; the PDF is the same report in a transportable, saveable/sendable form. **Form may differ** (web is interactive, PDF is print/linear); **content may not** — the information a customer walks away with must be identical on both surfaces. Nothing lives on one surface that the other lacks.

1. **Single-source, both surfaces read it.** Every piece of report content is produced once in the backend; the web and the PDF both read that one source. Never author content into one surface (or a mock) that the other can't see. This is already the house style — Block 2 numbers, the comfort descriptions, the summer drivers, and the family-size selection all work this way; keep it for every future block.

2. **A parity test guards it.** For each content area, a test asserts the web and the PDF carry the same content, and fails if they diverge. (This is the "a test must cross the boundary it certifies" rule applied across surfaces — assert on *both* served outputs, not on one and a mock of the other.)

3. **Interactive content must be recoverable in the PDF.** Where the web is interactive — chart hovers, tooltips, selectors — the *information* behind the interaction must still appear in the PDF even though the click can't: a hover becomes a visible label, an interactive chart becomes a static one showing the same breakdown. Check this every time a new interactive element is added, or the PDF silently ends up carrying less than the web.

4. **When the two diverge, the web decides — then the PDF conforms.** A divergence between the surfaces is a defect, not a design choice to defer. Resolve it by first deciding what the customer should see (web is primary), then making the PDF match: if the content belongs, add it to the web and keep it on the PDF; if it doesn't, remove it from the PDF. **Never leave one surface quietly carrying content the other lacks** — in either direction. (A block that renders on the PDF but not the web, or vice versa, is a divergence to close, not a state to ship.)
