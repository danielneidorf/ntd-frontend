/**
 * G3 Piece 0c — the guide reads the evaluation type instead of inferring it.
 *
 * WHAT WAS WRONG. `reportTour` concluded "this is a land plot" from a MISSING
 * ELEMENT: `!document.querySelector('[data-guide="climate-assessment"]')`. Two
 * separate faults in one line. The block is also absent when Block 1 is not
 * applicable for other reasons — "not applicable" is not a synonym for
 * land-only — and any future render failure would have had the guide telling a
 * customer, confidently and out loud, that they had bought a plot of land.
 *
 * A conclusion may not rest on an absence. The tour now reads the contract
 * value the page serves, and the guide speaks the ruled wording beside it.
 *
 * THE PROOF THAT THE INFERENCE IS DEAD is the second test below: the climate
 * block is absent from the DOM while the data says `existing_object`. Under the
 * old code that state produced "land"; under the new code it cannot. It was
 * written to fail first, and its flip is the fix.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { extractReportData } from '../tours/reportTour';

function page({
  code,
  label,
  withClimateBlock,
}: {
  code: string | null;
  label?: string | null;
  withClimateBlock: boolean;
}) {
  document.body.innerHTML = `
    <div data-guide="property-identity"${code === null ? '' : ` data-evaluation-target-code="${code}"`}>
      ${label ? `<span data-evaluation-target>${label}</span>` : ''}
    </div>
    ${withClimateBlock ? '<div data-guide="climate-assessment"></div>' : ''}
  `;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('the guide reads the served evaluation type', () => {
  it('★ land-only is decided by the contract value, not a missing block', () => {
    page({ code: 'land_only', label: 'Žemės sklypas', withClimateBlock: false });
    expect(extractReportData().isLandOnly).toBe(true);
  });

  it('★ THE INFERENCE IS DEAD — no climate block, but the data says a building', () => {
    // The exact state the old code got wrong. It read the absence and concluded
    // "land"; a customer would have been told they bought a plot.
    page({ code: 'existing_object', label: 'Esamas pastatas / patalpos', withClimateBlock: false });

    const data = extractReportData();
    expect(data.isLandOnly).toBe(false);
    expect(data.evaluationTargetCode).toBe('existing_object');
  });

  it('★ a NEW BUILD is neither land nor an existing building', () => {
    page({ code: 'new_build_project', label: 'Naujas statybos projektas', withClimateBlock: true });

    const data = extractReportData();
    expect(data.isLandOnly).toBe(false);
    expect(data.evaluationTargetLabel).toBe('Naujas statybos projektas');
  });

  it('★ the guide speaks the SERVED wording, never one it composes', () => {
    page({ code: 'land_only', label: 'Žemės sklypas', withClimateBlock: false });
    expect(extractReportData().evaluationTargetLabel).toBe('Žemės sklypas');
  });

  it('★ no served type → no claim: null, not a guess', () => {
    page({ code: null, withClimateBlock: false });

    const data = extractReportData();
    expect(data.evaluationTargetCode).toBeNull();
    expect(data.evaluationTargetLabel).toBeNull();
    // The decisive part: an ABSENT signal must not read as land, which is what
    // the old absence-inference did with every missing element it saw.
    expect(data.isLandOnly).toBe(false);
  });
});
