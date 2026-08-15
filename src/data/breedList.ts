/**
 * Canonical CFA breed/division lists — season data, not user preference.
 *
 * These lists are the single source of truth for breeds shown in Breed Sheets
 * and written to Excel exports. They are NOT persisted to localStorage and are
 * NOT overridable by imported files: every deploy updates every user.
 *
 * 2026-27 season changes (per James Simbro, CFA Systems Administrator, 2026-08-03):
 *   - "MANX - LH"  → "MANX (TAILLESS) - LH"   (rename)
 *   - "MANX - SH"  → "MANX (TAILLESS) - SH"   (rename)
 *   - "BENGAL"     → "BENGAL - SH"            (rename; all pre-2026 Bengals were SH division)
 *   - "MANX (TAILED) - LH", "MANX (TAILED) - SH", "BENGAL - LH"  (new divisions)
 *
 * All Manx and Bengal divisions live in the SHORT HAIR list, matching the CFA
 * convention already used for other LH divisions of shorthair breeds
 * (e.g. "MANX - LH" historically, "JAPANESE BOBTAIL - LH", "ORIENTAL - LH").
 */

export const SHORT_HAIR_BREEDS: string[] = [
  'ABYSSINIAN', 'AMERICAN SH', 'AMERICAN WH', 'BALINESE', 'BALINESE-JAVANESE',
  'BENGAL - LH', 'BENGAL - SH', 'BOMBAY', 'BRITISH SH', 'BURMESE',
  'BURMILLA - LH', 'BURMILLA - SH', 'CHARTREUX', 'COLORPOINT SH', 'CORNISH REX',
  'DEVON REX', 'EGYPTIAN MAU', 'EUROPEAN BURM', 'HAVANA BROWN',
  'JAPANESE BOBTAIL - LH', 'JAPANESE BOBTAIL - SH', 'KORAT', 'LAPERM - LH',
  'LAPERM - SH', 'LYKOI', 'MANX (TAILED) - LH', 'MANX (TAILED) - SH',
  'MANX (TAILLESS) - LH', 'MANX (TAILLESS) - SH', 'OCICAT', 'ORIENTAL - LH',
  'ORIENTAL - SH', 'RUSSIAN BLUE', 'SCOTTISH FOLD - LH', 'SCOTTISH FOLD - SH',
  'SCOTTISH STRAIGHT EAR - LH', 'SCOTTISH STRAIGHT EAR - SH', 'SELKIRK REX - LH',
  'SELKIRK REX - SH', 'SIAMESE', 'SINGAPURA', 'SOMALI', 'SPHYNX', 'TONKINESE',
  'TOYBOB'
];

export const LONG_HAIR_BREEDS: string[] = [
  'AMERICAN BOBTAIL-LH', 'AMERICAN BOBTAIL-SH', 'AMERICAN CURL-LH', 'AMERICAN CURL-SH',
  'BIRMAN', 'EXOTIC SOLID', 'EXOTIC SILVER/GOLDEN', 'EXOTIC SHADED/SMOKE',
  'EXOTIC TABBY', 'EXOTIC PARTI-COLOR', 'EXOTIC CALICO/BI-COLOR', 'EXOTIC POINTED',
  'MAINE COON CAT', 'NORWEGIAN FOREST CAT', 'PERSIAN SOLID', 'PERSIAN SILVER/GOLDEN',
  'PERSIAN SHADED/SMOKE', 'PERSIAN TABBY', 'PERSIAN PARTI-COLOR', 'PERSIAN CALICO/BI-COLOR',
  'PERSIAN HIMALAYAN', 'RAGAMUFFIN', 'RAGDOLL', 'SIBERIAN', 'TURKISH ANGORA', 'TURKISH VAN'
];

/**
 * Legacy → current breed-name mapping for files saved before the 2026-27 update.
 * All three renames are 1:1: LH Bengals and Tailed Manx were not judged divisions
 * before this season, so every historical record maps to exactly one new name.
 */
export const LEGACY_BREED_MAP: Record<string, string> = {
  'BENGAL': 'BENGAL - SH',
  'MANX - LH': 'MANX (TAILLESS) - LH',
  'MANX - SH': 'MANX (TAILLESS) - SH'
};

/**
 * Translate a breed name from an old file to its current canonical name.
 * Unknown and already-current names pass through unchanged (idempotent).
 */
export function mapLegacyBreedName(name: string): string {
  return LEGACY_BREED_MAP[name] ?? name;
}
