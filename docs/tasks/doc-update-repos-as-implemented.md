# Task: Update Repo Documentation — As-Implemented State (March 30, 2026)

**Repos:** ~/dev/ntd (frontend) + ~/dev/bustodnr (backend)
**Path:** Save this brief in both repos: `~/dev/ntd/docs/tasks/doc-update-repos-as-implemented.md` and `~/dev/bustodnr/docs/tasks/doc-update-repos-as-implemented.md`
**Branch:** block1-e2e (both repos)
**Scope:** Update all internal documentation in both repos to reflect the current as-implemented state

---

## Why

The frontend went through extensive UI redesign (41+ task briefs, March 24–30, 2026). The backend has been through Phases 0–5 + partial P6-B and complete P6-C. Both repos' internal docs need to reflect the actual current state — not the original plans, but what was actually built and what changed.

---

## Part 1: Frontend repo (~/dev/ntd)

### 1.1 Update CLAUDE.md

The CLAUDE.md file (~400 tokens, auto-read by Claude Code) must reflect the current frontend state:

- **Project:** NTD (NT Duomenys) — Lithuanian proptech, QuickScan-Lite
- **Stack:** Astro v5 + Tailwind + React islands
- **Main component:** `src/components/QuickScanFlow.tsx`
- **Design system:** #1E3A5F navy, #0D7377 teal, Inter font, max-width 1200px
- **Screens:** Landing → Screen 1 (Vieta) → Resolver states (R-A/B/C/D) → Screen 2 (Patvirtinimas) → Payment → Success
- **Backend:** FastAPI at api.staging.bustodnr.lt, branch block1-e2e
- **Payment:** Stripe (cards, Apple Pay, Google Pay, PayPal) + Paysera PIS (Lithuanian bank links)
- **Dev navigation:** Dev ⚙️ dropdown with 9 state links (TEMPORARY)
- **Key files:** QuickScanFlow.tsx, src/lib/stripe.ts, src/lib/api.ts, public/images/payment/

### 1.2 Create/update docs/phase6_frontend_status.md

Summary document:

```markdown
# Phase 6 Frontend Status — March 30, 2026

## Workstream Status
- P6-A: ✅ Complete
- P6-B: ⚠️ Partial (endpoints done, live NTR/PENS blocked on MB)
- P6-C: ✅ Complete (438 backend tests)
- P6-D: 🔲 Not started
- P6-E: 🔲 Not started

## Screens Implemented
1. Landing page (hero, carousel, mini-mockups, comparison, pricing, situation cards, footer)
2. Screen 1 — Vieta (case toggle, tabbed location, URL, PDF, kWh cards)
3. Resolver states (R-A loading, R-B failure, R-C no-match, R-D chooser)
4. Screen 2 — Patvirtinimas (proof card, report blocks, payment card with Stripe/Paysera)
5. Success screen (green banner, order summary, delivery info)
6. Duplicate purchase warning (S5)
7. Discount display (strikethrough + badge)

## Design Changes from Original Plan
- Step indicator removed
- EPC override card removed from Screen 2 (PDF upload on Screen 1 handles it)
- Screens 2+3 merged into one
- Three-card inverted-T layout on Screen 1 (not three separate location cards)
- Tabbed location input (Adresas/NTR/Žemėlapis)
- Flat payment method grid (not grouped by provider)
- Two payment providers: Stripe + Paysera PIS (not Stripe-only)
- Kevin. dropped (bankruptcy Sep 2024)

## Task Briefs
See docs/tasks/ for all implementation briefs.
See docs/NTD_Frontend_Design_As_Implemented.docx for the full reference.

## Outstanding
- Frontend design changes need Claude Code implementation (many briefs pending)
- CSE: 12 additional Lithuanian real estate domains to add
- Remove Dev ⚙️ dropdown before production
- Apple Pay domain verification file needed
- Paysera project setup and review needed
```

### 1.3 Update docs/tasks/ — mark superseded briefs

Some earlier briefs were superseded by later ones during the design iteration. Add a one-line note at the top of each superseded brief:

```markdown
> ⚠️ SUPERSEDED by [newer-brief-name.md]. Do not implement this version.
```

Superseded briefs (check `docs/tasks/` for these and mark them):
- Any brief that was explicitly replaced during the design sessions (e.g., old right-column-spacing brief → replaced by three-card layout)
- Any brief whose content was folded into a later, more comprehensive brief

### 1.4 Commit the NTD_Frontend_Design_As_Implemented.docx

Ensure `docs/NTD_Frontend_Design_As_Implemented.docx` is committed to the repo.

---

## Part 2: Backend repo (~/dev/bustodnr)

### 2.1 Update CLAUDE.md

Reflect current backend state:

- **Project:** NTD QuickScan-Lite backend
- **Stack:** FastAPI + SQLAlchemy + Alembic + Stripe
- **Tests:** 438 passing (as of March 21, 2026 session)
- **Branch:** block1-e2e
- **Deployed:** api.staging.bustodnr.lt, PAYMENT_MODE=stub
- **Endpoints:** /report, /report/email, /quote, /payment-intent, /payment-webhook, /resolve, /confirm, /geocode, /upload-project-doc, plus 5 admin endpoints
- **Phase status:** P0–P5 complete, P6-B partial (live NTR/PENS blocked), P6-C complete

### 2.2 Create/update docs/block1/phase6_status_march30.md

```markdown
# Phase 6 Status — March 30, 2026

## Backend Status
- 438 tests passing
- 12+ endpoints operational (9 customer-facing + 5 admin)
- 7+ database tables
- Deployed to api.staging.bustodnr.lt (PAYMENT_MODE=stub)

## P6-B Resolver + Live Services
### Done:
- POST /v1/quickscan-lite/resolve — accepts case_type + location, runs resolver pipeline
- POST /v1/quickscan-lite/geocode — address autocomplete (Google Places API)
- POST /v1/quickscan-lite/upload-project-doc — multipart PDF upload
- POST /v1/quickscan-lite/confirm — stateless bundle confirmation
- Resolver client factory (stub/live mode switching)
- HttpResolverClient skeleton with registry/EPC adapters

### Blocked:
- Live NTR registry adapter (real HTTP calls) — blocked on MB entity registration
- Live PENS (EPC) registry adapter — same blocker
- URL hunter production wiring (brief ready, CSE needs 12 additional domains)
- Async ResolverClient refactor (P3-S1)

## P6-C Screen 2 + Screen 3 Backend
### Done (all):
- /confirm endpoint (stateless, 4 tests)
- /quote returns QuoteForScreen3 with discount fields
- "Kodėl tokia kaina?" Lithuanian copy (_EXPLANATION_BY_TIER)
- Payment stub mode (pi_stub client_secret)
- Reassurance/success flow

## P6-D Payment + Consent — NOT STARTED
- consent_flags Alembic migration needed
- Stripe test/live mode configuration needed
- Paysera PIS integration needed (new endpoints: /payment-init-paysera, /paysera-callback)
- STRIPE_WEBHOOK_SECRET not yet set on VPS

## New Backend Work Required (from frontend redesign)
- POST /v1/quickscan-lite/payment-init-paysera — new endpoint for Paysera bank link payments
- POST /v1/quickscan-lite/paysera-callback — Paysera server-to-server callback
- POST /v1/quickscan-lite/resend-report — re-send last report for duplicate purchase flow
- Duplicate order detection in /payment-intent (same bundle_signature + email within 24h)
- consent_flags column on orders table (Alembic migration)
- Price: update from 79€ to 39€ in pricing config

## Environment Variables Status
### Present:
- GOOGLE_PLACES_API_KEY
- GEOCODING_PROVIDER=google
- QUICKSCAN_LITE_EMAIL_MODE=background_task
- PAYMENT_MODE=stub

### Needed:
- GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID (for URL hunter)
- STRIPE_SECRET_KEY (live)
- STRIPE_WEBHOOK_SECRET
- PUBLIC_STRIPE_PUBLISHABLE_KEY (frontend)
- PAYSERA_PROJECT_ID + PAYSERA_PROJECT_PASSWORD
```

### 2.3 Update docs/block1/phase5_tests_baseline.md

Add a note: "Test count at end of P6-C: 438 passing (up from 372 at Phase 5 end). 4 new tests in tests/test_confirm.py."

### 2.4 Update docs/README_docs_hierarchy.md

If this file exists, add references to:
- `phase6_status_march30.md`
- `NTD_Frontend_Design_As_Implemented.docx` (cross-reference to frontend repo)

---

## Part 3: Both repos — git commit

After all docs are updated:

**Frontend repo:**
```
git add docs/ CLAUDE.md
git commit -m "docs: as-implemented frontend state March 30, 2026

- NTD_Frontend_Design_As_Implemented.docx (22KB, 13 sections)
- Updated CLAUDE.md with current frontend state
- Created phase6_frontend_status.md
- Marked superseded task briefs"
```

**Backend repo:**
```
git add docs/ CLAUDE.md
git commit -m "docs: as-implemented backend state March 30, 2026

- Created phase6_status_march30.md
- Updated CLAUDE.md with current backend state
- Updated tests baseline (438 tests)
- Documented new endpoints needed for Paysera + duplicate detection"
```

---

## Verification

### Frontend:
1. CLAUDE.md reflects current stack, screens, payment providers
2. `docs/phase6_frontend_status.md` exists with correct workstream status
3. `docs/NTD_Frontend_Design_As_Implemented.docx` is committed
4. Superseded briefs in `docs/tasks/` are marked

### Backend:
1. CLAUDE.md reflects current endpoints, test count, deployment state
2. `docs/block1/phase6_status_march30.md` exists with P6-B/C/D status
3. New backend endpoints needed (Paysera, resend, duplicate) are documented
4. Environment variables status (present vs. needed) is documented
5. Tests baseline updated