# Design Fix: NTR Field — Always Visible + Prominent Lookup Link

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-ntr-always-visible.md
**Branch:** block1-e2e
**Scope:** Make the NTR unique number field always visible (not collapsible); show "Kur rasti unikalų numerį?" link prominently

---

## Problem

The NTR field is currently hidden behind a collapsible expander: "Turite unikalų numerį (tiksliausias būdas)? → spauskite čia". This hides useful information from the user. Even if NTR is rarely used, the user should see:
- What a unique number is
- Where to find it
- The input field ready to use

The "Kur rasti unikalų numerį?" link is currently not visible at all (it's inside the collapsed section or not yet implemented).

---

## Fix: Make NTR a full card, always expanded

Replace the collapsible expander with a **permanent card** — same styling as the Address and Map cards. Always visible, never collapsed.

### Card structure

**Card wrapper:** same styling as all other location cards:
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 12px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
```

**Card title:** **"Unikalus numeris (NTR)"** — 18px semibold, #1A1A2E

**Input field:** always visible, same sizing as the address input:
- Height: 48px
- Font: 16px
- Placeholder: "pvz., 1234-5678-9012"
- Border-radius: 8px

**Helper text below input:** "Greičiausias ir tiksliausias būdas — sistema objektą ras akimirksniu." — 14px, #64748B

**"Kur rasti?" link — PROMINENT, below the helper text:**

"Kur rasti unikalų numerį? ↗" — 14px medium, #0D7377 teal, with external link icon (↗)

- Links to: `https://www.registrucentras.lt/ntr/p/`
- Opens in a new tab (`target="_blank" rel="noopener"`)
- This link must be **immediately visible** when the page loads — not inside a tooltip, not behind a click, not in small grey text. It's a teal link that stands out.

### Card order on the Vieta screen

1. **Address card** (primary — largest, most prominent)
2. **NTR card** (always visible, with lookup link)
3. **Map card**
4. **Listing URL card** (Skelbimo nuoroda)

---

## What to remove

- The collapsible expander pattern ("Turite unikalų numerį? → spauskite čia")
- Any show/hide JavaScript for the NTR section

---

## What NOT to change

- Address card — untouched
- Map card — untouched
- Listing URL card — untouched
- NTR validation regex — untouched
- Backend — untouched
- This applies to ALL case types (existing_object, new_build_project, land_only)

---

## Verification

1. NTR input field is visible immediately on page load — no clicking to expand
2. Card looks identical in style to the Address and Map cards
3. "Kur rasti unikalų numerį? ↗" link is visible below the input, in teal
4. Clicking the link opens `registrucentras.lt/ntr/p/` in a new tab
5. The user understands what NTR is and where to find it without any interaction