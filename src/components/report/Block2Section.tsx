// B2-13: Block 2 — Energy costs section.
// Renders backend-rendered LT prose + the priced breakdown and charts. Authors
// no report copy (all strings come from `data.block2`); only chart band/legend
// labels + the carrier→colour map are local UI chrome, kept in sync with the
// PDF chart palettes (forecast.py §14.3 / monthly_variation.py §2.4).
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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

// Monthly-chart component bands (bottom→top: fixed → DHW → heating → cooling →
// household electricity). Colours + LT labels mirror the PDF monthly chart.
const COMPONENT_BANDS: { key: string; label: string; color: string }[] = [
  { key: 'fixed_eur', label: 'Pastovūs mokesčiai', color: '#7F8C8D' },
  { key: 'dhw_eur', label: 'Karštas vanduo', color: '#2980B9' },
  { key: 'heating_eur', label: 'Šildymas', color: '#E67E22' },
  { key: 'cooling_eur', label: 'Vėsinimas', color: '#48C9B0' },
  { key: 'household_electricity_eur', label: 'Buitinė elektra', color: '#8E44AD' },
];

// Forecast-chart carrier palette (§14.3, mirrors forecast.py CARRIER_COLOURS).
const CARRIER_COLORS: Record<string, string> = {
  cst: '#C0392B', natural_gas: '#2E86C1', electricity: '#F39C12', solid_fuel: '#7B4B27',
  biomass_pellets: '#808000', heat_pump_air: '#17A2B8', heat_pump_ground: '#138496',
  liquid_fuel: '#7D3C98', lpg: '#A569BD', solar_thermal: '#E67E22',
  byproduct_heat: '#5D6D7E', other_renewable: '#27AE60', unknown: '#BDC3C7',
};
const CARRIER_LABELS_LT: Record<string, string> = {
  cst: 'Centrinis šildymas', natural_gas: 'Gamtinės dujos', electricity: 'Elektra',
  solid_fuel: 'Kietasis kuras', biomass_pellets: 'Granulės', heat_pump_air: 'Oro šilumos siurblys',
  heat_pump_ground: 'Geoterminis siurblys', liquid_fuel: 'Skystasis kuras', lpg: 'Suskystintos dujos',
  solar_thermal: 'Saulės kolektoriai', byproduct_heat: 'Antrinė šiluma',
  other_renewable: 'Kiti atsinaujinantys', unknown: 'Nenustatytas',
};
const FIXED_COLOR = '#7F8C8D';

const eur = (v: number | null | undefined) => (v == null ? '—' : `€${Math.round(v)}`);

function MonthlyChart({ data }: { data: NonNullable<Block2Data['monthly_variation']> }) {
  // Only stack bands that are non-zero somewhere (cooling / household electricity
  // are €0 in the building-only v1, so they drop out of the legend).
  const bands = COMPONENT_BANDS.filter((b) =>
    data.some((m) => ((m as Record<string, number>)[b.key] ?? 0) > 0),
  );
  const rows = data.map((m) => ({ name: MONTHS_LT[m.month - 1] ?? String(m.month), ...m }));
  const avg = rows.reduce((s, r) => s + bands.reduce((t, b) => t + ((r as Record<string, number>)[b.key] ?? 0), 0), 0) / (rows.length || 1);

  return (
    <div data-block2="monthly-chart" className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `€${v}`} width={44} />
          <Tooltip formatter={(v: number, n) => [eur(v), n]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {bands.map((b) => (
            <Bar key={b.key} dataKey={b.key} stackId="m" fill={b.color} name={b.label} />
          ))}
          <ReferenceLine
            y={avg}
            stroke="#1E3A5F"
            strokeDasharray="5 4"
            label={{ value: `Vidurkis ~${eur(avg)}/mėn.`, fontSize: 11, fill: '#1E3A5F', position: 'insideTopRight' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ForecastChart({ data }: { data: NonNullable<Block2Data['forecast_5yr']> }) {
  // per_carrier is annual €/carrier; the chart shows €/month, so divide by 12
  // and add the monthly fixed fee. Stacked bands sum back to total_eur_month.
  const carriers = Array.from(
    new Set(data.flatMap((p) => Object.keys(p.per_carrier ?? {}))),
  );
  const rows = data.map((p) => {
    const row: Record<string, number | string> = { name: String(p.year) };
    for (const c of carriers) row[c] = (p.per_carrier?.[c] ?? 0) / 12;
    row.fixed = (p.fixed_eur_year ?? 0) / 12;
    return row;
  });

  return (
    <div data-block2="forecast-chart" className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Metai', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `€${v}`} width={44} />
          <Tooltip formatter={(v: number, n) => [eur(v), n]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {carriers.map((c) => (
            <Area key={c} type="monotone" dataKey={c} stackId="f" stroke={CARRIER_COLORS[c] ?? '#BDC3C7'} fill={CARRIER_COLORS[c] ?? '#BDC3C7'} name={CARRIER_LABELS_LT[c] ?? c} />
          ))}
          <Area type="monotone" dataKey="fixed" stackId="f" stroke={FIXED_COLOR} fill={FIXED_COLOR} name="Pastovūs mokesčiai" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Block2Section({
  block2,
  householdSize = null,
  onHouseholdSizeChange,
}: Block2SectionProps) {
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

      {/* 1 — Metric bar (sibling of ComfortBar): headline €/month + subtext.
          Swaps to the selected household option's headline (B2-14). */}
      {shownMetric && (
        <div data-block2="metric" className="bg-slate-50 rounded-xl p-5 md:p-6 mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[#0D7377]">~€{shownMetric.eur_month}</span>
            <span className="text-lg text-slate-500">/ mėn.</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">{shownMetric.subtext_lt}</p>
        </div>
      )}

      {/* 1b — B2-14 household-size selector (§7.7): [1][2][3][4][5+], toggle
          to deselect. Rendered only when the backend served the options —
          the residential/degradation gate stays backend-only. */}
      {hm && hm.options.length > 0 && (
        <div data-block2="household-selector" className="mb-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Namų ūkio dydis">
            {hm.options.map((o) => {
              const isActive = householdSize === o.household_size;
              return (
                <button
                  key={o.household_size}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onHouseholdSizeChange?.(isActive ? null : o.household_size)
                  }
                  className={`text-sm font-medium min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
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
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            ↑ {hm.selector_caption_lt}
          </p>
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
              {shownRows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-3 text-slate-700">{r.label_lt}</td>
                  <td className="py-2 pr-3 text-right text-slate-700">€{r.eur_year}</td>
                  <td className="py-2 pr-3 text-right text-slate-700">€{r.eur_month}</td>
                  <td className="py-2 text-right text-slate-500">{r.source_indicator}</td>
                </tr>
              ))}
              <tr className="font-semibold text-[#1E3A5F]">
                <td className="py-2 pr-3">{shownTotal.label_lt}</td>
                <td className="py-2 pr-3 text-right">€{shownTotal.eur_year}</td>
                <td className="py-2 pr-3 text-right">€{shownTotal.eur_month}</td>
                <td />
              </tr>
            </tbody>
          </table>
          {breakdown.dhw_footnote_lt && (
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{breakdown.dhw_footnote_lt}</p>
          )}
        </div>
      )}

      {/* 2b — B2-14 data-source disclosure box (§7.7): only while a household
          size is selected. Backend-served multiline text. */}
      {selected && hm && (
        <div
          data-block2="disclosure-box"
          className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6 text-sm text-slate-600 leading-relaxed whitespace-pre-line"
        >
          {hm.disclosure_box_lt}
        </div>
      )}

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
      {block2.forecast_5yr && block2.forecast_5yr.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Prognozinė mėnesinė energijos kaina per 5 metus</h3>
          <ForecastChart data={block2.forecast_5yr} />
        </div>
      )}

      {/* 6 — Practical explanation (+ §7.5 family paragraph, OFF/ON variant). */}
      {explanation && (
        <div data-block2="explanation" className="mb-6">
          <h3 className="text-base font-semibold text-slate-800 mb-2">{explanation.heading_lt}</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{explanation.body_lt}</p>
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
