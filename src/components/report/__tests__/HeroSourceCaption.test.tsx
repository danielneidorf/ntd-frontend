/**
 * The hero's source caption on the WEB — the browser half of the caption seam.
 *
 * The backend guard (`tests/reports/test_hero_source_caption.py`) proves the
 * caption is served and that the PDF renders it. This proves the card renders
 * what is served, and — the important half — renders NOTHING when nothing is
 * served.
 *
 * WHY THE ABSENT CASE MATTERS MORE THAN THE PRESENT ONE. The caption names whose
 * data built the verdict. On an etalon-backed report there is no certificate at
 * all, and the backend serves null for exactly that reason. If the card were to
 * render an element anyway — an empty sub-line, or worse a fallback of its own —
 * the surface would be making a provenance claim the backend refused to make.
 *
 * The words are read from the ruling, never pasted: `./ruling` parses the same
 * gate document the backend guard reads.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PropertyProfile from '../PropertyProfile';
import type { ReportData } from '../mockReportData';
import { ruled } from '../../__tests__/ruling';

/** The energy card needs its figure present — the caption is that figure's
 *  sub-line, so a profile without `epc_kwhm2_year` has no row to hang it on. */
const BASE = {
  evaluation_target: 'Esamas pastatas',
  premises_type: 'Butas',
  year_built: 1975,
  energy_class: 'D',
  epc_kwhm2_year: 145.2,
  epc_source: 'Registrų centras',
} as ReportData['property_profile'];

function renderWith(caption: string | null) {
  render(
    <PropertyProfile
      profile={{ ...BASE, hero_source_caption_lt: caption }}
      lat={54.7}
      lng={25.28}
      address="Testo g. 1, Vilnius"
    />,
  );
}

describe('the hero figure says which road built it', () => {
  it.each([
    [17, 'the typed road names the register'],
    [18, "the customer's own data is credited"],
    [39, 'the merge credits both sources'],
  ])('★ renders №%i verbatim — %s', (number) => {
    const expected = ruled(number as number);
    renderWith(expected);

    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('★ renders NO caption when the backend served none', () => {
    const captions = [ruled(17), ruled(18), ruled(39)];
    renderWith(null);

    // The figure is there…
    expect(screen.getByText('145.2 kWh/m² per metus')).toBeTruthy();
    // …and says nothing about a certificate it does not have.
    for (const caption of captions) {
      expect(screen.queryByText(caption)).toBeNull();
    }
    expect(screen.queryByText(/sertifikat/i)).toBeNull();
  });
});
