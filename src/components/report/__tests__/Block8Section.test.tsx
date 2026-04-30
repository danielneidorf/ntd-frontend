import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Block8Section } from '../Block8Section';
import type { Block8Data } from '../mockReportData';

const READY_BLOCK8: Block8Data = {
  id: 'recommendations',
  title_lt: '8) Rekomendacijos ir sprendimai',
  status: 'ready',
  data: {
    pattern: 'B',
    scope_prefix: 'Šilumos komforto požiūriu',
    intro_lt: 'Šilumos komforto požiūriu, šis pastatas kelia šildymo iššūkį.',
    viewing_questions_lt: [
      'Paprašykite faktinių šildymo sąskaitų.',
      'Apžiūrėkite izoliaciją ir langų sandarumą.',
    ],
    negotiation_angles_lt: [
      'Šildymo sąnaudos gali būti 10–30 % didesnės nei efektyviame pastate.',
    ],
    forward_note_lt: 'Tikslesnį įvertinimą rasite 2 bloke.',
    caveat_lt: null,
    scope_disclaimer_lt:
      'Šios rekomendacijos apima tik šilumos komforto aspektą.',
  },
};

describe('Block8Section', () => {
  it('renders heading, intro, questions, and angles when status is ready', () => {
    render(<Block8Section block8={READY_BLOCK8} />);

    expect(
      screen.getByRole('heading', { level: 2, name: /Rekomendacijos/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/šis pastatas kelia šildymo iššūkį/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Paprašykite faktinių šildymo sąskaitų/),
    ).toBeInTheDocument();
    expect(screen.getByText(/10–30 %/)).toBeInTheDocument();
    expect(screen.getByText(/Tikslesnį įvertinimą/)).toBeInTheDocument();
  });

  it('renders nothing when status is not_applicable', () => {
    const notApplicable: Block8Data = {
      id: 'recommendations',
      title_lt: '8) Rekomendacijos ir sprendimai',
      status: 'not_applicable',
      data: null,
    };
    const { container } = render(<Block8Section block8={notApplicable} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when block8 is undefined', () => {
    const { container } = render(<Block8Section block8={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the caveat box when caveat_lt is present', () => {
    const withCaveat: Block8Data = {
      ...READY_BLOCK8,
      data: {
        ...READY_BLOCK8.data!,
        caveat_lt:
          'Šios rekomendacijos remiasi ribotais duomenimis (EPC trūksta).',
      },
    };
    render(<Block8Section block8={withCaveat} />);
    expect(screen.getByText(/ribotais duomenimis/)).toBeInTheDocument();
  });

  it('exposes data-guide and data-block8 attributes for AI guide scraping', () => {
    const { container } = render(<Block8Section block8={READY_BLOCK8} />);
    const section = container.querySelector('[data-guide="block8"]');
    expect(section).not.toBeNull();
    expect(section!.querySelector('[data-block8="intro"]')).not.toBeNull();
    expect(
      section!.querySelector('[data-block8="viewing-questions"]'),
    ).not.toBeNull();
    expect(
      section!.querySelector('[data-block8="negotiation-angles"]'),
    ).not.toBeNull();
  });
});
