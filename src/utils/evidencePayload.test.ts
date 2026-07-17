/**
 * NB-CONF FE stitch: the evidence fragment asserts the SHIPPED backend
 * literals — ConfirmRequest's `project_website_url` / `project_doc_id`
 * (bustodnr bustodnr_api/quickscan_lite.py, both Optional[str] = None;
 * the backend receipt is
 * tests/integration/test_b218_e2e_cases.py::
 * test_case6_paid_road_serves_adopted_basis, which round-trips
 * project_website_url through the real /confirm → /payment-intent road).
 * Together the two ends pin the same schema — the B2-16 wire-format
 * lesson: one spec per contract shape, tested through the real builder.
 */
import { describe, expect, it } from 'vitest';

import { buildEvidencePayload } from './evidencePayload';

describe('buildEvidencePayload', () => {
  it('E3 — URL entered → project_website_url transmits', () => {
    expect(
      buildEvidencePayload({
        project_website_url: 'https://test-project.lt',
        project_doc_id: null,
      }),
    ).toEqual({ project_website_url: 'https://test-project.lt' });
  });

  it('E4 — doc uploaded → project_doc_id transmits', () => {
    expect(
      buildEvidencePayload({
        project_website_url: null,
        project_doc_id: 'doc-123',
      }),
    ).toEqual({ project_doc_id: 'doc-123' });
  });

  it('both provided → both transmit', () => {
    expect(
      buildEvidencePayload({
        project_website_url: 'https://test-project.lt',
        project_doc_id: 'doc-123',
      }),
    ).toEqual({
      project_website_url: 'https://test-project.lt',
      project_doc_id: 'doc-123',
    });
  });

  it('neither → NEITHER key present (pins the optionality)', () => {
    const fragment = buildEvidencePayload({
      project_website_url: null,
      project_doc_id: null,
    });
    expect(fragment).toEqual({});
    expect('project_website_url' in fragment).toBe(false);
    expect('project_doc_id' in fragment).toBe(false);
    // Empty strings are not sent either (the state stores `value || null`,
    // and the builder guards independently).
    expect(
      buildEvidencePayload({ project_website_url: '', project_doc_id: '' as unknown as null }),
    ).toEqual({});
  });
});
