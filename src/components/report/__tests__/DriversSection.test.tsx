// A-next: Block 1 summer-overheating driver tags (DriversSection).
import { render } from '@testing-library/react';
import { DriversSection } from '../../ReportViewer';
import type { ReportData } from '../mockReportData';

type Driver = ReportData['block1']['drivers'][number];

const HIGH_GLAZING: Driver = {
  key: 'high_glazing_driver',
  label_lt: 'Didelė langų dalis',
  explanation_lt:
    'Kai langų plotas didelis, saulėtomis dienomis pro stiklą patenka daug šilumos, todėl patalpos vasarą greičiau ir labiau įšyla.',
  active: true,
  direction: 'increase',
};
const INACTIVE: Driver = {
  key: 'newer_building_driver',
  label_lt: 'Naujesnės statybos pastatas',
  explanation_lt: 'Naujesni pastatai paprastai sandaresni…',
  active: false,
  direction: 'increase',
};

describe('DriversSection', () => {
  it('renders active "increase" drivers as amber ↗ tags with the authored copy + tooltip', () => {
    const { container } = render(<DriversSection drivers={[HIGH_GLAZING, INACTIVE]} />);
    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain('Didelė langų dalis');
    expect(btn!.textContent).toContain('↗'); // increase → ↗
    expect(btn!.className).toContain('amber'); // increase = raises risk = amber, not green
    // Tooltip carries the authored explanation.
    expect(container.textContent).toContain('pro stiklą patenka daug šilumos');
    // Inactive driver is not rendered.
    expect(container.textContent).not.toContain('Naujesnės statybos pastatas');
  });

  it('hides the section when no driver is active', () => {
    const { container } = render(
      <DriversSection drivers={[HIGH_GLAZING, INACTIVE].map((d) => ({ ...d, active: false }))} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders active "decrease" helpers as green ↘ tags under the winter section (two-way)', () => {
    // Driver merge: the winter bar is two-way — a helper (good rating) reduces
    // concern → direction="decrease" → green ↘, the opposite of the summer risk tag.
    const HELPER: Driver = {
      key: 'good_epc',
      label_lt: 'Geras energinis naudingumas',
      explanation_lt:
        'Geras pastato energinis naudingumas reiškia mažesnius šilumos nuostolius, todėl žiemą patalpas lengviau šildyti iki komfortiškos temperatūros, o šildymui reikia mažiau energijos.',
      active: true,
      direction: 'decrease',
    };
    const { container } = render(
      <DriversSection drivers={[HELPER]} title="Žiemos komforto veiksniai" sectionAttr="winter-factors" />,
    );
    const btn = container.querySelector('button');
    expect(btn!.textContent).toContain('Geras energinis naudingumas');
    expect(btn!.textContent).toContain('↘'); // decrease → ↘
    expect(btn!.className).toContain('green'); // helper = reduces concern = green, not amber
    expect(btn!.className).not.toContain('amber');
    // Rendered under the winter-factors section with its own heading.
    expect(container.querySelector('[data-block1="winter-factors"]')).not.toBeNull();
    expect(container.textContent).toContain('Žiemos komforto veiksniai');
    expect(container.textContent).toContain('mažesnius šilumos nuostolius');
  });
});
