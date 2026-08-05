/**
 * The typed certificate identifier — the answer to a scanned certificate.
 *
 * A real energy certificate is a photograph of paper: there is no text in the
 * file to read. So the customer reads us the number printed on it instead and
 * the backend fetches the authoritative record from the register. Values never
 * come from reading a picture.
 *
 * Two identifiers appear on the document and both are indexed in the register:
 *   - the certificate's own number, under the title: „Nr. AD-0119-03384";
 *   - the building's: „Pastato (jo dalies) unikalus pastato numeris:
 *     1095-8025-2026".
 *
 * Wire-format rule: the backend `ConfirmRequest` schema is the ONE spec —
 * `certificate_key`, `Optional[str] = None` (bustodnr_api/quickscan_lite.py).
 * This mirrors the shipped `buildEvidencePayload` idiom: a pure builder
 * returning a spreadable fragment, `{}` when nothing applies, so the tests pin
 * the real wire shape rather than a hand-built object.
 *
 * The normalisation here is a COURTESY, not a decision. The server normalises
 * and validates again; this only spares the customer a round trip to learn
 * they mistyped.
 */

export type CertificateKeyKind = 'cert_nr' | 'unikalus_nr';

const DASHES = /[‐‑‒–—−]/g;
const CERT_NR_RE = /^[A-ZĄČĘĖĮŠŲŪŽ]{2}-\d{3,5}-\d{3,6}$/;

/** Recognise which of the two printed shapes was typed, or `null`. */
export function normaliseCertificateKey(
  raw: string | null,
): { kind: CertificateKeyKind; value: string } | null {
  if (!raw) return null;
  const text = raw.replace(DASHES, '-').trim().toUpperCase().replace(/\s+/g, '');
  if (!text) return null;

  const digits = text.split(':')[0].replace(/\D/g, '');
  if (digits.length === 12 && !/[A-ZĄČĘĖĮŠŲŪŽ]/.test(text)) {
    return {
      kind: 'unikalus_nr',
      value: `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`,
    };
  }

  if (CERT_NR_RE.test(text)) return { kind: 'cert_nr', value: text };

  // Deliberately NOT guessed: `AD011903384` could split as 0119/03384 or
  // 01190/3384, and a wrong split is a wrong certificate. Asking costs the
  // customer seconds; guessing costs an assessment of someone else's property.
  return null;
}

/**
 * Format as the customer types — dashes inserted, never typed. Mirrors the
 * shipped `handleNtrChange` idiom for the „Unikalus Nr." field.
 */
export function formatCertificateKeyAsTyped(raw: string): string {
  const text = raw.replace(DASHES, '-').toUpperCase();
  const letters = text.replace(/[^A-ZĄČĘĖĮŠŲŪŽ]/g, '').slice(0, 2);

  // Digit-only entry → the building number's 4-4-4 grouping.
  if (!letters) {
    const digits = text.replace(/\D/g, '').slice(0, 12);
    if (digits.length > 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    if (digits.length > 4) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return digits;
  }

  // Letter-prefixed → the certificate number's LL-NNNN-NNNNN grouping.
  const digits = text.replace(/\D/g, '').slice(0, 11);
  if (!digits) return letters;
  if (digits.length <= 5) return `${letters}-${digits}`;
  return `${letters}-${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/** The /confirm payload fragment. `{}` when nothing usable was typed. */
export function buildCertificateKeyPayload(
  state: { certificate_key: string | null },
): Record<string, string> {
  const key = normaliseCertificateKey(state.certificate_key);
  return key ? { certificate_key: key.value } : {};
}

/**
 * The backend's structured refusals for this field. Listed here because the
 * flow's error branch must recognise them: without this, a not-found falls
 * through to the generic „Klaida gaunant kainą" and the honest sentence the
 * backend wrote is never shown.
 */
export const CERTIFICATE_KEY_ERROR_CODES = [
  'certificate_key_invalid',
  'certificate_key_not_found',
  'certificate_property_mismatch',
  'certificate_key_unverifiable',
] as const;

export function isCertificateKeyError(code: string | undefined): boolean {
  return !!code && (CERTIFICATE_KEY_ERROR_CODES as readonly string[]).includes(code);
}
