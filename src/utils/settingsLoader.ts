/**
 * Global settings load/persist helpers.
 *
 * Breed lists are canonical season data (src/data/breedList.ts) and are never
 * read from localStorage or imported files — whatever a stored/imported blob
 * contains, the runtime settings always carry the canonical lists. Only true
 * user preferences (max judges/cats, thresholds, auto-save cadence) persist.
 */

import { SHORT_HAIR_BREEDS, LONG_HAIR_BREEDS } from '../data/breedList';

export interface GlobalSettings {
  max_judges: number;
  max_cats: number;
  placement_thresholds: {
    championship: number;
    kitten: number;
    premiership: number;
    household_pet: number;
  };
  short_hair_breeds: string[];
  long_hair_breeds: string[];
  numberOfSaves: number;
  saveCycle: number;
}

/** Overwrite any breed arrays on a settings object with the canonical lists. */
export function withCanonicalBreeds<T extends object>(settings: T): T & {
  short_hair_breeds: string[];
  long_hair_breeds: string[];
} {
  return {
    ...settings,
    short_hair_breeds: [...SHORT_HAIR_BREEDS],
    long_hair_breeds: [...LONG_HAIR_BREEDS]
  };
}

/**
 * Household Pet top-15 cutoff: a saved 50 is read as 30.
 *
 * CFA Show Rule 11.32 puts the cutoff at 30 entries. Builds before MCE-9
 * shipped 50 (never a CFA rule) and wrote it to localStorage and to every
 * saved file's Settings sheet, where it overrides the built-in default. A
 * saved 50 cannot be told apart from that old default, so it is read as 30.
 * Any other saved value is kept.
 *
 * If CFA changes this cutoff — above all to 50, which this function would
 * silently turn back into 30 — follow "Changing the Cutoff" in
 * docs/validation/VALIDATION_HOUSEHOLD.md before editing the defaults.
 */
export function correctedHouseholdPetThreshold(threshold: number): number {
  return threshold === 50 ? 30 : threshold;
}

/**
 * Build runtime settings from a raw localStorage value (may be null/corrupt).
 * User preferences merge over defaults; breed lists are always canonical —
 * this silently retires breed arrays saved by pre-2026-27 versions.
 */
export function loadGlobalSettings(raw: string | null, defaults: GlobalSettings): GlobalSettings {
  if (!raw) return withCanonicalBreeds(defaults);
  try {
    const parsed = JSON.parse(raw);
    return withCanonicalBreeds({
      ...defaults,
      ...parsed,
      placement_thresholds: {
        ...defaults.placement_thresholds,
        ...parsed.placement_thresholds,
        household_pet: correctedHouseholdPetThreshold(
          parsed.placement_thresholds?.household_pet ?? defaults.placement_thresholds.household_pet
        )
      },
      numberOfSaves: parsed.numberOfSaves ?? defaults.numberOfSaves,
      saveCycle: parsed.saveCycle ?? defaults.saveCycle
    });
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
    return withCanonicalBreeds(defaults);
  }
}

/** Serialize settings for persistence, excluding the canonical breed lists. */
export function serializeSettingsForStorage(settings: GlobalSettings): string {
  const { short_hair_breeds: _sh, long_hair_breeds: _lh, ...persisted } = settings;
  return JSON.stringify(persisted);
}
