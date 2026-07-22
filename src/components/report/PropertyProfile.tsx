// P7-A1.1 / P7-A3.1 / P7-A7: Property Profile — separate cards per group, with map
import { Fragment } from 'react';
import type { ReportData } from './mockReportData';
// PropertyMap moved to ReportViewer for data-guide separation

type Profile = ReportData['property_profile'];

const ENERGY_CLASS_COLORS: Record<string, string> = {
  'A++': '#059669',
  'A+': '#059669',
  A: '#059669',
  B: '#16a34a',
  C: '#ca8a04',
  D: '#ea580c',
  E: '#dc2626',
  F: '#dc2626',
  G: '#dc2626',
};

function EnergyBadge({ cls }: { cls: string }) {
  const bg = ENERGY_CLASS_COLORS[cls.toUpperCase()] ?? '#6b7280';
  return (
    <span
      className="inline-block text-white text-sm font-bold px-2.5 py-0.5 rounded ml-2"
      style={{ backgroundColor: bg }}
    >
      {cls.toUpperCase()}
    </span>
  );
}

type Field = {
  label: string;
  value: string | number;
  badge?: React.ReactNode;
  // Report-walk C1: full-width muted note rendered AFTER this cell
  // (spans both grid columns; mobile stacking keeps it under the pair).
  helperAfter?: string;
  // Report-walk C2 (R6/R7): per-cell provenance sub-line under the value
  // (backend-served LT string — the glazing-source honesty pattern).
  helper?: string | null;
  // Cells sharing a pairGroup are rendered side by side in one grid row.
  pairGroup?: string;
};

function buildGroup(fields: { label: string; raw: unknown; format?: (v: any) => string; badge?: React.ReactNode; helperAfter?: string; helper?: string | null; pairGroup?: string }[]): Field[] {
  return fields
    .filter((f) => f.raw != null)
    .map((f) => ({
      label: f.label,
      value: f.format ? f.format(f.raw) : String(f.raw),
      badge: f.badge,
      helperAfter: f.helperAfter,
      helper: f.helper,
      pairGroup: f.pairGroup,
    }));
}

// The 2-column grid fills row-by-row, so two adjacent entries only LOOK
// like a pair when an even number of cells happens to precede them — which
// stops being true the moment an upstream row is empty (and it varies by
// road: „Tipas" is empty on the live one). Cells sharing a pairGroup are
// therefore rendered inside their own full-width 2-column block, so the
// „Bendras | Šildomas" pairing holds by construction rather than by luck.
// Pairing is by group, never by position: when only one of a pair survives
// the null filter it renders as an ordinary cell.
function renderFields(fields: Field[]): React.ReactNode[] {
  // FLUID auto-placement. Cells are direct grid children in DOM order, so an
  // absent record simply does not exist and everything after it slides into
  // the freed slot — no mid-card holes, ever; only the last row can be
  // half-full, which is what a list of unequal length looks like.
  //
  // Explicit row containers were tried first (to stop a group margin from
  // shifting one column and leaving its row-mate behind) and are gone: they
  // froze pairings that should re-flow, so a null field left a half-empty row
  // stranded mid-card. Per-group margins go with them — in a fluid grid a
  // margin cannot address "the row" at all, because rows are not elements.
  // Grouping is expressed by ORDER alone, and the rhythm stays uniform.
  return fields.map((f, i) => {
    const next = fields[i + 1];
    const prev = fields[i - 1];

    // The pair is ONE full-width item — its own inner two columns — so it
    // flows as a unit and can never split across a row boundary.
    if (f.pairGroup && next?.pairGroup === f.pairGroup) {
      return (
        <div key={f.label} className="col-span-full">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8"
            data-pair={f.pairGroup}
          >
            <FieldCell field={f} />
            <FieldCell field={next} />
          </div>
        </div>
      );
    }
    // The pair's second cell was already rendered inside the block above.
    if (f.pairGroup && prev?.pairGroup === f.pairGroup) return null;

    return <FieldCell key={f.label} field={f} />;
  });
}

// Label and value used to compete at 14/16px. The label is a signpost, the
// value is the answer — so the label steps back and the value stays the only
// thing you read when scanning. Rhythm comes from the cell's own padding
// (py-2.5) rather than a grid row-gap, so every row breathes identically
// whether or not it carries a provenance sub-line.
function FieldCell({ field }: { field: Field }) {
  return (
    <div className="py-1.5" data-cell={field.label}>
      <p className="text-[13px] leading-tight text-slate-400 mb-0.5">{field.label}</p>
      <p className="text-[15px] leading-snug text-slate-900 font-medium">
        {field.value}
        {field.badge}
      </p>
      {field.helper && (
        <p className="text-[13px] leading-tight text-slate-400 mt-1 max-w-[65ch]">{field.helper}</p>
      )}
    </div>
  );
}

function ProfileCard({
  title,
  fields,
  header,
  dataGuide,
}: {
  title: string;
  fields: Field[];
  header?: React.ReactNode;
  dataGuide?: string;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
      {header}
      <div {...(dataGuide ? { 'data-guide': dataGuide } : {})}>
        <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {renderFields(fields)}
        </div>
      </div>
    </div>
  );
}

export default function PropertyProfile({
  profile,
  lat,
  lng,
  address,
  betweenSections,
}: {
  profile: Profile;
  lat: number;
  lng: number;
  address: string;
  /**
   * Optional content rendered between the "Pastato charakteristikos" and
   * "Energinis naudingumas" cards. Used by the report layout to insert the
   * Infostatyba permits block in its semantically-correct position.
   */
  betweenSections?: React.ReactNode;
}) {
  const isLand = profile.evaluation_target === 'Žemės sklypas';

  // Land-only: no building or energy cards — bundle is in the header
  if (isLand) return null;

  // Report-walk C1 (ruling 2026-07-18): identity → area pair (+ helper) →
  // physique → systems; DOM order = semantic order — the 2-col grid fills
  // row-by-row, so adjacent array entries form the visual pairs, and the
  // 1-col mobile stack keeps each pair together.
  // Label ruling (2026-07-20) — truth by suppression. B0-A Q3's copy rule:
  // report copy says „plotas"/„bendras plotas", NOT „šildomas plotas",
  // until a genuine heated-area source lands. So the „Šildomas plotas" row
  // renders ONLY when the served source really is a heated area (registry
  // sildomas / PENS certificate / document-extracted). On the proxy road —
  // and on untagged legacy snapshots, where we cannot claim otherwise —
  // the card shows ONE area row labelled „Bendras plotas" carrying that
  // value, with the R6 disclosure beneath it. A number is never labelled
  // something it isn't.
  // The decision is the BACKEND's (2026-07-21): `heated_area_m2_is_genuine`
  // is served, so the web and the PDF apply one rule. This component used to
  // keep its own copy of the source list while the PDF had no such rule at
  // all — two specifications of one contract, which drift silently.
  const heatedIsGenuine = profile.heated_area_m2_is_genuine === true;
  // The total-vs-heated explainer was REMOVED from the card (2026-07-22).
  // It was prose in a data grid: two sentences that had to be width-capped,
  // re-aligned and re-spaced twice without ever sitting comfortably. Neither
  // surface carries it now, so web/PDF parity holds by absence. The copy is
  // on the B8-4 list as available-but-unplaced; if it belongs anywhere it is
  // Block 2's „Iš ko remiamės" box, where prose lives — a copy-review call.
  // Each area that has a value gets a row; the one that doesn't collapses
  // (buildGroup drops nulls). `pairGroup` keeps the two side by side — see
  // renderFields: pairing is by group, not by position, so when only one
  // survives it renders as an ordinary cell instead of pairing with an
  // unrelated neighbour.
  const areaFields = heatedIsGenuine
    ? [
        {
          label: 'Bendras plotas',
          raw: profile.total_area_m2,
          format: (v: number) => `${v} m²`,
          pairGroup: 'area',
        },
        {
          label: 'Šildomas plotas',
          raw: profile.heated_area_m2,
          format: (v: number) => `${v} m²`,
          // R6 provenance stays, attached to ITS value as a compact
          // sub-line — the pattern the glazing row already uses.
          helper: profile.heated_area_m2_source_lt,
          pairGroup: 'area',
        },
      ]
    : [
        {
          label: 'Bendras plotas',
          raw: profile.heated_area_m2 ?? profile.total_area_m2,
          format: (v: number) => `${v} m²`,
          helper: profile.heated_area_m2_source_lt,
        },
      ];

  // Paskirtis: the register's OWN classifier value, verbatim, under a label
  // that carries the noun its genitive needs — „Pastatų paskirtis:
  // Daugiabučių". Both parts are served; the label follows the object level,
  // because RC's vocabulary is level-specific. `profile.purpose` (our
  // internal residential/premises/land_plot bucket) is deliberately NOT
  // rendered here or anywhere: it gates logic, it is not a designation the
  // register issued. Dark until RC populates the slot.
  const paskirtisLabel = profile.paskirtis_row_label_lt;
  const paskirtisValue = profile.paskirtis_label_lt;

  const buildingFields = buildGroup([
    ...(paskirtisLabel && paskirtisValue
      ? [{ label: paskirtisLabel, raw: paskirtisValue }]
      : []),
    { label: 'Tipas', raw: profile.premises_type },
    { label: 'Naudojimo grupė', raw: profile.usage_group_label },
    { label: 'Statybos metai', raw: profile.year_built },
    ...areaFields,
    { label: 'Aukštų skaičius', raw: profile.floors },
    { label: 'Sienų medžiaga', raw: profile.wall_material },
    { label: 'Šildymo tipas', raw: profile.heating_type },
    // „Ventiliacija" (F3): the value is now a complete nominative phrase
    // („Natūrali"), so „…tipas" would read as a fragment's leftover label.
    // Matches the PDF, which already used this label.
    { label: 'Ventiliacija', raw: profile.ventilation_type },
  ]);

  const energyFields = buildGroup([
    {
      label: 'Energinė klasė',
      raw: profile.energy_class,
      badge: profile.energy_class ? <EnergyBadge cls={profile.energy_class} /> : undefined,
      helper: profile.energy_class_provenance_lt,
    },
    {
      label: 'Energijos sąnaudos',
      raw: profile.epc_kwhm2_year,
      format: (v: number) => `${v} kWh/m² per metus`,
    },
    { label: 'Duomenų šaltinis', raw: profile.epc_source },
    // „Duomenų patikimumas" REMOVED (2026-07-22). It rendered a bare grade
    // („Aukštas") whose cause the card already states one row above: the
    // grade is derived FROM the source class, so it restated „Duomenų
    // šaltinis" in adjectives. The D17 cause-aware pattern could not rescue
    // it — Block 2's ConfidenceCause explains CARRIER resolution (bills vs
    // records vs typology), a different fact; there is no EPC-side cause
    // field anywhere, and in the one path where the grade varies on its own
    // merits (new-build plausibility) the reason is already carried by
    // `epc_plausibility_note_lt`. A grade with no independent content, so
    // it goes rather than acquiring a decorative excuse.
    {
      label: 'Langų dalis fasade',
      raw: profile.glazing_percent,
      format: (v: number) => `~${v}%`,
    },
    { label: 'Langų duomenų šaltinis', raw: profile.glazing_source },
  ]);

  return (
    <div className="space-y-6">
      <ProfileCard
        title="Pastato charakteristikos"
        fields={buildingFields}
        dataGuide="property-profile"
      />
      {betweenSections}
      <ProfileCard title="Energinis naudingumas" fields={energyFields} dataGuide="energy-profile" />
    </div>
  );
}
