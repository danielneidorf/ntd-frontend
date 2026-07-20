/**
 * Report-walk C1 (ruling 2026-07-18): the Pastato charakteristikos card's
 * FIRST tests — the card was entirely untested before this commit.
 * Pins: DOM order = the blessed semantic order (identity → area pair →
 * physique → systems); the area-pair helper renders; the "(STR 2.01.02)"
 * code no longer rides the label (it stays in the citations).
 * Fixture is local and minimal — deliberately NOT the mock (the mock is
 * regenerated in the next commit; the card contract must not depend on it).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PropertyProfile from '../PropertyProfile';
import type { ReportData } from '../mockReportData';

const PROFILE: ReportData['property_profile'] = {
  evaluation_target: 'Esamas pastatas',
  purpose: 'Gyvenamoji',
  premises_type: 'Butas',
  usage_group_label: 'Daugiabučiai gyvenamieji pastatai',
  year_built: 1975,
  floors: 5,
  total_area_m2: 68.5,
  heated_area_m2: 52.4,
  wall_material: 'Plytos',
  heating_type: 'Centrinis šildymas',
  ventilation_type: 'Natūrali',
  energy_class: 'D',
  epc_kwhm2_year: 145.2,
  epc_source: 'Registrų centras',
  epc_confidence: 'Vidutinis',
  glazing_source: null,
} as ReportData['property_profile'];

const BLESSED_ORDER = [
  'Paskirtis',
  'Tipas',
  'Naudojimo grupė',
  'Statybos metai',
  'Bendras plotas',
  'Šildomas plotas',
  'Aukštų skaičius',
  'Sienų medžiaga',
  'Šildymo tipas',
  'Ventiliacijos tipas',
];

function renderCard() {
  return render(
    <PropertyProfile profile={PROFILE} lat={54.7} lng={25.28} address="Testo g. 1, Vilnius" />,
  );
}

describe('Pastato charakteristikos card (report-walk C1)', () => {
  it('renders the rows in the blessed semantic order (DOM order = pairs)', () => {
    renderCard();
    const heading = screen.getByText('Pastato charakteristikos');
    const card = heading.parentElement!;
    const labels = Array.from(card.querySelectorAll('p.text-sm.text-slate-500'))
      .map((p) => p.textContent)
      .filter((t) => BLESSED_ORDER.includes(t ?? ''));
    expect(labels).toEqual(BLESSED_ORDER);
  });

  it('renders the area-pair helper after Šildomas plotas', () => {
    renderCard();
    expect(
      screen.getByText(
        'Bendras plotas apima ir nešildomas erdves — balkoną, rūsį ar sandėliuką. ' +
          'Energijos sąnaudos skaičiuojamos pagal šildomą plotą.',
      ),
    ).toBeTruthy();
  });

  it('the Naudojimo grupė label carries no STR code (the code lives in the citations)', () => {
    const { container } = renderCard();
    expect(container.textContent).not.toContain('STR 2.01.02');
    expect(screen.getByText('Naudojimo grupė')).toBeTruthy();
  });
});
