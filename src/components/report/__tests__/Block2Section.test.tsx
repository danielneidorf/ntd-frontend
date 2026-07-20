// B2-13: Block 2 (energy costs) section tests.
// B2-14: + household-size selector / option-switching tests. The mock IS the
// served contract (derived from a real _build_report_data run), so asserting
// against mock option values asserts the component renders served data.
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Block2Section } from '../Block2Section';
import { MOCK_EXISTING, MOCK_FALLBACK, MOCK_LAND_ONLY } from '../mockReportData';

// Controlled-component harness: selection state lives in ReportViewer in the
// app, so the tests reproduce that wiring.
function Harness({ block2 = MOCK_EXISTING.block2 }: { block2?: typeof MOCK_EXISTING.block2 }) {
  const [size, setSize] = useState<number | null>(null);
  return (
    <Block2Section block2={block2} householdSize={size} onHouseholdSizeChange={setSize} />
  );
}

const HM = MOCK_EXISTING.block2!.household_modelling!;
const OPTION = (n: number) => HM.options.find((o) => o.household_size === n)!;
const DHW_ROW = (n: number) =>
  OPTION(n).breakdown.rows.find((r) => r.label_lt.includes('vanduo'))!;

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
    expect(
      screen.getByText(`~€${MOCK_EXISTING.block2!.metric!.eur_month}`),
    ).toBeInTheDocument();
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

  // ─── B2-14: household-size selector + option switching ───────────────────

  it('renders the selector [1][2][3][4][5+] with the served caption', () => {
    const { container } = render(<Harness />);
    const selector = container.querySelector('[data-block2="household-selector"]');
    expect(selector).not.toBeNull();
    const labels = Array.from(selector!.querySelectorAll('button')).map(
      (b) => b.textContent,
    );
    expect(labels).toEqual(['1', '2', '3', '4', '5+']);
    expect(selector!.textContent).toContain(HM.selector_caption_lt);
  });

  it('updates the headline on selection and restores it on deselect (toggle)', () => {
    render(<Harness />);
    const btn2 = screen.getByRole('button', { name: '2' });

    fireEvent.click(btn2);
    expect(screen.getByText(`~€${OPTION(2).metric.eur_month}`)).toBeInTheDocument();
    expect(screen.getByText(OPTION(2).metric.subtext_lt)).toBeInTheDocument();

    fireEvent.click(btn2); // toggle off → building-only default
    expect(
      screen.getByText(`~€${MOCK_EXISTING.block2!.metric!.eur_month}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(MOCK_EXISTING.block2!.metric!.subtext_lt),
    ).toBeInTheDocument();
  });

  it('adjusts the DHW row proportionally with the served option values', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '1' }));

    const table = container.querySelector('[data-block2="breakdown"]')!;
    const dhw = DHW_ROW(1);
    // Size-1 singular grammar + the option's (clamped ×0.5) backend value.
    expect(dhw.label_lt).toBe('Karštas vanduo (pritaikyta 1 asmeniui)');
    expect(table.textContent).toContain(dhw.label_lt);
    expect(table.textContent).toContain(`€${dhw.eur_month}`);
    // Row sum == option headline (served invariant reaches the surface).
    const sum = OPTION(1).breakdown.rows.reduce((s, r) => s + r.eur_month, 0);
    expect(sum).toBe(OPTION(1).metric.eur_month);
  });

  it('shows the 📊+👥 indicators on the adjusted rows when selected', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    const table = container.querySelector('[data-block2="breakdown"]')!;
    expect(table.textContent).toContain('👥 pritaikyta pagal namų ūkio dydį');
    expect(table.textContent).toContain('👥 statistinis vidurkis');
    expect(table.textContent).toContain('Buitinė elektra (3 asm.)');
  });

  it('shows the disclosure box only while a size is selected', () => {
    const { container } = render(<Harness />);
    const box = () => container.querySelector('[data-block2="disclosure-box"]');
    expect(box()).toBeNull();

    const btn4 = screen.getByRole('button', { name: '4' });
    fireEvent.click(btn4);
    expect(box()).not.toBeNull();
    expect(box()!.textContent).toContain('Duomenų šaltiniai');

    fireEvent.click(btn4);
    expect(box()).toBeNull();
  });

  it('renders the served clamped values for the 5+ band, numeral in prose', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '5+' }));
    // Headline = the backend-clamped option-5 value…
    expect(screen.getByText(`~€${OPTION(5).metric.eur_month}`)).toBeInTheDocument();
    // …prose uses the plain numeral ("5 asmenų"), never "5+" (placement rule)…
    expect(OPTION(5).metric.subtext_lt).toContain('5 asmenų namų ūkis');
    expect(OPTION(5).metric.subtext_lt).not.toContain('5+');
    // …while the reference table names the band "5+ asmenys".
    const ref = container.querySelector('[data-block2="household-reference"]')!;
    expect(ref.textContent).toContain('5+ asmenys');
  });

  it('swaps the §7.5/§7.6 family prose on selection', () => {
    const { container } = render(<Harness />);
    const note = () => container.querySelector('[data-block2="family-note"]');
    const wni = () => container.querySelector('[data-block2="whats-not-included"]');
    // Default: the served OFF variants.
    expect(note()!.textContent).toBe(MOCK_EXISTING.block2!.explanation!.family_note_lt);
    expect(wni()!.textContent).toBe(MOCK_EXISTING.block2!.info_box!.whats_not_included_lt);

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(note()!.textContent).toBe(OPTION(2).explanation_lt);
    expect(wni()!.textContent).toBe(OPTION(2).whats_not_included_lt);
  });

  it('renders no selector and no family prose for a legacy/degraded payload', () => {
    // Pre-B2-14 stored reports (and degraded ones) lack the new keys — the
    // section must render exactly the old static default.
    const legacy = {
      ...MOCK_EXISTING.block2!,
      standard_occupancy: undefined,
      household_modelling: undefined,
      explanation: {
        heading_lt: MOCK_EXISTING.block2!.explanation!.heading_lt,
        body_lt: MOCK_EXISTING.block2!.explanation!.body_lt,
      },
      info_box: {
        heading_lt: MOCK_EXISTING.block2!.info_box!.heading_lt,
        vat_lt: MOCK_EXISTING.block2!.info_box!.vat_lt,
        escalation_lt: MOCK_EXISTING.block2!.info_box!.escalation_lt,
        disclosure_lt: MOCK_EXISTING.block2!.info_box!.disclosure_lt,
      },
    };
    const { container } = render(<Harness block2={legacy} />);
    expect(container.querySelector('[data-block2="household-selector"]')).toBeNull();
    expect(container.querySelector('[data-block2="family-note"]')).toBeNull();
    expect(container.querySelector('[data-block2="whats-not-included"]')).toBeNull();
    expect(container.querySelector('[data-block2="disclosure-box"]')).toBeNull();
    expect(
      screen.getByText(`~€${MOCK_EXISTING.block2!.metric!.eur_month}`),
    ).toBeInTheDocument();
    // The static reference table still renders.
    expect(container.querySelector('[data-block2="household-reference"]')).not.toBeNull();
  });
});

// ─── B2-16: the €-bill conversion note (R9) ─────────────────────────────────

describe('bill_note_lt (B2-16 R9)', () => {
  it('renders the served note in the info box when present', () => {
    const billNote =
      'Pastaba: jūsų pateikta € suma perskaičiuota į energijos kiekį pagal '
      + 'dabartinį tarifą; tarifai atnaujinami pagal dokumentuotą grafiką, '
      + 'todėl pasikeitus tarifui išvestinis kiekis gali nežymiai kisti.';
    const block2 = {
      ...MOCK_EXISTING.block2!,
      info_box: { ...MOCK_EXISTING.block2!.info_box!, bill_note_lt: billNote },
    };
    const { container } = render(<Block2Section block2={block2} />);
    const note = container.querySelector('[data-block2="bill-note"]');
    expect(note).not.toBeNull();
    expect(note!.textContent).toBe(billNote);
  });

  it('renders no note element when the report is not €-bills mode', () => {
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);
    expect(container.querySelector('[data-block2="bill-note"]')).toBeNull();
  });
});
