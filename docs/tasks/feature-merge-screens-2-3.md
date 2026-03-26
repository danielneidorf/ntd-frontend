# Feature: Merge Patvirtinimas + Užsakymas into One Screen

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-merge-screens-2-3.md
**Branch:** block1-e2e
**Scope:** Keep Screen 1 (location input) as-is; merge Screen 2 (confirmation) and Screen 3 (payment) into a single screen; remove Sertifikato metai fields

---

## Rationale

After the resolver finds the object, the user currently goes through two separate screens: confirm the object, then pay. These are both "decision" steps that chain naturally: "Yes, this is right" → "Here's the price, I'll pay." Merging them removes a page transition and makes the flow feel faster.

Screen 1 (Vieta) stays separate — it's a clean, focused input task with a clear endpoint (Tęsti → resolver runs).

---

## New flow: 2 screens

### Step indicator

- Current: **1 Vieta → 2 Patvirtinimas → 3 Užsakymas ir apmokėjimas**
- New: **1 Vieta → 2 Patvirtinimas ir apmokėjimas**

### Screen 1 — "Vieta" (unchanged)

Exactly as it is now: location input methods (NTR, address, map, listing URL), "Tęsti" button, resolver spinner on submit. No changes.

### Screen 2 — "Patvirtinimas ir apmokėjimas" (merged)

After the resolver returns, the user sees a single page with everything needed to confirm and pay.

**Layout: two-column on desktop, stacked on mobile.**

**Left column — Object confirmation:**
- **Proof card:** resolved object details (address, NTR, municipality, bundle summary, small map with pin)
- "Ar tai teisingas objektas?" with "Taip, teisingas" / "Ne, ieškoti kito" buttons
- Once confirmed ("Taip"), the proof card shows a confirmed state (subtle green checkmark or border) and the buttons collapse
- If "Ne, ieškoti kito" → returns to Screen 1 with inputs preserved

**Right column — EPC card + Payment (visible immediately, but payment locked until object confirmed):**

- **EPC card** (optional, heated buildings only) — simplified version, see Fix 2 below
- **Payment block:**
  - Price display (39 € prominently)
  - Object summary line (address, type)
  - Email field ("Ataskaitą išsiųsime šiuo adresu")
  - Consent checkbox ("Sutinku su paslaugos teikimo sąlygomis ir privatumo politika")
  - Invoice checkbox ("Reikalinga sąskaita faktūra")
  - **Payment button: "Mokėti ir gauti ataskaitą"** — disabled/greyed out until the user confirms the object on the left side. Once confirmed, the button becomes active.

The user flow on this single page: glance at the object on the left → confirm it → optionally upload EPC on the right → fill email → pay. One page, one decision moment.

---

## Fix 2: Simplify EPC card — remove Sertifikato metai fields

The EPC card on the merged screen has **only these inputs:**

1. **Energinio naudingumo sertifikatas (PDF)** — file upload
   - Label: "Įkelti sertifikatą"
   - Helper: "PDF · sistema automatiškai nuskaitys duomenis"
   - Backend parses energy class, kWh/m², and year from the PDF

2. **Faktinės energijos sąnaudos (iš sąskaitų / skaitiklių)** — manual kWh entry
   - Numeric field: kWh/m² per metus
   - Scope selector: "Tik šildymas" / "Visas komfortas (šildymas + vėsinimas + kt.)"

**Remove entirely:**
- ~~Energijos naudingumo klasė (dropdown)~~ — extracted from PDF
- ~~Sertifikato metai (year field)~~ — extracted from PDF
- ~~Nežinau / neturiu po ranka (checkbox)~~ — not needed

**Card title:** "Energijos naudingumo duomenys (pasirinktinai)"
**Footer:** "Jei nepateiksite — vertinimui bus naudojami registrų duomenys."

---

## Fix 3: Remove case selector

Any remaining "Ką tiksliai norite įvertinti šiuo QuickScan?" case selector UI must be removed from the flow. The `?case=` parameter from the URL is the only source.

---

## What NOT to change

- Screen 1 (Vieta) — untouched
- Backend `/resolve`, `/quote`, `/payment-intent` endpoints — untouched
- Backend EPC merge logic — untouched
- Success/confirmation screen after payment — untouched
- Landing page — untouched

---

## Verification

1. Step indicator shows: **"1 Vieta → 2 Patvirtinimas ir apmokėjimas"**
2. Screen 1 is unchanged — location input, Tęsti, resolver spinner
3. Screen 2 shows object confirmation (left) + EPC/payment (right) on ONE page
4. Payment button is disabled until object is confirmed
5. After confirming → payment button becomes active
6. EPC card has only: PDF upload + manual kWh with scope selector
7. No energy class dropdown, no Sertifikato metai, no Nežinau checkbox
8. No case selector anywhere
9. "Ne, ieškoti kito" returns to Screen 1 with inputs preserved