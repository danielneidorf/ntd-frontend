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
export interface Block2Data {
  status: 'ready' | 'not_applicable';
  message_lt: string | null;
  metric?: { eur_month: number; eur_month_raw: number; subtext_lt: string };
  intro_lt?: string;
  breakdown?: {
    column_headers_lt: string[];
    rows: { label_lt: string; eur_year: number; eur_month: number; source_indicator: string }[];
    total: { label_lt: string; eur_year: number; eur_month: number };
    dhw_footnote_lt: string | null;
  };
  explanation?: { heading_lt: string; body_lt: string };
  info_box?: { heading_lt: string; vat_lt: string; escalation_lt: string; disclosure_lt: string };
  confidence?: string;
  confidence_text_lt?: string | null;
  carrier_warning_lt?: string | null;
  newbuild_note_lt?: string | null;
  citations_lt?: string[];
  household_reference?: {
    household_size: number;
    size_label_lt: string;
    kwh_month: number;
    kwh_year: number;
    eur_month: number | null;
  }[];
  monthly_variation?: {
    month: number;
    heating_eur: number;
    dhw_eur: number;
    cooling_eur: number;
    fixed_eur: number;
    household_electricity_eur: number;
  }[];
  forecast_5yr?: {
    year: number;
    total_eur_month: number;
    per_carrier: Record<string, number>;
    fixed_eur_year: number;
  }[];
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
    premises_type: string | null;
    usage_group_label: string | null;
    year_built: number | null;
    floors: number | null;
    total_area_m2: number | null;
    heated_area_m2: number | null;
    wall_material: string | null;
    heating_type: string | null;
    ventilation_type: string | null;
    energy_class: string | null;
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

// --- Block 2 mock (shape mirrors block2/presentation.py output) ---

const MOCK_MONTHLY = [122, 110, 90, 60, 30, 10, 5, 5, 20, 55, 95, 120].map((h, i) => ({
  month: i + 1,
  heating_eur: h,
  dhw_eur: 17.6,
  cooling_eur: 0,
  fixed_eur: 3,
  household_electricity_eur: 0,
}));

const MOCK_FORECAST = Array.from({ length: 5 }, (_, i) => ({
  year: 2026 + i,
  total_eur_month: 81 + i * 4,
  per_carrier: { cst: 940 + i * 45 },
  fixed_eur_year: 36,
}));

function mockBlock2(carrierWarning: string | null = null): Block2Data {
  return {
    status: 'ready',
    message_lt: null,
    metric: {
      eur_month: 81,
      eur_month_raw: 81.34,
      subtext_lt: 'Vidutinė mėnesinė energijos kaina pagal dabartinius tarifus (su PVM)',
    },
    intro_lt:
      'Žemiau pateikiame, kiek šiame būste apytiksliai kainuotų energija (šildymas, karštas vanduo) pagal dabartinius tarifus.',
    breakdown: {
      column_headers_lt: ['Komponentas', '€ per metus (su PVM)', '€ per mėnesį (su PVM)', 'Šaltinis'],
      rows: [
        { label_lt: 'Šildymas (centrinis šildymas)', eur_year: 729, eur_month: 61, source_indicator: '📊 pagal pastato duomenis' },
        { label_lt: 'Karštas vanduo', eur_year: 211, eur_month: 18, source_indicator: '👥 statistinis vidurkis' },
        { label_lt: 'Elektros pastovusis mokestis', eur_year: 36, eur_month: 2, source_indicator: '📊 pagal pastato duomenis' },
      ],
      total: { label_lt: 'Viso', eur_year: 976, eur_month: 81 },
      dhw_footnote_lt: 'Karšto vandens sąnaudos rodomos atskirai nuo šildymo.',
    },
    explanation: {
      heading_lt: 'Ką tai reiškia praktiškai?',
      body_lt:
        'Pagal D klasės pastato vertinimą energijai šildymui ir karštam vandeniui per mėnesį skirsite apie €81, o per metus — apie €976. Po 5 metų, prognozuojant tarifų augimą, mėnesinė kaina gali siekti ~€97.',
    },
    info_box: {
      heading_lt: 'Iš ko remiamės šiuo vertinimu?',
      vat_lt: 'Visos kainos nurodytos su PVM (21%).',
      escalation_lt: 'Prognozėje taikomas tarifų augimas pagal energijos rūšį, ne mažesnis nei infliacija.',
      disclosure_lt: 'Šildymo būdas nustatytas pagal pastato energinio naudingumo sertifikatą.',
    },
    confidence: 'medium',
    confidence_text_lt:
      'Šis įvertinimas pagrįstas registro duomenimis ir tipiniais suvartojimo modeliais, todėl faktinės sąskaitos gali skirtis priklausomai nuo gyvenimo įpročių.',
    carrier_warning_lt: carrierWarning,
    newbuild_note_lt: null,
    citations_lt: [
      'Centrinis šildymas: AB „Kauno energija“, VERT patvirtintas tarifas, galioja nuo 2026 m. gegužės (šaltinis: vert.lt)',
      'Elektra: ESO „Namai“ planas, VERT reguliuojamas (šaltinis: eso.lt)',
    ],
    household_reference: [
      { household_size: 1, size_label_lt: '1 asmuo', kwh_month: 124, kwh_year: 1490, eur_month: 14 },
      { household_size: 2, size_label_lt: '2 asmenys', kwh_month: 205, kwh_year: 2460, eur_month: 23 },
      { household_size: 3, size_label_lt: '3 asmenys', kwh_month: 273, kwh_year: 3280, eur_month: 30 },
      { household_size: 4, size_label_lt: '4 asmenys', kwh_month: 325, kwh_year: 3900, eur_month: 36 },
      { household_size: 5, size_label_lt: '5 asmenys', kwh_month: 379, kwh_year: 4545, eur_month: 42 },
    ],
    monthly_variation: MOCK_MONTHLY,
    forecast_5yr: MOCK_FORECAST,
  };
}

const MOCK_CARRIER_FALLBACK_WARNING =
  '⚠️ Šildymo sistemos tipas nėra nurodytas šio pastato energinio naudingumo sertifikate. Vertinime naudojamas šildymo būdas (centrinis šildymas) nustatytas pagal pastato tipą ir statybos laikotarpį.';

// --- Mock datasets ---

export const MOCK_EXISTING: ReportData = {
  address: 'Vilnius, Žirmūnų g. 12-5',
  ntr_unique_number: '4400-1234-5678',
  municipality: 'Vilniaus m. sav.',
  lat: 54.7104,
  lng: 25.2865,
  bundle_items: [
    { kind: 'unit_in_building', address: 'Vilnius, Žirmūnų g. 12-5' },
    { kind: 'storage', address: 'Sandėliukas Nr. 3' },
    { kind: 'garage', address: 'Garažas Nr. 12' },
  ],
  generated_at: '2026-04-01T14:30:00Z',
  order_reference: 'NTD-2026-0042',
  block2: mockBlock2(null),
  block8: {
    id: 'recommendations',
    title_lt: '8) Rekomendacijos ir sprendimai',
    status: 'ready',
    data: {
      pattern: 'B',
      scope_prefix: 'Šilumos komforto požiūriu',
      intro_lt:
        'Šilumos komforto požiūriu, šis pastatas kelia šildymo iššūkį — šildymo sąnaudos gali būti reikšmingai didesnės nei efektyviame pastate, todėl verta atkreipti dėmesį į keletą dalykų.',
      viewing_questions_lt: [
        'Paprašykite faktinių šildymo sąskaitų už paskutinius 2–3 žiemos sezonus — ne įvertinimų, o tikrų sąskaitų.',
        'Apžiūrėkite izoliaciją: stogo / pastogės apšiltinimą, grindų / rūsio izoliaciją, sienų būklę (matomi plyšiai, drėgmės žymės).',
        'Patikrinkite langų būklę: dvigubas ar trigubas stiklo paketas, rėmų būklė, ar jaučiamas skersvėjis.',
      ],
      negotiation_angles_lt: [
        'Pagal mūsų vertinimą, šildymo sąnaudos gali būti apie 10–30 % didesnės nei techniškai efektyviame pastate. Tai reiškia konkretų pokytį jūsų mėnesinėse sąskaitose.',
        'Šio laikotarpio pastatai dažnai turi silpnesnę izoliaciją — verta paklausti pardavėjo, ar buvo atlikta modernizacija.',
      ],
      forward_note_lt:
        'Kiek konkrečiai kainuos šildymas eurais per mėnesį, parodys 2 blokas (Energijos sąnaudos). 10 metų bendrą gyvenimo kainą — 3 blokas (Gyvenimo kaina).',
      caveat_lt: null,
      scope_disclaimer_lt:
        'Šios rekomendacijos apima tik šilumos komforto aspektą. Visapusiškas derybų strategijas ir pasiūlymo kainą pateiks pilnas 8 blokų rinkinys, kai visi blokai bus pridėti.',
    },
  },
  block1: {
    applicable: true,
    winter: {
      level: 'INTERMEDIATE',
      rows: winterRows('INTERMEDIATE'),
    },
    summer: {
      risk_level: 'MODERATE',
      rows: summerRows('MODERATE'),
    },
    summary_lt:
      'Šiame būste žiemą palaikyti komfortišką temperatūrą reikės šiek tiek daugiau pastangų nei naujame, gerai apšiltintame name. Kai kurios patalpos, ypač kampiniai kambariai ir zonos prie didelių langų, gali jaustis vėsesnės. Vasarą per karščio bangas gali prireikti papildomo vėdinimo/vėsinimo.',
    // A-next: the 3 real summer-overheating drivers (authored copy, single
    // source = block1/presentation.py). MOCK_EXISTING is C / 1985 / low glazing,
    // so none of the D23 thresholds fire → all inactive → section hidden (the
    // honest result; the active-tag UI is covered by the DriversSection test).
    drivers: [
      {
        key: 'high_energy_class_driver',
        label_lt: 'Aukšta energinė klasė',
        explanation_lt:
          'Aukštesnės energinės klasės pastatai paprastai sandaresni ir geriau apšiltinti — žiemą tai taupo šilumą, bet vasarą pro langus ir iš vidaus patekusi šiluma patalpose išlieka ilgiau, todėl be tinkamo šešėliavimo ir vėdinimo perkaitimo rizika būna šiek tiek didesnė.',
        active: false,
        direction: 'increase',
      },
      {
        key: 'newer_building_driver',
        label_lt: 'Naujesnės statybos pastatas',
        explanation_lt:
          'Naujesni pastatai paprastai sandaresni ir geriau apšiltinti, todėl be tinkamo šešėliavimo ir vėdinimo vasarą sukaupta šiluma patalpose išlieka ilgiau ir perkaitimo rizika būna šiek tiek didesnė.',
        active: false,
        direction: 'increase',
      },
      {
        key: 'high_glazing_driver',
        label_lt: 'Didelė langų dalis',
        explanation_lt:
          'Kai langų plotas didelis, saulėtomis dienomis pro stiklą patenka daug šilumos, todėl patalpos vasarą greičiau ir labiau įšyla.',
        active: false,
        direction: 'increase',
      },
    ],
    // Driver merge: winter-comfort factors (two-way). Copy is verbatim from the
    // backend _WINTER_FACTOR_DEFS (single source). MOCK_EXISTING is C / 1985 /
    // low glazing → good_epc (C, a helper) active; the rest inactive.
    winter_factors: [
      {
        key: 'good_epc',
        label_lt: 'Geras energinis naudingumas',
        explanation_lt:
          'Geras pastato energinis naudingumas reiškia mažesnius šilumos nuostolius, todėl žiemą patalpas lengviau šildyti iki komfortiškos temperatūros, o šildymui reikia mažiau energijos.',
        active: true,
        direction: 'decrease',
      },
      {
        key: 'new_or_renovated',
        label_lt: 'Naujesnės statybos pastatas',
        explanation_lt:
          'Naujesnės statybos pastatai paprastai geriau apšiltinti ir sandaresni, todėl žiemą šiluma išlaikoma efektyviau ir jaučiama mažiau šaltų vietų ties sienomis ar kampuose.',
        active: false,
        direction: 'decrease',
      },
      {
        key: 'risky_glazing',
        label_lt: 'Didelė langų dalis',
        explanation_lt:
          'Langai šilumą praleidžia lengviau nei sienos, todėl kai jų plotas didelis, žiemą pro juos prarandama daugiau šilumos — ties langais gali būti vėsiau, o šildymo poreikis šiek tiek didesnis.',
        active: false,
        direction: 'increase',
      },
      {
        key: 'heroic_heating',
        label_lt: 'Efektyvi šildymo sistema',
        explanation_lt:
          'Efektyvi šildymo sistema komfortišką temperatūrą pasiekia greičiau ir mažesnėmis sąnaudomis, todėl žiemą patalpas lengviau tolygiai šildyti.',
        active: false,
        direction: 'decrease',
      },
      {
        key: 'poor_heating',
        label_lt: 'Neefektyvi šildymo sistema',
        explanation_lt:
          'Mažiau efektyvi šildymo sistema komfortiškai temperatūrai palaikyti reikalauja daugiau energijos ir laiko, todėl žiemą gali būti sunkiau užtikrinti tolygią šilumą visose patalpose.',
        active: false,
        direction: 'increase',
      },
    ],
    info_box: {
      items_lt: [
        'Pagrindinė prielaida: Lietuvos klimatas, gyvenamosios patalpos ~20–22\u00a0°C žiemą, įprasti namų drabužiai, lengva veikla.',
        'Vertinimo metodas: lyginame su techniškai efektyviu etaloniniu būstu (A/B klasė, šiuolaikinis apšiltinimas, mechaninė ventiliacija su rekuperacija) esant toms pačioms lauko sąlygoms ir panašiam būsto plotui.',
        'Duomenų šaltinis: energijos naudingumo sertifikatas iš PENS registro. Pagrindiniai veiksniai, turintys įtaką vertinimui, nurodyti aukščiau.',
      ],
    },
    inputs_snapshot: {
      effective_energy_class: 'C',
      effective_epc_kwhm2_year: 120,
      effective_year_built: 1985,
      glazing_share_percent: 30,
      ventilation_type: 'natural',
      epc_source_class: 'registry',
      epc_confidence_level: 'HIGH',
      evaluation_target: 'main_heated',
    },
  },
  property_profile: {
    purpose: 'Gyvenamoji',
    premises_type: 'Daugiabutis namas',
    usage_group_label: 'Gyvenamieji daugiabučiai pastatai',
    year_built: 1985,
    floors: 5,
    total_area_m2: 68.5,
    heated_area_m2: 62.0,
    wall_material: 'Gelžbetonio plokštės',
    heating_type: 'Centrinis šildymas',
    ventilation_type: 'Natūrali ventiliacija',
    energy_class: 'C',
    epc_kwhm2_year: 120,
    epc_source: 'Registras (PENS)',
    epc_confidence: 'Vidutinis',
    glazing_percent: 20,
    glazing_source: 'Statybos periodo ir tipo numatytoji reikšmė',
    cadastral_ref: null,
    evaluation_target: 'Esamas pastatas',
  },
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
    floors: null,
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
