// B2-13 build-step check: confirm recharts renders under React 19 + jsdom.
import { render } from '@testing-library/react';
import { Bar, BarChart, XAxis } from 'recharts';

describe('recharts smoke', () => {
  it('mounts a chart without throwing', () => {
    const { container } = render(
      <BarChart width={300} height={200} data={[{ name: 'a', v: 1 }, { name: 'b', v: 2 }]}>
        <XAxis dataKey="name" />
        <Bar dataKey="v" />
      </BarChart>,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
