/**
 * The evaluation target — one contract value, read in one place.
 *
 * WHY THIS EXISTS. `evaluation_target` carried two different things under one
 * name: the contract CODE on the inputs snapshot (`land_only`), and a
 * customer-facing PHRASE on the property profile („Žemės sklypas"), manufactured
 * at the serve boundary. The page then branched on the phrase — so a display
 * string was doing an identifier's job, and re-wording it would silently have
 * changed which layout a customer got.
 *
 * G3 Piece 0c moved the wire to the code and serves the wording separately.
 * These helpers are the single place that knows the difference, so the four
 * comparison sites and the one display site cannot drift apart again.
 *
 * The migration's legacy-phrase tolerance was removed at step 3, once the
 * backend served the contract value on every road. Nothing here accepts a
 * display string as an identifier any more.
 */

export type EvaluationTargetCode =
  | 'existing_object'
  | 'new_build_project'
  | 'land_only';


/**
 * Is this a land-only report?
 *
 * Never `!== 'existing_object'` — a new-build project is not land, and the
 * three-value contract has no "everything else" bucket.
 */
export function isLandOnly(target: string | null | undefined): boolean {
  return target === 'land_only';
}

/**
 * What the customer reads for „Vertinimo tipas" — served, or nothing.
 *
 * There is deliberately no fallback. The backend serves exactly three wordings
 * for exactly three contract values, and an unrecognised value yields none — so
 * the caller renders NO LINE rather than a wrong one, which is the report's
 * established pattern (see the hero source-line template's own note). A contract
 * value is never shown: „land_only" is not customer copy.
 */
export function evaluationTargetLabel(
  servedLabel: string | null | undefined,
): string | null {
  return servedLabel || null;
}
