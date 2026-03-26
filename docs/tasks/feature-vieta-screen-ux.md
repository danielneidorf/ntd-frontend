# Feature: Vieta Screen UX Improvements

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/feature-vieta-screen-ux.md
**Branch:** block1-e2e
**Scope:** Make address the primary input, add NTR lookup link, show progressive resolution info

---

## Rationale

Most customers know the address, not the NTR unique number. Currently NTR is listed as option #1, implying it's the main path. Flipping the hierarchy reduces friction for 90% of users. Adding a link to the official NTR lookup empowers the remaining 10%. Showing progressive data during resolution turns wait time into a value-building moment.

---

## Change 1: Reorder inputs — Address becomes primary

### Current order:
1. NTR unikalus numeris (primary)
2. Adresas (secondary)
3. Taškas žemėlapyje (tertiary)
4. Skelbimo nuoroda (coming soon)

### New order:
1. **Adresas** (primary — largest, most prominent)
2. NTR unikalus numeris (secondary — collapsed or smaller)
3. Taškas žemėlapyje (tertiary)
4. Skelbimo nuoroda (coming soon)

### Address field treatment (primary)

- **Title:** "Adresas" (no number badge needed — it's the obvious main input)
- **Placeholder:** "Pradėkite rašyti adresą (gatvė, numeris, miestas)..."
- **Size:** Full width, slightly taller input (48px height), larger font (16px)
- **Helper:** "Pasirinkite adresą iš pasiūlymų — sistema ras objektą automatiškai."
- **Autocomplete behavior (existing):** As the user types, narrowing list of candidates appears. User must select one.
- **Enhancement:** When autocomplete results are available, show the NTR unique number alongside each candidate in the dropdown:

```
┌─────────────────────────────────────────────────┐
│ Žirmūnų g. 12, Vilnius                          │
│ NTR: 4400-1234-5678 · Gyvenamoji · 68 m²        │
├─────────────────────────────────────────────────┤
│ Žirmūnų g. 12-3, Vilnius                        │
│ NTR: 4400-1234-5679 · Butas · 52 m²             │
├─────────────────────────────────────────────────┤
│ Žirmūnų g. 14, Vilnius                          │
│ NTR: 4400-1234-5700 · Gyvenamoji · 85 m²        │
└─────────────────────────────────────────────────┘
```

Each dropdown row shows: address (bold, 15px) + second line with NTR number, purpose, and area (13px muted). This gives the customer immediate confirmation they've found the right object — without needing to know the NTR number themselves.

**NOTE:** This enriched dropdown depends on the backend `/geocode` endpoint returning NTR data alongside address candidates. If the geocoding service doesn't currently return NTR numbers, the dropdown shows addresses only (as today) and the NTR enrichment becomes a future enhancement. Do NOT block the reordering on this — ship the reorder first, enrich later.

### NTR field treatment (secondary)

- **Title:** "Unikalus numeris (NTR)"
- **Collapsed by default:** Show as a clickable expander: "Turite unikalų numerį? →" that reveals the NTR input field when clicked
- **OR** show the field but smaller/less prominent than the address field (no number badge, smaller input height 40px, muted border)
- **Helper:** "Greičiausias ir tiksliausias būdas — sistema objektą ras akimirksniu."
- **NTR lookup link** (new): Below the NTR field, add a small text link:

  "Kur rasti unikalų numerį? →"

  Links to: `https://www.registrucentras.lt/ntr/p/`
  Opens in a new tab (`target="_blank" rel="noopener"`)
  Style: 13px, teal (#0D7377), with external-link icon (↗)

### Map and listing URL stay as-is

- "Taškas žemėlapyje" — same position and styling (option 3 → now option 3 still)
- "Skelbimo nuoroda" — same (coming soon)

---

## Change 2: Progressive resolution feedback

### Current behavior during resolution:
After user clicks "Tęsti", a centered spinner appears: "Tikriname registrus... NTR · PENS · Registrų centras · Kadastras"

### New behavior: progressive data points appearing

Replace the static spinner with a **step-by-step data reveal**. As each registry returns data, show it:

**Layout:** A centered card (~500px wide) with a subtle background (#FAFBFC), showing data points appearing one by one:

```
Ieškome jūsų objekto...

✓ Adresas rastas registruose              (appears at ~0.5s)
✓ Unikalus Nr.: 4400-1234-5678            (appears at ~1.2s)
✓ Paskirtis: Gyvenamoji                   (appears at ~1.8s)
✓ Plotas: 68 m²                           (appears at ~2.5s)
✓ Statybos metai: 1985                    (appears at ~3.0s)
○ Ieškoma energijos duomenų...            (animated dot, still loading)
```

**Each line:**
- Green checkmark (✓) + data label + value — for completed lookups
- Animated grey dot (○) + "Ieškoma..." — for in-progress lookups
- Lines fade in with stagger (translateY(4px→0), opacity 0→1, 0.3s ease)

**Technical approach:**

If the backend `/resolve` endpoint returns all data at once (single response), simulate the progressive reveal with client-side delays:
- Parse the response
- Display data points one by one with 500ms stagger using `setTimeout`
- This creates the "data being gathered" impression even if the actual API call is fast

If the backend supports streaming or the resolve takes multiple sequential calls, show real progress as each sub-call completes.

The progressive reveal should take **3-4 seconds total** regardless of actual resolution time. If the resolver returns faster, the animations still play out (building perceived value). If the resolver is slower, the last item shows "Ieškoma..." until it arrives.

**After all data points shown:** Brief pause (0.5s), then auto-advance to Screen 2 (Patvirtinimas ir apmokėjimas). No need for the user to click anything — the data has been found, the next screen shows it for confirmation.

---

## Change 3: Screen title update

Current title: "Kaip patogiausia nurodyti šio būsto vietą?"

New title depends on case type from URL param:
- `?case=existing_object` → **"Nurodykite objekto vietą"**
- `?case=new_build_project` → **"Nurodykite projekto ar sklypo vietą"**
- `?case=land_only` → **"Nurodykite sklypo vietą"**

Subtitle: remove "Pasirinkite patogų būdą." — unnecessary with address as the obvious primary.

---

## What NOT to change

- Backend `/resolve` endpoint — untouched
- Backend `/geocode` endpoint — untouched (enriched dropdown is a future enhancement)
- Map picker functionality — untouched
- Listing URL field — untouched
- Screen 2 (merged Patvirtinimas + Apmokėjimas) — untouched
- NTR validation regex — untouched

---

## Verification

1. Address field is the first and most prominent input
2. NTR field is secondary (collapsed or smaller)
3. "Kur rasti unikalų numerį? →" link below NTR field opens `registrucentras.lt/ntr/p/` in new tab
4. After clicking Tęsti, progressive data points appear one by one (not a static spinner)
5. Progressive reveal takes ~3-4 seconds with staggered fade-in
6. Screen title varies by case type
7. All existing resolution paths still work (NTR, address, map, listing URL)