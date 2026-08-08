/**
 * G3 Piece 0c — THE CONNECTION TEST for the evaluation type, browser side.
 *
 * THE SEAM: served payload → real `ReportViewer` → DOM. The page used to branch
 * on a DISPLAY STRING — „Žemės sklypas" — so re-wording a label would silently
 * have changed which layout a customer received. It branches on the contract
 * value now and renders a SERVED wording, and the two are kept apart here.
 *
 * THE DEFECT THIS CLOSED: the serve boundary manufactured only two wordings —
 * land, or *everything else* → „Esamas pastatas" — so a new-build customer read
 * the wrong type on the primary surface while print said the right one. The
 * backend serves all three as of step 2; this file is what reddens if they are
 * ever collapsed again.
 *
 * The step-1 migration tolerance (accepting the legacy phrase as an identifier,
 * falling back to the raw field for display) was REMOVED at step 3, and the
 * assertions that covered it were flipped rather than deleted — they now pin
 * that the tolerance is gone.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReportViewer from '../../ReportViewer';
import { DEV_MOCKS } from '../mockReportData';
import { isLandOnly, evaluationTargetLabel } from '../../../utils/evaluationTarget';

const BASE = DEV_MOCKS['dev-existing'];

function stubReport(data: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, data }) })));
}
beforeEach(() => window.history.pushState({}, '', '/report/tok'));
afterEach(() => vi.unstubAllGlobals());

async function renderWith(target: string | null, label?: string | null) {
  const data = JSON.parse(JSON.stringify(BASE));
  data.property_profile.evaluation_target = target;
  if (label !== undefined) data.property_profile.evaluation_target_lt = label;
  stubReport(data);
  render(<ReportViewer />);
  // The address heading, not a block heading: a land-only report renders no
  // property card and no energy section, so any block-level anchor would only
  // ever resolve for the states this test is least interested in.
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(),
  );
  return document.querySelector('[data-evaluation-target]');
}

// ── the branch reads the contract, not the wording ──────────────────────────

describe('the land branch keys on the contract value', () => {
  it('★ recognises the contract code', () => {
    expect(isLandOnly('land_only')).toBe(true);
  });

  it('★ the legacy phrase is NO LONGER an identifier — step 3 removed the tolerance', () => {
    // Step 1 accepted it while the backend still sent it. Step 2 moved the wire
    // to the contract value, so this string is now display copy and nothing
    // else — and a display string must never decide a layout again.
    expect(isLandOnly('Žemės sklypas')).toBe(false);
  });

  it('★ a NEW BUILD is not land — the three-value contract has no else-bucket', () => {
    // The old shape of this check was `!== 'Žemės sklypas'`, which lumped
    // new-build in with existing. Naming the value is what keeps them apart.
    expect(isLandOnly('new_build_project')).toBe(false);
    expect(isLandOnly('existing_object')).toBe(false);
    expect(isLandOnly(null)).toBe(false);
  });
});

// ── the wording is served, and absence beats falsehood ──────────────────────

describe('the rendered „Vertinimo tipas" line', () => {
  it('★ prefers the served label over the raw field', async () => {
    const el = await renderWith('land_only', 'Žemės sklypas');
    expect(el?.textContent).toBe('Žemės sklypas');
  });

  it('★ THE DEFECT: a new-build report says new build, not „Esamas pastatas"', async () => {
    const el = await renderWith('new_build_project', 'Naujas statybos projektas');
    expect(el?.textContent).toBe('Naujas statybos projektas');
    expect(document.body.textContent).not.toContain('Vertinimo tipas: Esamas pastatas');
  });

  it('★ NO fallback: a wording with no served label renders no line at all', async () => {
    // The step-1 fallback is gone with the migration it existed for. If the
    // label is missing the customer is told nothing, rather than being shown
    // whatever happened to be in the contract field.
    const el = await renderWith('Žemės sklypas', null);
    expect(el).toBeNull();
  });

  it('★ renders NO LINE for a bare contract code — „land_only" is not copy', async () => {
    const el = await renderWith('land_only', null);
    expect(el).toBeNull();
    expect(document.body.textContent).not.toContain('land_only');
  });

  it('★ renders NO LINE for an unrecognised value — absence over falsehood', async () => {
    const el = await renderWith('something_unexpected', null);
    expect(el).toBeNull();
    expect(document.body.textContent).not.toContain('Vertinimo tipas:');
  });
});

// ── the helper's own contract, so the component tests above cannot drift ────

describe('evaluationTargetLabel', () => {
  it('★ served or nothing — never a contract code, never a guess', () => {
    expect(evaluationTargetLabel(null)).toBeNull();
    expect(evaluationTargetLabel(undefined)).toBeNull();
    expect(evaluationTargetLabel('')).toBeNull();
    expect(evaluationTargetLabel('Žemės sklypas')).toBe('Žemės sklypas');
  });
});
