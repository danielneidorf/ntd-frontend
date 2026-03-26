import { useState, useEffect, useRef } from 'react';

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
  step: 1 | 2;
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

const initialState = (): QuickScanState => {
  let case_type: CaseType | null = null;
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('case');
    if (param === 'existing_object' || param === 'new_build_project' || param === 'land_only') {
      case_type = param;
    }
  }
  return {
  step: 1,
  case_type,
  ntr_unique_number: null,
  address_text: null,
  geo: null,
  project_website_url: null,
  project_doc_id: null,
  resolver_result: null,
  selected_candidate_id: null,
  user_epc: null,
  quote: null,
  email: '',
  consent_accepted: false,
  invoice_requested: false,
  invoice_name: '',
  invoice_is_company: false,
  invoice_company_name: '',
  invoice_email: '',
  order_id: null,
  payment_complete: false,
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

const LOCATION_TITLE = 'Nurodykite objekto vietą';

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
          <p className="text-[16px] font-semibold text-[#1E3A5F] mb-3">Ką norite patikrinti?</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {([
              { value: 'existing_object' as CaseType, emoji: '🏠', label: 'Pastatas / patalpos' },
              { value: 'new_build_project' as CaseType, emoji: '🏗️', label: 'Naujas projektas' },
              { value: 'land_only' as CaseType, emoji: '🌿', label: 'Žemės sklypas' },
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

          <div className="grid grid-cols-1 md:grid-cols-2 items-start" style={{ gap: '28px' }}>

          {/* Left column — Tabbed location card */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col">
            <p className="text-[15px] font-medium text-[#1A1A2E] mb-3">Pakanka vieno iš šių būdų:</p>

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

          {/* Right column — URL + Document */}
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col">

            {/* URL */}
            <div className="mb-8">
              <label className="block text-[15px] font-medium text-[#1A1A2E] mb-2">
                Skelbimo ar projekto nuoroda
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
              <p className="text-[14px] text-[#64748B] mt-2">
                Skelbimas portale, projekto svetainė ar kitas šaltinis — sistema identifikuos objektą ir bandys ištraukti duomenis.
              </p>
            </div>

            {/* PDF upload */}
            <div>
              <label className="block text-[15px] font-medium text-[#1A1A2E] mb-2">
                Įkelti dokumentą (PDF)
              </label>
              <label className="flex items-center justify-center gap-3 px-4 rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFBFC] cursor-pointer hover:border-[#0D7377] hover:bg-[#F0FAFA] transition-all" style={{ minHeight: '80px' }}>
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
              <p className="text-[14px] text-[#64748B] mt-2">
                Energijos sertifikatas, projekto aprašymas ar kitas dokumentas. Nebūtina.
              </p>
            </div>
          </div>

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
  const [objectConfirmed, setObjectConfirmed] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const stripeRef = useRef<any>(null);
  const cardElementRef = useRef<any>(null);

  const resolver = state.resolver_result;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email);
  const canPay = objectConfirmed && state.quote && emailValid && state.consent_accepted && !paying;

  // Mount Stripe card when clientSecret is set (non-stub path)
  useEffect(() => {
    if (!clientSecret) return;
    const pubKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pubKey) return;
    const mountCard = () => {
      const stripe = (window as any).Stripe(pubKey);
      stripeRef.current = stripe;
      const elements = stripe.elements();
      const card = elements.create('card');
      card.mount('#stripe-card-element');
      cardElementRef.current = card;
    };
    if ((window as any).Stripe) { mountCard(); }
    else {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = mountCard;
      document.head.appendChild(script);
    }
  }, [clientSecret]);

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
          bundle_signature: state.selected_candidate_id ?? state.quote.bundle_id ?? '',
        }),
      });
      const json = await r.json();
      if (!json.ok) {
        if (json.error_code === 'quote_expired') { setPayError('expired'); }
        else { setPayError('Mokėjimo klaida. Bandykite dar kartą.'); }
        return;
      }
      const { client_secret, order_id } = json.data;
      const pubKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (client_secret.startsWith('pi_stub') || client_secret === 'stub' || !pubKey) {
        setState(s => ({ ...s, order_id, payment_complete: true }));
        return;
      }
      setState(s => ({ ...s, order_id }));
      setClientSecret(client_secret);
    } catch {
      setPayError('Mokėjimo klaida. Bandykite dar kartą.');
    } finally {
      setPaying(false);
    }
  };

  const handleStripeConfirm = async () => {
    if (!stripeRef.current || !cardElementRef.current || !clientSecret) return;
    setPaying(true);
    setPayError(null);
    try {
      const result = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElementRef.current },
      });
      if (result.error) { setPayError(result.error.message); }
      else if (result.paymentIntent?.status === 'succeeded') { setState(s => ({ ...s, payment_complete: true })); }
    } finally { setPaying(false); }
  };

  if (payError === 'expired') {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* LEFT COLUMN — Object confirmation */}
      <div>
        <h1 className="text-xl font-bold text-[#1E3A5F] mb-1">Ar tai teisingas objektas?</h1>
        <p className="text-sm text-[#64748B] mb-4">Radome atitinkantį įrašą. Patikrinkite.</p>

        {/* Proof card */}
        <div className={`rounded-xl border px-6 py-5 mb-4 transition-all ${objectConfirmed ? 'border-[#059669] bg-[#F0FDF4]' : 'border-[#E2E8F0] bg-white'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-[#1E3A5F] mb-2">{candidate.address}</p>
              {candidate.ntr_unique_number && <p className="text-sm text-[#64748B] mb-1">Unikalus Nr.: {candidate.ntr_unique_number}</p>}
              {candidate.municipality && <p className="text-sm text-[#64748B] mb-1">Savivaldybė: {candidate.municipality}</p>}
              {candidate.bundle_items.length > 0 && <p className="text-sm text-[#94A3B8] mt-2">Komplekte yra papildomų objektų.</p>}
            </div>
            {objectConfirmed && (
              <div className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-[#94A3B8] mt-3 pt-3 border-t border-[#F1F5F9]">
            Vertinimas taikomas pagrindiniam šildomam objektui.
          </p>
        </div>

        {/* Confirm / reject buttons */}
        {!objectConfirmed && (
          <div className="flex gap-3 mb-4">
            <button onClick={handleConfirmObject} disabled={quoting}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${quoting ? 'bg-[#CBD5E1] text-white cursor-not-allowed' : 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer'}`}>
              {quoting ? (
                <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Tikrinama…</>
              ) : 'Taip, teisingas'}
            </button>
            <button onClick={() => setState(s => ({ ...s, step: 1 }))}
              className="px-6 py-3 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#1E3A5F] transition-all">
              Ne, ieškoti kito
            </button>
          </div>
        )}

        {quoteError && (
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-[#DC3545]">{quoteError}</p>
            <button onClick={handleConfirmObject} className="text-sm text-[#0D7377] underline">Bandyti dar kartą</button>
          </div>
        )}

        {/* EPC card — hidden for land_only */}
        {state.case_type !== 'land_only' && (
          <EpcCard state={state} setState={setState} />
        )}
      </div>

      {/* RIGHT COLUMN — Payment */}
      <div>
        {/* Quote card — shows after confirmation */}
        {quote ? (
          <>
            <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4">
              <div className="flex items-baseline gap-3 mb-3">
                {quote.special_discount_applied && <span className="text-lg text-[#94A3B8] line-through">{quote.base_price_eur} €</span>}
                <span className="text-3xl font-bold text-[#1E3A5F]">{quote.final_price_eur} €</span>
                <span className="flex items-center gap-1 text-xs font-medium text-[#0D7377] bg-[#EEF9F9] px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {quote.pricing_label}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">{candidate.address}</p>
            </div>

            {/* Email + consent + invoice */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">El. pašto adresas</label>
                <input type="email" value={state.email}
                  onChange={e => setState(s => ({ ...s, email: e.target.value }))}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="vardas@pastas.lt"
                  className={['w-full px-3 py-2 rounded-md border text-sm outline-none focus:border-[#0D7377] transition-all', emailTouched && !emailValid ? 'border-[#DC3545]' : 'border-[#E2E8F0]'].join(' ')} />
                {emailTouched && !emailValid && <p className="text-xs text-[#DC3545] mt-1">Įveskite teisingą el. pašto adresą.</p>}
                <p className="text-xs text-[#94A3B8] mt-1">Ataskaitą išsiųsime šiuo adresu.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={state.consent_accepted}
                  onChange={e => setState(s => ({ ...s, consent_accepted: e.target.checked }))}
                  className="w-4 h-4 accent-[#0D7377]" />
                <span className="text-sm text-[#64748B]">
                  Sutinku su <a href="/salygos" className="text-[#0D7377] underline">paslaugos teikimo sąlygomis</a> ir <a href="/privatumas" className="text-[#0D7377] underline">privatumo nuostatomis</a>.
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={state.invoice_requested}
                  onChange={e => setState(s => ({ ...s, invoice_requested: e.target.checked }))}
                  className="w-4 h-4 accent-[#0D7377]" />
                <span className="text-sm text-[#1E3A5F]">Reikia sąskaitos faktūros</span>
              </label>

              {state.invoice_requested && (
                <div className="flex flex-col gap-3 pl-6 border-l-2 border-[#E2E8F0]">
                  <div className="flex gap-2">
                    <button onClick={() => setState(s => ({ ...s, invoice_is_company: false }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${!state.invoice_is_company ? 'bg-[#0D7377] text-white border-[#0D7377]' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0D7377]'}`}>
                      Fizinis asmuo
                    </button>
                    <button onClick={() => setState(s => ({ ...s, invoice_is_company: true }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${state.invoice_is_company ? 'bg-[#0D7377] text-white border-[#0D7377]' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0D7377]'}`}>
                      Juridinis asmuo
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1E3A5F] mb-1">{state.invoice_is_company ? 'Kontaktinis asmuo' : 'Vardas, pavardė'}</label>
                    <input type="text" value={state.invoice_name} onChange={e => setState(s => ({ ...s, invoice_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md border border-[#E2E8F0] text-sm outline-none focus:border-[#0D7377] transition-all" />
                  </div>
                  {state.invoice_is_company && (
                    <div>
                      <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Įmonės pavadinimas</label>
                      <input type="text" value={state.invoice_company_name} onChange={e => setState(s => ({ ...s, invoice_company_name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-md border border-[#E2E8F0] text-sm outline-none focus:border-[#0D7377] transition-all" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Sąskaitos el. paštas</label>
                    <input type="email" value={state.invoice_email || state.email} onChange={e => setState(s => ({ ...s, invoice_email: e.target.value }))}
                      placeholder={state.email || 'vardas@pastas.lt'}
                      className="w-full px-3 py-2 rounded-md border border-[#E2E8F0] text-sm outline-none focus:border-[#0D7377] transition-all" />
                  </div>
                </div>
              )}
            </div>

            {/* Stripe card element */}
            {clientSecret && (
              <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4">
                <p className="text-xs font-medium text-[#1E3A5F] mb-3">Mokėjimo duomenys</p>
                <div id="stripe-card-element" className="py-2" />
                {payError && <p className="text-xs text-[#DC3545] mt-2">{payError}</p>}
                <button onClick={handleStripeConfirm} disabled={paying}
                  className={`mt-4 w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paying ? 'bg-[#CBD5E1] text-white cursor-not-allowed' : 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer'}`}>
                  {paying ? (<><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Kraunama…</>) : 'Patvirtinti mokėjimą'}
                </button>
              </div>
            )}

            {payError && payError !== 'expired' && !clientSecret && (
              <p className="text-sm text-[#DC3545] mb-4">{payError}</p>
            )}

            {/* Payment button */}
            {!clientSecret && (
              <button onClick={handlePayment} disabled={!canPay}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${canPay ? 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer' : 'bg-[#CBD5E1] text-white cursor-not-allowed'}`}>
                {paying ? (<><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Kraunama…</>) : 'Mokėti ir gauti ataskaitą'}
              </button>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-6 py-8 text-center">
            <p className="text-sm text-[#94A3B8]">
              {quoting ? 'Skaičiuojame kainą...' : 'Patvirtinkite objektą, kad matytumėte kainą ir galėtumėte užsakyti.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}