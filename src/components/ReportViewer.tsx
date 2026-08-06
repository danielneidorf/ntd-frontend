// P7-A1: Interactive report page — ReportViewer shell
import { useState, useEffect, useId } from 'react';
import { DEV_MOCKS, type ReportData } from './report/mockReportData';
import { InfoSection, INFO_SECTION_BODY } from './report/InfoSection';
import PropertyProfile from './report/PropertyProfile';
import Citations from './report/Citations';
import AdditionalDocuments from './report/AdditionalDocuments';
import PropertyMap from './report/PropertyMap';
import ConstructionPermits, { type Permit } from './report/ConstructionPermits';
import { DEV_MOCK_PERMITS } from './report/mockReportData';
import { Block8Section } from './report/Block8Section';
import { Block2Section } from './report/Block2Section';
import PropertyPhoto from './report/PropertyPhoto';
import UploadNotUsedNotice from './report/UploadNotUsedNotice';
import { buildPdfUrl } from './report/pdfUrl';
import ComfortBarComponent, {
  WINTER_LEVELS,
  SUMMER_LEVELS,
  mapWinterLevel,
  mapSummerLevel,
  WINTER_NOT_ASSESSED,
} from './report/ComfortBar';

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? 'http://127.0.0.1:8100';

type ViewState = 'loading' | 'loaded' | 'not_found' | 'error';

// ─── Sub-components ───────────────────────────────────────────────

function ReportHeader({
  data,
  token,
  householdSize,
}: {
  data: ReportData;
  token: string | null;
  householdSize: number | null;
}) {
  // B2-14: the download carries the current household-size selection so the
  // PDF renders the same personalised view the customer is looking at.
  const pdfUrl = buildPdfUrl(API_BASE, token, householdSize);

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

// The free rebuild, when the backend says there is one. Two states and only
// two: an offer (a button that mints the invitation and walks the customer
// back into the journey) or a report that has already been rebuilt (a link to
// it). The page never decides which — it renders what it is handed, or nothing.
function WinterRecourse({ recourse }: { recourse: NonNullable<ReportData['recourse']> }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (recourse.state === 'rebuilt' && recourse.report_url) {
    return (
      <p className="text-sm text-slate-600 leading-relaxed mt-3" data-winter-recourse="rebuilt">
        {recourse.sentence_lt}{' '}
        <a href={recourse.report_url} className="text-[#0D7377] underline font-medium">
          {recourse.action_label_lt}
        </a>
      </p>
    );
  }

  if (!recourse.mint_path) return null;

  const order = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`${API_BASE}${recourse.mint_path}`, { method: 'POST' });
      const json = await response.json();
      const next = json?.data?.invite_url ?? json?.data?.report_url;
      if (!next) throw new Error('no destination');
      window.location.href = next;
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <div className="mt-3" data-winter-recourse="offer">
      {/* No sentence here: the gate ruled №20 as ONE sentence carrying both the
          cause and the offer, so it is already rendered above as the failure
          message. A second line would repeat it. */}
      <button
        onClick={order}
        disabled={busy}
        className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: '#0D7377' }}
      >
        {busy ? 'Ruošiama...' : recourse.action_label_lt}
      </button>
      {failed && (
        <p className="text-xs text-[#DC3545] mt-2">
          {/* №35, ruled at the gate's sitting-two addendum. The build's draft
              („Nepavyko. Bandykite dar kartą…") was reworded: the ruled line
              names what failed and keeps the address as the second resort. */}
          Užsakyti perskaičiavimo nepavyko. Bandykite dar kartą — jei nepavyks,
          parašykite mums adresu ntd@ntd.lt.
        </p>
      )}
    </div>
  );
}

function WinterSummerBars({
  winter,
  summer,
  recourse,
}: {
  winter: NonNullable<ReportData['block1']['winter']>;
  summer: NonNullable<ReportData['block1']['summer']>;
  recourse?: ReportData['recourse'];
}) {
  const winterActive = mapWinterLevel(winter.level);
  const winterNotAssessed = winterActive === WINTER_NOT_ASSESSED;
  // №14 — served. The frontend twin that composed this from a local Lithuanian
  // map is deleted: one sentence, one origin, both surfaces.
  const winterEstimateNote = winter.provenance_message_lt;
  const summerActive = mapSummerLevel(summer.risk_level);
  return (
    <div className="bg-slate-50 rounded-xl p-5 md:p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {winterNotAssessed ? (
          // No band — say we couldn't assess, and why. Never an A–E bar / colour.
          <div data-winter-not-assessed>
            {/* №8 — served, and now also the accessible name of the region
                below (see the assessed branch). */}
            <h3 className="text-lg font-semibold text-[#1E3A5F] mb-3">{winter.title_lt}</h3>
            <div
              className="rounded-md flex items-center px-3"
              style={{ height: '34px', backgroundColor: '#94A3B8', width: '100%' }}
            >
              <span className="text-white text-sm font-semibold">Neįvertinta</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mt-3">
              {/* №11–14, served — the frontend map that held a second copy of
                  these sentences is deleted. `technical_error` is deliberately
                  not ours: the recalculation road serves that one together with
                  the recourse it points at, just below. */}
              {winter.not_assessed_message_lt}
            </p>
            {recourse && <WinterRecourse recourse={recourse} />}
          </div>
        ) : (
          <div>
            <ComfortBarComponent
              title={winter.title_lt}
              activeLevel={winterActive}
              levels={WINTER_LEVELS}
            />
            {/* Description + the A++/C-floor comparison lines moved into
                „Ką tai reiškia praktiškai?" (2026-07-22). The provenance note
                below STAYS: it qualifies how the verdict was derived, which
                belongs to the bar, not to practical meaning. */}
            {winterEstimateNote && (
              <p
                data-winter-estimate
                className="text-xs italic text-slate-500 leading-relaxed mt-2"
              >
                {winterEstimateNote}
              </p>
            )}
          </div>
        )}
        <ComfortBarComponent
          title="Vasaros perkaitimo rizika"
          activeLevel={summerActive}
          levels={SUMMER_LEVELS}
        />
      </div>
    </div>
  );
}

export function SummarySection({
  winter,
  summer,
}: {
  winter: NonNullable<ReportData['block1']['winter']>;
  summer: NonNullable<ReportData['block1']['summer']>;
}) {
  // The per-season descriptions live HERE, not under their bars (ruling
  // 2026-07-22). The bars keep bar + verdict + chips; the practical meaning
  // sits in the section whose heading promises it. Detached from their bars,
  // each paragraph names its own season — the only new copy in the move.
  // The winter comparison lines travel WITH the winter paragraph: „11 kartų"
  // and „~+97 %" are its substance, and explain nothing stranded under a bar.
  const [expanded, setExpanded] = useState(true);
  const winterDesc = winter.rows?.find((r) => r.highlighted)?.description_lt ?? '';
  const summerDesc = summer.rows?.find((r) => r.highlighted)?.description_lt ?? '';
  const comparisons = winter.comparison_lines_lt ?? [];
  // One body style for the whole „Ką tai reiškia praktiškai?" section (2026-07-27):
  // the winter/summer descriptions AND the etalon comparison lines read as one voice.
  // The comparison lines previously kept their under-the-bar footnote styling
  // (text-sm / slate-600) and read as footnotes to the paragraph they now belong to —
  // routing all three through one constant makes the harmony structural, not
  // coincidental, so they can't silently re-drift.
  const SEASON_BODY = 'text-base text-slate-700 leading-relaxed';
  if (!winterDesc && !summerDesc) return null;

  return (
    <div className="mb-6" data-practical-meaning>
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
        style={{ maxHeight: expanded ? '2000px' : '0', opacity: expanded ? 1 : 0 }}
      >
        <div className="pl-5">
          {winterDesc && (
            <div className="mb-4" data-season="winter">
              <h4 className="text-sm font-semibold text-[#1E3A5F] mb-1">Žiema</h4>
              <p className={SEASON_BODY}>{winterDesc}</p>
              {comparisons.map((line, i) => (
                <p
                  key={i}
                  data-winter-comparison
                  className={`${SEASON_BODY} mt-2`}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
          {summerDesc && (
            <div data-season="summer">
              <h4 className="text-sm font-semibold text-[#1E3A5F] mb-1">Vasara</h4>
              <p className={SEASON_BODY}>{summerDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DriversSection({
  drivers,
  title = 'Pagrindiniai veiksniai',
  sectionAttr = 'summer-drivers',
}: {
  drivers: ReportData['block1']['drivers'];
  // №9 when the winter-factors caller passes the served heading. Nullable
  // because the wire is; the summer caller keeps the default, which is NOT in
  // the ruled eighteen and rides the extinction pin's allowlist with that
  // reason.
  title?: string | null;
  sectionAttr?: string;
}) {
  const active = drivers.filter((d) => d.active);
  const [closedKeys, setClosedKeys] = useState<Set<string>>(new Set());
  const headingId = useId();
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
    // Named by its own heading, so the factor tiles are announced as one group
    // and not as a loose run of cards (the №9 half of the accessibility work).
    <div className="mb-6" data-block1={sectionAttr} role="group" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-lg font-semibold text-[#1E3A5F] mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {active.map((d) => {
          const isOpen = !closedKeys.has(d.key);
          return (
            <div key={d.key}>
              <button
                type="button"
                onClick={() => toggle(d.key)}
                className={`text-sm min-h-[44px] inline-flex items-center px-4 py-2 rounded-full border cursor-pointer transition-colors ${
                  // Risk-effect semantics: 'increase' raises overheating risk
                  // (↗ amber, caution); 'decrease' is protective (↘ green, reserved v1).
                  d.direction === 'increase'
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                }`}
              >
                {d.label_lt} {d.direction === 'increase' ? '↗' : '↘'}
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

// Block 1's basis box — now the shared collapsible idiom under the shared title
// („Iš ko remiamės šiuo vertinimu?" retired), collapsed by default (was open).
function InfoBox({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <InfoSection>
      {/* Paragraphs, not bullets — the shared info-section body idiom (one origin
          with Block 2's section via INFO_SECTION_BODY). Same body typography and
          spacing rhythm; the strings are unchanged. */}
      <div data-block1="info-section" className={`${INFO_SECTION_BODY} mt-3 px-1`}>
        {items.map((item, i) => (
          <p key={i} className="whitespace-pre-line">{item}</p>
        ))}
      </div>
    </InfoSection>
  );
}

function ReportFooter({ data }: { data: ReportData }) {
  return (
    <footer className="mt-12 border-t border-gray-200 pt-6 pb-8 text-center">
      <p className="text-sm text-slate-400">
        Ataskaita sugeneruota: {new Date(data.generated_at).toLocaleDateString('lt-LT')}.{' '}
        NT Duomenys | ntd.lt
      </p>
      <p className="text-sm text-slate-400 mt-1">Klausimai? ntd@ntd.lt</p>
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
  // B2-14: household-size selection. `null` means "not yet picked" — the view
  // then falls to the served standard occupancy (ruling 2026-07-23; see
  // `selectedSize` below), so the customer never sees a bare building-only
  // headline. Lives here because both Block2Section (selector + swap) and the
  // header's PDF link (?household_size=N) read the effective size.
  const [householdSize, setHouseholdSize] = useState<number | null>(null);

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

  // Ruling 2026-07-23: the DEFAULT view is the standard-occupancy household.
  // Until the customer picks a size, fall to the served standard occupancy —
  // so the headline is the standard-household total (€104), not the bare
  // building-only base. Non-residential (no standard_occupancy) → null → the
  // building-only view with no selector, unchanged. `setHouseholdSize` stays
  // the setter; there is no bare-building state to return to (Block2Section
  // no longer toggles a selection off).
  const selectedSize = householdSize ?? data.block2?.standard_occupancy ?? null;
  // Coordinates are nullable on the wire (see the ReportData type). Gate the
  // point-dependent visuals rather than hand them a null.
  const hasCoords = data.lat != null && data.lng != null;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <ReportHeader data={data} token={token} householdSize={selectedSize} />
      <main className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
        {/* Coordinates are nullable on the wire — a plot resolved without them
            serves null (surfaced 2026-07-31 when MOCK_LAND_ONLY was regenerated
            from the backend; the hand-written mock had been supplying invented
            values, so this shape had never reached the bench). Street View and
            the map are meaningless without a point, so they are gated rather
            than handed a null that would render at 0,0. */}
        {hasCoords && (
          <div data-guide="street-view">
            <PropertyPhoto
              lat={data.lat!}
              lng={data.lng!}
              address={data.address}
              devToken={token && token in DEV_MOCKS ? token : undefined}
            />
          </div>
        )}

        <div data-guide="property-identity">
          <PropertyIdentity data={data} />
        </div>

        {hasCoords && data.property_profile.evaluation_target !== 'Žemės sklypas' && (
          <PropertyMap lat={data.lat!} lng={data.lng!} address={data.address} />
        )}

        <PropertyProfile
          profile={data.property_profile}
          lat={data.lat}
          lng={data.lng}
          address={data.address}
          betweenSections={
            // Infostatyba sits between "Pastato charakteristikos" and
            // "Energinis naudingumas" — same order as the PDF.
            <div data-guide="permits">
              <ConstructionPermits permits={permits} loading={permitsLoading} />
            </div>
          }
        />

        {/* Standalone map for land-only (PropertyProfile returns null) */}
        {hasCoords && data.property_profile.evaluation_target === 'Žemės sklypas' && (
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">Sklypo vieta</h2>
            <PropertyMap lat={data.lat!} lng={data.lng!} address={data.address} />
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
                {/* G2 Piece 1: the certificate sentence, served and rendered on
                    BOTH surfaces from one origin. Above the bars, as in print —
                    it explains what the assessment below is built from. Silent
                    when no upload needed explaining. */}
                <UploadNotUsedNotice message={block1.upload_not_used_message_lt} />
                {block1.winter && block1.summer && (
                  <WinterSummerBars
                    winter={block1.winter}
                    summer={block1.summer}
                    recourse={data.recourse}
                  />
                )}
                {/* Driver merge: winter-comfort factors under the winter bar
                    (Option A, two-way). Summer tags stay in their own section
                    below. Hidden when none active (render-safe). */}
                {/* №9 — served heading, and the accessible name of the region
                    it introduces. */}
                <DriversSection
                  drivers={block1.winter_factors}
                  title={block1.winter_factors_title_lt}
                  sectionAttr="winter-factors"
                />
                {block1.winter && block1.summer && (
                  <SummarySection winter={block1.winter} summer={block1.summer} />
                )}
              </div>
              <div data-guide="drivers">
                <DriversSection drivers={block1.drivers} />
                <InfoBox items={block1.info_box.items_lt} />
              </div>
            </>
          )}
        </div>

        <Block2Section
          block2={data.block2}
          householdSize={selectedSize}
          onHouseholdSizeChange={setHouseholdSize}
        />

        <Block8Section block8={data.block8} />

        <AdditionalDocuments documentsLt={data.documents_lt} />
        <Citations
          titleLt={data.citations_title_lt}
          block1Citations={data.citations ?? []}
          block2CitationsLt={[
            ...(data.block2?.citations_lt ?? []),
            ...(selectedSize != null && data.block2?.household_modelling
              ? data.block2.household_modelling.citation_lt.lines_lt
              : []),
          ]}
        />
        <ReportFooter data={data} />
      </main>
    </div>
  );
}
