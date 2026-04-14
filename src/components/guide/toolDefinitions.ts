// P7-B8.1/B8.2: OpenAI Realtime API tool definitions and screen-aware instructions.

export type ScreenName =
  | 'landing'
  | 'quickscan-step1'
  | 'quickscan-step2'
  | 'quickscan-resolver'
  | 'quickscan-success'
  | 'report'
  | 'other';

interface ToolDefinition {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

const GET_CURRENT_SCREEN_TOOL: ToolDefinition = {
  type: 'function',
  name: 'get_current_screen',
  description:
    'Sužinoti, kuriame puslapyje dabar yra naudotojas ir kokia dabartinė formos būsena. ' +
    'Naudok prieš bet kokį veiksmą, jei nesi tikras, kuriame žingsnyje naudotojas yra.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// P7-B8.2-fix: Tour navigation tools (common — available on all screens)
const TOUR_NEXT_TOOL: ToolDefinition = {
  type: 'function',
  name: 'tour_next',
  description:
    "Pereiti į kitą gido žingsnį. Naudok kai naudotojas sako 'toliau', 'kitas', 'pirmyn', 'eime' ar panašiai.",
  parameters: { type: 'object', properties: {}, required: [] },
};

const TOUR_BACK_TOOL: ToolDefinition = {
  type: 'function',
  name: 'tour_back',
  description:
    "Grįžti į ankstesnį gido žingsnį. Naudok kai naudotojas sako 'atgal', 'grįžk', 'ankstesnis' ar panašiai.",
  parameters: { type: 'object', properties: {}, required: [] },
};

// P7-B8.4: Show-don't-tell navigation — jump to a relevant section
const SHOW_SECTION_TOOL: ToolDefinition = {
  type: 'function',
  name: 'show_section',
  description:
    `Parodyti naudotojui svetainės sekciją, kuri vizualiai atsako į jo klausimą. ` +
    `VISADA naudok šį įrankį vietoj žodinio aiškinimo, jei atitinkama sekcija egzistuoja.\n\n` +
    `Galimos temos:\n` +
    `- report_contents — ką gausite ataskaitoje (blokai, duomenys)\n` +
    `- pricing — kaina\n` +
    `- how_it_works — kaip veikia procesas\n` +
    `- situations — situacijos, kurioms tinka ataskaita\n` +
    `- thermal_comfort — šiluminis komfortas (tik ataskaitoje)\n` +
    `- energy_costs — energijos sąnaudos (tik ataskaitoje)\n` +
    `- permits — statybos leidimai (tik ataskaitoje)\n\n` +
    `Jei sekcija yra kitame puslapyje — automatiškai pereis. Trumpai pasakyk "Parodysiu" ir iškart kvieski show_section.\n` +
    `Po parodymo, kai naudotojas sako "toliau" — grąžink jį atgal kur buvo.`,
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        enum: [
          'report_contents',
          'pricing',
          'how_it_works',
          'situations',
          'thermal_comfort',
          'energy_costs',
          'permits',
        ],
        description: 'Sekcijos tema',
      },
    },
    required: ['topic'],
  },
};

const START_ORDER_TOOL: ToolDefinition = {
  type: 'function',
  name: 'start_order',
  description:
    "Pereiti į užsakymo puslapį. Naudok kai naudotojas nori pradėti užsakymą, sako 'noriu užsakyti', " +
    "'noriu patikrinti', 'pradėkime', 'esamas pastatas', 'naujas projektas', 'žemės sklypas' ar panašiai. " +
    'Jei naudotojas nurodo objekto tipą — perduok jį kaip case_type.',
  parameters: {
    type: 'object',
    properties: {
      case_type: {
        type: 'string',
        enum: ['existing_object', 'new_build_project', 'land_only'],
        description: 'Objekto tipas, jei naudotojas jau pasakė. Neprivalomas.',
      },
    },
    required: [],
  },
};

const TOOLS_COMMON: ToolDefinition[] = [GET_CURRENT_SCREEN_TOOL, TOUR_NEXT_TOOL, TOUR_BACK_TOOL, SHOW_SECTION_TOOL, START_ORDER_TOOL];

// P7-B8.2: Screen 1 form-filling tools
const TOOLS_SCREEN1: ToolDefinition[] = [
  {
    type: 'function',
    name: 'select_case_type',
    description:
      'Pasirinkti vertinimo tipą. Naudok kai naudotojas pasako, kokio tipo objektą nori patikrinti.',
    parameters: {
      type: 'object',
      properties: {
        case_type: {
          type: 'string',
          enum: ['existing_object', 'new_build_project', 'land_only'],
          description:
            'existing_object = esamas pastatas, new_build_project = naujai statomas, land_only = tik žemės sklypas',
        },
      },
      required: ['case_type'],
    },
  },
  {
    type: 'function',
    name: 'set_location_tab',
    description:
      "Perjungti vietos įvedimo būdą. Naudok kai naudotojas sako 'žemėlapyje', 'per žemėlapį', " +
      "'NTR numeriu', 'unikaliu numeriu', 'adresu' ar panašiai.",
    parameters: {
      type: 'object',
      properties: {
        tab: {
          type: 'string',
          enum: ['address', 'ntr', 'map'],
          description: 'address = adresas, ntr = NTR numeris, map = žemėlapis',
        },
      },
      required: ['tab'],
    },
  },
  {
    type: 'function',
    name: 'fill_address',
    description:
      'Įvesti adresą ir ieškoti autocomplete pasiūlymų. Grąžina rastus kandidatus. ' +
      'Jei rastas vienas — automatiškai pasirenka. Jei keli — paklausk naudotojo, ' +
      'kurį pasirinkti, tada naudok select_address_candidate.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description:
            "Adresas arba jo dalis, pvz. 'Žirmūnų g. 12' arba 'Gedimino pr. 1, Vilnius'",
        },
      },
      required: ['address'],
    },
  },
  {
    type: 'function',
    name: 'select_address_candidate',
    description:
      'Pasirinkti adreso kandidatą iš fill_address grąžintų rezultatų pagal indeksą.',
    parameters: {
      type: 'object',
      properties: {
        index: {
          type: 'number',
          description: 'Kandidato indeksas (pradedant nuo 0) iš fill_address rezultatų',
        },
      },
      required: ['index'],
    },
  },
  {
    type: 'function',
    name: 'fill_ntr',
    description:
      'Įvesti NTR unikalų numerį. Formatas: 1234-5678-9012 arba 1234-5678-9012:1. ' +
      'Naudok tik kai naudotojas aiškiai pateikia NTR numerį.',
    parameters: {
      type: 'object',
      properties: {
        ntr: {
          type: 'string',
          description: "NTR unikalus numeris, pvz. '1234-5678-9012'",
        },
      },
      required: ['ntr'],
    },
  },
  {
    type: 'function',
    name: 'click_continue',
    description:
      "Paspausti 'Tęsti' mygtuką ir pereiti į kitą žingsnį. " +
      "SVARBU: prieš kviečiant šį įrankį, visada pasakyk naudotojui ką ketini daryti, " +
      "pvz. 'Viskas paruošta, ieškome jūsų objekto.' ir trumpai palūkėk.",
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// P7-B8.3: Screen 2 payment/confirmation tools
const TOOLS_SCREEN2: ToolDefinition[] = [
  {
    type: 'function',
    name: 'confirm_property',
    description:
      "Patvirtinti rastą objektą proof card'e. Naudok kai naudotojas sako 'taip, teisingas' arba 'patvirtinu'. " +
      "Jei sako 'ne' — naudok navigate_back.",
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    type: 'function',
    name: 'fill_email',
    description: 'Įvesti naudotojo el. pašto adresą. Naudok kai naudotojas pasako savo el. paštą.',
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: "El. pašto adresas, pvz. 'jonas@gmail.com'",
        },
      },
      required: ['email'],
    },
  },
  {
    type: 'function',
    name: 'toggle_consent',
    description:
      "Pažymėti arba atžymėti sutikimo su sąlygomis varnelę. " +
      "Naudok kai naudotojas sako 'sutinku su sąlygomis' arba 'taip, sutinku'.",
    parameters: {
      type: 'object',
      properties: {
        checked: { type: 'boolean', description: 'true = pažymėti, false = atžymėti' },
      },
      required: ['checked'],
    },
  },
  {
    type: 'function',
    name: 'toggle_invoice',
    description:
      "Pažymėti arba atžymėti 'Reikia sąskaitos faktūros' varnelę. " +
      'Naudok tik kai naudotojas aiškiai prašo sąskaitos.',
    parameters: {
      type: 'object',
      properties: {
        checked: { type: 'boolean', description: 'true = reikia sąskaitos, false = nereikia' },
      },
      required: ['checked'],
    },
  },
  {
    type: 'function',
    name: 'select_payment_method',
    description:
      "Pasirinkti mokėjimo būdą. Galimi: 'card' (kortelė Visa/MC), 'apple-pay', 'google-pay', " +
      "'paypal', 'swedbank', 'seb', 'luminor', 'citadele', 'revolut', 'paysera'.",
    parameters: {
      type: 'object',
      properties: {
        method: { type: 'string', description: 'Mokėjimo būdo ID' },
      },
      required: ['method'],
    },
  },
  {
    type: 'function',
    name: 'click_pay',
    description:
      "Paspausti 'Mokėti ir gauti ataskaitą' mygtuką. ⚠️ NEGRĮŽTAMAS VEIKSMAS. " +
      "PRIVALOMA: prieš kviečiant šį įrankį, VISADA pasakyk naudotojui tikslią kainą ir " +
      "paklausk patvirtinimo: 'Patvirtinkite — apmokame [kaina] €?' " +
      "Lauk kol naudotojas aiškiai pasakys 'taip', 'sutinku', 'mokėk' ar panašiai. " +
      'Jei naudotojas nepatvirtina — NEKVIESTI šio įrankio.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    type: 'function',
    name: 'navigate_back',
    description:
      'Grįžti atgal į 1 žingsnį (vietos pasirinkimą). ' +
      'Naudok kai naudotojas sako objektas neteisingas arba nori keisti adresą.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
];

/** Returns the tool set appropriate for the given screen. */
export function getToolsForScreen(screen: ScreenName): ToolDefinition[] {
  switch (screen) {
    case 'quickscan-step1':
      return [...TOOLS_COMMON, ...TOOLS_SCREEN1];
    case 'quickscan-step2':
      return [...TOOLS_COMMON, ...TOOLS_SCREEN2];
    default:
      return [...TOOLS_COMMON];
  }
}

/** Maps QuickScanState step values to a ScreenName. */
export function mapStepToScreen(
  step: 1 | 2 | 'success' | 'resolver-loading' | 'resolver-failure' | 'resolver-nomatch' | 'resolver-chooser',
): ScreenName {
  switch (step) {
    case 1:
      return 'quickscan-step1';
    case 2:
      return 'quickscan-step2';
    case 'success':
      return 'quickscan-success';
    default:
      return 'quickscan-resolver';
  }
}

function screenLabel(screen: ScreenName): string {
  switch (screen) {
    case 'landing':
      return 'pagrindiniame puslapyje';
    case 'quickscan-step1':
      return '1 žingsnyje (vietos pasirinkimas)';
    case 'quickscan-step2':
      return '2 žingsnyje (patvirtinimas ir apmokėjimas)';
    case 'quickscan-resolver':
      return 'adreso paieškos tarpiniame žingsnyje';
    case 'quickscan-success':
      return 'sėkmės puslapyje';
    case 'report':
      return 'ataskaitoje';
    default:
      return 'nežinomame puslapyje';
  }
}

/** Builds screen-aware system instructions for the Realtime session. */
export function buildScreenInstructions(screen: ScreenName, propertyContext?: string): string {
  const base = `KALBA: Naudotojas kalba LIETUVIŠKAI. Visa garso įvestis yra lietuvių kalba.

Tu esi NTD balso asistentas. Kalbi lietuviškai, trumpai (1-2 sakiniai).
Dabar naudotojas yra: ${screenLabel(screen)}.
Gali naudoti įrankius formos veiksmams atlikti.
Prieš bet kokį negrįžtamą veiksmą (mokėjimas, sutikimai) — VISADA paklausk patvirtinimo ir lauk "taip" arba "sutinku".

Kai gauni žinutę prasidedančią [NARACIJA] — perskaityk tekstą tiksliai žodis žodžiui. Baigęs — tylėk. NIEKADA nekomentuok, neperfrazuok ir nepridėk savo žodžių po naracijos.

Kai naudotojas sako "toliau", "kitas", "pirmyn" — naudok tour_next.
Kai sako "atgal", "grįžk" — naudok tour_back.`;

  const screen1Guidance =
    screen === 'quickscan-step1'
      ? `\n\nVEIKSMAI:
- Jei naudotojas pasako objekto tipą → select_case_type
- Jei naudotojas pasako adresą → fill_address. Jei grąžina kelis kandidatus, perskaityk juos ir paklausk kurį pasirinkti, tada select_address_candidate.
- Jei naudotojas duoda NTR numerį → fill_ntr
- Kai viskas paruošta → pasakyk "Ieškome jūsų objekto" ir click_continue

SVARBU: Naudotojas gali pasakyti viską vienu sakiniu, pvz. "Noriu patikrinti butą Žirmūnų gatvėje 12" — tada iškart select_case_type(existing_object) IR fill_address("Žirmūnų g. 12").`
      : '';

  const contextBlock = propertyContext ? `\nTurto duomenys: ${propertyContext}` : '';

  return base + screen1Guidance + contextBlock;
}
