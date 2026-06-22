// P7-A3.4: EPC-style comfort rating bars — 5-level stacked colored bars with arrow marker

interface Level {
  key: string;
  label: string;
  color: string;
  width: string; // percentage
}

const WINTER_LEVELS: Level[] = [
  { key: 'A', label: 'Puikiai', color: '#059669', width: '45%' },
  { key: 'B', label: 'Gerai', color: '#16a34a', width: '60%' },
  { key: 'C', label: 'Vidutiniškai', color: '#ca8a04', width: '75%' },
  { key: 'D', label: 'Silpnai', color: '#ea580c', width: '87%' },
  { key: 'E', label: 'Labai silpnai', color: '#dc2626', width: '100%' },
];

const SUMMER_LEVELS: Level[] = [
  { key: 'A', label: 'Minimali', color: '#059669', width: '45%' },
  { key: 'B', label: 'Maža', color: '#16a34a', width: '60%' },
  { key: 'C', label: 'Vidutinė', color: '#ca8a04', width: '75%' },
  { key: 'D', label: 'Didelė', color: '#ea580c', width: '87%' },
  { key: 'E', label: 'Kritinė', color: '#dc2626', width: '100%' },
];

// Map backend comfort levels to the 5-segment display (A–E). Lossless: the
// produced levels land on B/C/D; A and E stay defined-but-reserved (kept in
// sync with the backend block1/presentation.py vocabulary).
const WINTER_MAP: Record<string, string> = {
  GOOD: 'B',
  INTERMEDIATE: 'C',
  WEAK: 'D',
};

// Summer carries all 5 SummerOverheatingRisk values 1:1 — the producer emits
// LOW/MODERATE/HIGH (→ B/C/D); VERY_LOW→A "Minimali" / VERY_HIGH→E "Kritinė"
// are reserved for future granularity. Never collapse to 3.
const SUMMER_MAP: Record<string, string> = {
  VERY_LOW: 'A',
  LOW: 'B',
  MODERATE: 'C',
  HIGH: 'D',
  VERY_HIGH: 'E',
};

// Sentinel for "couldn't assess" — kept OFF the A–E axis so it can never be
// rendered as a band. Callers branch on it explicitly (never highlight a bar).
export const WINTER_NOT_ASSESSED = 'NOT_ASSESSED';

const WINTER_NOT_ASSESSED_REASON_LT: Record<string, string> = {
  not_in_registry:
    'Šiam pastatui nepavyko rasti energinio naudingumo sertifikato, o turimų duomenų nepakanka patikimam įvertinimui.',
  technical_error:
    'Žiemos komforto įvertinti nepavyko dėl laikinos duomenų paieškos klaidos. Bandykite vėliau.',
  new_build_no_epc_yet:
    'Naujam pastatui dar nėra energinio naudingumo sertifikato, todėl žiemos komforto kol kas neįvertinome.',
  unknown:
    'Žiemos komforto šiam pastatui įvertinti nepavyko — trūksta duomenų.',
};

export function winterNotAssessedMessage(reason?: string | null): string {
  return WINTER_NOT_ASSESSED_REASON_LT[reason ?? 'unknown']
    ?? WINTER_NOT_ASSESSED_REASON_LT.unknown;
}

// Phase 2: era→class estimate provenance. The band is a REAL rating (GOOD/etc.)
// but derived from the building's construction era + type (no certificate) — it
// must be labelled as an estimate, never presented as certificate-grade.
export const WINTER_PROVENANCE_ERA_ESTIMATED = 'block1.winter.provenance.era_estimated';

const WINTER_PROVENANCE_LT: Record<string, string> = {
  [WINTER_PROVENANCE_ERA_ESTIMATED]:
    'Apytikslis įvertinimas. Energinio naudingumo sertifikatas nerastas, todėl žiemos komfortas įvertintas pagal pastato statybos metus ir tipą.',
};

// Returns the LT estimate caption for a provenance label key, or null when the
// band is from a certificate / typology (no estimate caption needed).
export function winterProvenanceMessage(provenanceLabelKey?: string | null): string | null {
  if (!provenanceLabelKey) return null;
  return WINTER_PROVENANCE_LT[provenanceLabelKey] ?? null;
}

export function mapWinterLevel(backend: string): string {
  if (backend === WINTER_NOT_ASSESSED) return WINTER_NOT_ASSESSED;
  return WINTER_MAP[backend] ?? 'C';
}

export function mapSummerLevel(backend: string): string {
  return SUMMER_MAP[backend] ?? 'C';
}

export default function ComfortBar({
  title,
  activeLevel,
  levels,
  description,
}: {
  title: string;
  activeLevel: string;
  levels: Level[];
  description: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-[#1E3A5F] mb-3">{title}</h3>
      <div className="space-y-1">
        {levels.map((level) => {
          const isActive = level.key === activeLevel;
          return (
            <div key={level.key} className="flex items-center gap-2">
              <div
                className="rounded-l-md flex items-center px-3 transition-opacity"
                style={{
                  width: level.width,
                  height: isActive ? '34px' : '28px',
                  backgroundColor: level.color,
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                <span className="text-white text-xs font-semibold">
                  {level.key}
                </span>
                <span className="text-white text-xs font-medium ml-2 truncate">
                  {level.label}
                </span>
              </div>
              {isActive && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-900 text-sm">&#9664;</span>
                  <span className="text-sm font-medium text-slate-900">
                    Jūsų pastatas
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mt-3">{description}</p>
    </div>
  );
}

export { WINTER_LEVELS, SUMMER_LEVELS };
