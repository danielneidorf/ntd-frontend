// P7-A3.4: EPC-style comfort rating bars — 5-level stacked colored bars with arrow marker
import { useId } from 'react';

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

// ── THE TWO TWINS THAT LIVED HERE ARE GONE (copy-parity gate, 2026-08-06) ──
//
// `winterNotAssessedMessage` (№11–14) and `winterProvenanceMessage` (№14) each
// held a Lithuanian map that also existed in the PDF's Jinja — one sentence,
// two hand-maintained copies, and they had already begun to disagree. Both are
// now produced once in `reports/report_copy_lt.py` and served as
// `winter.not_assessed_message_lt` / `winter.provenance_message_lt`; the
// component reads the served value and composes nothing.
//
// `technical_error` never belonged to either map: that sentence is the
// recalculation road's (№20), served with the recourse it points at, so the
// backend map has no entry for it by design.
//
// `WINTER_PROVENANCE_ERA_ESTIMATED` stays — it is a KEY, not copy. The card
// still branches on it in places; keys may live here, the customer's words may
// not.
export const WINTER_PROVENANCE_ERA_ESTIMATED = 'block1.winter.provenance.era_estimated';

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
}: {
  // №8 — SERVED. Typed nullable because the wire is: a report stored before
  // the field existed omits it, and a heading is better absent than invented.
  title?: string | null;
  activeLevel: string;
  levels: Level[];
}) {
  // The bar is five bare <div>s: to a screen reader it was five loose colour
  // labels with nothing tying them together or saying what they measured. It
  // is now a group NAMED BY ITS OWN HEADING (№8) — the ruled words become the
  // accessible name rather than a second sentence written for assistive tech,
  // which no ruling covers and the extinction pin would refuse.
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-lg font-semibold text-[#1E3A5F] mb-3">{title}</h3>
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
    </div>
  );
}

export { WINTER_LEVELS, SUMMER_LEVELS };
