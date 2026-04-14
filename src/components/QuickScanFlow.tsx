import { useState, useEffect, useRef } from 'react';
import { formActions } from './guide/formActionsRegistry';
import { mapStepToScreen } from './guide/toolDefinitions';

export type CaseType = 'existing_object' | 'new_build_project' | 'land_only';

export interface Candidate {
  candidate_id: string;
  address: string;
  ntr_unique_number: string | null;
  municipality: string | null;
  kind: 'whole_building' | 'unit_in_building' | 'land_plot';
  confidence: 'high' | 'medium' | 'low';
  primary_object: Record<string, unknown>;
  bundle_items: unknown[];
  bundle_confidence: 'HIGH' | 'AMBIGUOUS' | 'LOW';
}

export interface ResolveResponse {
  status: 'resolved' | 'ambiguous' | 'low_confidence' | 'no_match' | 'error';
  candidates: Candidate[];
  message_lt: string | null;
}

export interface QuoteData {
  quote_id: string;
  bundle_id: string | null;
  base_price_eur: number;
  final_price_eur: number;
  discount_amount_eur: number;
  pricing_label: string;
  pricing_version: string;
  currency: string;
  special_discount_applied: boolean;
  ui_explanation_block: string[];
  expires_at: string;
  has_active_discount: boolean;
  discount_context: unknown;
}

export interface QuickScanState {
  step: 1 | 2 | 'success' | 'resolver-loading' | 'resolver-failure' | 'resolver-nomatch' | 'resolver-chooser';
  case_type: CaseType | null;
  ntr_unique_number: string | null;
  address_text: string | null;
  geo: { lat: number; lng: number } | null;
  project_website_url: string | null;
  project_doc_id: string | null;
  resolver_result: ResolveResponse | null;
  selected_candidate_id: string | null;
  user_epc: {
    energy_class?: string;
    kwhm2_year?: number;
    issue_year?: number;
    year_unknown?: boolean;
  } | null;
  quote: QuoteData | null;
  email: string;
  consent_accepted: boolean;
  invoice_requested: boolean;
  invoice_name: string;
  invoice_is_company: boolean;
  invoice_company_name: string;
  invoice_email: string;
  order_id: string | null;
  payment_complete: boolean;
  discount_token: string | null;
}

// Dev mock data for ?step=2 bypass
const DEV_MOCK_RESOLVER: ResolveResponse = {
  status: 'resolved',
  candidates: [{
    candidate_id: 'dev-mock-001',
    address: 'Vilnius, Žirmūnų g. 12',
    ntr_unique_number: '4400-1234-5678',
    municipality: 'Vilniaus m. sav.',
    kind: 'whole_building',
    confidence: 'high',
    primary_object: { purpose: 'Gyvenamoji', area_m2: 68, year_built: 1985, heated: true },
    bundle_items: [
      { kind: 'garage', address: 'Žirmūnų g. 12 (garažas)' },
      { kind: 'shed', address: 'Žirmūnų g. 12 (sandėliukas)' },
    ],
    bundle_confidence: 'HIGH',
  }],
  message_lt: null,
};

const initialState = (): QuickScanState => {
  let case_type: CaseType | null = null;
  let step: 1 | 2 | 'success' | 'resolver-loading' | 'resolver-failure' | 'resolver-nomatch' = 1;
  let resolver_result: ResolveResponse | null = null;
  let email = '';
  let payment_complete = false;
  let consent_accepted = false;
  let quote: QuickScanState['quote'] = null;

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const caseParam = params.get('case');
    if (caseParam === 'existing_object' || caseParam === 'new_build_project' || caseParam === 'land_only') {
      case_type = caseParam;
    }
    const stepParam = params.get('step');
    // Dev bypass: ?step=2 forces Screen 2 with mock data
    if (stepParam === '2') {
      step = 2;
      resolver_result = DEV_MOCK_RESOLVER;
      if (!case_type) case_type = 'existing_object';
    }
    // Dev bypass: ?step=2-payment forces Screen 2 with card input visible
    if (stepParam === '2-payment') {
      step = 2;
      resolver_result = DEV_MOCK_RESOLVER;
      if (!case_type) case_type = 'existing_object';
      email = 'vardas@pastas.lt';
      consent_accepted = true;
      const hasDiscount = params.get('discount') === 'true';
      quote = {
        quote_id: 'dev-quote-001', bundle_id: 'dev-mock-001',
        base_price_eur: hasDiscount ? 49 : 39,
        final_price_eur: 39,
        discount_amount_eur: hasDiscount ? 10 : 0,
        pricing_label: 'Standartinis', pricing_version: 'v1', currency: 'EUR',
        special_discount_applied: hasDiscount,
        ui_explanation_block: hasDiscount
          ? ['Kaina apskaičiuota pagal registrų duomenis ir vertinimo apimtį.', 'Šiuo metu jums taikoma speciali nuolaida.']
          : [],
        expires_at: '2099-12-31T23:59:59Z', has_active_discount: hasDiscount, discount_context: null,
      };
    }
    // Dev bypass: ?step=duplicate shows Screen 2 with duplicate warning
    if (stepParam === 'duplicate') {
      step = 2;
      resolver_result = DEV_MOCK_RESOLVER;
      if (!case_type) case_type = 'existing_object';
      email = 'vardas@pastas.lt';
      consent_accepted = true;
      quote = {
        quote_id: 'dev-quote-001', bundle_id: 'dev-mock-001',
        base_price_eur: 49, final_price_eur: 39, discount_amount_eur: 10,
        pricing_label: 'Beta kaina', pricing_version: 'v1', currency: 'EUR',
        special_discount_applied: true, ui_explanation_block: [],
        expires_at: '2099-12-31T23:59:59Z', has_active_discount: true, discount_context: null,
      };
    }
    // Dev bypass: ?step=success forces success screen with mock data
    if (stepParam === 'success') {
      step = 'success';
      resolver_result = DEV_MOCK_RESOLVER;
      email = 'vardas@pastas.lt';
      payment_complete = true;
      if (!case_type) case_type = 'existing_object';
    }
    // Dev bypass: resolver states
    if (stepParam === 'resolver-loading' || stepParam === 'resolver-failure' || stepParam === 'resolver-nomatch') {
      step = stepParam;
      if (!case_type) case_type = 'existing_object';
    }
    // Dev bypass: ?step=resolver-chooser shows chooser with 3 mock candidates
    if (stepParam === 'resolver-chooser') {
      step = 'resolver-chooser';
      if (!case_type) case_type = 'existing_object';
      resolver_result = {
        status: 'ambiguous',
        candidates: [
          { candidate_id: 'cand-001', address: 'Vilnius, Žirmūnų g. 12', ntr_unique_number: '4400-1234-5678', municipality: 'Vilniaus m. sav.', kind: 'whole_building', confidence: 'high', primary_object: { purpose: 'Gyvenamoji', area_m2: 120, year_built: 1985 }, bundle_items: [{ kind: 'garage' }, { kind: 'shed' }], bundle_confidence: 'HIGH' },
          { candidate_id: 'cand-002', address: 'Vilnius, Minties g. 3', ntr_unique_number: '4400-2345-6789', municipality: 'Vilniaus m. sav.', kind: 'unit_in_building', confidence: 'medium', primary_object: { purpose: 'Gyvenamoji', area_m2: 68, year_built: 2005 }, bundle_items: [], bundle_confidence: 'HIGH' },
          { candidate_id: 'cand-003', address: 'Vilnius, Žirmūnų g. 8', ntr_unique_number: '4400-3456-7890', municipality: 'Vilniaus m. sav.', kind: 'whole_building', confidence: 'medium', primary_object: { purpose: 'Gyvenamoji', area_m2: 95, year_built: 1972 }, bundle_items: [{ kind: 'garage' }], bundle_confidence: 'HIGH' },
        ],
        message_lt: null,
      };
    }
  }
  return {
  step,
  case_type,
  ntr_unique_number: null,
  address_text: null,
  geo: null,
  project_website_url: null,
  project_doc_id: null,
  resolver_result,
  selected_candidate_id: resolver_result ? resolver_result.candidates[0]?.candidate_id ?? null : null,
  user_epc: null,
  quote,
  email,
  consent_accepted,
  invoice_requested: false,
  invoice_name: '',
  invoice_is_company: false,
  invoice_company_name: '',
  invoice_email: '',
  order_id: null,
  payment_complete,
  discount_token: typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token')
    : null,
};
};

const BREADCRUMB_STEPS = [
  { step: 1, label: '1 Vieta' },
  { step: 2, label: '2 Patvirtinimas ir apmokėjimas' },
] as const;

export default function QuickScanFlow() {
  const [state, setState] = useState<QuickScanState>(initialState);
  const [addressCandidates, setAddressCandidates] = useState<
    { place_id: string; description: string; main_text: string; secondary_text: string }[]
  >([]);
  const [sessionToken] = useState(() => crypto.randomUUID());

  // P7-B8.1: Register form actions so the AI voice concierge can query screen state.
  // The registry is a module-level singleton shared across Astro islands.
  useEffect(() => {
    const screen = typeof state.step === 'number' ? mapStepToScreen(state.step) : mapStepToScreen(state.step);

    formActions.register('__screen', () => screen);
    formActions.register('get_current_screen', () =>
      JSON.stringify({
        success: true,
        data: {
          screen,
          case_type: state.case_type ?? undefined,
          address_filled: !!state.address_text,
          current_address: state.address_text ?? undefined,
          has_geo: !!state.geo,
        },
      }),
    );

    return () => {
      formActions.unregister('__screen');
      formActions.unregister('get_current_screen');
    };
  }, [state.step, state.case_type, state.address_text, state.geo]);

  return (
    <div>
      {state.step === 1 && (
        <Screen1
          state={state}
          setState={setState}
          addressCandidates={addressCandidates}
          setAddressCandidates={setAddressCandidates}
          sessionToken={sessionToken}
        />
      )}
      {state.step === 2 && <Screen2 state={state} setState={setState} />}
      {state.step === 'success' && <SuccessScreen state={state} />}
      {state.step === 'resolver-loading' && <ResolverLoading />}
      {state.step === 'resolver-failure' && <ResolverFailure setState={setState} />}
      {state.step === 'resolver-nomatch' && <ResolverNoMatch setState={setState} />}
      {state.step === 'resolver-chooser' && <ResolverChooser state={state} setState={setState} />}
    </div>
  );
}

const CASE_OPTIONS: { value: CaseType; label: string; hint: string; note?: string }[] = [
  {
    value: 'existing_object',
    label: 'Esamą registruose matomą pastatą/patalpas.',
    hint: 'Butas, namas, patalpa ar kitas objektas, jau įregistruotas Nekilnojamojo turto registre.',
  },
  {
    value: 'new_build_project',
    label: 'Naujai statomą ar ką tik baigtą pastatą/patalpas šiame sklype.',
    hint: 'Projektas dar neįregistruotas arba neseniai baigtas — registruose gali nebūti duomenų.',
    note: 'Šiame vertinime naudosime sklypo duomenis ir jūsų pateiktą projekto informaciją.',
  },
  {
    value: 'land_only',
    label: 'Tik žemės sklypą (be šildomų pastatų).',
    hint: 'Gali būti ir visiškai tuščias sklypas, ir sklypas su atvira automobilių aikštele. Uždari garažai ar pastatai čia nepriklauso.',
    note: 'Šiame vertinime apžvelgsime tik žemės sklypą — be esamų ar būsimų šildomų pastatų.',
  },
];

const CASE_LABELS: Record<CaseType, string> = {
  existing_object: 'Esamas registruose matomas pastatas/patalpos.',
  new_build_project: 'Naujai statomas ar ką tik baigtas pastatas/patalpos.',
  land_only: 'Tik žemės sklypas.',
};

const NTR_REGEX = /^\d{4}-\d{4}-\d{4}(:\d{1,6})?$/;

const LOCATION_TITLE = 'Ką norite patikrinti?';

const URL_HELPERS: Record<string, string> = {
  existing_object: 'Jei turite skelbimo nuorodą — padės patikslinti objekto duomenis.',
  new_build_project: '⭐ Nauji projektai registruose dažnai dar nematomi — jūsų nuoroda yra svarbiausias duomenų šaltinis tiksliam vertinimui.',
  land_only: 'Jei turite skelbimo nuorodą — padės identifikuoti sklypą.',
  '': 'Skelbimas portale, projekto svetainė ar kitas šaltinis.',
};

const PDF_HELPERS: Record<string, string> = {
  existing_object: 'Energijos naudingumo sertifikatas ar kitas dokumentas. Jei turite — padės patikslinti vertinimą.',
  new_build_project: '⭐ Projekto brošiūra, techninis projektas ar sertifikatas — tai pagrindinė medžiaga, iš kurios sistema atliks vertinimą.',
  land_only: 'Sklypo dokumentas ar planavimo medžiaga.',
  '': 'Energijos sertifikatas, projekto aprašymas ar kitas dokumentas.',
};

const KWH_HELPERS: Record<string, string> = {
  existing_object: 'Jei žinote faktines sąnaudas iš sąskaitų ar skaitiklių — įveskite čia. Padės tiksliau įvertinti komfortą.',
  new_build_project: 'Jei žinote planuojamas projekto energijos sąnaudas — įveskite čia.',
  land_only: 'Šiam objektui energijos sąnaudos netaikomos.',
  '': 'Faktinės arba planuojamos energijos sąnaudos.',
};

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';

function Screen1({
  state,
  setState,
  addressCandidates,
  setAddressCandidates,
  sessionToken,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
  addressCandidates: { place_id: string; description: string; main_text: string; secondary_text: string }[];
  setAddressCandidates: React.Dispatch<React.SetStateAction<{ place_id: string; description: string; main_text: string; secondary_text: string }[]>>;
  sessionToken: string;
}) {
  const selected = state.case_type;
  const [ntrInput, setNtrInput] = useState('');
  const [ntrTouched, setNtrTouched] = useState(false);
  const [ntrExpanded, setNtrExpanded] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSteps, setResolveSteps] = useState<{ label: string; done: boolean }[]>([]);
  const [activeTab, setActiveTab] = useState<'address' | 'ntr' | 'map'>('address');

  // Map picker
  const [mapExpanded, setMapExpanded] = useState(false);
  const [geoSource, setGeoSource] = useState<'map' | 'address' | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const addressWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapExpanded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      const google = (window as any).google;
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 54.6872, lng: 25.2797 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const placeMarker = (latLng: any) => {
        if (markerRef.current) {
          markerRef.current.setPosition(latLng);
        } else {
          markerRef.current = new google.maps.Marker({ map, position: latLng, draggable: true });
          markerRef.current.addListener('dragend', (e: any) => {
            setState((s) => ({ ...s, geo: { lat: e.latLng.lat(), lng: e.latLng.lng() } }));
            setGeoSource('map');
          });
        }
        setState((s) => ({ ...s, geo: { lat: latLng.lat(), lng: latLng.lng() } }));
        setGeoSource('map');
      };

      map.addListener('click', (e: any) => {
        if (e.latLng) placeMarker(e.latLng);
      });

      if (searchRef.current) {
        const searchBox = new google.maps.places.SearchBox(searchRef.current);
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (!places || places.length === 0) return;
          const loc = places[0].geometry?.location;
          if (loc) { map.setCenter(loc); map.setZoom(16); placeMarker(loc); }
        });
      }

      mapInstanceRef.current = map;
    };

    if ((window as any).google?.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      mapInstanceRef.current = null;
    };
  }, [mapExpanded]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setAddressCandidates([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mapExpanded) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mapExpanded]);

  const ntrValid = NTR_REGEX.test(ntrInput.trim());
  const addressValid = addressInput.trim().length > 5;
  const geoValid = state.geo !== null;
  const mapPinActive = geoValid && geoSource === 'map';
  const locationValid = ntrValid || addressValid || geoValid;
  const canProceed = !!selected && locationValid;

  // P7-B8.2: pending candidates ref for the fill_address → select_address_candidate flow
  const pendingCandidatesRef = useRef<
    { place_id: string; description: string; main_text: string; secondary_text: string }[] | null
  >(null);

  function handleNtrChange(value: string) {
    let v = value.replace(/[^\d:]/g, '');
    const digits = v.replace(/\D/g, '');
    if (digits.length <= 4) v = digits;
    else if (digits.length <= 8) v = digits.slice(0, 4) + '-' + digits.slice(4);
    else v = digits.slice(0, 4) + '-' + digits.slice(4, 8) + '-' + digits.slice(8, 12);
    setNtrInput(v);
    setState((s) => ({ ...s, ntr_unique_number: v || null }));
  }

  async function handleAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setAddressInput(val);
    setState((s) => ({ ...s, address_text: val || null, geo: null }));
    setGeoSource(null);
    if (val.length < 2) { setAddressCandidates([]); return; }
    try {
      const r = await fetch(
        `${API_BASE}/v1/quickscan-lite/geocode?q=${encodeURIComponent(val)}&session_token=${sessionToken}`
      );
      const json = await r.json();
      setAddressCandidates(json.data?.candidates ?? []);
    } catch {
      setAddressCandidates([]);
    }
  }

  function handleAddressSelect(c: { place_id: string; description: string }) {
    setAddressInput(c.description);
    setAddressCandidates([]);
    setState((s) => ({ ...s, address_text: c.description }));
    fetch(`${API_BASE}/v1/quickscan-lite/geocode?q=__&place_id=${c.place_id}&session_token=${sessionToken}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.lat) {
          setState((s) => ({ ...s, geo: { lat: json.data.lat, lng: json.data.lng } }));
          setGeoSource('address');
        }
      })
      .catch(() => {});
  }

  const handleTesti = async () => {
    if (!state.case_type) return;
    setResolving(true);
    setResolveError(null);
    setResolveSteps([]);

    // Progressive reveal steps (shown regardless of API speed)
    const REVEAL_STEPS = [
      { label: 'Adresas rastas registruose', delay: 500 },
      { label: 'Ieškoma registro įrašo...', delay: 1200 },
      { label: 'Tikrinama paskirtis ir plotas...', delay: 1800 },
      { label: 'Tikrinami energijos duomenys...', delay: 2500 },
      { label: 'Surenkame duomenis...', delay: 3000 },
    ];

    // Start progressive reveal animation
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    for (const s of REVEAL_STEPS) {
      stepTimers.push(setTimeout(() => {
        setResolveSteps(prev => [...prev, { label: s.label, done: true }]);
      }, s.delay));
    }

    try {
      const r = await fetch(`${API_BASE}/v1/quickscan-lite/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_type: state.case_type,
          ntr_unique_number: state.ntr_unique_number,
          address_text: state.address_text,
          geo: state.geo,
          project_website_url: state.project_website_url,
          project_doc_id: state.project_doc_id,
        }),
      });
      const json = await r.json();
      if (!json.ok) throw new Error('Resolver error');

      // Wait for animation to finish (min 3.5s total)
      const elapsed = performance.now();
      const minWait = 3500;
      const remaining = minWait - elapsed;
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      setState((s) => ({ ...s, resolver_result: json.data, step: 2 }));
    } catch {
      stepTimers.forEach(clearTimeout);
      setResolveError('Nepavyko prisijungti prie serverio. Bandykite dar kartą.');
    } finally {
      setResolving(false);
      setResolveSteps([]);
    }
  };

  // P7-B8.2: Register Screen 1 form actions for the AI voice concierge.
  // Placed after all handlers so arrow-function references (handleTesti) are available.
  // These override the parent's get_current_screen with richer Screen 1 data.
  useEffect(() => {
    formActions.register('get_current_screen', () =>
      JSON.stringify({
        success: true,
        data: {
          screen: 'quickscan-step1',
          case_type: state.case_type ?? undefined,
          address_filled: !!state.address_text,
          current_address: state.address_text ?? undefined,
          has_geo: !!state.geo,
          ntr: state.ntr_unique_number ?? undefined,
          active_tab: activeTab,
          address_input: addressInput || undefined,
          ntr_input: ntrInput || undefined,
          can_proceed: canProceed,
        },
      }),
    );

    formActions.register('select_case_type', (args) => {
      const caseType = args.case_type as string;
      const valid = ['existing_object', 'new_build_project', 'land_only'];
      if (!valid.includes(caseType)) {
        return JSON.stringify({ success: false, error: 'invalid_case_type', message: 'Neteisingas objekto tipas.' });
      }
      setState((s) => ({ ...s, case_type: caseType as CaseType }));
      return JSON.stringify({ success: true, case_type: caseType });
    });

    formActions.register('fill_address', async (args) => {
      const query = (args.address as string)?.trim();
      if (!query) {
        return JSON.stringify({ success: false, error: 'empty_address', message: 'Adresas tuščias.' });
      }

      setAddressInput(query);
      setActiveTab('address');
      setState((s) => ({ ...s, address_text: query, geo: null }));
      setGeoSource(null);

      try {
        const r = await fetch(
          `${API_BASE}/v1/quickscan-lite/geocode?q=${encodeURIComponent(query)}&session_token=${sessionToken}`,
        );
        const json = await r.json();
        const candidates: { place_id: string; description: string; main_text: string; secondary_text: string }[] =
          json.data?.candidates ?? [];

        if (candidates.length === 0) {
          setAddressCandidates([]);
          return JSON.stringify({
            success: false,
            error: 'no_results',
            message: 'Pagal šį adresą nieko nerasta. Pabandykite tiksliau.',
          });
        }

        if (candidates.length === 1) {
          handleAddressSelect(candidates[0]);
          return JSON.stringify({
            success: true,
            auto_selected: true,
            address: candidates[0].description,
          });
        }

        // Multiple candidates — show dropdown and store for select_address_candidate
        setAddressCandidates(candidates);
        pendingCandidatesRef.current = candidates;
        return JSON.stringify({
          success: true,
          needs_selection: true,
          candidates: candidates.map((c, i) => ({
            index: i,
            address: c.description,
          })),
        });
      } catch {
        return JSON.stringify({ success: false, error: 'geocode_failed', message: 'Geocode klaida.' });
      }
    });

    formActions.register('select_address_candidate', (args) => {
      const index = args.index as number;
      const candidates = pendingCandidatesRef.current;

      if (!candidates || !candidates[index]) {
        return JSON.stringify({
          success: false,
          error: 'invalid_index',
          message: 'Neteisingas kandidato indeksas.',
        });
      }

      handleAddressSelect(candidates[index]);
      pendingCandidatesRef.current = null;
      return JSON.stringify({ success: true, address: candidates[index].description });
    });

    formActions.register('fill_ntr', (args) => {
      const ntr = (args.ntr as string)?.trim();
      if (!ntr || !NTR_REGEX.test(ntr)) {
        return JSON.stringify({
          success: false,
          error: 'invalid_format',
          message: 'Neteisingas NTR formatas. Teisingas: 1234-5678-9012',
        });
      }
      handleNtrChange(ntr);
      setActiveTab('ntr');
      return JSON.stringify({ success: true, ntr });
    });

    formActions.register('click_continue', async () => {
      if (!canProceed) {
        return JSON.stringify({
          success: false,
          error: 'form_not_ready',
          message: 'Negalima tęsti — pasirinkite objekto tipą ir nurodykite vietą.',
        });
      }
      handleTesti();
      return JSON.stringify({ success: true });
    });

    return () => {
      formActions.unregister('select_case_type');
      formActions.unregister('fill_address');
      formActions.unregister('select_address_candidate');
      formActions.unregister('fill_ntr');
      formActions.unregister('click_continue');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.case_type, state.address_text, state.geo, state.ntr_unique_number, addressInput, ntrInput, activeTab, sessionToken, canProceed]);

  return (
    <div className="max-w-[1200px]">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-slide-in {
          animation: fadeSlideIn 0.35s ease forwards;
        }
      `}</style>
      {/* Location block */}
      <div className="mb-10">
          <h2 className="text-[32px] font-semibold text-[#1A1A2E] mb-6">
            {LOCATION_TITLE}
          </h2>

          {/* Case toggle */}
          <p className="text-[16px] font-semibold text-[#1E3A5F] mb-3">Nurodykite objektą</p>
          <div className="grid grid-cols-3 gap-2 mb-6" data-guide="qs-case-cards">
            {([
              { value: 'existing_object' as CaseType, emoji: '🏠', label: 'Esamą pastatą ar patalpas' },
              { value: 'new_build_project' as CaseType, emoji: '🏗️', label: 'Naujai statomą, nebaigtą projektą' },
              { value: 'land_only' as CaseType, emoji: '🌿', label: 'Tik žemės sklypą' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setState(s => ({ ...s, case_type: opt.value }))}
                className={[
                  'flex flex-col items-center justify-center rounded-[10px] border-2 py-3 px-5 cursor-pointer transition-all duration-200',
                  state.case_type === opt.value
                    ? 'border-[#0D7377] bg-[#E8F4F8] shadow-[0_0_0_1px_#0D7377]'
                    : 'border-[#E2E8F0] bg-white hover:border-[#0D7377] hover:bg-[#E8F4F8] hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
                ].join(' ')}
                style={{ height: '64px' }}
              >
                <span className="text-[20px] mb-1">{opt.emoji}</span>
                <span className={[
                  'text-[15px]',
                  state.case_type === opt.value
                    ? 'font-semibold text-[#0D7377]'
                    : 'font-medium text-[#1A1A2E]',
                ].join(' ')}>{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '24px' }}>

          {/* Top-left — Tabbed location card */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col" style={{ gridColumn: '1', gridRow: '1' }} data-guide="qs-location">
            <p className="text-[15px] font-medium text-[#1A1A2E] mb-3">Nurodykite vietą jums tinkamiausiu būdu</p>

            {/* Tab headers */}
            <div className="flex border-b border-[#E2E8F0] mb-0">
              <button
                onClick={() => setActiveTab('address')}
                className={`px-4 py-2.5 text-[14px] border-b-2 transition-all rounded-t-md ${
                  activeTab === 'address'
                    ? 'bg-[#E8F4F8] border-[#0D7377] text-[#1E3A5F] font-semibold'
                    : 'border-transparent text-[#64748B] font-medium hover:bg-[#FAFBFC] hover:text-[#1A1A2E]'
                }`}
              >
                Adresas
              </button>
              <button
                onClick={() => setActiveTab('ntr')}
                className={`px-4 py-2.5 text-[14px] border-b-2 transition-all rounded-t-md flex items-center gap-1.5 ${
                  activeTab === 'ntr'
                    ? 'bg-[#E8F4F8] border-[#0D7377] text-[#1E3A5F] font-semibold'
                    : 'border-transparent text-[#64748B] font-medium hover:bg-[#FAFBFC] hover:text-[#1A1A2E]'
                }`}
              >
                Unikalus Nr.
                <span className="text-[10px] uppercase tracking-[0.05em] text-[#0D7377] bg-[#E8F4F8] px-1.5 py-0.5 rounded" style={{ fontSize: '10px' }}>Tiksliausias</span>
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-2.5 text-[14px] border-b-2 transition-all rounded-t-md ${
                  activeTab === 'map'
                    ? 'bg-[#E8F4F8] border-[#0D7377] text-[#1E3A5F] font-semibold'
                    : 'border-transparent text-[#64748B] font-medium hover:bg-[#FAFBFC] hover:text-[#1A1A2E]'
                }`}
              >
                Žemėlapis
              </button>
            </div>

            {/* Tab content — flex-grow to fill card height */}
            <div className="flex-1 flex flex-col pt-5">

              {/* Address tab */}
              {activeTab === 'address' && (
                <div className="flex flex-col">
                  <div className="relative" ref={addressWrapperRef}>
                    <input
                      type="text"
                      value={addressInput}
                      onChange={handleAddressChange}
                      onKeyDown={(e) => { if (e.key === 'Escape') setAddressCandidates([]); }}
                      placeholder="Pradėkite rašyti adresą (gatvė, numeris, miestas)..."
                      className="w-full px-4 rounded-lg border border-[#E2E8F0] bg-white text-[16px] outline-none focus:border-[#0D7377] transition-all"
                      style={{ height: '48px' }}
                    />
                    {addressCandidates.length > 0 && (
                      <ul className="absolute z-10 top-full left-0 right-0 bg-white border border-[#E2E8F0] rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {addressCandidates.map((c) => (
                          <li
                            key={c.place_id}
                            onClick={() => handleAddressSelect(c)}
                            className="px-4 py-3 text-[14px] cursor-pointer hover:bg-[#F1F5F9]"
                          >
                            <span className="font-medium text-[#1E3A5F]">{c.main_text}</span>
                            <span className="text-[#94A3B8] ml-1">{c.secondary_text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="text-[14px] text-[#64748B] mt-2">
                    Pasirinkite adresą iš pasiūlymų — sistema ras objektą automatiškai.
                  </p>
                </div>
              )}

              {/* NTR tab */}
              {activeTab === 'ntr' && (
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={ntrInput}
                    onChange={(e) => handleNtrChange(e.target.value)}
                    onBlur={() => setNtrTouched(true)}
                    placeholder="pvz., 1234-5678-9012"
                    maxLength={14}
                    className={[
                      'w-full px-4 rounded-lg border text-[16px] outline-none transition-all',
                      ntrValid
                        ? 'border-[#059669] bg-white'
                        : ntrTouched && ntrInput
                        ? 'border-[#DC3545] bg-white'
                        : 'border-[#E2E8F0] bg-white focus:border-[#0D7377]',
                    ].join(' ')}
                    style={{ height: '48px' }}
                  />
                  {ntrTouched && ntrInput && !ntrValid && (
                    <p className="text-[14px] text-[#DC3545] mt-1">Formatas: 1234-5678-9012</p>
                  )}
                  <p className="text-[14px] text-[#64748B] mt-2">
                    Tiksliausias būdas — kiekvienas objektas turi unikalų numerį Nekilnojamojo turto registre.
                  </p>
                  <a
                    href="https://www.registrucentras.lt/ntr/p/"
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 text-[16px] font-medium text-[#0D7377] hover:text-[#0B6268] mt-3 transition-colors"
                  >
                    Kur rasti unikalų numerį? ↗
                  </a>
                </div>
              )}

              {/* Map tab — trigger for fullscreen overlay */}
              {activeTab === 'map' && (
                <div className="flex flex-col">
                  {!mapPinActive ? (
                    <button
                      onClick={() => setMapExpanded(true)}
                      className="w-full flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFBFC] hover:border-[#0D7377] hover:bg-[#F0FAFA] transition-all cursor-pointer"
                      style={{ minHeight: '100px' }}
                    >
                      <span className="text-[32px]">📍</span>
                      <span className="text-[14px] text-[#64748B]">Spustelėkite, kad atidarytumėte žemėlapį</span>
                    </button>
                  ) : (
                    <div className="flex flex-col">
                      <div className="rounded-lg flex items-center justify-center" style={{ minHeight: '100px', background: '#F0F4F8' }}>
                        <div className="text-center">
                          <span className="text-[32px] block mb-2">📍</span>
                          <p className="text-[14px] text-[#0D7377] font-medium">
                            {'Koordinatės: ' + state.geo!.lat.toFixed(5) + ', ' + state.geo!.lng.toFixed(5)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { mapInstanceRef.current = null; markerRef.current = null; setMapExpanded(true); }}
                        className="mt-3 text-[14px] text-[#0D7377] underline self-start"
                      >
                        Keisti vietą žemėlapyje
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Top-right — URL card */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col" style={{ gridColumn: '2', gridRow: '1' }} data-guide="qs-listing-url">
              <label className="block text-[15px] font-medium text-[#1A1A2E] mb-2">
                Pridėkite skelbimo ar projekto nuorodą (jeigu turite)
              </label>
              <input
                type="url"
                placeholder="pvz., https://www.aruodas.lt/..."
                onChange={(e) =>
                  setState((s) => ({ ...s, project_website_url: e.target.value || null }))
                }
                className="w-full px-4 rounded-lg border border-[#E2E8F0] bg-white text-[16px] outline-none focus:border-[#0D7377] transition-all"
                style={{ height: '48px' }}
              />
              <p className={`text-[14px] mt-2 transition-all duration-200 ${state.case_type === 'new_build_project' ? 'text-[#0D7377] font-medium' : 'text-[#64748B]'}`}>
                {URL_HELPERS[state.case_type ?? '']}
              </p>
          </div>

          {/* Bottom row — PDF card (spans full or half) + kWh card (existing_object only) */}
          <div className={`rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col transition-all duration-300`}
            style={{ gridColumn: state.case_type === 'existing_object' ? undefined : '1 / -1' }} data-guide="qs-document">
              <label className="block text-[15px] font-medium text-[#1A1A2E] mb-2">
                Įkelkite dokumentą
              </label>
              <label className="flex-1 flex items-center justify-center gap-3 px-4 rounded-lg border border-dashed border-[#E2E8F0] bg-[#FAFBFC] cursor-pointer hover:border-[#0D7377] hover:bg-[#F0FAFA] transition-all" style={{ minHeight: '64px' }}>
                <span className="text-[#0D7377] text-2xl">📄</span>
                <span className="text-[14px] text-[#64748B]">
                  {state.project_doc_id
                    ? '✓ Dokumentas įkeltas'
                    : 'Pasirinkite PDF failą arba nutempkite čia'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const r = await fetch(`${API_BASE}/v1/quickscan-lite/upload-project-doc`, {
                        method: 'POST',
                        body: formData,
                      });
                      const json = await r.json();
                      if (json.ok) {
                        setState((s) => ({ ...s, project_doc_id: json.data.project_doc_id }));
                      }
                    } catch {
                      // silent fail — doc upload is optional
                    }
                  }}
                />
              </label>
              <p className={`text-[14px] mt-2 transition-all duration-200 ${state.case_type === 'new_build_project' ? 'text-[#0D7377] font-medium' : 'text-[#64748B]'}`}>
                {PDF_HELPERS[state.case_type ?? '']}
              </p>
          </div>

          {/* kWh card — existing_object only, fades in/out */}
          {state.case_type === 'existing_object' && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col"
            style={{ animation: 'fadeSlideIn 0.3s ease forwards' }} data-guide="qs-energy">
              <label className="block text-[15px] font-medium text-[#1A1A2E] mb-1">
                Faktinės energijos sąnaudos
              </label>
              <p className="text-[14px] text-[#64748B] mb-2">Jei žinote faktines sąnaudas iš sąskaitų ar skaitiklių — įveskite čia. Padės tiksliau įvertinti komfortą.</p>
              <div className="flex gap-3 items-center mb-3">
                <input
                  type="number"
                  value={state.user_epc?.kwhm2_year ?? ''}
                  onChange={e => setState(s => ({ ...s, user_epc: { ...s.user_epc, kwhm2_year: e.target.value ? Number(e.target.value) : undefined } }))}
                  placeholder="pvz., 120"
                  className="w-full px-4 rounded-lg border border-[#E2E8F0] bg-white text-[16px] outline-none focus:border-[#0D7377] transition-all"
                  style={{ height: '48px' }}
                />
                <span className="text-[14px] text-[#64748B] whitespace-nowrap">kWh/m² per metus</span>
              </div>
              {/* Scope selector */}
              <div className="flex flex-col gap-2 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="kwh-scope-s1" value="heating" className="accent-[#0D7377]" defaultChecked />
                  <span className="text-[14px] text-[#64748B]">Tik šildymas</span>
                </label>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="kwh-scope-s1" value="all" className="accent-[#0D7377]" />
                    <span className="text-[14px] text-[#64748B]">Visas komfortas (šildymas + karštas vanduo + vėsinimas)</span>
                  </label>
                  <p className="text-[13px] text-[#94A3B8] mt-1 ml-6">Bendra energija patalpų šildymui, karšto vandens ruošimui ir vėsinimui.</p>
                </div>
              </div>
          </div>
          )}

          </div>
      </div>

      {/* Tęsti + progressive resolve */}
      {resolveError && (
        <p className="text-sm text-[#DC3545] mb-3">{resolveError}</p>
      )}

      {resolving ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] p-6 max-w-md shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-[16px] font-semibold text-[#1E3A5F] mb-4">Ieškome jūsų objekto...</p>
          <div className="flex flex-col gap-2.5">
            {resolveSteps.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[14px]"
                style={{ animation: 'fadeSlideIn 0.3s ease forwards' }}
              >
                <span className="text-[#059669]">✓</span>
                <span className="text-[#1A1A2E]">{s.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-[14px] text-[#94A3B8]">
              <svg className="animate-spin h-4 w-4 text-[#94A3B8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span>Ieškoma...</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleTesti}
          disabled={!canProceed}
          data-guide="qs-submit"
          className={`px-8 rounded-lg text-[16px] font-medium transition-all flex items-center gap-2
            ${canProceed
              ? 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer'
              : 'bg-[#CBD5E1] text-white cursor-not-allowed'}`}
          style={{ height: '48px' }}
        >
          Tęsti
        </button>
      )}

      {/* Fullscreen map overlay — rendered outside fade-slide-in to avoid transform containing block */}
      {mapExpanded && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col" style={{ paddingBottom: '70px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
            <span className="text-[16px] font-semibold text-[#1E3A5F]">Taškas žemėlapyje</span>
            <button
              onClick={() => { if (!geoValid) { mapInstanceRef.current = null; markerRef.current = null; } setMapExpanded(false); }}
              className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B] text-lg"
            >✕</button>
          </div>
          {/* Search */}
          <div className="px-4 py-2">
            <input
              ref={searchRef}
              type="text"
              placeholder="Ieškoti adreso žemėlapyje..."
              className="w-full px-3 py-2 rounded-md border border-[#E2E8F0] text-sm outline-none focus:border-[#0D7377] transition-all"
            />
          </div>
          {/* Map — fills remaining space */}
          <div className="flex-1 px-4 pb-2">
            <div ref={mapRef} style={{ height: '100%', borderRadius: '8px' }} />
          </div>
          {/* Footer buttons */}
          <div className="flex gap-2 px-4 py-3 border-t border-[#E2E8F0]">
            {geoValid && (
              <button
                onClick={() => setMapExpanded(false)}
                className="flex-1 py-2.5 rounded-md bg-[#0D7377] text-white text-sm font-medium"
              >
                Patvirtinti vietą
              </button>
            )}
            <button
              onClick={() => { if (!geoValid) { mapInstanceRef.current = null; markerRef.current = null; } setMapExpanded(false); }}
              className="flex-1 py-2.5 rounded-md border border-[#E2E8F0] text-sm text-[#64748B]"
            >
              {geoValid ? 'Atšaukti' : 'Uždaryti'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const KIND_LABELS: Record<Candidate['kind'], string> = {
  whole_building: 'Pastatas',
  unit_in_building: 'Patalpa pastate',
  land_plot: 'Žemės sklypas',
};


function EpcCard({
  state,
  setState,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
}) {
  const epc = state.user_epc ?? {};
  const kwhVal = epc.kwhm2_year;
  const kwhWarning = kwhVal !== undefined && (kwhVal < 10 || kwhVal > 1000);

  function updateEpc(patch: Partial<NonNullable<QuickScanState['user_epc']>>) {
    setState(s => ({ ...s, user_epc: { ...s.user_epc, ...patch } }));
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4">
      <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">
        Energijos naudingumo duomenys (pasirinktinai)
      </h3>

      <div className="flex flex-col gap-4">
        {/* PDF upload */}
        <div>
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1.5">
            Energinio naudingumo sertifikatas (PDF)
          </label>
          <div className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-4 text-center cursor-pointer hover:border-[#0D7377] transition-colors">
            <div className="text-sm text-[#64748B]">📄 Įkelti sertifikatą</div>
            <div className="text-xs text-[#94A3B8] mt-1">PDF · sistema automatiškai nuskaitys duomenis</div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          {/* kWh/m² manual entry */}
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1.5">
            Faktinės energijos sąnaudos (iš sąskaitų / skaitiklių)
          </label>
          <div className="flex gap-3 items-center mb-3">
            <input
              type="number"
              value={epc.kwhm2_year ?? ''}
              onChange={e => updateEpc({ kwhm2_year: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="pvz. 145"
              className={`w-32 px-3 py-2.5 border rounded-md text-sm text-[#1E3A5F] outline-none focus:border-[#0D7377] ${kwhWarning ? 'border-[#F59E0B]' : 'border-[#E2E8F0]'}`}
            />
            <span className="text-xs text-[#64748B]">kWh/m² per metus</span>
          </div>
          {kwhWarning && (
            <p className="text-xs text-[#F59E0B] mb-2">Neįprasta reikšmė — patikrinkite.</p>
          )}
          {/* Scope selector */}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="kwh-scope" value="heating" className="accent-[#0D7377]" defaultChecked />
              <span className="text-xs text-[#64748B]">Tik šildymas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="kwh-scope" value="all" className="accent-[#0D7377]" />
              <span className="text-xs text-[#64748B]">Visas komfortas (šildymas + vėsinimas + kt.)</span>
            </label>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] mt-4 pt-4 border-t border-[#F1F5F9]">
        Jei nepateiksite — vertinimui bus naudojami registrų duomenys.
      </p>
    </div>
  );
}

function Screen2({
  state,
  setState,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
}) {
  // Dev: detect ?step= for pre-filled states
  const devStep = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('step') : null;
  const isDevPayment = devStep === '2-payment';
  const isDevDuplicate = devStep === 'duplicate';

  const [objectConfirmed, setObjectConfirmed] = useState(isDevPayment || isDevDuplicate);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeCardReady, setStripeCardReady] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ order_id: string; paid_at: string; address: string } | null>(
    isDevDuplicate ? { order_id: 'dev-dup-001', paid_at: '2026-03-30T10:15:00Z', address: 'Vilnius, Žirmūnų g. 12' } : null
  );
  const [resendDone, setResendDone] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(isDevPayment);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const cardMountRef = useRef<HTMLDivElement>(null);
  const invoiceSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when invoice fields expand — ensure all fields visible above marquee
  useEffect(() => {
    if ((state.invoice_requested || state.invoice_is_company) && invoiceSectionRef.current) {
      setTimeout(() => {
        const el = invoiceSectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const marqueeHeight = 60;
        const desiredGap = 100;
        const viewportBottom = window.innerHeight - marqueeHeight - desiredGap;
        if (rect.bottom > viewportBottom) {
          window.scrollBy({ top: rect.bottom - viewportBottom + 40, behavior: 'smooth' });
        }
      }, 350);
    }
  }, [state.invoice_requested, state.invoice_is_company]);

  const resolver = state.resolver_result;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email);
  const canPay = objectConfirmed && state.quote && emailValid && state.consent_accepted && !paying;

  if (!resolver) return null;

  // Reassurance screen
  if (state.payment_complete) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#EEF9F9] flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-4">Patvirtinome jūsų užsakymą.</h1>
          <p className="text-sm text-[#64748B] max-w-md leading-relaxed">
            Pradėjome informacijos paiešką registruose, duomenų tikrinimą ir visų blokų skaičiavimus. Ataskaitą el. paštu paprastai išsiunčiame greitai, bet gali užtrukti iki 1 valandos.
          </p>
        </div>
      </div>
    );
  }

  // Non-resolved: low_confidence / no_match / error
  if (resolver.status === 'low_confidence' || resolver.status === 'no_match' || resolver.status === 'error') {
    const msg = resolver.message_lt ?? 'Nepavyko rasti objekto. Bandykite kitu būdu.';
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-[#64748B] mb-4">{msg}</p>
        <button
          onClick={() => setState(s => ({ ...s, step: 1 }))}
          className="px-6 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#1E3A5F] transition-all"
        >
          Atgal
        </button>
      </div>
    );
  }

  // Chooser: ambiguous + no candidate selected yet
  if (resolver.status === 'ambiguous' && state.selected_candidate_id === null) {
    const groups: { kind: Candidate['kind']; label: string; candidates: Candidate[] }[] = [];
    const seen = new Set<string>();
    for (const c of resolver.candidates) {
      if (!seen.has(c.kind)) {
        seen.add(c.kind);
        groups.push({ kind: c.kind, label: KIND_LABELS[c.kind], candidates: [] });
      }
      groups.find(g => g.kind === c.kind)!.candidates.push(c);
    }
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1">Pasirinkite tikslų objektą</h1>
        <p className="text-sm text-[#64748B] mb-6">Radome kelis galimus atitikmenis. Pasirinkite vieną.</p>
        <div className="flex flex-col gap-6 mb-6">
          {groups.map(g => (
            <div key={g.kind}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mb-2">{g.label}</p>
              <div className="flex flex-col gap-2">
                {g.candidates.map(c => (
                  <div key={c.candidate_id} onClick={() => setState(s => ({ ...s, selected_candidate_id: c.candidate_id }))}
                    className="cursor-pointer rounded-lg border border-[#E2E8F0] bg-white px-5 py-4 hover:border-[#0D7377] hover:bg-[#EEF9F9] transition-all">
                    <p className="text-sm font-semibold text-[#1E3A5F]">{c.address}</p>
                    {c.ntr_unique_number && <p className="text-xs text-[#64748B] mt-1">Unikalus Nr.: {c.ntr_unique_number}</p>}
                    {c.municipality && <p className="text-xs text-[#64748B]">Savivaldybė: {c.municipality}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setState(s => ({ ...s, step: 1 }))}
          className="px-6 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#1E3A5F] transition-all">
          Atgal
        </button>
      </div>
    );
  }

  // Resolved or candidate selected — show merged confirm + payment
  const candidate = resolver.status === 'resolved'
    ? resolver.candidates[0]
    : resolver.candidates.find(c => c.candidate_id === state.selected_candidate_id);
  if (!candidate) return null;

  const handleConfirmObject = async () => {
    setObjectConfirmed(true);
    setQuoting(true);
    setQuoteError(null);
    try {
      const confirmRes = await fetch(`${API_BASE}/v1/quickscan-lite/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.candidate_id,
          case_type: state.case_type,
          address: candidate.address,
          ntr_unique_number: candidate.ntr_unique_number ?? null,
          municipality: candidate.municipality ?? null,
          kind: candidate.kind,
          bundle_item_count: candidate.bundle_items.length,
          user_energy_class: null,
          user_epc_kwhm2_year: state.user_epc?.kwhm2_year ?? null,
          user_epc_issue_year: null,
          user_epc_issue_year_unknown: false,
          discount_token: state.discount_token ?? null,
        }),
      });
      const confirmJson = await confirmRes.json();
      if (!confirmJson.ok) throw new Error('confirm failed');
      const { bundle_signature, bundle_id, bundle_size, has_new_build_project } = confirmJson.data;
      const quoteBody: Record<string, unknown> = { bundle_signature, bundle_id, bundle_size, has_new_build_project };
      if (state.discount_token) quoteBody.promo = state.discount_token;
      const quoteRes = await fetch(`${API_BASE}/v1/quickscan-lite/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteBody),
      });
      const json = await quoteRes.json();
      if (!json.ok) throw new Error('Quote error');
      setState(s => ({ ...s, selected_candidate_id: candidate.candidate_id, quote: json.data as QuoteData }));
    } catch {
      setQuoteError('Klaida gaunant kainą. Bandykite dar kartą.');
      setObjectConfirmed(false);
    } finally {
      setQuoting(false);
    }
  };

  const handlePayment = async () => {
    if (!canPay || !state.quote) return;
    setPaying(true);
    setPayError(null);
    try {
      const r = await fetch(`${API_BASE}/v1/quickscan-lite/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: state.quote.quote_id,
          customer_email: state.email,
          invoice_requested: state.invoice_requested,
          consent_flags: {
            terms_accepted: true,
            privacy_accepted: true,
            marketing_consent: false,
            timestamp: new Date().toISOString(),
          },
          bundle_signature: state.selected_candidate_id ?? state.quote.bundle_id ?? '',
        }),
      });
      const json = await r.json();
      if (!json.ok) {
        if (json.error_code === 'duplicate_order' && json.data) {
          setDuplicateInfo({
            order_id: json.data.existing_order_id,
            paid_at: json.data.paid_at,
            address: json.data.address,
          });
          return;
        }
        if (json.error_code === 'quote_expired') {
          setPayError('Kainos galiojimas baigėsi. Prašome grįžti ir patvirtinti objektą iš naujo.');
        } else {
          setPayError('Mokėjimo klaida. Bandykite dar kartą.');
        }
        return;
      }
      const { client_secret, order_id } = json.data;
      setState(s => ({ ...s, order_id }));

      // Stub mode — skip Stripe, go to success
      if (client_secret.startsWith('pi_stub') || client_secret === 'stub') {
        await new Promise(r => setTimeout(r, 500));
        setState(s => ({ ...s, order_id, payment_complete: true, step: 'success' as const }));
        return;
      }

      // Load Stripe lazily
      const { getStripe } = await import('../lib/stripe');
      const stripe = await getStripe();
      if (!stripe) {
        // No publishable key — stub mode fallback
        await new Promise(r => setTimeout(r, 500));
        setState(s => ({ ...s, order_id, payment_complete: true, step: 'success' as const }));
        return;
      }

      stripeRef.current = stripe;
      setClientSecret(client_secret);

      // Mount Payment Element after state update
      requestAnimationFrame(() => {
        const elements = stripe.elements({
          clientSecret: client_secret,
          appearance: {
            theme: 'stripe' as const,
            variables: {
              colorPrimary: '#1E3A5F',
              colorBackground: '#FFFFFF',
              colorText: '#1A1A2E',
              colorDanger: '#EF4444',
              fontFamily: 'Inter, system-ui, sans-serif',
              borderRadius: '8px',
              fontSizeBase: '16px',
            },
            rules: {
              '.Input': { border: '1px solid #E2E8F0', padding: '12px 16px', boxShadow: 'none' },
              '.Input:focus': { border: '1px solid #0D7377', boxShadow: '0 0 0 1px #0D7377' },
              '.Label': { fontWeight: '500', marginBottom: '6px' },
            },
          },
          locale: 'lt',
        });
        elementsRef.current = elements;

        const paymentElement = elements.create('payment', { layout: 'tabs' });
        if (cardMountRef.current) {
          paymentElement.mount(cardMountRef.current);
        }

        paymentElement.on('change', (event: any) => {
          setStripeCardReady(event.complete);
          if (event.error) {
            setPayError(event.error.message);
          } else {
            setPayError(null);
          }
        });

        // Auto-scroll to show card input
        setTimeout(() => {
          cardMountRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      });
    } catch {
      setPayError('Mokėjimo klaida. Bandykite dar kartą.');
    } finally {
      setPaying(false);
    }
  };

  const handleStripeConfirm = async () => {
    if (!stripeRef.current || !elementsRef.current || !clientSecret) return;
    setPaying(true);
    setPayError(null);
    try {
      const { error, paymentIntent } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {},
        redirect: 'if_required',
      });
      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setPayError(error.message);
        } else {
          setPayError('Mokėjimo klaida. Bandykite dar kartą.');
        }
      } else if (paymentIntent?.status === 'succeeded') {
        setState(s => ({ ...s, payment_complete: true, step: 'success' as const }));
      }
    } finally {
      setPaying(false);
    }
  };

  const PAYMENT_METHODS = [
    { id: 'swedbank', label: 'Swedbank', logo: '/images/payment/swedbank.svg', provider: 'paysera' },
    { id: 'seb', label: 'SEB', logo: '/images/payment/seb.svg', provider: 'paysera' },
    { id: 'luminor', label: 'Luminor', logo: '/images/payment/luminor.svg', provider: 'paysera' },
    { id: 'citadele', label: 'Citadele', logo: '/images/payment/citadele.svg', provider: 'paysera' },
    { id: 'revolut', label: 'Revolut', logo: '/images/payment/revolut.svg', provider: 'paysera' },
    { id: 'paysera', label: 'Paysera', logo: '/images/payment/paysera.svg', provider: 'paysera' },
    { id: 'card', label: 'Visa / MC', logo: '/images/payment/visa-mastercard.svg', provider: 'stripe' },
    { id: 'apple-pay', label: 'Apple Pay', logo: '/images/payment/apple-pay.svg', provider: 'stripe' },
    { id: 'google-pay', label: 'Google Pay', logo: '/images/payment/google-pay.svg', provider: 'stripe' },
    { id: 'paypal', label: 'PayPal', logo: '/images/payment/paypal.svg', provider: 'stripe' },
  ] as const;

  const handlePayseraPayment = async (bankCode: string) => {
    if (!canPay || !state.quote) return;
    setPaying(true);
    setPayError(null);
    try {
      const r = await fetch(`${API_BASE}/v1/quickscan-lite/payment-init-paysera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: state.quote.quote_id,
          customer_email: state.email,
          invoice_requested: state.invoice_requested,
          consent_flags: { terms_accepted: true, privacy_accepted: true, marketing_consent: false, timestamp: new Date().toISOString() },
          bundle_signature: state.selected_candidate_id ?? state.quote.bundle_id ?? '',
          bank_code: bankCode,
        }),
      });
      const json = await r.json();
      if (!json.ok) {
        if (json.error_code === 'duplicate_order' && json.data) {
          setDuplicateInfo({ order_id: json.data.existing_order_id, paid_at: json.data.paid_at, address: json.data.address });
          return;
        }
        if (json.error_code === 'quote_expired') { setPayError('Kainos galiojimas baigėsi. Prašome grįžti ir patvirtinti objektą iš naujo.'); }
        else { setPayError('Mokėjimo klaida. Bandykite dar kartą arba pasirinkite kitą banką.'); }
        return;
      }
      const { redirect_url, order_id } = json.data;
      setState(s => ({ ...s, order_id }));
      const { redirectToPaysera } = await import('../lib/paysera');
      redirectToPaysera(redirect_url);
    } catch {
      setPayError('Mokėjimo klaida. Bandykite dar kartą.');
    } finally {
      setPaying(false);
    }
  };

  const handleMethodConfirm = () => {
    if (!selectedMethod) return;
    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    if (!method) return;
    if (method.provider === 'paysera') handlePayseraPayment(method.id);
    else handlePayment(); // Stripe path for card, Apple Pay, Google Pay, PayPal
  };

  if (false) { // expired error now shown inline
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-[#64748B] mb-4">Jūsų užklausa pasibaigė. Grįžkite ir pradėkite iš naujo.</p>
        <button onClick={() => setState(s => ({ ...s, step: 1 }))}
          className="px-6 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#1E3A5F] transition-all">
          Atgal
        </button>
      </div>
    );
  }

  const quote = state.quote;

  const REPORT_BLOCKS = [
    { emoji: '🌡️', name: 'Šiluminis komfortas', heatedOnly: true },
    { emoji: '⚡', name: 'Energijos sąnaudos', heatedOnly: true },
    { emoji: '📊', name: '10 metų išlaidos', heatedOnly: true },
    { emoji: '🌿', name: 'Oro ir vandens tarša', heatedOnly: false },
    { emoji: '🔇', name: 'Triukšmo tarša', heatedOnly: false },
    { emoji: '💰', name: 'Kainos pagrįstumas', heatedOnly: false },
    { emoji: '⚖️', name: 'Teisinės rizikos', heatedOnly: false },
    { emoji: '🎯', name: 'Derybų strategija', heatedOnly: false },
  ];

  const caseType = state.case_type;

  return (
    <div className="max-w-[1100px] mx-auto px-8 pb-[120px]" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: '24px', width: '100%' }}>

      {/* TOP-LEFT — Proof card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" style={{ gridColumn: 1, gridRow: 1 }} data-guide="qs-proof">
        <h2 className="text-[18px] font-semibold text-[#1A1A2E] mb-1">Patvirtinkite objektą</h2>
        <p className="text-[14px] text-[#64748B] mb-4">Radome atitinkantį įrašą. Patikrinkite, ar tai tas pats objektas.</p>

        <div className={`rounded-lg border px-5 py-4 mb-4 transition-all ${objectConfirmed ? 'border-[#059669] bg-[#F0FDF4]' : 'border-[#E2E8F0] bg-[#FAFBFC]'}`}
          style={objectConfirmed ? { position: 'sticky', top: 80, zIndex: 5 } : undefined}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[16px] font-bold text-[#1E3A5F] mb-2">{candidate.address}</p>
              {candidate.ntr_unique_number && <p className="text-[14px] text-[#64748B] mb-1">Unikalus Nr.: {candidate.ntr_unique_number}</p>}
              {candidate.municipality && <p className="text-[14px] text-[#64748B] mb-1">Savivaldybė: {candidate.municipality}</p>}
              {candidate.bundle_items.length > 0 && <p className="text-[14px] text-[#94A3B8] mt-2">Komplekte taip pat yra: {candidate.bundle_items.map((b: any) => b.kind || b.address).join(', ')}.</p>}
            </div>
            {objectConfirmed && (
              <div className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </div>
          <p className="text-[13px] text-[#94A3B8] mt-3 pt-3 border-t border-[#F1F5F9]">Vertinimas taikomas pagrindiniam šildomam objektui.</p>
        </div>

        {!objectConfirmed && (
          <div className="flex gap-3">
            <button onClick={handleConfirmObject} disabled={quoting}
              className={`px-6 py-3 rounded-lg text-[14px] font-semibold transition-all flex items-center gap-2 ${quoting ? 'bg-[#CBD5E1] text-white cursor-not-allowed' : 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer'}`}>
              {quoting ? (<><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Tikrinama…</>) : 'Taip, teisingas'}
            </button>
            <button onClick={() => setState(s => ({ ...s, step: 1, resolver_result: null, geo: null, address_text: null, ntr_unique_number: null, selected_candidate_id: null }))}
              className="px-6 py-3 rounded-lg border border-[#E2E8F0] text-[14px] text-[#64748B] hover:border-[#1E3A5F] transition-all">
              Ne, ieškoti kito
            </button>
          </div>
        )}
        {quoteError && (
          <div className="flex items-center gap-3 mt-3">
            <p className="text-sm text-[#DC3545]">{quoteError}</p>
            <button onClick={handleConfirmObject} className="text-sm text-[#0D7377] underline">Bandyti dar kartą</button>
          </div>
        )}
      </div>

      {/* TOP-RIGHT — Report blocks card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" style={{ gridColumn: 2, gridRow: 1 }} data-guide="qs-report-blocks">
        <h2 className="text-[18px] font-semibold text-[#1A1A2E] mb-4">
          {caseType === 'new_build_project'
            ? 'Šie duomenų blokai bus įtraukti į ataskaitą. Kadangi projektas gali būti dar neregistruotas, dalis vertinimų remiasi projekto duomenimis:'
            : caseType === 'land_only'
            ? 'Šie duomenų blokai bus įtraukti į ataskaitą. Šiluminio komforto blokai taikomi tik šildomiems pastatams:'
            : 'Šie duomenų blokai bus įtraukti į ataskaitą:'}
        </h2>

        <div className="flex flex-col gap-1">
          {REPORT_BLOCKS.map((block, i) => {
            const isDisabled = caseType === 'land_only' && block.heatedOnly;
            const isProjectData = caseType === 'new_build_project' && block.heatedOnly;
            return (
              <div key={i} className={`flex items-center gap-2 py-1.5 ${isDisabled ? 'opacity-40' : ''}`}>
                <span className="text-[14px]">{isDisabled ? '—' : '✅'}</span>
                <span className="text-[18px]">{block.emoji}</span>
                <span className={`text-[14px] font-medium ${isDisabled ? 'text-[#C4C4C4]' : 'text-[#1A1A2E]'}`}>{block.name}</span>
                {isDisabled && <span className="text-[12px] text-[#C4C4C4] ml-1">(netaikoma)</span>}
                {isProjectData && <span className="text-[12px] text-[#94A3B8] ml-1">(pagal projekto duomenis)</span>}
              </div>
            );
          })}
        </div>

        <p className="text-[13px] text-[#64748B] mt-4 pt-3 border-t border-[#F1F5F9]">
          Nuoroda į ataskaitą bus išsiųsta el. paštu per 1 val.
        </p>
      </div>

      {/* BOTTOM — Payment card (full width) */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" style={{ gridColumn: '1 / -1', gridRow: 2 }} data-guide="qs-payment">
        {quote ? (
          <>
            {/* Two-column: price left, vertical flow right */}
            <div className="grid grid-cols-[auto_1fr] gap-8">
              {/* Left — Price (fixed) */}
              <div className="flex flex-col items-start pt-1">
                {quote.special_discount_applied && quote.base_price_eur > quote.final_price_eur ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[20px] font-medium text-[#94A3B8] line-through">{quote.base_price_eur} €</span>
                      <span className="text-[32px] font-semibold text-[#1E3A5F]">{quote.final_price_eur} €</span>
                      <span className="text-[12px] font-semibold text-[#059669] bg-[#E8F8EE] px-2 py-0.5 rounded">✓ Nuolaida pritaikyta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] text-[#64748B]">/ objektas</span>
                      <span className="text-[14px] font-medium text-[#059669]">-{quote.discount_amount_eur} €</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[32px] font-semibold text-[#1E3A5F]">{quote.final_price_eur} €</span>
                    <span className="text-[14px] text-[#64748B]">/ objektas</span>
                  </>
                )}
              </div>

              {/* Right — vertical flow */}
              <div className="flex flex-col" ref={invoiceSectionRef} data-guide="qs-email-consent">
                {/* Email */}
                <div className="mb-4">
                  <label className="block text-[14px] font-medium text-[#1A1A2E] mb-1">El. pašto adresas</label>
                  <input type="email" value={state.email}
                    onChange={e => setState(s => ({ ...s, email: e.target.value }))}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="vardas@pastas.lt"
                    className={`w-full px-4 py-3 rounded-lg border text-[16px] outline-none focus:border-[#0D7377] transition-all ${emailTouched && !emailValid ? 'border-[#DC3545]' : 'border-[#E2E8F0]'}`} />
                  {emailTouched && !emailValid && <p className="text-xs text-[#DC3545] mt-1">Įveskite teisingą el. pašto adresą.</p>}
                  <p className="text-[13px] text-[#64748B] mt-1">Ataskaitą išsiųsime šiuo adresu.</p>
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={state.consent_accepted}
                    onChange={e => setState(s => ({ ...s, consent_accepted: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 accent-[#0D7377] flex-shrink-0" />
                  <span className="text-[14px] text-[#64748B]">
                    Sutinku su <a href="/salygos" className="text-[#0D7377] underline">sąlygomis</a> ir <a href="/privatumas" className="text-[#0D7377] underline">privatumu</a>.
                  </span>
                </label>

                {/* Invoice checkbox */}
                <label className="flex items-center gap-2 cursor-pointer mb-1">
                  <input type="checkbox" checked={state.invoice_requested}
                    onChange={e => setState(s => ({ ...s, invoice_requested: e.target.checked }))}
                    className="w-4 h-4 accent-[#0D7377]" />
                  <span className="text-[14px] text-[#1E3A5F] font-medium">Reikia sąskaitos faktūros</span>
                </label>

                {/* Invoice fields — expand below */}
                {state.invoice_requested && (
                  <div className="ml-6 mt-2 mb-2 flex flex-col gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-[#1A1A2E] mb-1">Sąskaitos el. paštas</label>
                      <input type="email" value={state.invoice_email} onChange={e => setState(s => ({ ...s, invoice_email: e.target.value }))}
                        placeholder={state.email || 'vardas@pastas.lt'}
                        className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-[16px] outline-none focus:border-[#0D7377] transition-all" />
                      <p className="text-[13px] text-[#64748B] mt-1">Įveskite, jeigu norite sąskaitą gauti kitu el. pašto adresu</p>
                    </div>
                  </div>
                )}

                {/* Juridinis checkbox */}
                <label className="flex items-center gap-2 cursor-pointer mb-1 mt-1">
                  <input type="checkbox" checked={state.invoice_is_company}
                    onChange={e => setState(s => ({ ...s, invoice_is_company: e.target.checked, invoice_requested: e.target.checked ? true : state.invoice_requested }))}
                    className="w-4 h-4 accent-[#0D7377]" />
                  <span className="text-[14px] text-[#1E3A5F] font-medium">Juridinis asmuo</span>
                </label>

                {/* Company fields — expand below */}
                {state.invoice_is_company && (
                  <div className="ml-6 mt-2 mb-2 flex flex-col gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-[#1A1A2E] mb-1">Įmonės pavadinimas</label>
                      <input type="text" value={state.invoice_company_name} onChange={e => setState(s => ({ ...s, invoice_company_name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-[16px] outline-none focus:border-[#0D7377] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#1A1A2E] mb-1">Įmonės kodas</label>
                      <input type="text" value={state.invoice_name} onChange={e => setState(s => ({ ...s, invoice_name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-[16px] outline-none focus:border-[#0D7377] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#1A1A2E] mb-1">PVM mokėtojo kodas</label>
                      <input type="text" placeholder="LT..."
                        className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-[16px] outline-none focus:border-[#0D7377] transition-all" />
                      <p className="text-[13px] text-[#64748B] mt-1">Jei esate PVM mokėtojas</p>
                    </div>
                  </div>
                )}

                {/* Stripe Payment Element (slides in after /payment-intent) */}
                {clientSecret && (
                  <div className="mt-4 pt-4 border-t border-[#F1F5F9] mb-4" style={{ animation: 'slideDown 0.3s ease' }}>
                    {clientSecret === 'pi_dev_mock_secret' ? (
                      /* Dev mock: visual representation of Stripe card input */
                      <div className="rounded-lg bg-[#FAFBFC] border border-[#E2E8F0] p-4">
                        <p className="text-[13px] font-medium text-[#1E3A5F] mb-3">Kortelės duomenys</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <div className="px-4 py-3 rounded-lg border border-[#E2E8F0] bg-white text-[16px] text-[#94A3B8]">4242 4242 4242 4242</div>
                          </div>
                          <div className="w-24">
                            <div className="px-4 py-3 rounded-lg border border-[#E2E8F0] bg-white text-[16px] text-[#94A3B8]">12/28</div>
                          </div>
                          <div className="w-20">
                            <div className="px-4 py-3 rounded-lg border border-[#E2E8F0] bg-white text-[16px] text-[#94A3B8]">123</div>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#E8A040] italic mt-2">⚙️ Dev mock — tikras Stripe Elements bus rodomas su pk_test_ raktu</p>
                      </div>
                    ) : (
                      <div ref={cardMountRef} className="py-2 px-1 rounded-lg bg-[#FAFBFC] border border-[#E2E8F0] p-4" />
                    )}
                  </div>
                )}

                {/* Payment errors */}
                {payError && (
                  <p className="text-[14px] text-[#EF4444] mb-3 mt-2">{payError}</p>
                )}

                {/* Duplicate purchase warning */}
                {duplicateInfo && (
                  <div className="mt-4 rounded-lg p-6" style={{ background: '#FEF3C7', border: '1px solid #F59E0B', animation: 'slideDown 0.3s ease' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-[24px]">⚠️</span>
                      <p className="text-[16px] font-semibold" style={{ color: '#92400E' }}>
                        Panašu, kad neseniai jau užsakėte ataskaitą šiam objektui.
                      </p>
                    </div>
                    <p className="text-[15px] font-semibold text-[#1A1A2E] mb-1">{duplicateInfo.address}</p>
                    <p className="text-[14px] mb-4" style={{ color: '#92400E' }}>
                      Užsakyta: {new Date(duplicateInfo.paid_at).toLocaleDateString('lt-LT')}, {new Date(duplicateInfo.paid_at).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {resendDone ? (
                      <p className="text-[15px] font-medium text-[#059669]">✓ Ataskaita išsiųsta iš naujo</p>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`${API_BASE}/v1/quickscan-lite/resend-report`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ order_id: duplicateInfo.order_id }),
                              });
                            } catch { /* silent */ }
                            setResendDone(true);
                          }}
                          className="flex-1 py-2.5 rounded-lg border text-[14px] font-medium transition-colors"
                          style={{ borderColor: '#F59E0B', color: '#D97706' }}
                        >
                          Persiųsti paskutinę ataskaitą
                        </button>
                        <button
                          onClick={() => {
                            setDuplicateInfo(null);
                            // Re-trigger payment with force flag
                            handlePayment();
                          }}
                          className="flex-1 py-2.5 rounded-lg bg-[#1E3A5F] text-white text-[14px] font-medium hover:bg-[#0D7377] transition-colors"
                        >
                          Vis tiek užsakyti iš naujo
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment flow — hidden when duplicate warning shown */}
                {!duplicateInfo && (
                  <div className="mt-6">
                    {clientSecret ? (
                      /* Stripe card input mounted — show confirm button */
                      <button onClick={handleStripeConfirm} disabled={paying || !stripeCardReady}
                        className={`w-full py-3 rounded-lg text-[16px] font-semibold transition-all flex items-center justify-center gap-2 ${paying || !stripeCardReady ? 'bg-[#CBD5E1] text-white cursor-not-allowed' : 'bg-[#1E3A5F] text-white hover:bg-[#0D7377] cursor-pointer'}`}>
                        {paying ? (<><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Apdorojamas mokėjimas...</>) : `Patvirtinti mokėjimą ${quote.final_price_eur} €`}
                      </button>
                    ) : showMethodSelector ? (
                      /* Flat payment method grid */
                      <div style={{ animation: 'slideDown 0.3s ease' }} data-guide="qs-pay-methods">
                        <p className="text-[15px] font-medium text-[#1A1A2E] mb-3">Pasirinkite mokėjimo būdą:</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-4">
                          {PAYMENT_METHODS.map(m => (
                            <div
                              key={m.id}
                              onClick={() => setSelectedMethod(m.id)}
                              className={`flex items-center justify-center min-h-[56px] px-2 py-3.5 rounded-lg border-2 cursor-pointer transition-all ${selectedMethod === m.id ? 'border-[#0D7377] bg-[#E8F4F8] shadow-[0_0_0_1px_#0D7377]' : 'border-[#E2E8F0] bg-white hover:border-[#0D7377] hover:bg-[#FAFBFC] hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]'}`}
                            >
                              <img
                                src={m.logo}
                                alt={m.label}
                                className="max-h-7 max-w-[80px] object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                              />
                              <span className="hidden text-[14px] font-medium text-[#1A1A2E]">{m.label}</span>
                            </div>
                          ))}
                        </div>
                        <button onClick={handleMethodConfirm} disabled={!selectedMethod || paying}
                          className={`w-full py-3 rounded-lg text-[16px] font-semibold transition-all flex items-center justify-center gap-2 ${selectedMethod && !paying ? 'bg-[#1E3A5F] text-white hover:bg-[#0D7377] cursor-pointer' : 'bg-[#CBD5E1] text-white cursor-not-allowed'}`}>
                          {paying ? (<><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Ruošiamas mokėjimas...</>) : `Patvirtinti mokėjimą ${quote.final_price_eur} €`}
                        </button>
                      </div>
                    ) : (
                      /* Initial pay button — opens method selector */
                      <button onClick={() => { if (canPay) { setShowMethodSelector(true); setTimeout(() => document.querySelector('[data-guide="qs-pay-methods"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } }} disabled={!canPay}
                        className={`w-full py-3 rounded-lg text-[16px] font-semibold transition-all flex items-center justify-center gap-2 ${canPay ? 'bg-[#1E3A5F] text-white hover:bg-[#0D7377] cursor-pointer' : 'bg-[#CBD5E1] text-white cursor-not-allowed'}`}>
                        Mokėti ir gauti ataskaitą
                      </button>
                    )}
                    <p className="text-[12px] text-[#94A3B8] text-center mt-3">Kortelės duomenys NTD sistemoje nesaugomi.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-[14px] text-[#94A3B8]">
              {quoting ? 'Skaičiuojame kainą...' : 'Patvirtinkite objektą, kad matytumėte kainą ir galėtumėte užsakyti.'}
            </p>
          </div>
        )}
      </div>

    </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────
const SUCCESS_BLOCKS = [
  { emoji: '🌡️', name: 'Šiluminis komfortas', heatedOnly: true },
  { emoji: '⚡', name: 'Energijos sąnaudos', heatedOnly: true },
  { emoji: '📊', name: '10 metų išlaidos', heatedOnly: true },
  { emoji: '🌿', name: 'Oro ir vandens tarša', heatedOnly: false },
  { emoji: '🔇', name: 'Triukšmo tarša', heatedOnly: false },
  { emoji: '💰', name: 'Kainos pagrįstumas', heatedOnly: false },
  { emoji: '⚖️', name: 'Teisinės rizikos', heatedOnly: false },
  { emoji: '🎯', name: 'Derybų strategija', heatedOnly: false },
];

function SuccessScreen({ state }: { state: QuickScanState }) {
  const candidate = state.resolver_result?.candidates?.[0];
  const caseType = state.case_type;
  const isLand = caseType === 'land_only';
  const isNewBuild = caseType === 'new_build_project';

  return (
    <div className="max-w-[1100px] mx-auto px-8 pb-[120px]" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

      {/* Green banner */}
      <div className="rounded-xl border border-[#34D399] bg-[#E8F8EE] p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[24px]">✅</span>
          <span className="text-[20px] font-semibold text-[#1A1A2E]">Užsakymas priimtas.</span>
        </div>
        <p className="text-[15px] text-[#1A1A2E] leading-relaxed">
          Pradėjome informacijos paiešką registruose, duomenų tikrinimą ir visų blokų skaičiavimus. Ataskaitą el. paštu paprastai išsiunčiame greitai, bet gali užtrukti iki 1 valandos.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left — Order summary */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h3 className="text-[18px] font-semibold text-[#1A1A2E] mb-4">Jūsų užsakymas</h3>

          {candidate && (
            <div className="mb-5">
              <p className="text-[16px] font-semibold text-[#1E3A5F] mb-1">{candidate.address}</p>
              {candidate.ntr_unique_number && (
                <p className="text-[14px] text-[#64748B]">Unikalus Nr.: {candidate.ntr_unique_number}</p>
              )}
              {candidate.municipality && (
                <p className="text-[14px] text-[#64748B]">Savivaldybė: {candidate.municipality}</p>
              )}
              {candidate.bundle_items && candidate.bundle_items.length > 0 && (
                <div className="mt-3 text-[14px] text-[#64748B]">
                  <p className="font-medium text-[#1A1A2E] mb-1">Namų ūkio komplektas:</p>
                  <p>Pagrindinis objektas: {candidate.kind === 'whole_building' ? 'Gyvenamasis pastatas' : candidate.kind === 'unit_in_building' ? 'Patalpa pastate' : 'Žemės sklypas'}</p>
                  <p>Komplekte: {candidate.bundle_items.map((b: any) => b.kind || b.address).join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Delivery info */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col">
          <h3 className="text-[18px] font-semibold text-[#1A1A2E] mb-4">Pristatymas</h3>

          <div className="flex-1">
            <p className="text-[14px] text-[#64748B] mb-1">Ataskaita bus išsiųsta adresu:</p>
            <p className="text-[16px] font-semibold text-[#1A1A2E] mb-4">{state.email || 'vardas@pastas.lt'}</p>

            <p className="text-[14px] text-[#64748B] leading-relaxed">
              Jei laiško nematysite per 1 valandą, patikrinkite „Šlamštas" (Spam) ar „Reklamos" (Promotions) aplankus.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href="/"
              className="block w-full text-center bg-[#1E3A5F] text-white text-[15px] font-medium py-3 rounded-lg hover:bg-[#0D7377] transition-colors"
            >
              Grįžti į pradžią
            </a>
            <a
              href="/quickscan/"
              className="text-center text-[14px] text-[#0D7377] hover:text-[#0B6268] transition-colors"
            >
              Peržiūrėti dar vieną objektą →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Resolver State Screens (dev preview + production use) ────────────

function ResolverLoading() {
  const STEPS = [
    { label: 'Adresas rastas registruose', delay: 500 },
    { label: 'Unikalus Nr.: 4400-1234-5678', delay: 1200 },
    { label: 'Paskirtis: Gyvenamoji', delay: 1800 },
    { label: 'Plotas: 68 m²', delay: 2500 },
    { label: 'Statybos metai: 1985', delay: 3000 },
  ];

  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  useEffect(() => {
    let cycle = 0;
    const run = () => {
      setVisibleSteps(0);
      STEPS.forEach((s, i) => {
        setTimeout(() => setVisibleSteps(i + 1), s.delay);
      });
    };
    run();
    const interval = setInterval(() => { cycle++; run(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: 500, margin: '120px auto 0' }}>
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
        <p className="text-[16px] font-semibold text-[#1A1A2E] mb-6">Ieškome jūsų objekto...</p>
        <div className="flex flex-col gap-2 text-left">
          {STEPS.slice(0, visibleSteps).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[14px] text-[#1A1A2E]" style={{ animation: 'fadeSlideIn 0.3s ease forwards' }}>
              <span className="text-[#059669]">✓</span>
              <span>{s.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-[14px] text-[#94A3B8]">
            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <span>Ieškoma energijos duomenų...</span>
          </div>
        </div>
      </div>
      <p className="text-[13px] text-[#94A3B8] text-center mt-4">Tai paprastai trunka kelias sekundes.</p>
    </div>
  );
}

function ResolverFailure({ setState }: { setState: React.Dispatch<React.SetStateAction<QuickScanState>> }) {
  return (
    <div style={{ maxWidth: 500, margin: '120px auto 0' }}>
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
        <div className="text-[24px] mb-4">⚠️</div>
        <p className="text-[16px] font-semibold text-[#1A1A2E] mb-2">Registrų paieška užtrunka ilgiau nei įprasta.</p>
        <p className="text-[14px] text-[#64748B] mb-6">Prašome palaukti arba bandyti vėliau.</p>
        <button
          onClick={() => setState(s => ({ ...s, step: 'resolver-loading' as const }))}
          className="px-6 py-2.5 rounded-lg border border-[#1E3A5F] text-[14px] text-[#1E3A5F] font-medium hover:bg-[#1E3A5F] hover:text-white transition-colors"
        >
          Bandyti dar kartą
        </button>
      </div>
    </div>
  );
}

function ResolverNoMatch({ setState }: { setState: React.Dispatch<React.SetStateAction<QuickScanState>> }) {
  return (
    <div style={{ maxWidth: 500, margin: '120px auto 0' }}>
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
        <div className="text-[24px] mb-4">🔍</div>
        <p className="text-[16px] font-semibold text-[#1A1A2E] mb-2">Nepavyko rasti objekto pagal pateiktus duomenis.</p>
        <p className="text-[14px] text-[#64748B] mb-6">Prašome patikslinti arba pabandyti kitą identifikavimo būdą.</p>
        <button
          onClick={() => setState(s => ({ ...s, step: 1 }))}
          className="px-6 py-2.5 rounded-lg border border-[#1E3A5F] text-[14px] text-[#1E3A5F] font-medium hover:bg-[#1E3A5F] hover:text-white transition-colors"
        >
          ← Grįžti
        </button>
      </div>
    </div>
  );
}

const CONFIDENCE_BADGES: Record<string, { label: string; text: string; bg: string }> = {
  high: { label: 'Aukštas', text: '#059669', bg: '#E8F8EE' },
  medium: { label: 'Vidutinis', text: '#D97706', bg: '#FEF3C7' },
  low: { label: 'Žemas', text: '#DC2626', bg: '#FEE2E2' },
};

const KIND_GROUPS: Record<string, string> = {
  whole_building: 'Pastatai',
  unit_in_building: 'Patalpos pastate',
  land_plot: 'Žemės sklypai',
};

function ResolverChooser({
  state,
  setState,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
}) {
  const candidates = state.resolver_result?.candidates ?? [];
  // Pre-select highest confidence
  const highestConfidence = candidates.reduce((best, c) =>
    (c.confidence === 'high' && best.confidence !== 'high') ? c : best, candidates[0]);
  const [selectedId, setSelectedId] = useState(highestConfidence?.candidate_id ?? null);

  // Group candidates by kind
  const groups: Record<string, typeof candidates> = {};
  for (const c of candidates) {
    const key = c.kind;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  const handleContinue = () => {
    if (!selectedId) return;
    setState(s => ({
      ...s,
      selected_candidate_id: selectedId,
      resolver_result: s.resolver_result ? { ...s.resolver_result, status: 'resolved' as const } : null,
      step: 2,
    }));
  };

  return (
    <div style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 32px' }}>
      <h2 className="text-[24px] font-semibold text-[#1A1A2E] mb-1">Pasirinkite tikslų objektą</h2>
      <p className="text-[15px] text-[#64748B] mb-6">Radome kelis galimus atitikmenis. Pasirinkite vieną.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Map placeholder */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 flex flex-col">
          <div className="flex-1 rounded-lg bg-[#F0F4F8] flex items-center justify-center min-h-[300px] relative">
            {/* Pin placeholders */}
            {candidates.map((c, i) => (
              <div key={c.candidate_id}
                className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-semibold cursor-pointer transition-all ${selectedId === c.candidate_id ? 'bg-[#0D7377] scale-110 shadow-lg' : 'bg-[#1E3A5F]'}`}
                style={{ top: `${30 + i * 25}%`, left: `${25 + i * 20}%` }}
                onClick={() => setSelectedId(c.candidate_id)}
              >
                {i + 1}
              </div>
            ))}
            <p className="text-[13px] text-[#94A3B8] absolute bottom-3 left-0 right-0 text-center">Žemėlapis bus rodomas su aktyviu API raktu</p>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setState(s => ({ ...s, step: 1 }))}
              className="px-5 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] text-[#64748B] hover:border-[#1E3A5F] transition-all"
            >
              Atgal
            </button>
          </div>
        </div>

        {/* Right: Candidate list */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 flex flex-col">
          <h3 className="text-[18px] font-semibold text-[#1A1A2E] mb-4">Galimi atitikmenys</h3>

          <div className="flex-1 flex flex-col gap-2">
            {(['whole_building', 'unit_in_building', 'land_plot'] as const).map(kind => {
              const group = groups[kind];
              if (!group || group.length === 0) return null;
              return (
                <div key={kind}>
                  <p className="text-[13px] uppercase tracking-[0.05em] text-[#94A3B8] mb-2">{KIND_GROUPS[kind]}</p>
                  {group.map((c, i) => {
                    const globalIdx = candidates.indexOf(c);
                    // confidence badges hidden from customer (kept for internal use)
                    const isSelected = selectedId === c.candidate_id;
                    const po = c.primary_object as any;
                    return (
                      <div
                        key={c.candidate_id}
                        onClick={() => setSelectedId(c.candidate_id)}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all mb-2 ${isSelected ? 'border-[#0D7377] bg-[#E8F4F8] shadow-[0_0_0_1px_#0D7377]' : 'border-[#E2E8F0] hover:border-[#0D7377] hover:bg-[#FAFBFC]'}`}
                      >
                        {/* Radio */}
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${isSelected ? 'border-[#0D7377]' : 'border-[#CBD5E1]'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#0D7377]" />}
                        </div>
                        {/* Pin number */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 ${isSelected ? 'bg-[#0D7377]' : 'bg-[#1E3A5F]'}`}>
                          {globalIdx + 1}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[15px] font-semibold text-[#1A1A2E]">{c.address}</span>
                          </div>
                          {c.ntr_unique_number && (
                            <p className="text-[13px] text-[#64748B]">Unikalus Nr.: {c.ntr_unique_number}</p>
                          )}
                          {po && (
                            <p className="text-[13px] text-[#94A3B8]">
                              {[po.purpose, po.area_m2 && `${po.area_m2} m²`, po.year_built].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {c.bundle_items.length > 0 && (
                            <p className="text-[13px] text-[#64748B] mt-1">Komplekte: {c.bundle_items.map((b: any) => b.kind === 'garage' ? 'garažas' : b.kind === 'shed' ? 'sandėliukas' : b.kind).join(', ')}</p>
                          )}
                        </div>
                        {/* Checkmark */}
                        {isSelected && (
                          <span className="text-[#0D7377] text-[16px] flex-shrink-0 mt-0.5">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedId}
            className={`mt-4 w-full py-3 rounded-lg text-[16px] font-semibold transition-all ${selectedId ? 'bg-[#1E3A5F] text-white hover:bg-[#0D7377] cursor-pointer' : 'bg-[#CBD5E1] text-white cursor-not-allowed'}`}
          >
            Tęsti
          </button>
        </div>
      </div>
    </div>
  );
}