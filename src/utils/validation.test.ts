import { describe, it, expect } from 'vitest';
import {
  isValidNtr,
  isValidEmail,
  isScreen1Valid,
  isEpcYearRequired,
  isPaymentEnabled,
} from './validation';

// ── F1: NTR format validation ──

describe('F1: NTR validation', () => {
  it('accepts valid NTR format XXXX-XXXX-XXXX', () => {
    expect(isValidNtr('4400-1234-5678')).toBe(true);
  });

  it('accepts NTR with optional suffix :XXXXXX', () => {
    expect(isValidNtr('4400-1234-5678:12345')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidNtr('')).toBe(false);
  });

  it('rejects too-short input', () => {
    expect(isValidNtr('4400-123')).toBe(false);
  });

  it('rejects letters in numeric positions', () => {
    expect(isValidNtr('ABCD-EFGH-IJKL')).toBe(false);
  });

  it('rejects input without dashes', () => {
    expect(isValidNtr('440012345678')).toBe(false);
  });

  it('trims whitespace', () => {
    expect(isValidNtr('  4400-1234-5678  ')).toBe(true);
  });
});

// ── F2: Screen 1 submit readiness ──

describe('F2: Screen 1 submit readiness', () => {
  it('is invalid when no case type selected', () => {
    expect(isScreen1Valid(null, true)).toBe(false);
  });

  it('is invalid when no location provided', () => {
    expect(isScreen1Valid('existing_object', false)).toBe(false);
  });

  it('is valid when case type selected AND location provided', () => {
    expect(isScreen1Valid('existing_object', true)).toBe(true);
  });

  it('is valid for new_build_project with location', () => {
    expect(isScreen1Valid('new_build_project', true)).toBe(true);
  });

  it('is valid for land_only with location', () => {
    expect(isScreen1Valid('land_only', true)).toBe(true);
  });
});

// ── F3: EPC card year requirement ──

describe('F3: EPC card year requirement', () => {
  it('year required when class is selected and year_unknown is unchecked', () => {
    expect(isEpcYearRequired('A++', false)).toBe(true);
  });

  it('year NOT required when year_unknown is checked', () => {
    expect(isEpcYearRequired('A++', true)).toBe(false);
  });

  it('year NOT required when no class selected', () => {
    expect(isEpcYearRequired(null, false)).toBe(false);
  });

  it('year NOT required when class is empty string', () => {
    expect(isEpcYearRequired('', false)).toBe(false);
  });

  it('year NOT required when class is undefined', () => {
    expect(isEpcYearRequired(undefined, false)).toBe(false);
  });
});

// ── F4: Email validation ──

describe('F4: Email validation', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('accepts email with subdomain', () => {
    expect(isValidEmail('user@mail.example.lt')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects missing local part', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('rejects spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });
});

// ── F5: Payment button enablement ──

describe('F5: Payment button enablement', () => {
  it('disabled when consent unchecked', () => {
    expect(isPaymentEnabled(true, false)).toBe(false);
  });

  it('disabled when email invalid', () => {
    expect(isPaymentEnabled(false, true)).toBe(false);
  });

  it('disabled when both invalid', () => {
    expect(isPaymentEnabled(false, false)).toBe(false);
  });

  it('enabled when email valid AND consent checked', () => {
    expect(isPaymentEnabled(true, true)).toBe(true);
  });
});
