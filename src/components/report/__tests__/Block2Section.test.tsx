// B2-13: Block 2 (energy costs) section tests.
import { render, screen } from '@testing-library/react';
import { Block2Section } from '../Block2Section';
import { MOCK_EXISTING, MOCK_FALLBACK, MOCK_LAND_ONLY } from '../mockReportData';

describe('Block2Section', () => {
  it('renders metric, breakdown, charts, prose and household table when ready', () => {
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);

    const section = container.querySelector('[data-guide="block2"]');
    expect(section).not.toBeNull();
    for (const name of [
      'metric',
      'breakdown',
      'monthly-chart',
      'forecast-chart',
      'explanation',
      'info-box',
      'confidence',
      'household-reference',
    ]) {
      expect(section!.querySelector(`[data-block2="${name}"]`)).not.toBeNull();
    }
    // Backend-rounded headline + a breakdown total rendered verbatim.
    expect(screen.getByText(/~€81/)).toBeInTheDocument();
    expect(screen.getByText('Ką tai reiškia praktiškai?')).toBeInTheDocument();
  });

  it('renders the 📊/👥 source-indicator glyphs in the breakdown table', () => {
    // Own the glyph values under test — control the source_indicator inputs and
    // assert the component actually puts them on the surface (glyph-reaches-breakdown),
    // rather than leaning on the shared mock's rows staying as-is.
    const block2 = {
      ...MOCK_EXISTING.block2,
      breakdown: {
        ...MOCK_EXISTING.block2.breakdown,
        rows: [
          { label_lt: 'Šildymas', eur_year: 729, eur_month: 61, source_indicator: '📊 pagal pastato duomenis' },
          { label_lt: 'Karštas vanduo', eur_year: 211, eur_month: 18, source_indicator: '👥 statistinis vidurkis' },
        ],
      },
    };
    const { container } = render(<Block2Section block2={block2} />);
    const table = container.querySelector('[data-block2="breakdown"]');
    expect(table).not.toBeNull();
    expect(table!.textContent).toContain('📊');
    expect(table!.textContent).toContain('👥');
  });

  it('hides the carrier warning for an EPC-sourced report', () => {
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);
    expect(container.querySelector('[data-block2="carrier-warning"]')).toBeNull();
  });

  it('shows the carrier warning when the heating type was inferred (fallback)', () => {
    const { container } = render(<Block2Section block2={MOCK_FALLBACK.block2} />);
    const warning = container.querySelector('[data-block2="carrier-warning"]');
    expect(warning).not.toBeNull();
    expect(warning!.textContent).toMatch(/nėra nurodytas/);
  });

  it('renders the message and no priced content when not applicable', () => {
    const { container } = render(<Block2Section block2={MOCK_LAND_ONLY.block2} />);
    expect(container.querySelector('[data-block2="not-applicable"]')).not.toBeNull();
    expect(container.querySelector('[data-block2="metric"]')).toBeNull();
    expect(screen.getByText(/taikomas tik šildomiems pastatams/)).toBeInTheDocument();
  });

  it('renders nothing when block2 is absent', () => {
    const { container } = render(<Block2Section block2={undefined} />);
    expect(container.firstChild).toBeNull();
  });
});
