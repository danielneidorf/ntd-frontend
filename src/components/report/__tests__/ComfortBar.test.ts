import { describe, it, expect } from 'vitest';
import {
  mapWinterLevel,
  WINTER_NOT_ASSESSED,
  WINTER_PROVENANCE_ERA_ESTIMATED,
  winterNotAssessedMessage,
  winterProvenanceMessage,
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

describe('winterNotAssessedMessage', () => {
  it('returns a reason-specific Lithuanian message', () => {
    expect(winterNotAssessedMessage('not_in_registry')).toContain('sertifikato');
    expect(winterNotAssessedMessage('technical_error')).toContain('klaidos');
  });

  it('falls back to a generic message for a missing/unknown reason', () => {
    expect(winterNotAssessedMessage(undefined)).toContain('trūksta duomenų');
    expect(winterNotAssessedMessage('weird')).toContain('trūksta duomenų');
  });
});

describe('winterProvenanceMessage', () => {
  it('returns the honest estimate caption for the era_estimated key', () => {
    const msg = winterProvenanceMessage(WINTER_PROVENANCE_ERA_ESTIMATED);
    expect(msg).toContain('Apytikslis');
    expect(msg).toContain('statybos metus'); // by construction era + type
  });

  it('returns null when there is no estimate provenance (real cert → no caption)', () => {
    // A real band carries no estimate label.
    expect(winterProvenanceMessage(undefined)).toBeNull();
    expect(winterProvenanceMessage(null)).toBeNull();
    expect(winterProvenanceMessage('block1.winter.provenance.from_certificate')).toBeNull();
  });
});
