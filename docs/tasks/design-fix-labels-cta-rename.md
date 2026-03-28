# Design Fix: Match Case Labels, Pricing CTA, Comparison Card Rename

**Repo:** ~/dev/ntd
**Path:** ~/dev/ntd/docs/tasks/design-fix-labels-cta-rename.md
**Branch:** block1-e2e
**Scope:** Three small content changes across the landing page and Vieta screen

---

## Fix 1: Case toggle labels must match situation card titles

The Vieta screen case toggle labels must use the same wording as the landing page situation card titles. Currently they don't match — this confuses users who clicked a situation card and see different text on the next screen.

### Landing page situation card titles (the source of truth)

1. **"Esamą pastatą ar patalpas"**
2. **"Naujai statomą, nebaigtą projektą"**
3. **"Tik žemės sklypą"**

### Vieta screen toggle labels — UPDATE to match

| Current toggle label | New toggle label |
|---|---|
| 🏠 Pastatas / patalpos | 🏠 **Esamą pastatą ar patalpas** |
| 🏗️ Naujas projektas | 🏗️ **Naujai statomą, nebaigtą projektą** |
| 🌿 Žemės sklypas | 🌿 **Tik žemės sklypą** |

The toggle segments may need to be slightly wider or the text slightly smaller (13px instead of 14px) to accommodate the longer labels. Test and adjust.

---

## Fix 2: Add "Užsakyti ataskaitą" CTA button to the pricing card

The pricing card (39€, left side of pricing section) currently has no CTA button — we removed it to avoid looking desperate. However, a button is needed here as an entry point to the QuickScan flow.

### Add

A navy button at the bottom of the pricing card:

**"Užsakyti ataskaitą"** — same styling as other navy CTA buttons on the site (background #1E3A5F, white text, border-radius 8px, padding 12px 24px, full width within the card, 14px medium)

### Link behavior

Scrolls to the **situation cards section** (`#pasirinkite` or equivalent anchor) on the landing page — same behavior as the header "Užsakyti ataskaitą" button. The user picks their case from the situation cards, then proceeds to the Vieta screen.

This is NOT a payment button — it's a navigation CTA that guides the user to the case selection step.

---

## Fix 3: Rename "Ekspertinis patikrinimas" to "Eksperto samdymas"

In the comparison cards section ("Kaip tai palyginti"), Card 2:

- Current title: **"Ekspertinis patikrinimas"**
- New title: **"Eksperto samdymas"**

This is a more accurate description — the alternative to NTD is hiring an expert, not just getting a check.

---

## What NOT to change

- Pricing card content (price, bullets) — untouched
- Comparison cards layout and styling — untouched
- NTD comparison card — untouched
- "Tikrinti pačiam" card — untouched
- Landing page situation card titles — untouched (they are the source of truth)
- Vieta screen layout — untouched

---

## Verification

1. Navigate to landing page → click "Esamą pastatą ar patalpas" situation card → Vieta screen toggle shows **the same text** "Esamą pastatą ar patalpas" pre-selected
2. Same for the other two cases — toggle text matches situation card text exactly
3. Pricing card has "Užsakyti ataskaitą" button at the bottom
4. Clicking the pricing CTA scrolls to the situation cards section
5. Comparison card 2 reads "Eksperto samdymas" (not "Ekspertinis patikrinimas")