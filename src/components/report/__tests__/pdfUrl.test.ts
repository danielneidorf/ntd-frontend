// B2-14: PDF download URL carries the stateless household-size selection.
import { buildPdfUrl } from '../pdfUrl';

const BASE = 'https://api.ntd.lt';

describe('buildPdfUrl', () => {
  it('returns null without a token', () => {
    expect(buildPdfUrl(BASE, null, 2)).toBeNull();
  });

  it('returns the plain PDF URL when nothing is selected', () => {
    expect(buildPdfUrl(BASE, 'tok123', null)).toBe(
      'https://api.ntd.lt/v1/reports/tok123/pdf',
    );
  });

  it('appends ?household_size=N while a size is selected', () => {
    expect(buildPdfUrl(BASE, 'tok123', 2)).toBe(
      'https://api.ntd.lt/v1/reports/tok123/pdf?household_size=2',
    );
    expect(buildPdfUrl(BASE, 'tok123', 5)).toBe(
      'https://api.ntd.lt/v1/reports/tok123/pdf?household_size=5',
    );
  });
});
