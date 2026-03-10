import { useState } from 'react';

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

  return (
    <div>
      {state.step === 1 && <Screen1 state={state} setState={setState} />}
      {state.step === 2 && <Screen2 state={state} setState={setState} />}
      {state.step === 3 && <Screen3 state={state} setState={setState} />}
    </div>
  );
}

const CASES: { value: CaseType; label: string; note: string }[] = [
  {
    value: 'existing_object',
    label: 'Esamą registruose matomą pastatą/patalpas.',
    note: '',
  },
  {
    value: 'new_build_project',
    label: 'Naujai statomą ar ką tik baigtą pastatą/patalpas šiame sklype.',
    note: 'Šiuo atveju vertinsime planuojamą ar ką tik baigtą pastatą šiame sklype. Registruose nauji projektai dažnai dar nematomi, todėl prireiks šiek tiek jūsų projekto informacijos.',
  },
  {
    value: 'land_only',
    label: 'Tik žemės sklypą (be šildomų pastatų — gali būti ir visiškai tuščias sklypas, ir sklypas su atvira automobilių aikštele).',
    note: 'Šiuo vertinime apžvelgsime tik žemės sklypą — be esamų ar būsimų šildomų pastatų.',
  },
];

const NTR_REGEX = /^\d{4}-\d{4}-\d{4}(:\d{1,6})?$/;

const LOCATION_TITLES: Record<CaseType, string> = {
  existing_object: 'Kaip patogiausia nurodyti šio būsto vietą?',
  new_build_project: 'Kaip patogiausia nurodyti sklypo / NT objekto vietą?',
  land_only: 'Kaip patogiausia nurodyti šio žemės sklypo vietą?',
};

function Screen1({
  state,
  setState,
}: {
  state: QuickScanState;
  setState: React.Dispatch<React.SetStateAction<QuickScanState>>;
}) {
  const selected = state.case_type;
  const [ntrInput, setNtrInput] = useState('');
  const [ntrTouched, setNtrTouched] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  const ntrValid = NTR_REGEX.test(ntrInput.trim());
  const addressValid = addressInput.trim().length > 5;
  const locationValid = ntrValid || addressValid;
  const canProceed = !!selected && locationValid;

  function handleNtrChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^\d:]/g, '');
    const digits = v.replace(/\D/g, '');
    if (digits.length <= 4) v = digits;
    else if (digits.length <= 8) v = digits.slice(0, 4) + '-' + digits.slice(4);
    else v = digits.slice(0, 4) + '-' + digits.slice(4, 8) + '-' + digits.slice(8, 12);
    setNtrInput(v);
    setState((s) => ({ ...s, ntr_unique_number: v || null }));
  }

  function handleAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAddressInput(e.target.value);
    setState((s) => ({ ...s, address_text: e.target.value || null }));
  }

  function handleTesti() {
    // P6-B will replace this with the /resolve call
    setState((s) => ({ ...s, step: 2 }));
  }

  return (
    <div className="max-w-2xl">
      {/* Case selection */}
      <h1 className="text-2xl font-semibold text-[#1E3A5F] mb-2">
        Ką tiksliai norite įvertinti?
      </h1>
      <p className="text-sm text-[#64748B] mb-6">
        Tai padeda parinkti tinkamiausią logiką jūsų situacijai.
      </p>

      <div className="flex flex-col gap-3 mb-8">
        {CASES.map((c) => {
          const active = selected === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setState((s) => ({ ...s, case_type: c.value }))}
              className={[
                'text-left px-5 py-4 rounded-lg border transition-all',
                active
                  ? 'border-[#0D7377] bg-[#E8F4F8] text-[#1A1A2E]'
                  : 'border-[#E2E8F0] bg-white text-[#1A1A2E] hover:border-[#0D7377]',
              ].join(' ')}
            >
              <span className="text-sm font-medium">{c.label}</span>
              {active && c.note && (
                <p className="mt-2 text-xs text-[#64748B]">{c.note}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Location block — always visible */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[#1E3A5F] mb-4">
          {selected
            ? LOCATION_TITLES[selected]
            : 'Kaip patogiausia nurodyti objekto vietą?'}
        </h2>

        <div className="flex flex-col gap-4">

          {/* NTR */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              NTR unikalus numeris
              {ntrValid && (
                <span className="ml-2 text-[#059669] text-xs">✓ naudosime šį</span>
              )}
            </label>
            <input
              type="text"
              value={ntrInput}
              onChange={handleNtrChange}
              onBlur={() => setNtrTouched(true)}
              placeholder="1234-5678-9012"
              maxLength={14}
              className={[
                'w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all',
                ntrValid
                  ? 'border-[#059669] bg-white'
                  : ntrTouched && ntrInput
                  ? 'border-[#DC3545] bg-white'
                  : 'border-[#E2E8F0] bg-white focus:border-[#0D7377]',
              ].join(' ')}
            />
            {ntrTouched && ntrInput && !ntrValid && (
              <p className="text-xs text-[#DC3545] mt-1">
                Formatas: 1234-5678-9012
              </p>
            )}
            <p className="text-xs text-[#64748B] mt-1">
              Jei turite NTR numerį, tai greičiausias ir tiksliausias būdas rasti objektą.
            </p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Adresas
              {!ntrValid && addressValid && (
                <span className="ml-2 text-[#059669] text-xs">✓ naudosime šį</span>
              )}
            </label>
            <input
              type="text"
              value={addressInput}
              onChange={handleAddressChange}
              placeholder="Pradėkite rašyti adresą (gatvė, numeris, miestas)..."
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#0D7377] transition-all"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Automatinis pasiūlymų sąrašas — kitame žingsnyje.
            </p>
          </div>

          {/* Map pin placeholder */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm text-[#64748B]">
            🗺 Pažymėti vietą žemėlapyje — bus pridėta kitame žingsnyje.
          </div>

          {/* Listing URL — backend not yet implemented */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Skelbimo nuoroda
            </label>
            <input
              type="url"
              disabled
              placeholder="pvz. https://www.aruodas.lt/..."
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#64748B] cursor-not-allowed"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Aruodas.lt, Domoplius.lt ir kt. — sistema pati identifikuos objektą. Ši funkcija bus pridėta netrukus.
            </p>
          </div>

        </div>
      </div>

      {/* New-build project inputs — card 2 only */}
      {selected === 'new_build_project' && (
        <div className="mb-8 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-5">
          <h2 className="text-base font-semibold text-[#1E3A5F] mb-1">
            Papildoma informacija apie naują projektą (pasirinktinai šiame žingsnyje)
          </h2>
          <p className="text-xs text-[#64748B] mb-4">
            Nauji projektai registruose dažnai dar nematomi. Vertinimas sujungs informaciją apie sklypą su jūsų pateiktais projekto duomenimis. Jei šiuo metu patogu, galite įkelti nuorodą ar PDF — jie bus panaudoti vertinime.
          </p>

          {/* Project URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
              Projekto svetainės adresas
            </label>
            <input
              type="url"
              placeholder="pvz., https://..."
              onChange={(e) =>
                setState((s) => ({ ...s, project_website_url: e.target.value || null }))
              }
              className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#0D7377] transition-all"
            />
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // P6-B: replace with real POST /upload-project-doc call
                    setState((s) => ({ ...s, project_doc_id: 'pending_upload' }));
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
      <button
        disabled={!canProceed}
        onClick={handleTesti}
        className="px-6 py-3 rounded-lg text-sm font-semibold bg-[#1E3A5F] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        Tęsti
      </button>
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