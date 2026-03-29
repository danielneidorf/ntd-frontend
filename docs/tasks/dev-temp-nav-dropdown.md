# Dev: Temporary Navigation Dropdown — All Dev Screen Links

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/dev-temp-nav-dropdown.md
**Branch:** block1-e2e
**Scope:** Replace individual dev links with one dropdown; add resolver state links

---

## ⚠️ TEMPORARY — Remove entire dropdown before production deploy

---

## Replace individual dev links with a dropdown

Currently there are (or will be) several amber dev links cluttering the header. Replace them all with a single **dropdown menu**.

### Dropdown trigger in header

**Text:** "Dev ⚙️"
**Style:** amber (#E8A040), italic — visually distinct from real nav items
**Position:** after "Kaina", before "Užsakyti ataskaitą" button
**Behavior:** click to toggle dropdown; click outside to close

### Dropdown menu items

When clicked, the dropdown shows a small panel below with these links:

| Label | URL | Description |
|---|---|---|
| Vieta (Screen 1) | `/quickscan/?case=existing_object` | Normal Screen 1 |
| Patvirtinimas (Screen 2) | `/quickscan/?case=existing_object&step=2` | Screen 2 with mock resolver data |
| Sėkmė (Success) | `/quickscan/?case=existing_object&step=success` | Success screen with mock data |
| R-A: Ieškoma... | `/quickscan/?case=existing_object&step=resolver-loading` | Resolver loading state |
| R-B: Klaida | `/quickscan/?case=existing_object&step=resolver-failure` | Resolver soft failure state |
| R-C: Nerasta | `/quickscan/?case=existing_object&step=resolver-nomatch` | Resolver no match state |

### Dropdown styling

```css
.dev-dropdown {
  position: relative;
  display: inline-block;
}

.dev-dropdown-trigger {
  color: #E8A040;
  font-style: italic;
  cursor: pointer;
  font-size: 14px;
}

.dev-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #1E3A5F;
  border: 1px solid #E8A040;
  border-radius: 8px;
  padding: 8px 0;
  min-width: 240px;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.dev-dropdown-menu a {
  display: block;
  padding: 8px 16px;
  color: #E8A040;
  font-size: 13px;
  text-decoration: none;
  font-style: italic;
}

.dev-dropdown-menu a:hover {
  background: rgba(232, 160, 64, 0.1);
}
```

---

## Resolver state URL params + mock rendering

In QuickScanFlow.tsx, handle the resolver state URL params:

### `step=resolver-loading`

Render the **progressive data reveal** (from feature-vieta-screen-ux.md):

A centered card (~500px wide) with data points appearing one by one in a loop:

```
Ieškome jūsų objekto...

✓ Adresas rastas registruose              (appears at ~0.5s)
✓ Unikalus Nr.: 4400-1234-5678            (appears at ~1.2s)
✓ Paskirtis: Gyvenamoji                   (appears at ~1.8s)
✓ Plotas: 68 m²                           (appears at ~2.5s)
✓ Statybos metai: 1985                    (appears at ~3.0s)
○ Ieškoma energijos duomenų...            (animated dot, still loading)
```

Each line: green checkmark (✓) + label + value, fading in with stagger (translateY(4px→0), opacity 0→1, 0.3s).

For the dev preview, the animation loops endlessly — resets every ~5s and replays. In production, after the real resolver returns, the animation completes and auto-advances to Screen 2.

Below the card: small muted text "Tai paprastai trunka kelias sekundes." — 13px, #94A3B8

### `step=resolver-failure`

Render the soft failure state:

Centered card with:
- ⚠️ Warning icon (24px, #F59E0B amber)
- **"Registrų paieška užtrunka ilgiau nei įprasta."** — 16px semibold, #1A1A2E
- "Prašome palaukti arba bandyti vėliau." — 14px, #64748B
- Button: **"Bandyti dar kartą"** — navy outline button
  - In dev mode: clicking just re-renders the same state
  - In production: retries the resolver call

### `step=resolver-nomatch`

Render the no match state:

Centered card with:
- 🔍 Search icon (24px, #64748B)
- **"Nepavyko rasti objekto pagal pateiktus duomenis."** — 16px semibold, #1A1A2E
- "Prašome patikslinti arba pabandyti kitą identifikavimo būdą." — 14px, #64748B
- Button: **"← Grįžti"** — navy outline button
  - Links back to Screen 1 with inputs preserved

### Shared card styling for all three states

```css
.resolver-state-card {
  max-width: 500px;
  margin: 120px auto 0;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  text-align: center;
}
```

---

## Remove old individual dev links

Remove from the header:
- ~~"Patvirtinimas ⚙️"~~ (amber link)
- ~~"Sėkmė ⚙️"~~ (amber link, if already added)

These are now inside the dropdown.

---

## What NOT to change

- Real nav items (Objekto paieška, Kaina, Užsakyti ataskaitą) — untouched
- Screen content — untouched
- Backend — untouched

---

## Verification

1. Header shows "Dev ⚙️" amber dropdown trigger (replaces individual dev links)
2. Clicking it shows dropdown with 6 links
3. Each link renders the correct screen/state with mock data
4. **R-A (resolver-loading):** progressive data points appear one by one in a staggered animation, loops in dev mode
5. **R-B (resolver-failure):** warning icon + message + "Bandyti dar kartą" button
6. **R-C (resolver-nomatch):** search icon + message + "← Grįžti" button
7. Dropdown closes when clicking outside
8. All dev links are visually distinct (amber, italic) from real nav items