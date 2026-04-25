# P7-I7 — Naudojimo sąlygos + Privatumo politika Pages

## What
Create two Astro pages with NTD-branded Lithuanian legal text:
- `src/pages/salygos.astro` — Terms of Service
- `src/pages/privatumas.astro` — Privacy Policy

Wire the consent checkbox links on Screen 2 to these pages.

## Why / Context
The consent checkbox on Screen 2 says "Sutinku su sąlygomis" with links that currently go nowhere (or to `#`). Customers need to read what they're agreeing to before paying €39. Even for MVP launch, real pages must exist.

## How

### Page layout

Both pages use the existing `Layout.astro` with the NTD header + footer. Simple prose — no interactive components, no React islands. Just styled text.

Use the same content width and typography as the landing page prose sections: `max-w-3xl mx-auto px-6 py-12`.

### Content: `/salygos` (Naudojimo sąlygos)

```
# Naudojimo sąlygos

Galioja nuo: 2026 m. [month] [day] d.

## 1. Bendrosios nuostatos

1.1. Šios naudojimo sąlygos (toliau — Sąlygos) reglamentuoja platformos ntd.lt (toliau — Platforma) naudojimą.

1.2. Platformą administruoja [NTD įmonės pavadinimas], juridinio asmens kodas [kodas], registruotos buveinės adresas [adresas] (toliau — NTD arba Mes).

1.3. Naudodamiesi Platforma, Jūs patvirtinate, kad perskaitėte, supratote ir sutinkate su šiomis Sąlygomis.

## 2. Paslaugos aprašymas

2.1. NTD teikia nekilnojamojo turto duomenų analitikos paslaugas. Pagrindinė paslauga — nekilnojamojo turto duomenų ataskaita, apimanti turto duomenų analizę remiantis oficialiais Lietuvos registrų duomenimis.

2.2. Ataskaitos duomenys gaunami iš Registrų Centro (NTR, Kadastras), Nacionalinės energetikos reguliavimo tarybos (PENS), Infostatyba registro ir kitų oficialių šaltinių.

2.3. Ataskaita yra informacinio pobūdžio ir nėra oficialus turto vertinimas, ekspertizė ar teisinis dokumentas. NTD neteikia turto vertinimo paslaugų.

## 3. Užsakymo ir mokėjimo tvarka

3.1. Užsakymas pateikiamas Platformoje nurodant analizuojamo turto adresą arba NTR unikalų numerį.

3.2. Mokėjimas atliekamas per mokėjimų platformą. NTD nerenka ir nesaugo Jūsų mokėjimo kortelės duomenų — juos tvarko mokėjimų paslaugų teikėjas pagal savo saugumo standartus (PCI DSS).

3.3. Ataskaita pateikiama po sėkmingo mokėjimo: el. paštu siunčiama nuoroda į interaktyvią ataskaitą bei galimybė atsisiųsti PDF.

## 4. Ataskaitos naudojimas

4.1. Ataskaita skirta asmeniniam naudojimui. Prieiga suteikiama per unikalią nuorodą.

4.2. Jūs galite dalintis ataskaita su trečiaisiais asmenimis savo nuožiūra, tačiau NTD neatsako už trečiųjų asmenų veiksmus su ataskaitos duomenimis.

4.3. Ataskaitos turinys negali būti naudojamas kaip oficialus turto vertinimo dokumentas teisiniuose procesuose be atskiro susitarimo.

## 5. Atsakomybės ribojimas

5.1. NTD teikia duomenis „tokius, kokie yra" (as is), remdamasi oficialiais registrų šaltiniais. NTD negarantuoja, kad registrų duomenys yra visiškai tikslūs, pilni ar atnaujinti.

5.2. NTD neatsako už nuostolius, kilusius dėl sprendimų, priimtų remiantis ataskaitos duomenimis.

5.3. NTD maksimali atsakomybė bet kuriuo atveju neviršija užsakymo sumos.

## 6. Pinigų grąžinimas

6.1. Kadangi ataskaita sugeneruojama ir pateikiama iš karto po mokėjimo (skaitmeninis turinys), pinigų grąžinimas gali būti netaikomas pagal galiojančius teisės aktus.

6.2. Jei ataskaita nebuvo pateikta arba jos turinys neatitinka Platformoje aprašytos paslaugos, kreipkitės el. paštu, nurodytu svetainėje ntd.lt — išspręsime per 5 darbo dienas.

## 7. Intelektinė nuosavybė

7.1. Platformos dizainas, programinė įranga, metodologijos ir analitikos modeliai yra NTD intelektinė nuosavybė.

7.2. Ataskaitos turinys (duomenys iš registrų) nėra NTD nuosavybė — tai oficialių šaltinių duomenys.

## 8. Baigiamosios nuostatos

8.1. NTD pasilieka teisę keisti šias Sąlygas. Pakeitimai skelbiami Platformoje.

8.2. Šioms Sąlygoms taikoma Lietuvos Respublikos teisė. Ginčai sprendžiami Vilniaus miesto apylinkės teisme.

8.3. Kontaktai: el. paštu, nurodytu svetainėje ntd.lt.
```

### Content: `/privatumas` (Privatumo politika)

```
# Privatumo politika

Galioja nuo: 2026 m. [month] [day] d.

## 1. Duomenų valdytojas

Jūsų asmens duomenų valdytojas yra [NTD įmonės pavadinimas], juridinio asmens kodas [kodas], adresas [adresas], el. paštas — nurodytas svetainėje ntd.lt (toliau — NTD arba Mes).

## 2. Kokie duomenys renkami

Naudojantis Platforma, renkami šie duomenys:

- **El. pašto adresas** — ataskaitos pristatymui.
- **Turto adresas ir/arba NTR numeris** — ataskaitos generavimui. Tai nėra Jūsų asmeniniai duomenys, o analizuojamo turto identifikatoriai.
- **Mokėjimo duomenys** — apdorojami mokėjimų paslaugų teikėjo ir NTD jų nemato bei nesaugo.
- **IP adresas ir naršyklės tipas** — techniniams tikslams ir platformos saugumui.
- **Balso duomenys** — jei naudojatės balso gidu, garso duomenys apdorojami realiu laiku trečiosios šalies paslaugų teikėjo serveriuose ir nėra saugomi NTD serveriuose.

## 3. Duomenų tvarkymo tikslai ir pagrindas

| Tikslas | Teisinis pagrindas (BDAR) |
|---|---|
| Ataskaitos generavimas ir pristatymas | Sutarties vykdymas (6 str. 1 d. b) |
| Mokėjimo apdorojimas | Sutarties vykdymas (6 str. 1 d. b) |
| Ataskaitos saugojimas ir pakartotinė prieiga | Teisėtas interesas (6 str. 1 d. f) |
| Platformos saugumas | Teisėtas interesas (6 str. 1 d. f) |
| Tiesioginė rinkodara | Sutikimas (6 str. 1 d. a), jei pažymėjote |

## 4. Duomenų perdavimas

Jūsų duomenys gali būti perduodami trečiosioms šalims, reikalingoms paslaugų teikimui:

- **Mokėjimų paslaugų teikėjas** — mokėjimų apdorojimui.
- **VĮ Registrų centras** — turto duomenų užklausoms (Lietuva).
- **Balso atpažinimo paslaugų teikėjas** — balso gido veikimui, jei jį naudojate. Garso duomenys apdorojami realiu laiku ir neišsaugomi.
- **Žemėlapių paslaugų teikėjas** — žemėlapių atvaizdavimui.

Duomenų perdavimas trečiosioms šalims, esančioms už EEE ribų, vykdomas pagal ES standartines sutarčių sąlygas arba kitas BDAR numatytas apsaugos priemones.

Jūsų duomenys nėra parduodami trečiosioms šalims.

## 5. Duomenų saugojimo terminai

- **Ataskaitos duomenys** — saugomi 2 metus nuo sugeneravimo datos. Po to ištrinami.
- **El. pašto adresas** — saugomas tiek, kiek reikia ataskaitos pristatymui ir galimam pakartotiniam siuntimui. Ištrinamas per 30 dienų nuo prašymo.
- **Mokėjimo įrašai** — saugomi pagal LR Buhalterinės apskaitos įstatymo reikalavimus (10 metų).
- **Techniniai žurnalai (logs)** — saugomi tiek, kiek reikalinga platformos saugumui ir veikimui užtikrinti.

## 6. Jūsų teisės

Pagal BDAR Jūs turite teisę:

- **Žinoti** (gauti informaciją apie duomenų tvarkymą);
- **Susipažinti** su tvarkomais savo asmens duomenimis;
- **Reikalauti ištaisyti** netikslius duomenis;
- **Reikalauti ištrinti** duomenis („teisė būti pamirštam");
- **Apriboti** duomenų tvarkymą;
- **Perkelti** duomenis kitam valdytojui;
- **Nesutikti** su duomenų tvarkymu;
- **Pateikti skundą** Valstybinei duomenų apsaugos inspekcijai (L. Sapiegos g. 17, Vilnius, ada.lt).

Kreipkitės dėl bet kurios teisės el. paštu, nurodytu svetainėje ntd.lt. Atsakome per 30 kalendorinių dienų.

## 7. Slapukai

Platforma naudoja tik būtinuosius slapukus (session cookies), reikalingus užsakymo procesui. Analitikos slapukai naudojami tik su Jūsų sutikimu.

## 8. Pakeitimai

NTD pasilieka teisę keisti šią Privatumo politiką. Pakeitimai skelbiami Platformoje.

## 9. Kontaktai

El. paštas: nurodytas svetainėje ntd.lt
Svetainė: ntd.lt
```

### Placeholder fields

The text contains `[NTD įmonės pavadinimas]`, `[kodas]`, `[adresas]`, `[month]`, `[day]` placeholders — these get filled once MB is registered. Claude Code should leave them as-is with a `<!-- TODO: Fill after MB registration -->` comment.

### Wire consent links

In `QuickScanFlow.tsx` (Screen 2), the consent checkbox text has links. Update:
- "sąlygomis" → `<a href="/salygos" target="_blank">`
- "privatumo politika" → `<a href="/privatumas" target="_blank">`

Claude Code must find the exact consent text and add the links. The `target="_blank"` ensures the customer doesn't lose their order flow.

## Constraints

- **Astro pages, no React.** Pure HTML + Tailwind, same layout as existing pages.
- **Lithuanian only.** No English version needed for MVP.
- **Content is substantive, not a placeholder.** The text above is ready to use — Claude Code should paste it in, not generate new text.
- **Placeholders for MB details only.** Everything else is final.
- **`target="_blank"` on consent links.** Don't navigate away from the order flow.

## Files to touch

### New files (frontend `~/dev/ntd`):
- `src/pages/salygos.astro`
- `src/pages/privatumas.astro`

### Modified files:
- `src/components/QuickScanFlow.tsx` — consent checkbox links

## Verification

1. `http://localhost:4321/salygos` → renders terms page with all 8 sections.
2. `http://localhost:4321/privatumas` → renders privacy page with all 9 sections.
3. Both pages have NTD header + footer (same layout as other pages).
4. Screen 2 consent links open in new tabs.
5. Build passes, all tests pass.