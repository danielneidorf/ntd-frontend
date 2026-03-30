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
- Remove Dev ⚙️ dropdown before production
- Apple Pay domain verification file needed
- Paysera project setup and review needed
- CSE: 12 additional Lithuanian real estate domains to add
- Consent + privacy policy pages (/salygos, /privatumas) — currently dead links
- Mobile responsive testing
