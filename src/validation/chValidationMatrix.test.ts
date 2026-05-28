import { describe, test, expect } from '@jest/globals';
import { validateChampionshipTab, type ChampionshipValidationInput } from './championshipValidation';

/**
 * Full execution-order regression matrix for the Championship validation surface.
 * Each rule gets a TRIGGER case (error must appear) and a CLEAN case (must not).
 * Verifies all rules actually work — not only the SSP-touched ones.
 */
const CC = { lhGcs: 4, shGcs: 4, lhChs: 4, shChs: 4, lhNovs: 0, shNovs: 0 };
const J = (id: number, specialty: string, ringType?: string) =>
  ({ judge: { id, name: 'J' + id, acronym: 'J' + id, ringType: ringType ?? specialty }, specialty });
function ch(p: Partial<ChampionshipValidationInput>): ChampionshipValidationInput {
  return {
    columns: [J(1, 'Allbreed')], showAwards: {}, championsFinals: {}, lhChampionsFinals: {}, shChampionsFinals: {},
    championshipTotal: 16, championshipCounts: CC,
    voidedShowAwards: {}, voidedChampionsFinals: {}, voidedLHChampionsFinals: {}, voidedSHChampionsFinals: {},
    ...p,
  } as ChampionshipValidationInput;
}
// showAwards with explicit status
const SA = (colIdx: number, rows: [string, string][]) => {
  const o: Record<string, { catNumber: string; status: string }> = {};
  rows.forEach(([cat, st], i) => { o[`${colIdx}-${i}`] = { catNumber: cat, status: st }; });
  return o;
};
const E = (i: Partial<ChampionshipValidationInput>) => validateChampionshipTab(ch(i), 450);
const has = (e: Record<string, string>, re: RegExp) => Object.values(e).some(m => re.test(m));
const SSP3 = () => [J(1, 'Longhair', 'Super Specialty'), J(1, 'Shorthair', 'Super Specialty'), J(1, 'Allbreed', 'Super Specialty')];

describe('Phase 1 — Show Awards', () => {
  test('R1 range', () => {
    expect(has(E({ showAwards: SA(0, [['9999', 'CH']]) }), /between 1-450/)).toBe(true);
    expect(has(E({ showAwards: SA(0, [['5', 'CH']]) }), /between 1-450/)).toBe(false);
  });
  test('R2 duplicate', () => {
    expect(has(E({ showAwards: SA(0, [['5', 'CH'], ['5', 'CH']]) }), /already placed in another position\./)).toBe(true);
    expect(has(E({ showAwards: SA(0, [['5', 'CH'], ['6', 'CH']]) }), /already placed in another position\./)).toBe(false);
  });
  test('R3 sequential', () => {
    expect(has(E({ showAwards: { '0-0': { catNumber: '', status: '' }, '0-1': { catNumber: '5', status: 'CH' } } }), /fill previous placements/)).toBe(true);
    expect(has(E({ showAwards: SA(0, [['5', 'CH'], ['6', 'CH']]) }), /fill previous placements/)).toBe(false);
  });
});

describe('Phase 2 — Finals', () => {
  test('R4 finals range', () => {
    expect(has(E({ showAwards: SA(0, [['5', 'CH']]), championsFinals: { '0-0': '9999' } }), /between 1-450/)).toBe(true);
  });
  test('R5 finals duplicate', () => {
    expect(has(E({ showAwards: SA(0, [['5', 'CH'], ['6', 'CH']]), championsFinals: { '0-0': '5', '0-1': '5' } }), /already placed in another finals position/)).toBe(true);
    expect(has(E({ showAwards: SA(0, [['5', 'CH'], ['6', 'CH']]), championsFinals: { '0-0': '5', '0-1': '6' } }), /already placed in another finals position/)).toBe(false);
  });
  test('R6 cross-section dup (LH CH vs SH CH, Allbreed)', () => {
    expect(has(E({ showAwards: SA(0, [['7', 'CH'], ['8', 'CH']]), lhChampionsFinals: { '0-0': '7' }, shChampionsFinals: { '0-0': '7' } }), /cannot be both longhair and shorthair/)).toBe(true);
    expect(has(E({ showAwards: SA(0, [['7', 'CH'], ['8', 'CH']]), lhChampionsFinals: { '0-0': '7' }, shChampionsFinals: { '0-0': '8' } }), /cannot be both longhair and shorthair/)).toBe(false);
  });
  test('R7 finals status (GC/NOV cannot be CH final)', () => {
    expect(has(E({ showAwards: SA(0, [['5', 'GC']]), championsFinals: { '0-0': '5' } }), /listed as a GC in Show Awards and cannot be awarded CH final/)).toBe(true);
    expect(has(E({ showAwards: SA(0, [['5', 'CH']]), championsFinals: { '0-0': '5' }, lhChampionsFinals: { '0-0': '5' } }), /cannot be awarded CH final/)).toBe(false);
  });
  test('R8 finals sequential', () => {
    expect(has(E({ showAwards: SA(0, [['5', 'CH']]), championsFinals: { '0-1': '5' } }), /fill previous placements/)).toBe(true);
  });
  test('R9 AB CH order (Nth CH required)', () => {
    expect(has(E({ showAwards: SA(0, [['10', 'CH'], ['20', 'CH']]), championsFinals: { '0-0': '20' } }), /Must be 10 .*CH required by CFA rules/)).toBe(true);
    expect(has(E({ showAwards: SA(0, [['10', 'CH'], ['20', 'CH']]), championsFinals: { '0-0': '10' } }), /CH required by CFA rules/)).toBe(false);
  });
  test('R10 LH/SH order subsequence (Allbreed)', () => {
    expect(has(E({ showAwards: SA(0, [['11', 'CH'], ['13', 'CH']]), championsFinals: { '0-0': '11', '0-1': '13' }, lhChampionsFinals: { '0-0': '13', '0-1': '11' } }), /out of order in LH CH.*subsequence required/)).toBe(true);
  });
  test('R11 LH/SH filler priority (Allbreed)', () => {
    expect(has(E({ showAwards: SA(0, [['11', 'CH'], ['88', 'CH']]), championsFinals: { '0-0': '11' }, lhChampionsFinals: { '0-0': '88', '0-1': '11' } }), /must be above all fillers|out of order/)).toBe(true);
  });
  test('R12 assignment reminder (Allbreed)', () => {
    expect(has(E({ showAwards: SA(0, [['5', 'CH']]), championsFinals: { '0-0': '5' } }), /needs to be assigned to either LH or SH CH final/)).toBe(true);
    expect(has(E({ showAwards: SA(0, [['5', 'CH']]), championsFinals: { '0-0': '5' }, lhChampionsFinals: { '0-0': '5' } }), /needs to be assigned/)).toBe(false);
  });
});

describe('Phase 3 — per-column (validateColumnRelationships)', () => {
  test('R13 LH CH status on a Longhair column', () => {
    expect(has(E({ columns: [J(1, 'Longhair')], showAwards: SA(0, [['5', 'GC']]), lhChampionsFinals: { '0-0': '5' } }), /listed as a GC in Show Awards and cannot be awarded CH final/)).toBe(true);
  });
  test('R14 single-specialty strict (Longhair, CH cat order)', () => {
    expect(has(E({ columns: [J(1, 'Longhair')], showAwards: SA(0, [['10', 'CH'], ['20', 'CH']]), lhChampionsFinals: { '0-0': '20' } }), /Must be 10 .*CH cat from championship final in order/)).toBe(true);
    expect(has(E({ columns: [J(1, 'Longhair')], showAwards: SA(0, [['10', 'CH'], ['20', 'CH']]), lhChampionsFinals: { '0-0': '10' } }), /championship final in order/)).toBe(false);
  });
});

describe('Phase 4 — OCP cross-column', () => {
  const ocp = () => [J(1, 'Allbreed', 'OCP Ring'), J(1, 'OCP', 'OCP Ring')];
  test('R15 OCP title inconsistency', () => {
    // cat 5 CH in AB show awards, GC in OCP show awards -> title inconsistency
    const e = E({ columns: ocp(), showAwards: { ...SA(0, [['5', 'CH']]), ...SA(1, [['5', 'GC']]) } });
    expect(has(e, /Title inconsistency.*OCP Ring columns/)).toBe(true);
  });
  test('R16 OCP ranked-cats priority', () => {
    // AB ranked = {5,6}; OCP col has filler 99 while ranked 5,6 are NOT placed in OCP -> violation.
    const trig = E({ columns: ocp(), showAwards: { ...SA(0, [['5', 'CH'], ['6', 'CH']]), ...SA(1, [['99', 'CH']]) } });
    expect(has(trig, /Filler cat placed before ranked cats.*OCP/)).toBe(true);
    // Clean: ranked cats placed first, filler after -> no violation.
    const clean = E({ columns: ocp(), showAwards: { ...SA(0, [['5', 'CH'], ['6', 'CH']]), ...SA(1, [['5', 'CH'], ['6', 'CH'], ['99', 'CH']]) } });
    expect(has(clean, /Filler cat placed before ranked cats/)).toBe(false);
  });
  test('R17 OCP order preservation', () => {
    // AB order [5,6]; OCP order [6,5] -> out of order in OCP
    const e = E({ columns: ocp(), showAwards: { ...SA(0, [['5', 'CH'], ['6', 'CH']]), ...SA(1, [['6', 'CH'], ['5', 'CH']]) } });
    expect(has(e, /out of order in OCP/)).toBe(true);
  });
});

describe('Phase 5 — SSP cross-column suite', () => {
  test('R18 SSP title inconsistency (CH in LH, GC in AB show awards)', () => {
    const e = E({ columns: SSP3(), showAwards: { ...SA(0, [['11', 'CH']]), ...SA(2, [['11', 'GC']]) } });
    expect(has(e, /Title inconsistency.*Super Specialty columns/)).toBe(true);
  });
  test('R19 SSP ranked-cats priority (filler before ranked in AB show awards)', () => {
    // LH ranked: 11; AB show awards: [99 (filler, not in any specialty), 11]
    const e = E({ columns: SSP3(), showAwards: { ...SA(0, [['11', 'CH']]), ...SA(2, [['99', 'CH'], ['11', 'CH']]) } });
    expect(has(e, /not ranked in specialty columns but appears in Allbreed before ranked cats/)).toBe(true);
  });
  test('R20 SSP order preservation (AB show awards out of order vs specialty)', () => {
    // LH order [11,13]; AB show awards order [13,11] -> out of order in Allbreed
    const e = E({ columns: SSP3(), showAwards: { ...SA(0, [['11', 'CH'], ['13', 'CH']]), ...SA(2, [['13', 'CH'], ['11', 'CH']]) } });
    expect(has(e, /out of order in Allbreed.*Must preserve order from/)).toBe(true);
  });
  test('R21 SSP cross-column duplicate (cat in both LH and SH show awards)', () => {
    const e = E({ columns: SSP3(), showAwards: { ...SA(0, [['7', 'CH']]), ...SA(1, [['7', 'CH']]) } });
    expect(has(e, /Cat #7 cannot be both longhair and shorthair/)).toBe(true);
  });
});
