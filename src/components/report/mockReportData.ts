// P7-A1: Report data types + dev mock data
// Lithuanian copy sourced from Script Brief §2.4.2, Thermal Comfort annex, Decision Log D6–D15

export interface Block8Content {
  pattern: string;
  scope_prefix: string;
  intro_lt: string;
  viewing_questions_lt: string[];
  negotiation_angles_lt: string[];
  forward_note_lt: string;
  caveat_lt?: string | null;
  scope_disclaimer_lt: string;
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
  explanation_lt: string;
  whats_not_included_lt: string;
  // R5 (report-walk 2026-07-18): the option's own first-sentence body,
  // quoting the PERSONALISED totals (optional — legacy captures lack it).
  body_lt?: string;
}

export interface Block2HouseholdModelling {
  selector_caption_lt: string;
  disclosure_box_lt: string;
  citation_lt: { category_lt: string; lines_lt: string[] };
  options: Block2HouseholdOption[];
}

export interface Block2Data {
  status: 'ready' | 'not_applicable';
  message_lt: string | null;
  metric?: { eur_month: number; eur_month_raw: number; subtext_lt: string };
  intro_lt?: string;
  breakdown?: {
    column_headers_lt: string[];
    rows: Block2BreakdownRow[];
    total: { label_lt: string; eur_year: number; eur_month: number };
    dhw_footnote_lt: string | null;
  };
  // family_note_lt: §7.5 conditional paragraph (OFF variant served by default
  // for residential reports with a selector; the ON variant lives per option).
  explanation?: { heading_lt: string; body_lt: string; family_note_lt?: string };
  info_box?: {
    heading_lt: string;
    vat_lt: string;
    escalation_lt: string;
    disclosure_lt: string;
    // B2-16 (R9): the €→kWh conversion staleness note (€-bills mode only).
    bill_note_lt?: string | null;
    // B2-17: the solar-thermal note (flag-gated, served).
    solar_note_lt?: string | null;
    // R8: price-side stale note (served when an expired record priced)
    stale_note_lt?: string | null;
    whats_not_included_lt?: string;
  };
  confidence?: string;
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
  forecast_5yr?: {
    year: number;
    total_eur_month: number;
    per_carrier: Record<string, number>;
    fixed_eur_year: number;
  }[];
  // B2-14: present only for residential+ready reports whose tariff and
  // occupancy resolve; absent → render the static table, no selector.
  standard_occupancy?: number;
  household_modelling?: Block2HouseholdModelling;
}

export interface ReportData {
  address: string;
  ntr_unique_number: string | null;
  municipality: string;
  lat: number;
  lng: number;
  bundle_items: { kind: string; address?: string }[];
  generated_at: string;
  order_reference: string;
  // Served-but-not-yet-consumed wire sections (kept verbatim by the mock
  // regeneration recipe so the capture needs no hand filtering).
  envelope?: Record<string, unknown>;
  blocks?: unknown[];
  citations?: unknown[];
  permits?: unknown[];
  block2?: Block2Data;
  block8?: Block8Data;
  block1: {
    applicable: boolean;
    neutral_message_lt?: string;
    winter: {
      // 'NOT_ASSESSED' ⇒ no real/estimated heating value — show "Neįvertinta"
      // + the reason, never an A–E band (the backend keeps it off the ordinal
      // axis; the web must not fall back to 'C'/medium).
      level: 'GOOD' | 'INTERMEDIATE' | 'WEAK' | 'NOT_ASSESSED';
      not_assessed_reason?: string | null;
      // Phase 2: when the band is an era→class ESTIMATE (no certificate), the
      // backend sets this so the UI shows an honest "estimate + basis" caption.
      provenance_label_key?: string | null;
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
    info_box: {
      items_lt: string[];
    };
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
    epc_source: string | null;
    epc_confidence: string | null;
    glazing_percent: number | null;
    glazing_source: string | null;
    cadastral_ref: string | null;
    evaluation_target: string;
  };
}

// --- Winter rows (exact copy from Thermal Comfort annex) ---

const WINTER_ROWS = [
  {
    band: 'GOOD',
    label_lt: 'Gerai',
    description_lt:
      'Įprastomis žiemos sąlygomis apie 20–22 °C gyvenamosiose patalpose pasiekiama be didesnių pastangų, šaltesnių kampų turėtų būti nedaug. Šildymo poreikis turėtų būti nuosaikus ir atitikti tikėtiną tokio tipo būstui (tikslesnę šildymo kainą rasite 2 bloke).',
    range_lt: undefined,
  },
  {
    band: 'INTERMEDIATE',
    label_lt: 'Vidutiniškai',
    description_lt:
      '20–22 °C pasiekti įmanoma, bet kai kurios patalpos (pavyzdžiui, kampiniai kambariai ar zonos prie didelių langų) gali dažniau jaustis vėsesnės. Vertinant pagal techninius parametrus, norint išlaikyti komforto temperatūrą, šildymo sąnaudos gali būti maždaug 10–30 % didesnės, palyginti su techniškai efektyviu būstu tokiomis pačiomis sąlygomis (tikslesnę šildymo kainą rasite 2 bloke).',
    range_lt: '~10–30 %',
  },
  {
    band: 'WEAK',
    label_lt: 'Silpnai',
    description_lt:
      'Norint palaikyti apie 20–22 °C visame būste, reikės gana intensyvaus šildymo, o dalis patalpų vis tiek gali išlikti vėsesnės arba su šaltesnėmis sienomis ir grindimis. Vertinant pagal techninius parametrus, norint išlaikyti komforto temperatūrą, šildymo sąnaudos gali būti maždaug 30–60 % ar daugiau didesnės, palyginti su tuo pačiu efektyviu etaloniniu būstu (konkretesnį įvertinimą rasite 2 bloke).',
    range_lt: '~30–60 %+',
  },
];

const SUMMER_ROWS = [
  {
    band: 'LOW',
    label_lt: 'Maža',
    description_lt:
      'Net ir per karštas dienas patalpos linkusios išlikti pakankamai vėsios; dažniausiai pakanka natūralaus vėdinimo ir paprastų saulės kontrolės priemonių (užuolaidos, žaliuzės). Papildomo vėsinimo (pavyzdžiui, kondicionavimo) poreikis tikėtinas retai, todėl papildomos elektros sąnaudos dėl vėsinimo turėtų būti nedidelės.',
  },
  {
    band: 'MODERATE',
    label_lt: 'Vidutinė',
    description_lt:
      'Per karščio bangas kai kuriose patalpose gali tapti per šilta, ypač ten, kur yra dideli langai ar viršutiniai aukštai — reikės dažnai vėdinti ir riboti tiesioginę saulę. Gali prireikti ventiliatorių ar nešiojamo kondicionieriaus per karščiausias dienas, tad dalį metų papildomai didės elektros sąnaudos dėl vėsinimo.',
  },
  {
    band: 'HIGH',
    label_lt: 'Didelė',
    description_lt:
      'Karštomis vasaros dienomis patalpos linkusios perkaisti; be aktyvių vėsinimo priemonių (kondicionavimo, intensyvaus naktinio vėdinimo ir pan.) gali būti nuolat per karšta. Dažnas kondicionavimo poreikis reiškia didesnį papildomą elektros suvartojimą ir atitinkamai didesnes sąskaitas už vėsinimą (konkretesnę įtaką bendroms išlaidoms bus galima matyti ilgalaikėse sąnaudose).',
  },
];

function winterRows(level: 'GOOD' | 'INTERMEDIATE' | 'WEAK') {
  return WINTER_ROWS.map((r) => ({ ...r, highlighted: r.band === level }));
}

function summerRows(level: 'LOW' | 'MODERATE' | 'HIGH') {
  return SUMMER_ROWS.map((r) => ({ ...r, highlighted: r.band === level }));
}

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
    "request_id": "report-20260723091250",
    "created_at": "2026-07-23T09:12:50.536123+00:00"
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
          "description_lt": "Žema pastato energinė klasė (D ar žemesnė) rodo didelius šilumos poreikius: norint palaikyti 20–22 °C visame būste reikės intensyvaus šildymo, dalis patalpų gali likti vėsesnės, o šildymo poreikis gerokai viršija net renovuoto pastato lygį — žr. palyginimą žemiau (tikslesnę šildymo kainą rasite 2 bloke).",
          "comparison_lines_lt": [
            "Palyginti su naujos statybos etalonu (A++): apie 11 kartų didesnis šildymo poreikis.",
            "Palyginti su renovuoto pastato etalonu (C klasė): ~+97% didesnis."
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
          "story_key": "block1.block1_energy.story.neutral"
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
          "diff_vs_renovated_kwhm2_year": 71.37
        },
        "info_box": [
          "Vertinimas remiasi Pastatų energinio naudingumo sertifikatų duomenimis ir standartinėmis prielaidomis panašiems būstams.",
          "Šiame bloke atskirai nemodeliuojame realių vidaus drėgmės ir skersvėjų, nes jie stipriai priklauso nuo gyventojų įpročių ir konkrečios buto būklės (langų, durų, sandūrų ir pan.).",
          "Ventiliacijos sistema: natūrali"
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
                  "hero_official"
                ]
              }
            ],
            "no_official_epc_reason": "none",
            "upload_not_used_reason": "none",
            "message_key": "block1.epc.official_metric",
            "story_key": "block1.block1_energy.story.neutral"
          },
          "epc_plausibility": null,
          "epc_plausibility_note_lt": null,
          "prior_building_energy_class": null,
          "prior_building_kwhm2": null,
          "source_system": null,
          "resolver_context": null,
          "pens_cert_number": null,
          "pens_cert_issued_date": null,
          "unikalus_nr": "4400-1234-5678",
          "unikalus_nr_source": null,
          "heated_area_m2_source": "tier_2_pens_israsas",
          "byproduct_coverage_fraction": null,
          "customer_type_override": null
        },
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
        "energy_month_eur": 81.34,
        "energy_year_eur": 976.03,
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
          },
          {
            "component_kind": "eso_standing",
            "label_lt": "Elektros pastovusis mokestis",
            "carrier": null,
            "eur_year": 36,
            "eur_month": 3,
            "source_lt": "📊 pagal pastato duomenis"
          }
        ],
        "monthly_variation": [
          {
            "month": 1,
            "heating_eur": 122.06,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 2,
            "heating_eur": 102.17,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 3,
            "heating_eur": 92.54,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 4,
            "heating_eur": 55.74,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 5,
            "heating_eur": 35.9,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 6,
            "heating_eur": 13.06,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 7,
            "heating_eur": 8.32,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 8,
            "heating_eur": 11.94,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 9,
            "heating_eur": 31.33,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 10,
            "heating_eur": 61.8,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 11,
            "heating_eur": 85.8,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          },
          {
            "month": 12,
            "heating_eur": 108.24,
            "dhw_eur": 17.59,
            "cooling_eur": 0,
            "fixed_eur": 3,
            "household_electricity_eur": 0
          }
        ],
        "forecast_5yr": [
          {
            "year": 2026,
            "total_eur_month": 81.34,
            "per_carrier": {
              "cst": 940.03
            },
            "fixed_eur_year": 36
          },
          {
            "year": 2027,
            "total_eur_month": 86.26,
            "per_carrier": {
              "cst": 997.28
            },
            "fixed_eur_year": 37.83
          },
          {
            "year": 2028,
            "total_eur_month": 91.48,
            "per_carrier": {
              "cst": 1058.01
            },
            "fixed_eur_year": 39.75
          },
          {
            "year": 2029,
            "total_eur_month": 97.02,
            "per_carrier": {
              "cst": 1122.45
            },
            "fixed_eur_year": 41.77
          },
          {
            "year": 2030,
            "total_eur_month": 102.89,
            "per_carrier": {
              "cst": 1190.8
            },
            "fixed_eur_year": 43.89
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
        "citations_lt": [
          {
            "category": "📊 Pastato energijos duomenys",
            "label_lt": "Energinio naudingumo sertifikatas — Registrų centro energinio naudingumo sertifikatų registras (registrucentras.lt)",
            "source_reference": "registrucentras.lt",
            "dynamic_fields": {}
          },
          {
            "category": "📊 Pastato energijos duomenys",
            "label_lt": "Šildymo sistemos tipas: Registrų centro energinio naudingumo sertifikatų registro duomenys",
            "source_reference": "block2 carrier resolution (§8 cascade)",
            "dynamic_fields": {}
          },
          {
            "category": "💰 Energijos tarifai",
            "label_lt": "Centrinis šildymas: {supplier_name}, VERT patvirtintas tarifas, galioja nuo {effective_from} (šaltinis: vert.lt)",
            "source_reference": "energy_tariffs.yaml",
            "dynamic_fields": {
              "supplier_name": "AB „Miesto gijos“",
              "effective_from": "2026 m. gegužės"
            }
          },
          {
            "category": "💰 Energijos tarifai",
            "label_lt": "Visos kainos su PVM (21%)",
            "source_reference": "VAT 21%",
            "dynamic_fields": {}
          },
          {
            "category": "📈 Prognozės pagrindas",
            "label_lt": "Tarifų augimo prognozė (per energijos rūšį): {source}",
            "source_reference": "energy_tariffs.yaml escalation_rates",
            "dynamic_fields": {
              "source": "HICP CP0455 (Heat energy), GEO=LT, 2016–2025 trailing average of December YoY change"
            }
          },
          {
            "category": "📈 Prognozės pagrindas",
            "label_lt": "Minimalus augimo tempas: Lietuvos infliacija (Eurostat HICP, 10 metų vidurkis: {hicp_rate}%/m.)",
            "source_reference": "Eurostat HICP CP00",
            "dynamic_fields": {
              "hicp_rate": "4.76"
            }
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
          "pattern": "D",
          "scope_prefix": "Šilumos komforto požiūriu",
          "intro_lt": "Šilumos komforto požiūriu, šis pastatas kelia iššūkių abiem sezonais — žiemą šildymo sąnaudos gali būti didelės, o vasarą patalpos linkusios perkaisti. Tai stipriausias signalas būti atidiems. Šio pastato šildymo poreikis yra apie 35 % mažesnis nei vidutinio tos pačios energinės klasės pastato Lietuvoje. Pastato energijos kaina (be buitinės elektros) — apie €81 per mėnesį.",
          "viewing_questions_lt": [
            "Paprašykite faktinių šildymo sąskaitų už paskutinius 2–3 žiemos sezonus.",
            "Apžiūrėkite izoliaciją: stogo / pastogės apšiltinimą, sienų būklę, langų sandarumą.",
            "Jei įmanoma, aplankykite objektą šiltą popietę — pajuskite temperatūrą pietinėse ir vakarinėse patalpose.",
            "Patikrinkite ventiliaciją ir esamas saulės apsaugos priemones (žaliuzės, markizės).",
            "Ar pastatas buvo renovuotas? Jei taip — paprašykite renovacijos dokumentų. Jei ne — verta paklausti, ar planuojama renovacija (tai gali būti argumentas kainai derėtis)."
          ],
          "negotiation_angles_lt": [
            "Šilumos komforto požiūriu, šis pastatas kelia iššūkių abiem sezonais. Tai turėtų atsispindėti kainoje — arba tiesiogiai (mažesnė pardavimo kaina), arba per pardavėjo įsipareigojimą finansuoti dalį renovacijos.",
            "Pastato energijos kaina (be buitinės elektros) — apie €81 per mėnesį; iš jos šildymui tenka apie €61 per mėnesį. Pagal mūsų vertinimą, šildymo sąnaudos gali būti apie 6,5 karto didesnės nei efektyviame analogiškame pastate — tai apie €620 per metus. Per 5 metus, įvertinus prognozuojamą energijos kainų augimą (pagal 10 metų kainų tendencijas), skirtumas sudarytų apie €3480. Nerenovavus pastato, vien šildymas kainuotų apie €360 per metus daugiau nei renovuotame (C klasės) pastate.",
            "Pastatas statytas iki 1993 m. — šio laikotarpio pastatai dažnai turi silpnesnę izoliaciją ir pasenusias inžinerines sistemas. Tai sustiprina argumentą dėl kainos korekcijos."
          ],
          "forward_note_lt": "Tikslias šildymo sąnaudas eurais rasite 2 bloke (Energijos sąnaudos). Šilumos komforto požiūriu, ši informacija yra ypač svarbi priimant sprendimą.",
          "caveat_lt": null,
          "scope_disclaimer_lt": "Šios rekomendacijos apima tik šilumos komforto aspektą."
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
    "VĮ REGISTRŲ CENTRAS. Nekilnojamojo turto registras: objekto duomenys [interaktyvus]. Vilnius: VĮ Registrų centras. Prieiga per internetą: https://www.registrucentras.lt",
    "VĮ REGISTRŲ CENTRAS. Pastatų energinio naudingumo sertifikatų registras (PENS): energinio naudingumo sertifikatas [interaktyvus]. Vilnius: VĮ Registrų centras. Prieiga per internetą: https://www.registrucentras.lt",
    "Lietuvos Respublikos aplinkos ministerija. Statybos techninis reglamentas STR 2.01.02:2016 „Pastatų energinio naudingumo projektavimas ir sertifikavimas“. Vilnius, 2016.",
    "NT DUOMENYS. Vidaus klimato etalono bazė v2026.1: lyginamieji parametrai pagal pastato tipą ir statybos laikotarpį. Vilnius: NT Duomenys, 2026."
  ],
  "address": "Vilnius, Žirmūnų g. 12-5",
  "ntr_unique_number": "4400-1234-5678",
  "municipality": "Vilniaus m. sav.",
  "lat": 54.7007624,
  "lng": 25.2993035,
  "bundle_items": [],
  "generated_at": "2026-07-23T09:12:50.536123+00:00",
  "order_reference": "NTD-DEV-001",
  "block2": {
    "status": "ready",
    "message_lt": null,
    "metric": {
      "eur_month": 81,
      "eur_month_raw": 81.34,
      "subtext_lt": "Vidutinė mėnesinė energijos kaina pagal dabartinius tarifus (su PVM)"
    },
    "intro_lt": "Šiame bloke pateikiame, kiek šiame būste tikėtina mokėti už energiją kiekvieną mėnesį — šildymą, karštą vandenį, vėsinimą ir ventiliaciją, bei pastovius mokesčius — pagal dabartinius tarifus ir pastato energinius parametrus. Taip pat galite sužinoti preliminarų elektros suvartojimą buities reikmėms, pasirinkę savo namų ūkio dydį.",
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
          "eur_year": 729,
          "eur_month": 61,
          "source_indicator": "📊 pagal pastato duomenis"
        },
        {
          "label_lt": "Karštas vanduo",
          "eur_year": 211,
          "eur_month": 17,
          "source_indicator": "📊 pagal pastato duomenis"
        },
        {
          "label_lt": "Elektros pastovusis mokestis",
          "eur_year": 36,
          "eur_month": 3,
          "source_indicator": "📊 pagal pastato duomenis"
        }
      ],
      "total": {
        "label_lt": "Viso",
        "eur_year": 976,
        "eur_month": 81
      },
      "dhw_footnote_lt": "Karšto vandens sąnaudos rodomos atskirai nuo šildymo, nes jos labiau priklauso nuo gyventojų skaičiaus ir suvartojimo įpročių."
    },
    "explanation": {
      "heading_lt": "Ką tai reiškia praktiškai?",
      "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos sudarys apie €81 per mėnesį arba €976 per metus. Per 5 metus, jei tarifai kils pagal dabartines prognozes, mėnesinė kaina gali pasiekti apie €103.",
      "family_note_lt": "Svarbu atsiminti, kad ši suma neapima buitinės elektros (apšvietimas, prietaisai, viryklė). Pasirinkite namų ūkio dydį žemiau, kad pamatytumėte bendrą mėnesinę energijos kainą."
    },
    "info_box": {
      "heading_lt": "Iš ko remiamės šiuo vertinimu?",
      "vat_lt": "Visos kainos nurodytos su PVM (21%)",
      "escalation_lt": "Prognozė remiasi VERT reguliuojamų tarifų vidurkiu arba 4%/m. numatytu augimu",
      "disclosure_lt": "Šildymo sistemos tipas (centrinis šildymas) nustatytas pagal pastato energinio naudingumo sertifikatą.",
      "bill_note_lt": null,
      "stale_note_lt": "Kainos apskaičiuotos pagal paskutinį žinomą AB „Miesto gijos“ tarifą (galiojo iki 2026-05-31). VERT patvirtinus naujus tarifus, sumos gali keistis.",
      "solar_note_lt": null,
      "whats_not_included_lt": "Šis vertinimas neapima buitinės elektros (apšvietimas, prietaisai, viryklė) ir nėra pritaikytas konkrečiam gyventojų skaičiui. Pasirinkite namų ūkio dydį, kad vertinimas būtų išsamesnis."
    },
    "confidence": "medium",
    "confidence_text_lt": "šildymo sistema ir energinė klasė žinomos, tačiau galiojančio tarifo įrašo šiuo metu nėra — skaičiuojama pagal paskutinį žinomą tarifą",
    "carrier_warning_lt": null,
    "carrier_label_lt": "centrinis šildymas",
    "newbuild_note_lt": null,
    "citations_lt": [
      "Energinio naudingumo sertifikatas — Registrų centro energinio naudingumo sertifikatų registras (registrucentras.lt)",
      "Šildymo sistemos tipas: Registrų centro energinio naudingumo sertifikatų registro duomenys",
      "Centrinis šildymas: AB „Miesto gijos“, VERT patvirtintas tarifas, galioja nuo 2026 m. gegužės (šaltinis: vert.lt)",
      "Visos kainos su PVM (21%)",
      "Tarifų augimo prognozė (per energijos rūšį): HICP CP0455 (Heat energy), GEO=LT, 2016–2025 trailing average of December YoY change",
      "Minimalus augimo tempas: Lietuvos infliacija (Eurostat HICP, 10 metų vidurkis: 4.76%/m.)"
    ],
    "monthly_variation": [
      {
        "month": 1,
        "heating_eur": 122.06,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 2,
        "heating_eur": 102.17,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 3,
        "heating_eur": 92.54,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 4,
        "heating_eur": 55.74,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 5,
        "heating_eur": 35.9,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 6,
        "heating_eur": 13.06,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 7,
        "heating_eur": 8.32,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 8,
        "heating_eur": 11.94,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 9,
        "heating_eur": 31.33,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 10,
        "heating_eur": 61.8,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 11,
        "heating_eur": 85.8,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      },
      {
        "month": 12,
        "heating_eur": 108.24,
        "dhw_eur": 17.59,
        "cooling_eur": 0,
        "fixed_eur": 3,
        "household_electricity_eur": 0
      }
    ],
    "forecast_5yr": [
      {
        "year": 2026,
        "total_eur_month": 81.34,
        "per_carrier": {
          "cst": 940.03
        },
        "fixed_eur_year": 36
      },
      {
        "year": 2027,
        "total_eur_month": 86.26,
        "per_carrier": {
          "cst": 997.28
        },
        "fixed_eur_year": 37.83
      },
      {
        "year": 2028,
        "total_eur_month": 91.48,
        "per_carrier": {
          "cst": 1058.01
        },
        "fixed_eur_year": 39.75
      },
      {
        "year": 2029,
        "total_eur_month": 97.02,
        "per_carrier": {
          "cst": 1122.45
        },
        "fixed_eur_year": 41.77
      },
      {
        "year": 2030,
        "total_eur_month": 102.89,
        "per_carrier": {
          "cst": 1190.8
        },
        "fixed_eur_year": 43.89
      }
    ],
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
      "disclosure_box_lt": "ℹ️ Duomenų šaltiniai\n\nŠis vertinimas sujungia du duomenų tipus:\n\n📊 Pastato duomenys — šildymo ir karšto vandens sąnaudos apskaičiuotos pagal šio konkretaus pastato energinio naudingumo sertifikatą, šildymo sistemos tipą ir dabartinius energijos tarifus. Šie skaičiai yra specifiniai šiam pastatui.\n\n👥 Namų ūkio modeliavimas — karšto vandens sąnaudos pritaikytos pagal jūsų pasirinktą namų ūkio dydį (tipinis gyventojų skaičius pagal naudingąjį plotą, 2021 m. gyventojų ir būstų surašymas). Buitinės elektros sąnaudos yra statistinis Lietuvos namų ūkių vidurkis pagal Eurostat duomenis. Faktinės sąnaudos gali skirtis priklausomai nuo prietaisų ir įpročių.",
      "citation_lt": {
        "category_lt": "👥 Namų ūkio modeliavimas",
        "lines_lt": [
          "Buitinės elektros vidurkis: Eurostat Lietuvos gyvenamųjų pastatų elektros suvartojimas (nrg_bal_c, 2023 m.), išskaidytas pagal namų ūkio dydį (2021 m. surašymas, Destatis struktūra)",
          "Karšto vandens pritaikymas: tipinis gyventojų skaičius pagal naudingąjį plotą (2021 m. gyventojų ir būstų surašymas, Valstybės duomenų agentūra)"
        ]
      },
      "options": [
        {
          "household_size": 1,
          "size_label_lt": "1 asmuo",
          "metric": {
            "eur_month": 87,
            "subtext_lt": "Pastato energija + buitinė elektra (1 asmens namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 1 asmeniui)",
                "eur_year": 106,
                "eur_month": 9,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Elektros pastovusis mokestis",
                "eur_year": 36,
                "eur_month": 3,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Buitinė elektra (1 asm.)",
                "eur_year": 166,
                "eur_month": 14,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1036,
              "eur_month": 87
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 122.06,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 2,
              "heating_eur": 102.17,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 3,
              "heating_eur": 92.54,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 4,
              "heating_eur": 55.74,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 5,
              "heating_eur": 35.9,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 6,
              "heating_eur": 13.06,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 7,
              "heating_eur": 8.32,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 8,
              "heating_eur": 11.94,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 9,
              "heating_eur": 31.33,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 10,
              "heating_eur": 61.8,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 11,
              "heating_eur": 85.8,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            },
            {
              "month": 12,
              "heating_eur": 108.24,
              "dhw_eur": 8.8,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 14
            }
          ],
          "explanation_lt": "Ši suma apima pastato energiją ir preliminarų buitinės elektros suvartojimą, pritaikytą 1 asmens namų ūkiui. Buitinės elektros dalis yra statistinis vidurkis — faktinės sąnaudos priklauso nuo prietaisų ir įpročių.",
          "whats_not_included_lt": "Buitinė elektra ir karšto vandens sąnaudos pritaikytos 1 asmens namų ūkiui (statistinis vidurkis). Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 1 asmens namų ūkiui sudarys apie €87 per mėnesį arba €1036 per metus. Per 5 metus, jei tarifai kils pagal dabartines prognozes, o buitinės elektros dalis išliks dabartinio lygio, mėnesinė kaina gali pasiekti apie €117."
        },
        {
          "household_size": 2,
          "size_label_lt": "2 asmenys",
          "metric": {
            "eur_month": 104,
            "subtext_lt": "Pastato energija + buitinė elektra (2 asmenų namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 2 asmenims)",
                "eur_year": 211,
                "eur_month": 17,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Elektros pastovusis mokestis",
                "eur_year": 36,
                "eur_month": 3,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Buitinė elektra (2 asm.)",
                "eur_year": 274,
                "eur_month": 23,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1250,
              "eur_month": 104
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 122.06,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 2,
              "heating_eur": 102.17,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 3,
              "heating_eur": 92.54,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 4,
              "heating_eur": 55.74,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 5,
              "heating_eur": 35.9,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 6,
              "heating_eur": 13.06,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 7,
              "heating_eur": 8.32,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 8,
              "heating_eur": 11.94,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 9,
              "heating_eur": 31.33,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 10,
              "heating_eur": 61.8,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 11,
              "heating_eur": 85.8,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            },
            {
              "month": 12,
              "heating_eur": 108.24,
              "dhw_eur": 17.59,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 23
            }
          ],
          "explanation_lt": "Ši suma apima pastato energiją ir preliminarų buitinės elektros suvartojimą, pritaikytą 2 asmenų namų ūkiui. Buitinės elektros dalis yra statistinis vidurkis — faktinės sąnaudos priklauso nuo prietaisų ir įpročių.",
          "whats_not_included_lt": "Buitinė elektra ir karšto vandens sąnaudos pritaikytos 2 asmenų namų ūkiui (statistinis vidurkis). Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 2 asmenų namų ūkiui sudarys apie €104 per mėnesį arba €1250 per metus. Per 5 metus, jei tarifai kils pagal dabartines prognozes, o buitinės elektros dalis išliks dabartinio lygio, mėnesinė kaina gali pasiekti apie €126."
        },
        {
          "household_size": 3,
          "size_label_lt": "3 asmenys",
          "metric": {
            "eur_month": 120,
            "subtext_lt": "Pastato energija + buitinė elektra (3 asmenų namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 3 asmenims)",
                "eur_year": 317,
                "eur_month": 26,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Elektros pastovusis mokestis",
                "eur_year": 36,
                "eur_month": 3,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Buitinė elektra (3 asm.)",
                "eur_year": 365,
                "eur_month": 30,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1447,
              "eur_month": 120
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 122.06,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 2,
              "heating_eur": 102.17,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 3,
              "heating_eur": 92.54,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 4,
              "heating_eur": 55.74,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 5,
              "heating_eur": 35.9,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 6,
              "heating_eur": 13.06,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 7,
              "heating_eur": 8.32,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 8,
              "heating_eur": 11.94,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 9,
              "heating_eur": 31.33,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 10,
              "heating_eur": 61.8,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 11,
              "heating_eur": 85.8,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            },
            {
              "month": 12,
              "heating_eur": 108.24,
              "dhw_eur": 26.39,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 30
            }
          ],
          "explanation_lt": "Ši suma apima pastato energiją ir preliminarų buitinės elektros suvartojimą, pritaikytą 3 asmenų namų ūkiui. Buitinės elektros dalis yra statistinis vidurkis — faktinės sąnaudos priklauso nuo prietaisų ir įpročių.",
          "whats_not_included_lt": "Buitinė elektra ir karšto vandens sąnaudos pritaikytos 3 asmenų namų ūkiui (statistinis vidurkis). Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 3 asmenų namų ūkiui sudarys apie €120 per mėnesį arba €1447 per metus. Per 5 metus, jei tarifai kils pagal dabartines prognozes, o buitinės elektros dalis išliks dabartinio lygio, mėnesinė kaina gali pasiekti apie €133."
        },
        {
          "household_size": 4,
          "size_label_lt": "4 asmenys",
          "metric": {
            "eur_month": 135,
            "subtext_lt": "Pastato energija + buitinė elektra (4 asmenų namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 4 asmenims)",
                "eur_year": 422,
                "eur_month": 35,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Elektros pastovusis mokestis",
                "eur_year": 36,
                "eur_month": 3,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Buitinė elektra (4 asm.)",
                "eur_year": 434,
                "eur_month": 36,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1621,
              "eur_month": 135
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 122.06,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 2,
              "heating_eur": 102.17,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 3,
              "heating_eur": 92.54,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 4,
              "heating_eur": 55.74,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 5,
              "heating_eur": 35.9,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 6,
              "heating_eur": 13.06,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 7,
              "heating_eur": 8.32,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 8,
              "heating_eur": 11.94,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 9,
              "heating_eur": 31.33,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 10,
              "heating_eur": 61.8,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 11,
              "heating_eur": 85.8,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            },
            {
              "month": 12,
              "heating_eur": 108.24,
              "dhw_eur": 35.19,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 36
            }
          ],
          "explanation_lt": "Ši suma apima pastato energiją ir preliminarų buitinės elektros suvartojimą, pritaikytą 4 asmenų namų ūkiui. Buitinės elektros dalis yra statistinis vidurkis — faktinės sąnaudos priklauso nuo prietaisų ir įpročių.",
          "whats_not_included_lt": "Buitinė elektra ir karšto vandens sąnaudos pritaikytos 4 asmenų namų ūkiui (statistinis vidurkis). Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 4 asmenų namų ūkiui sudarys apie €135 per mėnesį arba €1621 per metus. Per 5 metus, jei tarifai kils pagal dabartines prognozes, o buitinės elektros dalis išliks dabartinio lygio, mėnesinė kaina gali pasiekti apie €139."
        },
        {
          "household_size": 5,
          "size_label_lt": "5+ asmenys",
          "metric": {
            "eur_month": 150,
            "subtext_lt": "Pastato energija + buitinė elektra (5 asmenų namų ūkis)"
          },
          "breakdown": {
            "rows": [
              {
                "label_lt": "Šildymas (centrinis šildymas)",
                "eur_year": 729,
                "eur_month": 61,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Karštas vanduo (pritaikyta 5 asmenims)",
                "eur_year": 528,
                "eur_month": 44,
                "source_indicator": "📊 pagal pastato duomenis + 👥 pritaikyta pagal namų ūkio dydį"
              },
              {
                "label_lt": "Elektros pastovusis mokestis",
                "eur_year": 36,
                "eur_month": 3,
                "source_indicator": "📊 pagal pastato duomenis"
              },
              {
                "label_lt": "Buitinė elektra (5 asm.)",
                "eur_year": 506,
                "eur_month": 42,
                "source_indicator": "👥 statistinis vidurkis"
              }
            ],
            "total": {
              "label_lt": "Viso",
              "eur_year": 1799,
              "eur_month": 150
            }
          },
          "monthly_variation": [
            {
              "month": 1,
              "heating_eur": 122.06,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 2,
              "heating_eur": 102.17,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 3,
              "heating_eur": 92.54,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 4,
              "heating_eur": 55.74,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 5,
              "heating_eur": 35.9,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 6,
              "heating_eur": 13.06,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 7,
              "heating_eur": 8.32,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 8,
              "heating_eur": 11.94,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 9,
              "heating_eur": 31.33,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 10,
              "heating_eur": 61.8,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 11,
              "heating_eur": 85.8,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            },
            {
              "month": 12,
              "heating_eur": 108.24,
              "dhw_eur": 43.99,
              "cooling_eur": 0,
              "fixed_eur": 3,
              "household_electricity_eur": 42
            }
          ],
          "explanation_lt": "Ši suma apima pastato energiją ir preliminarų buitinės elektros suvartojimą, pritaikytą 5 asmenų namų ūkiui. Buitinės elektros dalis yra statistinis vidurkis — faktinės sąnaudos priklauso nuo prietaisų ir įpročių.",
          "whats_not_included_lt": "Buitinė elektra ir karšto vandens sąnaudos pritaikytos 5 asmenų namų ūkiui (statistinis vidurkis). Šildymo sąnaudos nepriklauso nuo gyventojų skaičiaus — jas lemia pastato konstrukcija.",
          "body_lt": "Pagal pastato energinę klasę (D) ir naudojamą šildymo sistemą (centrinis šildymas), tikėtina, kad šio būsto energijos sąnaudos kartu su buitine elektra 5 asmenų namų ūkiui sudarys apie €150 per mėnesį arba €1799 per metus. Per 5 metus, jei tarifai kils pagal dabartines prognozes, o buitinės elektros dalis išliks dabartinio lygio, mėnesinė kaina gali pasiekti apie €145."
        }
      ]
    }
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
      "rows": [
        {
          "band": "WEAK",
          "label_lt": "Silpnai",
          "description_lt": "Žema pastato energinė klasė (D ar žemesnė) rodo didelius šilumos poreikius: norint palaikyti 20–22 °C visame būste reikės intensyvaus šildymo, dalis patalpų gali likti vėsesnės, o šildymo poreikis gerokai viršija net renovuoto pastato lygį — žr. palyginimą žemiau (tikslesnę šildymo kainą rasite 2 bloke).",
          "highlighted": true
        }
      ],
      "comparison_lines_lt": [
        "Palyginti su naujos statybos etalonu (A++): apie 11 kartų didesnis šildymo poreikis.",
        "Palyginti su renovuoto pastato etalonu (C klasė): ~+97% didesnis."
      ]
    },
    "summer": {
      "risk_level": "MODERATE",
      "rows": [
        {
          "band": "MODERATE",
          "label_lt": "",
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
    "info_box": {
      "items_lt": [
        "Vertinimas remiasi Pastatų energinio naudingumo sertifikatų duomenimis ir standartinėmis prielaidomis panašiems būstams.",
        "Šiame bloke atskirai nemodeliuojame realių vidaus drėgmės ir skersvėjų, nes jie stipriai priklauso nuo gyventojų įpročių ir konkrečios buto būklės (langų, durų, sandūrų ir pan.).",
        "Ventiliacijos sistema: natūrali"
      ]
    },
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
      "pattern": "D",
      "scope_prefix": "Šilumos komforto požiūriu",
      "intro_lt": "Šilumos komforto požiūriu, šis pastatas kelia iššūkių abiem sezonais — žiemą šildymo sąnaudos gali būti didelės, o vasarą patalpos linkusios perkaisti. Tai stipriausias signalas būti atidiems. Šio pastato šildymo poreikis yra apie 35 % mažesnis nei vidutinio tos pačios energinės klasės pastato Lietuvoje. Pastato energijos kaina (be buitinės elektros) — apie €81 per mėnesį.",
      "viewing_questions_lt": [
        "Paprašykite faktinių šildymo sąskaitų už paskutinius 2–3 žiemos sezonus.",
        "Apžiūrėkite izoliaciją: stogo / pastogės apšiltinimą, sienų būklę, langų sandarumą.",
        "Jei įmanoma, aplankykite objektą šiltą popietę — pajuskite temperatūrą pietinėse ir vakarinėse patalpose.",
        "Patikrinkite ventiliaciją ir esamas saulės apsaugos priemones (žaliuzės, markizės).",
        "Ar pastatas buvo renovuotas? Jei taip — paprašykite renovacijos dokumentų. Jei ne — verta paklausti, ar planuojama renovacija (tai gali būti argumentas kainai derėtis)."
      ],
      "negotiation_angles_lt": [
        "Šilumos komforto požiūriu, šis pastatas kelia iššūkių abiem sezonais. Tai turėtų atsispindėti kainoje — arba tiesiogiai (mažesnė pardavimo kaina), arba per pardavėjo įsipareigojimą finansuoti dalį renovacijos.",
        "Pastato energijos kaina (be buitinės elektros) — apie €81 per mėnesį; iš jos šildymui tenka apie €61 per mėnesį. Pagal mūsų vertinimą, šildymo sąnaudos gali būti apie 6,5 karto didesnės nei efektyviame analogiškame pastate — tai apie €620 per metus. Per 5 metus, įvertinus prognozuojamą energijos kainų augimą (pagal 10 metų kainų tendencijas), skirtumas sudarytų apie €3480. Nerenovavus pastato, vien šildymas kainuotų apie €360 per metus daugiau nei renovuotame (C klasės) pastate.",
        "Pastatas statytas iki 1993 m. — šio laikotarpio pastatai dažnai turi silpnesnę izoliaciją ir pasenusias inžinerines sistemas. Tai sustiprina argumentą dėl kainos korekcijos."
      ],
      "forward_note_lt": "Tikslias šildymo sąnaudas eurais rasite 2 bloke (Energijos sąnaudos). Šilumos komforto požiūriu, ši informacija yra ypač svarbi priimant sprendimą.",
      "caveat_lt": null,
      "scope_disclaimer_lt": "Šios rekomendacijos apima tik šilumos komforto aspektą."
    }
  }
};

export const MOCK_LAND_ONLY: ReportData = {
  address: 'Vilniaus r. sav., Sklypas prie kelio',
  ntr_unique_number: '4400-9999-0001',
  municipality: 'Vilniaus r. sav.',
  lat: 54.7520,
  lng: 25.3380,
  bundle_items: [{ kind: 'land_plot', address: 'Sklypas prie kelio' }],
  generated_at: '2026-04-01T15:00:00Z',
  order_reference: 'NTD-2026-0043',
  block2: {
    status: 'not_applicable',
    message_lt:
      'Energijos sąnaudų vertinimas taikomas tik šildomiems pastatams; šiam objektui šis vertinimas neskaičiuojamas.',
  },
  block8: {
    id: 'recommendations',
    title_lt: '8) Rekomendacijos ir sprendimai',
    status: 'not_applicable',
    data: null,
  },
  block1: {
    applicable: false,
    neutral_message_lt:
      'Vidaus klimato komforto blokas taikomas tik šildomiems pastatams; šiam objektui šis vertinimas neskaičiuojamas.',
    winter: null,
    summer: null,
    summary_lt: '',
    drivers: [],
    winter_factors: [],
    info_box: { items_lt: [] },
    inputs_snapshot: {
      effective_energy_class: null,
      effective_epc_kwhm2_year: null,
      effective_year_built: null,
      glazing_share_percent: null,
      ventilation_type: null,
      epc_source_class: 'none',
      epc_confidence_level: 'NONE',
      evaluation_target: 'land_only',
    },
  },
  property_profile: {
    purpose: null,
    premises_type: null,
    usage_group_label: null,
    year_built: null,
    floors: 5,
    total_area_m2: null,
    heated_area_m2: null,
    wall_material: null,
    heating_type: null,
    ventilation_type: null,
    energy_class: null,
    epc_kwhm2_year: null,
    epc_source: null,
    epc_confidence: null,
    glazing_percent: null,
    glazing_source: null,
    cadastral_ref: null,
    evaluation_target: 'Žemės sklypas',
  },
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
