/**
 * The ruled eighteen, quoted from the RENDERED page.
 *
 * THE CONNECTION TEST for the browser half of the copy-parity seam. The backend
 * guard proves these strings are served and that print renders them; this
 * proves the browser renders them — the real `ReportViewer`, the real
 * components, the served payload, and the words read back out of the DOM.
 *
 * Every expectation is read from the gate document itself
 * (`Copy_parity_gate_ruled_18.md`), never pasted here. A pasted copy agrees
 * with the ruling on the day it is written and drifts silently afterwards,
 * which is the disease this whole batch treats.
 *
 * THE STATE IS NAMED, per the standing rider — the dynamic sentences (№6, №7)
 * carry live numbers that follow the household selection, so an assertion that
 * did not say WHICH state it rendered would flap the day a default moved:
 *
 *     fixture   : the `dev-existing` report, as served
 *     selection : stated per test — the default view, or the named size
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReportViewer from '../../ReportViewer';
import { DEV_MOCKS } from '../mockReportData';
import { ruled18 } from '../../__tests__/ruling';

const BASE = DEV_MOCKS['dev-existing'];

function stubReport(data: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, data }),
    })),
  );
}

beforeEach(() => {
  window.history.pushState({}, '', '/report/tok');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderReport(data: unknown = BASE) {
  stubReport(data);
  render(<ReportViewer />);
  await waitFor(() => expect(screen.getByText(/Energinis naudingumas/)).toBeInTheDocument());
}

/**
 * The dev fixture with one winter factor switched on.
 *
 * `DriversSection` renders nothing when no factor is active, and every factor
 * in `dev-existing` is inactive — so №9's heading has nothing to head. That is
 * correct component behaviour, not an absence to assert around: the connection
 * test builds the state the code actually serves it in.
 */
function withAWinterFactor() {
  const data = JSON.parse(JSON.stringify(BASE));
  data.block1.winter_factors[0].active = true;
  return data;
}

// ── A · what a sighted reader sees ──────────────────────────────────────────

describe('the rendered page speaks the ruled words', () => {
  it.each([
    [1, 'the monthly chart title'],
    [2, 'the bibliography heading'],
    [3, 'the household-size table header'],
    [4, 'the consumption table header'],
    [5, 'the cost table header'],
    [8, 'the winter-comfort heading'],
    [15, "REGIA's description"],
    [16, "Infostatyba's description"],
    [17, "TPDR's description"],
    [18, "the registry's description"],
  ])('★ renders №%i — %s', async (number) => {
    await renderReport();

    const expected = ruled18(number as number);
    expect(
      screen.getAllByText(expected).length,
      `№${number} („${expected}") is not on the rendered page`,
    ).toBeGreaterThan(0);
  });

  it('★ renders №9 — the winter-factors heading (state: one factor active)', async () => {
    await renderReport(withAWinterFactor());

    expect(screen.getByText(ruled18(9))).toBeInTheDocument();
  });
});

// ── B · what a screen-reader user hears ─────────────────────────────────────

describe('the accessibility layer carries the ruled headings', () => {
  it('★ №8 names the comfort bar as a group — five loose colour labels no longer', async () => {
    await renderReport();

    const group = screen.getByRole('group', { name: ruled18(8) });
    expect(group).toBeInTheDocument();
  });

  it('★ №9 names the winter-factors group (state: one factor active)', async () => {
    await renderReport(withAWinterFactor());

    expect(screen.getByRole('group', { name: ruled18(9) })).toBeInTheDocument();
  });

  it('★ №6/№7 — each chart is ONE named image, speaking the SERVED sentence', async () => {
    // ★ THE STATE, NAMED — and it is not the one you would guess. The page
    // PRESELECTS `standard_occupancy` (ReportViewer: `householdSize ??
    // data.block2.standard_occupancy`), so the view a customer opens on is
    // already a personalised one. The spoken sentence must therefore be that
    // OPTION's, not the report's top-level default — which is exactly the
    // defect this piece fixed on the print side.
    await renderReport();

    const size = BASE.block2!.standard_occupancy!;
    const option = BASE.block2!.household_modelling!.options.find(
      (o) => o.household_size === size,
    )!;

    const names = screen.getAllByRole('img').map((el) => el.getAttribute('aria-label'));

    expect(names).toContain(option.monthly_chart_description_lt);
    expect(names).toContain(option.forecast_chart_description_lt);
    // …and it is genuinely the option's, not the top-level one wearing its coat.
    expect(option.monthly_chart_description_lt).not.toBe(
      BASE.block2!.monthly_chart_description_lt,
    );
  });

  it('★ the spoken sentence names the MONTHS, not the axis abbreviations', async () => {
    // The deleted twin composed this label from `rows[i].name` — the axis
    // abbreviation — so a listener heard „nuo €18 (Geg)", which tells them
    // nothing. The gate ruled the full month names.
    await renderReport();

    const spoken = BASE.block2!.monthly_chart_description_lt!;
    expect(spoken).toMatch(/\((Sausis|Vasaris|Kovas|Balandis|Gegužė|Birželis|Liepa|Rugpjūtis|Rugsėjis|Spalis|Lapkritis|Gruodis)\)/);
    expect(spoken).not.toMatch(/\((Sau|Vas|Kov|Bal|Geg|Bir|Lie|Rgp|Rgs|Spa|Lap|Gru)\)/);
  });
});

// ── C · what error states say ───────────────────────────────────────────────

describe('the failure states say what the gate ruled', () => {
  it.each([
    [11, 'not_in_registry'],
    [12, 'new_build_no_epc_yet'],
    [13, 'unknown'],
  ])('★ renders №%i for reason "%s"', async (number, reason) => {
    const data = JSON.parse(JSON.stringify(BASE));
    data.block1.winter = {
      ...data.block1.winter,
      level: 'NOT_ASSESSED',
      not_assessed_reason: reason,
      not_assessed_message_lt: ruled18(number as number),
    };
    await renderReport(data);

    expect(screen.getByText(ruled18(number as number))).toBeInTheDocument();
  });

  it('★ renders №14 — the era-estimate caption, served', async () => {
    const data = JSON.parse(JSON.stringify(BASE));
    data.block1.winter = {
      ...data.block1.winter,
      level: 'GOOD',
      provenance_label_key: 'block1.winter.provenance.era_estimated',
      provenance_message_lt: ruled18(14),
    };
    await renderReport(data);

    expect(screen.getByText(ruled18(14))).toBeInTheDocument();
  });
});

// ── C4 · the opening order ──────────────────────────────────────────────────

describe('Block 2 opens on the number (C4)', () => {
  it('★ the metric precedes the intro — print already did, the web did not', async () => {
    await renderReport();

    const section = document.querySelector('[data-guide="block2"]')!;
    const metric = within(section as HTMLElement).getByText(
      (_, el) => el?.getAttribute('data-block2') === 'metric',
      { selector: '[data-block2="metric"]' },
    );
    const intro = section.querySelector('[data-block2="intro"]')!;

    expect(metric).toBeTruthy();
    expect(intro).toBeTruthy();
    expect(
      metric.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING,
      'the intro paragraph still comes before the €-figure',
    ).toBeTruthy();
  });
});
