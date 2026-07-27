// B2-13: Block 2 (energy costs) section tests.
// B2-14: + household-size selector / option-switching tests. The mock IS the
// served contract (derived from a real _build_report_data run), so asserting
// against mock option values asserts the component renders served data.
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Block2Section, HOUSEHOLD_REFERENCE_CAPTION } from '../Block2Section';
import { INFO_SECTION_BODY } from '../InfoSection';
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
      'info-section',
      'confidence',
      'household-reference',
    ]) {
      expect(section!.querySelector(`[data-block2="${name}"]`)).not.toBeNull();
    }
    // Card order (2026-07-27): the info section is the card's quiet footer —
    // after the forecast chart AND the explanation, with the confidence line last
    // (content first, meta last; matching Block 1 + the PDF's existing order).
    const at = (name: string) => section!.querySelector(`[data-block2="${name}"]`)!;
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(at('forecast-chart'), at('info-section'))).toBe(true);
    expect(follows(at('explanation'), at('info-section'))).toBe(true);
    expect(follows(at('info-section'), at('confidence'))).toBe(true);
    // Backend-rounded headline + a breakdown total rendered verbatim.
    expect(
      screen.getByText(`~€${MOCK_EXISTING.block2!.metric!.eur_month}`),
    ).toBeInTheDocument();
    expect(screen.getByText('Ką tai reiškia praktiškai?')).toBeInTheDocument();
  });

  it('the reference table lives INSIDE the merged section, as its last element (ruling 2026-07-25)', () => {
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);
    // Exactly one reference table, and it is inside the collapsible section …
    const tables = container.querySelectorAll('[data-block2="household-reference"]');
    expect(tables.length).toBe(1);
    const table = tables[0];
    const section = table.closest('[data-info-section]');
    expect(section).not.toBeNull(); // membership — not a standalone block outside
    // … after the prose items (it is the section's last element) …
    const items = section!.querySelector('[data-block2="info-section"]')!;
    expect(
      items.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // … under the one-origin caption.
    expect(section!.textContent).toContain(HOUSEHOLD_REFERENCE_CAPTION);
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

  // ─── breakdown € column order: monthly leads, yearly second ──────────────

  it('orders the breakdown € columns monthly-then-yearly, header and cells aligned', () => {
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);
    const table = container.querySelector('[data-block2="breakdown"]')!;
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent);
    // Header order — the monthly column (the report's headline unit) leads.
    expect(headers[1]).toContain('mėnesį');
    expect(headers[2]).toContain('metus');
    // Cell alignment on a row where month != year in distinct magnitudes, so a
    // transposition can't slip past by symmetric values (heating: €61 vs €729).
    const heating = MOCK_EXISTING.block2!.breakdown!.rows[0];
    expect(heating.eur_month).not.toBe(heating.eur_year);
    const cells = Array.from(
      table.querySelector('tbody tr')!.querySelectorAll('td'),
    ).map((td) => td.textContent);
    expect(cells[1]).toBe(`€${heating.eur_month}`); // column 1 = monthly
    expect(cells[2]).toBe(`€${heating.eur_year}`); // column 2 = yearly
  });

  it('keeps monthly-then-yearly in the family-selected table', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    const table = container.querySelector('[data-block2="breakdown"]')!;
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent);
    expect(headers[1]).toContain('mėnesį');
    expect(headers[2]).toContain('metus');
    // The personalised rows follow the same order — same distinct-magnitude row.
    const row = OPTION(3).breakdown.rows[0];
    expect(row.eur_month).not.toBe(row.eur_year);
    const cells = Array.from(
      table.querySelector('tbody tr')!.querySelectorAll('td'),
    ).map((td) => td.textContent);
    expect(cells[1]).toBe(`€${row.eur_month}`);
    expect(cells[2]).toBe(`€${row.eur_year}`);
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

  // ─── B2-14 relayout: the selector lives inside the hero band's right side ─

  it('nests the selector inside the hero metric band (not a sibling below it)', () => {
    const { container } = render(<Harness />);
    const metric = container.querySelector('[data-block2="metric"]');
    expect(metric).not.toBeNull();
    // The relayout moved the selector into the price band's right column.
    expect(metric!.querySelector('[data-block2="household-selector"]')).not.toBeNull();
  });

  it('renders the selector as a distinct white panel (inset card tokens)', () => {
    const { container } = render(<Harness />);
    const selector = container.querySelector('[data-block2="household-selector"]')!;
    // A distinct control panel, not a bare region on the slate band: it carries
    // the report's inset-panel tokens (white ground + border + rounded), which
    // the bg-slate-50 band it sits inside does not.
    const cls = selector.className;
    expect(cls).toContain('bg-white');
    expect(cls).toContain('border');
    expect(cls).toContain('rounded');
  });

  it('places the caption above the buttons as the panel label', () => {
    const { container } = render(<Harness />);
    const selector = container.querySelector('[data-block2="household-selector"]')!;
    const caption = Array.from(selector.querySelectorAll('p')).find((p) =>
      p.textContent?.includes(HM.selector_caption_lt),
    )!;
    const firstButton = selector.querySelector('button')!;
    // Caption precedes the buttons in DOM order — label-then-controls.
    expect(
      caption.compareDocumentPosition(firstButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('drops the ↑ glyph while keeping the served caption verbatim', () => {
    const { container } = render(<Harness />);
    const selector = container.querySelector('[data-block2="household-selector"]')!;
    // The arrow used to point up at the price; beside it, it points at nothing.
    // It was a frontend glyph, never part of the served string — so the copy is
    // unchanged and the arrow is simply gone.
    expect(selector.textContent).toContain(HM.selector_caption_lt);
    expect(selector.textContent).not.toContain('↑');
  });

  it('keeps the hero full-width — no empty right column — when no selector is served', () => {
    // Non-residential ready: priced, but the backend serves no household model.
    const block2 = { ...MOCK_EXISTING.block2, household_modelling: undefined };
    const { container } = render(<Block2Section block2={block2} />);
    const metric = container.querySelector('[data-block2="metric"]');
    expect(metric).not.toBeNull();
    // Price still renders…
    expect(metric!.textContent).toContain(`~€${MOCK_EXISTING.block2!.metric!.eur_month}`);
    // …and the band has a SINGLE flex child (the price column) — not an empty
    // right column where the selector would have been.
    expect(metric!.querySelector('[data-block2="household-selector"]')).toBeNull();
    expect(metric!.children.length).toBe(1);
  });

  it('applies the filled house-teal tokens to the selected button on press', () => {
    render(<Harness />);
    const btn3 = screen.getByRole('button', { name: '3' });
    fireEvent.click(btn3);

    expect(btn3.getAttribute('aria-pressed')).toBe('true');
    // The filled state's tokens are on the className. (jsdom can't resolve
    // Tailwind to a computed colour — the rgb(13,115,119) fill is verified on
    // the bench; this guards that the conditional keeps emitting them.)
    expect(btn3.className).toContain('bg-[#0D7377]');
    expect(btn3.className).toContain('text-white');
    // …and no color transition, so the fill is instant and can never be sampled
    // mid-fade as an unfilled (white) button — the defect this fix closes.
    expect(btn3.className).not.toContain('transition-colors');
  });

  it('changes the headline on selection; the active size cannot be unselected', () => {
    // Ruling 2026-07-23: no bare building-only state — the customer can change
    // the size but not toggle a selection off.
    render(<Harness />);
    const btn2 = screen.getByRole('button', { name: '2' });

    fireEvent.click(btn2);
    expect(screen.getByText(`~€${OPTION(2).metric.eur_month}`)).toBeInTheDocument();
    expect(screen.getByText(OPTION(2).metric.subtext_lt)).toBeInTheDocument();

    fireEvent.click(btn2); // clicking the active size is a no-op — no toggle-off
    expect(screen.getByText(`~€${OPTION(2).metric.eur_month}`)).toBeInTheDocument();
    // the building-only base headline is NOT reachable by clicking
    expect(
      screen.queryByText(MOCK_EXISTING.block2!.metric!.subtext_lt),
    ).not.toBeInTheDocument();

    // …but changing to a different size still works
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByText(`~€${OPTION(1).metric.eur_month}`)).toBeInTheDocument();
  });

  it('renders the standard-household total when preselected to the standard size', () => {
    // Ruling 2026-07-23: ReportViewer preselects the served standard occupancy,
    // so the report opens on the standard-household total (not the €78 base).
    const std = MOCK_EXISTING.block2!.standard_occupancy!;
    const { container } = render(
      <Block2Section block2={MOCK_EXISTING.block2} householdSize={std} />,
    );
    expect(screen.getByText(`~€${OPTION(std).metric.eur_month}`)).toBeInTheDocument();
    expect(container.textContent).toContain(`${std} asmenų namų ūkis`);
    // the appliance row is present by default (household view, not building-only)
    expect(
      container.querySelector('[data-block2="breakdown"]')!.textContent,
    ).toContain('Buitinė elektra');
  });

  it('the size-1 total falls below the standard-household default (intuition pin)', () => {
    // The whole point of the ruling: picking the smallest household is now below
    // the default, not above it (the default already includes appliances).
    const std = MOCK_EXISTING.block2!.standard_occupancy!;
    expect(OPTION(1).metric.eur_month).toBeLessThan(OPTION(std).metric.eur_month);
  });

  it('the selector caption invites personalisation, not "see the total"', () => {
    const { container } = render(<Harness />);
    const selector = container.querySelector('[data-block2="household-selector"]')!;
    expect(selector.textContent).toContain('Pritaikykite pagal savo namų ūkio dydį');
    expect(selector.textContent).not.toContain('kad pamatytumėte');
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

  it('the merged info section is one collapsible, collapsed by default', () => {
    // Ruling 2026-07-25: the data-sources box and the assumptions box merged
    // into ONE „Kokia informacija remiamės?" section, collapsed on load. The old
    // titles are extinct. (jsdom can't measure the max-height animation — the
    // pin is on aria-expanded, the state it follows.)
    const { container } = render(<Harness />);
    const section = container.querySelector('[data-block2="info-section"]')!;
    expect(section).not.toBeNull();
    const toggle = section.closest('[data-info-section]')!.querySelector('button')!;
    expect(toggle.textContent).toContain('Kokia informacija remiamės?');
    expect(toggle.textContent).not.toContain('Duomenų šaltiniai');
    expect(toggle.textContent).not.toContain('Iš ko remiamės');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // The data-sources explainer and the hot-water note live inside it.
    expect(section.textContent).toContain('Šis vertinimas sujungia');
    expect(section.textContent).toContain('rodomos atskirai');
  });

  it('the confidence line stays always-visible, outside the collapsible section', () => {
    // §2.5 / §256-258: a trust disclosure must never hide behind the section's
    // collapse. It renders as its own line, with the section collapsed on load.
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);
    const conf = container.querySelector('[data-block2="confidence"]')!;
    expect(conf).not.toBeNull();
    expect(conf.textContent).toContain(MOCK_EXISTING.block2!.confidence_text_lt!);
    // ...and it is NOT inside the collapsible info section.
    expect(conf.closest('[data-info-section]')).toBeNull();
    // ...and it sits AFTER the section (its card-footer position, 2026-07-27) —
    // always-visible disclosure below the collapsed box, never swept inside it.
    const infoSection = container.querySelector('[data-block2="info-section"]')!;
    expect(
      infoSection.compareDocumentPosition(conf) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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

  it('swaps the §7.5 family prose on selection; the info section is size-independent', () => {
    const { container } = render(<Harness />);
    const note = () => container.querySelector('[data-block2="family-note"]');
    const section = () => container.querySelector('[data-block2="info-section"]')!;
    // Default: the served OFF family variant.
    expect(note()!.textContent).toBe(MOCK_EXISTING.block2!.explanation!.family_note_lt);
    const sectionBefore = section().textContent;

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    // The family prose swaps to the selected size…
    expect(note()!.textContent).toBe(OPTION(2).explanation_lt);
    // …but the info section is now SIZE-INDEPENDENT (dedup 2026-07-27): it carries
    // no size-specific scope line and does not change with the selection.
    expect(section().textContent).toBe(sectionBefore);
    expect(section().textContent).not.toMatch(/\d+\s+asmen/);
  });

  it('routes its body through the shared INFO_SECTION_BODY token (one origin)', () => {
    // The paragraph body style lives once (InfoSection.tsx) and both blocks read
    // it (Block 1's basis box + this section). Routing Block 2 through the token
    // is a no-op — the rendered className stays byte-identical to the old inline
    // string — and this pin guards that the two can't silently drift.
    const { container } = render(<Harness />);
    const section = container.querySelector('[data-block2="info-section"]')!;
    expect(section.className).toContain(INFO_SECTION_BODY);
    expect(section.className).toBe(`${INFO_SECTION_BODY} mt-3 px-1`);
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
      // A degraded payload's merged section is assumptions-only (no modelling →
      // no data-sources body); still one section, one title.
      info_section: {
        title_lt: MOCK_EXISTING.block2!.info_section!.title_lt,
        items_lt: MOCK_EXISTING.block2!.info_section!.items_lt.slice(0, 3),
      },
    };
    const { container } = render(<Harness block2={legacy} />);
    expect(container.querySelector('[data-block2="household-selector"]')).toBeNull();
    expect(container.querySelector('[data-block2="family-note"]')).toBeNull();
    // The old floating idioms are gone entirely.
    expect(container.querySelector('[data-block2="whats-not-included"]')).toBeNull();
    expect(container.querySelector('[data-block2="disclosure-box"]')).toBeNull();
    expect(container.querySelector('[data-block2="info-box"]')).toBeNull();
    // ...but the merged section still renders (assumptions-only here).
    expect(container.querySelector('[data-block2="info-section"]')).not.toBeNull();
    expect(
      screen.getByText(`~€${MOCK_EXISTING.block2!.metric!.eur_month}`),
    ).toBeInTheDocument();
    // The static reference table still renders — and, in this no-modelling
    // shape too, it lives inside the merged section (the degradation floor,
    // ruling 2026-07-25), directly after the assumptions with no 👥 sub-body.
    const table = container.querySelector('[data-block2="household-reference"]');
    expect(table).not.toBeNull();
    expect(table!.closest('[data-info-section]')).not.toBeNull();
  });
});

// ─── B2-16: the €-bill conversion note (R9) ─────────────────────────────────

describe('bill_note_lt (B2-16 R9)', () => {
  it('renders the served bill note inside the merged info section when present', () => {
    // The bill note is now one item of the backend-composed info_section (it
    // used to be its own <p> in the info box).
    const billNote =
      'Pastaba: jūsų pateikta € suma perskaičiuota į energijos kiekį pagal '
      + 'dabartinį tarifą; tarifai atnaujinami pagal dokumentuotą grafiką, '
      + 'todėl pasikeitus tarifui išvestinis kiekis gali nežymiai kisti.';
    const base = MOCK_EXISTING.block2!;
    const block2 = {
      ...base,
      info_section: {
        title_lt: base.info_section!.title_lt,
        items_lt: [...base.info_section!.items_lt, billNote],
      },
    };
    const { container } = render(<Block2Section block2={block2} />);
    const section = container.querySelector('[data-block2="info-section"]')!;
    expect(section.textContent).toContain(billNote);
  });

  it('the note is absent from the section when the report is not €-bills mode', () => {
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);
    const section = container.querySelector('[data-block2="info-section"]')!;
    expect(section.textContent).not.toContain('perskaičiuota į energijos kiekį');
  });
});


describe('family-on explanation body (report-walk R5, FE half)', () => {
  it('swaps the body to the selected option\'s personalised sentence (and between sizes)', () => {
    const b2 = MOCK_EXISTING.block2!;
    const withBodies = {
      ...b2,
      household_modelling: {
        ...b2.household_modelling!,
        options: b2.household_modelling!.options.map((o) => ({
          ...o,
          body_lt: `PERS-BODY-${o.household_size} — €${o.metric.eur_month} per mėnesį`,
        })),
      },
    };
    render(<Harness block2={withBodies} />);

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText(/PERS-BODY-2/)).toBeInTheDocument();

    // Ruling 2026-07-23: no deselect — changing size swaps to that body; the
    // building-only base body is no longer reachable by clicking.
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByText(/PERS-BODY-3/)).toBeInTheDocument();
    expect(screen.queryByText(/PERS-BODY-2/)).toBeNull();
  });
});
