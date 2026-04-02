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

// Map 3-level backend output to 5-level display
const WINTER_MAP: Record<string, string> = {
  GOOD: 'B',
  INTERMEDIATE: 'C',
  WEAK: 'D',
};

const SUMMER_MAP: Record<string, string> = {
  LOW: 'B',
  MEDIUM: 'C',
  HIGH: 'D',
};

export function mapWinterLevel(backend: string): string {
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
