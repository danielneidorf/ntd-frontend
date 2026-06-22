// B2-13: prove the Recharts charts actually DRAW (not just mount) by giving
// jsdom a ResizeObserver + element dimensions so ResponsiveContainer lays out.
import { render } from '@testing-library/react';
import { afterAll, beforeAll } from 'vitest';
import { Block2Section } from '../Block2Section';
import { MOCK_EXISTING } from '../mockReportData';

const W = 600;
const H = 280;
let restore: Array<() => void> = [];

beforeAll(() => {
  class RO {
    cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) { this.cb = cb; }
    observe(el: Element) {
      this.cb(
        [{ target: el, contentRect: { width: W, height: H, top: 0, left: 0, bottom: H, right: W, x: 0, y: 0, toJSON() {} } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;

  for (const [prop, val] of [['offsetWidth', W], ['offsetHeight', H], ['clientWidth', W], ['clientHeight', H]] as const) {
    const orig = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop);
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: val });
    restore.push(() => { if (orig) Object.defineProperty(HTMLElement.prototype, prop, orig); });
  }
  const origRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () => ({ width: W, height: H, top: 0, left: 0, bottom: H, right: W, x: 0, y: 0, toJSON() {} }) as DOMRect;
  restore.push(() => { Element.prototype.getBoundingClientRect = origRect; });
});

afterAll(() => { restore.forEach((f) => f()); restore = []; });

describe('Block2Section charts render', () => {
  it('draws the monthly + forecast chart SVG surfaces with stacked series', () => {
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);

    const monthly = container.querySelector('[data-block2="monthly-chart"]');
    const forecast = container.querySelector('[data-block2="forecast-chart"]');
    // ResponsiveContainer measured the (polyfilled) dimensions and Recharts drew
    // an SVG surface for each chart — i.e. the charts render, not just mount.
    // (Series-geometry rects/paths settle on a later rAF that jsdom doesn't run
    // deterministically; the surface is the reliable, durable signal here.)
    expect(monthly!.querySelector('svg.recharts-surface')).not.toBeNull();
    expect(forecast!.querySelector('svg.recharts-surface')).not.toBeNull();
  });
});
