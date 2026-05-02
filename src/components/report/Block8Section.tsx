// B8-3 / B8-5: Block 8 — Recommendations and decisions section.
// Renders nothing when status is not "ready" (e.g. land-only).
import type { Block8Data } from './mockReportData';

interface Block8SectionProps {
  block8: Block8Data | undefined;
}

type PatternKey = 'A' | 'B' | 'C' | 'D';

interface PatternStyle {
  banner: string; // bg + border classes
  text: string; // banner text colour
  dot: string; // severity-dot bg
  verdict: string; // Lithuanian one-word verdict
}

const PATTERN_STYLES: Record<PatternKey, PatternStyle> = {
  A: {
    banner: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    verdict: 'Komfortiškas pastatas',
  },
  B: {
    banner: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    verdict: 'Šildymo iššūkis',
  },
  C: {
    banner: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    verdict: 'Perkaitimo rizika',
  },
  D: {
    banner: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    dot: 'bg-red-500',
    verdict: 'Dviguba rizika',
  },
};

// Defensive fallback for unknown / "land_only" pattern strings.
// Ready Block 8 only ships A/B/C/D, but the prop type is `string`.
const FALLBACK_STYLE: PatternStyle = {
  banner: 'bg-slate-50 border-slate-200',
  text: 'text-slate-800',
  dot: 'bg-slate-500',
  verdict: 'Rekomendacijos',
};

function styleFor(pattern: string): PatternStyle {
  return (PATTERN_STYLES as Record<string, PatternStyle>)[pattern] ?? FALLBACK_STYLE;
}

export function Block8Section({ block8 }: Block8SectionProps) {
  if (!block8 || block8.status !== 'ready' || !block8.data) return null;
  const d = block8.data;
  const style = styleFor(d.pattern);

  return (
    <section
      data-guide="block8"
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8"
    >
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-4">
        {block8.title_lt || '8) Rekomendacijos ir sprendimai'}
      </h2>

      {/* Caveat callout — only when low EPC confidence */}
      {d.caveat_lt && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded-r">
          <p className="text-sm text-amber-900 leading-relaxed">
            <span aria-hidden="true">⚠️ </span>
            {d.caveat_lt}
          </p>
        </div>
      )}

      {/* Verdict banner — colour-coded by pattern */}
      <div className={`${style.banner} border rounded-lg p-4 mb-6`}>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`${style.dot} w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0`}
          />
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${style.text} mb-1`}>
              {style.verdict}
            </p>
            <p
              data-block8="intro"
              className={`text-sm ${style.text} leading-relaxed`}
            >
              {d.intro_lt}
            </p>
          </div>
        </div>
      </div>

      {/* Two-card grid — questions + angles, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {d.viewing_questions_lt.length > 0 && (
          <div className="border border-slate-200 rounded-lg shadow-sm p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-3">
              Ką patikrinti apžiūros metu
            </h3>
            <ol
              data-block8="viewing-questions"
              className="list-decimal list-inside space-y-2 text-sm text-slate-700 leading-relaxed marker:text-slate-400"
            >
              {d.viewing_questions_lt.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </div>
        )}

        {d.negotiation_angles_lt.length > 0 && (
          <div className="border border-slate-200 rounded-lg shadow-sm p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-3">
              Derybų kampai
            </h3>
            <ol
              data-block8="negotiation-angles"
              className="list-decimal list-inside space-y-2 text-sm text-slate-700 leading-relaxed marker:text-slate-400"
            >
              {d.negotiation_angles_lt.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Forward note — muted footer with arrow */}
      <p className="text-sm text-slate-500 leading-relaxed">
        <span aria-hidden="true" className="text-slate-400 mr-1">→</span>
        {d.forward_note_lt}
      </p>

      {/* Scope disclaimer — fine print, separated by border-top */}
      {d.scope_disclaimer_lt && (
        <p className="text-xs text-slate-400 leading-relaxed mt-6 border-t border-slate-100 pt-4">
          <span aria-hidden="true">ℹ️ </span>
          {d.scope_disclaimer_lt}
        </p>
      )}
    </section>
  );
}
