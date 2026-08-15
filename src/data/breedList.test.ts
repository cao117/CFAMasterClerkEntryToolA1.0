import { describe, test, expect } from '@jest/globals';
import {
  SHORT_HAIR_BREEDS,
  LONG_HAIR_BREEDS,
  LEGACY_BREED_MAP,
  mapLegacyBreedName
} from './breedList';

/**
 * Canonical CFA 2026-27 season breed list — integrity tests.
 *
 * Baseline pre-2026-27 lists as they existed in src/App.tsx DEFAULT_SETTINGS
 * (the user-editable settings this module replaces). Used here to derive the
 * expected post-change canonical list mechanically rather than by hand-typed
 * duplication, so a typo in this test can't silently agree with a typo in
 * the implementation.
 */
const PRE_2026_27_SHORT_HAIR_BREEDS = [
  'ABYSSINIAN', 'AMERICAN SH', 'AMERICAN WH', 'BALINESE', 'BALINESE-JAVANESE',
  'BENGAL', 'BOMBAY', 'BRITISH SH', 'BURMESE', 'BURMILLA - LH', 'BURMILLA - SH',
  'CHARTREUX', 'COLORPOINT SH', 'CORNISH REX', 'DEVON REX', 'EGYPTIAN MAU',
  'EUROPEAN BURM', 'HAVANA BROWN', 'JAPANESE BOBTAIL - LH', 'JAPANESE BOBTAIL - SH',
  'KORAT', 'LAPERM - LH', 'LAPERM - SH', 'LYKOI', 'MANX - LH', 'MANX - SH',
  'OCICAT', 'ORIENTAL - LH', 'ORIENTAL - SH', 'RUSSIAN BLUE', 'SCOTTISH FOLD - LH',
  'SCOTTISH FOLD - SH', 'SCOTTISH STRAIGHT EAR - LH', 'SCOTTISH STRAIGHT EAR - SH',
  'SELKIRK REX - LH', 'SELKIRK REX - SH', 'SIAMESE', 'SINGAPURA', 'SOMALI',
  'SPHYNX', 'TONKINESE', 'TOYBOB'
];

const PRE_2026_27_LONG_HAIR_BREEDS = [
  'AMERICAN BOBTAIL-LH', 'AMERICAN BOBTAIL-SH', 'AMERICAN CURL-LH', 'AMERICAN CURL-SH',
  'BIRMAN', 'EXOTIC SOLID', 'EXOTIC SILVER/GOLDEN', 'EXOTIC SHADED/SMOKE',
  'EXOTIC TABBY', 'EXOTIC PARTI-COLOR', 'EXOTIC CALICO/BI-COLOR', 'EXOTIC POINTED',
  'MAINE COON CAT', 'NORWEGIAN FOREST CAT', 'PERSIAN SOLID', 'PERSIAN SILVER/GOLDEN',
  'PERSIAN SHADED/SMOKE', 'PERSIAN TABBY', 'PERSIAN PARTI-COLOR', 'PERSIAN CALICO/BI-COLOR',
  'PERSIAN HIMALAYAN', 'RAGAMUFFIN', 'RAGDOLL', 'SIBERIAN', 'TURKISH ANGORA', 'TURKISH VAN'
];

const RENAMES: Record<string, string> = {
  'BENGAL': 'BENGAL - SH',
  'MANX - LH': 'MANX (TAILLESS) - LH',
  'MANX - SH': 'MANX (TAILLESS) - SH'
};

const NEW_DIVISIONS = ['BENGAL - LH', 'MANX (TAILED) - LH', 'MANX (TAILED) - SH'];

const EXPECTED_SHORT_HAIR_BREEDS = [
  ...PRE_2026_27_SHORT_HAIR_BREEDS.map(name => RENAMES[name] ?? name),
  ...NEW_DIVISIONS
].sort();

describe('SHORT_HAIR_BREEDS (2026-27 canonical list)', () => {
  test('equals the pre-season list with the 3 renames applied plus the 3 new divisions, sorted', () => {
    expect(SHORT_HAIR_BREEDS).toEqual(EXPECTED_SHORT_HAIR_BREEDS);
  });

  test('is sorted alphabetically', () => {
    expect(SHORT_HAIR_BREEDS).toEqual([...SHORT_HAIR_BREEDS].sort());
  });

  test('has no duplicate entries', () => {
    expect(new Set(SHORT_HAIR_BREEDS).size).toBe(SHORT_HAIR_BREEDS.length);
  });

  test('every entry is uppercase', () => {
    for (const breed of SHORT_HAIR_BREEDS) {
      expect(breed).toBe(breed.toUpperCase());
    }
  });

  test('contains the 3 renamed divisions under their new names', () => {
    expect(SHORT_HAIR_BREEDS).toContain('BENGAL - SH');
    expect(SHORT_HAIR_BREEDS).toContain('MANX (TAILLESS) - LH');
    expect(SHORT_HAIR_BREEDS).toContain('MANX (TAILLESS) - SH');
  });

  test('contains the 3 new divisions', () => {
    expect(SHORT_HAIR_BREEDS).toContain('BENGAL - LH');
    expect(SHORT_HAIR_BREEDS).toContain('MANX (TAILED) - LH');
    expect(SHORT_HAIR_BREEDS).toContain('MANX (TAILED) - SH');
  });

  test('no longer contains any of the 3 old (pre-rename) names', () => {
    expect(SHORT_HAIR_BREEDS).not.toContain('BENGAL');
    expect(SHORT_HAIR_BREEDS).not.toContain('MANX - LH');
    expect(SHORT_HAIR_BREEDS).not.toContain('MANX - SH');
  });

  test('has exactly 3 more entries than the pre-2026-27 list (3 renames + 3 additions, 0 removals)', () => {
    expect(SHORT_HAIR_BREEDS.length).toBe(PRE_2026_27_SHORT_HAIR_BREEDS.length + 3);
  });
});

describe('LONG_HAIR_BREEDS (unchanged for 2026-27)', () => {
  test('is identical to the pre-2026-27 long hair list (as a set — order not asserted)', () => {
    expect([...LONG_HAIR_BREEDS].sort()).toEqual([...PRE_2026_27_LONG_HAIR_BREEDS].sort());
  });

  test('has no duplicate entries', () => {
    expect(new Set(LONG_HAIR_BREEDS).size).toBe(LONG_HAIR_BREEDS.length);
  });
});

describe('LEGACY_BREED_MAP', () => {
  test('has exactly 3 entries', () => {
    expect(Object.keys(LEGACY_BREED_MAP)).toHaveLength(3);
  });

  test('maps each old name to its correct new name', () => {
    expect(LEGACY_BREED_MAP).toEqual({
      'BENGAL': 'BENGAL - SH',
      'MANX - LH': 'MANX (TAILLESS) - LH',
      'MANX - SH': 'MANX (TAILLESS) - SH'
    });
  });

  test('every mapped value is a member of SHORT_HAIR_BREEDS', () => {
    for (const newName of Object.values(LEGACY_BREED_MAP)) {
      expect(SHORT_HAIR_BREEDS).toContain(newName);
    }
  });

  test('no key of the map is itself a current canonical name (renames are one-directional)', () => {
    for (const oldName of Object.keys(LEGACY_BREED_MAP)) {
      expect(SHORT_HAIR_BREEDS).not.toContain(oldName);
    }
  });
});

describe('mapLegacyBreedName()', () => {
  test('maps "BENGAL" to "BENGAL - SH"', () => {
    expect(mapLegacyBreedName('BENGAL')).toBe('BENGAL - SH');
  });

  test('maps "MANX - LH" to "MANX (TAILLESS) - LH"', () => {
    expect(mapLegacyBreedName('MANX - LH')).toBe('MANX (TAILLESS) - LH');
  });

  test('maps "MANX - SH" to "MANX (TAILLESS) - SH"', () => {
    expect(mapLegacyBreedName('MANX - SH')).toBe('MANX (TAILLESS) - SH');
  });

  test('passes a current-season name through unchanged (e.g. "SIAMESE")', () => {
    expect(mapLegacyBreedName('SIAMESE')).toBe('SIAMESE');
  });

  test('passes an unrecognized/unknown breed name through unchanged', () => {
    expect(mapLegacyBreedName('NOT A REAL BREED')).toBe('NOT A REAL BREED');
  });

  test('is idempotent: mapping an already-current name (including the new names) returns it unchanged', () => {
    expect(mapLegacyBreedName('BENGAL - SH')).toBe('BENGAL - SH');
    expect(mapLegacyBreedName('MANX (TAILLESS) - LH')).toBe('MANX (TAILLESS) - LH');
    expect(mapLegacyBreedName(mapLegacyBreedName('BENGAL'))).toBe('BENGAL - SH');
  });

  test('does not mutate its input or the LEGACY_BREED_MAP', () => {
    const before = JSON.stringify(LEGACY_BREED_MAP);
    mapLegacyBreedName('BENGAL');
    expect(JSON.stringify(LEGACY_BREED_MAP)).toBe(before);
  });
});
