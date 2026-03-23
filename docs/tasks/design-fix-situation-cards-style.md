# Design Fix: Situation Cards — Much Larger, Titles on One Line

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Make situation cards considerably larger and more prominent

---

## Requirements from review

1. Cards must be **considerably larger** — they should feel like major landing page elements, not small UI components
2. Each card title must **fit on a single line** — no wrapping
3. **Remove** the subtitle line below the heading ("Pasirinkite situaciją — sistema pritaikys paiešką jūsų atvejui." or similar) — heading stands alone

---

## Specific changes

### Heading

- Keep: "Pasirinkite, ką norite išanalizuoti" (centered)
- **Remove** any subtitle/subheading below it — the heading is self-explanatory
- Heading size: **32px** semibold
- Margin below heading: **48px** before cards start

### Card sizing — make them BIG

- Card padding: **40px** (up from ~24px) — generous internal space
- Card min-height: **280px** — cards should feel substantial, like content panels
- Grid gap between cards: **32px**
- Border-radius: **16px** — modern, confident
- Shadow: `0 4px 24px rgba(0, 0, 0, 0.06)` — visible presence

### Titles must fit on one line

- Title font: **22px** semibold, #1A1A2E
- If any title still wraps at 22px inside the card width, reduce to **20px** — but prioritize making the card wide enough
- The 3-column grid should use the full 1200px container width with 32px gaps, giving each card roughly **~370px** internal text width — titles should fit at 20-22px

Current titles for reference:
- "Esamą pastatą ar patalpas" ← fits
- "Naujai statomą ar baigtą projektą" ← longest, may need 20px
- "Tik žemės sklypą" ← fits easily

### Icon/emoji

- Size: **48px** (up from ~32px) — more prominent
- Margin below icon: **20px**

### Description text

- Font: **16px** regular (up from 14px), line-height 1.65, #64748B
- Use the shortened copy:
  - Card 1: "Registruose matomas butas, namas ar komercinė patalpa. Oficialūs duomenys ir įžvalgos."
  - Card 2: "Naujas ar ką tik baigtas projektas. Sklypo ir projekto duomenų analizė."
  - Card 3: "Sklypas be šildomų pastatų. Aplinkos, teisiniai ir kainos duomenys."
- Margin below description: **24px**

### CTA button

- Bottom-aligned across all cards (flex column + `margin-top: auto` on button wrapper)
- Button: navy (#1E3A5F) background, white text, **15px** medium, padding **12px 28px**, border-radius **8px**
- Button text: "Užsakyti ataskaitą"
- Hover: slightly lighter navy + subtle shadow

### Hover state for entire card

- `translateY(-4px)` lift
- Shadow grows to `0 12px 40px rgba(0, 0, 0, 0.10)`
- Teal top border appears: 3px solid #0D7377
- Transition: 0.25s ease

### Section spacing

- Section top padding: **60px**
- Section bottom padding: **60px**
- Background: keep current (#FAFBFC or white)

---

## What NOT to change

- Card links (/quickscan/?case=...) — untouched
- CTA text "Užsakyti ataskaitą" — untouched
- Heading text — untouched
- Hero, pricing, footer — untouched

---

## Verification

1. Cards are visibly larger — min-height 280px, 40px padding, they dominate the section
2. ALL three titles fit on a single line — no wrapping
3. No subtitle below the section heading
4. "Užsakyti ataskaitą" buttons aligned at the same vertical position across all three cards
5. Cards have visible shadow and 16px rounded corners
6. Hover: noticeable lift + shadow + teal top accent
7. Icons are large (48px)
8. Description text is comfortable at 16px with good line-height