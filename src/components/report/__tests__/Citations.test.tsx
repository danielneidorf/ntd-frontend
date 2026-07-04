// B2-14 (§7.8): the web citations section renders the served Block 2 lines
// in the same numbered list the PDF appends them to ("The PDF and web report
// render the same citations identically").
import { render, screen } from '@testing-library/react';
import Citations from '../Citations';
import { MOCK_EXISTING } from '../mockReportData';

const PROPS = {
  snapshot: MOCK_EXISTING.block1.inputs_snapshot,
  generatedAt: MOCK_EXISTING.generated_at,
  glazingSource: null,
};

describe('Citations', () => {
  it('appends the served Block 2 citations after the Block 1 entries', () => {
    const b2 = MOCK_EXISTING.block2!;
    const withHousehold = [
      ...b2.citations_lt!,
      ...b2.household_modelling!.citation_lt.lines_lt,
    ];
    render(<Citations {...PROPS} block2CitationsLt={withHousehold} />);
    // A tariff citation from the served list…
    expect(screen.getByText(/Kauno energija/)).toBeInTheDocument();
    // …and the 👥 household line with the corrected nrg_bal_c provenance.
    expect(screen.getByText(/nrg_bal_c/)).toBeInTheDocument();
  });

  it('renders only Block 1 citations when no Block 2 lines are passed', () => {
    render(<Citations {...PROPS} />);
    expect(screen.queryByText(/nrg_bal_c/)).toBeNull();
    // The Block 1 baseline citation is still there.
    expect(screen.getByText(/Nekilnojamojo turto registras/)).toBeInTheDocument();
  });
});
