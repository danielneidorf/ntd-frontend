// 2026-07-29 unification: the „Šaltiniai" list is single-sourced from the
// backend for BOTH surfaces. Citations renders the SERVED Block-1 bibliography
// (data.citations) followed by the SERVED Block-2 lines — it authors no LT copy.
// These tests read the served strings from the mock, never a literal.
import { render, screen } from '@testing-library/react';
import Citations from '../Citations';
import { MOCK_EXISTING } from '../mockReportData';

const BLOCK1 = MOCK_EXISTING.citations ?? [];

describe('Citations', () => {
  it('renders the served Block 1 bibliography then the served Block 2 lines', () => {
    const b2 = MOCK_EXISTING.block2!;
    const block2 = [
      ...b2.citations_lt!,
      ...b2.household_modelling!.citation_lt.lines_lt,
    ];
    render(<Citations block1Citations={BLOCK1} block2CitationsLt={block2} />);

    // A Block 1 entry (the NTR bibliography head) ...
    expect(
      screen.getByText((t) => t.includes('Nekilnojamojo turto registras')),
    ).toBeInTheDocument();
    // ... a served Block 2 tariff entry (present in the mock, not a literal —
    // the regenerated capture's fixture decides the operator) ...
    const tariff = b2.citations_lt!.find((c) =>
      c.includes('VALSTYBINĖ ENERGETIKOS REGULIAVIMO TARYBA'),
    )!;
    expect(tariff).toBeTruthy();
    expect(
      screen.getByText((t) => t.includes('centralizuotai tiekiamos šilumos')),
    ).toBeInTheDocument();
    // ... and the 👥 household line with the corrected nrg_bal_c provenance.
    expect(screen.getByText(/nrg_bal_c/)).toBeInTheDocument();
  });

  it('renders only Block 1 citations when no Block 2 lines are passed', () => {
    render(<Citations block1Citations={BLOCK1} />);
    expect(screen.queryByText(/nrg_bal_c/)).toBeNull();
    // The Block 1 NTR entry is still there.
    expect(
      screen.getByText((t) => t.includes('Nekilnojamojo turto registras')),
    ).toBeInTheDocument();
  });

  it('numbers the combined list continuously (Block 1 then Block 2, one flat list)', () => {
    const b2 = MOCK_EXISTING.block2!;
    render(<Citations block1Citations={BLOCK1} block2CitationsLt={b2.citations_lt!} />);
    // One flat numbered bibliography: [1] is a Block 1 entry, and the final
    // index equals block1 + block2 with no gap or reset between the two.
    const total = BLOCK1.length + b2.citations_lt!.length;
    expect(screen.getByText('[1]')).toBeInTheDocument();
    expect(screen.getByText(`[${total}]`)).toBeInTheDocument();
  });
});
