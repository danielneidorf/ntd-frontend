// P7-A3.3 / 2026-07-29 unification: the „Šaltiniai" list is single-sourced from
// the backend for BOTH surfaces. This component renders the SERVED Block-1
// bibliography (data.citations) followed by the SERVED Block-2 lines — it no
// longer authors any Lithuanian citation copy. The old buildCitations (which
// diverged from the PDF's backend builder — different date handling, a drifted
// glazing-works list, ungated STR) is retired: §7.8 web/PDF parity, and no
// Lithuanian copy lives in TypeScript.

export default function Citations({
  block1Citations,
  block2CitationsLt,
  titleLt,
}: {
  // The served Block-1 bibliography ([1]–[4]+): NTR, PENS/EPC (or customer-
  // supplied), STR, the glazing-typology works, the NTD PENS-derivation, and —
  // for a new build — the Infostatyba project source. Built once in the backend
  // (report_access_service._build_citations); the PDF reads the same list.
  block1Citations: string[];
  // The served Block-2 citations — tariffs, forecast basis, the heating-season
  // basis, the VAT legal act and, while a household size is selected, the 👥
  // household-modelling lines — appended to the same numbered list.
  block2CitationsLt?: string[];
  // №2 — the heading, served. It was the last authored Lithuanian left in this
  // file, and it was already a divergence: print headed the same list
  // „Šaltiniai ir nuorodos". Defaulted, so a report stored before the field
  // existed still renders the ruled word.
  titleLt?: string | null;
}) {
  const citations = [...(block1Citations ?? []), ...(block2CitationsLt ?? [])];

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">{titleLt}</h2>
      <ol className="list-none space-y-3 m-0 p-0">
        {citations.map((text, i) => (
          <li key={i} className="text-sm text-slate-600 leading-relaxed pl-8 -indent-8">
            <span className="font-medium text-slate-500">[{i + 1}]</span>{' '}
            {text}
          </li>
        ))}
      </ol>
    </section>
  );
}
