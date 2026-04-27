// P7-A1: Interactive report page — ReportViewer shell
import { useState, useEffect } from 'react';
import { DEV_MOCKS, type ReportData } from './report/mockReportData';
import PropertyProfile from './report/PropertyProfile';
import Citations from './report/Citations';
import AdditionalDocuments from './report/AdditionalDocuments';
import PropertyMap from './report/PropertyMap';
import ConstructionPermits, { type Permit } from './report/ConstructionPermits';
import { DEV_MOCK_PERMITS } from './report/mockReportData';
import PropertyPhoto from './report/PropertyPhoto';
import ComfortBarComponent, {
  WINTER_LEVELS,
  SUMMER_LEVELS,
  mapWinterLevel,
  mapSummerLevel,
} from './report/ComfortBar';

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';

type ViewState = 'loading' | 'loaded' | 'not_found' | 'error';

// ─── Sub-components ───────────────────────────────────────────────

function ReportHeader({ data, token }: { data: ReportData; token: string | null }) {
  const pdfUrl = token ? `${API_BASE}/v1/reports/${token}/pdf` : null;

  return (
    <header className="bg-[#1E3A5F] text-white">
      <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-semibold tracking-tight">NT Duomenys</span>
          <span className="text-white/30">|</span>
          <span className="text-white/60 text-[13px]">ntd.lt</span>
        </div>
        {pdfUrl ? (
          <a
            href={pdfUrl}
            download
            className="text-sm text-white border border-white/40 min-h-[44px] inline-flex items-center px-4 py-2 rounded hover:bg-white/10 transition-colors no-underline"
          >
            Atsisiųsti PDF
          </a>
        ) : (
          <button
            disabled
            className="text-sm text-white/40 border border-white/20 min-h-[44px] inline-flex items-center px-4 py-2 rounded cursor-not-allowed"
            title="PDF atsisiuntimas bus prieinamas netrukus"
          >
            Atsisiųsti PDF
          </button>
        )}
      </div>
    </header>
  );
}

const BUNDLE_KIND_LABELS: Record<string, string> = {
  storage: 'sandėliukas',
  garage: 'garažas',
  parking: 'parkavimo vieta',
  other: 'kitas objektas',
};

function PropertyIdentity({ data }: { data: ReportData }) {
  const extras = data.bundle_items.filter(
    (b) => b.kind !== 'unit_in_building' && b.kind !== 'whole_building' && b.kind !== 'land_plot'
  );
  const profile = data.property_profile;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-[#1E3A5F] mb-1">{data.address}</h1>
      <div className="text-base text-slate-500 space-y-0.5">
        {data.ntr_unique_number && <p>NTR: {data.ntr_unique_number}</p>}
        <p>{data.municipality}</p>
        <p className="text-sm text-slate-400">
          Sugeneruota: {new Date(data.generated_at).toLocaleDateString('lt-LT')} &middot;{' '}
          {data.order_reference}
        </p>
      </div>
      <div className="mt-2 text-sm text-slate-500">
        <span>Vertinimo tipas: </span>
        <span className="font-medium text-slate-700">{profile.evaluation_target}</span>
        {extras.length > 0 && (
          <>
            <span className="mx-2 text-slate-300">·</span>
            <span>Komplekte taip pat yra: </span>
            <span className="font-medium text-slate-700">
              {extras.map((e) => BUNDLE_KIND_LABELS[e.kind] ?? e.kind).join(', ')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── EPC-style comfort bars (winter/summer) ──────────────────────

function WinterSummerBars({
  winter,
  summer,
}: {
  winter: NonNullable<ReportData['block1']['winter']>;
  summer: NonNullable<ReportData['block1']['summer']>;
}) {
  const winterActive = mapWinterLevel(winter.level);
  const summerActive = mapSummerLevel(summer.risk_level);
  const winterDesc = winter.rows.find((r) => r.highlighted)?.description_lt ?? '';
  const summerDesc = summer.rows.find((r) => r.highlighted)?.description_lt ?? '';

  return (
    <div className="bg-slate-50 rounded-xl p-5 md:p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ComfortBarComponent
          title="Žiemos komfortas"
          activeLevel={winterActive}
          levels={WINTER_LEVELS}
          description={winterDesc}
        />
        <ComfortBarComponent
          title="Vasaros perkaitimo rizika"
          activeLevel={summerActive}
          levels={SUMMER_LEVELS}
          description={summerDesc}
        />
      </div>
    </div>
  );
}

function SummarySection({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 cursor-pointer bg-transparent border-none min-h-[44px] py-2 mb-2"
      >
        <span
          className="text-[12px] text-[#0D7377] transition-transform duration-200"
          style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}
        >
          &#9654;
        </span>
        <h3 className="text-lg font-semibold text-[#1E3A5F] m-0">
          Ką tai reiškia praktiškai?
        </h3>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? '500px' : '0', opacity: expanded ? 1 : 0 }}
      >
        <p className="text-base text-slate-700 leading-relaxed pl-5">{summary}</p>
      </div>
    </div>
  );
}

function DriversSection({ drivers }: { drivers: ReportData['block1']['drivers'] }) {
  const active = drivers.filter((d) => d.active);
  const [closedKeys, setClosedKeys] = useState<Set<string>>(new Set());
  if (active.length === 0) return null;

  const toggle = (key: string) => {
    setClosedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-[#1E3A5F] mb-3">Pagrindiniai veiksniai</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {active.map((d) => {
          const isOpen = !closedKeys.has(d.key);
          return (
            <div key={d.key}>
              <button
                type="button"
                onClick={() => toggle(d.key)}
                className={`text-sm min-h-[44px] inline-flex items-center px-4 py-2 rounded-full border cursor-pointer transition-colors ${
                  d.direction === 'positive'
                    ? 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                    : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {d.label_lt} {d.direction === 'positive' ? '↗' : '↘'}
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: isOpen ? '200px' : '0', opacity: isOpen ? 1 : 0 }}
              >
                <p className="text-sm text-slate-600 leading-relaxed mt-1.5">
                  {d.explanation_lt}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoBox({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(true);
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 w-full text-left hover:bg-gray-100 transition-colors"
      >
        <span className="text-base">&#9432;</span>
        <span className="text-base font-medium text-[#1E3A5F]">
          Iš ko remiamės šiuo vertinimu?
        </span>
        <span
          className="ml-auto text-[12px] text-slate-400 transition-transform duration-200"
          style={{ display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0)' }}
        >
          &#9654;
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? '500px' : '0', opacity: expanded ? 1 : 0 }}
      >
        <ul className="mt-2 space-y-2 pl-4">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-slate-600 leading-relaxed list-disc">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LockedBlocksPreview() {
  const blocks = [
    { num: 2, name: 'Energijos sąnaudos' },
    { num: 3, name: '10 metų išlaidos' },
    { num: 4, name: 'Aplinkos tarša' },
    { num: 5, name: 'Teisinės rizikos' },
  ];
  return (
    <div className="space-y-3 mt-8">
      {blocks.map((b) => (
        <div
          key={b.num}
          className="w-full bg-gray-100 rounded-xl px-6 py-4 flex items-center gap-3 opacity-50"
        >
          <span className="text-[18px]">&#128274;</span>
          <div>
            <p className="text-base font-medium text-slate-400">
              {b.num}) {b.name} — netrukus
            </p>
            <p className="text-sm text-slate-300">Šis blokas bus prieinamas vėliau.</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportFooter({ data }: { data: ReportData }) {
  return (
    <footer className="mt-12 border-t border-gray-200 pt-6 pb-8 text-center">
      <p className="text-sm text-slate-400">
        Ataskaita sugeneruota: {new Date(data.generated_at).toLocaleDateString('lt-LT')}.{' '}
        NT Duomenys | ntd.lt
      </p>
      <p className="text-sm text-slate-400 mt-1">Klausimai? info@ntd.lt</p>
    </footer>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function ReportViewer() {
  const [state, setState] = useState<ViewState>('loading');
  const [data, setData] = useState<ReportData | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [permitsLoading, setPermitsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const segments = window.location.pathname.split('/report/');
    const tkn = segments[1]?.replace(/\/$/, '');
    if (!tkn) {
      setState('not_found');
      return;
    }
    setToken(tkn);

    // Dev mock bypass
    if (tkn in DEV_MOCKS) {
      setData(DEV_MOCKS[tkn]);
      setState('loaded');
      // Load mock permits
      const mockPermits = DEV_MOCK_PERMITS[tkn] ?? [];
      if (mockPermits.length > 0) {
        setPermitsLoading(true);
        setTimeout(() => {
          setPermits(mockPermits);
          setPermitsLoading(false);
        }, 500);
      }
      return;
    }

    // Real API fetch
    fetch(`${API_BASE}/v1/reports/${tkn}`)
      .then((r) => {
        if (r.status === 404) {
          setState('not_found');
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (json?.ok && json.data) {
          setData(json.data);
          setState('loaded');
        }
      })
      .catch(() => {
        setState('error');
      });
  }, []);

  // Async enrichment: fetch permits after report data is loaded
  useEffect(() => {
    if (!data || data.property_profile.evaluation_target === 'Žemės sklypas') return;
    // Skip for dev mocks (handled above)
    const segments = window.location.pathname.split('/report/');
    const token = segments[1]?.replace(/\/$/, '');
    if (token && token in DEV_MOCKS) return;

    const ntr = data.ntr_unique_number;
    const addr = data.address;
    if (!ntr && !addr) return;

    setPermitsLoading(true);
    const params = new URLSearchParams();
    if (ntr) params.set('ntr', ntr);
    else params.set('address', addr);

    fetch(`${API_BASE}/v1/enrichment/infostatyba?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.permits) setPermits(json.permits);
      })
      .catch(() => {})
      .finally(() => setPermitsLoading(false));
  }, [data]);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-3 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
        <p className="text-base text-slate-500">Kraunama ataskaita...</p>
      </div>
    );
  }

  if (state === 'not_found') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-[440px] text-center">
          <p className="text-lg text-[#1E3A5F] font-medium mb-2">Ataskaita nerasta</p>
          <p className="text-base text-slate-500 mb-6">
            Nuoroda gali būti netinkama arba pasibaigusi.
          </p>
          <a
            href="/"
            className="inline-block text-base text-white bg-[#1E3A5F] px-5 py-2 rounded hover:opacity-90 transition-opacity no-underline"
          >
            Grįžti į pradžią
          </a>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-[440px] text-center">
          <p className="text-lg text-[#1E3A5F] font-medium mb-2">
            Nepavyko įkelti ataskaitos
          </p>
          <p className="text-base text-slate-500 mb-6">Bandykite dar kartą.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-base text-white bg-[#1E3A5F] px-5 py-2 rounded hover:opacity-90 transition-opacity cursor-pointer border-none"
          >
            Bandyti dar kartą
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { block1 } = data;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <ReportHeader data={data} token={token} />
      <main className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
        <div data-guide="street-view">
          <PropertyPhoto
            lat={data.lat}
            lng={data.lng}
            address={data.address}
            devToken={token && token in DEV_MOCKS ? token : undefined}
          />
        </div>

        <div data-guide="property-identity">
          <PropertyIdentity data={data} />
        </div>

        {data.property_profile.evaluation_target !== 'Žemės sklypas' && (
          <PropertyMap lat={data.lat} lng={data.lng} address={data.address} />
        )}

        <PropertyProfile
          profile={data.property_profile}
          lat={data.lat}
          lng={data.lng}
          address={data.address}
        />

        {/* Standalone map for land-only (PropertyProfile returns null) */}
        {data.property_profile.evaluation_target === 'Žemės sklypas' && (
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Sklypo vieta</h2>
            <PropertyMap lat={data.lat} lng={data.lng} address={data.address} />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          {!block1.applicable ? (
            <>
              <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-2">1) Vidaus patalpų klimato komfortas</h2>
              <p className="text-base text-slate-600 mb-6 leading-relaxed">
                Šiame bloke apžvelgiame, kiek lengva šiame būste palaikyti komfortišką temperatūrą
                žiemą ir kokia yra perkaitimo rizika vasarą.
              </p>
              <div className="bg-gray-50 rounded-lg px-6 py-5 text-base text-slate-600">
                {block1.neutral_message_lt}
              </div>
            </>
          ) : (
            <>
              <div data-guide="climate-assessment">
                <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-2">1) Vidaus patalpų klimato komfortas</h2>
                <p className="text-base text-slate-600 mb-6 leading-relaxed">
                  Šiame bloke apžvelgiame, kiek lengva šiame būste palaikyti komfortišką temperatūrą
                  žiemą ir kokia yra perkaitimo rizika vasarą.
                </p>
                {block1.winter && block1.summer && (
                  <WinterSummerBars winter={block1.winter} summer={block1.summer} />
                )}
                {block1.summary_lt && <SummarySection summary={block1.summary_lt} />}
              </div>
              <div data-guide="drivers">
                <DriversSection drivers={block1.drivers} />
                <InfoBox items={block1.info_box.items_lt} />
              </div>
            </>
          )}
        </div>

        <div data-guide="permits"><ConstructionPermits permits={permits} loading={permitsLoading} /></div>
        <div data-guide="locked-blocks"><LockedBlocksPreview /></div>
        <AdditionalDocuments />
        <Citations
          snapshot={block1.inputs_snapshot}
          generatedAt={data.generated_at}
          glazingSource={data.property_profile.glazing_source}
        />
        <ReportFooter data={data} />
      </main>
    </div>
  );
}
