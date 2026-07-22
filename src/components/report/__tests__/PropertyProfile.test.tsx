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
  purpose: 'residential',   // internal bucket — never rendered
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
  'Tipas',
  'Naudojimo grupė',
  'Statybos metai',
  'Bendras plotas',
  'Aukštų skaičius',
  'Sienų medžiaga',
  'Šildymo tipas',
  'Ventiliacija',
];

const ORDER_GENUINE = [
  'Tipas',
  'Naudojimo grupė',
  'Statybos metai',
  'Bendras plotas',
  'Šildomas plotas',
  'Aukštų skaičius',
  'Sienų medžiaga',
  'Šildymo tipas',
  'Ventiliacija',
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
  // Pinned on the cell's own marker, not its typography: the spacing pass
  // (2026-07-22) restyled labels, and a selector keyed to font classes made
  // every order test a hostage to design tweaks.
  return Array.from(card.querySelectorAll('[data-cell]'))
    .map((el) => el.getAttribute('data-cell') ?? '')
    .filter((t) => ORDER_GENUINE.includes(t));
}

describe('Pastato charakteristikos card (report-walk C1)', () => {
  it('renders the rows in the blessed semantic order (genuine heated source)', () => {
    renderCard(GENUINE_AREA);
    expect(labelsInCard()).toEqual(ORDER_GENUINE);
  });

  it('carries NO total-vs-heated prose — the card is a data grid', () => {
    // Removed 2026-07-22 (was: an area-pair helper rendered under the pair).
    // Two sentences of prose in a grid of values; it never sat comfortably
    // and neither surface carries it now, so parity holds by absence. Pinned
    // as a REMOVAL rather than deleted, so a well-meaning re-add is a test
    // failure and a conversation, not a silent regression.
    const { container } = renderCard(GENUINE_AREA);
    expect(container.textContent).not.toContain('nešildomas erdves');
    expect(container.textContent).not.toContain('skaičiuojamos pagal šildomą plotą');
  });

  it('keeps the R6 provenance, attached to its own value', () => {
    // The honesty ruling is untouched by the prose removal: the served
    // provenance still renders, as a compact sub-line inside the Šildomas
    // cell — the pattern the glazing row uses.
    renderCard(GENUINE_AREA);
    const heated = document.querySelector('[data-cell="Šildomas plotas"]');
    expect(heated?.textContent).toContain('Pagal energinio naudingumo sertifikatą');
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


describe('„Paskirtis" row — the register\'s own word (2026-07-22)', () => {
  it('renders RC\'s value verbatim under the level-specific label', () => {
    renderCard({
      paskirtis_label_lt: 'Daugiabučių',
      paskirtis_row_label_lt: 'Pastatų paskirtis',
    });
    expect(screen.getByText('Pastatų paskirtis')).toBeTruthy();
    expect(screen.getByText('Daugiabučių')).toBeTruthy();
  });

  it('the label follows the object level (RC\'s vocabulary is level-specific)', () => {
    renderCard({
      paskirtis_label_lt: 'Gyvenamųjų (butų)',
      paskirtis_row_label_lt: 'Patalpų paskirtis',
    });
    expect(screen.getByText('Patalpų paskirtis')).toBeTruthy();
    expect(screen.queryByText('Pastatų paskirtis')).toBeNull();
  });

  it('wired and dark: no RC value → no row', () => {
    const { container } = renderCard({
      paskirtis_label_lt: null,
      paskirtis_row_label_lt: null,
    });
    expect(container.textContent).not.toContain('paskirtis');
  });

  it('never renders the internal purpose bucket', () => {
    // The defect: a real report printed „residential" as the customer's
    // Paskirtis. The bucket gates logic; it is not a designation.
    const { container } = renderCard({ purpose: 'residential' });
    expect(container.textContent).not.toContain('residential');
    expect(container.textContent).not.toContain('premises');
    expect(container.textContent).not.toContain('land_plot');
  });
});


describe('„Tipas" row — no unit type, no row (2026-07-21)', () => {
  it('omits the row when the backend serves no unit type', () => {
    // `premises_type` is None on every road that answers today, so this is
    // the ONLY state a real report reaches. The row must vanish rather than
    // print a placeholder — and a raw code like „flat" (the fixture's
    // retired invention) must never reach a Lithuanian customer card.
    const { container } = renderCard({ premises_type: null });
    expect(screen.queryByText('Tipas')).toBeNull();
    expect(container.textContent).not.toContain('flat');
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
    const labels = Array.from(pair!.querySelectorAll('[data-cell]'))
      .map((el) => el.getAttribute('data-cell'));
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
