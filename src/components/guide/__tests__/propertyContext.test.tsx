/**
 * B2-17 (R2): the six-field Block-2 context enrichment — the first tests
 * of extractReportData()/buildPropertyContext() (previously untested).
 *
 * The scrape tests render the REAL report components (the mock IS the
 * served contract) and read through the real DOM — crossing the
 * render → scrape boundary, not asserting a mock against itself.
 */
import { describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { Block2Section } from '../../report/Block2Section';
import { MOCK_EXISTING } from '../../report/mockReportData';
import { extractReportData } from '../tours/reportTour';
import { buildPropertyContext } from '../AIGuide';
import ReportViewer from '../../ReportViewer';

const BLOCK2 = MOCK_EXISTING.block2!;

function Harness({ block2 = BLOCK2 }: { block2?: typeof MOCK_EXISTING.block2 }) {
  const [size, setSize] = useState<number | null>(null);
  return (
    <Block2Section block2={block2} householdSize={size} onHouseholdSizeChange={setSize} />
  );
}

describe('extractReportData — Block 2 fields (B2-17 R2)', () => {
  it('scrapes metric, carrier and confidence from the rendered section', () => {
    render(<Harness />);
    const data = extractReportData();
    expect(data.energyMetric).toMatch(/^~€\d+\/mėn\.$/);
    expect(data.energyCarrier).toBe(BLOCK2.breakdown!.rows[0].label_lt);
    expect(data.energyConfidence).toBe(BLOCK2.confidence_text_lt);
    expect(data.energyConfidence).not.toMatch(/ℹ️/);
  });

  it('family state: selector present + nothing selected → null; selected → size + personalised total', () => {
    render(<Harness />);
    expect(extractReportData().householdSelection).toBeNull();

    const group = screen.getByRole('group', { name: 'Namų ūkio dydis' });
    fireEvent.click(group.querySelectorAll('button')[2]); // size 3
    const sel = extractReportData().householdSelection;
    expect(sel).not.toBeNull();
    expect(sel!.size).toBe('3');
    expect(sel!.totalMonth).toMatch(/^€\d+/);
  });

  it('measured basis + solar note read their served hooks; absent → flag off, note null', () => {
    render(<Harness />);
    let data = extractReportData();
    expect(data.measuredBasis).toBe(false);
    expect(data.solarNote).toBeNull();
    cleanup();

    const billsSolar = {
      ...BLOCK2,
      info_box: {
        ...BLOCK2.info_box!,
        bill_note_lt: 'Pastaba: jūsų pateikta € suma perskaičiuota…',
        solar_note_lt: 'Objekte įrengti saulės kolektoriai (saulės šilumos sistema) — …',
      },
    };
    render(<Harness block2={billsSolar} />);
    data = extractReportData();
    expect(data.measuredBasis).toBe(true);
    expect(data.solarNote).toContain('saulės kolektoriai');
  });

  it('no Block 2 on the page → every field silent (render-safe)', () => {
    document.body.innerHTML = '<div />';
    const data = extractReportData();
    expect(data.energyMetric).toBeNull();
    expect(data.energyCarrier).toBeNull();
    expect(data.energyConfidence).toBeNull();
    expect(data.householdSelection).toBeUndefined();
    expect(data.measuredBasis).toBe(false);
    expect(data.solarNote).toBeNull();
  });
});

describe('buildPropertyContext — the packet (B2-17 R2)', () => {
  it('carries the six lines with their LT labels; household line reports non-selection', () => {
    render(<Harness />);
    const ctx = buildPropertyContext()!;
    expect(ctx).toMatch(/Energijos kaina: ~€\d+\/mėn\./);
    expect(ctx).toContain(`Šildymo būdas: ${BLOCK2.breakdown!.rows[0].label_lt}`);
    expect(ctx).toContain('Kainos įverčio patikimumas:');
    expect(ctx).toContain('Namų ūkio dydis: nepasirinktas');
    // no bill / no solar in the default mock → those lines absent
    expect(ctx).not.toContain('Skaičiavimo pagrindas');
    expect(ctx).not.toContain('Saulės kolektoriai');
  });

  it('selected household → the personalised line', () => {
    render(<Harness />);
    const group = screen.getByRole('group', { name: 'Namų ūkio dydis' });
    fireEvent.click(group.querySelectorAll('button')[2]);
    const ctx = buildPropertyContext()!;
    expect(ctx).toMatch(/Namų ūkio dydis: 3 asmenys \(pritaikyta suma €\d+\/mėn\.\)/);
  });

  it('dedupe (R2): the Block-8 negotiation angles appear exactly once', () => {
    document.body.innerHTML = `
      <div data-guide="block8">
        <p data-block8="intro">Intro</p>
        <ul data-block8="negotiation-angles"><li>Kampas A</li><li>Kampas B</li></ul>
      </div>`;
    const ctx = buildPropertyContext()!;
    expect(ctx.match(/derybų kampai/g)!.length).toBe(1);
    expect(ctx.match(/Kampas A/g)!.length).toBe(1);
  });

  it('no household selector in the DOM (non-residential shape) → no household line', () => {
    const nonResidential = { ...BLOCK2, household_modelling: undefined };
    render(<Harness block2={nonResidential} />);
    const ctx = buildPropertyContext()!;
    expect(ctx).not.toContain('Namų ūkio dydis');
    expect(ctx).toContain('Energijos kaina:');
  });
});

describe('locked preview regression (B2-17 item 6, frontend half)', () => {
  it('the locked-blocks preview starts at Block 3 (Block 2 is live)', () => {
    window.history.pushState({}, '', '/report/dev-existing');
    render(<ReportViewer />);
    const locked = document.querySelector('[data-guide="locked-blocks"]')!;
    expect(locked.textContent).toContain('3) 10 metų išlaidos');
    expect(locked.textContent).not.toContain('2)');
  });
});
