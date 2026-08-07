/**
 * The OTHER certificate for this property, listed rather than discarded.
 *
 * G2 Piece 2, and the last half of a web/PDF divergence found 2026-08-06. The
 * backend has served this object all along (`report_access_service.py:484`) and
 * print has rendered it (`report_pdf.html:430`); nothing in `src/` read it, so a
 * customer whose building has certificate history saw it only if they opened the
 * PDF. Annexe §6.7: older certificates are shown as a historical/secondary view
 * beside the main assessment, never dropped.
 *
 * NO TITLE BAR — ruled (R-G2-1). Print heads this block with „Kitas šio objekto
 * sertifikatas", a string the backend does not serve and no sitting has ruled;
 * the web ships without it rather than authoring Lithuanian here, and the print
 * heading is ledgered as a G3 pen-sitting candidate. The served label already
 * tells the customer what this is („istorinis sertifikatas (registro įrašas)" /
 * „ankstesnis jūsų pateiktas sertifikatas").
 *
 * EQUAL FIGURES SAY NOTHING. `comparison_lt` is null when the two certificates
 * are within 0.5 kWh/m² of each other — the backend's own rule. The listing
 * still renders; the sentence simply does not. Nothing is invented to fill that
 * silence, and the retired „Abu sertifikatai rodo panašų…" line stays retired.
 *
 * The figure is rounded to a whole number because print rounds it
 * (`| round | int`): same content, same form, both surfaces.
 */

export default function SecondaryCertificate({
  certificate,
}: {
  certificate?: {
    label_lt: string;
    energy_class?: string | null;
    kwhm2_year?: number | null;
    comparison_lt?: string | null;
  } | null;
}) {
  // Null in the ordinary one-certificate case — and in the merge case, where
  // the upload and the register name the SAME certificate: it is credited in
  // the sentence above, and a second entry beside it would be a phantom.
  if (!certificate) return null;

  const { label_lt, energy_class, kwhm2_year, comparison_lt } = certificate;

  return (
    <div
      data-secondary-certificate
      className="bg-gray-50 rounded-lg px-6 py-5 mb-6 text-base text-slate-600 leading-relaxed"
    >
      <p>
        <span data-secondary-label>{label_lt}</span>
        {energy_class ? ` — ${energy_class} klasė` : ''}
        {kwhm2_year ? `, ${Math.round(kwhm2_year)} kWh/m² per metus` : ''}.
      </p>
      {comparison_lt && <p className="mt-2">{comparison_lt}</p>}
    </div>
  );
}
