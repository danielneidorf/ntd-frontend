/**
 * Candidate wire contract — the frontend half of the pin (2026-07-20).
 *
 * The backend half lives at
 * `bustodnr/tests/resolver/test_candidate_wire_contract.py` and asserts the
 * served key set. This half asserts the FRONTEND reads only those keys.
 *
 * Why source inspection rather than rendering: the defect was a type that
 * lied about the wire, and `astro build` doesn't typecheck — so nothing
 * failed while the proof card rendered a blank address and the chooser threw
 * on `bundle_items.length`. A grep-shaped pin catches a reintroduced field
 * name wherever it appears, including inside dev mocks (which is how the
 * wrong shape was taught in the first place). The same technique guards the
 * backend candidate hop (`test_live_registry_road_fix1.py`).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(resolve(HERE, '../QuickScanFlow.tsx'), 'utf-8');

// Mirrors EXPECTED_CANDIDATE_KEYS in the backend pin. A field added there
// may be read here; a field NOT there must never be.
const SERVED_CANDIDATE_KEYS = [
  'address_source', 'address_text', 'building_year_built', 'coverage_level',
  'glazing_band', 'glazing_share_percent', 'heated_area_m2',
  'heated_area_m2_source', 'heated_flag', 'heating_system_type', 'is_primary',
  'kind', 'lat', 'lng', 'match_score', 'municipality', 'ntr_unique_number',
  'premises_type', 'purpose', 'registry_energy_class',
  'registry_epc_kwhm2_year', 'registry_object_id', 'renovation_year',
  'resolver_sources', 'resolver_warnings', 'usage_group', 'ventilation_type',
];

describe('candidate wire contract (frontend half)', () => {
  it('never reads the five fields the wire does not carry', () => {
    // `address` / `confidence` were renamed to their served names;
    // `bundle_items` / `primary_object` are RC-gated and absent;
    // `bundle_confidence` belongs to the candidate SET, not a candidate.
    const forbidden = [
      /\bcandidate\.address\b(?!_)/,
      /\bc\.address\b(?!_)/,
      /\bcandidate\.confidence\b/,
      /\bc\.confidence\b/,
      /\bcandidate\.primary_object\b/,
      /\bc\.primary_object\b/,
      /\bprimary_object\s*:/,
      /\bbundle_confidence\s*:/,
    ];
    for (const pattern of forbidden) {
      expect(SOURCE, `forbidden candidate field read: ${pattern}`).not.toMatch(pattern);
    }
  });

  it('reads the served names instead', () => {
    expect(SOURCE).toMatch(/\bcandidate\.address_text\b/);
    expect(SOURCE).toMatch(/\bc\.address_text\b/);
    expect(SOURCE).toMatch(/coverage_level/);
  });

  it('guards every bundle_items read (the chooser crash)', () => {
    // Each read must be null-coalesced — the map/length calls threw on the
    // pin road, whose chooser was the only identity screen it had.
    const reads = SOURCE.match(/\.bundle_items[.[]/g) ?? [];
    expect(reads.length, 'unguarded direct .bundle_items access').toBe(0);
  });

  it('the dev mock speaks the served shape', () => {
    // The mock taught the wrong shape once; a mock that lies about the wire
    // is the defect, not a convenience.
    const mock = SOURCE.slice(SOURCE.indexOf('const DEV_MOCK_RESOLVER'));
    // Scope to the candidate's OWN keys: bundle items carry their own
    // `address`, which is a different object and legitimately named.
    const head = mock.slice(0, mock.indexOf('bundle_items'));
    expect(head).toMatch(/address_text:/);
    expect(head).toMatch(/coverage_level:/);
    expect(head).not.toMatch(/\baddress:/);
    expect(head).not.toMatch(/\bconfidence:/);
  });

  it('every candidate field the component reads exists on the wire', () => {
    // Collect `candidate.<field>` / `c.<field>` reads and check them against
    // the served list. FE-local fields (candidate_id, and the pin coords the
    // FE stamps client-side) are excluded explicitly.
    const feLocal = new Set([
      'candidate_id', 'pin_lat', 'pin_lng', 'map',
      // `bundle_items` is RC-gated: read behind `?? []`, kept alive
      // deliberately (unimplemented spec, not dead code).
      'bundle_items',
      // `c` also names Google autocomplete SUGGESTIONS in this file —
      // different objects, not candidates.
      'description', 'place_id', 'main_text', 'secondary_text',
    ]);
    const reads = new Set<string>();
    for (const m of SOURCE.matchAll(/\b(?:candidate|c)\.([a-z_][a-z0-9_]*)\b/gi)) {
      reads.add(m[1]);
    }
    const unknown = [...reads].filter(
      (f) => !SERVED_CANDIDATE_KEYS.includes(f) && !feLocal.has(f),
    );
    expect(unknown, `fields read but not served: ${unknown.join(', ')}`).toEqual([]);
  });
});
