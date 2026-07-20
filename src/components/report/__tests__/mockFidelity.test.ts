/**
 * Report-walk R1 (ruling 2026-07-18): mock self-consistency pins.
 *
 * MOCK_EXISTING was a cross-fixture COMPOSITION — a hand-set class-C
 * property profile glued to a frozen Block-2 capture from a class-D
 * Kaunas fixture — which is what the 2026-07-18 walk actually reviewed
 * (C-vs-D "contradiction", Kauno citation, retired 10-30 % band: all
 * mock artifacts). The mock is now regenerated verbatim from the ONE
 * backend dev fixture (recipe in the mock header). These pins make the
 * composition class of defect structurally loud: they assert the mock
 * agrees WITH ITSELF across the exact seams that diverged. No cross-repo
 * read — fidelity to the backend is the recipe's job; consistency is
 * this file's.
 */
import { describe, expect, it } from 'vitest';

import { MOCK_EXISTING } from '../mockReportData';

describe('MOCK_EXISTING self-consistency (report-walk R1)', () => {
  it('Block-2 explanation carries the SAME energy class as the property profile', () => {
    const cls = MOCK_EXISTING.property_profile.energy_class!;
    expect(cls).toBeTruthy();
    expect(MOCK_EXISTING.block2!.explanation!.body_lt).toContain(`(${cls})`);
  });

  it('the explanation euros equal the breakdown total (month and year)', () => {
    const b2 = MOCK_EXISTING.block2!;
    const total = b2.breakdown!.total;
    const body = b2.explanation!.body_lt;
    expect(body).toContain(`€${total.eur_month} per mėnesį`);
    expect(body).toContain(`€${total.eur_year} per metus`);
  });

  it('the headline metric equals the breakdown total', () => {
    const b2 = MOCK_EXISTING.block2!;
    expect(b2.metric!.eur_month).toBe(b2.breakdown!.total.eur_month);
  });

  it('the retired 10-30 % band phrasing is extinct in the capture', () => {
    expect(JSON.stringify(MOCK_EXISTING)).not.toContain('10–30');
  });
});
