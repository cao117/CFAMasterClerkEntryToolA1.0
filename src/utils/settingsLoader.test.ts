import { describe, test, expect } from '@jest/globals';
import {
  loadGlobalSettings,
  withCanonicalBreeds,
  serializeSettingsForStorage
} from './settingsLoader';
import type { GlobalSettings } from './settingsLoader';
import { SHORT_HAIR_BREEDS, LONG_HAIR_BREEDS } from '../data/breedList';

/**
 * Area D — localStorage breed-list migration.
 *
 * App.tsx's globalSettings useState initializer (src/App.tsx lines ~134-162)
 * is planned to be extracted into this pure `loadGlobalSettings(raw, defaults)`
 * function so it is unit-testable without mounting React. src/utils/settingsLoader.ts
 * already exists in the repo with exactly this signature — these tests pin down
 * its migration contract for the 2026-27 breed-list change.
 */

const DEFAULTS: GlobalSettings = {
  max_judges: 12,
  max_cats: 450,
  placement_thresholds: {
    championship: 85,
    kitten: 75,
    premiership: 50,
    household_pet: 50
  },
  short_hair_breeds: [...SHORT_HAIR_BREEDS],
  long_hair_breeds: [...LONG_HAIR_BREEDS],
  numberOfSaves: 3,
  saveCycle: 5
};

/** A blob shaped like what a pre-2026-27 client would have written to localStorage. */
function legacyStoredBlob(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    max_judges: 12,
    max_cats: 450,
    placement_thresholds: {
      championship: 90, // customized by the clerk
      kitten: 75,
      premiership: 50,
      household_pet: 50
    },
    short_hair_breeds: [
      'ABYSSINIAN', 'AMERICAN SH', 'BENGAL', 'MANX - LH', 'MANX - SH', 'SIAMESE'
    ],
    long_hair_breeds: ['BIRMAN', 'RAGDOLL'],
    numberOfSaves: 7,
    saveCycle: 15,
    ...overrides
  });
}

describe('loadGlobalSettings() — localStorage migration', () => {
  test('a legacy stored blob with old breed arrays yields canonical breed lists, not the stored ones', () => {
    const result = loadGlobalSettings(legacyStoredBlob(), DEFAULTS);
    expect(result.short_hair_breeds).toEqual(SHORT_HAIR_BREEDS);
    expect(result.long_hair_breeds).toEqual(LONG_HAIR_BREEDS);
  });

  test('preserves a custom threshold from the stored blob (non-breed user preferences survive)', () => {
    const result = loadGlobalSettings(legacyStoredBlob(), DEFAULTS);
    expect(result.placement_thresholds.championship).toBe(90);
  });

  test('preserves custom auto-save preferences (numberOfSaves, saveCycle) from the stored blob', () => {
    const result = loadGlobalSettings(legacyStoredBlob(), DEFAULTS);
    expect(result.numberOfSaves).toBe(7);
    expect(result.saveCycle).toBe(15);
  });

  test('preserves unmodified threshold fields via merge with defaults', () => {
    const result = loadGlobalSettings(legacyStoredBlob(), DEFAULTS);
    expect(result.placement_thresholds.kitten).toBe(75);
    expect(result.placement_thresholds.premiership).toBe(50);
  });

  test('no stored value (null, first run) returns defaults with canonical breed lists', () => {
    const result = loadGlobalSettings(null, DEFAULTS);
    expect(result.short_hair_breeds).toEqual(SHORT_HAIR_BREEDS);
    expect(result.long_hair_breeds).toEqual(LONG_HAIR_BREEDS);
    expect(result.max_judges).toBe(12);
  });

  test('corrupt/unparseable JSON falls back to defaults with canonical breed lists rather than throwing', () => {
    expect(() => loadGlobalSettings('{not valid json', DEFAULTS)).not.toThrow();
    const result = loadGlobalSettings('{not valid json', DEFAULTS);
    expect(result.short_hair_breeds).toEqual(SHORT_HAIR_BREEDS);
  });

  test('a stored blob already using new-format breed names still normalizes to the exact canonical arrays', () => {
    const newFormatBlob = JSON.stringify({
      max_judges: 12,
      max_cats: 450,
      placement_thresholds: DEFAULTS.placement_thresholds,
      short_hair_breeds: [...SHORT_HAIR_BREEDS], // already current
      long_hair_breeds: [...LONG_HAIR_BREEDS],
      numberOfSaves: 3,
      saveCycle: 5
    });
    const result = loadGlobalSettings(newFormatBlob, DEFAULTS);
    expect(result.short_hair_breeds).toEqual(SHORT_HAIR_BREEDS);
    expect(result.long_hair_breeds).toEqual(LONG_HAIR_BREEDS);
  });

  test('a stored blob missing breed arrays entirely still yields canonical lists (does not crash on undefined)', () => {
    const noBreedsBlob = JSON.stringify({ max_judges: 20, max_cats: 500 });
    const result = loadGlobalSettings(noBreedsBlob, DEFAULTS);
    expect(result.short_hair_breeds).toEqual(SHORT_HAIR_BREEDS);
    expect(result.long_hair_breeds).toEqual(LONG_HAIR_BREEDS);
    expect(result.max_judges).toBe(20);
  });
});

describe('withCanonicalBreeds()', () => {
  test('overwrites arbitrary breed arrays on any settings-shaped object with the canonical lists', () => {
    const input = { max_judges: 5, short_hair_breeds: ['BENGAL'], long_hair_breeds: ['BIRMAN'] };
    const result = withCanonicalBreeds(input);
    expect(result.short_hair_breeds).toEqual(SHORT_HAIR_BREEDS);
    expect(result.long_hair_breeds).toEqual(LONG_HAIR_BREEDS);
    expect(result.max_judges).toBe(5);
  });

  test('does not mutate the input object', () => {
    const input = { short_hair_breeds: ['BENGAL'], long_hair_breeds: [] };
    const before = JSON.stringify(input);
    withCanonicalBreeds(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe('serializeSettingsForStorage() — persisted blob no longer carries breed arrays', () => {
  test('the serialized JSON omits short_hair_breeds and long_hair_breeds keys', () => {
    const serialized = serializeSettingsForStorage(DEFAULTS);
    const parsed = JSON.parse(serialized);
    expect(parsed).not.toHaveProperty('short_hair_breeds');
    expect(parsed).not.toHaveProperty('long_hair_breeds');
  });

  test('the serialized JSON still carries non-breed user preferences', () => {
    const serialized = serializeSettingsForStorage(DEFAULTS);
    const parsed = JSON.parse(serialized);
    expect(parsed.max_judges).toBe(12);
    expect(parsed.max_cats).toBe(450);
    expect(parsed.placement_thresholds).toEqual(DEFAULTS.placement_thresholds);
    expect(parsed.numberOfSaves).toBe(3);
    expect(parsed.saveCycle).toBe(5);
  });

  test('round-trip: serialize then loadGlobalSettings still yields canonical breed lists', () => {
    const serialized = serializeSettingsForStorage(DEFAULTS);
    const result = loadGlobalSettings(serialized, DEFAULTS);
    expect(result.short_hair_breeds).toEqual(SHORT_HAIR_BREEDS);
    expect(result.long_hair_breeds).toEqual(LONG_HAIR_BREEDS);
  });
});
