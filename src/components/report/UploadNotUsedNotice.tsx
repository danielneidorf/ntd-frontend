/**
 * The sentence owed to a customer whose uploaded certificate we could not use.
 *
 * G2 Piece 1. Until 2026-08-06 this sentence reached only the customer who
 * opened the PDF: the backend served it (`report_access_service.py` →
 * `data.block1.upload_not_used_message_lt`), `report_pdf.html` rendered it, and
 * nothing in `src/` read it. The web report — the PRIMARY surface — was silent.
 *
 * THE STRING IS SERVED, NEVER AUTHORED HERE. Every reason's Lithuanian lives in
 * the backend's one map (`block1/presentation.py:UPLOAD_NOT_USED_LT`), which the
 * PDF reads too; a copy in this file would be a second specification of one
 * sentence, which is the divergence the wire-format rule exists to prevent.
 *
 * NOT ALWAYS A REFUSAL — deliberately untitled. Two of the reasons this field
 * carries CREDIT the upload rather than refuse it: `merged_with_register` (№13,
 * "built from the register and your document") and `overridden_by_better_official`
 * (№38, "shown as the earlier one"). A heading reading „sertifikatas
 * nepanaudotas" would be false on those states, so the block carries none — the
 * served sentence says what happened in its own words. The PDF is untitled here
 * for the same reason.
 *
 * Placement mirrors print: above the comfort bars, because it explains what the
 * assessment below is (and is not) built from.
 */

export default function UploadNotUsedNotice({
  message,
}: {
  message?: string | null;
}) {
  // Absent when the certificate WAS used — the ordinary case, and the surface
  // then shows nothing at all rather than an empty box.
  if (!message) return null;

  return (
    <div
      data-upload-not-used
      className="bg-gray-50 rounded-lg px-6 py-5 mb-6 text-base text-slate-600 leading-relaxed"
    >
      {message}
    </div>
  );
}
