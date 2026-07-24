// B2-13: Block 2 — Energy costs section.
// Renders backend-rendered LT prose + the priced breakdown and charts. Authors
// no report copy (all strings come from `data.block2`); only chart band/legend
// labels + the carrier→colour map are local UI chrome, kept in sync with the
// PDF chart palettes (forecast.py §14.3 / monthly_variation.py §2.4).
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useState } from 'react';
import type { Block2Data } from './mockReportData';

interface Block2SectionProps {
  block2: Block2Data | undefined;
  // B2-14 selector state lives in ReportViewer (the PDF download link needs
  // it too); the section stays controlled. Optional so legacy call sites and
  // payloads render the static default exactly as before.
  householdSize?: number | null;
  onHouseholdSizeChange?: (size: number | null) => void;
}

const MONTHS_LT = ['Sau', 'Vas', 'Kov', 'Bal', 'Geg', 'Bir', 'Lie', 'Rgp', 'Rgs', 'Spa', 'Lap', 'Gru'];

// THE component band list — one origin for BOTH charts (ruling 2026-07-24).
// Bottom→top: fixed → DHW → heating → cooling → household electricity, the same
// order and palette the backend's shared `chart_bands` module serves to the PDF.
// `band` keys the forecast's per_component map; `monthlyKey` keys the monthly
// row. Never add a second list — the forecast used to carry a rival CARRIER
// palette, which made "same palette as the forecast" unimplementable and even
// collided on hue (#E67E22 was heating on one chart, solar on the other).
const COMPONENT_BANDS: {
  band: string; monthlyKey: string; label: string; color: string;
}[] = [
  { band: 'fixed', monthlyKey: 'fixed_eur', label: 'Pastovūs mokesčiai', color: '#7F8C8D' },
  { band: 'dhw', monthlyKey: 'dhw_eur', label: 'Karštas vanduo', color: '#2980B9' },
  { band: 'heating', monthlyKey: 'heating_eur', label: 'Šildymas', color: '#E67E22' },
  { band: 'cooling', monthlyKey: 'cooling_eur', label: 'Vėsinimas', color: '#48C9B0' },
  { band: 'household_electricity', monthlyKey: 'household_electricity_eur', label: 'Buitinė elektra', color: '#8E44AD' },
];

const eur = (v: number | null | undefined) => (v == null ? '—' : `€${Math.round(v)}`);

// Glance anchors (ruling 2026-07-24, adjusted same day) — ONE origin, so both
// charts read as siblings: same typography, same whole-euro rounding.
//
// Both charts carry a mirrored right-edge ruler WITH labels, so a height reads
// against the edge nearest it. Only the MONTHLY chart carries an in-chart
// numeral — the average, the one level its bars do not show (peak and trough
// are self-evident from the bars themselves). The forecast carries none: once
// the right axis was readable, a floating year-5 figure only duplicated it.
const AVG_LINE_COLOR = '#2C3E50';
// The PDF's exact wording, reused — no new copy. The PDF legend already names
// this line; the web did not, which made it a web/PDF content-parity gap.
const AVERAGE_LABEL_LT = 'Vidutinė mėnesinė kaina';
// The forecast chart's heading. Corrected 2026-07-24 from „Prognozinė mėnesinė
// energijos kaina per 5 metus" — the chart plots how the monthly cost *changes*
// across five years, not one forecast price. Exported because the PDF holds the
// same string in its own literal (forecast.py FORECAST_CHART_TITLE_LT) and a
// backend test asserts the two are character-identical; without that pin a
// correction to one surface leaves the other silently stale.
export const FORECAST_CHART_TITLE_LT =
  'Prognozuojamas mėnesio energijos kainos kitimas (per 5 metus)';

export type LegendEntry = { key: string; label: string; color: string; dashed?: boolean };

/** Legend entries for a chart — pure, so the dashed entry is testable without
 *  Recharts (which does not render in jsdom). */
export function legendEntries(
  bands: { band: string; label: string; color: string }[],
  dashedLabel?: string,
): LegendEntry[] {
  const entries: LegendEntry[] = bands.map((b) => ({ key: b.band, label: b.label, color: b.color }));
  if (dashedLabel) entries.push({ key: 'average', label: dashedLabel, color: AVG_LINE_COLOR, dashed: true });
  return entries;
}

/** Rendered legend — ONE renderer for both charts, so they stay siblings.
 *  Recharts' own `payload` prop was silently ignored in this version (the
 *  dashed entry never appeared and the order was Recharts' own), so the legend
 *  is rendered by us rather than configured. */
function ChartLegend({ entries }: { entries: LegendEntry[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 m-0 p-0 list-none text-xs text-slate-600">
      {entries.map((e) => (
        <li key={e.key} className="flex items-center gap-1.5">
          {e.dashed ? (
            <svg width="18" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="18" y2="4" stroke={e.color} strokeWidth="1.5" strokeDasharray="5 4" />
            </svg>
          ) : (
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
          )}
          {e.label}
        </li>
      ))}
    </ul>
  );
}
// Placed ABOVE the line, never crossed by it (adjustment 2026-07-24).
const anchorLabel = (v: number) => ({
  value: eur(v),
  position: 'top' as const,
  fontSize: 12,
  fontWeight: 500,
  fill: '#1E3A5F',
});
// One domain + tick set, shared by the left axis and the right ruler.
//
// Two reasons this is computed rather than left to Recharts. (1) A right axis
// with no series bound to it gets no domain, so it renders as a bare line with
// no labels — which is exactly the "I still can't see the axis" defect.
// (2) Letting each axis derive its own ticks lets them DRIFT apart; the PDF's
// twin axis did precisely that, showing 0/20/…/180 against the left's
// 0/25/…/175. Shared inputs make a mirror a mirror.
const niceStep = (raw: number) => {
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = (raw || 1) / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
};
function axisScale(maxValue: number) {
  const step = niceStep(Math.max(maxValue, 1) / 4);
  const top = Math.ceil(Math.max(maxValue, 1) / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return { domain: [0, top] as [number, number], ticks };
}
// The mirrored right-edge ruler. Amended 2026-07-24 — it first shipped
// label-less ("ticks and scale only"), which rendered as a bare border line
// with nothing readable. A ruler you cannot read values off is not a ruler.
//
// RULER_BINDING_NOTE — why each chart carries an invisible <Area>:
// Recharts drops any axis no series references, so a mirrored second axis needs
// a series bound to it or it renders nothing. The binding must be an AREA even
// on the bar chart: bar series each claim an equal share of the category slot,
// so an invisible *bar* binding silently halved every visible bar (reported
// 2026-07-24 as "the bars became twice as slim"). Areas claim no slot. That is
// also why the monthly chart is a ComposedChart rather than a BarChart.
// Keep both axes on the same `domain`/`ticks` — a second axis left to its own
// locator drifts, which is exactly how the PDF's twin axis ended up reading
// 0/20/…/180 against the left's 0/25/…/175.
const RULER = {
  yAxisId: 'right' as const,
  orientation: 'right' as const,
  tickFormatter: (v: number) => eur(v),
  width: 44,
  tick: { fontSize: 11, fill: '#64748b' },
  axisLine: { stroke: '#cbd5e1' },
  tickLine: { stroke: '#cbd5e1' },
};

function MonthlyChart({ data }: { data: NonNullable<Block2Data['monthly_variation']> }) {
  // Only stack bands that are non-zero somewhere (cooling / household electricity
  // are €0 in the building-only v1, so they drop out of the legend).
  const bands = COMPONENT_BANDS.filter((b) =>
    data.some((m) => ((m as Record<string, number>)[b.monthlyKey] ?? 0) > 0),
  );
  const rows = data.map((m) => ({ name: MONTHS_LT[m.month - 1] ?? String(m.month), ...m }));
  const monthTotals = rows.map((r) => bands.reduce((t, b) => t + ((r as Record<string, number>)[b.monthlyKey] ?? 0), 0));
  const avg = monthTotals.reduce((s, v) => s + v, 0) / (rows.length || 1);
  const scale = axisScale(Math.max(...monthTotals, 0));

  return (
    <div data-block2="monthly-chart">
      {/* Legend rendered OUTSIDE Recharts. Routing it through <Legend> — by
          `payload` or by `content` — either got silently ignored or left every
          series marked `recharts-inactive-bar`, i.e. the bars stopped drawing.
          Outside, we own it completely and it cannot touch series state. */}
      <ChartLegend entries={legendEntries(bands, AVERAGE_LABEL_LT)} />
      <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `€${v}`} width={44} domain={scale.domain} ticks={scale.ticks} />
          <YAxis {...RULER} domain={scale.domain} ticks={scale.ticks} />
          <Tooltip formatter={(v: number, n) => [eur(v), n]} />
          {/* The dashed average is NAMED here; its value is the in-chart
              numeral below — name and number, once each. */}
          {bands.map((b) => (
            <Bar key={b.band} yAxisId="left" dataKey={b.monthlyKey} stackId="m" fill={b.color} name={b.label} />
          ))}
          {/* Invisible right-axis binding — see RULER_BINDING_NOTE. It is an
              AREA, not a bar, precisely because bars split the category slot
              and this one halved every bar in the chart. */}
          <Area yAxisId="right" dataKey={bands[0]?.monthlyKey} fillOpacity={0} strokeOpacity={0} legendType="none" isAnimationActive={false} />
          <ReferenceLine
            yAxisId="left"
            y={avg}
            stroke={AVG_LINE_COLOR}
            strokeDasharray="5 4"
            label={anchorLabel(avg)}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

function ForecastChart({ data }: { data: NonNullable<Block2Data['forecast_5yr']> }) {
  // per_component is annual € per COMPONENT band; the chart shows €/month, so
  // divide by 12. Stacked bands sum back to total_eur_month. Same band list,
  // colours and labels as the monthly chart above — one origin. Bands that are
  // €0 across every year (e.g. the zeroed standing fee) drop out entirely, so
  // they take no legend slot.
  const bands = COMPONENT_BANDS.filter((b) =>
    data.some((p) => (p.per_component?.[b.band] ?? 0) > 0),
  );
  const rows = data.map((p) => {
    const row: Record<string, number | string> = { name: String(p.year) };
    for (const b of bands) row[b.band] = (p.per_component?.[b.band] ?? 0) / 12;
    return row;
  });
  const scale = axisScale(
    Math.max(...data.map((p) => p.total_eur_month), 0),
  );

  return (
    <div data-block2="forecast-chart">
      <ChartLegend entries={legendEntries(bands)} />
      <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Metai', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#64748b' }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `€${v}`} width={44} domain={scale.domain} ticks={scale.ticks} />
          <YAxis {...RULER} domain={scale.domain} ticks={scale.ticks} />
          <Tooltip formatter={(v: number, n) => [eur(v), n]} />
          {bands.map((b) => (
            <Area key={b.band} yAxisId="left" type="monotone" dataKey={b.band} stackId="f" stroke={b.color} fill={b.color} name={b.label} />
          ))}
          <Area yAxisId="right" dataKey={bands[0]?.band} fillOpacity={0} strokeOpacity={0} legendType="none" isAnimationActive={false} />
          {/* No in-chart numeral here (adjustment 2026-07-24): with the right
              axis labelled, a floating year-5 figure duplicated the ruler
              beside it. The end height reads off the right edge. */}
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Block2Section({
  block2,
  householdSize = null,
  onHouseholdSizeChange,
}: Block2SectionProps) {
  // Ruling 2026-07-23: the data-sources disclosure box is collapsible, default
  // collapsed — it became permanent once the standard size is preselected, and
  // it carries the legend, not primary content. (Before any early return, per
  // the rules of hooks.)
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  if (!block2) return null;

  // Not-applicable (e.g. land-only): render the backend message only.
  if (block2.status !== 'ready') {
    if (!block2.message_lt) return null;
    return (
      <section
        data-guide="block2"
        data-block2="not-applicable"
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8"
      >
        <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">2) Energijos sąnaudos</h2>
        <div className="bg-gray-50 rounded-lg px-6 py-5 text-base text-slate-600">
          {block2.message_lt}
        </div>
      </section>
    );
  }

  const { metric, breakdown, explanation, info_box, household_reference } = block2;

  // B2-14: selection swaps to the matching backend-precomputed option — no €
  // math and no LT copy composed here (all five views arrive served).
  const hm = block2.household_modelling;
  const selected =
    (householdSize != null &&
      hm?.options.find((o) => o.household_size === householdSize)) ||
    null;

  const shownMetric = selected
    ? { eur_month: selected.metric.eur_month, subtext_lt: selected.metric.subtext_lt }
    : metric;
  const shownRows = selected ? selected.breakdown.rows : breakdown?.rows;
  const shownTotal = selected ? selected.breakdown.total : breakdown?.total;
  const shownMonthly = selected
    ? selected.monthly_variation
    : block2.monthly_variation;
  // Ruling 2026-07-23: the forecast follows the selection too — so its year 1
  // is the headline the customer just picked, instead of a building-only line
  // that contradicted the number above it.
  const shownForecast = selected
    ? selected.forecast_5yr ?? block2.forecast_5yr
    : block2.forecast_5yr;
  // §7.5 family paragraph: OFF variant served on the default view, ON variant
  // per option. §7.6 what's-not-included line switches the same way.
  const familyNote = selected
    ? selected.explanation_lt
    : explanation?.family_note_lt;
  const whatsNotIncluded = selected
    ? selected.whats_not_included_lt
    : info_box?.whats_not_included_lt;

  return (
    <section
      data-guide="block2"
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8"
    >
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-2">2) Energijos sąnaudos</h2>
      {block2.intro_lt && (
        <p data-block2="intro" className="text-base text-slate-600 mb-6 leading-relaxed">
          {block2.intro_lt}
        </p>
      )}

      {/* 1 — Metric bar: headline €/month + subtext on the LEFT, and the
          B2-14 household-size selector on the RIGHT, inside the same band —
          the band's empty right half is what the selector now fills. Swaps to
          the selected household option's headline (B2-14). */}
      {shownMetric && (
        <div
          data-block2="metric"
          className="bg-slate-50 rounded-xl p-5 md:p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6"
        >
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#0D7377]">~€{shownMetric.eur_month}</span>
              <span className="text-lg text-slate-500">/ mėn.</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">{shownMetric.subtext_lt}</p>
          </div>

          {/* 1b — B2-14 household-size selector (§7.7): [1][2][3][4][5+],
              toggle to deselect. Rendered only when the backend served the
              options — the residential/degradation gate stays backend-only.
              Nested in the band's right column; when it is absent (e.g.
              non-residential) the band has a single flex child and the price
              keeps the full width — no empty right column. On mobile the
              columns stack (price first), and the selector stays in this same
              flex parent so it never drifts below the table below. The caption
              dropped its former „↑ " glyph: it used to point up at the price;
              beside the price it points at nothing, and the served sentence
              („Pasirinkite namų ūkio dydį, kad pamatytumėte…") reads on its
              own. */}
          {hm && hm.options.length > 0 && (
            <div
              data-block2="household-selector"
              className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 md:max-w-sm"
            >
              {/* Inset white control panel on the slate band — reuses the
                  report's inset-panel tokens (Block8Section: border-slate-200
                  rounded-lg shadow-sm), with bg-white explicit because this one
                  sits on bg-slate-50. The caption is the panel's LABEL: above
                  the buttons, left-aligned. Same served string; it used to
                  trail below, right-aligned, reading as a stray footnote — as
                  the heading it invites the click. (Its former „↑ " glyph was
                  dropped in the relayout: it pointed up at the price, and
                  beside the price it pointed at nothing.) */}
              <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                {hm.selector_caption_lt}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Namų ūkio dydis">
                {hm.options.map((o) => {
                  const isActive = householdSize === o.household_size;
                  return (
                    <button
                      key={o.household_size}
                      type="button"
                      aria-pressed={isActive}
                      // Ruling 2026-07-23: the customer can change the size but
                      // not unselect — there is no bare building-only view to
                      // return to. Clicking the active size is a no-op (no
                      // toggle-off to null).
                      onClick={() => onHouseholdSizeChange?.(o.household_size)}
                      // No `transition-colors`: the selected fill must apply
                      // INSTANTLY. With the transition, background-color animated
                      // white→teal over 150ms, and any sampling before it settled
                      // (a throttled browser that pauses the animation clock, or
                      // simply mid-fade) showed the button still white despite
                      // aria-pressed — the selected state looked unapplied. The
                      // classes were always correct (computed target = teal/white);
                      // only the animation made it appear otherwise. Instant is also
                      // better UX for a selection toggle.
                      className={`text-sm font-medium min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border cursor-pointer ${
                        isActive
                          ? 'bg-[#0D7377] border-[#0D7377] text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-[#0D7377] hover:text-[#0D7377]'
                      }`}
                    >
                      {o.household_size === 5 ? '5+' : o.household_size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2 — Breakdown table (backend-rounded numbers rendered verbatim;
          rows/total swap to the selected option's adjusted values). */}
      {breakdown && shownRows && shownTotal && (
        <div className="mb-6 overflow-x-auto">
          <table data-block2="breakdown" className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                {breakdown.column_headers_lt.map((h, i) => (
                  <th key={i} className={`py-2 pr-3 font-medium ${i > 0 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Value cells follow the served header order
                  (column_headers_lt): monthly first, yearly second. */}
              {shownRows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-700">{r.label_lt}</td>
                  <td className="py-2 pr-3 text-right text-slate-700">€{r.eur_month}</td>
                  <td className="py-2 pr-3 text-right text-slate-700">€{r.eur_year}</td>
                  <td className="py-2 text-right text-slate-500">{r.source_indicator}</td>
                </tr>
              ))}
              <tr className="font-semibold text-[#1E3A5F]">
                <td className="py-2 pr-3">{shownTotal.label_lt}</td>
                <td className="py-2 pr-3 text-right">€{shownTotal.eur_month}</td>
                <td className="py-2 pr-3 text-right">€{shownTotal.eur_year}</td>
                <td />
              </tr>
            </tbody>
          </table>
          {breakdown.dhw_footnote_lt && (
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{breakdown.dhw_footnote_lt}</p>
          )}
        </div>
      )}

      {/* 2b — B2-14 data-source disclosure box (§7.7): backend-served multiline
          text, COLLAPSIBLE (ruling 2026-07-23, default collapsed). The served
          string is „<heading>\n\n<body>"; the first segment is the toggle
          label, the rest the collapsible body. Web-only — the PDF prints the
          whole box (report_pdf.html), so content parity holds. */}
      {selected && hm && (() => {
        const [dsHeading, ...dsRest] = hm.disclosure_box_lt.split('\n\n');
        const dsBody = dsRest.join('\n\n');
        return (
          <div
            data-block2="disclosure-box"
            className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6"
          >
            <button
              type="button"
              aria-expanded={disclosureOpen}
              onClick={() => setDisclosureOpen((v) => !v)}
              className="flex items-center gap-2 w-full text-left cursor-pointer bg-transparent border-none p-0 min-h-[44px] text-sm font-medium text-slate-700"
            >
              <span
                className="text-[12px] text-[#0D7377] transition-transform duration-200"
                style={{ display: 'inline-block', transform: disclosureOpen ? 'rotate(90deg)' : 'rotate(0)' }}
              >
                &#9654;
              </span>
              {dsHeading}
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: disclosureOpen ? '2000px' : '0', opacity: disclosureOpen ? 1 : 0 }}
            >
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mt-3">
                {dsBody}
              </p>
            </div>
          </div>
        );
      })()}

      {/* 3 — Carrier-inference warning (only when the carrier was inferred). */}
      {block2.carrier_warning_lt && (
        <div data-block2="carrier-warning" className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r">
          <p className="text-sm text-amber-900 leading-relaxed">{block2.carrier_warning_lt}</p>
        </div>
      )}

      {/* 4 — Monthly variation chart (per-option rows when selected: DHW band
          scaled, flat household-electricity band appears via the zero-band
          filter). */}
      {shownMonthly && shownMonthly.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Mėnesinė energijos kaina per metus</h3>
          <MonthlyChart data={shownMonthly} />
        </div>
      )}

      {/* 5 — 5-year forecast chart. */}
      {shownForecast && shownForecast.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-semibold text-slate-800 mb-3">{FORECAST_CHART_TITLE_LT}</h3>
          <ForecastChart data={shownForecast} />
        </div>
      )}

      {/* 6 — Practical explanation (+ §7.5 family paragraph, OFF/ON variant). */}
      {explanation && (
        <div data-block2="explanation" className="mb-6">
          <h3 className="text-base font-semibold text-slate-800 mb-2">{explanation.heading_lt}</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {/* R5: the selected option carries its own personalised body —
                „Ši suma" then points at the figure it describes. */}
            {selected?.body_lt ?? explanation.body_lt}
          </p>
          {familyNote && (
            <p data-block2="family-note" className="text-sm text-slate-700 leading-relaxed mt-2">
              {familyNote}
            </p>
          )}
        </div>
      )}

      {/* 7 — Info box (+ §7.6 conditional what's-not-included line). */}
      {info_box && (
        <div data-block2="info-box" className="bg-slate-50 rounded-lg p-5 mb-6 text-sm text-slate-600 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-800">{info_box.heading_lt}</p>
          <p>{info_box.vat_lt}</p>
          <p>{info_box.escalation_lt}</p>
          <p>{info_box.disclosure_lt}</p>
          {/* B2-16 (R9): €-bill conversion residual — served only in €-bills mode. */}
          {info_box.bill_note_lt && <p data-block2="bill-note">{info_box.bill_note_lt}</p>}
          {/* B2-17: solar-thermal note (served, flag-gated). */}
          {info_box.solar_note_lt && <p data-block2="solar-note">{info_box.solar_note_lt}</p>}
          {/* R8: the price-side honesty line — served whenever prices ride
              an expired tariff record (one story with the confidence line). */}
          {info_box.stale_note_lt && <p data-block2="stale-note">{info_box.stale_note_lt}</p>}
          {whatsNotIncluded && <p data-block2="whats-not-included">{whatsNotIncluded}</p>}
        </div>
      )}

      {/* 8 — Confidence indicator (explanation-only sentence, not a badge). */}
      {block2.confidence_text_lt && (
        <p data-block2="confidence" className="text-sm text-slate-500 leading-relaxed mb-6 border-t border-slate-100 pt-4">
          <span aria-hidden="true">ℹ️ </span>{block2.confidence_text_lt}
        </p>
      )}

      {/* 9 — Household-electricity reference table (always visible regardless
          of selection, §7.7; served only for residential reports). */}
      {household_reference && household_reference.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Tipinės namų ūkio elektros sąnaudos</h3>
          <table data-block2="household-reference" className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-medium">Namų ūkio dydis</th>
                <th className="py-2 pr-3 font-medium text-right">Tipinis suvartojimas (kWh/mėn.)</th>
                <th className="py-2 font-medium text-right">~€ per mėnesį</th>
              </tr>
            </thead>
            <tbody>
              {household_reference.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-700">{r.size_label_lt}</td>
                  <td className="py-2 pr-3 text-right text-slate-700">{r.kwh_month}</td>
                  <td className="py-2 text-right text-slate-700">{eur(r.eur_month)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
