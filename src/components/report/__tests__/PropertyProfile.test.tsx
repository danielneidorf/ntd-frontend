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
  // The annex name the backend now serves (block1_usage_group_labels;
  // annex lines 116-148). The previous value here was mock-authored and
  // appears in no source — a fixture must not teach a name that isn't real.
  usage_group_label: 'Kiti gyvenamieji pastatai (daugiabučiai, bendrabučiai ir kt.)',
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

// Label ruling (2026-07-20): the area block has TWO render states, so the
// blessed order has two forms. Proxy/untagged → ONE „Bendras plotas" row;
// a genuine heated source → the pair, „Šildomas plotas" included.
const ORDER_PROXY = [
  'Paskirtis',
  'Tipas',
  'Naudojimo grupė',
  'Statybos metai',
  'Bendras plotas',
  'Aukštų skaičius',
  'Sienų medžiaga',
  'Šildymo tipas',
  'Ventiliacijos tipas',
];

const ORDER_GENUINE = [
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

// `heated_area_m2_is_genuine` is the BACKEND's decision, served (2026-07-21).
// The card no longer keeps its own copy of the genuine-source list, so the
// fixture must carry the served flag — not just the raw tag it derives from.
const GENUINE_AREA = {
  total_area_m2: 68.5,
  heated_area_m2: 52.4,
  heated_area_m2_source: 'tier_2_pens_israsas',
  heated_area_m2_source_lt: 'Pagal energinio naudingumo sertifikatą',
  heated_area_m2_is_genuine: true,
};

function renderCard(extra: Record<string, unknown> = {}) {
  return render(
    <PropertyProfile
      profile={{ ...PROFILE, ...extra } as ReportData['property_profile']}
      lat={54.7}
      lng={25.28}
      address="Testo g. 1, Vilnius"
    />,
  );
}

function labelsInCard(): string[] {
  const heading = screen.getByText('Pastato charakteristikos');
  const card = heading.parentElement!;
  return Array.from(card.querySelectorAll('p.text-sm.text-slate-500'))
    .map((p) => p.textContent ?? '')
    .filter((t) => ORDER_GENUINE.includes(t));
}

describe('Pastato charakteristikos card (report-walk C1)', () => {
  it('renders the rows in the blessed semantic order (genuine heated source)', () => {
    renderCard(GENUINE_AREA);
    expect(labelsInCard()).toEqual(ORDER_GENUINE);
  });

  it('renders the area-pair helper after Šildomas plotas (genuine source)', () => {
    renderCard(GENUINE_AREA);
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


describe('provenance sub-lines (report-walk C2, R6/R7)', () => {
  it('renders the served area + class provenance lines when present', () => {
    render(
      <PropertyProfile
        profile={{
          ...PROFILE,
          heated_area_m2_source_lt:
            'Registre šildomas plotas nenurodytas — naudojamas bendras plotas',
          energy_class_provenance: 'era',
          energy_class_provenance_lt:
            'Nustatyta pagal statybos periodą (sertifikato nėra)',
        }}
        lat={54.7}
        lng={25.28}
        address="Testo g. 1, Vilnius"
      />,
    );
    expect(
      screen.getByText('Registre šildomas plotas nenurodytas — naudojamas bendras plotas'),
    ).toBeTruthy();
    expect(
      screen.getByText('Nustatyta pagal statybos periodą (sertifikato nėra)'),
    ).toBeTruthy();
  });

  it('renders NO provenance line when the backend serves none (no false claim)', () => {
    const { container } = renderCard();
    expect(container.textContent).not.toContain('naudojamas bendras plotas');
    expect(container.textContent).not.toContain('pagal statybos periodą');
  });
});


describe('area label ruling — truth by suppression (2026-07-20)', () => {
  it('proxy source: ONE „Bendras plotas" row, no „Šildomas plotas" claim, disclosure shown', () => {
    const { container } = renderCard({
      total_area_m2: null,
      heated_area_m2: 52.4,
      heated_area_m2_source: 'total_area_proxy',
      heated_area_m2_source_lt:
        'Registre šildomas plotas nenurodytas — naudojamas bendras plotas',
    });
    expect(labelsInCard()).toEqual(ORDER_PROXY);
    expect(container.textContent).not.toContain('Šildomas plotas');
    // The value still shows — under the label that is TRUE for it…
    expect(screen.getByText('52.4 m²')).toBeTruthy();
    // …with the R6 disclosure beneath.
    expect(
      screen.getByText('Registre šildomas plotas nenurodytas — naudojamas bendras plotas'),
    ).toBeTruthy();
  });

  it('untagged legacy snapshot: also suppressed (no claim we cannot support)', () => {
    const { container } = renderCard({
      total_area_m2: null,
      heated_area_m2: 52.4,
      heated_area_m2_source: null,
      heated_area_m2_source_lt: null,
    });
    expect(container.textContent).not.toContain('Šildomas plotas');
    expect(screen.getByText('Bendras plotas')).toBeTruthy();
  });

  it('genuine heated source: BOTH rows render and the heated label is earned', () => {
    const { container } = renderCard(GENUINE_AREA);
    expect(container.textContent).toContain('Šildomas plotas');
    expect(screen.getByText('68.5 m²')).toBeTruthy();  // total
    expect(screen.getByText('52.4 m²')).toBeTruthy();  // heated
    expect(screen.getByText('Pagal energinio naudingumo sertifikatą')).toBeTruthy();
  });
});


describe('each area renders when it has a value (2026-07-21)', () => {
  it('total only: one row, and it is the total', () => {
    const { container } = renderCard({
      total_area_m2: 68.5,
      heated_area_m2: null,
      heated_area_m2_source: null,
      heated_area_m2_is_genuine: false,
    });
    expect(screen.getByText('Bendras plotas')).toBeTruthy();
    expect(screen.getByText('68.5 m²')).toBeTruthy();
    expect(container.textContent).not.toContain('Šildomas plotas');
  });

  it('genuine heated only: one row, and it is the heated one', () => {
    const { container } = renderCard({ ...GENUINE_AREA, total_area_m2: null });
    expect(screen.getByText('Šildomas plotas')).toBeTruthy();
    expect(screen.getByText('52.4 m²')).toBeTruthy();
    // The empty total collapses — no blank row, no dash.
    expect(container.textContent).not.toContain('Bendras plotas apima');
    expect(screen.queryByText('Bendras plotas')).toBeNull();
  });

  it('the pair sits in ONE grid row even when an odd number precedes it', () => {
    // The 2-column grid fills row-by-row, so array adjacency alone would put
    // the two areas in different rows whenever an upstream row is empty —
    // which is exactly what the live road does („Tipas" is empty there).
    const { container } = renderCard({ ...GENUINE_AREA, premises_type: null });
    const pair = container.querySelector('[data-pair="area"]');
    expect(pair).toBeTruthy();
    const labels = Array.from(pair!.querySelectorAll('p.text-sm.text-slate-500'))
      .map((p) => p.textContent);
    expect(labels).toEqual(['Bendras plotas', 'Šildomas plotas']);
  });

  it('a heated area we cannot vouch for never pairs with the total', () => {
    // Proxy road: one number, one row. Both areas carry the same value, so a
    // pair here would print it twice under two different claims.
    const { container } = renderCard({
      total_area_m2: 52.4,
      heated_area_m2: 52.4,
      heated_area_m2_source: 'total_area_proxy',
      heated_area_m2_is_genuine: false,
    });
    expect(container.querySelector('[data-pair="area"]')).toBeNull();
    expect(container.textContent).not.toContain('Šildomas plotas');
    expect(screen.getAllByText('52.4 m²')).toHaveLength(1);
  });
});


describe('usage-group row (annex label, 2026-07-21)', () => {
  it('renders the annex name verbatim when the backend serves one', () => {
    const annexName = 'Kiti gyvenamieji pastatai (daugiabučiai, bendrabučiai ir kt.)';
    renderCard({ usage_group_label: annexName });
    expect(screen.getByText('Naudojimo grupė')).toBeTruthy();
    // Long regulatory strings render whole — no truncation (Daniel's ruling).
    expect(screen.getByText(annexName)).toBeTruthy();
  });

  it('omits the row entirely when the label is null (unknown or missing slug)', () => {
    const { container } = renderCard({ usage_group_label: null });
    expect(container.textContent).not.toContain('Naudojimo grupė');
  });
});


describe('floors row (Aukštų skaičius, 2026-07-21)', () => {
  it('renders the served whole number', () => {
    renderCard({ floors: 5 });
    expect(screen.getByText('Aukštų skaičius')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('omits the row when the backend serves no floor count', () => {
    // RC's source field is a named empty slot today, so the RC road lands
    // here — no count, no row, no guess.
    const { container } = renderCard({ floors: null });
    expect(container.textContent).not.toContain('Aukštų skaičius');
  });
});
