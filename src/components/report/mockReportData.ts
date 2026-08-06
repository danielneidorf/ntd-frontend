// P7-A1: Report data types + dev mock data
// Lithuanian copy sourced from Script Brief §2.4.2, Thermal Comfort annex, Decision Log D6–D15

export interface Block8Content {
  pattern: string;
  pattern_title_lt: string;
  scope_prefix: string;
  intro_lt: string;
  viewing_questions_lt: string[];
  negotiation_angles_lt: string[];
  forward_note_lt: string;
  caveat_lt?: string | null;
  scope_disclaimer_lt: string;
  // Served since 2026-07-31: the bibliography keys this card's copy rests on.
  // Nothing renders it — Block 8 carries no „Šaltiniai" pointer — it tells the
  // BACKEND which entries must be emitted when the card shows, so a claim can't
  // appear on a report whose register lacks its basis. Declared here because the
  // wire carries it and the mock is a verbatim capture.
  source_keys?: string[];
}

export interface Block8Data {
  id: string;
  title_lt: string;
  // "ready" when there is a real recommendation; "not_applicable" for land-only.
  status: 'ready' | 'not_applicable';
  data: Block8Content | null;
}

// B2-13: data.block2 is the flat presentation dict from the shared backend
// builder (block2/presentation.py) — NOT wrapped like block8. Ready reports
// carry the priced fields; land-only carries only status + message_lt.

export interface Block2BreakdownRow {
  label_lt: string;
  // The chart band this row belongs to (shared band vocabulary), so a chart
  // tooltip can find its table row on a stable key instead of matching the
  // display label. Optional only because a kind that appears on no chart
  // serves null.
  band?: string | null;
  eur_year: number;
  eur_month: number;
  source_indicator: string;
}

export interface Block2MonthlyRow {
  month: number;
  heating_eur: number;
  dhw_eur: number;
  cooling_eur: number;
  fixed_eur: number;
  household_electricity_eur: number;
}

// One year of the 5-year forecast. Ruling 2026-07-23: bands are COMPONENTS
// (fixed / dhw / heating / cooling / household_electricity — the shared band
// vocabulary), replacing the former per-carrier map plus a separate
// fixed_eur_year field. Values are ANNUAL €; charts divide by 12.
export interface Block2ForecastPoint {
  year: number;
  total_eur_month: number;
  per_component: Record<string, number>;
  // Whole-€ MONTHLY display values, apportioned by the same largest-remainder
  // rule the breakdown table uses, so each year's bands sum exactly to the
  // numeral drawn above that year's stack — and year 1 equals the table.
  // Tooltips print these; they never round `per_component` themselves.
  per_component_display?: Record<string, number>;
}

// B2-14: one precomputed personalised view per household size (1..5; 5 = the
// "5+" band). All € values and LT copy are backend-computed — the selector
// only picks which served option to show.
export interface Block2HouseholdOption {
  household_size: number;
  size_label_lt: string;
  metric: { eur_month: number; subtext_lt: string };
  breakdown: {
    rows: Block2BreakdownRow[];
    total: { label_lt: string; eur_year: number; eur_month: number };
  };
  monthly_variation: Block2MonthlyRow[];
  // Ruling 2026-07-23: each option carries its OWN forecast, so the chart
  // follows the selector and its year 1 equals this option's headline.
  // Optional — legacy captures predate it and fall back to the building-only
  // top-level forecast.
  forecast_5yr?: Block2ForecastPoint[];
  // №6/№7 for THIS household size — the spoken description of each chart,
  // composed by the backend from this option's own arrays so the words a
  // screen reader hears describe the bars actually on screen. Optional: a
  // report stored before the fields existed has its copy refreshed at read
  // time, so this is belt-and-braces rather than a live fallback.
  monthly_chart_description_lt?: string | null;
  forecast_chart_description_lt?: string | null;
  // (The explanation's ¶2 family note (explanation_lt) was retired 2026-07-27.)
  // The option's own merged info section (ruling 2026-07-25) — its scope line is
  // size-specific, the rest identical across sizes. Optional: legacy captures
  // predate the merge.
  info_section?: Block2InfoSection;
  // The option's own first-sentence body, quoting the PERSONALISED totals
  // (optional — legacy captures lack it).
  body_lt?: string;
}

// ONE „what we based this on" section — title + ordered body items, composed
// once in the backend and rendered by both surfaces (ruling 2026-07-25). It
// replaced the separate info_box + data-source disclosure box + hot-water note.
export interface Block2InfoSection {
  title_lt: string;
  items_lt: string[];
}

export interface Block2HouseholdModelling {
  selector_caption_lt: string;
  citation_lt: { category_lt: string; lines_lt: string[] };
  options: Block2HouseholdOption[];
}

export interface Block2Data {
  status: 'ready' | 'not_applicable';
  message_lt: string | null;
  // D2-1 §6.3: the served flag saying this report priced per m² because the
  // registry had no usable area. Served (null on the ordinary road), read by
  // nothing on the web yet — declared so the type matches the wire.
  per_m2_mode?: boolean | null;
  // `unit_lt` is the metric's served unit („/ mėn."). The PDF has read it since
  // B2-13 (`block2.metric_unit_lt or "/ mėn."`); the web still hardcodes its
  // own — a divergence the copy-parity piece closes. Declared now so the served
  // shape and the type agree; nullable, and the web keeps its literal until the
  // piece wires it.
  metric?: {
    eur_month: number;
    eur_month_raw: number;
    unit_lt?: string | null;
    subtext_lt: string;
  };
  intro_lt?: string;
  breakdown?: {
    column_headers_lt: string[];
    rows: Block2BreakdownRow[];
    total: { label_lt: string; eur_year: number; eur_month: number };
  };
  // (The explanation's ¶2 family note was retired 2026-07-27 — cross-section dedup.)
  explanation?: { heading_lt: string; body_lt: string };
  // The default merged info section (used when no size selected; each option
  // carries its own). Ruling 2026-07-25 — replaced info_box + disclosure box.
  info_section?: Block2InfoSection;
  // Null on a not-applicable (land) Block 2 — the backend serves the key with
  // no level rather than omitting it.
  confidence?: string | null;
  confidence_text_lt?: string | null;
  carrier_warning_lt?: string | null;
  // THE carrier name for this report (2026-07-21). The property card's
  // heating row renders this same value, so one carrier cannot end up with
  // two names across the report. null when nothing resolved.
  carrier_label_lt?: string | null;
  newbuild_note_lt?: string | null;
  citations_lt?: string[];
  household_reference?: {
    household_size: number;
    size_label_lt: string;
    kwh_month: number;
    kwh_year: number;
    eur_month: number | null;
  }[];
  monthly_variation?: Block2MonthlyRow[];
  forecast_5yr?: Block2ForecastPoint[];
  // B2-14: present only for residential+ready reports whose tariff and
  // occupancy resolve; absent → render the static table, no selector.
  standard_occupancy?: number;
  household_modelling?: Block2HouseholdModelling;
  // ── THE RULED BLOCK-2 COPY (gate 2026-08-06: №1, №3–7) ──────────────────
  // Served from the backend's one origin so the web and the PDF cannot title
  // one chart two things or describe it two ways. Declared here ahead of the
  // components reading them (the copy-parity piece); every one is defaulted,
  // so a report stored before the fields existed simply omits them.
  monthly_chart_title_lt?: string | null;
  monthly_chart_description_lt?: string | null;
  forecast_chart_title_lt?: string | null;
  forecast_chart_description_lt?: string | null;
  household_table_headers_lt?: {
    size: string;
    consumption: string;
    cost: string;
  } | null;
}

export interface ReportData {
  address: string;
  ntr_unique_number: string | null;
  municipality: string;
  // Nullable on the wire, and the land fixture proves it: a plot resolved
  // without coordinates serves `null`, not a number. Typed non-null until
  // 2026-07-31, when regenerating MOCK_LAND_ONLY from the backend made the
  // served shape visible — the hand-written mock had been supplying values the
  // real payload does not.
  lat: number | null;
  lng: number | null;
  bundle_items: { kind: string; address?: string }[];
  generated_at: string;
  order_reference: string;
  // The served Block-1 bibliography ([1]–[4]+) — consumed by Citations.tsx
  // (2026-07-29 unification: one backend builder feeds web + PDF).
  citations?: string[];
  // №2 — the bibliography's heading. Print used to head the same list
  // „Šaltiniai ir nuorodos" while the web said „Šaltiniai"; one origin now.
  citations_title_lt?: string | null;
  // №15–18 — the documents panel's four descriptions, keyed by panel entry.
  // Print carried bare links with no explanation until these were served.
  documents_lt?: Record<string, string> | null;
  // Served-but-not-yet-consumed wire sections (kept verbatim by the mock
  // regeneration recipe so the capture needs no hand filtering).
  envelope?: Record<string, unknown>;
  blocks?: unknown[];
  permits?: unknown[];
  block2?: Block2Data;
  block8?: Block8Data;
  // The free rebuild we owe when the certificate register was unreachable.
  // BACKEND-DECIDED, computed when the report is read (not when it was built):
  // whether there is recourse, what it says, and whether it is still an offer
  // or has already become a rebuilt report. The page renders it or renders
  // nothing — it never inspects a failure reason itself.
  recourse?: {
    kind: string;
    state: 'offer' | 'rebuilt';
    sentence_lt: string;
    action_label_lt: string;
    mint_path?: string;
    report_url?: string;
    printed_lt?: string;
  } | null;
  block1: {
    applicable: boolean;
    neutral_message_lt?: string | null;
    winter: {
      // 'NOT_ASSESSED' ⇒ no real/estimated heating value — show "Neįvertinta"
      // + the reason, never an A–E band (the backend keeps it off the ordinal
      // axis; the web must not fall back to 'C'/medium).
      level: 'GOOD' | 'INTERMEDIATE' | 'WEAK' | 'NOT_ASSESSED';
      // №8 — the heading a screen reader announces over this bar, served from
      // the backend's one origin. Declared here ahead of the component reading
      // it (the copy-parity piece), so the type matches the served shape.
      title_lt?: string | null;
      not_assessed_reason?: string | null;
      // The sentence itself, served. Defaulted: a stored report built before
      // this field existed simply omits it and the local map still answers.
      not_assessed_message_lt?: string | null;
      // Phase 2: when the band is an era→class ESTIMATE (no certificate), the
      // backend sets this so the UI shows an honest "estimate + basis" caption.
      provenance_label_key?: string | null;
      // №14 — that caption's sentence, served. Same defaulted shape as
      // `not_assessed_message_lt`; the component reads it in the copy-parity
      // piece, and the local map retires with the twin that holds it.
      provenance_message_lt?: string | null;
      rows?: {
        band: string;
        label_lt: string;
        description_lt: string;
        range_lt?: string;
        highlighted: boolean;
      }[];
      // Winter band wiring: dual kWh comparison lines under the bar (A++ always;
      // C-floor for D–G). Single source = block1/presentation.py.
      comparison_lines_lt?: string[];
    } | null;
    summer: {
      // Lossless 5-value summer vocabulary (block1/presentation.py). The
      // producer emits LOW/MODERATE/HIGH; VERY_LOW/VERY_HIGH are reserved.
      risk_level: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
      rows: {
        band: string;
        label_lt: string;
        description_lt: string;
        highlighted: boolean;
      }[];
    } | null;
    summary_lt: string;
    drivers: {
      key: string;
      label_lt: string;
      explanation_lt: string;
      active: boolean;
      // Risk-effect semantics (block1/presentation.py): 'increase' raises
      // overheating risk (↗); 'decrease' is protective (↘, reserved for v2).
      direction: 'increase' | 'decrease';
    }[];
    // Driver merge: winter-comfort factors under the winter bar (Option A).
    // Same shape as `drivers`, but TWO-WAY: helpers carry 'decrease' (↘ green),
    // drawbacks 'increase' (↗ amber). Single source = block1/presentation.py.
    winter_factors: {
      key: string;
      label_lt: string;
      explanation_lt: string;
      active: boolean;
      direction: 'increase' | 'decrease';
    }[];
    // №9 — the heading a screen reader announces over those factors, served
    // from the backend's one origin (defaulted, like its siblings).
    winter_factors_title_lt?: string | null;
    info_box: {
      items_lt: string[];
    };
    // ⚠ SERVED AND RENDERED BY PRINT ONLY — a web/PDF divergence, found
    // 2026-08-06 while typing the wire, reported not fixed (it is its own
    // piece). The backend serves both; `report_pdf.html:421` and `:430`
    // render them; nothing in `src/` reads either. So the mandated "we could
    // not use your certificate" sentence and the historical-certificate
    // listing reach a customer who opens the PDF and no one else.
    upload_not_used_message_lt?: string | null;
    secondary_certificate?: {
      label_lt: string;
      energy_class?: string | null;
      kwhm2_year?: number | null;
      comparison_lt?: string | null;
    } | null;
    inputs_snapshot: {
      effective_energy_class: string | null;
      effective_epc_kwhm2_year: number | null;
      effective_year_built: number | null;
      glazing_share_percent: number | null;
      ventilation_type: string | null;
      epc_source_class: string;
      epc_confidence_level: string;
      evaluation_target: string;
      epc_plausibility?: string | null;
      epc_plausibility_note_lt?: string | null;
    };
  };
  property_profile: {
    purpose: string | null;
    // RC's official paskirtis PAIR (2026-07-22): the register's own value,
    // verbatim, plus the level-specific row label that its genitive attaches
    // to. Both null until RC populates the slot — wired and dark.
    paskirtis_label_lt?: string | null;
    paskirtis_row_label_lt?: string | null;
    premises_type: string | null;
    usage_group_label: string | null;
    year_built: number | null;
    floors: number | null;
    total_area_m2: number | null;
    heated_area_m2: number | null;
  // R6: served provenance for the heated-area value (null → no claim)
  heated_area_m2_source_lt?: string | null;
    // Label ruling (2026-07-20): the RAW source key — decides whether the
    // card may call this value a heated area at all (never keyed on copy).
    heated_area_m2_source?: string | null;
    // 2026-07-21: the DECISION, served. The card reads this instead of
    // re-deriving it from the raw tag, so one rule governs both surfaces.
    heated_area_m2_is_genuine?: boolean;
    wall_material: string | null;
    heating_type: string | null;
    ventilation_type: string | null;
    energy_class: string | null;
    // R7: how the class was resolved — "certificate" | "era"; the LT line
    // renders under the class when era-derived (null → no line).
    energy_class_provenance?: string | null;
    energy_class_provenance_lt?: string | null;
    epc_kwhm2_year: number | null;
    // №17/№18/№39 — the caption beside the hero figure, naming which road the
    // verdict came by. Defaulted: a report stored before the field existed
    // omits it, and the card then renders no sub-line. Null is also the served
    // answer on every road no ruling covers — never a blank line.
    hero_source_caption_lt?: string | null;
    epc_source: string | null;
    epc_confidence: string | null;
    glazing_percent: number | null;
    glazing_source: string | null;
    cadastral_ref: string | null;
    evaluation_target: string;
  };
}

// (The WINTER_ROWS / SUMMER_ROWS block + its winterRows()/summerRows() helpers
//  were removed 2026-07-27 — dead since a06001c (RWF Commit A removed the last
//  callers at the one-fixture mock rebuild). The block held the retired A-now
//  static-range winter copy; the live scenarios below carry the current served
//  copy. See Block1_Thermal_Comfort/winter_rows_deadness_probe_2026-07-27.md.)

function mockBlock2(carrierWarning: string | null = null): Block2Data {
  return { ...(MOCK_EXISTING.block2 as Block2Data), carrier_warning_lt: carrierWarning };
}

const MOCK_CARRIER_FALLBACK_WARNING =
  '⚠️ Šildymo sistemos tipas nėra nurodytas šio pastato energinio naudingumo sertifikate. Vertinime naudojamas šildymo būdas (centrinis šildymas) nustatytas pagal pastato tipą ir statybos laikotarpį.';

// --- Mock datasets ---

// --- MOCK_EXISTING — regenerated from the backend dev fixture (2026-07-21) ---
// ONE fixture, one truth: a verbatim capture of the same `_build_report_data`
// output the backend serves at /v1/reports/dev-existing (fixture:
// bustodnr reports/routes.py `_DEV_EXISTING_SNAPSHOT` — Žirmūnų g. 12-5,
// Vilniaus m. sav., residential_multi_other, 52.4 m², class D / 145.2),
// floats trimmed to cents. Do NOT hand-edit values — REGENERATE instead:
//
//   cd ~/dev/bustodnr && .venv/bin/python - <<'PY'
//   import json, sys; sys.path.insert(0, ".")
//   # 2026-07-20: lat/lng are EXEMPT from the cents trim — rounding a
//   # coordinate to 2 decimals moves the map pin by hundreds of metres
//   # (the first recipe did exactly that: 54.7007624 -> 54.7).
//   _GEO = {"lat", "lng"}
//   def trim(o, key=None):
//       if isinstance(o, float):
//           if key in _GEO: return round(o, 7)
//           r = round(o, 2); return int(r) if r == int(r) else r
//       if isinstance(o, dict): return {k: trim(v, k) for k, v in o.items()}
//       if isinstance(o, list): return [trim(v, key) for v in o]
//       return o
//   from bustodnr_api.reports.routes import _DEV_MOCKS
//   print(json.dumps(trim(_DEV_MOCKS["dev-existing"]), ensure_ascii=False, indent=2))
//   PY
//
// …and paste the JSON as this object literal (keys stay quoted; the type's
// passthrough keys carry served-but-not-yet-consumed sections verbatim).
// Fidelity pins: __tests__/mockFidelity.test.ts (self-consistency — the
// composition class of defect this regeneration killed cannot return).
export const MOCK_EXISTING: ReportData = {
  "envelope": {
    "address": "Vilnius, Žirmūnų g. 12-5",
    "request_id": "report-20260806122434",
    "created_at": "2026-08-06T12:24:34.112649+00:00"
  },
  "blocks": [
    {
      "id": "thermal_comfort_proxy",
      "label_lt": "1) Vidaus patalpų klimato komfortas",
      "status": "ready",
      "summary_lt": null,
      "required_inputs": [],
      "data": {
        "winter": {
          "level": "WEAK",
          "label_key": "block1.winter.weak.label",
          "description_key": "block1.winter.weak.description",
          "not_assessed_reason": null,
          "provenance_label_key": null,
          "segment": "D",
          "description_lt": "Žema pastato energinė klasė (D ar žemesnė) rodo didelius šilumos poreikius: norint palaikyti 20–22 °C visame būste reikės intensyvaus šildymo, dalis patalpų gali likti vėsesnės (tikslesnę šildymo kainą rasite 2 bloke).",
          "comparison_lines_lt": [
            "Palyginti su renovuoto pastato etalonu (C klasė): apie 97 % didesnis.",
            "Palyginti su efektyvių (A klasių grupės) pastatų mediana Lietuvoje: apie 6,5 karto didesnis.",
            "Palyginti su naujos statybos etalonu (A++): apie 11 kartų didesnis šildymo poreikis."
          ]
        },
        "summer": {
          "level": "MODERATE",
          "label_key": "block1.summer.moderate.label",
          "description_key": "block1.summer.moderate.description",
          "segment": "C",
          "description_lt": "Per karščio bangas kai kuriose patalpose gali tapti per šilta, ypač ten, kur yra dideli langai ar viršutiniai aukštai — reikės dažnai vėdinti ir riboti tiesioginę saulę. Gali prireikti ventiliatorių ar nešiojamo kondicionieriaus per karščiausias dienas, tad dalį metų papildomai didės elektros sąnaudos dėl vėsinimo."
        },
        "overrides": {
          "pattern": "official_metric",
          "hero_kind": "official",
          "hero_metric_kind": "delivered_heat",
          "used_official_epc": true,
          "used_user_epc": false,
          "used_user_kwh": false,
          "low_confidence_epc": false,
          "no_official_epc_reason": "none",
          "upload_not_used_reason": "none",
          "message_key": "block1.epc.official_metric",
          "story_key": "block1.block1_energy.story.pagal_sertifikata"
        },
        "drivers": {
          "good_epc": false,
          "new_or_renovated": false,
          "risky_glazing": false
        },
        "technical": {
          "usage_group_id": "residential_multi_other",
          "epc_class": "D",
          "hero_heat_kwhm2_year": 145.2,
          "baseline_heat_kwhm2_year": 215.85,
          "relative_vs_class_peers": 0.67,
          "relative_vs_newbuild": 10.76,
          "relative_vs_renovated": 1.97,
          "diff_vs_newbuild_kwhm2_year": 131.7,
          "diff_vs_renovated_kwhm2_year": 71.37,
          "etalon_class": "A++",
          "a_band_anchor_kwhm2_year": 22.36
        },
        "info_box": [
          "Vertinimas remiasi Pastatų energinio naudingumo sertifikatų duomenimis ir standartinėmis prielaidomis panašiems būstams.",
          "Šiame bloke atskirai nemodeliuojame realių vidaus drėgmės ir skersvėjų, nes jie stipriai priklauso nuo gyventojų įpročių ir konkrečios buto būklės (langų, durų, sandūrų ir pan.).",
          "Komforto modeliavimui NT Duomenys naudoja 20–22 °C prielaidą — HN 42:2009 nustatyto 18–22 °C žiemos (šaltojo periodo) temperatūros diapazono viduje.",
          "Šaltiniai: [2], [3], [8], [9]"
        ],
        "bundle_note_key": "block1.bundle.note.default",
        "snapshot": {
          "order_id": "ord-dev-001",
          "bundle_id": "bdl-dev-001",
          "bundle_primary_object_type": null,
          "evaluation_target": "existing_object",
          "lat": 54.7007624,
          "lng": 25.2993035,
          "address_text": "Vilnius, Žirmūnų g. 12-5",
          "municipality": "Vilniaus m. sav.",
          "address_source": "user",
          "purpose": "residential",
          "premises_type": null,
          "rc_paskirtis_code": null,
          "rc_paskirtis_level": null,
          "usage_group": "residential_multi_other",
          "heated_flag": true,
          "building_year_built": 1975,
          "renovation_year": null,
          "total_area_m2": 58.7,
          "heated_area_m2": 52.4,
          "floors": 5,
          "heating_system_type": "Centralizuotas šilumos tiekimas",
          "glazing_share_percent": null,
          "glazing_band": null,
          "glazing_source": null,
          "registry_energy_class": "D",
          "registry_epc_kwhm2_year": 145.2,
          "registry_epc_kwhm2_year_source": null,
          "official_lookup_status": "not_requested",
          "no_official_epc_reason": "none",
          "upload_not_used_reason": "none",
          "user_energy_class": null,
          "user_epc_kwhm2_year": null,
          "bill_unit": null,
          "bill_value": null,
          "bill_period": null,
          "bill_month": null,
          "bill_scope": null,
          "bill_source_tag": null,
          "effective_energy_class": "D",
          "effective_epc_kwhm2_year": 145.2,
          "epc_source_class": "registry",
          "epc_confidence_level": "high",
          "epc_sources": [],
          "energy_class_overridden": false,
          "epc_kwhm2_year_overridden": false,
          "ventilation_type": "natural",
          "project_website_url": null,
          "project_website_url_auto": null,
          "has_project_docs": null,
          "doc_energy_class": null,
          "doc_epc_kwhm2_year": null,
          "doc_epc_issue_year": null,
          "doc_heating_description": null,
          "doc_ventilation_description": null,
          "doc_glazing_hint": null,
          "doc_source_label": null,
          "doc_website_url_hint": null,
          "url_user_energy_class": null,
          "url_user_epc_kwhm2_year": null,
          "url_user_heating_description": null,
          "url_user_ventilation_description": null,
          "url_user_glazing_hint": null,
          "url_auto_energy_class": null,
          "url_auto_epc_kwhm2_year": null,
          "url_auto_heating_description": null,
          "url_auto_ventilation_description": null,
          "url_auto_glazing_hint": null,
          "project_hint_name": null,
          "project_hint_developer": null,
          "project_url_auto_confidence": null,
          "project_url_auto_reason": null,
          "epc_resolution": {
            "official_state": "valid",
            "user_state": "no_input",
            "official_lookup_status": "not_requested",
            "resolution_pattern": "official_metric",
            "heroes": [
              {
                "hero_kind": "official",
                "metric_kind": "delivered_heat",
                "epc_class": "D",
                "epc_class_rank": null,
                "metric_value": 145.2,
                "rel_vs_newbuild": null,
                "rel_vs_renovated": null,
                "diff_vs_newbuild": null,
                "diff_vs_renovated": null,
                "label_keys": [
                  "official_metric",
                  "delivered_heat",
                  "hero_official",
                  "official_epc"
                ]
              }
            ],
            "no_official_epc_reason": "none",
            "upload_not_used_reason": "none",
            "message_key": "block1.epc.official_metric",
            "story_key": "block1.block1_energy.story.pagal_sertifikata"
          },
          "epc_plausibility": null,
          "epc_plausibility_note_lt": null,
          "prior_building_energy_class": null,
          "prior_building_kwhm2": null,
          "source_system": null,
          "resolver_context": null,
          "pens_cert_number": null,
          "pens_cert_issued_date": null,
          "registry_energy_class_superseded": null,
          "secondary_certificate": null,
          "register_record": null,
          "unikalus_nr": "4400-1234-5678",
          "unikalus_nr_source": null,
          "heated_area_m2_source": "tier_2_pens_israsas",
          "byproduct_coverage_fraction": null,
          "customer_type_override": null
        },
        "secondary_certificate": null,
        "winter_factors": [
          {
            "key": "new_or_renovated",
            "label_lt": "Naujesnės statybos pastatas",
            "explanation_lt": "Naujesnės statybos pastatai paprastai geriau apšiltinti ir sandaresni, todėl žiemą šiluma išlaikoma efektyviau ir jaučiama mažiau šaltų vietų ties sienomis ar kampuose.",
            "active": false,
            "direction": "decrease"
          },
          {
            "key": "risky_glazing",
            "label_lt": "Didelė langų dalis",
            "explanation_lt": "Langai šilumą praleidžia lengviau nei sienos, todėl kai jų plotas didelis, žiemą pro juos prarandama daugiau šilumos — ties langais gali būti vėsiau, o šildymo poreikis šiek tiek didesnis.",
            "active": false,
            "direction": "increase"
          }
        ],
        "summer_drivers": [
          {
            "key": "high_energy_class_driver",
            "label_lt": "Aukšta energinė klasė",
            "explanation_lt": "Aukštesnės energinės klasės pastatai paprastai sandaresni ir geriau apšiltinti — žiemą tai taupo šilumą, bet vasarą pro langus ir iš vidaus patekusi šiluma patalpose išlieka ilgiau, todėl be tinkamo šešėliavimo ir vėdinimo perkaitimo rizika būna šiek tiek didesnė.",
            "active": false,
            "direction": "increase"
          },
          {
            "key": "newer_building_driver",
            "label_lt": "Naujesnės statybos pastatas",
            "explanation_lt": "Naujesni pastatai paprastai sandaresni ir geriau apšiltinti, todėl be tinkamo šešėliavimo ir vėdinimo vasarą sukaupta šiluma patalpose išlieka ilgiau ir perkaitimo rizika būna šiek tiek didesnė.",
            "active": false,
            "direction": "increase"
          },
          {
            "key": "high_glazing_driver",
            "label_lt": "Didelė langų dalis",
            "explanation_lt": "Kai langų plotas didelis, saulėtomis dienomis pro stiklą patenka daug šilumos, todėl patalpos vasarą greičiau ir labiau įšyla.",
            "active": false,
            "direction": "increase"
          }
        ]
      }
    },
    {
      "id": "energy_costs",
      "label_lt": "2) Energijos sąnaudos",
      "status": "ready",
      "summary_lt": null,
      "required_inputs": [],
      "data": {
        "status": "ready",
        "message_lt": null,
        "energy_month_eur": 78.34,
        "energy_year_eur": 940.03,
        "breakdown": [
          {
            "carrier": "cst",
            "kwh_year": 9812.42,
            "eur_year": 940.03,
            "tariff_eur_kwh": 0.1,
            "data_source_indicator": "epc"
          }
        ],
        "components": [
          {
            "component_kind": "heating",
            "label_lt": "Šildymas (centrinis šildymas)",
            "carrier": "cst",
            "eur_year": 728.89,
            "eur_month": 60.74,
            "source_lt": "📊 pagal pastato duomenis"
          },
          {
            "component_kind": "dhw",
            "label_lt": "Karštas vanduo",
            "carrier": "cst",
            "eur_year": 211.14,
            "eur_month": 17.59,
            "source_lt": "📊 pagal pastato duomenis"
          }
        ],
        "monthly_variation": [
          {
            "month": 1,
            "heating_eur": 141.6,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 2,
            "heating_eur": 118.52,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 3,
            "heating_eur": 107.35,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 4,
            "heating_eur": 64.65,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 5,
            "heating_eur": 0,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 6,
            "heating_eur": 0,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 7,
            "heating_eur": 0,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 8,
            "heating_eur": 0,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 9,
            "heating_eur": 0,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 10,
            "heating_eur": 71.69,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 11,
            "heating_eur": 99.53,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          },
          {
            "month": 12,
            "heating_eur": 125.56,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 0,
            "household_electricity_eur": 0
          }
        ],
        "forecast_5yr": [
          {
            "year": 2026,
            "total_eur_month": 78.34,
            "per_component": {
              "heating": 728.89,
              "dhw": 211.14
            },
            "per_component_display": {}
          },
          {
            "year": 2027,
            "total_eur_month": 83.11,
            "per_component": {
              "heating": 773.28,
              "dhw": 224
            },
            "per_component_display": {}
          },
          {
            "year": 2028,
            "total_eur_month": 88.17,
            "per_component": {
              "heating": 820.37,
              "dhw": 237.64
            },
            "per_component_display": {}
          },
          {
            "year": 2029,
            "total_eur_month": 93.54,
            "per_component": {
              "heating": 870.34,
              "dhw": 252.11
            },
            "per_component_display": {}
          },
          {
            "year": 2030,
            "total_eur_month": 99.23,
            "per_component": {
              "heating": 923.34,
              "dhw": 267.46
            },
            "per_component_display": {}
          }
        ],
        "confidence": "medium",
        "confidence_cause": "stale_tariff",
        "tariff_is_stale": true,
        "stale_operator": "AB „Miesto gijos“",
        "stale_until": "2026-05-31",
        "carrier_source": "epc",
        "household_modelling": null,
        "bill_override_active": null,
        "bill_dhw_measured": null,
        "modelled_dhw_eur_year": null,
        "bill_unit_eur": null,
        "bill_heating_thermal_kwh_year": null,
        "solar_thermal_present": null,
        "split_is_modelled": null,
        "per_m2_mode": null,
        "citations_lt": [
          {
            "category": "💰 Energijos tarifai",
            "label_lt": "VALSTYBINĖ ENERGETIKOS REGULIAVIMO TARYBA. {supplier_name} centralizuotai tiekiamos šilumos kaina: paskutinis žinomas patvirtintas tarifas, galiojęs nuo {effective_from} iki {effective_to} [interaktyvus]. Vilnius: VERT [žiūrėta {date}]. Prieiga per internetą: https://www.vert.lt",
            "source_reference": "energy_tariffs.yaml (VERT, stale)",
            "dynamic_fields": {
              "supplier_name": "AB „Miesto gijos“",
              "effective_from": "2026-05-01",
              "effective_to": "2026-05-31"
            },
            "key": "tariff_cst"
          },
          {
            "category": "💰 Energijos tarifai",
            "label_lt": "AB „Energijos skirstymo operatorius“ (ESO). Buitinės elektros energijos kaina: „Standartinis“ planas (be mėnesinio mokesčio), verslui — „Verslas“ planas; tarifus reguliuoja Valstybinė energetikos reguliavimo taryba (VERT) [interaktyvus]. Vilnius: ESO [žiūrėta {date}]. Prieiga per internetą: https://www.eso.lt",
            "source_reference": "energy_tariffs.yaml (ESO)",
            "dynamic_fields": {},
            "key": "tariff_elec"
          },
          {
            "category": "💰 Energijos tarifai",
            "label_lt": "LIETUVOS RESPUBLIKOS ŠILUMOS ŪKIO ĮSTATYMAS: 13 straipsnis „Šilumos tiekimo sezoniškumas“ (šildymo sezono nustatymo kriterijus pagal vidutinę paros oro temperatūrą; sezono datas skelbia savivaldybės) [interaktyvus]. Vilnius: LR Seimas [žiūrėta {date}]. Prieiga per internetą: https://e-seimas.lrs.lt. Sektoriaus kontekstas: LIETUVOS ŠILUMOS TIEKĖJŲ ASOCIACIJA (LŠTA), CŠT sektoriaus apžvalgos (https://www.lsta.lt/silumos-ukis/cst-sektoriaus-apzvalga/). Spalio–balandžio mėnesių langas yra NT Duomenų modeliavimo prielaida (vidaus metodikos sprendimas, 2026-07-23), atspindinti tipinį kriterijaus rezultatą.",
            "source_reference": "Šilumos ūkio įstatymas 13 str. / LŠTA",
            "dynamic_fields": {},
            "key": "season"
          },
          {
            "category": "💰 Energijos tarifai",
            "label_lt": "LIETUVOS RESPUBLIKOS PRIDĖTINĖS VERTĖS MOKESČIO ĮSTATYMAS, 2002 m. kovo 5 d. Nr. IX-751 (aktuali redakcija): 19 straipsnis — standartinis 21 % PVM tarifas, nuo 2026 m. sausio 1 d. taikomas ir gyvenamosioms patalpoms tiekiamai šilumos energijai bei karštam vandeniui [interaktyvus]. Vilnius: LR Seimas [žiūrėta {date}]. Prieiga per internetą: https://e-seimas.lrs.lt",
            "source_reference": "PVMĮ 19 str.",
            "dynamic_fields": {},
            "key": "vat"
          },
          {
            "category": "📈 Prognozės pagrindas",
            "label_lt": "ONEBUILDING.ORG. Tipiniai meteorologiniai metai (TMYx 2011–2025), Lietuvos apskritys [interaktyvus, NOAA ISD pagrindu]. [žiūrėta {date}]. Prieiga per internetą: https://climate.onebuilding.org. Papildyta: EUROPOS KOMISIJA, Jungtinis tyrimų centras (JRC). PVGIS v5.3 (2005–2023). Mėnesinio energijos kainos kitimo profilis remiasi šildymo laipsnių dienomis (bazė 18 °C).",
            "source_reference": "OneBuilding TMYx + JRC PVGIS",
            "dynamic_fields": {},
            "key": "climate"
          },
          {
            "category": "📈 Prognozės pagrindas",
            "label_lt": "EUROSTAT. Suderinti vartotojų kainų indeksai (HICP), serija „HICP CP0455 — šilumos energija“, Lietuva: metinių pokyčių dešimties metų slankusis vidurkis [interaktyvus]. Liuksemburgas: Europos Sąjungos statistikos tarnyba [žiūrėta {date}]. Prieiga per internetą: https://ec.europa.eu/eurostat",
            "source_reference": "Eurostat HICP (per-carrier series)",
            "dynamic_fields": {},
            "key": "forecast_cp0455"
          },
          {
            "category": "📈 Prognozės pagrindas",
            "label_lt": "EUROSTAT. Suderinti vartotojų kainų indeksai (HICP), serija „HICP CP00 — bendrasis indeksas“, Lietuva: dešimties metų vidurkis, {hicp_rate}%/m. — taikomas kaip minimali augimo riba [interaktyvus]. Liuksemburgas: Europos Sąjungos statistikos tarnyba [žiūrėta {date}]. Prieiga per internetą: https://ec.europa.eu/eurostat",
            "source_reference": "Eurostat HICP CP00",
            "dynamic_fields": {
              "hicp_rate": "4,76"
            },
            "key": "forecast_floor"
          }
        ]
      }
    },
    {
      "id": "recommendations",
      "label_lt": "8) Rekomendacijos ir sprendimai",
      "status": "ready",
      "summary_lt": null,
      "required_inputs": [],
      "data": {
        "id": "recommendations",
        "title_lt": "8) Rekomendacijos ir sprendimai",
        "status": "ready",
        "data": {
          "pattern": "B",
          "pattern_title_lt": "Šildymo iššūkis",
          "scope_prefix": "Šilumos komforto požiūriu",
          "intro_lt": "Lyginant su tos pačios klasės (D) pastatais Lietuvoje, šio pastato šildymo poreikis yra apie 35 % mažesnis nei vidurkis. Tačiau, šilumos komforto požiūriu, šis pastatas kelia šildymo iššūkį — šildymo sąnaudos gali būti reikšmingai didesnės nei techniškai efektyviame pastate (A++), todėl verta atkreipti dėmesį į keletą dalykų. Šildymas — vidutiniškai apie €61 per mėnesį (apie €729 per metus).",
          "viewing_questions_lt": [
            "Paprašykite faktinių šildymo sąskaitų už paskutinius 2–3 žiemos sezonus — ne įvertinimų, o tikrų sąskaitų.",
            "Apžiūrėkite izoliaciją: stogo / pastogės apšiltinimą, grindų / rūsio izoliaciją, sienų būklę (matomi plyšiai, drėgmės žymės).",
            "Patikrinkite langų būklę: dvigubas ar trigubas stiklo paketas, rėmų būklė, ar jaučiamas skersvėjis.",
            "Paklauskite, ar yra patalpų, kurios žiemą būna nuolat šaltos arba nenaudojamos dėl šalčio."
          ],
          "negotiation_angles_lt": [
            "Pagal mūsų vertinimą, šildymo sąnaudos gali būti apie 6,5 karto didesnės nei efektyvių (A klasių grupės) pastatų mediana — tai apie €620 per metus. Per 5 metus, įvertinus prognozuojamą energijos kainų augimą (pagal 10 metų kainų tendencijas), skirtumas sudarytų apie €3480. Nerenovavus pastato, vien šildymas kainuotų apie €360 per metus daugiau nei renovuotame (C klasės) pastate.",
            "Iki 1993 m. statyti pastatai dažnai turi silpnesnę izoliaciją — verta paklausti pardavėjo, ar buvo atlikta modernizacija.",
            "Didelis šildymo poreikis rodo, kad apšiltinimas anksčiau ar vėliau taps aktualus. Tikslios sumos be projekto dokumentų apskaičiuoti neįmanoma, tačiau pats poreikis yra pagrįstas argumentas derėtis dėl kainos ar aptarti tai su pardavėju."
          ],
          "forward_note_lt": "Kiek konkrečiai kainuoja šildymas eurais per mėnesį, rasite 2 bloke (Energijos sąnaudos).",
          "caveat_lt": null,
          "scope_disclaimer_lt": "Šios rekomendacijos apima tik šilumos komforto aspektą.",
          "source_keys": [
            "ltrs",
            "monstvilas_ma",
            "monstvilas_sd",
            "bliudzius"
          ]
        }
      }
    }
  ],
  "permits": [
    {
      "document_type": "Statybos leidimas",
      "document_status": "Galioja",
      "document_date": "2020-03-15",
      "building_name": "Daugiabučio namo renovacija",
      "project_name": "Rekonstrukcija"
    },
    {
      "document_type": "Statybos užbaigimo aktas",
      "document_status": "Įregistruotas",
      "document_date": "2021-11-20",
      "building_name": "Daugiabučio namo renovacija",
      "project_name": "Rekonstrukcija"
    }
  ],
  "citations": [
    "VĮ REGISTRŲ CENTRAS. Nekilnojamojo turto registras: objekto duomenys [interaktyvus]. Vilnius: VĮ Registrų centras [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.registrucentras.lt",
    "VĮ REGISTRŲ CENTRAS. Pastatų energinio naudingumo sertifikatų registras (PENS): energinio naudingumo sertifikatas [interaktyvus]. Vilnius: VĮ Registrų centras [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.registrucentras.lt",
    "LIETUVOS RESPUBLIKOS APLINKOS MINISTERIJA. Statybos techninis reglamentas STR 2.01.02:2016 „Pastatų energinio naudingumo projektavimas ir sertifikavimas“. Vilnius: Aplinkos ministerija, 2016. Karšto vandens ruošimo energijos poreikio normos pagal pastato paskirtį — 2 priedo 2.4 lentelė (ψhw, kWh/m²·metai).",
    "MONSTVILAS, E. ir kt. Energinio naudingumo sertifikatų analizė: daugiabučiai gyvenamieji pastatai. Sustainability, 2023, t. 15, Nr. 3, straipsnis 2032 (N = 5 558). ISSN 2071-1050.",
    "MONSTVILAS, E. ir kt. Energinio naudingumo sertifikatų analizė: vieno ir dviejų butų gyvenamieji namai. Journal of Physics: Conference Series, 2023, t. 2654, straipsnis 012061 (N = 56 891). ISSN 1742-6596.",
    "BLIŪDŽIUS, R. ir kt. Energinio naudingumo sertifikatų analizė: administraciniai (biurų) pastatai. Buildings, 2024, t. 14, Nr. 9, straipsnis 2791 (N = 2 340). ISSN 2075-5309. Papildyta STR 2.01.02:2016 langų ploto normatyvais.",
    "LIETUVOS RESPUBLIKOS APLINKOS MINISTERIJA. Lietuvos ilgalaikė pastatų renovacijos strategija [interaktyvus]. Vilnius: LR aplinkos ministerija / LR Vyriausybė, 2020 [žiūrėta 2026-08-06]. Prieiga per internetą: https://epilietis.lrv.lt. Pastatų fondo statistika pagal energinio naudingumo klasę (17–19, 25 lentelės).",
    "NT DUOMENYS. Pastatų energijos etalonų bazė v2026.1: pastatų faktinio šilumos poreikio medianos pagal pastato tipą ir energinę klasę, apskaičiuotos iš VĮ Registrų centro Pastatų energinio naudingumo sertifikatų registro (PENS); efektyvių pastatų (A++/A+/A klasių) sujungta mediana — atskiras atskaitos taškas. Renovuoto pastato etalonas prilygintas C energinei klasei — NT Duomenų metodinis sprendimas (vidinė etalonų metodika, 3.2 sk.). Vilnius: NT Duomenys, 2026.",
    "LIETUVOS RESPUBLIKOS SVEIKATOS APSAUGOS MINISTRAS. Lietuvos higienos norma HN 42:2009 „Gyvenamųjų ir visuomeninių pastatų patalpų mikroklimatas“ [interaktyvus]. Patvirtinta 2009 m. gruodžio 29 d. įsakymu Nr. V-1081. Vilnius: Sveikatos apsaugos ministerija, 2009 [žiūrėta 2026-08-06]. Prieiga per internetą: https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.362676",
    "VĮ REGISTRŲ CENTRAS. Nekilnojamojo turto ir registro išrašų, pažymų ir duomenų įkainiai: dokumentų kopijų parengimas, tvirtinimas ir pateikimas [interaktyvus]. Vilnius: VĮ Registrų centras [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.registrucentras.lt/p/nt-israsu-pazymu-duomenu-ikainiai",
    "GOOGLE. „Google Street View“ gatvės lygio vaizdas pagal objekto koordinates [interaktyvus]. Google Maps Platform. Rodoma tik interaktyvioje ataskaitos versijoje [žiūrėta 2026-08-06].",
    "GOOGLE. „Google Maps“ palydovinis / hibridinis vaizdas pagal objekto koordinates [interaktyvus]. Google Maps Platform (vaizdai: Airbus, CNES / Airbus, Maxar Technologies ir kt.). Rodoma tik interaktyvioje ataskaitos versijoje [žiūrėta 2026-08-06].",
    "Pastato kontūras — © OpenStreetMap contributors, ODbL. Duomenys iš „OpenStreetMap“ (per Overpass API) [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.openstreetmap.org/copyright. Rodoma tik interaktyvioje ataskaitos versijoje."
  ],
  "address": "Vilnius, Žirmūnų g. 12-5",
  "ntr_unique_number": "4400-1234-5678",
  "municipality": "Vilniaus m. sav.",
  "lat": 54.7007624,
  "lng": 25.2993035,
  "bundle_items": [],
  "generated_at": "2026-08-06T12:24:34.112649+00:00",
  "order_reference": "NTD-DEV-001",
  "block2": {
    "status": "ready",
    "message_lt": null,
    "metric": {
      "eur_month": 78,
      "eur_month_raw": 78.34,
      "unit_lt": null,
      "subtext_lt": "Vidutinė mėnesinė energijos kaina pagal dabartinius tarifus (su PVM)"
    },
    "per_m2_mode": null,
    "intro_lt": "Šiame bloke pateikiame, kiek šiame būste tikėtina mokėti už energiją kiekvieną mėnesį — šildymą, karštą vandenį ir buitinę elektrą, pritaikytą jūsų namų ūkio dydžiui — pagal dabartinius tarifus ir pastato energinius parametrus. Namų ūkio dydį galite pakeisti.",
    "breakdown": {
      "column_headers_lt": [
        "Komponentas",
        "€ per mėnesį (su PVM)",
        "€ per metus (su PVM)",
        "Šaltinis"
      ],
      "rows": [
        {
          "label_lt": "Šildymas (centrinis šildymas)",
          "band": "heating",
          "eur_year": 729,
          "eur_month": 61,
          "source_indicator": "📊 pagal pastato duomenis"
        },
        {
          "label_lt": "Karštas vanduo",
          "band": "dhw",
          "eur_year": 211,
          "eur_month": 17,
          "source_indicator": "📊 pagal pastato duomenis"
        }
      ],
      "total": {
        "label_lt": "Viso",
        "eur_year": 940,
        "eur_month": 78
      }
    },
    "explanation": {
      "heading_lt": "Ką tai reiškia praktiškai?",
      "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos sudarys apie €78 per mėnesį arba €940 per metus. Per 5 metus, jei tarifai kils pagal dabartines prognozes, mėnesinė kaina gali pasiekti apie €99. Visos sumos nurodytos su PVM."
    },
    "confidence": "medium",
    "confidence_text_lt": "šildymo sistema ir energinė klasė žinomos, tačiau galiojančio tarifo įrašo šiuo metu nėra — skaičiuojama pagal paskutinį žinomą tarifą",
    "carrier_warning_lt": null,
    "carrier_label_lt": "centrinis šildymas",
    "newbuild_note_lt": null,
    "citations_lt": [
      "VALSTYBINĖ ENERGETIKOS REGULIAVIMO TARYBA. AB „Miesto gijos“ centralizuotai tiekiamos šilumos kaina: paskutinis žinomas patvirtintas tarifas, galiojęs nuo 2026-05-01 iki 2026-05-31 [interaktyvus]. Vilnius: VERT [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.vert.lt",
      "AB „Energijos skirstymo operatorius“ (ESO). Buitinės elektros energijos kaina: „Standartinis“ planas (be mėnesinio mokesčio), verslui — „Verslas“ planas; tarifus reguliuoja Valstybinė energetikos reguliavimo taryba (VERT) [interaktyvus]. Vilnius: ESO [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.eso.lt",
      "LIETUVOS RESPUBLIKOS ŠILUMOS ŪKIO ĮSTATYMAS: 13 straipsnis „Šilumos tiekimo sezoniškumas“ (šildymo sezono nustatymo kriterijus pagal vidutinę paros oro temperatūrą; sezono datas skelbia savivaldybės) [interaktyvus]. Vilnius: LR Seimas [žiūrėta 2026-08-06]. Prieiga per internetą: https://e-seimas.lrs.lt. Sektoriaus kontekstas: LIETUVOS ŠILUMOS TIEKĖJŲ ASOCIACIJA (LŠTA), CŠT sektoriaus apžvalgos (https://www.lsta.lt/silumos-ukis/cst-sektoriaus-apzvalga/). Spalio–balandžio mėnesių langas yra NT Duomenų modeliavimo prielaida (vidaus metodikos sprendimas, 2026-07-23), atspindinti tipinį kriterijaus rezultatą.",
      "LIETUVOS RESPUBLIKOS PRIDĖTINĖS VERTĖS MOKESČIO ĮSTATYMAS, 2002 m. kovo 5 d. Nr. IX-751 (aktuali redakcija): 19 straipsnis — standartinis 21 % PVM tarifas, nuo 2026 m. sausio 1 d. taikomas ir gyvenamosioms patalpoms tiekiamai šilumos energijai bei karštam vandeniui [interaktyvus]. Vilnius: LR Seimas [žiūrėta 2026-08-06]. Prieiga per internetą: https://e-seimas.lrs.lt",
      "ONEBUILDING.ORG. Tipiniai meteorologiniai metai (TMYx 2011–2025), Lietuvos apskritys [interaktyvus, NOAA ISD pagrindu]. [žiūrėta 2026-08-06]. Prieiga per internetą: https://climate.onebuilding.org. Papildyta: EUROPOS KOMISIJA, Jungtinis tyrimų centras (JRC). PVGIS v5.3 (2005–2023). Mėnesinio energijos kainos kitimo profilis remiasi šildymo laipsnių dienomis (bazė 18 °C).",
      "EUROSTAT. Suderinti vartotojų kainų indeksai (HICP), serija „HICP CP0455 — šilumos energija“, Lietuva: metinių pokyčių dešimties metų slankusis vidurkis [interaktyvus]. Liuksemburgas: Europos Sąjungos statistikos tarnyba [žiūrėta 2026-08-06]. Prieiga per internetą: https://ec.europa.eu/eurostat",
      "EUROSTAT. Suderinti vartotojų kainų indeksai (HICP), serija „HICP CP00 — bendrasis indeksas“, Lietuva: dešimties metų vidurkis, 4,76%/m. — taikomas kaip minimali augimo riba [interaktyvus]. Liuksemburgas: Europos Sąjungos statistikos tarnyba [žiūrėta 2026-08-06]. Prieiga per internetą: https://ec.europa.eu/eurostat"
    ],
    "monthly_variation": [
      {
        "month": 1,
        "heating_eur": 141.6,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 2,
        "heating_eur": 118.52,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 3,
        "heating_eur": 107.35,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 4,
        "heating_eur": 64.65,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 5,
        "heating_eur": 0,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 6,
        "heating_eur": 0,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 7,
        "heating_eur": 0,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 8,
        "heating_eur": 0,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 9,
        "heating_eur": 0,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 10,
        "heating_eur": 71.69,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 11,
        "heating_eur": 99.53,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      },
      {
        "month": 12,
        "heating_eur": 125.56,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 0,
        "household_electricity_eur": 0
      }
    ],
    "forecast_5yr": [
      {
        "year": 2026,
        "total_eur_month": 78.34,
        "per_component": {
          "heating": 728.89,
          "dhw": 211.14
        },
        "per_component_display": {
          "heating": 61,
          "dhw": 17
        }
      },
      {
        "year": 2027,
        "total_eur_month": 83.11,
        "per_component": {
          "heating": 773.28,
          "dhw": 224
        },
        "per_component_display": {
          "heating": 64,
          "dhw": 19
        }
      },
      {
        "year": 2028,
        "total_eur_month": 88.17,
        "per_component": {
          "heating": 820.37,
          "dhw": 237.64
        },
        "per_component_display": {
          "heating": 68,
          "dhw": 20
        }
      },
      {
        "year": 2029,
        "total_eur_month": 93.54,
        "per_component": {
          "heating": 870.34,
          "dhw": 252.11
        },
        "per_component_display": {
          "heating": 73,
          "dhw": 21
        }
      },
      {
        "year": 2030,
        "total_eur_month": 99.23,
        "per_component": {
          "heating": 923.34,
          "dhw": 267.46
        },
        "per_component_display": {
          "heating": 77,
          "dhw": 22
        }
      }
    ],
    "monthly_chart_title_lt": "Mėnesinė energijos kaina per metus",
    "monthly_chart_description_lt": "Mėnesinės energijos sąnaudos: vidutiniškai €78 per mėnesį, nuo €18 (Gegužė) iki €159 (Sausis)",
    "forecast_chart_title_lt": "Prognozuojamas mėnesio energijos kainos kitimas (per 5 metus)",
    "forecast_chart_description_lt": "Prognozuojama mėnesinė energijos kaina: nuo €78 (2026) iki €99 (2030)",
    "household_table_headers_lt": {
      "size": "Namų ūkio dydis",
      "consumption": "Tipinis suvartojimas (kWh/mėn.)",
      "cost": "~€ per mėnesį"
    },
    "household_reference": [
      {
        "household_size": 1,
        "size_label_lt": "1 asmuo",
        "kwh_month": 124,
        "kwh_year": 1490,
        "eur_month": 14
      },
      {
        "household_size": 2,
        "size_label_lt": "2 asmenys",
        "kwh_month": 205,
        "kwh_year": 2460,
        "eur_month": 23
      },
      {
        "household_size": 3,
        "size_label_lt": "3 asmenys",
        "kwh_month": 273,
        "kwh_year": 3280,
        "eur_month": 30
      },
      {
        "household_size": 4,
        "size_label_lt": "4 asmenys",
        "kwh_month": 325,
        "kwh_year": 3900,
        "eur_month": 36
      },
      {
        "household_size": 5,
        "size_label_lt": "5+ asmenys",
        "kwh_month": 379,
        "kwh_year": 4545,
        "eur_month": 42
      }
    ],
    "standard_occupancy": 2,
    "household_modelling": {
      "selector_caption_lt": "Pritaikykite pagal savo namų ūkio dydį",
      "citation_lt": {
        "category_lt": "👥 Namų ūkio modeliavimas",
        "lines_lt": [
          "EUROSTAT. Gyvenamųjų pastatų galutinis elektros energijos suvartojimas Lietuvoje (nrg_bal_c, 2023 m.), išskaidytas pagal namų ūkio dydį [interaktyvus]. Liuksemburgas: Europos Sąjungos statistikos tarnyba [žiūrėta 2026-08-06]. Prieiga per internetą: https://ec.europa.eu/eurostat. Namų ūkio dydžio struktūra — 2021 m. gyventojų ir būstų surašymas (Valstybės duomenų agentūra); išskaidymo metodika — DESTATIS (Vokietijos federalinė statistikos tarnyba).",
          "VALSTYBĖS DUOMENŲ AGENTŪRA. 2021 m. gyventojų ir būstų surašymas: vidutinis namų ūkio dydis (2,29 asmens) ir vidutinis naudingasis plotas vienam gyventojui (35,5 m²) [interaktyvus]. Vilnius: Valstybės duomenų agentūra [žiūrėta 2026-08-06]. Prieiga per internetą: https://osp.stat.gov.lt. Tipinis gyventojų skaičius pagal buto plotą — NT Duomenų įvertis, išvestas iš šių surašymo suvestinių rodiklių (ne atskira surašymo lentelė).",
          "MIKUČIONIENĖ, R., MOTUZIENĖ, V., DŽIUGAITĖ-TUMĖNIENĖ, R. 15 % ir 30 % energetiškai efektyviausių pastatų Lietuvoje nustatymo metodika. Vilnius: Vilniaus Gedimino technikos universitetas; užsakė Lietuvos bankų asociacija (ES taksonomijos 7.7 str. įgyvendinimui), 2023 (atnaujinta 2024) [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.lba.lt. Priede pakartotos STR 2.01.02:2016 2 priedo 2.4 lentelės ψhw reikšmės (nepriklausomas patikrinimas)."
        ]
      },
      "options": [
        {
          "household_size": 1,
          "size_label_lt": "1 asmuo",
          "metric": {
            "eur_month": 84,
            "subtext_lt": "Pastato energija + buitinė elektra (1 asmens namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "band": "heating",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 1 asmeniui)",
                "band": "dhw",
                "eur_year": 106,
                "eur_month": 9,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Buitinė elektra (1 asm.)",
                "band": "household_electricity",
                "eur_year": 166,
                "eur_month": 14,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1000,
              "eur_month": 84
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 141.6,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 2,
              "heating_eur": 118.52,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 3,
              "heating_eur": 107.35,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 4,
              "heating_eur": 64.65,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 5,
              "heating_eur": 0,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 6,
              "heating_eur": 0,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 7,
              "heating_eur": 0,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 8,
              "heating_eur": 0,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 9,
              "heating_eur": 0,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 10,
              "heating_eur": 71.69,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 11,
              "heating_eur": 99.53,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            },
            {
              "month": 12,
              "heating_eur": 125.56,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 14
            }
          ],
          "forecast_5yr": [
            {
              "year": 2026,
              "total_eur_month": 83.54,
              "per_component": {
                "heating": 728.89,
                "dhw": 105.57,
                "household_electricity": 168
              },
              "per_component_display": {
                "heating": 61,
                "dhw": 9,
                "household_electricity": 14
              }
            },
            {
              "year": 2027,
              "total_eur_month": 88.44,
              "per_component": {
                "heating": 773.28,
                "dhw": 112,
                "household_electricity": 176
              },
              "per_component_display": {
                "heating": 64,
                "dhw": 9,
                "household_electricity": 15
              }
            },
            {
              "year": 2028,
              "total_eur_month": 93.63,
              "per_component": {
                "heating": 820.37,
                "dhw": 118.82,
                "household_electricity": 184.37
              },
              "per_component_display": {
                "heating": 69,
                "dhw": 10,
                "household_electricity": 15
              }
            },
            {
              "year": 2029,
              "total_eur_month": 99.13,
              "per_component": {
                "heating": 870.34,
                "dhw": 126.05,
                "household_electricity": 193.15
              },
              "per_component_display": {
                "heating": 73,
                "dhw": 10,
                "household_electricity": 16
              }
            },
            {
              "year": 2030,
              "total_eur_month": 104.95,
              "per_component": {
                "heating": 923.34,
                "dhw": 133.73,
                "household_electricity": 202.34
              },
              "per_component_display": {
                "heating": 77,
                "dhw": 11,
                "household_electricity": 17
              }
            }
          ],
          "monthly_chart_description_lt": "Mėnesinės energijos sąnaudos: vidutiniškai €84 per mėnesį, nuo €23 (Gegužė) iki €164 (Sausis)",
          "forecast_chart_description_lt": "Prognozuojama mėnesinė energijos kaina: nuo €84 (2026) iki €105 (2030)",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 1 asmens namų ūkiui sudarys apie €84 per mėnesį arba €1000 per metus. Per 5 metus, jei kainos kils pagal dabartines prognozes, mėnesinė kaina gali pasiekti apie €105. Visos sumos nurodytos su PVM.",
          "info_section": {
            "title_lt": "Kokia informacija remiamės?",
            "items_lt": [
              "Prognozė remiasi Eurostat HICP energijos kainų indeksais (10 metų vidurkis), ne mažiau nei bendroji infliacija",
              "Kainos apskaičiuotos pagal paskutinį žinomą AB „Miesto gijos“ tarifą (galiojo iki 2026-05-31). VERT patvirtinus naujus tarifus, sumos gali keistis.",
              "Šis vertinimas sujungia du duomenų tipus:",
              "📊 Pastato duomenys — šildymo ir karšto vandens sąnaudos apskaičiuotos pagal šio konkretaus pastato energinio naudingumo sertifikatą, šildymo sistemos tipą ir dabartinius energijos tarifus. Šie skaičiai yra specifiniai šiam pastatui. Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
              "👥 Namų ūkio modeliavimas — karšto vandens sąnaudos pritaikytos pagal jūsų namų ūkio dydį (tipinis gyventojų skaičius pagal naudingąjį plotą, 2021 m. gyventojų ir būstų surašymas). Karšto vandens sąnaudos rodomos atskirai nuo šildymo, nes jos labiau priklauso nuo gyventojų skaičiaus ir suvartojimo įpročių. Buitinės elektros sąnaudos yra statistinis Lietuvos namų ūkių vidurkis pagal Eurostat duomenis. Faktinės sąnaudos gali skirtis priklausomai nuo prietaisų ir įpročių.",
              "Šaltiniai: [14], [15], [16], [17], [18], [19], [20], [22], [23]"
            ]
          }
        },
        {
          "household_size": 2,
          "size_label_lt": "2 asmenys",
          "metric": {
            "eur_month": 101,
            "subtext_lt": "Pastato energija + buitinė elektra (2 asmenų namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "band": "heating",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 2 asmenims)",
                "band": "dhw",
                "eur_year": 211,
                "eur_month": 17,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Buitinė elektra (2 asm.)",
                "band": "household_electricity",
                "eur_year": 274,
                "eur_month": 23,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1214,
              "eur_month": 101
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 141.6,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 2,
              "heating_eur": 118.52,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 3,
              "heating_eur": 107.35,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 4,
              "heating_eur": 64.65,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 5,
              "heating_eur": 0,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 6,
              "heating_eur": 0,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 7,
              "heating_eur": 0,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 8,
              "heating_eur": 0,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 9,
              "heating_eur": 0,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 10,
              "heating_eur": 71.69,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 11,
              "heating_eur": 99.53,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            },
            {
              "month": 12,
              "heating_eur": 125.56,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 23
            }
          ],
          "forecast_5yr": [
            {
              "year": 2026,
              "total_eur_month": 101.34,
              "per_component": {
                "heating": 728.89,
                "dhw": 211.14,
                "household_electricity": 276
              },
              "per_component_display": {
                "heating": 61,
                "dhw": 17,
                "household_electricity": 23
              }
            },
            {
              "year": 2027,
              "total_eur_month": 107.2,
              "per_component": {
                "heating": 773.28,
                "dhw": 224,
                "household_electricity": 289.14
              },
              "per_component_display": {
                "heating": 64,
                "dhw": 19,
                "household_electricity": 24
              }
            },
            {
              "year": 2028,
              "total_eur_month": 113.41,
              "per_component": {
                "heating": 820.37,
                "dhw": 237.64,
                "household_electricity": 302.9
              },
              "per_component_display": {
                "heating": 68,
                "dhw": 20,
                "household_electricity": 25
              }
            },
            {
              "year": 2029,
              "total_eur_month": 119.98,
              "per_component": {
                "heating": 870.34,
                "dhw": 252.11,
                "household_electricity": 317.32
              },
              "per_component_display": {
                "heating": 73,
                "dhw": 21,
                "household_electricity": 26
              }
            },
            {
              "year": 2030,
              "total_eur_month": 126.94,
              "per_component": {
                "heating": 923.34,
                "dhw": 267.46,
                "household_electricity": 332.42
              },
              "per_component_display": {
                "heating": 77,
                "dhw": 22,
                "household_electricity": 28
              }
            }
          ],
          "monthly_chart_description_lt": "Mėnesinės energijos sąnaudos: vidutiniškai €101 per mėnesį, nuo €41 (Gegužė) iki €182 (Sausis)",
          "forecast_chart_description_lt": "Prognozuojama mėnesinė energijos kaina: nuo €101 (2026) iki €127 (2030)",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 2 asmenų namų ūkiui sudarys apie €101 per mėnesį arba €1214 per metus. Per 5 metus, jei kainos kils pagal dabartines prognozes, mėnesinė kaina gali pasiekti apie €127. Visos sumos nurodytos su PVM.",
          "info_section": {
            "title_lt": "Kokia informacija remiamės?",
            "items_lt": [
              "Prognozė remiasi Eurostat HICP energijos kainų indeksais (10 metų vidurkis), ne mažiau nei bendroji infliacija",
              "Kainos apskaičiuotos pagal paskutinį žinomą AB „Miesto gijos“ tarifą (galiojo iki 2026-05-31). VERT patvirtinus naujus tarifus, sumos gali keistis.",
              "Šis vertinimas sujungia du duomenų tipus:",
              "📊 Pastato duomenys — šildymo ir karšto vandens sąnaudos apskaičiuotos pagal šio konkretaus pastato energinio naudingumo sertifikatą, šildymo sistemos tipą ir dabartinius energijos tarifus. Šie skaičiai yra specifiniai šiam pastatui. Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
              "👥 Namų ūkio modeliavimas — karšto vandens sąnaudos pritaikytos pagal jūsų namų ūkio dydį (tipinis gyventojų skaičius pagal naudingąjį plotą, 2021 m. gyventojų ir būstų surašymas). Karšto vandens sąnaudos rodomos atskirai nuo šildymo, nes jos labiau priklauso nuo gyventojų skaičiaus ir suvartojimo įpročių. Buitinės elektros sąnaudos yra statistinis Lietuvos namų ūkių vidurkis pagal Eurostat duomenis. Faktinės sąnaudos gali skirtis priklausomai nuo prietaisų ir įpročių.",
              "Šaltiniai: [14], [15], [16], [17], [18], [19], [20], [22], [23]"
            ]
          }
        },
        {
          "household_size": 3,
          "size_label_lt": "3 asmenys",
          "metric": {
            "eur_month": 117,
            "subtext_lt": "Pastato energija + buitinė elektra (3 asmenų namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "band": "heating",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 3 asmenims)",
                "band": "dhw",
                "eur_year": 317,
                "eur_month": 26,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Buitinė elektra (3 asm.)",
                "band": "household_electricity",
                "eur_year": 365,
                "eur_month": 30,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1411,
              "eur_month": 117
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 141.6,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 2,
              "heating_eur": 118.52,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 3,
              "heating_eur": 107.35,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 4,
              "heating_eur": 64.65,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 5,
              "heating_eur": 0,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 6,
              "heating_eur": 0,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 7,
              "heating_eur": 0,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 8,
              "heating_eur": 0,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 9,
              "heating_eur": 0,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 10,
              "heating_eur": 71.69,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 11,
              "heating_eur": 99.53,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            },
            {
              "month": 12,
              "heating_eur": 125.56,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 30
            }
          ],
          "forecast_5yr": [
            {
              "year": 2026,
              "total_eur_month": 117.13,
              "per_component": {
                "heating": 728.89,
                "dhw": 316.71,
                "household_electricity": 360
              },
              "per_component_display": {
                "heating": 61,
                "dhw": 26,
                "household_electricity": 30
              }
            },
            {
              "year": 2027,
              "total_eur_month": 123.87,
              "per_component": {
                "heating": 773.28,
                "dhw": 335.99,
                "household_electricity": 377.14
              },
              "per_component_display": {
                "heating": 65,
                "dhw": 28,
                "household_electricity": 31
              }
            },
            {
              "year": 2028,
              "total_eur_month": 130.99,
              "per_component": {
                "heating": 820.37,
                "dhw": 356.46,
                "household_electricity": 395.09
              },
              "per_component_display": {
                "heating": 68,
                "dhw": 30,
                "household_electricity": 33
              }
            },
            {
              "year": 2029,
              "total_eur_month": 138.53,
              "per_component": {
                "heating": 870.34,
                "dhw": 378.16,
                "household_electricity": 413.89
              },
              "per_component_display": {
                "heating": 73,
                "dhw": 32,
                "household_electricity": 34
              }
            },
            {
              "year": 2030,
              "total_eur_month": 146.51,
              "per_component": {
                "heating": 923.34,
                "dhw": 401.19,
                "household_electricity": 433.6
              },
              "per_component_display": {
                "heating": 77,
                "dhw": 34,
                "household_electricity": 36
              }
            }
          ],
          "monthly_chart_description_lt": "Mėnesinės energijos sąnaudos: vidutiniškai €117 per mėnesį, nuo €56 (Gegužė) iki €198 (Sausis)",
          "forecast_chart_description_lt": "Prognozuojama mėnesinė energijos kaina: nuo €117 (2026) iki €147 (2030)",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 3 asmenų namų ūkiui sudarys apie €117 per mėnesį arba €1411 per metus. Per 5 metus, jei kainos kils pagal dabartines prognozes, mėnesinė kaina gali pasiekti apie €147. Visos sumos nurodytos su PVM.",
          "info_section": {
            "title_lt": "Kokia informacija remiamės?",
            "items_lt": [
              "Prognozė remiasi Eurostat HICP energijos kainų indeksais (10 metų vidurkis), ne mažiau nei bendroji infliacija",
              "Kainos apskaičiuotos pagal paskutinį žinomą AB „Miesto gijos“ tarifą (galiojo iki 2026-05-31). VERT patvirtinus naujus tarifus, sumos gali keistis.",
              "Šis vertinimas sujungia du duomenų tipus:",
              "📊 Pastato duomenys — šildymo ir karšto vandens sąnaudos apskaičiuotos pagal šio konkretaus pastato energinio naudingumo sertifikatą, šildymo sistemos tipą ir dabartinius energijos tarifus. Šie skaičiai yra specifiniai šiam pastatui. Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
              "👥 Namų ūkio modeliavimas — karšto vandens sąnaudos pritaikytos pagal jūsų namų ūkio dydį (tipinis gyventojų skaičius pagal naudingąjį plotą, 2021 m. gyventojų ir būstų surašymas). Karšto vandens sąnaudos rodomos atskirai nuo šildymo, nes jos labiau priklauso nuo gyventojų skaičiaus ir suvartojimo įpročių. Buitinės elektros sąnaudos yra statistinis Lietuvos namų ūkių vidurkis pagal Eurostat duomenis. Faktinės sąnaudos gali skirtis priklausomai nuo prietaisų ir įpročių.",
              "Šaltiniai: [14], [15], [16], [17], [18], [19], [20], [22], [23]"
            ]
          }
        },
        {
          "household_size": 4,
          "size_label_lt": "4 asmenys",
          "metric": {
            "eur_month": 132,
            "subtext_lt": "Pastato energija + buitinė elektra (4 asmenų namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "band": "heating",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 4 asmenims)",
                "band": "dhw",
                "eur_year": 422,
                "eur_month": 35,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Buitinė elektra (4 asm.)",
                "band": "household_electricity",
                "eur_year": 434,
                "eur_month": 36,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1585,
              "eur_month": 132
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 141.6,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 2,
              "heating_eur": 118.52,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 3,
              "heating_eur": 107.35,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 4,
              "heating_eur": 64.65,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 5,
              "heating_eur": 0,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 6,
              "heating_eur": 0,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 7,
              "heating_eur": 0,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 8,
              "heating_eur": 0,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 9,
              "heating_eur": 0,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 10,
              "heating_eur": 71.69,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 11,
              "heating_eur": 99.53,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            },
            {
              "month": 12,
              "heating_eur": 125.56,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 36
            }
          ],
          "forecast_5yr": [
            {
              "year": 2026,
              "total_eur_month": 131.93,
              "per_component": {
                "heating": 728.89,
                "dhw": 422.28,
                "household_electricity": 432
              },
              "per_component_display": {
                "heating": 61,
                "dhw": 35,
                "household_electricity": 36
              }
            },
            {
              "year": 2027,
              "total_eur_month": 139.49,
              "per_component": {
                "heating": 773.28,
                "dhw": 447.99,
                "household_electricity": 452.56
              },
              "per_component_display": {
                "heating": 64,
                "dhw": 37,
                "household_electricity": 38
              }
            },
            {
              "year": 2028,
              "total_eur_month": 147.48,
              "per_component": {
                "heating": 820.37,
                "dhw": 475.27,
                "household_electricity": 474.11
              },
              "per_component_display": {
                "heating": 68,
                "dhw": 40,
                "household_electricity": 39
              }
            },
            {
              "year": 2029,
              "total_eur_month": 155.94,
              "per_component": {
                "heating": 870.34,
                "dhw": 504.22,
                "household_electricity": 496.67
              },
              "per_component_display": {
                "heating": 73,
                "dhw": 42,
                "household_electricity": 41
              }
            },
            {
              "year": 2030,
              "total_eur_month": 164.88,
              "per_component": {
                "heating": 923.34,
                "dhw": 534.93,
                "household_electricity": 520.31
              },
              "per_component_display": {
                "heating": 77,
                "dhw": 45,
                "household_electricity": 43
              }
            }
          ],
          "monthly_chart_description_lt": "Mėnesinės energijos sąnaudos: vidutiniškai €132 per mėnesį, nuo €71 (Gegužė) iki €213 (Sausis)",
          "forecast_chart_description_lt": "Prognozuojama mėnesinė energijos kaina: nuo €132 (2026) iki €165 (2030)",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 4 asmenų namų ūkiui sudarys apie €132 per mėnesį arba €1585 per metus. Per 5 metus, jei kainos kils pagal dabartines prognozes, mėnesinė kaina gali pasiekti apie €165. Visos sumos nurodytos su PVM.",
          "info_section": {
            "title_lt": "Kokia informacija remiamės?",
            "items_lt": [
              "Prognozė remiasi Eurostat HICP energijos kainų indeksais (10 metų vidurkis), ne mažiau nei bendroji infliacija",
              "Kainos apskaičiuotos pagal paskutinį žinomą AB „Miesto gijos“ tarifą (galiojo iki 2026-05-31). VERT patvirtinus naujus tarifus, sumos gali keistis.",
              "Šis vertinimas sujungia du duomenų tipus:",
              "📊 Pastato duomenys — šildymo ir karšto vandens sąnaudos apskaičiuotos pagal šio konkretaus pastato energinio naudingumo sertifikatą, šildymo sistemos tipą ir dabartinius energijos tarifus. Šie skaičiai yra specifiniai šiam pastatui. Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
              "👥 Namų ūkio modeliavimas — karšto vandens sąnaudos pritaikytos pagal jūsų namų ūkio dydį (tipinis gyventojų skaičius pagal naudingąjį plotą, 2021 m. gyventojų ir būstų surašymas). Karšto vandens sąnaudos rodomos atskirai nuo šildymo, nes jos labiau priklauso nuo gyventojų skaičiaus ir suvartojimo įpročių. Buitinės elektros sąnaudos yra statistinis Lietuvos namų ūkių vidurkis pagal Eurostat duomenis. Faktinės sąnaudos gali skirtis priklausomai nuo prietaisų ir įpročių.",
              "Šaltiniai: [14], [15], [16], [17], [18], [19], [20], [22], [23]"
            ]
          }
        },
        {
          "household_size": 5,
          "size_label_lt": "5+ asmenys",
          "metric": {
            "eur_month": 147,
            "subtext_lt": "Pastato energija + buitinė elektra (5 asmenų namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "band": "heating",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 5 asmenims)",
                "band": "dhw",
                "eur_year": 528,
                "eur_month": 44,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Buitinė elektra (5 asm.)",
                "band": "household_electricity",
                "eur_year": 506,
                "eur_month": 42,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1763,
              "eur_month": 147
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 141.6,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 2,
              "heating_eur": 118.52,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 3,
              "heating_eur": 107.35,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 4,
              "heating_eur": 64.65,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 5,
              "heating_eur": 0,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 6,
              "heating_eur": 0,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 7,
              "heating_eur": 0,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 8,
              "heating_eur": 0,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 9,
              "heating_eur": 0,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 10,
              "heating_eur": 71.69,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 11,
              "heating_eur": 99.53,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            },
            {
              "month": 12,
              "heating_eur": 125.56,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 0,
              "household_electricity_eur": 42
            }
          ],
          "forecast_5yr": [
            {
              "year": 2026,
              "total_eur_month": 146.73,
              "per_component": {
                "heating": 728.89,
                "dhw": 527.84,
                "household_electricity": 504
              },
              "per_component_display": {
                "heating": 61,
                "dhw": 44,
                "household_electricity": 42
              }
            },
            {
              "year": 2027,
              "total_eur_month": 155.11,
              "per_component": {
                "heating": 773.28,
                "dhw": 559.99,
                "household_electricity": 527.99
              },
              "per_component_display": {
                "heating": 64,
                "dhw": 47,
                "household_electricity": 44
              }
            },
            {
              "year": 2028,
              "total_eur_month": 163.97,
              "per_component": {
                "heating": 820.37,
                "dhw": 594.09,
                "household_electricity": 553.12
              },
              "per_component_display": {
                "heating": 68,
                "dhw": 50,
                "household_electricity": 46
              }
            },
            {
              "year": 2029,
              "total_eur_month": 173.34,
              "per_component": {
                "heating": 870.34,
                "dhw": 630.27,
                "household_electricity": 579.45
              },
              "per_component_display": {
                "heating": 73,
                "dhw": 52,
                "household_electricity": 48
              }
            },
            {
              "year": 2030,
              "total_eur_month": 183.25,
              "per_component": {
                "heating": 923.34,
                "dhw": 668.66,
                "household_electricity": 607.03
              },
              "per_component_display": {
                "heating": 77,
                "dhw": 56,
                "household_electricity": 50
              }
            }
          ],
          "monthly_chart_description_lt": "Mėnesinės energijos sąnaudos: vidutiniškai €147 per mėnesį, nuo €86 (Gegužė) iki €228 (Sausis)",
          "forecast_chart_description_lt": "Prognozuojama mėnesinė energijos kaina: nuo €147 (2026) iki €183 (2030)",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 5 asmenų namų ūkiui sudarys apie €147 per mėnesį arba €1763 per metus. Per 5 metus, jei kainos kils pagal dabartines prognozes, mėnesinė kaina gali pasiekti apie €183. Visos sumos nurodytos su PVM.",
          "info_section": {
            "title_lt": "Kokia informacija remiamės?",
            "items_lt": [
              "Prognozė remiasi Eurostat HICP energijos kainų indeksais (10 metų vidurkis), ne mažiau nei bendroji infliacija",
              "Kainos apskaičiuotos pagal paskutinį žinomą AB „Miesto gijos“ tarifą (galiojo iki 2026-05-31). VERT patvirtinus naujus tarifus, sumos gali keistis.",
              "Šis vertinimas sujungia du duomenų tipus:",
              "📊 Pastato duomenys — šildymo ir karšto vandens sąnaudos apskaičiuotos pagal šio konkretaus pastato energinio naudingumo sertifikatą, šildymo sistemos tipą ir dabartinius energijos tarifus. Šie skaičiai yra specifiniai šiam pastatui. Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
              "👥 Namų ūkio modeliavimas — karšto vandens sąnaudos pritaikytos pagal jūsų namų ūkio dydį (tipinis gyventojų skaičius pagal naudingąjį plotą, 2021 m. gyventojų ir būstų surašymas). Karšto vandens sąnaudos rodomos atskirai nuo šildymo, nes jos labiau priklauso nuo gyventojų skaičiaus ir suvartojimo įpročių. Buitinės elektros sąnaudos yra statistinis Lietuvos namų ūkių vidurkis pagal Eurostat duomenis. Faktinės sąnaudos gali skirtis priklausomai nuo prietaisų ir įpročių.",
              "Šaltiniai: [14], [15], [16], [17], [18], [19], [20], [22], [23]"
            ]
          }
        }
      ]
    },
    "info_section": {
      "title_lt": "Kokia informacija remiamės?",
      "items_lt": [
        "Prognozė remiasi Eurostat HICP energijos kainų indeksais (10 metų vidurkis), ne mažiau nei bendroji infliacija",
        "Kainos apskaičiuotos pagal paskutinį žinomą AB „Miesto gijos“ tarifą (galiojo iki 2026-05-31). VERT patvirtinus naujus tarifus, sumos gali keistis.",
        "Šis vertinimas sujungia du duomenų tipus:",
        "📊 Pastato duomenys — šildymo ir karšto vandens sąnaudos apskaičiuotos pagal šio konkretaus pastato energinio naudingumo sertifikatą, šildymo sistemos tipą ir dabartinius energijos tarifus. Šie skaičiai yra specifiniai šiam pastatui. Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
        "👥 Namų ūkio modeliavimas — karšto vandens sąnaudos pritaikytos pagal jūsų namų ūkio dydį (tipinis gyventojų skaičius pagal naudingąjį plotą, 2021 m. gyventojų ir būstų surašymas). Karšto vandens sąnaudos rodomos atskirai nuo šildymo, nes jos labiau priklauso nuo gyventojų skaičiaus ir suvartojimo įpročių. Buitinės elektros sąnaudos yra statistinis Lietuvos namų ūkių vidurkis pagal Eurostat duomenis. Faktinės sąnaudos gali skirtis priklausomai nuo prietaisų ir įpročių.",
        "Šaltiniai: [14], [15], [16], [17], [18], [19], [20], [22], [23]"
      ]
    }
  },
  "citations_title_lt": "Šaltiniai",
  "documents_lt": {
    "regia": "Žemės sklypų ribos, pastatų kontūrai ir adresai interaktyviame žemėlapyje.",
    "infostatyba": "Statybos leidimai, projektiniai pasiūlymai ir statybos dokumentacija šiuo adresu.",
    "tpdr": "Detalieji ir bendrieji planai, specialieji planai, žemėtvarkos projektai.",
    "registru_centras": "Išsamūs registro duomenys: savininkai, suvaržymai, sandorių istorija ir kita teisinė informacija."
  },
  "property_profile": {
    "purpose": "residential",
    "paskirtis_label_lt": null,
    "paskirtis_row_label_lt": null,
    "premises_type": null,
    "usage_group_label": "Kiti gyvenamieji pastatai (daugiabučiai, bendrabučiai ir kt.)",
    "year_built": 1975,
    "floors": 5,
    "total_area_m2": 58.7,
    "heated_area_m2": 52.4,
    "heated_area_m2_source_lt": "Pagal energinio naudingumo sertifikatą",
    "heated_area_m2_source": "tier_2_pens_israsas",
    "heated_area_m2_is_genuine": true,
    "wall_material": null,
    "heating_type": "centrinis šildymas",
    "ventilation_type": "Natūrali",
    "energy_class": "D",
    "energy_class_provenance": "certificate",
    "energy_class_provenance_lt": null,
    "epc_kwhm2_year": 145.2,
    "hero_source_caption_lt": null,
    "epc_source": "Pastatų energinio naudingumo sertifikatai",
    "epc_confidence": "Aukštas",
    "glazing_percent": null,
    "glazing_source": null,
    "cadastral_ref": "4400-1234-5678",
    "evaluation_target": "Esamas pastatas"
  },
  "block1": {
    "applicable": true,
    "neutral_message_lt": null,
    "winter": {
      "level": "WEAK",
      "not_assessed_reason": null,
      "provenance_label_key": null,
      "title_lt": "Žiemos komfortas",
      "not_assessed_message_lt": null,
      "provenance_message_lt": null,
      "rows": [
        {
          "band": "WEAK",
          "label_lt": "Silpnai",
          "description_lt": "Žema pastato energinė klasė (D ar žemesnė) rodo didelius šilumos poreikius: norint palaikyti 20–22 °C visame būste reikės intensyvaus šildymo, dalis patalpų gali likti vėsesnės (tikslesnę šildymo kainą rasite 2 bloke).",
          "highlighted": true
        }
      ],
      "comparison_lines_lt": [
        "Palyginti su renovuoto pastato etalonu (C klasė): apie 97 % didesnis.",
        "Palyginti su efektyvių (A klasių grupės) pastatų mediana Lietuvoje: apie 6,5 karto didesnis.",
        "Palyginti su naujos statybos etalonu (A++): apie 11 kartų didesnis šildymo poreikis."
      ]
    },
    "summer": {
      "risk_level": "MODERATE",
      "rows": [
        {
          "band": "MODERATE",
          "label_lt": "Vidutinė",
          "description_lt": "Per karščio bangas kai kuriose patalpose gali tapti per šilta, ypač ten, kur yra dideli langai ar viršutiniai aukštai — reikės dažnai vėdinti ir riboti tiesioginę saulę. Gali prireikti ventiliatorių ar nešiojamo kondicionieriaus per karščiausias dienas, tad dalį metų papildomai didės elektros sąnaudos dėl vėsinimo.",
          "highlighted": true
        }
      ]
    },
    "summary_lt": "",
    "drivers": [
      {
        "key": "high_energy_class_driver",
        "label_lt": "Aukšta energinė klasė",
        "explanation_lt": "Aukštesnės energinės klasės pastatai paprastai sandaresni ir geriau apšiltinti — žiemą tai taupo šilumą, bet vasarą pro langus ir iš vidaus patekusi šiluma patalpose išlieka ilgiau, todėl be tinkamo šešėliavimo ir vėdinimo perkaitimo rizika būna šiek tiek didesnė.",
        "active": false,
        "direction": "increase"
      },
      {
        "key": "newer_building_driver",
        "label_lt": "Naujesnės statybos pastatas",
        "explanation_lt": "Naujesni pastatai paprastai sandaresni ir geriau apšiltinti, todėl be tinkamo šešėliavimo ir vėdinimo vasarą sukaupta šiluma patalpose išlieka ilgiau ir perkaitimo rizika būna šiek tiek didesnė.",
        "active": false,
        "direction": "increase"
      },
      {
        "key": "high_glazing_driver",
        "label_lt": "Didelė langų dalis",
        "explanation_lt": "Kai langų plotas didelis, saulėtomis dienomis pro stiklą patenka daug šilumos, todėl patalpos vasarą greičiau ir labiau įšyla.",
        "active": false,
        "direction": "increase"
      }
    ],
    "winter_factors": [
      {
        "key": "new_or_renovated",
        "label_lt": "Naujesnės statybos pastatas",
        "explanation_lt": "Naujesnės statybos pastatai paprastai geriau apšiltinti ir sandaresni, todėl žiemą šiluma išlaikoma efektyviau ir jaučiama mažiau šaltų vietų ties sienomis ar kampuose.",
        "active": false,
        "direction": "decrease"
      },
      {
        "key": "risky_glazing",
        "label_lt": "Didelė langų dalis",
        "explanation_lt": "Langai šilumą praleidžia lengviau nei sienos, todėl kai jų plotas didelis, žiemą pro juos prarandama daugiau šilumos — ties langais gali būti vėsiau, o šildymo poreikis šiek tiek didesnis.",
        "active": false,
        "direction": "increase"
      }
    ],
    "winter_factors_title_lt": "Žiemos komforto veiksniai",
    "info_box": {
      "items_lt": [
        "Vertinimas remiasi Pastatų energinio naudingumo sertifikatų duomenimis ir standartinėmis prielaidomis panašiems būstams.",
        "Šiame bloke atskirai nemodeliuojame realių vidaus drėgmės ir skersvėjų, nes jie stipriai priklauso nuo gyventojų įpročių ir konkrečios buto būklės (langų, durų, sandūrų ir pan.).",
        "Komforto modeliavimui NT Duomenys naudoja 20–22 °C prielaidą — HN 42:2009 nustatyto 18–22 °C žiemos (šaltojo periodo) temperatūros diapazono viduje.",
        "Šaltiniai: [2], [3], [8], [9]"
      ]
    },
    "upload_not_used_message_lt": null,
    "secondary_certificate": null,
    "inputs_snapshot": {
      "effective_energy_class": "D",
      "effective_epc_kwhm2_year": 145.2,
      "effective_year_built": 1975,
      "glazing_share_percent": null,
      "ventilation_type": "natural",
      "epc_source_class": "registry",
      "epc_confidence_level": "high",
      "evaluation_target": "existing_object",
      "epc_plausibility": null,
      "epc_plausibility_note_lt": null
    }
  },
  "block8": {
    "id": "recommendations",
    "title_lt": "8) Rekomendacijos ir sprendimai",
    "status": "ready",
    "data": {
      "pattern": "B",
      "pattern_title_lt": "Šildymo iššūkis",
      "scope_prefix": "Šilumos komforto požiūriu",
      "intro_lt": "Lyginant su tos pačios klasės (D) pastatais Lietuvoje, šio pastato šildymo poreikis yra apie 35 % mažesnis nei vidurkis. Tačiau, šilumos komforto požiūriu, šis pastatas kelia šildymo iššūkį — šildymo sąnaudos gali būti reikšmingai didesnės nei techniškai efektyviame pastate (A++), todėl verta atkreipti dėmesį į keletą dalykų. Šildymas — vidutiniškai apie €61 per mėnesį (apie €729 per metus).",
      "viewing_questions_lt": [
        "Paprašykite faktinių šildymo sąskaitų už paskutinius 2–3 žiemos sezonus — ne įvertinimų, o tikrų sąskaitų.",
        "Apžiūrėkite izoliaciją: stogo / pastogės apšiltinimą, grindų / rūsio izoliaciją, sienų būklę (matomi plyšiai, drėgmės žymės).",
        "Patikrinkite langų būklę: dvigubas ar trigubas stiklo paketas, rėmų būklė, ar jaučiamas skersvėjis.",
        "Paklauskite, ar yra patalpų, kurios žiemą būna nuolat šaltos arba nenaudojamos dėl šalčio."
      ],
      "negotiation_angles_lt": [
        "Pagal mūsų vertinimą, šildymo sąnaudos gali būti apie 6,5 karto didesnės nei efektyvių (A klasių grupės) pastatų mediana — tai apie €620 per metus. Per 5 metus, įvertinus prognozuojamą energijos kainų augimą (pagal 10 metų kainų tendencijas), skirtumas sudarytų apie €3480. Nerenovavus pastato, vien šildymas kainuotų apie €360 per metus daugiau nei renovuotame (C klasės) pastate.",
        "Iki 1993 m. statyti pastatai dažnai turi silpnesnę izoliaciją — verta paklausti pardavėjo, ar buvo atlikta modernizacija.",
        "Didelis šildymo poreikis rodo, kad apšiltinimas anksčiau ar vėliau taps aktualus. Tikslios sumos be projekto dokumentų apskaičiuoti neįmanoma, tačiau pats poreikis yra pagrįstas argumentas derėtis dėl kainos ar aptarti tai su pardavėju."
      ],
      "forward_note_lt": "Kiek konkrečiai kainuoja šildymas eurais per mėnesį, rasite 2 bloke (Energijos sąnaudos).",
      "caveat_lt": null,
      "scope_disclaimer_lt": "Šios rekomendacijos apima tik šilumos komforto aspektą.",
      "source_keys": [
        "ltrs",
        "monstvilas_ma",
        "monstvilas_sd",
        "bliudzius"
      ]
    }
  }
};

// --- MOCK_LAND_ONLY — regenerated from the backend dev fixture (2026-07-31) ---
// Same recipe as MOCK_EXISTING above, `_DEV_MOCKS["dev-land"]` instead. It had
// been hand-written and drifted: it carried NO `citations` key at all, so the dev
// land report rendered an empty „Šaltiniai" section while the real one serves
// four entries. It is also the fixture that proves the not-applicable path stays
// SILENT — a land report is never calculated, so its info box states no basis and
// carries no „Šaltiniai" pointer. Do NOT hand-edit; REGENERATE.
export const MOCK_LAND_ONLY: ReportData = {
  "envelope": {
    "address": "Vilnius, Žemaitės g. 10 (sklypas)",
    "request_id": "report-20260806122435",
    "created_at": "2026-08-06T12:24:35.073234+00:00"
  },
  "blocks": [
    {
      "id": "thermal_comfort_proxy",
      "label_lt": "1) Vidaus patalpų klimato komfortas",
      "status": "ready",
      "summary_lt": "Vidaus klimato komforto blokas taikomas tik šildomiems pastatams; šiam objektui šis vertinimas neskaičiuojamas.",
      "required_inputs": [],
      "data": {
        "winter": {
          "level": "GOOD",
          "label_key": "block1.winter.not_applicable.label",
          "description_key": "block1.winter.not_applicable.description",
          "not_assessed_reason": null,
          "provenance_label_key": null,
          "segment": "B",
          "description_lt": "Aukšta pastato energinė klasė (A ar aukštesnė) rodo mažus šilumos poreikius: 20–22 °C palaikoma nesunkiai, o šildymo poreikis — vienas mažiausių tarp esamų pastatų (tikslesnę šildymo kainą rasite 2 bloke).",
          "comparison_lines_lt": []
        },
        "summer": {
          "level": "LOW",
          "label_key": "block1.summer.not_applicable.label",
          "description_key": "block1.summer.not_applicable.description",
          "segment": "B",
          "description_lt": "Net ir per karštas dienas patalpos linkusios išlikti pakankamai vėsios; dažniausiai pakanka natūralaus vėdinimo ir paprastų saulės kontrolės priemonių (užuolaidos, žaliuzės). Papildomo vėsinimo (pavyzdžiui, kondicionavimo) poreikis tikėtinas retai, todėl papildomos elektros sąnaudos dėl vėsinimo turėtų būti nedidelės."
        },
        "overrides": {
          "pattern": "no_metric_possible",
          "hero_kind": "none",
          "hero_metric_kind": "delivered_heat",
          "used_official_epc": false,
          "used_user_epc": false,
          "used_user_kwh": false,
          "low_confidence_epc": false,
          "no_official_epc_reason": "none",
          "upload_not_used_reason": "none",
          "message_key": "block1.block1_energy.story.no_metric_possible",
          "story_key": "block1.block1_energy.story.no_metric_possible"
        },
        "drivers": {
          "good_epc": false,
          "new_or_renovated": false,
          "risky_glazing": false
        },
        "technical": {
          "usage_group_id": "unknown",
          "epc_class": "",
          "hero_heat_kwhm2_year": 0,
          "baseline_heat_kwhm2_year": 0,
          "relative_vs_class_peers": 0,
          "relative_vs_newbuild": null,
          "relative_vs_renovated": null,
          "diff_vs_newbuild_kwhm2_year": null,
          "diff_vs_renovated_kwhm2_year": null,
          "etalon_class": null,
          "a_band_anchor_kwhm2_year": null
        },
        "info_box": [
          "Šiame bloke atskirai nemodeliuojame realių vidaus drėgmės ir skersvėjų, nes jie stipriai priklauso nuo gyventojų įpročių ir konkrečios buto būklės (langų, durų, sandūrų ir pan.)."
        ],
        "bundle_note_key": "block1.bundle.note.default",
        "snapshot": {
          "order_id": "ord-dev-land",
          "bundle_id": "bdl-dev-land",
          "bundle_primary_object_type": null,
          "evaluation_target": "land_only",
          "lat": null,
          "lng": null,
          "address_text": "Vilnius, Žemaitės g. 10 (sklypas)",
          "municipality": "Vilniaus m. sav.",
          "address_source": "user",
          "purpose": null,
          "premises_type": null,
          "rc_paskirtis_code": null,
          "rc_paskirtis_level": null,
          "usage_group": null,
          "heated_flag": false,
          "building_year_built": null,
          "renovation_year": null,
          "total_area_m2": null,
          "heated_area_m2": null,
          "floors": null,
          "heating_system_type": null,
          "glazing_share_percent": null,
          "glazing_band": null,
          "glazing_source": null,
          "registry_energy_class": null,
          "registry_epc_kwhm2_year": null,
          "registry_epc_kwhm2_year_source": null,
          "official_lookup_status": "not_requested",
          "no_official_epc_reason": "none",
          "upload_not_used_reason": "none",
          "user_energy_class": null,
          "user_epc_kwhm2_year": null,
          "bill_unit": null,
          "bill_value": null,
          "bill_period": null,
          "bill_month": null,
          "bill_scope": null,
          "bill_source_tag": null,
          "effective_energy_class": null,
          "effective_epc_kwhm2_year": null,
          "epc_source_class": null,
          "epc_confidence_level": null,
          "epc_sources": [],
          "energy_class_overridden": false,
          "epc_kwhm2_year_overridden": false,
          "ventilation_type": null,
          "project_website_url": null,
          "project_website_url_auto": null,
          "has_project_docs": null,
          "doc_energy_class": null,
          "doc_epc_kwhm2_year": null,
          "doc_epc_issue_year": null,
          "doc_heating_description": null,
          "doc_ventilation_description": null,
          "doc_glazing_hint": null,
          "doc_source_label": null,
          "doc_website_url_hint": null,
          "url_user_energy_class": null,
          "url_user_epc_kwhm2_year": null,
          "url_user_heating_description": null,
          "url_user_ventilation_description": null,
          "url_user_glazing_hint": null,
          "url_auto_energy_class": null,
          "url_auto_epc_kwhm2_year": null,
          "url_auto_heating_description": null,
          "url_auto_ventilation_description": null,
          "url_auto_glazing_hint": null,
          "project_hint_name": null,
          "project_hint_developer": null,
          "project_url_auto_confidence": null,
          "project_url_auto_reason": null,
          "epc_resolution": null,
          "epc_plausibility": null,
          "epc_plausibility_note_lt": null,
          "prior_building_energy_class": null,
          "prior_building_kwhm2": null,
          "source_system": null,
          "resolver_context": null,
          "pens_cert_number": null,
          "pens_cert_issued_date": null,
          "registry_energy_class_superseded": null,
          "secondary_certificate": null,
          "register_record": null,
          "unikalus_nr": "5500-0000-0001",
          "unikalus_nr_source": null,
          "heated_area_m2_source": null,
          "byproduct_coverage_fraction": null,
          "customer_type_override": null
        },
        "secondary_certificate": null,
        "winter_factors": [
          {
            "key": "new_or_renovated",
            "label_lt": "Naujesnės statybos pastatas",
            "explanation_lt": "Naujesnės statybos pastatai paprastai geriau apšiltinti ir sandaresni, todėl žiemą šiluma išlaikoma efektyviau ir jaučiama mažiau šaltų vietų ties sienomis ar kampuose.",
            "active": false,
            "direction": "decrease"
          },
          {
            "key": "risky_glazing",
            "label_lt": "Didelė langų dalis",
            "explanation_lt": "Langai šilumą praleidžia lengviau nei sienos, todėl kai jų plotas didelis, žiemą pro juos prarandama daugiau šilumos — ties langais gali būti vėsiau, o šildymo poreikis šiek tiek didesnis.",
            "active": false,
            "direction": "increase"
          }
        ],
        "summer_drivers": [
          {
            "key": "high_energy_class_driver",
            "label_lt": "Aukšta energinė klasė",
            "explanation_lt": "Aukštesnės energinės klasės pastatai paprastai sandaresni ir geriau apšiltinti — žiemą tai taupo šilumą, bet vasarą pro langus ir iš vidaus patekusi šiluma patalpose išlieka ilgiau, todėl be tinkamo šešėliavimo ir vėdinimo perkaitimo rizika būna šiek tiek didesnė.",
            "active": false,
            "direction": "increase"
          },
          {
            "key": "newer_building_driver",
            "label_lt": "Naujesnės statybos pastatas",
            "explanation_lt": "Naujesni pastatai paprastai sandaresni ir geriau apšiltinti, todėl be tinkamo šešėliavimo ir vėdinimo vasarą sukaupta šiluma patalpose išlieka ilgiau ir perkaitimo rizika būna šiek tiek didesnė.",
            "active": false,
            "direction": "increase"
          },
          {
            "key": "high_glazing_driver",
            "label_lt": "Didelė langų dalis",
            "explanation_lt": "Kai langų plotas didelis, saulėtomis dienomis pro stiklą patenka daug šilumos, todėl patalpos vasarą greičiau ir labiau įšyla.",
            "active": false,
            "direction": "increase"
          }
        ]
      }
    },
    {
      "id": "energy_costs",
      "label_lt": "2) Energijos sąnaudos",
      "status": "ready",
      "summary_lt": null,
      "required_inputs": [],
      "data": {
        "status": "not_applicable",
        "message_lt": "Energijos sąnaudų vertinimas taikomas tik šildomiems pastatams. Šiam sklypui energijos sąnaudos nevertinamos.",
        "energy_month_eur": null,
        "energy_year_eur": null,
        "breakdown": [],
        "components": [],
        "monthly_variation": [],
        "forecast_5yr": [],
        "confidence": null,
        "confidence_cause": null,
        "tariff_is_stale": false,
        "stale_operator": null,
        "stale_until": null,
        "carrier_source": null,
        "household_modelling": null,
        "bill_override_active": null,
        "bill_dhw_measured": null,
        "modelled_dhw_eur_year": null,
        "bill_unit_eur": null,
        "bill_heating_thermal_kwh_year": null,
        "solar_thermal_present": null,
        "split_is_modelled": null,
        "per_m2_mode": null,
        "citations_lt": []
      }
    },
    {
      "id": "recommendations",
      "label_lt": "8) Rekomendacijos ir sprendimai",
      "status": "ready",
      "summary_lt": null,
      "required_inputs": [],
      "data": {
        "id": "recommendations",
        "title_lt": "8) Rekomendacijos ir sprendimai",
        "status": "not_applicable",
        "data": {
          "pattern": "land_only",
          "pattern_title_lt": "",
          "scope_prefix": "",
          "intro_lt": "Rekomendacijos dėl šilumos komforto taikomos tik šildomiems pastatams. Šiam sklypui šilumos komforto vertinimas netaikomas.",
          "viewing_questions_lt": [],
          "negotiation_angles_lt": [],
          "forward_note_lt": "",
          "caveat_lt": null,
          "scope_disclaimer_lt": "",
          "source_keys": []
        }
      }
    }
  ],
  "permits": [],
  "citations": [
    "VĮ REGISTRŲ CENTRAS. Nekilnojamojo turto registras: objekto duomenys [interaktyvus]. Vilnius: VĮ Registrų centras [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.registrucentras.lt",
    "NT DUOMENYS. Pastatų energijos etalonų bazė v2026.1: pastatų faktinio šilumos poreikio medianos pagal pastato tipą ir energinę klasę, apskaičiuotos iš VĮ Registrų centro Pastatų energinio naudingumo sertifikatų registro (PENS); efektyvių pastatų (A++/A+/A klasių) sujungta mediana — atskiras atskaitos taškas. Renovuoto pastato etalonas prilygintas C energinei klasei — NT Duomenų metodinis sprendimas (vidinė etalonų metodika, 3.2 sk.). Vilnius: NT Duomenys, 2026.",
    "LIETUVOS RESPUBLIKOS SVEIKATOS APSAUGOS MINISTRAS. Lietuvos higienos norma HN 42:2009 „Gyvenamųjų ir visuomeninių pastatų patalpų mikroklimatas“ [interaktyvus]. Patvirtinta 2009 m. gruodžio 29 d. įsakymu Nr. V-1081. Vilnius: Sveikatos apsaugos ministerija, 2009 [žiūrėta 2026-08-06]. Prieiga per internetą: https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.362676",
    "VĮ REGISTRŲ CENTRAS. Nekilnojamojo turto ir registro išrašų, pažymų ir duomenų įkainiai: dokumentų kopijų parengimas, tvirtinimas ir pateikimas [interaktyvus]. Vilnius: VĮ Registrų centras [žiūrėta 2026-08-06]. Prieiga per internetą: https://www.registrucentras.lt/p/nt-israsu-pazymu-duomenu-ikainiai"
  ],
  "address": "Vilnius, Žemaitės g. 10 (sklypas)",
  "ntr_unique_number": "5500-0000-0001",
  "municipality": "Vilniaus m. sav.",
  "lat": null,
  "lng": null,
  "bundle_items": [],
  "generated_at": "2026-08-06T12:24:35.073234+00:00",
  "order_reference": "NTD-DEV-LAND",
  "block2": {
    "status": "not_applicable",
    "message_lt": "Energijos sąnaudų vertinimas taikomas tik šildomiems pastatams. Šiam sklypui energijos sąnaudos nevertinamos.",
    "confidence": null,
    "confidence_text_lt": null,
    "citations_lt": []
  },
  "citations_title_lt": "Šaltiniai",
  "documents_lt": {
    "regia": "Žemės sklypų ribos, pastatų kontūrai ir adresai interaktyviame žemėlapyje.",
    "infostatyba": "Statybos leidimai, projektiniai pasiūlymai ir statybos dokumentacija šiuo adresu.",
    "tpdr": "Detalieji ir bendrieji planai, specialieji planai, žemėtvarkos projektai.",
    "registru_centras": "Išsamūs registro duomenys: savininkai, suvaržymai, sandorių istorija ir kita teisinė informacija."
  },
  "property_profile": {
    "purpose": null,
    "paskirtis_label_lt": null,
    "paskirtis_row_label_lt": null,
    "premises_type": null,
    "usage_group_label": null,
    "year_built": null,
    "floors": null,
    "total_area_m2": null,
    "heated_area_m2": null,
    "heated_area_m2_source_lt": null,
    "heated_area_m2_source": null,
    "heated_area_m2_is_genuine": false,
    "wall_material": null,
    "heating_type": null,
    "ventilation_type": null,
    "energy_class": null,
    "energy_class_provenance": null,
    "energy_class_provenance_lt": null,
    "epc_kwhm2_year": null,
    "hero_source_caption_lt": null,
    "epc_source": null,
    "epc_confidence": null,
    "glazing_percent": null,
    "glazing_source": null,
    "cadastral_ref": "5500-0000-0001",
    "evaluation_target": "Žemės sklypas"
  },
  "block1": {
    "applicable": false,
    "neutral_message_lt": "Vidaus klimato komforto blokas taikomas tik šildomiems pastatams; šiam objektui šis vertinimas neskaičiuojamas.",
    "winter": null,
    "summer": null,
    "summary_lt": "Vidaus klimato komforto blokas taikomas tik šildomiems pastatams; šiam objektui šis vertinimas neskaičiuojamas.",
    "drivers": [
      {
        "key": "high_energy_class_driver",
        "label_lt": "Aukšta energinė klasė",
        "explanation_lt": "Aukštesnės energinės klasės pastatai paprastai sandaresni ir geriau apšiltinti — žiemą tai taupo šilumą, bet vasarą pro langus ir iš vidaus patekusi šiluma patalpose išlieka ilgiau, todėl be tinkamo šešėliavimo ir vėdinimo perkaitimo rizika būna šiek tiek didesnė.",
        "active": false,
        "direction": "increase"
      },
      {
        "key": "newer_building_driver",
        "label_lt": "Naujesnės statybos pastatas",
        "explanation_lt": "Naujesni pastatai paprastai sandaresni ir geriau apšiltinti, todėl be tinkamo šešėliavimo ir vėdinimo vasarą sukaupta šiluma patalpose išlieka ilgiau ir perkaitimo rizika būna šiek tiek didesnė.",
        "active": false,
        "direction": "increase"
      },
      {
        "key": "high_glazing_driver",
        "label_lt": "Didelė langų dalis",
        "explanation_lt": "Kai langų plotas didelis, saulėtomis dienomis pro stiklą patenka daug šilumos, todėl patalpos vasarą greičiau ir labiau įšyla.",
        "active": false,
        "direction": "increase"
      }
    ],
    "winter_factors": [],
    "winter_factors_title_lt": "Žiemos komforto veiksniai",
    "info_box": {
      "items_lt": [
        "Šiame bloke atskirai nemodeliuojame realių vidaus drėgmės ir skersvėjų, nes jie stipriai priklauso nuo gyventojų įpročių ir konkrečios buto būklės (langų, durų, sandūrų ir pan.)."
      ]
    },
    "upload_not_used_message_lt": null,
    "secondary_certificate": null,
    "inputs_snapshot": {
      "effective_energy_class": null,
      "effective_epc_kwhm2_year": null,
      "effective_year_built": null,
      "glazing_share_percent": null,
      "ventilation_type": null,
      "epc_source_class": "none",
      "epc_confidence_level": "NONE",
      "evaluation_target": "land_only",
      "epc_plausibility": null,
      "epc_plausibility_note_lt": null
    }
  },
  "block8": {
    "id": "recommendations",
    "title_lt": "8) Rekomendacijos ir sprendimai",
    "status": "not_applicable",
    "data": {
      "pattern": "land_only",
      "pattern_title_lt": "",
      "scope_prefix": "",
      "intro_lt": "Rekomendacijos dėl šilumos komforto taikomos tik šildomiems pastatams. Šiam sklypui šilumos komforto vertinimas netaikomas.",
      "viewing_questions_lt": [],
      "negotiation_angles_lt": [],
      "forward_note_lt": "",
      "caveat_lt": null,
      "scope_disclaimer_lt": "",
      "source_keys": []
    }
  }
};

// B2-13: carrier-inference variant — same report, Block 2 shows the fallback
// warning (heating type inferred, not from the EPC).
export const MOCK_FALLBACK: ReportData = {
  ...MOCK_EXISTING,
  block2: mockBlock2(MOCK_CARRIER_FALLBACK_WARNING),
};

export const DEV_MOCKS: Record<string, ReportData> = {
  'dev-existing': MOCK_EXISTING,
  'dev-land': MOCK_LAND_ONLY,
  'dev-fallback': MOCK_FALLBACK,
};

// Mock permits for dev mode (P7-A8)
export const DEV_MOCK_PERMITS: Record<string, any[]> = {
  'dev-existing': [
    {
      project_name: 'Daugiabučio namo renovacija',
      construction_type: 'Statinio kapitalinis remontas',
      building_name: 'Daugiabutis gyvenamasis namas',
      document_type: 'Statybą leidžiantis dokumentas',
      document_status: 'Galiojantis',
      document_date: '2021-06-15',
      ntr_number: '4400-1234-5678',
      address: 'Vilnius, Žirmūnų g. 12',
      purpose: 'Gyvenamoji (daugiabučiai pastatai)',
    },
  ],
  'dev-land': [],
};
