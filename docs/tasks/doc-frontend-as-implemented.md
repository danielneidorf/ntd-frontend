# Task: Document Frontend Design as Implemented

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/doc-frontend-as-implemented.md
**Branch:** block1-e2e
**Scope:** Produce a comprehensive Word document capturing all frontend UI design decisions and implementations from the Phase 6 design sessions (March 24–30, 2026)

---

## Output

Create: **`~/dev/ntd/docs/NTD_Frontend_Design_As_Implemented.docx`**

This is the definitive record of the frontend UI — what was designed, what was implemented, what was deferred, and what was changed from the original Phase 6 plan. It should be readable by a developer who wasn't in the design sessions and needs to understand the current state.

---

## Document structure

### 1. Executive Summary

One paragraph: NTD QuickScan-Lite frontend is an Astro v5 + Tailwind + React application implementing a 3-screen purchase flow (Vieta → Patvirtinimas → Success) with resolver transition states and a landing page. Phase 6 workstreams P6-A and P6-C are complete (438 backend tests). P6-B is partial (live registry adapters blocked on MB entity registration). The frontend was extensively redesigned in March 2026 design sessions, producing 41 task briefs.

### 2. Architecture

- Stack: Astro v5 + Tailwind + React islands
- Main component: `src/components/QuickScanFlow.tsx`
- Backend: FastAPI at `api.staging.bustodnr.lt`
- Branch: `block1-e2e` on both repos
- Design palette: #1E3A5F (navy) + #0D7377 (teal), Inter font
- 438 backend tests passing

### 3. Landing Page — Final Design

Describe each section top to bottom:

**3.1 Header**
- "NT Duomenys | ntd.lt" logo left
- Nav: Objekto paieška · Kaina · Dev ⚙️ (temp) · [Užsakyti ataskaitą] button
- "Objekto paieška" → `/quickscan/` (no case param — forces toggle choice)
- "Užsakyti ataskaitą" scrolls to situation cards section

**3.2 Hero**
- Left: headline + description + "Gauti įžvalgas" CTA
- Right: 4-card floating scenario carousel (13 scenarios, continuous upward drift, CSS animation, pause on hover, hidden on mobile)

**3.3 "Ką gausite ataskaitoje" — Mini-mockup grid**
- 4×2 grid, 8 cards with HTML/CSS data visualizations representing report blocks

**3.4 "Kaip tai palyginti" — Comparison cards**
- 3 floating cards: NTD (highlighted, teal border, "Rekomenduojama" badge), Eksperto samdymas, Tikrinti pačiam
- NTD price: 39 €

**3.5 Pricing card**
- "KAINA NUO" label, 39 €, 5 bullets, "Užsakyti ataskaitą" CTA → scrolls to situation cards

**3.6 Situation cards**
- Three case cards: "Esamą pastatą ar patalpas" / "Naujai statomą, nebaigtą projektą" / "Tik žemės sklypą"
- Each links to `/quickscan/?case=<value>`

**3.7 Property types marquee**
- Continuous horizontal scroll of property type badges

**3.8 Footer**
- Compressed, tagline with "registrų, duomenų bazių", PRODUKTAS column removed

### 4. Screen 1 — Vieta (Ką norite patikrinti?)

**4.1 Page title:** "Ką norite patikrinti?"

**4.2 Case toggle:** "Nurodykite objektą" label above three button-like segments:
- 🏠 Esamą pastatą ar patalpas
- 🏗️ Naujai statomą, nebaigtą projektą
- 🌿 Tik žemės sklypą
- No default from "Objekto paieška"; pre-selected from landing page situation cards
- Toggle labels match situation card titles exactly

**4.3 Three-card layout (existing_object = 2×2; others = inverted-T):**

Card 1 (top-left): **Tabbed location card**
- "Nurodykite vietą jums tinkamiausiu būdu"
- Tabs: Adresas (default) · Unikalus Nr. (TIKSLIAUSIAS badge) · Žemėlapis
- Adresas: address autocomplete input (working)
- Unikalus Nr.: NTR input + "Kur rasti?" link → registrucentras.lt
- Žemėlapis: trigger → full-screen Google Maps overlay (working)
- No static map previews (Google Maps API billing rejected)
- Switching tabs preserves data

Card 2 (top-right): **URL card**
- "Pridėkite skelbimo ar projekto nuorodą (jeigu turite)"
- Case-dependent helper texts (existing: gentle; new-build: strong encouragement; land: minimal)

Card 3 (bottom-left or full-width): **PDF upload card**
- "Įkelkite dokumentą"
- Dashed drop zone
- Case-dependent helper texts
- Full-width (inverted-T) for new_build and land_only; half-width for existing_object

Card 4 (bottom-right, existing_object only): **kWh input card**
- "Faktinės energijos sąnaudos"
- Numeric input + "kWh/m² per metus"
- Scope selector: "Tik šildymas" (default) / "Visas komfortas" (with helper text)
- Only visible for existing_object case
- Disabled for land_only

**4.4 "Tęsti" button:** disabled until case + location valid

### 5. Resolver Transition States

**5.1 R-A: Loading (progressive data reveal)**
- Data points appear one by one: address found → NTR → purpose → area → year → "searching energy data..."
- Staggered fade-in, loops in dev mode

**5.2 R-B: Soft failure**
- ⚠️ "Registrų paieška užtrunka ilgiau nei įprasta."
- "Bandyti dar kartą" button

**5.3 R-C: No match**
- 🔍 "Nepavyko rasti objekto pagal pateiktus duomenis."
- "← Grįžti" button

**5.4 R-D: Ambiguous — Chooser**
- Map with numbered pins (left) + candidate list grouped by 3 buckets (right)
- Buckets: Pastatai / Patalpos pastate / Žemės sklypai
- Confidence badges: Aukštas (green) / Vidutinis (amber) / Žemas (red)
- Highest-confidence pre-selected
- "Tęsti" locks selection → Screen 2

### 6. Screen 2 — Patvirtinimas ir apmokėjimas

**6.1 Symmetrical three-card layout:**

Card 1 (top-left): **Proof card — "Patvirtinkite objektą"**
- Object details: address, NTR, municipality, bundle summary
- Green confirmed box uses `position: sticky; top: 80px` (slides within proof card boundaries)
- "Taip, teisingas" / "Ne, ieškoti kito" (preserves case on back navigation)

Card 2 (top-right): **Report blocks — "Jūsų ataskaita"**
- Case-dependent subtitle
- All 8 blocks listed with case-dependent enabling:
  - existing: all ✅
  - new-build: 1–3 noted "(pagal projekto duomenis)"
  - land: 1–3 greyed "(netaikoma)"
- "PDF ataskaita bus išsiųsta el. paštu per 1 val."

Card 3 (bottom, full width): **Payment card**
- Price (left): exact from `/quote`, not "KAINA NUO"
- Discount display: if `special_discount_applied` → strikethrough base price + green badge "✓ Nuolaida pritaikyta" + green "-X €"
- Email + consent + invoice (right column):
  - Email input (always visible)
  - ☐ Sutinku su sąlygomis ir privatumu (always visible)
  - ☐ Reikia sąskaitos faktūros (always visible) → expands: sąskaitos email with helper
  - ☐ Juridinis asmuo (always visible) → expands: company fields (pavadinimas, kodas, PVM)
- "Mokėti ir gauti ataskaitą" always at bottom, slides down as fields expand
- Auto-scroll on field expand (100px above marquee)

**6.2 Payment flow (after button click):**
- Payment method selector: flat grid of all methods (Lithuanian style, logo-only tiles)
  - Banks: Swedbank, SEB, Luminor, Citadele, Revolut, Paysera (→ Paysera PIS)
  - Cards/wallets: Visa/MC, Apple Pay, Google Pay, PayPal (→ Stripe)
- Bank path: redirect to Paysera → bank auth → redirect back → success
- Card path: inline Stripe PaymentElement → confirm → success
- Stub mode for both providers

**6.3 Duplicate purchase warning (S5)**
- Inline amber warning: "Panašu, kad neseniai jau užsakėte ataskaitą šiam objektui."
- "Persiųsti paskutinę ataskaitą" / "Vis tiek užsakyti iš naujo"

### 7. Success Screen

- Green banner: "Užsakymas priimtas." + reassurance text (Decision D8)
- Left card: "Jūsų užsakymas" — object details + 8 report blocks (case-dependent)
- Right card: "Pristatymas" — delivery email + spam hint + "Grįžti į pradžią" + "Peržiūrėti dar vieną objektą →"

### 8. Dev Navigation Dropdown (TEMPORARY)

Single amber "Dev ⚙️" dropdown in header with entries:
- Vieta, Patvirtinimas, Sėkmė, R-A Loading, R-B Klaida, R-C Nerasta, R-D Keli atitikmenys, S5 Dublikatas, Nuolaida (mokėjimas + nuolaida)
- **Remove before production deploy**

### 9. Key Design Decisions

Table format — decision / what was chosen / what was rejected / rationale:

- Static map previews rejected (Google Maps API billing)
- `align-items: start` adopted (natural card heights)
- Section dividers removed (whitespace only)
- "Objekto paieška" → `/quickscan/` without case param (forces toggle choice)
- EPC override card removed from Screen 2 (handled by PDF upload on Screen 1)
- Price on Screen 2 is exact (from `/quote`), not "KAINA NUO"
- Kevin. dropped (bankruptcy Sep 2024)
- Two-provider payment strategy: Stripe + Paysera PIS
- Flat payment method grid (Lithuanian convention, no grouping)

### 10. Changes from Original Phase 6 Plan

Table format — what the plan said / what was actually built / why:

- Plan: 3-step stepper → Implemented: no stepper (removed for space)
- Plan: Three separate location cards → Implemented: tabbed card
- Plan: EPC override on Screen 2 → Implemented: removed (PDF upload handles it)
- Plan: Screens 2+3 separate → Implemented: merged into one screen
- Plan: Stripe only → Implemented: Stripe + Paysera PIS
- Plan: "Kodėl tokia kaina?" block → Implemented: replaced by 8-block report blocks list

### 11. Task Briefs Inventory

Table of all 41 task briefs produced, with filename, scope (landing/screen1/screen2/success/resolver/payment), and status (implemented/pending/superseded).

### 12. Outstanding Frontend Items

- [ ] All design changes from this session need Claude Code implementation (many task briefs pending)
- [ ] Google Maps API `InvalidKeyMapError` investigation (may be resolved — map was working in latest test)
- [ ] CSE scope: 12 additional Lithuanian real estate domains to add
- [ ] Remove Dev ⚙️ dropdown before production
- [ ] Apple Pay domain verification file
- [ ] Paysera project setup and review

### 13. Phase 6 Status Summary

| Workstream | Status | Notes |
|---|---|---|
| P6-A Frontend + Screen 1 | ✅ Complete | |
| P6-B Resolver + Live Services | ⚠️ Partial | /resolve, /geocode, /upload-project-doc done; live NTR/PENS blocked on MB; URL hunter brief ready |
| P6-C Screen 2 + Screen 3 | ✅ Complete | 438 tests; extensive UI redesign pending implementation |
| P6-D Payment + Consent | 🔲 Not started | consent_flags migration, Stripe/Paysera config |
| P6-E Integration Tests | 🔲 Not started | |

---

## Format requirements

- A4 page, 1-inch margins
- Font: Arial 11pt body, headings per docx skill conventions
- Table of contents
- Tables for decisions, briefs inventory, status
- Professional but concise — this is a reference document, not a narrative
- ~15–20 pages estimated

---

## Source material

Read the following to compile the document:

1. All task briefs in `~/dev/ntd/docs/tasks/` — scan filenames and first 5 lines of each for scope
2. `Development_Progress_Report_3_21_2026.docx` in project knowledge — P6-C completion details
3. `Phase6_Plan_Update_v1_1.docx` in project knowledge — amendments from NTD design review
4. `Block-1_Detailed_Plan_Phase6.docx` — original Phase 6 plan (for "changes from plan" section)
5. `NTD_Design_Session_Summary.docx` — previous design session summary
6. `ntd_design_principles.md` — design system reference

**Do NOT fabricate content.** If a section's details aren't available from the sources, mark it as "[To be confirmed from implementation]" and move on.

---

## Verification

1. Document is valid .docx, opens cleanly
2. Table of contents works
3. All 13 sections present
4. Task briefs inventory table lists all briefs in `docs/tasks/`
5. Phase 6 status table matches the corrected status from this session
6. Key decisions table captures at least 10 major decisions
7. Changes from plan table captures at least 6 deviations