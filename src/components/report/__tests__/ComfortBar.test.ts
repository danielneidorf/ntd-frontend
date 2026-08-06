import { describe, it, expect } from 'vitest';
import {
  mapSummerLevel,
  mapWinterLevel,
  WINTER_NOT_ASSESSED,
} from '../ComfortBar';

describe('mapWinterLevel', () => {
  it('maps the three real bands to the A–E display levels', () => {
    expect(mapWinterLevel('GOOD')).toBe('B');
    expect(mapWinterLevel('INTERMEDIATE')).toBe('C');
    expect(mapWinterLevel('WEAK')).toBe('D');
  });

  it('keeps NOT_ASSESSED OFF the A–E axis — never the medium fallback', () => {
    // The honesty fix: a no-data property must not render as "Vidutiniškai".
    expect(mapWinterLevel('NOT_ASSESSED')).toBe(WINTER_NOT_ASSESSED);
    expect(mapWinterLevel('NOT_ASSESSED')).not.toBe('C');
  });

  it('still falls back to C for genuinely unknown tokens', () => {
    expect(mapWinterLevel('GIBBERISH')).toBe('C');
  });
});

describe('mapSummerLevel', () => {
  it('maps the 5 SummerOverheatingRisk values 1:1 onto A–E (lossless, no collapse)', () => {
    const segs = ['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'].map(mapSummerLevel);
    expect(segs).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(new Set(segs).size).toBe(5);
  });

  it('lands the produced levels on B/C/D — lowest produced → B "Maža", not C', () => {
    // The VERY_LOW mis-map fix: the lowest produced bucket (LOW) shows as B.
    expect(mapSummerLevel('LOW')).toBe('B');
    expect(mapSummerLevel('MODERATE')).toBe('C');
    expect(mapSummerLevel('HIGH')).toBe('D');
  });

  it('reserves A "Minimali" / E "Kritinė" for the not-yet-produced extremes', () => {
    expect(mapSummerLevel('VERY_LOW')).toBe('A');
    expect(mapSummerLevel('VERY_HIGH')).toBe('E');
  });
});

// The `winterNotAssessedMessage` and `winterProvenanceMessage` suites that
// stood here are GONE WITH THE FUNCTIONS THEY TESTED (copy-parity, 2026-08-06).
// Both composed Lithuanian from a local map that also existed in the PDF's
// Jinja; the sentences (№11–14) are now produced once in the backend and served
// as `winter.not_assessed_message_lt` / `winter.provenance_message_lt`.
//
// What replaced them is not a unit test of a map — it is the pair of guards
// that cross the boundary the map used to hide: the backend asserts the
// sentences on BOTH served surfaces
// (bustodnr/tests/reports/test_ruled_copy_on_both_surfaces.py), and the
// failure-state render asserts them off the rendered page
// (__tests__/WinterRecourse.test.tsx). A test whose fixture is a local map can
// only ever prove the map equals itself.
