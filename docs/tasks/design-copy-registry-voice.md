# Design: Copy Update — Registry Voice + CTA Change

**Repo:** ~/dev/ntd
**Branch:** block1-e2e
**Scope:** Update hero copy to remove first-person "mes" language; change all CTAs to "Gauti ataskaitą"

---

## 1. Hero value story copy (Hero.astro)

Find the value story text block and replace:

**Current:**
```
Kiekvieno objekto DNR — vienoje vietoje.

Šalia to, ką pasakoja pardavėjas, kiekvienas objektas turi savo istoriją.
Skelbimas parodo fasadą — mes parodome, kas už jo.

Ar perkate, ar nuomojate — norite žinoti tiesą: tikrąsias energijos
sąnaudas, šiluminį komfortą, teisines rizikas, kainos pagrįstumą. Bet
objekto ekspertizė kainuoja šimtus eurų ir trunka dienas.

Mes surenkame duomenis, apskaičiuojame ir pateikiame aiškias įžvalgas,
kad galėtumėte rinktis ne akimis, o faktais.
```

**New:**
```
Kiekvieno objekto DNR — vienoje vietoje.

Šalia to, ką pasakoja pardavėjas, kiekvienas objektas turi savo istoriją.
Skelbimas parodo fasadą — registrų duomenys parodo, kas už jo.

Ar perkate, ar nuomojate — tikrosios energijos sąnaudos, šiluminis
komfortas, teisinės rizikos ir kainos pagrįstumas prieinami iš oficialių
šaltinių. Objekto ekspertizė kainuoja šimtus eurų ir trunka dienas.

Duomenys surenkami, apskaičiuojami ir pateikiami kaip aiškios įžvalgos —
kad sprendimus priimtumėte faktais, ne akimis.
```

**Principle:** No first-person "mes." The data and registry sources are the grammatical subject. Reads like an institutional system describing its function.

---

## 2. CTA buttons — change to "Gauti ataskaitą"

### Hero button (Hero.astro)
- Current: `Gauti įžvalgas`
- New: **`Gauti ataskaitą`**

### Header nav button (Header.astro)
- Current: `Gauti įžvalgas`
- New: **`Gauti ataskaitą`**

### Payment button (QuickScanFlow.tsx)
- Current: `Mokėti ir siųsti ataskaitą`
- New: **`Mokėti ir gauti ataskaitą`**

This settles open decision D1 from the Phase 6 Plan Update v1.1.

---

## What NOT to change

- No structural/layout changes
- No animation changes
- No color/typography changes
- Only text content is modified

---

## Verification

1. `npm run dev` — hero shows updated copy without any "mes"
2. Hero CTA button reads "Gauti ataskaitą"
3. Header nav CTA reads "Gauti ataskaitą"
4. Navigate to /quickscan/ and proceed to Screen 3 — payment button reads "Mokėti ir gauti ataskaitą"
5. Grep the codebase for "Gauti įžvalgas" — should return zero results
6. Grep for "mes parodome" and "Mes surenkame" — should return zero results