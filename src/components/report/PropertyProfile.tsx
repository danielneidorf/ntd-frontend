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

function HelperAfter({ text }: { text: string }) {
  return (
    <p className="col-span-full text-sm text-slate-500 leading-relaxed -mt-0.5 mb-1">
      {text}
    </p>
  );
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
  const out: React.ReactNode[] = [];
  for (let i = 0; i < fields.length; i += 1) {
    const f = fields[i];
    const next = fields[i + 1];
    if (f.pairGroup && next?.pairGroup === f.pairGroup) {
      out.push(
        <div
          key={f.label}
          className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-x-8"
          data-pair={f.pairGroup}
        >
          <FieldCell field={f} />
          <FieldCell field={next} />
        </div>,
      );
      if (next.helperAfter) {
        out.push(<HelperAfter key={`${next.label}-after`} text={next.helperAfter} />);
      }
      i += 1;
      continue;
    }
    out.push(
      <Fragment key={f.label}>
        <FieldCell field={f} />
        {f.helperAfter && <HelperAfter text={f.helperAfter} />}
      </Fragment>,
    );
  }
  return out;
}

function FieldCell({ field }: { field: Field }) {
  return (
    <div className="py-1.5">
      <p className="text-sm text-slate-500 mb-0.5">{field.label}</p>
      <p className="text-base text-slate-900 font-medium">
        {field.value}
        {field.badge}
      </p>
      {field.helper && (
        <p className="text-xs text-slate-400 mt-0.5">{field.helper}</p>
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
  const AREA_PAIR_HELPER =
    'Bendras plotas apima ir nešildomas erdves — balkoną, rūsį ar sandėliuką. ' +
    'Energijos sąnaudos skaičiuojamos pagal šildomą plotą.';

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
          helper: profile.heated_area_m2_source_lt,
          // The note exists to explain why the two numbers DIFFER. With no
          // total row it would explain a row that isn't on the card.
          helperAfter:
            profile.total_area_m2 != null ? AREA_PAIR_HELPER : undefined,
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

  const buildingFields = buildGroup([
    { label: 'Paskirtis', raw: profile.purpose },
    { label: 'Tipas', raw: profile.premises_type },
    { label: 'Naudojimo grupė', raw: profile.usage_group_label },
    { label: 'Statybos metai', raw: profile.year_built },
    ...areaFields,
    { label: 'Aukštų skaičius', raw: profile.floors },
    { label: 'Sienų medžiaga', raw: profile.wall_material },
    { label: 'Šildymo tipas', raw: profile.heating_type },
    { label: 'Ventiliacijos tipas', raw: profile.ventilation_type },
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
    { label: 'Duomenų patikimumas', raw: profile.epc_confidence },
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
