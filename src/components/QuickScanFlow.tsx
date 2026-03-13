import { useState, useEffect, useRef } from 'react';

export type CaseType = 'existing_object' | 'new_build_project' | 'land_only';

export interface QuickScanState {
  step: 1 | 2 | 3;
  case_type: CaseType | null;
  ntr_unique_number: string | null;
  address_text: string | null;
  geo: { lat: number; lng: number } | null;
  project_website_url: string | null;
  project_doc_id: string | null;
  resolver_result: unknown | null;
  selected_candidate_id: string | null;
  user_epc: {
    energy_class?: string;
    kwhm2_year?: number;
    issue_year?: number;
    year_unknown?: boolean;
  } | null;
  quote: unknown | null;
  customer_email: string | null;
  consent_accepted: boolean;
  invoice_requested: boolean;
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
  customer_email: null,
  consent_accepted: false,
  invoice_requested: false,
  discount_token: typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token')
    : null,
});

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

function Screen2({
  state,
  setState,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
}) {
  return <p className="text-[#64748B] text-sm">Screen 2 — proof card.</p>;
}

function Screen3({
  state,
  setState,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
}) {
  return <p className="text-[#64748B] text-sm">Screen 3 — quote and payment.</p>;
}