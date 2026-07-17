/**
 * NB-CONF FE stitch: project-evidence keys for the /confirm payload.
 *
 * Wire-format rule: the backend ConfirmRequest schema is the ONE spec —
 * `project_website_url` / `project_doc_id`, both Optional[str] = None
 * (bustodnr bustodnr_api/quickscan_lite.py, NB-CONF paid-road leg).
 * Keys are included only when present; absent otherwise — the backend
 * treats a missing key and None identically, and /confirm scrapes/parses
 * ONCE and freezes the YIELDS, so an unsent field simply rides the
 * evidence-less road.
 *
 * Mirrors the B2-16 `buildUserEnergyPayload` idiom: a pure builder
 * returning a spreadable fragment, `{}` when nothing applies — the
 * component spreads THIS function, so the tests pin the real wire shape.
 */

export interface EvidenceState {
  project_website_url: string | null;
  project_doc_id: string | null;
}

export function buildEvidencePayload(
  state: EvidenceState,
): Record<string, string> {
  const fragment: Record<string, string> = {};
  if (state.project_website_url) {
    fragment.project_website_url = state.project_website_url;
  }
  if (state.project_doc_id) {
    fragment.project_doc_id = state.project_doc_id;
  }
  return fragment;
}
