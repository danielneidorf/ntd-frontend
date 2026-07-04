// B2-14: PDF download URL — carries the stateless household-size selection.
// The backend renders the personalised §7.7 view for ?household_size=N and
// silently falls back to the default table-only PDF for anything invalid.
export function buildPdfUrl(
  apiBase: string,
  token: string | null,
  householdSize: number | null,
): string | null {
  if (!token) return null;
  const base = `${apiBase}/v1/reports/${token}/pdf`;
  return householdSize == null ? base : `${base}?household_size=${householdSize}`;
}
