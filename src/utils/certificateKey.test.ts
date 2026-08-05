/**
 * The typed certificate identifier — the answer to a scanned certificate.
 *
 * Wire-format rule: the backend `ConfirmRequest` schema is the ONE spec —
 * `certificate_key` (bustodnr_api/quickscan_lite.py). Same discipline as
 * evidencePayload.test.ts: the literal is pinned here so a rename on either
 * side is caught, rather than discovered when the two ends meet.
 *
 * The fixture values are real: certificate AD-0119-03384 for Verkių g. 42,
 * verified live against the register on 2026-08-05.
 */
import { describe, expect, it } from 'vitest';

import {
  buildCertificateKeyPayload,
  formatCertificateKeyAsTyped,
  isCertificateKeyError,
  normaliseCertificateKey,
} from './certificateKey';

const CERT_NR = 'AD-0119-03384';
const CERT_UID = '1095-8025-2026';

describe('normaliseCertificateKey', () => {
  it('recognises the certificate number as printed', () => {
    expect(normaliseCertificateKey(CERT_NR)).toEqual({
      kind: 'cert_nr',
      value: CERT_NR,
    });
  });

  it('recognises the building number as printed', () => {
    expect(normaliseCertificateKey(CERT_UID)).toEqual({
      kind: 'unikalus_nr',
      value: CERT_UID,
    });
  });

  it.each([
    ['ad-0119-03384', CERT_NR],
    ['  AD–0119–03384  ', CERT_NR], // en-dashes from a phone keyboard
    ['AD—0119—03384', CERT_NR], // em-dashes from a paste
  ])('survives however it was typed: %s', (typed, expected) => {
    expect(normaliseCertificateKey(typed)?.value).toBe(expected);
  });

  it.each([
    ['1095 8025 2026', CERT_UID],
    ['109580252026', CERT_UID],
    ['1095-8025-2026:0004', CERT_UID], // the unit suffix is dropped
  ])('normalises the building number: %s', (typed, expected) => {
    expect(normaliseCertificateKey(typed)?.value).toBe(expected);
  });

  it('REFUSES a dashless certificate number rather than guessing', () => {
    // `AD011903384` could split as 0119/03384 or 01190/3384. A wrong split is
    // a wrong certificate — asking costs seconds, guessing costs an
    // assessment of someone else's property.
    expect(normaliseCertificateKey('AD011903384')).toBeNull();
  });

  it.each(['', '   ', 'hello', '12345', null])('refuses %s', (typed) => {
    expect(normaliseCertificateKey(typed as string | null)).toBeNull();
  });
});

describe('formatCertificateKeyAsTyped', () => {
  it('inserts the certificate number dashes as you type', () => {
    expect(formatCertificateKeyAsTyped('AD')).toBe('AD');
    expect(formatCertificateKeyAsTyped('AD0119')).toBe('AD-0119');
    expect(formatCertificateKeyAsTyped('AD011903384')).toBe(CERT_NR);
  });

  it('falls to the building grouping when no letters were typed', () => {
    expect(formatCertificateKeyAsTyped('1095')).toBe('1095');
    expect(formatCertificateKeyAsTyped('10958025')).toBe('1095-8025');
    expect(formatCertificateKeyAsTyped('109580252026')).toBe(CERT_UID);
  });

  it('is idempotent on an already-formatted value', () => {
    expect(formatCertificateKeyAsTyped(CERT_NR)).toBe(CERT_NR);
    expect(formatCertificateKeyAsTyped(CERT_UID)).toBe(CERT_UID);
  });
});

describe('buildCertificateKeyPayload', () => {
  it('sends the normalised key under the backend field name', () => {
    expect(buildCertificateKeyPayload({ certificate_key: 'ad-0119-03384' })).toEqual({
      certificate_key: CERT_NR,
    });
  });

  it('nothing typed → the key is ABSENT (pins the optionality)', () => {
    const fragment = buildCertificateKeyPayload({ certificate_key: null });
    expect(fragment).toEqual({});
    expect('certificate_key' in fragment).toBe(false);
  });

  it('a half-typed key is not sent', () => {
    // The server would refuse it anyway; not sending spares the round trip.
    expect(buildCertificateKeyPayload({ certificate_key: 'AD-01' })).toEqual({});
  });
});

describe('isCertificateKeyError', () => {
  it('recognises every refusal the backend can return', () => {
    // Without this the flow's error branch swallows them and the customer
    // sees the generic pricing error instead of the honest sentence.
    for (const code of [
      'certificate_key_invalid',
      'certificate_key_not_found',
      'certificate_property_mismatch',
      'certificate_key_unverifiable',
    ]) {
      expect(isCertificateKeyError(code)).toBe(true);
    }
  });

  it('does not claim unrelated codes', () => {
    expect(isCertificateKeyError('bill_unit_invalid')).toBe(false);
    expect(isCertificateKeyError(undefined)).toBe(false);
  });
});
