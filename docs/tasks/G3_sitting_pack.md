# G3 sitting pack — every item verbatim, with citations

**Date:** 2026-08-07 · **Lane:** Code (Cowork) · **Mode: read-only extraction.** Nothing was fixed,
renamed, or reworded; this commit adds this file and nothing else.
**Brief:** `docs/tasks/G3_sitting_pack_brief.md`

## HEAD, measured in-session

```
backend  e2b95352ffde3ebe53aba3b9b37bf5a8be00f519
frontend 9b02b6d63e95ff2011d2682f06094bbc897de010
```

Both clean and level with `origin/main` at extraction time. **Every citation below is at these
hashes.**

## Extraction method (the Rider-0 lesson)

This pack is the **pen-side artifact**: what is ruled here is this text, and the landing session
must byte-compare landed strings against it. So **no string in this document was typed by hand.**

- **Section A** was produced by a script that slices the allowlist literal out of
  `extinctionPin.test.ts` by byte offset, `eval`s it, and emits the table — strings and survival
  reasons both. Sites were found by substring search over the eight scanned components.
- **Sections B–E** were produced by a script that reads the cited files and copies the exact source
  lines, numbered, into fenced blocks.
- **Section B's rendered example** came from the real PDF renderer plus `pdfminer` text extraction.
- **Section F** used `git grep` over all tracked files in both repos — the enumeration is complete
  over tracked content, which is the boundary stated.

Counts are measured, never carried. Where a count contradicts a filename or a prior estimate, the
measurement is reported as such.

---

# A — the extinction pin's allowlist

**The sitting's main work list: 48 entries.** The brief's "~40" was a carried estimate; the measured
count is **48**.

Extracted from `src/components/report/__tests__/extinctionPin.test.ts` lines 80–293. **Count measured: 48.**

`authored` = the literal in code (comment lines excluded). `rendered` = where it reaches the page — the same site when the literal is inline, or the use-sites of the constant it is bound to.

| ID | String (verbatim) | Authored | Rendered | Survival reason (quoted from the pin) |
|---|---|---|---|---|
| A1 | `Tipinės namų ūkio elektros sąnaudos` | src/components/report/Block2Section.tsx:78 | src/components/report/Block2Section.tsx:795 | Reference-table caption (§7.7). Backend twin: templates_lt.HOUSEHOLD_REFERENCE_CAPTION_LT, pinned character-equal by tests/reports/test_info_section.py. |
| A2 | `Kokia informacija remiamės?` | src/components/report/InfoSection.tsx:9<br>*also in comments: src/components/report/Block2Section.tsx:72* | src/components/report/InfoSection.tsx:42 | InfoSection's DEFAULT title. Block 2 already passes the served `info_section.title_lt`; BLOCK 1 does not — its keyed payload carries no title at all, so the default renders. Backend twin: block2/templates_lt.INFO_SECTION_TITLE_LT, pinned equal. Retires when block1's info box is served its title too. |
| A3 | `Vidutinė mėnesinė kaina` | src/components/report/Block2Section.tsx:63 | src/components/report/Block2Section.tsx:354 | The monthly chart's average-line label. Copied verbatim from the PDF legend to close a parity gap; not ruled, not served. |
| A4 | `Pastovūs mokesčiai` | src/components/report/Block2Section.tsx:43 | *inline — same site* | Chart band label (fixed charges). Unruled; PDF draws its own. → copy sitting. |
| A5 | `Karštas vanduo` | src/components/report/Block2Section.tsx:44 | *inline — same site* | Chart band label (hot water). Unruled; PDF draws its own. → copy sitting. |
| A6 | `Šildymas` | src/components/report/Block2Section.tsx:45 | *inline — same site* | Chart band label (heating). Unruled; PDF draws its own. → copy sitting. |
| A7 | `Vėsinimas` | src/components/report/Block2Section.tsx:46 | *inline — same site* | Chart band label (cooling). Unruled; PDF draws its own. → copy sitting. |
| A8 | `Buitinė elektra` | src/components/report/Block2Section.tsx:47 | *inline — same site* | Chart band label (household electricity). Unruled; PDF draws its own. → copy sitting. |
| A9 | `2) Energijos sąnaudos` | src/components/report/Block2Section.tsx:496<br>src/components/report/Block2Section.tsx:560 | *inline — same site* | Block 2's own heading. The PDF reads a served `block2.heading`; the web numbers and titles the section itself. Unruled. → copy sitting. |
| A10 | `/ mėn.` | src/components/report/Block2Section.tsx:581 | *inline — same site* | The metric unit beside the headline €. ALREADY SERVED as `block2.metric.unit_lt` and already read by the PDF (`block2.metric_unit_lt or "/ mėn."`); the web still prints its own. A live one-sided divergence, reported not closed — closing it is a wire change outside the ruled eighteen. |
| A11 | `Pagrindiniai veiksniai` | src/components/ReportViewer.tsx:326 | *inline — same site* | DriversSection's DEFAULT heading, used by the summer-drivers caller. The winter caller now passes the served №9. Retires when the summer heading is ruled and served alongside it. (Carries no Lithuanian-specific letter, so the scan below cannot see it — it is here for the staleness check, which searches every rendered string.) |
| A12 | `1) Vidaus patalpų klimato komfortas` | src/components/ReportViewer.tsx:624<br>src/components/ReportViewer.tsx:636 | *inline — same site* | Block 1's own heading — same class as Block 2's above: the web numbers and titles its sections, print reads a served heading. Unruled. → copy sitting. |
| A13 | `Neįvertinta` | src/components/ReportViewer.tsx:207 | *inline — same site* | The chip on the not-assessed winter band. Its SENTENCE is ruled (№11–14) and served; the one-word chip is not. → copy sitting. |
| A14 | `Žiema` | src/components/ReportViewer.tsx:299 | *inline — same site* | The summary section's winter column heading. Unruled. → copy sitting. |
| A15 | `Ruošiama...` | src/components/ReportViewer.tsx:164 | *inline — same site* | The recalc action button's busy state. Journey copy, parked for the journey-copy sitting with the Screen-1/D8 surfaces. |
| A16 | `Bandykite dar kartą.` | src/components/ReportViewer.tsx:542 | *inline — same site* | The report page's own error state (not the ruled №35 line below it, which is served). Journey/error copy, parked for the journey-copy sitting. |
| A17 | `sandėliukas` | src/components/ReportViewer.tsx:75 | *inline — same site* | Bundle-item kind label („Komplekte taip pat yra"). Unruled. → copy sitting. |
| A18 | `garažas` | src/components/ReportViewer.tsx:76 | *inline — same site* | Bundle-item kind label. Unruled. → copy sitting. |
| A19 | `Vieši šaltiniai` | src/components/report/AdditionalDocuments.tsx:103 | *inline — same site* | Section heading authored on the web. Unruled — one sitting should rule the heading set together rather than move them one at a time. |
| A20 | `Savininko prieiga` | src/components/report/AdditionalDocuments.tsx:114 | *inline — same site* | Section heading authored on the web. Unruled — one sitting should rule the heading set together rather than move them one at a time. |
| A21 | `Vasaros perkaitimo rizika` | src/components/ReportViewer.tsx:240 | *inline — same site* | Section heading authored on the web. Unruled — one sitting should rule the heading set together rather than move them one at a time. |
| A22 | `Ką tai reiškia praktiškai?` | src/components/ReportViewer.tsx:289<br>*also in comments: src/components/ReportViewer.tsx:226, src/components/ReportViewer.tsx:266* | *inline — same site* | Section heading authored on the web. Unruled — one sitting should rule the heading set together rather than move them one at a time. |
| A23 | `Derybų kampai` | src/components/report/Block8Section.tsx:109 | *inline — same site* | Section heading authored on the web. Unruled — one sitting should rule the heading set together rather than move them one at a time. |
| A24 | `Ką patikrinti apžiūros metu` | src/components/report/Block8Section.tsx:93 | *inline — same site* | Section heading authored on the web. Unruled — one sitting should rule the heading set together rather than move them one at a time. |
| A25 | `Jūsų pastatas` | src/components/report/ComfortBar.tsx:123 | *inline — same site* | The marker beside the active comfort band. Print uses the ◄ glyph ALONE, so a print reader is never told what the arrow means — a live divergence. → ruling owed. |
| A26 | `Šiems dokumentams reikalinga Registrų centro savitarnos paskyra (savininko arba įgalioto asmens prieiga).` | src/components/report/AdditionalDocuments.tsx:117 | *inline — same site* | Owner-access explainer. Web-only panel; print has no owner section. → copy sitting. |
| A27 | `Šiame bloke apžvelgiame, kiek lengva šiame būste palaikyti komfortišką temperatūrą žiemą ir kokia yra perkaitimo rizika vasarą.` | src/components/ReportViewer.tsx:626<br>src/components/ReportViewer.tsx:638<br>*JSX wraps; matched on leading fragment* | *inline — same site* | Block 1's intro paragraph — the counterpart of Block 2's `intro_lt`, which the backend DOES serve. Retires when Block 1 serves its intro too. |
| A28 | `Atsisiųsti PDF` | src/components/ReportViewer.tsx:58<br>src/components/ReportViewer.tsx:66 | *inline — same site* | Page chrome / error state. Journey copy, parked for the journey-copy sitting. |
| A29 | `Grįžti į pradžią` | src/components/ReportViewer.tsx:528 | *inline — same site* | Page chrome / error state. Journey copy, parked for the journey-copy sitting. |
| A30 | `Bandyti dar kartą` | src/components/ReportViewer.tsx:547 | *inline — same site* | Page chrome / error state. Journey copy, parked for the journey-copy sitting. |
| A31 | `Nepavyko įkelti ataskaitos` | src/components/ReportViewer.tsx:540 | *inline — same site* | Page chrome / error state. Journey copy, parked for the journey-copy sitting. |
| A32 | `Nuoroda gali būti netinkama arba pasibaigusi.` | src/components/ReportViewer.tsx:522 | *inline — same site* | Page chrome / error state. Journey copy, parked for the journey-copy sitting. |
| A33 | `Žemės sklypas` | src/components/ReportViewer.tsx:483<br>src/components/ReportViewer.tsx:595<br>src/components/ReportViewer.tsx:614<br>src/components/report/PropertyProfile.tsx:283 | src/components/report/PropertyProfile.tsx:286 | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A34 | `Šildomas plotas` | src/components/report/PropertyProfile.tsx:326<br>*also in comments: src/components/report/PropertyProfile.tsx:294* | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A35 | `Naudojimo grupė` | src/components/report/PropertyProfile.tsx:359 | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A36 | `Aukštų skaičius` | src/components/report/PropertyProfile.tsx:362 | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A37 | `Sienų medžiaga` | src/components/report/PropertyProfile.tsx:363 | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A38 | `Šildymo tipas` | src/components/report/PropertyProfile.tsx:364 | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A39 | `Energinė klasė` | src/components/report/PropertyProfile.tsx:79<br>src/components/report/PropertyProfile.tsx:373<br>*also in comments: src/components/report/PropertyProfile.tsx:72* | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A40 | `Energijos sąnaudos` | src/components/report/Block2Section.tsx:496<br>src/components/report/Block2Section.tsx:560<br>src/components/report/PropertyProfile.tsx:384 | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A41 | `Duomenų šaltinis` | src/components/report/PropertyProfile.tsx:394<br>*also in comments: src/components/report/PropertyProfile.tsx:389* | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A42 | `Langų dalis fasade` | src/components/report/PropertyProfile.tsx:406 | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A43 | `Langų duomenų šaltinis` | src/components/report/PropertyProfile.tsx:410 | *inline — same site* | Property-card row label. Unruled, and the PDF prints its own copy of the same table — the whole label set wants one sitting and one served vocabulary, not eleven separate moves. |
| A44 | `Energinė klasė ${active} skalėje nuo ${lo} iki ${hi}` | src/components/report/PropertyProfile.tsx:79 | *inline — same site* | The class ladder's accessible name, composed from the served class. Unruled; print has no accessibility layer to diverge from. → copy sitting. |
| A45 | `Energinės klasės skalė nuo ${lo} iki ${hi}` | src/components/report/PropertyProfile.tsx:80 | *inline — same site* | The empty-state variant of the same accessible name. → copy sitting. |
| A46 | `Kadastro žemėlapis (REGIA)` | src/components/report/AdditionalDocuments.tsx:18 | *inline — same site* | Document link label; diverges from the PDF's own wording. → ruling owed. |
| A47 | `Teritorijų planavimo dokumentai (TPDR)` | src/components/report/AdditionalDocuments.tsx:28 | *inline — same site* | Document link label; diverges from the PDF's own wording. → ruling owed. |
| A48 | `Kadastro duomenų byla ir aukštų planai` | src/components/report/AdditionalDocuments.tsx:36 | *inline — same site* | Owner-access link label. Web-only panel (print has no owner section at all), so nothing to diverge from yet. → ruling owed. |

## Notes on A, from the measurement

- **44 of the 48 are inline literals**; 4 are bound to named constants and rendered elsewhere
  (`HOUSEHOLD_REFERENCE_CAPTION`, `AVERAGE_LABEL_LT` and the chart-band / info-title constants in
  `Block2Section.tsx`). The table separates the two columns because a ruling that moves a constant
  moves every use-site, and a ruling that moves an inline literal moves one line.
- **5 entries also appear inside comments.** Comment lines are excluded from the "Authored" column
  and listed separately — a component may RECORD a retired wording without rendering it, which is
  the same distinction the pin itself makes by stripping comments before scanning.
- **A27 is authored twice in one file.** `ReportViewer.tsx:626` and `:638` carry the same Block-1
  intro paragraph — the not-applicable branch and the applicable branch each hold a copy. It is
  also the single entry whose JSX text wraps across lines, so it matched on a leading fragment:
  the pin's own documented blind spot #2, visible in its own allowlist.
- **Eleven entries render at more than one site.** A ruling that moves one of these moves every
  site.
- The pin's stated blind spots bound this list: it keys on Lithuanian-specific letters, so a
  Lithuanian string without one passes through unseen (A12 „Pagrindiniai veiksniai" is on the list
  for exactly that reason and is invisible to the scan).

---

# B — the PDF hero source-line

The superseded "№40 candidate". Template verbatim, `bustodnr_api/templates/report_pdf.html:363-385`:

```jinja
363|     {% set reg_src = snapshot.registry_epc_kwhm2_year_source | default(none) %}
364|     {% if snapshot.epc_source_class == "registry" and reg_src == "tier_2_pens_israsas" %}
365|       {# The register's name comes from the ONE constant (see
366|          block1_indoor_conditions.EPC_REGISTER_NAME_LT) — it used to be
367|          hardcoded here, a third copy beside the label map and the sources
368|          line. This branch adds only the certificate identification. #}
369|       <br><span class="energy-unit">Šaltinis: {{ epc_register_name_lt }}{% if snapshot.pens_cert_number %} (sert. {{ snapshot.pens_cert_number }}{% if snapshot.pens_cert_issued_date %}, {{ snapshot.pens_cert_issued_date }}{% endif %}){% endif %}</span>
370|     {% elif snapshot.epc_source_class == "registry" and reg_src == "tier_6a_pens_empirical_energy" %}
371|       <br><span class="energy-unit">Šaltinis: Lietuvos pastatų energinio naudingumo statistika (etalonas)</span>
372|     {% elif epc_source_label_lt | default(none) %}
373|       {# The served label — never `snapshot.epc_source_class`, which printed
374|          the raw internal code („Šaltinis: registry") to a customer. An
375|          unrecognised class yields no label and therefore no line. #}
376|       <br><span class="energy-unit">Šaltinis: {{ epc_source_label_lt }}</span>
377|     {% endif %}
378|     {% if hero_source_caption_lt | default(none) %}
379|       {# №17/№18/№39 — WHICH ROAD the verdict came by, served from the one
380|          origin the web card reads. It sits alongside „Šaltinis:" above, which
381|          answers a different question (WHICH DOCUMENT — register name, cert
382|          number, issue date). No caption is served for roads no ruling covers,
383|          and no caption means no element — never an empty line. #}
384|       <br><span class="energy-unit" data-hero="source-caption">{{ hero_source_caption_lt }}</span>
385|     {% endif %}
```

**One rendered example, from the real renderer.** Fixture: `_EXISTING_SNAPSHOT`
(`tests/integration/test_block8_integration.py`) with `registry_epc_kwhm2_year_source =
"tier_2_pens_israsas"`, `pens_cert_number = "AD-0119-03384"`, `pens_cert_issued_date =
"2021-03-15"` — the tier-2 branch at line 369, the only one that composes the certificate
identification. Rendered to PDF and read back with `pdfminer`:

```
Šaltinis: Pastatų energinio naudingumo sertifikatai (sert. AD-0119-03384, 2021-03-15)
```

**Relation to the №17/№18/№39 caption, as the code shows it** (no interpretation): the caption is a
separate element immediately below (`:378-385`, `data-hero="source-caption"`), served from
`hero_source_caption_lt`. The template's own comment at `:379-383` states the two answer different
questions — the caption WHICH ROAD, this line WHICH DOCUMENT — and that no caption is served for
roads no ruling covers. The `Šaltinis:` line has three authored branches (`:369`, `:371`, `:376`);
the register name at `:369` comes from a served constant, but the word „Šaltinis:", the
parenthetical „(sert. …)" composition, and the whole of `:371` are authored in the template.

---

# C — web/PDF divergences

## C1 — the winter heading

**PDF** (authored in the template, twice):

```jinja
452| <div class="comfort-title">Žiemos komfortas (šildymo poreikis)</div>
470| <div class="comfort-title">Žiemos komfortas (šildymo poreikis)</div>
```

**Web** reads a served constant — `bustodnr_api/reports/report_copy_lt.py:58`:

```python
WINTER_COMFORT_TITLE_LT = "Žiemos komfortas"
```

Both current at HEAD. The PDF's parenthetical „(šildymo poreikis)" exists on print only; the web
renders the served heading alone.

## C2 — the winter-factors heading

**Web** reads a served constant — `bustodnr_api/reports/report_copy_lt.py:59`:

```python
WINTER_FACTORS_TITLE_LT = "Žiemos komforto veiksniai"
```

Served to the web at `bustodnr_api/reports/report_access_service.py:473` and `:643`.

**PDF: absent.** The search and its empty output:

```
$ grep -n 'winter_factors_title_lt\|WINTER_FACTORS_TITLE' bustodnr_api/templates/report_pdf.html
(no output; grep exit 1)
```

**The factors themselves are NOT absent — only the heading is.** The PDF renders the same factor
list with no heading above it, `report_pdf.html:504-513`:

```jinja
504|   {% if d.winter and d.winter_factors %}
505|     {% set winter_active = d.winter_factors | selectattr('active') | list %}
506|     {% if winter_active %}
507|       <div class="drivers-list" data-block1="winter-factors">
508|         {% for f in winter_active %}
509|           <div class="driver-item"><span class="driver-icon">{% if f.direction == 'decrease' %}↘{% else %}↗{% endif %}</span> <strong>{{ f.label_lt }}</strong> — {{ f.explanation_lt }}</div>
510|         {% endfor %}
511|       </div>
512|     {% endif %}
513|   {% endif %}
```

## C3 — the documents panel

**PDF**, `report_pdf.html:759-761` — labels and hrefs authored in the template, descriptions served:

```jinja
759|       <li><a href="https://www.regia.lt/map/">REGIA kadastro žemėlapis</a> — {{ documents_lt.regia }}</li>
760|       <li><a href="https://is.lt/">Infostatyba — statybos leidimų registras</a> — {{ documents_lt.infostatyba }}</li>
761|       <li><a href="https://tpdr.lt/">TPDR — teritorijų planavimo dokumentų registras</a> — {{ documents_lt.tpdr }}</li>
```

**Web**, `src/components/report/AdditionalDocuments.tsx:15-31`:

```ts
15| const PUBLIC_LINKS = [
16|   {
17|     key: 'regia',
18|     label: 'Kadastro žemėlapis (REGIA)',
19|     url: 'https://www.regia.lt/lt/zemelapis/',
20|   },
21|   {
22|     key: 'infostatyba',
23|     label: 'Statybos leidimai (Infostatyba)',
24|     url: 'https://infostatyba.planuojustatau.lt/',
25|   },
26|   {
27|     key: 'tpdr',
28|     label: 'Teritorijų planavimo dokumentai (TPDR)',
29|     url: 'https://external.tpdr.lt/?formId=tpsearch',
30|   },
31| ];
```

**Web owner-access panel** (no print counterpart), `AdditionalDocuments.tsx:33-59`:

```ts
33| const OWNER_LINKS = [
34|   {
35|     key: 'rc_savitarna',
36|     label: 'Kadastro duomenų byla ir aukštų planai',
37|     // Wave-2 A2: „0,58–9,27 €“ was stale. RC prices document-copy preparation
38|     // PER PAGE by format (1,45 €/psl. A4 … 2,02 €/psl. A0), so the honest form is a
39|     // FLOOR — the old range implied a ceiling that does not exist. Sourced by the
40|     // bibliography entry keyed `rc_fee` (VĮ Registrų centras, „…įkainiai: dokumentų
41|     // kopijų parengimas, tvirtinimas ir pateikimas“), which the backend emits on
42|     // every report — this line and that entry are one claim in two places.
43|     //
44|     // 2026-07-31: „Pateikiama per 1 d. d.“ was DROPPED. The cited page was read
45|     // at the primary and carries no delivery term at all — nine probes (darbo
46|     // dien / d. d. / terminas / per 1 / skubos / vykdymo / valandos …) all
47|     // negative. It states prices only, which it does confirm exactly: A4 1,45 €,
48|     // A3 1,53, A2 1,63, A1 1,80, A0 2,02, skaitmeninis rinkinys 1,84 €. A
49|     // turnaround promise no source supports is a promise we cannot keep.
50|     helper:
51|       'Savininkai gali užsisakyti detalų aukštų planą, eksplikaciją ir kadastro bylą. Kaina: nuo 1,45\u00a0€/psl. (dokumento kopija; priklauso nuo formato ir puslapių skaičiaus). Užsakoma internetu.',
52|     url: 'https://www.registrucentras.lt/savitarna',
53|   },
54|   {
55|     key: 'registru_centras',
56|     label: 'Nekilnojamojo turto registras',
57|     url: 'https://www.registrucentras.lt/savitarna',
58|   },
59| ];
```

Aligned, all three public links differ on **both** label and URL:

| key | PDF label | web label | PDF href | web href |
|---|---|---|---|---|
| regia | `REGIA kadastro žemėlapis` | `Kadastro žemėlapis (REGIA)` | `https://www.regia.lt/map/` | `https://www.regia.lt/lt/zemelapis/` |
| infostatyba | `Infostatyba — statybos leidimų registras` | `Statybos leidimai (Infostatyba)` | `https://is.lt/` | `https://infostatyba.planuojustatau.lt/` |
| tpdr | `TPDR — teritorijų planavimo dokumentų registras` | `Teritorijų planavimo dokumentai (TPDR)` | `https://tpdr.lt/` | `https://external.tpdr.lt/?formId=tpsearch` |

The owner-access panel and its two links exist on the web only; print has no owner section.

---

# D — the „kWh / metus" column

**PDF**, `report_pdf.html:690-698`. Three headers are served; the fourth is authored in the
template:

```jinja
690|   <p class="info-label">{{ block2.reference_table_caption }}</p>
691|   <table class="block2-table">
692|     <thead><tr><th>{{ block2.household_table_headers.size }}</th><th>{{ block2.household_table_headers.consumption }}</th><th>kWh / metus</th><th>{{ block2.household_table_headers.cost }}</th></tr></thead>
693|     <tbody>
694|       {% for r in block2.reference_table %}
695|       <tr><td>{{ r.size_label }}</td><td>{{ r.kwh_month }}</td><td>{{ r.kwh_year }}</td><td>{{ r.eur_month }}</td></tr>
696|       {% endfor %}
697|     </tbody>
698|   </table>
```

The authored header string, verbatim: `kWh / metus` (`report_pdf.html:692`). The cells it renders
are `r.kwh_year` (`:695`).

**Web**, `src/components/report/Block2Section.tsx:798-812` — three columns, all served:

```tsx
798|                   {/* №3–5 — served, so the same three headers stand over the
799|                       same three columns on both surfaces. */}
800|                   <tr className="text-left text-slate-500 border-b border-slate-200">
801|                     <th className="py-1 pr-3 font-medium">
802|                       {block2.household_table_headers_lt?.size}
803|                     </th>
804|                     <th className="py-1 pr-3 font-medium text-right">
805|                       {block2.household_table_headers_lt?.consumption}
806|                     </th>
807|                     <th className="py-1 font-medium text-right">
808|                       {block2.household_table_headers_lt?.cost}
809|                     </th>
810|                   </tr>
811|                 </thead>
812|                 <tbody>
```

So the same table is **four columns in print, three on the web**; the print-only column is the
annual kWh figure. The template's own comment at `:684` already records this as "a known parity
follow-up".

**One naming observation, stated not interpreted:** the backend serves
`household_table_headers_lt` (`block2/presentation.py:770`, `reports/report_access_service.py:665`)
and `reports/pdf_renderer.py:178` passes it into the template under the shortened name
`household_table_headers`. One origin, two names across the boundary — not a content divergence.

No recommendation is offered here; whether the web gains the column or print loses it is the
sitting's ruling.

---

# E — the print heading „Kitas šio objekto sertifikatas"

Re-cited at this probe's HEAD: **`bustodnr_api/templates/report_pdf.html:432`** (the same line
recorded at G2 close; the template was not touched by that arc).

Rendering context, `report_pdf.html:427-438` — what the heading sits above:

```jinja
427|   {# The OTHER certificate, when the customer gave us two (annexe §6.7).
428|      Backend-served, the same object the web renders — one origin. Absent in
429|      the ordinary one-certificate case. #}
430|   {% if d.secondary_certificate %}
431|     <div class="comfort-box" data-secondary-certificate>
432|       <div class="comfort-title">Kitas šio objekto sertifikatas</div>
433|       <div class="comfort-desc">
434|         {{ d.secondary_certificate.label_lt }}{% if d.secondary_certificate.energy_class %} — {{ d.secondary_certificate.energy_class }} klasė{% endif %}{% if d.secondary_certificate.kwhm2_year %}, {{ d.secondary_certificate.kwhm2_year | round | int }} kWh/m² per metus{% endif %}.
435|         {% if d.secondary_certificate.comparison_lt %}{{ d.secondary_certificate.comparison_lt }}{% endif %}
436|       </div>
437|     </div>
438|   {% endif %}
```

The heading is authored in the template. Everything below it in the block is served
(`label_lt`, `energy_class`, `kwhm2_year`, `comparison_lt`); the web renders that same served
content with **no heading at all**.

**Recorded route, nothing more:** R-G2-1's endgame is rule-then-serve to both surfaces. The pack
states this as the recorded route and takes no position on the wording.

---

# F — the gate-document rename blast radius

**Method:** `git grep` over all tracked files in both repos. The lists below are **complete over
tracked content**.

## F1 — `Recalc_gate_ruled_34.md`

**Measured: 42 strings, numbered 1–42, contiguous.** The filename understates by eight.

**Readers that would break on a rename — code (5 sites, 4 files):**

| Repo | Site |
|---|---|
| frontend | `src/components/__tests__/ruling.ts:23` |
| backend | `tests/reports/test_recalc_gate_parser.py:35` |
| backend | `tests/reports/test_hero_source_caption.py:48` |
| backend | `tests/reports/test_g2_surface_parity.py:37` |
| backend | `tests/domain/test_certificate_lookup.py:433` and `:552` |

**Prose references that would go stale (5 sites, 5 files):**

| Repo | Site |
|---|---|
| backend | `bustodnr_api/reports/recalc_pass_service.py:59` (comment) |
| backend | `tests/reports/test_recalc_gate_parser.py:6` (docstring) |
| backend | `docs/tasks/G2_execution.md:148` |
| backend | `docs/tasks/G2_web_parity_refusal_history.md:15` |
| backend | `docs/tasks/Overridden_b3_hero_surface.md:3` |

Note `ruling.ts:23` reaches the file by a **relative path across repos**
(`'../../../../bustodnr/docs/tasks/…'`), so a rename must be landed in both repos in one step or
the frontend guards fail — and they fail loudly rather than skipping, by that file's own design.

## F2 — `Copy_parity_gate_ruled_18.md`

**Measured: 17 strings parsed, numbered 1–18, NOT contiguous — №10 is absent.** The filename does
**not** understate: `№10` is deliberately not a string. The document itself says so at line 26:

> 10. **Cross-note, not a string:** the certificate-lookup-failure sentence's final cause-plus-recourse form is ruled in the recalc arc's gate (afternoon sitting). This batch does not author №10; the recalc arc's commit 6 owns it.

So the "18" is the numbering range, and it is accurate. **No rename is indicated for this file** —
recorded because the brief asked whether its name also understates, and the measurement says no.

**Readers, complete (4 code sites, 3 prose):**

| Repo | Site | Kind |
|---|---|---|
| frontend | `src/components/__tests__/ruling.ts:29` | code |
| backend | `tests/reports/test_ruled_copy_matches_the_gate.py:32` | code |
| backend | `tests/reports/test_ruled_copy_on_both_surfaces.py:45` | code |
| frontend | `src/components/report/__tests__/copyParityRendered.test.tsx:10` | prose |
| backend | `bustodnr_api/reports/report_copy_lt.py:7` | prose |
| backend | `docs/tasks/G2_web_parity_refusal_history.md:15` | prose |
| backend | `docs/tasks/Session_caption_piece3_push.md:19` | prose |

---

# For the sitting

IDs above (A1–A48, B, C1–C3, D, E, F1–F2) are stable and citable. **No ruled numbers are
pre-assigned** — new strings take the next free numbers from the ledger's own sequence at the
sitting, per the numbering-supersession rule recorded in the gate document's G2 addendum.

Two counts in this pack contradict what was carried into it, and both are measurements: the
allowlist is **48**, not "~40"; and `Copy_parity_gate_ruled_18.md` holds **17** strings under an
accurate name, while `Recalc_gate_ruled_34.md` holds **42** under one that understates.
