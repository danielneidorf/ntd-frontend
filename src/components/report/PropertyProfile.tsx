// P7-A1.1 / P7-A3.1 / P7-A7: Property Profile — separate cards per group, with map
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

type Field = { label: string; value: string | number; badge?: React.ReactNode };

function buildGroup(fields: { label: string; raw: unknown; format?: (v: any) => string; badge?: React.ReactNode }[]): Field[] {
  return fields
    .filter((f) => f.raw != null)
    .map((f) => ({
      label: f.label,
      value: f.format ? f.format(f.raw) : String(f.raw),
      badge: f.badge,
    }));
}

function FieldCell({ field }: { field: Field }) {
  return (
    <div className="py-1.5">
      <p className="text-sm text-slate-500 mb-0.5">{field.label}</p>
      <p className="text-base text-slate-900 font-medium">
        {field.value}
        {field.badge}
      </p>
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
          {fields.map((f) => (
            <FieldCell key={f.label} field={f} />
          ))}
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

  const buildingFields = buildGroup([
    { label: 'Paskirtis', raw: profile.purpose },
    { label: 'Tipas', raw: profile.premises_type },
    { label: 'Naudojimo grupė (STR 2.01.02)', raw: profile.usage_group_label },
    { label: 'Statybos metai', raw: profile.year_built },
    { label: 'Aukštų skaičius', raw: profile.floors },
    { label: 'Bendras plotas', raw: profile.total_area_m2, format: (v: number) => `${v} m²` },
    { label: 'Šildomas plotas', raw: profile.heated_area_m2, format: (v: number) => `${v} m²` },
    { label: 'Sienų medžiaga', raw: profile.wall_material },
    { label: 'Šildymo tipas', raw: profile.heating_type },
    { label: 'Ventiliacijos tipas', raw: profile.ventilation_type },
  ]);

  const energyFields = buildGroup([
    {
      label: 'Energinė klasė',
      raw: profile.energy_class,
      badge: profile.energy_class ? <EnergyBadge cls={profile.energy_class} /> : undefined,
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
