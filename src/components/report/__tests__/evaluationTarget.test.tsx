/**
 * G3 Piece 0c step 1 — THE CONNECTION TEST for the evaluation type.
 *
 * THE SEAM: served payload → real `ReportViewer` → DOM, across the migration.
 * The page used to branch on a DISPLAY STRING — „Žemės sklypas" — so a re-worded
 * label would silently have changed which layout a customer got. It now branches
 * on the contract value and renders a SERVED label, and this file proves both
 * wire shapes work while the backend catches up.
 *
 * THE DEFECT THIS CLOSES, asserted directly below: the serve boundary
 * manufactures only two wordings (land, or *everything else* → „Esamas
 * pastatas"), so a new-build customer reads the wrong type on the primary
 * surface while print says the right one. Step 2 makes the backend serve all
 * three; this file is what fails if it ever collapses them again.
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

  it('★ still recognises the legacy phrase — step 1 tolerance, gone at step 3', () => {
    expect(isLandOnly('Žemės sklypas')).toBe(true);
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

  it('★ falls back to the raw field while it still carries the phrase', async () => {
    const el = await renderWith('Žemės sklypas', null);
    expect(el?.textContent).toBe('Žemės sklypas');
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
  it('★ never shows a contract code, with or without a label', () => {
    expect(evaluationTargetLabel(null, 'land_only')).toBeNull();
    expect(evaluationTargetLabel(null, 'new_build_project')).toBeNull();
    expect(evaluationTargetLabel('Žemės sklypas', 'land_only')).toBe('Žemės sklypas');
  });
});
