/**
 * G2 Piece 1 — THE CONNECTION TEST for the certificate sentence on the web.
 *
 * THE SEAM: backend serializer → served payload → real `ReportViewer` → DOM.
 * The backend half is already proven — `report_access_service.py:481` puts the
 * sentence on the wire, and the backend's own guards assert it equals the ruled
 * string (`tests/reports/test_recalc_road_ruled_strings.py`, plus the
 * exhaustiveness pin `test_every_upload_not_used_reason_has_copy`). What was
 * NEVER proven, and what this file proves, is that the browser renders it: until
 * 2026-08-06 nothing in `src/` read the field, so the sentence reached only the
 * customer who opened the PDF.
 *
 * EXPECTATIONS ARE READ FROM THE RULING DOCUMENT, never pasted — a pasted copy
 * agrees with the ruling the day it is written and drifts silently afterwards.
 * The value driven onto the wire is the same ruled string the backend is proven
 * to serve for that reason, so the fixture is wire-true rather than invented.
 *
 * THE STATE IS NAMED per the standing rider: fixture `dev-existing`, as served,
 * with `block1.upload_not_used_message_lt` set to the one reason under test.
 * Every other field is the captured fixture's own.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReportViewer from '../../ReportViewer';
import { DEV_MOCKS } from '../mockReportData';
import { ruled } from '../../__tests__/ruling';

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

/** The served payload with one reason's sentence on the wire. */
function servedWith(message: string | null) {
  const data = JSON.parse(JSON.stringify(BASE));
  data.block1.upload_not_used_message_lt = message;
  return data;
}

// ── A · the ruled sentences reach the customer ──────────────────────────────
//
// ALL NINE reasons that carry copy, every one asserted through the ruling
// loader. The last three — №40 `unsupported_format`, №41 `ambiguous_match`,
// №42 `other` — were unruled when this arc began; G2 Piece 1 made them
// web-reachable, so they went to the pen first (Amendment B) and were ruled at
// the 2026-08-07 sitting. №41 landed GENERALIZED: its build wording named one
// mechanism the code can contradict, and the backend copy changed with the
// ruling. Nothing here asserts a sentence against the backend constant — that
// would prove only that the source equals itself.

describe('the served certificate sentence renders on the web report', () => {
  it.each([
    [8, 'property_mismatch — the certificate names another property'],
    [10, 'incomplete_data — read, but carries neither class nor heating figure'],
    [11, 'parse_error — the file could not be read'],
    [12, 'too_old — older than ten years, shown as historical'],
    [13, 'merged_with_register — CREDITS the upload, not a refusal'],
    [38, 'overridden_by_better_official — CREDITS the upload, not a refusal'],
    [40, 'unsupported_format — the file is not a certificate'],
    [41, 'ambiguous_match — could not be tied to this property (generalized)'],
    [42, 'other — the catch-all'],
  ])('★ renders №%i — %s', async (number) => {
    const expected = ruled(number as number);
    await renderReport(servedWith(expected));

    expect(
      screen.getAllByText(expected).length,
      `№${number} („${expected}") is served but not on the rendered page`,
    ).toBeGreaterThan(0);
  });
});

// ── B · the block is silent when there is nothing to explain ────────────────

describe('the block stays silent when the certificate was used', () => {
  it('★ renders no notice at all when the wire carries null', async () => {
    await renderReport(servedWith(null));

    expect(document.querySelector('[data-upload-not-used]')).toBeNull();
  });

  it('★ the captured fixture serves null — the ordinary report shows nothing', async () => {
    await renderReport();

    expect(BASE.block1.upload_not_used_message_lt ?? null).toBeNull();
    expect(document.querySelector('[data-upload-not-used]')).toBeNull();
  });
});

// ── C · the sentence is rendered verbatim, never composed ───────────────────

describe('№41 does not tell the customer something the document contradicts', () => {
  it('★ the retired single-mechanism claim never reaches the page', async () => {
    await renderReport(servedWith(ruled(41)));

    // The build's wording said the certificate states no unique object number.
    // A certificate that prints two buildings unlabelled lands on this same
    // reason, and for that customer the claim is simply false — which is why
    // the sitting ruled the generalized form and the backend copy changed.
    expect(document.body.textContent).not.toContain('nenurodytas unikalus');
  });
});

describe('the web authors none of this Lithuanian', () => {
  it('★ renders the served string EXACTLY — no prefix, suffix, or rewording', async () => {
    // A sentence the backend could serve for any reason: the component must be
    // string-agnostic, because the copy lives in one backend map and the three
    // unruled reasons will ship their own wording without a frontend change.
    const served = ruled(38);
    await renderReport(servedWith(served));

    const box = document.querySelector('[data-upload-not-used]');
    expect(box).not.toBeNull();
    expect(box!.textContent).toBe(served);
  });
});
