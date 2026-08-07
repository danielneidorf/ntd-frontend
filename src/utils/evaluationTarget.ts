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
 * G3 Piece 0c moves the wire to the code and serves the wording separately.
 * These helpers are the single place that knows the difference, so the four
 * comparison sites and the one display site cannot drift apart again.
 *
 * The legacy phrase is accepted DURING the migration only — the backend still
 * sends it until step 2 lands, and this tolerance is removed at step 3. It is
 * named and dated rather than left as a quiet `||`.
 */

export type EvaluationTargetCode =
  | 'existing_object'
  | 'new_build_project'
  | 'land_only';

/**
 * The exact wordings the serve boundary produces TODAY, and the only raw values
 * the display will fall back to. Removed at Piece 0c step 3.
 *
 * An allowlist rather than "anything that isn't a contract code": the fallback
 * exists to carry two known strings through the migration, not to render
 * whatever arrives. Without this, an unrecognised value would print itself to
 * the customer — which is the falsehood the no-line rule forbids.
 */
const LEGACY_LAND_PHRASE = 'Žemės sklypas';
const LEGACY_PHRASES: readonly string[] = [LEGACY_LAND_PHRASE, 'Esamas pastatas'];

/**
 * Is this a land-only report?
 *
 * Never `!== 'existing_object'` — a new-build project is not land, and the
 * three-value contract has no "everything else" bucket.
 */
export function isLandOnly(target: string | null | undefined): boolean {
  return target === 'land_only' || target === LEGACY_LAND_PHRASE;
}

/**
 * What the customer reads for „Vertinimo tipas".
 *
 * Prefers the served label; falls back to the raw field while the backend still
 * sends the phrase there. Returns null when neither is usable — and the caller
 * renders NO LINE rather than a wrong one, which is the report's established
 * pattern for an unrecognised value (see the hero source-line template).
 */
export function evaluationTargetLabel(
  servedLabel: string | null | undefined,
  rawTarget: string | null | undefined,
): string | null {
  if (servedLabel) return servedLabel;
  // Step-1 tolerance: the raw field still carries one of two known phrases
  // until step 2 lands. A bare contract code is never shown („land_only" is not
  // customer copy), and neither is anything unrecognised.
  if (rawTarget && LEGACY_PHRASES.includes(rawTarget)) return rawTarget;
  return null;
}
