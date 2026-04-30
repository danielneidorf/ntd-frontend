// B8-3: Block 8 — Recommendations and decisions section.
// Renders nothing when status is not "ready" (e.g. land-only).
import type { Block8Data } from './mockReportData';

interface Block8SectionProps {
  block8: Block8Data | undefined;
}

export function Block8Section({ block8 }: Block8SectionProps) {
  if (!block8 || block8.status !== 'ready' || !block8.data) return null;
  const d = block8.data;

  return (
    <section
      data-guide="block8"
      className="bg-white rounded-xl shadow-sm p-6 md:p-8"
    >
      <h2 className="text-2xl font-semibold text-[#1E3A5F] mb-2">
        {block8.title_lt || '8) Rekomendacijos ir sprendimai'}
      </h2>

      {d.caveat_lt && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded-r">
          <p className="text-sm text-amber-900 leading-relaxed">
            <span aria-hidden="true">⚠️ </span>
            {d.caveat_lt}
          </p>
        </div>
      )}

      <p
        data-block8="intro"
        className="text-base text-slate-600 mb-6 leading-relaxed"
      >
        {d.intro_lt}
      </p>

      {d.viewing_questions_lt.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-3">
            Ką patikrinti apžiūros metu
          </h3>
          <ul
            data-block8="viewing-questions"
            className="space-y-2 pl-5 mb-6 list-disc"
          >
            {d.viewing_questions_lt.map((q, i) => (
              <li
                key={i}
                className="text-sm text-slate-600 leading-relaxed"
              >
                {q}
              </li>
            ))}
          </ul>
        </>
      )}

      {d.negotiation_angles_lt.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-[#1E3A5F] mb-3">
            Derybų kampai
          </h3>
          <ul
            data-block8="negotiation-angles"
            className="space-y-2 pl-5 mb-6 list-disc"
          >
            {d.negotiation_angles_lt.map((a, i) => (
              <li
                key={i}
                className="text-sm text-slate-600 leading-relaxed"
              >
                {a}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="text-lg font-semibold text-[#1E3A5F] mb-3">Toliau</h3>
      <p className="text-base text-slate-600 leading-relaxed mb-6">
        {d.forward_note_lt}
      </p>

      {d.scope_disclaimer_lt && (
        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
          <span aria-hidden="true">ℹ️ </span>
          {d.scope_disclaimer_lt}
        </p>
      )}
    </section>
  );
}
