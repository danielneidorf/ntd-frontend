# Feature: Remove Screen 1 Case Selector

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-remove-screen1-selector.md
**Branch:** block1-e2e
**Scope:** Remove the case type selector from the QuickScan flow; header CTA scrolls to situation cards on landing page

---

## Rationale

The landing page now has three situation cards ("Pasirinkite, ką norite išanalizuoti") that handle case selection. Each card links to `/quickscan/?case=existing_object`, `/quickscan/?case=new_build_project`, or `/quickscan/?case=land_only`. There is no user path that arrives at `/quickscan/` without a `?case=` parameter, so Screen 1's case selector is redundant.

---

## Change 1: Remove case selector from QuickScan flow

In `QuickScanFlow.tsx` (or equivalent):

- **Remove** the entire case type selection block ("Ką tiksliai norite įvertinti šiuo QuickScan?" with the 3 choice cards)
- The flow starts directly at the **location input** (NTR, address, map)
- The `?case=` query parameter is read on page load and stored in state as `evaluation_target` — this replaces the user's manual selection
- The step indicator updates accordingly: what was "Screen 1" (case + location) becomes just the location step

### Fallback: `/quickscan/` without a `?case=` param

If someone navigates to `/quickscan/` directly without a `?case=` parameter (e.g., old bookmark, direct URL entry):

- **Redirect to the landing page's situation cards section:** `/#pasirinkite` (or whatever anchor ID the situation cards section has)
- This is cleaner than keeping the case selector as dead fallback code

---

## Change 2: Header "Užsakyti ataskaitą" button

On the **landing page** (index.astro):

- Current: links to `/quickscan/`
- New: **smooth scrolls to the situation cards section** (`#pasirinkite` anchor or equivalent)

On **other pages** (if the header button exists on `/quickscan/` or elsewhere):

- Link to `/#pasirinkite` (navigates to landing page + scrolls to situation cards)

---

## Change 3: Update step indicator

The QuickScan flow currently shows a 3-step progress indicator:
"01 · Įveskite adresą → 02 · Patvirtinkite objektą → 03 · Užsakymas"

Since case selection is removed, the steps are now:
- **Step 1:** Location input (address/NTR/map) — this is what the user sees first
- **Step 2:** Object confirmation (proof card + EPC)
- **Step 3:** Order and payment

The step labels and numbering may already be correct — just verify that no step references "case type selection" or "Ką tiksliai norite."

---

## What to remove

- The entire case type selection UI block (3 choice cards, title, helper text)
- Any JavaScript/state management that waits for the user to pick a case type before showing location input
- Any conditional rendering based on "has the user selected a case type?"

---

## What NOT to change

- Location input (NTR, address, map) — untouched
- Screen 2 (object confirmation, EPC card) — untouched
- Screen 3 (payment, consent) — untouched
- Backend `/resolve` endpoint — untouched (still receives `evaluation_target`)
- Landing page situation cards — untouched (they generate the correct URLs)

---

## Verification

1. Click any situation card on the landing page → arrives at `/quickscan/?case=<value>` → sees location input directly (no case selector)
2. Header "Užsakyti ataskaitą" on landing page → smooth scrolls to situation cards section
3. Navigate to `/quickscan/` without params → redirected to landing page situation cards
4. No trace of the case type selection UI in the QuickScan flow
5. Step indicator shows location as step 1
6. The rest of the flow (Screen 2, Screen 3) works normally