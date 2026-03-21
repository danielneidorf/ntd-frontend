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
  step: 1 | 2 | 3;
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

const initialState = (): QuickScanState => ({
  step: 1,
  case_type: null,
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
});

const BREADCRUMB_STEPS = [
  { step: 1, label: '1 Vieta' },
  { step: 2, label: '2 Patvirtinimas' },
  { step: 3, label: '3 Užsakymas ir apmokėjimas' },
] as const;

export default function QuickScanFlow() {
  const [state, setState] = useState<QuickScanState>(initialState);
  const [addressCandidates, setAddressCandidates] = useState<
    { place_id: string; description: string; main_text: string; secondary_text: string }[]
  >([]);
  const [sessionToken] = useState(() => crypto.randomUUID());

  return (
    <div>
      <nav className="flex items-center gap-3 text-sm mb-10">
        {BREADCRUMB_STEPS.map((s, i) => (
          <span key={s.step} className="flex items-center gap-3">
            {i > 0 && <span className="text-[#64748B]">→</span>}
            <span className={s.step === state.step ? 'font-semibold text-[#1E3A5F]' : 'text-[#64748B]'}>
              {s.label}
            </span>
          </span>
        ))}
      </nav>

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
      {state.step === 3 && <Screen3 state={state} setState={setState} />}
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

const LOCATION_TITLES: Record<CaseType, string> = {
  existing_object: 'Kaip patogiausia nurodyti šio būsto vietą?',
  new_build_project: 'Kaip patogiausia nurodyti sklypo / NT objekto vietą?',
  land_only: 'Kaip patogiausia nurodyti šio žemės sklypo vietą?',
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
  const [addressInput, setAddressInput] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

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
      setState((s) => ({ ...s, resolver_result: json.data, step: 2 }));
    } catch {
      setResolveError('Nepavyko prisijungti prie serverio. Bandykite dar kartą.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-slide-in {
          animation: fadeSlideIn 0.35s ease forwards;
        }
      `}</style>
      {/* Case selection */}
      {!state.case_type && (
        <>
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1">Ką tiksliai norite įvertinti?</h1>
          <p className="text-sm text-[#64748B] mb-6">Tai padeda parinkti tinkamiausią logiką jūsų situacijai.</p>
        </>
      )}

      {!state.case_type ? (
        <div className="flex flex-col gap-3 mb-6">
          {CASE_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setState((s) => ({ ...s, case_type: opt.value }))}
              className={`cursor-pointer rounded-xl border-2 px-5 py-4 transition-all
                ${state.case_type === opt.value
                  ? 'border-[#0D7377] bg-[#EEF9F9]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#0D7377]/40'}`}
            >
              <p className="text-sm font-semibold text-[#1E3A5F]">{opt.label}</p>
              <p className="text-xs text-[#64748B] mt-1">{opt.hint}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6 ml-auto w-fit px-4 py-2 rounded-lg border border-[#E2E8F0] bg-[#F1F5F9]">
          <span className="text-sm text-[#64748B]">✓ {CASE_LABELS[state.case_type]}</span>
          <button
            onClick={() => setState(s => ({ ...s, case_type: null }))}
            className="text-xs text-[#94A3B8] hover:text-[#1E3A5F] underline transition-colors whitespace-nowrap"
          >
            Keisti
          </button>
        </div>
      )}

      {/* Location block — visible only after case is selected */}
      {state.case_type && (
        <div key={state.case_type} className="fade-slide-in mb-8">
          <h2 className="text-base font-semibold text-[#1E3A5F] mb-1">
            {LOCATION_TITLES[state.case_type]}
          </h2>
          <p className="text-sm text-[#64748B] mb-5">Pasirinkite patogų būdą.</p>

          <div className="flex flex-col gap-3">

            {/* Card 1 — NTR */}
            <div className={[
              'rounded-lg border px-5 py-4 transition-all',
              ntrValid ? 'border-[#059669] bg-[#F0FDF4]' : 'border-[#E2E8F0] bg-white',
            ].join(' ')}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#1E3A5F] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">1</span>
                <span className="text-sm font-semibold text-[#1A1A2E]">
                  NTR unikalus numeris
                  {ntrValid && <span className="ml-2 text-[#059669] font-normal">✓ naudosime šį</span>}
                </span>
              </div>
              <input
                type="text"
                value={ntrInput}
                onChange={(e) => handleNtrChange(e.target.value)}
                onBlur={() => setNtrTouched(true)}
                placeholder="1234-5678-9012"
                maxLength={14}
                className={[
                  'w-full px-4 py-2.5 rounded-md border text-sm outline-none transition-all',
                  ntrValid
                    ? 'border-[#059669] bg-white'
                    : ntrTouched && ntrInput
                    ? 'border-[#DC3545] bg-white'
                    : 'border-[#E2E8F0] bg-white focus:border-[#0D7377]',
                ].join(' ')}
              />
              {ntrTouched && ntrInput && !ntrValid && (
                <p className="text-xs text-[#DC3545] mt-1">Formatas: 1234-5678-9012</p>
              )}
              <p className="text-xs text-[#94A3B8] mt-1.5">
                Greičiausias ir tiksliausias būdas — sistema objektą ras akimirksniu.
              </p>
            </div>

            {/* Card 2 — Address */}
            <div className={[
              'rounded-lg border px-5 py-4 transition-all',
              !ntrValid && addressValid ? 'border-[#059669] bg-[#F0FDF4]' : 'border-[#E2E8F0] bg-white',
            ].join(' ')}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#1E3A5F] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">2</span>
                <span className="text-sm font-semibold text-[#1A1A2E]">
                  Adresas
                  {!ntrValid && addressValid && <span className="ml-2 text-[#059669] font-normal">✓ naudosime šį</span>}
                </span>
              </div>
              <div className="relative" ref={addressWrapperRef}>
                <input
                  type="text"
                  value={addressInput}
                  onChange={handleAddressChange}
                  onKeyDown={(e) => { if (e.key === 'Escape') setAddressCandidates([]); }}
                  placeholder="Pradėkite rašyti adresą (gatvė, numeris, miestas)..."
                  className="w-full px-4 py-2.5 rounded-md border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#0D7377] transition-all"
                />
                {addressCandidates.length > 0 && (
                  <ul className="absolute z-10 top-full left-0 right-0 bg-white border border-[#E2E8F0] rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {addressCandidates.map((c) => (
                      <li
                        key={c.place_id}
                        onClick={() => handleAddressSelect(c)}
                        className="px-4 py-2.5 text-sm cursor-pointer hover:bg-[#F1F5F9]"
                      >
                        <span className="font-medium text-[#1E3A5F]">{c.main_text}</span>
                        <span className="text-[#94A3B8] ml-1">{c.secondary_text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mt-1.5">
                Automatinis pasiūlymų sąrašas — kitame žingsnyje.
              </p>
            </div>

            {/* Card 3 — Map pin (Google Maps) */}
            <div className={`rounded-lg border px-5 py-4 transition-all ${
              mapPinActive ? 'border-[#0D7377] bg-[#F0FAFA]' : 'border-[#E2E8F0] bg-[#FAFBFC]'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-6 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 ${
                  mapPinActive ? 'bg-[#0D7377]' : 'bg-[#1E3A5F]'
                }`}>3</span>
                <span className={`text-sm font-semibold ${mapPinActive ? 'text-[#0D7377]' : 'text-[#1E3A5F]'}`}>
                  Taškas žemėlapyje
                </span>
                {mapPinActive && !mapExpanded && (
                  <span className="ml-auto text-xs text-[#0D7377] font-medium">✓ naudosime šį</span>
                )}
              </div>

              {!mapExpanded && !mapPinActive && (
                <button
                  onClick={() => setMapExpanded(true)}
                  className="w-full py-2.5 rounded-md border border-dashed border-[#CBD5E1] text-sm text-[#64748B] hover:border-[#0D7377] hover:text-[#0D7377] transition-all"
                >
                  Spustelėkite, kad atidarytumėte žemėlapį
                </button>
              )}

              {mapPinActive && !mapExpanded && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#0D7377]">
                    {'Koordinatės: ' + state.geo!.lat.toFixed(5) + ', ' + state.geo!.lng.toFixed(5)}
                  </p>
                  <button onClick={() => { mapInstanceRef.current = null; markerRef.current = null; setMapExpanded(true); }} className="text-xs text-[#0D7377] underline ml-3">
                    Keisti
                  </button>
                </div>
              )}

            </div>

            {/* Card 4 — Listing URL (hidden for new_build_project) */}
            {state.case_type !== 'new_build_project' && (
              <div className="rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-[#CBD5E1] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">4</span>
                  <span className="text-sm font-semibold text-[#94A3B8]">Skelbimo nuoroda</span>
                  <span className="ml-auto text-xs text-[#CBD5E1]">Netrukus</span>
                </div>
                <input
                  type="url"
                  disabled
                  placeholder="pvz. https://www.aruodas.lt/..."
                  className="w-full px-4 py-2.5 rounded-md border border-[#E2E8F0] bg-white text-sm text-[#94A3B8] cursor-not-allowed"
                />
                <p className="text-xs text-[#CBD5E1] mt-1.5">
                  Aruodas.lt, Domoplius.lt ir kt. — sistema pati identifikuos objektą.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* New-build project inputs — card 2 only */}
      {selected === 'new_build_project' && (
        <div className="mb-8 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-5">
          {/* Project URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Projekto ar skelbimo nuoroda
            </label>
            <input
              type="url"
              placeholder="pvz., https://..."
              onChange={(e) =>
                setState((s) => ({ ...s, project_website_url: e.target.value || null }))
              }
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#0D7377] transition-all"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Projekto puslapis, kūrėjo svetainė ar skelbimas portale (Aruodas.lt, Domoplius.lt ir kt.) —
              sistema pati identifikuos sklypą ir pabandys ištraukti techninius duomenis.
            </p>
          </div>

          {/* PDF upload */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Įkelti projekto dokumentą (PDF)
            </label>
            <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-[#CBD5E1] bg-white cursor-pointer hover:border-[#0D7377] transition-all">
              <span className="text-[#0D7377] text-lg">📄</span>
              <span className="text-sm text-[#64748B]">
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
            <p className="text-xs text-[#64748B] mt-1">
              Galite pridėti projekto brėžinius ar aprašą (PDF). Įkėlimas į serverį — kitame etape.
            </p>
          </div>
        </div>
      )}

      {/* Tęsti */}
      {resolveError && (
        <p className="text-sm text-[#DC3545] mb-3">{resolveError}</p>
      )}
      {state.case_type && (
        <button
          onClick={handleTesti}
          disabled={!canProceed || resolving}
          className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
            ${canProceed && !resolving
              ? 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer'
              : 'bg-[#CBD5E1] text-white cursor-not-allowed'}`}
        >
          {resolving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Ieškoma...
            </>
          ) : 'Tęsti'}
        </button>
      )}

      {/* Fullscreen map overlay — rendered outside fade-slide-in to avoid transform containing block */}
      {mapExpanded && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
            <span className="w-6 h-6 rounded-full bg-[#0D7377] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">3</span>
            <span className="text-sm font-semibold text-[#1E3A5F]">Taškas žemėlapyje</span>
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

const EPC_CLASSES = ['A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

function EpcCard({
  state,
  setState,
  epcError,
  setEpcError,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
  epcError: string | null;
  setEpcError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const epc = state.user_epc ?? {};
  const kwhVal = epc.kwhm2_year;
  const kwhWarning = kwhVal !== undefined && (kwhVal < 10 || kwhVal > 1000);

  function updateEpc(patch: Partial<NonNullable<QuickScanState['user_epc']>>) {
    setState(s => ({ ...s, user_epc: { ...s.user_epc, ...patch } }));
    setEpcError(null);
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4">
      <h3 className="text-sm font-semibold text-[#1E3A5F] mb-2">
        Energijos naudingumo duomenys (pasirinktinai)
      </h3>
      <p className="text-xs text-[#64748B] mb-4">
        Jei turite energijos naudingumo sertifikatą ar patikimus savo skaičiavimus, galite čia įvesti klasę, sąnaudas ir sertifikato metus — palyginsime su registrų įrašais ir, jei jie naujesni, vertinime remsimės būtent jais.
      </p>

      <div className="flex flex-col gap-4">
        {/* Energy class */}
        <div>
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Energijos naudingumo klasė</label>
          <select
            value={epc.energy_class ?? ''}
            onChange={e => updateEpc({ energy_class: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-md border border-[#E2E8F0] text-sm outline-none focus:border-[#0D7377] bg-white transition-all"
          >
            <option value="">—</option>
            {EPC_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* kWh/m² */}
        <div>
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Metinės šildymo energijos sąnaudos</label>
          <div className="relative">
            <input
              type="number"
              value={epc.kwhm2_year ?? ''}
              onChange={e => updateEpc({ kwhm2_year: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="pvz., 120"
              className={`w-full px-3 py-2 pr-32 rounded-md border text-sm outline-none focus:border-[#0D7377] transition-all ${kwhWarning ? 'border-[#F59E0B]' : 'border-[#E2E8F0]'}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] pointer-events-none">kWh/m² per metus</span>
          </div>
          {kwhWarning && (
            <p className="text-xs text-[#F59E0B] mt-1">Neįprasta reikšmė — patikrinkite.</p>
          )}
        </div>

        {/* Issue year */}
        <div>
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Sertifikato metai</label>
          <input
            type="number"
            value={epc.issue_year ?? ''}
            onChange={e => updateEpc({ issue_year: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="pvz., 2022"
            disabled={epc.year_unknown}
            className={[
              'w-full px-3 py-2 rounded-md border text-sm outline-none focus:border-[#0D7377] transition-all',
              epc.year_unknown ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border-[#E2E8F0]' :
              (epcError && epc.energy_class && !epc.year_unknown && !epc.issue_year) ? 'border-[#DC3545]' : 'border-[#E2E8F0]',
            ].join(' ')}
          />
          {epcError && (
            <p className="text-xs text-[#DC3545] mt-1">{epcError}</p>
          )}
        </div>

        {/* Year unknown */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={epc.year_unknown ?? false}
            onChange={e => updateEpc({ year_unknown: e.target.checked, issue_year: e.target.checked ? undefined : epc.issue_year })}
            className="w-4 h-4 accent-[#0D7377]"
          />
          <span className="text-xs text-[#64748B]">Nežinau / neturiu po ranka</span>
        </label>

        {epc.energy_class && epc.year_unknown && (
          <p className="text-xs text-[#94A3B8]">
            Be sertifikato metų negalime patikrinti, ar klasė naujesnė, todėl vertinime paliksime registrų klasę.
          </p>
        )}
      </div>

      <p className="text-xs text-[#94A3B8] mt-4 pt-4 border-t border-[#F1F5F9]">
        Jei nepildysite šių laukų, vertinimui bus naudojami registrų duomenys arba apytiksliai skaičiavimai, jei jų nėra.
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
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [epcError, setEpcError] = useState<string | null>(null);

  const resolver = state.resolver_result;

  if (!resolver) return null;

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
                  <div
                    key={c.candidate_id}
                    onClick={() => setState(s => ({ ...s, selected_candidate_id: c.candidate_id }))}
                    className="cursor-pointer rounded-lg border border-[#E2E8F0] bg-white px-5 py-4 hover:border-[#0D7377] hover:bg-[#EEF9F9] transition-all"
                  >
                    <p className="text-sm font-semibold text-[#1E3A5F]">{c.address}</p>
                    {c.ntr_unique_number && (
                      <p className="text-xs text-[#64748B] mt-1">Unikalus Nr.: {c.ntr_unique_number}</p>
                    )}
                    {c.municipality && (
                      <p className="text-xs text-[#64748B]">Savivaldybė: {c.municipality}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setState(s => ({ ...s, step: 1 }))}
          className="px-6 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#1E3A5F] transition-all"
        >
          Atgal
        </button>
      </div>
    );
  }

  // Proof card sub-state
  const candidate = resolver.status === 'resolved'
    ? resolver.candidates[0]
    : resolver.candidates.find(c => c.candidate_id === state.selected_candidate_id);

  if (!candidate) return null;

  const handleConfirmCandidate = async () => {
    const epc = state.user_epc;
    if (epc?.energy_class && !epc.year_unknown && !epc.issue_year) {
      setEpcError("Nurodykite sertifikato metus arba pažymėkite 'Nežinau'.");
      return;
    }
    setEpcError(null);
    setQuoting(true);
    setQuoteError(null);
    try {
      // Step 1: POST /confirm
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
          user_energy_class: state.user_epc?.energy_class ?? null,
          user_epc_kwhm2_year: state.user_epc?.kwhm2_year ?? null,
          user_epc_issue_year: state.user_epc?.issue_year ?? null,
          user_epc_issue_year_unknown: state.user_epc?.year_unknown ?? false,
          discount_token: state.discount_token ?? null,
        }),
      });
      const confirmJson = await confirmRes.json();
      if (!confirmJson.ok) throw new Error('confirm failed');
      const { bundle_signature, bundle_id, bundle_size, has_new_build_project } = confirmJson.data;

      // Step 2: POST /quote using confirm response
      const quoteBody: Record<string, unknown> = {
        bundle_signature,
        bundle_id,
        bundle_size,
        has_new_build_project,
      };
      if (state.discount_token) quoteBody.promo = state.discount_token;
      const quoteRes = await fetch(`${API_BASE}/v1/quickscan-lite/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteBody),
      });
      const json = await quoteRes.json();
      if (!json.ok) throw new Error('Quote error');
      setState(s => ({
        ...s,
        selected_candidate_id: candidate.candidate_id,
        quote: json.data as QuoteData,
        step: 3,
      }));
    } catch {
      setQuoteError('Klaida gaunant kainą. Bandykite dar kartą.');
    } finally {
      setQuoting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1">Patvirtinkite objektą</h1>
      <p className="text-sm text-[#64748B] mb-6">Radome atitinkantį įrašą. Patikrinkite, ar tai tas pats objektas.</p>

      {/* Proof card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4">
        <p className="text-lg font-bold text-[#1E3A5F] mb-2">{candidate.address}</p>
        {candidate.ntr_unique_number && (
          <p className="text-sm text-[#64748B] mb-1">Unikalus Nr.: {candidate.ntr_unique_number}</p>
        )}
        {candidate.municipality && (
          <p className="text-sm text-[#64748B] mb-1">Savivaldybė: {candidate.municipality}</p>
        )}
        {candidate.bundle_items.length > 0 && (
          <p className="text-sm text-[#94A3B8] mt-2">Komplekte yra papildomų objektų.</p>
        )}
        {/* TODO: small static map — blocked P6-C Google Maps issue */}
        <p className="text-xs text-[#94A3B8] mt-3 pt-3 border-t border-[#F1F5F9]">
          Vertinimas taikomas pagrindiniam šildomam objektui.
        </p>
      </div>

      {/* EPC override card — hidden for land_only */}
      {state.case_type !== 'land_only' && (
        <EpcCard state={state} setState={setState} epcError={epcError} setEpcError={setEpcError} />
      )}

      {quoteError && (
        <div className="flex items-center gap-3 mb-4">
          <p className="text-sm text-[#DC3545]">{quoteError}</p>
          <button onClick={handleConfirmCandidate} className="text-sm text-[#0D7377] underline">
            Bandyti dar kartą
          </button>
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={() => setState(s => ({ ...s, step: 1 }))}
          className="px-6 py-3 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#1E3A5F] transition-all"
        >
          Keisti vietą
        </button>
        <button
          onClick={handleConfirmCandidate}
          disabled={quoting}
          className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
            ${quoting
              ? 'bg-[#CBD5E1] text-white cursor-not-allowed'
              : 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer'}`}
        >
          {quoting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Kraunama…
            </>
          ) : 'Tęsti'}
        </button>
      </div>
    </div>
  );
}

function Screen3({
  state,
  setState,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
}) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const stripeRef = useRef<any>(null);
  const cardElementRef = useRef<any>(null);

  const quote = state.quote!;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email);
  const canPay = emailValid && state.consent_accepted && !paying;

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

    if ((window as any).Stripe) {
      mountCard();
    } else {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = mountCard;
      document.head.appendChild(script);
    }
  }, [clientSecret]);

  // Reassurance screen
  if (state.payment_complete) {
    return (
      <div className="max-w-2xl">
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

  const handlePayment = async () => {
    if (!emailValid || !state.consent_accepted) return;
    setPaying(true);
    setPayError(null);
    try {
      const r = await fetch(`${API_BASE}/v1/quickscan-lite/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: quote.quote_id,
          customer_email: state.email,
          invoice_requested: state.invoice_requested,
          bundle_signature: state.selected_candidate_id ?? quote.bundle_id ?? '',
        }),
      });
      const json = await r.json();
      if (!json.ok) {
        if (json.error_code === 'quote_expired') {
          setPayError('expired');
        } else {
          setPayError('Mokėjimo klaida. Bandykite dar kartą.');
        }
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
      if (result.error) {
        setPayError(result.error.message);
      } else if (result.paymentIntent?.status === 'succeeded') {
        setState(s => ({ ...s, payment_complete: true }));
      }
    } finally {
      setPaying(false);
    }
  };

  if (payError === 'expired') {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-[#64748B] mb-4">
          Jūsų užklausa pasibaigė. Grįžkite ir pradėkite iš naujo.
        </p>
        <button
          onClick={() => setState(s => ({ ...s, step: 2 }))}
          className="px-6 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#1E3A5F] transition-all"
        >
          Atgal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1E3A5F] mb-6">Kaina ir paslauga</h1>

      {/* Quote card */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4">
        <div className="flex items-baseline gap-3 mb-3">
          {quote.special_discount_applied && (
            <span className="text-lg text-[#94A3B8] line-through">{quote.base_price_eur} €</span>
          )}
          <span className="text-3xl font-bold text-[#1E3A5F]">{quote.final_price_eur} €</span>
          <span className="flex items-center gap-1 text-xs font-medium text-[#0D7377] bg-[#EEF9F9] px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {quote.pricing_label}
          </span>
        </div>
        <ul className="flex flex-col gap-1.5">
          <li className="flex items-start gap-2 text-sm text-[#64748B]">
            <span className="text-[#0D7377] mt-0.5">✓</span>
            Šiluminio komforto vertinimas pagrindiniam pastatui šiame komplekte.
          </li>
          <li className="flex items-start gap-2 text-sm text-[#64748B]">
            <span className="text-[#0D7377] mt-0.5">✓</span>
            PDF ataskaita el. paštu.
          </li>
        </ul>
      </div>

      {/* Why this price */}
      {quote.ui_explanation_block.length > 0 && (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-6 py-5 mb-4">
          <h3 className="text-sm font-semibold text-[#1E3A5F] mb-3">Kodėl tokia kaina?</h3>
          <ul className="flex flex-col gap-2">
            {quote.ui_explanation_block.map((line, i) => (
              <li key={i} className={`text-xs ${line.startsWith('Šiuo metu') ? 'text-[#0D7377] font-medium' : 'text-[#64748B]'}`}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Email + consent + invoice */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4 flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1">El. pašto adresas</label>
          <input
            type="email"
            value={state.email}
            onChange={e => setState(s => ({ ...s, email: e.target.value }))}
            onBlur={() => setEmailTouched(true)}
            placeholder="vardas@pastas.lt"
            className={[
              'w-full px-3 py-2 rounded-md border text-sm outline-none focus:border-[#0D7377] transition-all',
              emailTouched && !emailValid ? 'border-[#DC3545]' : 'border-[#E2E8F0]',
            ].join(' ')}
          />
          {emailTouched && !emailValid && (
            <p className="text-xs text-[#DC3545] mt-1">Įveskite teisingą el. pašto adresą.</p>
          )}
        </div>

        {/* Invoice checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.invoice_requested}
            onChange={e => setState(s => ({ ...s, invoice_requested: e.target.checked }))}
            className="w-4 h-4 accent-[#0D7377]"
          />
          <span className="text-sm text-[#1E3A5F]">Reikia sąskaitos faktūros</span>
        </label>

        {/* Invoice fields */}
        {state.invoice_requested && (
          <div className="flex flex-col gap-3 pl-6 border-l-2 border-[#E2E8F0]">
            {/* Individual/company toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setState(s => ({ ...s, invoice_is_company: false }))}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${!state.invoice_is_company ? 'bg-[#0D7377] text-white border-[#0D7377]' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0D7377]'}`}
              >
                Fizinis asmuo
              </button>
              <button
                onClick={() => setState(s => ({ ...s, invoice_is_company: true }))}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${state.invoice_is_company ? 'bg-[#0D7377] text-white border-[#0D7377]' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#0D7377]'}`}
              >
                Juridinis asmuo
              </button>
            </div>
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[#1E3A5F] mb-1">
                {state.invoice_is_company ? 'Kontaktinis asmuo' : 'Vardas, pavardė'}
              </label>
              <input
                type="text"
                value={state.invoice_name}
                onChange={e => setState(s => ({ ...s, invoice_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-[#E2E8F0] text-sm outline-none focus:border-[#0D7377] transition-all"
              />
            </div>
            {/* Company name */}
            {state.invoice_is_company && (
              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Įmonės pavadinimas</label>
                <input
                  type="text"
                  value={state.invoice_company_name}
                  onChange={e => setState(s => ({ ...s, invoice_company_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-[#E2E8F0] text-sm outline-none focus:border-[#0D7377] transition-all"
                />
              </div>
            )}
            {/* Invoice email */}
            <div>
              <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Sąskaitos el. paštas</label>
              <input
                type="email"
                value={state.invoice_email || state.email}
                onChange={e => setState(s => ({ ...s, invoice_email: e.target.value }))}
                placeholder={state.email || 'vardas@pastas.lt'}
                className="w-full px-3 py-2 rounded-md border border-[#E2E8F0] text-sm outline-none focus:border-[#0D7377] transition-all"
              />
            </div>
          </div>
        )}

        {/* Consent */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.consent_accepted}
            onChange={e => setState(s => ({ ...s, consent_accepted: e.target.checked }))}
            className="w-4 h-4 mt-0.5 accent-[#0D7377] flex-shrink-0"
          />
          <span className="text-sm text-[#64748B]">
            Sutinku su{' '}
            <a href="/salygos" className="text-[#0D7377] underline">paslaugos teikimo sąlygomis</a>
            {' '}ir{' '}
            <a href="/privatumas" className="text-[#0D7377] underline">privatumo nuostatomis</a>.
          </span>
        </label>
      </div>

      {/* Stripe card element (non-stub path, shown after /payment-intent) */}
      {clientSecret && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-5 mb-4">
          <p className="text-xs font-medium text-[#1E3A5F] mb-3">Mokėjimo duomenys</p>
          <div id="stripe-card-element" className="py-2" />
          {payError && <p className="text-xs text-[#DC3545] mt-2">{payError}</p>}
          <button
            onClick={handleStripeConfirm}
            disabled={paying}
            className={`mt-4 w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paying ? 'bg-[#CBD5E1] text-white cursor-not-allowed' : 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer'}`}
          >
            {paying ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Kraunama…
              </>
            ) : 'Patvirtinti mokėjimą'}
          </button>
        </div>
      )}

      {/* Pay error (non-card errors) */}
      {payError && payError !== 'expired' && !clientSecret && (
        <p className="text-sm text-[#DC3545] mb-4">{payError}</p>
      )}

      {/* Action buttons */}
      {!clientSecret && (
        <div className="flex gap-3">
          <button
            onClick={() => setState(s => ({ ...s, step: 2 }))}
            className="px-6 py-3 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] hover:border-[#1E3A5F] transition-all"
          >
            Atgal
          </button>
          <button
            onClick={handlePayment}
            disabled={!canPay}
            className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${canPay ? 'bg-[#0D7377] text-white hover:bg-[#0B6268] cursor-pointer' : 'bg-[#CBD5E1] text-white cursor-not-allowed'}`}
          >
            {paying ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Kraunama…
              </>
            ) : 'Mokėti ir gauti ataskaitą'}
          </button>
        </div>
      )}
    </div>
  );
}