import { describe, it, expect } from 'vitest';

/**
 * F6: Invoice fields visibility logic.
 *
 * These mirror the conditional rendering in QuickScanFlow.tsx Screen 2 payment card:
 * - Invoice email shown when invoice_requested === true
 * - Company fields shown when invoice_requested === true AND invoice_is_company === true
 */

function shouldShowInvoiceFields(invoiceRequested: boolean): boolean {
  return invoiceRequested;
}

function shouldShowCompanyFields(invoiceRequested: boolean, isCompany: boolean): boolean {
  return invoiceRequested && isCompany;
}

describe('F6: Invoice fields visibility', () => {
  it('invoice fields hidden when checkbox unchecked', () => {
    expect(shouldShowInvoiceFields(false)).toBe(false);
  });

  it('invoice fields shown when checkbox checked', () => {
    expect(shouldShowInvoiceFields(true)).toBe(true);
  });

  it('company fields hidden when invoice unchecked (regardless of company flag)', () => {
    expect(shouldShowCompanyFields(false, true)).toBe(false);
  });

  it('company fields hidden for Fizinis asmuo (invoice checked but not company)', () => {
    expect(shouldShowCompanyFields(true, false)).toBe(false);
  });

  it('company fields shown for Juridinis asmuo (invoice checked + company)', () => {
    expect(shouldShowCompanyFields(true, true)).toBe(true);
  });
});
