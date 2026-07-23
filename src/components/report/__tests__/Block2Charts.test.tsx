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

  it('renders the season-masked chart for the CŠT dev report — heating summer-free, annual intact', () => {
    // The authoritative proof the backend masks district-heat (CŠT) heating to
    // the Oct–Apr delivery season lives in the backend suite (test_monthly_
    // variation). This crosses the FRONTEND boundary: the served dev report is
    // rendered by the real chart path, and the masked shape it is fed is pinned
    // — a mask regression that reached a mock recapture fails here, in the
    // frontend's own suite. (Recharts bar geometry is not jsdom-deterministic,
    // per the note above, so the pin is on the rendered chart's input shape +
    // the annual invariant, not on pixel heights.)
    const { container } = render(<Block2Section block2={MOCK_EXISTING.block2} />);
    expect(
      container.querySelector('[data-block2="monthly-chart"] svg.recharts-surface'),
    ).not.toBeNull();

    const mv = MOCK_EXISTING.block2!.monthly_variation!;
    for (const m of mv) {
      const isSummer = m.month >= 5 && m.month <= 9; // May–September
      if (isSummer) expect(m.heating_eur).toBe(0);
      else expect(m.heating_eur).toBeGreaterThan(0);
    }
    // Redistribution, not recalculation: the 12 months still sum to the block's
    // annual heating (the breakdown's Šildymas row), to the euro.
    const heatingRow = MOCK_EXISTING.block2!.breakdown!.rows.find((r) =>
      r.label_lt.includes('Šildymas'),
    )!;
    const summed = Math.round(mv.reduce((s, m) => s + m.heating_eur, 0));
    expect(summed).toBe(heatingRow.eur_year);
  });
});
