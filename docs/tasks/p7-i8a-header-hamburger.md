# P7-I8a — Header Mobile Hamburger

## What
Add a hamburger menu to `Header.astro` for screens under `md` (768px). Logo + CTA button stay visible. Nav items ("Objekto paieška", "Kaina") and the Dev dropdown move behind the hamburger.

## Why
The header has 4 production items totaling ~480px + spacing. At 390px (iPhone) they overflow. The logo (179px) + CTA button (158px) alone fill the width, so the middle nav items must collapse.

## How

### Mobile layout (< 768px)
```
┌──────────────────────────────────┐
│ NT Duomenys   ☰  Užsakyti →     │
└──────────────────────────────────┘
```

- Logo left, CTA button right, hamburger icon between them
- Tapping ☰ opens a full-width dropdown below the header:
```
┌──────────────────────────────────┐
│ NT Duomenys   ✕  Užsakyti →     │
├──────────────────────────────────┤
│ Objekto paieška                  │
│ Kaina                            │
│ Dev ⚙️  (if present)            │
└──────────────────────────────────┘
```

### Desktop layout (≥ 768px)
Unchanged — all items in one row as now.

### Implementation

This is a CSS + minimal JS change in `Header.astro`. No React needed.

```astro
<!-- Hamburger button — visible only on mobile -->
<button id="menu-toggle" class="md:hidden text-white p-2" aria-label="Meniu">
  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
</button>

<!-- Nav items — hidden on mobile until toggled -->
<div id="mobile-menu" class="hidden md:flex items-center gap-6">
  <a href="/quickscan/">Objekto paieška</a>
  <a href="/kaina">Kaina</a>
  <!-- Dev dropdown if present -->
</div>

<script>
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  toggle?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
    // Swap hamburger ↔ close icon
  });
</script>
```

### Mobile menu styling

When open, the menu drops below the header as a full-width navy panel:
```css
/* Mobile menu open state */
#mobile-menu.open {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 64px; /* header height */
  left: 0;
  right: 0;
  background: #1E3A5F;
  padding: 16px;
  gap: 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
```

Each menu item: full width, 48px min height (touch target), white text, subtle hover.

### CTA button on mobile

Reduce padding slightly so it fits alongside the hamburger:
```
md:px-5 md:py-2.5 → px-3 py-1.5 text-sm md:px-5 md:py-2.5 md:text-base
```

## Constraints

- **Astro component, no React.** Vanilla JS for toggle.
- **`md:` breakpoint (768px).** Desktop layout unchanged above this.
- **CTA always visible.** Never hide "Užsakyti ataskaitą" — it's the conversion button.
- **Logo always visible.** "NT Duomenys | ntd.lt" stays.
- **Dev dropdown stays in hamburger** for now (removed at K4 launch).
- **Close on navigation.** When user clicks a menu link, menu closes.
- **Close on outside click.** Tapping outside the menu closes it.
- **aria-label and aria-expanded** for accessibility.

## Files to touch

### Modified files (frontend `~/dev/ntd`):
- `src/components/Header.astro` — add hamburger toggle, responsive classes

## Verification

1. Desktop (≥768px): header looks identical to current.
2. At 390px: logo + hamburger + CTA in one row, no overflow.
3. Tap hamburger: menu opens with "Objekto paieška" and "Kaina".
4. Tap a link: navigates + menu closes.
5. Tap outside: menu closes.
6. All pages (landing, quickscan, report, salygos, privatumas) have correct header behavior.
7. Build passes, all tests pass.