# Dev: Temporary Navigation Link to Screen 2

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/dev-temp-screen2-link.md
**Branch:** block1-e2e
**Scope:** Add a temporary dev-only header link to navigate directly to Screen 2; add URL param to force screen state

---

## ⚠️ TEMPORARY — Remove before production deploy

This is a development aid for UI iteration. Remove both changes before any public deployment.

---

## Change 1: Temporary header link

Add a new link to the header nav bar, visually distinct from the real links:

**Position:** Between "Objekto paieška" and "Kaina"

**Text:** "Patvirtinimas ⚙️"

**Style:** Different from regular nav links to signal it's dev-only:
- Color: **#E8A040** (amber/orange) instead of white
- Font-style: italic
- Same font-size as other nav links

**Link:** `/quickscan/?case=existing_object&step=2`

---

## Change 2: Force-screen URL parameter

In `QuickScanFlow.tsx`, read a `step` query parameter on mount:

```javascript
const urlParams = new URLSearchParams(window.location.search);
const forceStep = urlParams.get('step');
if (forceStep === '2') {
  // Set the screen state to Screen 2 (confirmation + payment)
  // Populate resolver result with mock/stub data so the screen renders:
  setResolverResult({
    status: 'resolved',
    candidates: [{
      id: 'dev-mock-001',
      address: 'Vilnius, Žirmūnų g. 12',
      ntr_unique_number: '4400-XXXX-XXXX',
      municipality: 'Vilniaus m.',
      kind: 'whole_building',
      purpose: 'Gyvenamoji',
      premises_type: null,
      heated_flag: true,
      bundle_summary: 'Pagrindinis objektas: Gyvenamosios paskirties pastatas (šildomas). Komplekte taip pat yra: garažas, sandėliukas.',
      lat: 54.710,
      lng: 25.290,
    }]
  });
  setCurrentStep(2); // or however the step state is named
}
```

The mock data doesn't need to be complete — just enough to render Screen 2's proof card with realistic-looking content. Adjust the field names to match the actual component state.

---

## What NOT to change

- Screen 1 (Vieta) functionality — untouched
- Screen 2 content/layout — untouched (we're just adding a way to reach it)
- Backend — untouched (mock data is frontend-only)
- Production header — these changes must be removed before deploy

---

## Verification

1. Header shows "Patvirtinimas ⚙️" link in amber/italic between "Objekto paieška" and "Kaina"
2. Clicking it navigates to `/quickscan/?case=existing_object&step=2`
3. Screen 2 renders with mock data — proof card showing Žirmūnų g. 12, bundle info, map
4. The page is usable for visual inspection and UI iteration