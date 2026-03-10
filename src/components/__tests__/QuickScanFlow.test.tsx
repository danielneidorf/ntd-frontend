import { describe, it, expect } from 'vitest';

const NTR_REGEX = /^\d{4}-\d{4}-\d{4}(:\d{1,6})?$/;

describe('NTR format validation', () => {
  it('accepts valid 12-digit format', () => {
    expect(NTR_REGEX.test('1234-5678-9012')).toBe(true);
  });
  it('accepts format with sub-object suffix', () => {
    expect(NTR_REGEX.test('1234-5678-9012:1')).toBe(true);
  });
  it('rejects missing dashes', () => {
    expect(NTR_REGEX.test('123456789012')).toBe(false);
  });
  it('rejects partial input', () => {
    expect(NTR_REGEX.test('1234-5678')).toBe(false);
  });
  it('rejects letters', () => {
    expect(NTR_REGEX.test('ABCD-5678-9012')).toBe(false);
  });
});