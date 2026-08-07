/**
 * G2 Piece 2 — THE CONNECTION TEST for the historical-certificate listing.
 *
 * THE SEAM: backend serializer → served payload → real `ReportViewer` → DOM.
 * The backend half is proven elsewhere (`report_access_service.py:484` puts the
 * object on the wire; `domain/block1_contract.py` builds it and the backend's
 * own guards assert its sentences equal the ruling). What was never proven, and
 * what this file proves, is that the browser renders it — until 2026-08-06
 * nothing in `src/` read the field, so a customer whose building has certificate
 * history saw it only if they opened the PDF.
 *
 * EXPECTATIONS COME FROM THE RULING DOCUMENT through the one cross-repo loader,
 * never pasted, and never asserted against the code that produces them.
 *
 * FIXTURES ARE WIRE-TRUE. The figures are the ruled examples' own values, and
 * `label_lt` is composed the way the producer composes it — the ruled base plus
 * the dynamic „, YYYY m." — rather than typed out. THE STATE IS NAMED per the
 * standing rider: each test says which year and class it drove.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReportViewer from '../../ReportViewer';
import { DEV_MOCKS } from '../mockReportData';
import { ruled } from '../../__tests__/ruling';

const BASE = DEV_MOCKS['dev-existing'];

/** Print heads this block with it; the web must never grow it. R-G2-1. */
const PRINT_ONLY_HEADING = 'Kitas šio objekto sertifikatas';

function stubReport(data: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, data }) })),
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

/** `label_lt` as the backend composes it: ruled base + the dynamic year. */
function labelFor(rulingNumber: 14 | 15, year: string) {
  return `${ruled(rulingNumber)}, ${year} m.`;
}

/** The served payload with a secondary certificate (and optionally a sentence). */
function servedWith(
  certificate: Record<string, unknown> | null,
  message: string | null = null,
) {
  const data = JSON.parse(JSON.stringify(BASE));
  data.block1.secondary_certificate = certificate;
  data.block1.upload_not_used_message_lt = message;
  return data;
}

/** Wire-true: all seven served keys, not only the four the component reads. */
const IMPROVING = {
  source: 'register',
  energy_class: 'D',
  kwhm2_year: 145,
  issued: '2015',
  cert_nr: 'KG-0500-11111',
  label_lt: labelFor(14, '2015'),
  comparison_lt: ruled(16),
};

const WORSENING = {
  source: 'upload',
  energy_class: 'B',
  kwhm2_year: 100,
  issued: '2018',
  cert_nr: 'KG-0500-22222',
  label_lt: labelFor(15, '2018'),
  comparison_lt: ruled(37),
};

// Equal: the backend returns `comparison_lt: null` when the two figures are
// within 0.5 kWh/m². The listing still renders; there is simply no direction.
const EQUAL = {
  source: 'register',
  energy_class: 'C',
  kwhm2_year: 120,
  issued: '2016',
  cert_nr: 'KG-0500-33333',
  label_lt: labelFor(14, '2016'),
  comparison_lt: null,
};

function heading() {
  return document.body.textContent ?? '';
}

// ── 1 · improving ───────────────────────────────────────────────────────────

describe('state: the earlier certificate showed HIGHER demand (2015, D)', () => {
  it('★ renders №16 and not №37', async () => {
    await renderReport(servedWith(IMPROVING));

    expect(screen.getByText(ruled(16))).toBeInTheDocument();
    expect(screen.queryByText(ruled(37))).toBeNull();
  });

  it('★ the label carries the ruled №14 span AND nothing else rode along', async () => {
    await renderReport(servedWith(IMPROVING));

    const label = document.querySelector('[data-secondary-label]')!.textContent;
    expect(label).toContain(ruled(14)); // the ruled span survived
    expect(label).toBe(IMPROVING.label_lt); // and nothing was added around it
  });

  it('★ the class and the figure reach the page, rounded as print rounds them', async () => {
    await renderReport(servedWith(IMPROVING));

    const box = document.querySelector('[data-secondary-certificate]')!.textContent!;
    expect(box).toContain('D klasė');
    expect(box).toContain('145 kWh/m² per metus');
  });
});

// ── 2 · worsening ───────────────────────────────────────────────────────────

describe('state: the earlier certificate showed LOWER demand (2018, B)', () => {
  it('★ renders №37 — which explains methodology, and is NOT a mirrored №16', async () => {
    await renderReport(servedWith(WORSENING));

    expect(screen.getByText(ruled(37))).toBeInTheDocument();
    expect(screen.queryByText(ruled(16))).toBeNull();
    // The whole point of №37: it does not accuse the building of decay.
    expect(heading()).not.toContain('pastato būklė pablogėjo');
  });

  it('★ the label carries the ruled №15 span AND nothing else rode along', async () => {
    await renderReport(servedWith(WORSENING));

    const label = document.querySelector('[data-secondary-label]')!.textContent;
    expect(label).toContain(ruled(15));
    expect(label).toBe(WORSENING.label_lt);
  });
});

// ── 3 · equal — an ABSENCE (Amendment A) ────────────────────────────────────

describe('state: the two certificates agree (2016, C — within the 0.5 band)', () => {
  it('★ the listing renders: label, class, figure', async () => {
    await renderReport(servedWith(EQUAL));

    const box = document.querySelector('[data-secondary-certificate]')!.textContent!;
    expect(box).toContain(ruled(14));
    expect(box).toContain('C klasė');
    expect(box).toContain('120 kWh/m² per metus');
  });

  it('★ and says NOTHING about direction — no №16, no №37, no invented line', async () => {
    await renderReport(servedWith(EQUAL));

    expect(screen.queryByText(ruled(16))).toBeNull();
    expect(screen.queryByText(ruled(37))).toBeNull();
    // The line the build used to render here was never gated and retires
    // rather than being ruled: a sentence nobody ruled, nobody reads.
    expect(heading()).not.toContain('Abu sertifikatai rodo panašų');
    // No comparison paragraph at all — the block is label-only.
    expect(
      document.querySelectorAll('[data-secondary-certificate] p').length,
    ).toBe(1);
  });
});

// ── 4 · register-newer — sentence AND listing, together ─────────────────────

describe('state: a newer register certificate governs, the upload is listed (2015, D)', () => {
  it('★ №38 credits the upload, and the retired refusal is gone', async () => {
    await renderReport(
      servedWith({ ...IMPROVING, source: 'upload', label_lt: labelFor(15, '2015') }, ruled(38)),
    );

    expect(screen.getByText(ruled(38))).toBeInTheDocument();
    expect(heading()).not.toContain('nepanaudojome');
  });

  it('★ THE DUAL-FIELD SEAM — the sentence and the listing appear together', async () => {
    await renderReport(
      servedWith({ ...IMPROVING, source: 'upload', label_lt: labelFor(15, '2015') }, ruled(38)),
    );

    // Piece 1 owns the sentence field, Piece 2 owns the listing. This branch
    // produces both, and a refusal printed beside the document it refuses is
    // exactly what got №38 rewritten — so their correlation is the assertion.
    expect(document.querySelector('[data-upload-not-used]')).not.toBeNull();
    expect(document.querySelector('[data-secondary-certificate]')).not.toBeNull();
    expect(screen.getByText(ruled(38))).toBeInTheDocument();
    expect(screen.getByText(ruled(15), { exact: false })).toBeInTheDocument();
  });
});

// ── 5 · null — the ordinary report ──────────────────────────────────────────

describe('state: one certificate, the ordinary case', () => {
  it('★ renders no listing at all', async () => {
    await renderReport(servedWith(null));

    expect(document.querySelector('[data-secondary-certificate]')).toBeNull();
  });

  it('★ the captured fixture serves null — a real report shows nothing', async () => {
    await renderReport();

    expect(BASE.block1.secondary_certificate ?? null).toBeNull();
    expect(document.querySelector('[data-secondary-certificate]')).toBeNull();
  });
});

// ── 6 · merge — the annexe's third branch, state 4's INVERSE ────────────────

describe('state: the upload and the register are the SAME certificate', () => {
  it('★ №13 credits both sources, and NO second certificate appears beside it', async () => {
    // Annexe §6.7's special case: identical certificates merge into one hero
    // and the second hero is removed. The backend does exactly that — the
    // merge branch attaches the upload outcome and never a secondary entry —
    // so the customer is credited without a phantom document beside them.
    await renderReport(servedWith(null, ruled(13)));

    expect(screen.getByText(ruled(13))).toBeInTheDocument();
    expect(document.querySelector('[data-secondary-certificate]')).toBeNull();
  });
});

// ── the negative that holds in EVERY state (R-G2-1) ─────────────────────────

describe('the print-only heading never reaches the web', () => {
  it.each([
    ['improving', () => servedWith(IMPROVING)],
    ['worsening', () => servedWith(WORSENING)],
    ['equal', () => servedWith(EQUAL)],
    ['register-newer', () => servedWith(IMPROVING, ruled(38))],
    ['null', () => servedWith(null)],
    ['merge', () => servedWith(null, ruled(13))],
  ])('★ %s — „Kitas šio objekto sertifikatas" is absent', async (_name, build) => {
    await renderReport(build());

    // Ruled (R-G2-1): print keeps its heading, the web ships without one, and
    // the string is never authored here. Wire-true fixtures make this
    // meaningful — the real serializer does not send it.
    expect(heading()).not.toContain(PRINT_ONLY_HEADING);
  });
});
