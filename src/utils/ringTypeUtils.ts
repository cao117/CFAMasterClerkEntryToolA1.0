/**
 * Ring-type resolution utilities.
 *
 * A judge's `ringType` is a single global value, but a "Super Specialty" judge can
 * actually judge SSP format in only some classes (Championship / Premiership / Kitten)
 * and a plain Allbreed ring in the others. `sspClasses` records that per-class choice;
 * `getEffectiveRingType` collapses (ringType + sspClasses + tab) into the ring type that
 * actually applies in a given class, which drives column generation everywhere.
 *
 * Household Pet is intentionally excluded — it is always a single column regardless of
 * ring type — so it is not part of `ClassTab`.
 */

export type ClassTab = 'championship' | 'premiership' | 'kitten';

export interface SspClasses {
  championship: boolean;
  premiership: boolean;
  kitten: boolean;
}

/** Default when a judge is set to Super Specialty: SSP in every class (matches legacy behavior). */
export const SSP_CLASS_DEFAULT: SspClasses = { championship: true, premiership: true, kitten: true };

/** Minimal shape needed for ring-type resolution. */
interface RingJudge {
  ringType: string;
  sspClasses?: SspClasses;
}

/**
 * Whether the judge judges Super Specialty format in the given class.
 * Only meaningful for Super Specialty judges; `undefined` sspClasses defaults to true (all classes).
 */
export function isSspForClass(judge: RingJudge, tab: ClassTab): boolean {
  if (judge.ringType !== 'Super Specialty') return false;
  return judge.sspClasses?.[tab] ?? true;
}

/**
 * The ring type that actually applies for the judge in the given class.
 * A Super Specialty judge degrades to 'Allbreed' for any class they are not doing SSP in.
 */
export function getEffectiveRingType(judge: RingJudge, tab: ClassTab): string {
  if (judge.ringType !== 'Super Specialty') return judge.ringType;
  return isSspForClass(judge, tab) ? 'Super Specialty' : 'Allbreed';
}

/**
 * Single source of truth for per-tab column generation. Mirrors each tab's rules:
 * - Double Specialty -> 2 columns (LH, SH)
 * - Super Specialty (for this class) -> 3 columns (LH, SH, AB)
 * - OCP Ring -> AB + OCP, except Kitten which only gets AB
 * - everything else (incl. an SSP judge NOT doing SSP this class) -> 1 column of that type
 *
 * Returns columns in judge order; the array index is the columnIndex used as data key prefix.
 */
/**
 * Re-key a tab section's column-indexed data ("colIdx-pos" / "colIdx_pos") after a judge's
 * column COUNT changes in that tab. The affected judge's data is dropped; every other judge's
 * data is moved from its old column index to its new one by matching the stable
 * "judgeId-specialty" identity of each column. Pure function — easy to unit test.
 */
export function remapColumnKeyedData<T>(
  oldColumns: { judge: { id: number }; specialty: string }[],
  newColumns: { judge: { id: number }; specialty: string }[],
  affectedJudgeId: number,
  sectionData: Record<string, T>
): Record<string, T> {
  const keyOf = (c: { judge: { id: number }; specialty: string }) => `${c.judge.id}-${c.specialty}`;
  const oldIdxByKey = new Map<string, number>();
  oldColumns.forEach((c, idx) => oldIdxByKey.set(keyOf(c), idx));

  const rebuilt: Record<string, T> = {};
  newColumns.forEach((c, newIdx) => {
    if (c.judge.id === affectedJudgeId) return; // drop affected judge's data
    const oldIdx = oldIdxByKey.get(keyOf(c));
    if (oldIdx === undefined) return;
    Object.entries(sectionData).forEach(([dataKey, value]) => {
      const [colIdxStr] = dataKey.split(/[-_]/);
      if (parseInt(colIdxStr, 10) === oldIdx) {
        rebuilt[dataKey.replace(/^[0-9]+/, String(newIdx))] = value;
      }
    });
  });
  return rebuilt;
}

export function generateColumnsForTab<J extends RingJudge>(
  judges: J[],
  tab: ClassTab
): { judge: J; specialty: string }[] {
  const cols: { judge: J; specialty: string }[] = [];
  judges.forEach(judge => {
    const rt = getEffectiveRingType(judge, tab);
    if (rt === 'Double Specialty') {
      cols.push({ judge: { ...judge }, specialty: 'Longhair' });
      cols.push({ judge: { ...judge }, specialty: 'Shorthair' });
    } else if (rt === 'Super Specialty') {
      cols.push({ judge: { ...judge }, specialty: 'Longhair' });
      cols.push({ judge: { ...judge }, specialty: 'Shorthair' });
      cols.push({ judge: { ...judge }, specialty: 'Allbreed' });
    } else if (rt === 'OCP Ring') {
      cols.push({ judge: { ...judge }, specialty: 'Allbreed' });
      if (tab !== 'kitten') cols.push({ judge: { ...judge }, specialty: 'OCP' });
    } else {
      cols.push({ judge, specialty: rt });
    }
  });
  return cols;
}
