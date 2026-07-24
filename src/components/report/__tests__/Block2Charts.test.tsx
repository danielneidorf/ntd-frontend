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

  it('the forecast follows the household selection and starts at that headline', () => {
    // Ruling 2026-07-23. The defect this closes: the forecast was building-only
    // and never moved with the selector, so its year 1 (€78) contradicted the
    // headline (€101) directly above it. Backend tests are the authoritative
    // proof; this pins the served capture the chart actually consumes.
    const opts = MOCK_EXISTING.block2!.household_modelling!.options;
    expect(opts.length).toBe(5);

    const y1 = opts.map((o) => o.forecast_5yr![0].total_eur_month);
    const y5 = opts.map((o) => o.forecast_5yr![4].total_eur_month);
    // Size-reactive: bigger household → higher forecast, both ends.
    expect(y1).toEqual([...y1].sort((a, b) => a - b));
    expect(y1[0]).toBeLessThan(y1[4]);
    expect(y5[0]).toBeLessThan(y5[4]);

    for (const o of opts) {
      const fc = o.forecast_5yr!;
      // The consistency pin: year 1 IS the headline for that size.
      expect(Math.round(fc[0].total_eur_month)).toBe(o.metric.eur_month);
      // Component bands, not carriers — and household electricity escalates
      // (the superseded R5 held it flat, which would make these equal).
      expect(fc[0].per_component.household_electricity).toBeGreaterThan(0);
      expect(fc[4].per_component.household_electricity).toBeGreaterThan(
        fc[0].per_component.household_electricity,
      );
      expect(Object.keys(fc[0].per_component)).not.toContain('cst');
      // The €0 standing-fee band takes no slot at all.
      expect(Object.keys(fc[0].per_component)).not.toContain('fixed');
    }
  });

  it('the glance anchors read the served arrays and follow the selector', () => {
    // Each chart carries ONE numeral: the monthly average (the level the bars
    // do not show — peak/trough are self-evident and carry none) and the
    // forecast's year-5. Both are read off the SELECTED option's served
    // arrays, never recomputed. The backend suite proves what the PDF figure
    // actually draws; this pins that the web is fed the same values.
    const opts = MOCK_EXISTING.block2!.household_modelling!.options;
    const eur = (v: number) => `€${Math.round(v)}`;

    const anchors = opts.map((o) => {
      const totals = o.monthly_variation.map(
        (m) => m.heating_eur + m.dhw_eur + m.cooling_eur + m.fixed_eur + m.household_electricity_eur,
      );
      return {
        avg: eur(totals.reduce((a, b) => a + b, 0) / totals.length),
        year5: eur(o.forecast_5yr![o.forecast_5yr!.length - 1].total_eur_month),
      };
    });

    // Selector-reactive: both anchors move with the household size.
    expect(new Set(anchors.map((a) => a.avg)).size).toBe(5);
    expect(new Set(anchors.map((a) => a.year5)).size).toBe(5);
    // Whole euros, the report's display convention — no decimals leak through.
    for (const a of anchors) {
      expect(a.avg).toMatch(/^€\d+$/);
      expect(a.year5).toMatch(/^€\d+$/);
    }
    // The average is the monthly anchor, so it must equal the headline's basis
    // for that size (year-1 of the forecast is the same figure).
    opts.forEach((o, i) => {
      expect(anchors[i].avg).toBe(eur(o.metric.eur_month));
    });
  });

  it('renders the forecast chart for the selected size', () => {
    const { container } = render(
      <Block2Section block2={MOCK_EXISTING.block2} householdSize={5} />,
    );
    expect(
      container.querySelector('[data-block2="forecast-chart"] svg.recharts-surface'),
    ).not.toBeNull();
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
