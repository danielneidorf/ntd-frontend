// P7-A1: Report data types + dev mock data
// Lithuanian copy sourced from Script Brief §2.4.2, Thermal Comfort annex, Decision Log D6–D15

export interface ReportData {
  address: string;
  ntr_unique_number: string | null;
  municipality: string;
  lat: number;
  lng: number;
  bundle_items: { kind: string; address?: string }[];
  generated_at: string;
  order_reference: string;
  block1: {
    applicable: boolean;
    neutral_message_lt?: string;
    winter: {
      level: 'GOOD' | 'INTERMEDIATE' | 'WEAK';
      rows: {
        band: string;
        label_lt: string;
        description_lt: string;
        range_lt?: string;
        highlighted: boolean;
      }[];
    } | null;
    summer: {
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
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
      direction: 'positive' | 'negative';
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
      'Lengva palaikyti komfortišką temperatūrą, nereikia didelių pastangų. Šildymo poreikis nuosaikus.',
    range_lt: undefined,
  },
  {
    band: 'INTERMEDIATE',
    label_lt: 'Vidutiniškai',
    description_lt:
      'Reikės daugiau šildymo ir dėmesio — kai kurios patalpos gali jaustis vėsesnės. Sąnaudos gali būti ~10–30\u00a0% didesnės.',
    range_lt: '~10–30\u00a0%',
  },
  {
    band: 'WEAK',
    label_lt: 'Silpnai',
    description_lt:
      'Didelis šildymo poreikis komfortui — reikės intensyvaus šildymo, dalis patalpų gali likti vėsesnės. Sąnaudos gali būti ~30–60\u00a0% ir daugiau didesnės.',
    range_lt: '~30–60\u00a0%+',
  },
];

const SUMMER_ROWS = [
  {
    band: 'LOW',
    label_lt: 'Maža',
    description_lt:
      'Net ir per karštas dienas patalpos linkusios išlikti pakankamai vėsios; pakanka natūralaus vėdinimo.',
  },
  {
    band: 'MEDIUM',
    label_lt: 'Vidutinė',
    description_lt:
      'Per karščio bangas kai kuriose patalpose gali tapti per šilta — reikės dažnai vėdinti ir riboti saulę.',
  },
  {
    band: 'HIGH',
    label_lt: 'Didelė',
    description_lt:
      'Karštomis dienomis patalpos linkusios perkaisti; be aktyvių vėsinimo priemonių gali būti nuolat per karšta.',
  },
];

function winterRows(level: 'GOOD' | 'INTERMEDIATE' | 'WEAK') {
  return WINTER_ROWS.map((r) => ({ ...r, highlighted: r.band === level }));
}

function summerRows(level: 'LOW' | 'MEDIUM' | 'HIGH') {
  return SUMMER_ROWS.map((r) => ({ ...r, highlighted: r.band === level }));
}

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
  block1: {
    applicable: true,
    winter: {
      level: 'INTERMEDIATE',
      rows: winterRows('INTERMEDIATE'),
    },
    summer: {
      risk_level: 'MEDIUM',
      rows: summerRows('MEDIUM'),
    },
    summary_lt:
      'Šiame būste žiemą palaikyti komfortišką temperatūrą reikės šiek tiek daugiau pastangų nei naujame, gerai apšiltintame name. Kai kurios patalpos, ypač kampiniai kambariai ir zonos prie didelių langų, gali jaustis vėsesnės. Vasarą per karščio bangas gali prireikti papildomo vėdinimo/vėsinimo.',
    drivers: [
      {
        key: 'energy_class',
        label_lt: 'Vidutinė energinė klasė (C)',
        explanation_lt:
          'C klasės pastatas naudoja vidutiniškai energijos šildymui — nei labai efektyvus, nei labai imlus.',
        active: true,
        direction: 'negative',
      },
      {
        key: 'year_built',
        label_lt: 'Statybos metai (1985)',
        explanation_lt:
          'Pastatas statytas prieš šiuolaikinių apšiltinimo standartų įvedimą. Sienos ir langai gali praleisti daugiau šilumos.',
        active: true,
        direction: 'negative',
      },
      {
        key: 'glazing',
        label_lt: 'Vidutinė langų dalis',
        explanation_lt:
          'Langai sudaro ~30\u00a0% išorinių atitvarų. Tai vidutinis rodiklis — nei mažina, nei didina riziką reikšmingai.',
        active: false,
        direction: 'negative',
      },
      {
        key: 'ventilation',
        label_lt: 'Natūrali ventiliacija',
        explanation_lt:
          'Būste veikia natūrali ventiliacija (langai, orlaidės). Nėra mechaninio vėdinimo su rekuperacija.',
        active: true,
        direction: 'negative',
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
  block1: {
    applicable: false,
    neutral_message_lt:
      'Vidaus klimato komforto blokas taikomas tik šildomiems pastatams; šiam objektui šis vertinimas neskaičiuojamas.',
    winter: null,
    summer: null,
    summary_lt: '',
    drivers: [],
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

export const DEV_MOCKS: Record<string, ReportData> = {
  'dev-existing': MOCK_EXISTING,
  'dev-land': MOCK_LAND_ONLY,
};
