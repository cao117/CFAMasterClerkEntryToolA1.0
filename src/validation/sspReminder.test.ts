import { describe, test, expect } from '@jest/globals';
import { validateChampionshipTab, type ChampionshipValidationInput } from './championshipValidation';
import { validatePremiershipTab, type PremiershipValidationInput } from './premiershipValidation';

/**
 * SSP cross-column validation coverage (MCE-3, MCE-4, MCE-4b, MCE-5).
 *
 * Super Specialty rings keep LH/SH bests in SEPARATE specialty columns; the AB column holds only
 * Best AB. Validators must read LH/SH from the specialty columns and the AB list from the sibling
 * AB column — never from the AB column's own (live-empty) LH/SH sub-sections.
 *
 * ASSERTION DISCIPLINE (why these tests are cell-specific):
 * Several distinct rules emit the substring "out of order". A test that asks "does any 'out of
 * order' message exist?" can pass for the WRONG rule — that is exactly how the MCE-4 PR miss hid
 * (the show-awards cross-column rule fired while the finals AB-subsequence rule silently didn't).
 * So order tests here assert a SPECIFIC cell key carries the SPECIFIC rule's wording:
 *   - finals AB-subsequence / filler rule  -> "Must preserve the order from Best AB" / "above all fillers"
 *   - show-awards cross-column rule         -> "...order from Longhair column" (bare show-award keys)
 * Matching the finals wording + the section-prefixed cell key isolates the rule under test.
 *
 * COVERAGE MODEL (targeted by error-class & partition, not volume):
 *   error classes : subsequence-violation | filler-before-AB | valid(clean)
 *   partitions     : SSP-LH | SSP-SH | plain-Allbreed | standalone-specialty(no AB) | 5-position
 * Simple single-condition checks (reminder presence/absence) get presence + absence + precedence.
 */

const J = (id: number, specialty: string, ringType?: string) =>
  ({ judge: { id, name: 'J' + id, acronym: 'J' + id, ringType: ringType ?? specialty }, specialty });
const sa = (colIdx: number, cats: string[], status = 'CH') => {
  const o: Record<string, { catNumber: string; status: string }> = {};
  cats.forEach((c, i) => { o[`${colIdx}-${i}`] = { catNumber: c, status }; });
  return o;
};

// --- rule-specific matchers ---------------------------------------------------------------------
const REMINDER = /needs to be assigned to either LH or SH/;
const INCONSISTENCY = /Finals inconsistency|Missing (Longhair|Shorthair) finals cat/;
// The finals AB-subsequence / filler order rule (the one fixed by MCE-4 / MCE-4b). Deliberately
// NOT a bare /out of order/ — that also matches the show-awards cross-column rule.
const FINALS_ORDER = /Must preserve the order from Best AB|must be above all fillers/;
const CROSS_DUP = /Cat #\d+ cannot be both longhair and shorthair/;  // finals + show-awards both name the cat now

const reminderAt = (e: Record<string, string>, key: string) => REMINDER.test(e[key] ?? '');
const hasReminder = (e: Record<string, string>) => Object.values(e).some(m => REMINDER.test(m));
const hasInconsistency = (e: Record<string, string>) => Object.values(e).some(m => INCONSISTENCY.test(m));
const finalsOrderAt = (e: Record<string, string>, key: string) => FINALS_ORDER.test(e[key] ?? '');
const finalsOrderKeys = (e: Record<string, string>) => Object.keys(e).filter(k => FINALS_ORDER.test(e[k]));

// ============================== Championship ====================================================
const CC = { lhGcs: 4, shGcs: 4, lhChs: 4, shChs: 4, lhNovs: 0, shNovs: 0 };           // -> 3 positions
const CC5 = { lhGcs: 50, shGcs: 50, lhChs: 50, shChs: 50, lhNovs: 0, shNovs: 0 };      // -> 5 positions
function ch(p: Partial<ChampionshipValidationInput>, counts = CC): ChampionshipValidationInput {
  return {
    columns: [], showAwards: {}, championsFinals: {}, lhChampionsFinals: {}, shChampionsFinals: {},
    championshipTotal: 16, championshipCounts: counts,
    voidedShowAwards: {}, voidedChampionsFinals: {}, voidedLHChampionsFinals: {}, voidedSHChampionsFinals: {},
    ...p,
  } as ChampionshipValidationInput;
}
const SSP3 = () => [J(1, 'Longhair', 'Super Specialty'), J(1, 'Shorthair', 'Super Specialty'), J(1, 'Allbreed', 'Super Specialty')];

describe('CH reminder (assignment) — SSP reads specialty columns', () => {
  test('AB CH cat present in the LH specialty column -> no reminder', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['11']), ...sa(2, ['11']) }, lhChampionsFinals: { '0-0': '11' }, championsFinals: { '2-0': '11' } }), 450);
    expect(hasReminder(e)).toBe(false);
  });
  test('AB CH cat present in the SH specialty column -> no reminder', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(1, ['14']), ...sa(2, ['14']) }, shChampionsFinals: { '1-0': '14' }, championsFinals: { '2-0': '14' } }), 450);
    expect(hasReminder(e)).toBe(false);
  });
  test('AB CH cat in neither specialty column -> reminder on that AB cell', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(2, ['99']) }, championsFinals: { '2-0': '99' } }), 450);
    expect(reminderAt(e, 'champions-2-0')).toBe(true);
  });
  test('plain Allbreed: own LH -> no reminder; own SH -> no reminder; neither -> reminder on AB cell', () => {
    expect(hasReminder(validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['1']), championsFinals: { '0-0': '1' }, lhChampionsFinals: { '0-0': '1' } }), 450))).toBe(false);
    expect(hasReminder(validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['1']), championsFinals: { '0-0': '1' }, shChampionsFinals: { '0-0': '1' } }), 450))).toBe(false);
    expect(reminderAt(validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['1']), championsFinals: { '0-0': '1' } }), 450), 'champions-0-0')).toBe(true);
  });
  test('higher-precedence error (duplicate) suppresses the reminder on that cell', () => {
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['5']), championsFinals: { '0-0': '5', '0-1': '5' } }), 450);
    expect(e['champions-0-0']).toMatch(/Duplicate/);
    expect(reminderAt(e, 'champions-0-0')).toBe(false);
  });
});

describe('CH finals order — AB-subsequence rule, per error-class & partition', () => {
  // -- subsequence-violation class --
  test('SSP-LH: LH finals not a subsequence of AB -> error on the offending LH cell', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['11', '13']), ...sa(2, ['11', '13']) }, lhChampionsFinals: { '0-0': '13', '0-1': '11' }, championsFinals: { '2-0': '11', '2-1': '13' } }), 450);
    expect(e['lhChampions-0-1']).toMatch(/out of order in LH CH.*Best AB CH.*subsequence/);
  });
  test('SSP-SH: SH finals not a subsequence of AB -> error on the offending SH cell', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(1, ['12', '14']), ...sa(2, ['12', '14']) }, shChampionsFinals: { '1-0': '14', '1-1': '12' }, championsFinals: { '2-0': '12', '2-1': '14' } }), 450);
    expect(e['shChampions-1-1']).toMatch(/out of order in SH CH.*Best AB CH.*subsequence/);
  });
  test('plain-Allbreed: subsequence violated in the single column -> error on the LH cell', () => {
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['11', '13']), championsFinals: { '0-0': '11', '0-1': '13' }, lhChampionsFinals: { '0-0': '13', '0-1': '11' } }), 450);
    expect(e['lhChampions-0-1']).toMatch(/Best AB CH.*subsequence/);
  });
  test('5-position SSP ring: subsequence rule still fires on the offending cell', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['13', '11']), ...sa(2, ['11', '13']) }, lhChampionsFinals: { '0-0': '13', '0-1': '11' }, championsFinals: { '2-0': '11', '2-1': '13' } }, CC5), 450);
    expect(e['lhChampions-0-1']).toMatch(/Best AB CH.*subsequence/);
  });

  // -- filler-before-AB class (distinct error mode) --
  test('SSP-LH: a filler placed before an AB CH cat -> "above all fillers" on the AB cell', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['88', '11']), ...sa(2, ['11']) }, lhChampionsFinals: { '0-0': '88', '0-1': '11' }, championsFinals: { '2-0': '11' } }), 450);
    expect(e['lhChampions-0-1']).toMatch(/11 \(AB CH\) must be above all fillers in LH CH/);
  });

  // -- valid (clean) class --
  test('SSP-LH: valid subsequence + filler after all AB cats -> no finals-order error anywhere', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['11', '13', '88']), ...sa(2, ['11', '13']) }, lhChampionsFinals: { '0-0': '11', '0-1': '13', '0-2': '88' }, championsFinals: { '2-0': '11', '2-1': '13' } }), 450);
    expect(finalsOrderKeys(e)).toEqual([]);
  });
  test('standalone Longhair (no AB sibling): AB-subsequence rule must NOT fire (no-regression)', () => {
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Longhair')], showAwards: sa(0, ['13', '11']), lhChampionsFinals: { '0-0': '13', '0-1': '11' } }), 450);
    expect(finalsOrderKeys(e)).toEqual([]);
  });
});

describe('CH — multiple SSP rings & mixed ring types (cell-specific)', () => {
  test('two SSP rings: only the offending ring\'s cell carries the finals-order error', () => {
    const cols = [
      J(1, 'Longhair', 'Super Specialty'), J(1, 'Shorthair', 'Super Specialty'), J(1, 'Allbreed', 'Super Specialty'),
      J(2, 'Longhair', 'Super Specialty'), J(2, 'Shorthair', 'Super Specialty'), J(2, 'Allbreed', 'Super Specialty'),
    ];
    const e = validateChampionshipTab(ch({
      columns: cols,
      showAwards: { ...sa(0, ['11']), ...sa(2, ['11']), ...sa(3, ['23', '21']), ...sa(5, ['21', '23']) },
      lhChampionsFinals: { '0-0': '11', '3-0': '23', '3-1': '21' },
      championsFinals: { '2-0': '11', '5-0': '21', '5-1': '23' },
    }), 450);
    expect(finalsOrderAt(e, 'lhChampions-3-1')).toBe(true);                 // ring2 violates
    expect(finalsOrderKeys(e).filter(k => k.startsWith('lhChampions-0'))).toEqual([]);  // ring1 clean
  });
  test('mixed (Allbreed + SSP + OCP): resolver uses the SSP judge\'s own AB column by judge id', () => {
    // col0 AB(j1) | col1 LH(j2) col2 SH(j2) col3 AB(j2) | col4 AB(j3 OCP) col5 OCP(j3)
    const cols = [
      J(1, 'Allbreed'),
      J(2, 'Longhair', 'Super Specialty'), J(2, 'Shorthair', 'Super Specialty'), J(2, 'Allbreed', 'Super Specialty'),
      J(3, 'Allbreed', 'OCP Ring'), J(3, 'OCP', 'OCP Ring'),
    ];
    const e = validateChampionshipTab(ch({
      columns: cols,
      showAwards: { ...sa(0, ['1']), ...sa(1, ['23', '21']), ...sa(3, ['21', '23']), ...sa(4, ['41']) },
      lhChampionsFinals: { '1-0': '23', '1-1': '21' },   // j2 LH reversed vs j2 AB(col3)
      championsFinals: { '0-0': '1', '3-0': '21', '3-1': '23', '4-0': '41' },
    }), 450);
    expect(e['lhChampions-1-1']).toMatch(/Best AB CH.*subsequence/);
  });
});

describe('CH — removed finals-consistency never reappears', () => {
  test('SSP split entry produces no Finals inconsistency error', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['11', '13']), ...sa(1, ['14']), ...sa(2, ['11', '14', '13']) }, lhChampionsFinals: { '0-0': '11', '0-1': '13' }, shChampionsFinals: { '1-0': '14' }, championsFinals: { '2-0': '11', '2-1': '14', '2-2': '13' } }), 450);
    expect(hasInconsistency(e)).toBe(false);
  });
});

describe('CH — live vs import equivalence (AB sub-sections empty vs populated)', () => {
  test('valid SSP ring: no reminder / finals-order / inconsistency whether AB.lh/sh is empty (live) or a copy (import)', () => {
    const cols = SSP3();
    const showAwards = { ...sa(0, ['11', '13']), ...sa(1, ['14']), ...sa(2, ['11', '14', '13']) };
    const live = validateChampionshipTab(ch({ columns: cols, showAwards, lhChampionsFinals: { '0-0': '11', '0-1': '13' }, shChampionsFinals: { '1-0': '14' }, championsFinals: { '2-0': '11', '2-1': '14', '2-2': '13' } }), 450);
    const imported = validateChampionshipTab(ch({ columns: cols, showAwards, lhChampionsFinals: { '0-0': '11', '0-1': '13', '2-0': '11', '2-1': '13' }, shChampionsFinals: { '1-0': '14', '2-0': '14' }, championsFinals: { '2-0': '11', '2-1': '14', '2-2': '13' } }), 450);
    for (const probe of [hasReminder, hasInconsistency]) {
      expect(probe(live)).toBe(false);
      expect(probe(imported)).toBe(false);
    }
    expect(finalsOrderKeys(live)).toEqual([]);
    expect(finalsOrderKeys(imported)).toEqual([]);
  });
});

describe('CH edge cases', () => {
  test('voided AB CH cat is ignored (no reminder)', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(2, ['11']) }, championsFinals: { '2-0': 'VOID' } }), 450);
    expect(hasReminder(e)).toBe(false);
  });
  test('per-class SSP: a globally-SSP judge with only an AB column in this tab is treated as plain Allbreed', () => {
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Allbreed', 'Super Specialty')], showAwards: sa(0, ['1']), championsFinals: { '0-0': '1' } }), 450);
    expect(reminderAt(e, 'champions-0-0')).toBe(true);
  });
});

describe('CH — SSP cross-column finals duplicate (Best LH CH vs Best SH CH) (MCE-5)', () => {
  test('same cat in Best LH CH and Best SH CH of an SSP ring -> duplicate on both finals cells', () => {
    const e = validateChampionshipTab(ch({
      columns: SSP3(),
      showAwards: { ...sa(0, ['11']), ...sa(1, ['11']), ...sa(2, ['11']) },
      lhChampionsFinals: { '0-0': '11' }, shChampionsFinals: { '1-0': '11' }, championsFinals: { '2-0': '11' },
    }), 450);
    expect(e['lhChampions-0-0']).toMatch(CROSS_DUP);
    expect(e['shChampions-1-0']).toMatch(CROSS_DUP);
  });
  test('different cats in Best LH CH and Best SH CH -> no cross-column finals duplicate', () => {
    const e = validateChampionshipTab(ch({
      columns: SSP3(),
      showAwards: { ...sa(0, ['11']), ...sa(1, ['12']), ...sa(2, ['11', '12']) },
      lhChampionsFinals: { '0-0': '11' }, shChampionsFinals: { '1-0': '12' }, championsFinals: { '2-0': '11', '2-1': '12' },
    }), 450);
    expect(Object.entries(e).filter(([k, m]) => /^(lhChampions|shChampions)-/.test(k) && CROSS_DUP.test(m))).toEqual([]);
  });
  test('plain Allbreed single-column LH/SH finals duplicate still caught (regression guard)', () => {
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['11']), championsFinals: { '0-0': '11' }, lhChampionsFinals: { '0-0': '11' }, shChampionsFinals: { '0-0': '11' } }), 450);
    expect(Object.values(e).some(m => CROSS_DUP.test(m))).toBe(true);
  });
});

// ============================== Premiership =====================================================
const PC = { gps: 0, lhGps: 5, shGps: 5, lhPrs: 5, shPrs: 5, lhNovs: 0, shNovs: 0, novs: 0, prs: 10 };
function pr(p: Partial<PremiershipValidationInput>): PremiershipValidationInput {
  return {
    columns: [], showAwards: {}, premiersFinals: {}, abPremiersFinals: {}, lhPremiersFinals: {}, shPremiersFinals: {},
    premiershipTotal: 20, premiershipCounts: PC,
    voidedShowAwards: {}, voidedPremiersFinals: {}, voidedABPremiersFinals: {}, voidedLHPremiersFinals: {}, voidedSHPremiersFinals: {},
    ...p,
  } as PremiershipValidationInput;
}

describe('PR reminder (assignment) — SSP reads specialty columns', () => {
  test('split entry: no false reminder, no finals-inconsistency', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(0, ['11'], 'PR'), ...sa(1, ['14'], 'PR'), ...sa(2, ['11', '14'], 'PR') }, lhPremiersFinals: { '0-0': '11' }, shPremiersFinals: { '1-0': '14' }, abPremiersFinals: { '2-0': '11', '2-1': '14' } }), 450);
    expect(hasReminder(e)).toBe(false);
    expect(hasInconsistency(e)).toBe(false);
  });
  test('genuinely unassigned AB PR cat -> reminder on that AB cell', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(2, ['99'], 'PR') }, abPremiersFinals: { '2-0': '99' } }), 450);
    expect(reminderAt(e, 'abPremiersFinals-2-0')).toBe(true);
  });
  test('AB PR cat in SH specialty -> no reminder (SH coverage)', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(1, ['14'], 'PR'), ...sa(2, ['14'], 'PR') }, shPremiersFinals: { '1-0': '14' }, abPremiersFinals: { '2-0': '14' } }), 450);
    expect(hasReminder(e)).toBe(false);
  });
});

describe('PR finals order — AB-subsequence rule, per error-class & partition (MCE-4b)', () => {
  // Headline regression for MCE-4b: show-awards are in the SAME order in LH and AB (so the
  // show-awards cross-column rule stays SILENT); only the Best AB PR *finals* are reversed. The
  // finals AB-subsequence rule is therefore the ONLY thing that can flag the LH cell. This test
  // FAILS on the pre-MCE-4b code (the check was gated behind specialty==='Allbreed' and never ran).
  test('SSP-LH (isolated): finals reversed vs Best AB while show-awards agree -> error from the finals rule only', () => {
    const e = validatePremiershipTab(pr({
      columns: SSP3(),
      showAwards: { ...sa(0, ['1', '2'], 'PR'), ...sa(2, ['1', '2'], 'PR') },
      lhPremiersFinals: { '0-0': '1', '0-1': '2' },     // matches LH show-awards -> top-15 (A) clean
      abPremiersFinals: { '2-0': '2', '2-1': '1' },     // Best AB PR reversed -> subsequence (B) violated
    }), 450);
    expect(e['lhPremiersFinals-0-1']).toMatch(/out of order in lh PR.*Best AB PR.*subsequence/);
    expect(Object.values(e).some(m => /order from Longhair column/.test(m))).toBe(false); // show-awards rule did NOT fire
  });
  test('SSP-SH: SH finals not a subsequence of AB -> error on the offending SH cell', () => {
    const e = validatePremiershipTab(pr({
      columns: SSP3(),
      showAwards: { ...sa(1, ['3', '4'], 'PR'), ...sa(2, ['3', '4'], 'PR') },
      shPremiersFinals: { '1-0': '3', '1-1': '4' },
      abPremiersFinals: { '2-0': '4', '2-1': '3' },
    }), 450);
    expect(e['shPremiersFinals-1-1']).toMatch(/out of order in sh PR.*Best AB PR.*subsequence/);
  });
  test('plain-Allbreed: subsequence violated in the single column -> error on the LH cell', () => {
    const e = validatePremiershipTab(pr({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['11', '13'], 'PR'), abPremiersFinals: { '0-0': '11', '0-1': '13' }, lhPremiersFinals: { '0-0': '13', '0-1': '11' } }), 450);
    expect(e['lhPremiersFinals-0-1']).toMatch(/Best AB PR.*subsequence/);
  });
  test('SSP-SH: a filler placed before an AB PR cat -> "above all fillers" on the AB cell', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(1, ['88', '14'], 'PR'), ...sa(2, ['14'], 'PR') }, shPremiersFinals: { '1-0': '88', '1-1': '14' }, abPremiersFinals: { '2-0': '14' } }), 450);
    expect(e['shPremiersFinals-1-1']).toMatch(/14 \(AB PR\) must be above all fillers in sh PR/);
  });
  test('SSP-LH: valid subsequence -> no finals-order error anywhere', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(0, ['11', '13'], 'PR'), ...sa(2, ['11', '13'], 'PR') }, lhPremiersFinals: { '0-0': '11', '0-1': '13' }, abPremiersFinals: { '2-0': '11', '2-1': '13' } }), 450);
    expect(finalsOrderKeys(e)).toEqual([]);
  });
  test('standalone Longhair (no AB sibling): AB-subsequence rule must NOT fire (no-regression)', () => {
    const e = validatePremiershipTab(pr({ columns: [J(1, 'Longhair')], showAwards: sa(0, ['13', '11'], 'PR'), lhPremiersFinals: { '0-0': '13', '0-1': '11' } }), 450);
    expect(finalsOrderKeys(e)).toEqual([]);
  });
});

describe('PR — SSP cross-column finals duplicate (Best LH PR vs Best SH PR) (MCE-5)', () => {
  test('same cat in Best LH PR and Best SH PR of an SSP ring -> duplicate on both finals cells', () => {
    const e = validatePremiershipTab(pr({
      columns: SSP3(),
      showAwards: { ...sa(0, ['11'], 'PR'), ...sa(1, ['11'], 'PR'), ...sa(2, ['11'], 'PR') },
      lhPremiersFinals: { '0-0': '11' }, shPremiersFinals: { '1-0': '11' }, abPremiersFinals: { '2-0': '11' },
    }), 450);
    expect(e['lhPremiersFinals-0-0']).toMatch(CROSS_DUP);
    expect(e['shPremiersFinals-1-0']).toMatch(CROSS_DUP);
  });
  test('different cats in Best LH PR and Best SH PR -> no cross-column finals duplicate', () => {
    const e = validatePremiershipTab(pr({
      columns: SSP3(),
      showAwards: { ...sa(0, ['11'], 'PR'), ...sa(1, ['12'], 'PR'), ...sa(2, ['11', '12'], 'PR') },
      lhPremiersFinals: { '0-0': '11' }, shPremiersFinals: { '1-0': '12' }, abPremiersFinals: { '2-0': '11', '2-1': '12' },
    }), 450);
    expect(Object.entries(e).filter(([k, m]) => /^(lhPremiersFinals|shPremiersFinals)-/.test(k) && CROSS_DUP.test(m))).toEqual([]);
  });
});
