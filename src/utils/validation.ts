/**
 * Shared validation functions for QuickScan flow.
 * Extracted from QuickScanFlow.tsx for testability.
 */

/** NTR unique number format: XXXX-XXXX-XXXX with optional :XXXXXX suffix */
const NTR_REGEX = /^\d{4}-\d{4}-\d{4}(:\d{1,6})?$/;

export function isValidNtr(value: string): boolean {
  return NTR_REGEX.test(value.trim());
}

/** Basic email format validation */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Screen 1: can the user proceed? Needs case type AND at least one location input. */
export function isScreen1Valid(caseType: string | null, locationProvided: boolean): boolean {
  return !!caseType && locationProvided;
}

/** EPC card: is year required given current field state? */
export function isEpcYearRequired(energyClass: string | null | undefined, yearUnknownChecked: boolean): boolean {
  if (!energyClass) return false;
  return !yearUnknownChecked;
}

/** Payment button: enabled when email valid AND consent checked */
export function isPaymentEnabled(emailValid: boolean, consentChecked: boolean): boolean {
  return emailValid && consentChecked;
}
