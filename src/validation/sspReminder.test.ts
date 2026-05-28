import { describe, test, expect } from '@jest/globals';
import { validateChampionshipTab, type ChampionshipValidationInput } from './championshipValidation';
import { validatePremiershipTab, type PremiershipValidationInput } from './premiershipValidation';

/**
 * Comprehensive SSP cross-column validation coverage (MCE-3 + MCE-4).
 *
 * Super Specialty rings keep LH/SH CH(PR) bests in SEPARATE specialty columns; the AB column holds
 * only Best AB CH(PR). Validators must therefore read LH/SH data from the specialty columns and the
 * AB list from the AB column — never from the AB column's own (live-empty) LH/SH sub-sections.
 *
 * Covered: assignment reminder, finals order (subsequence of AB), filler priority, removal of the
 * vacuous finals-consistency, live-vs-import equivalence, and edge cases (voids, 5-position breakoff,
 * multiple SSP rings, mixed-ring column offsets, per-class single-AB column, standalone specialty).
 */

const J = (id: number, specialty: string, ringType?: string) =>
  ({ judge: { id, name: 'J' + id, acronym: 'J' + id, ringType: ringType ?? specialty }, specialty });
const sa = (colIdx: number, cats: string[], status = 'CH') => {
  const o: Record<string, { catNumber: string; status: string }> = {};
  cats.forEach((c, i) => { o[`${colIdx}-${i}`] = { catNumber: c, status }; });
  return o;
};
const reminders = (e: Record<string, string>) => Object.values(e).filter(m => /needs to be assigned to either LH or SH/.test(m));
const inconsistencies = (e: Record<string, string>) => Object.values(e).filter(m => /Finals inconsistency|Missing (Longhair|Shorthair) finals cat/.test(m));
const orderViolations = (e: Record<string, string>) => Object.values(e).filter(m => /out of order|must be above all fillers/.test(m));
const hasReminder = (e: Record<string, string>) => reminders(e).length > 0;
const hasInconsistency = (e: Record<string, string>) => inconsistencies(e).length > 0;
const hasOrderViolation = (e: Record<string, string>) => orderViolations(e).length > 0;

// ============================== Championship ==============================
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
  test('AB CH cat in neither specialty column -> reminder', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(2, ['99']) }, championsFinals: { '2-0': '99' } }), 450);
    expect(hasReminder(e)).toBe(true);
  });
  test('plain Allbreed: own LH -> no reminder; own SH -> no reminder; neither -> reminder', () => {
    expect(hasReminder(validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['1']), championsFinals: { '0-0': '1' }, lhChampionsFinals: { '0-0': '1' } }), 450))).toBe(false);
    expect(hasReminder(validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['1']), championsFinals: { '0-0': '1' }, shChampionsFinals: { '0-0': '1' } }), 450))).toBe(false);
    expect(hasReminder(validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['1']), championsFinals: { '0-0': '1' } }), 450))).toBe(true);
  });
  test('higher-precedence error (duplicate) suppresses the reminder on that cell', () => {
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['5']), championsFinals: { '0-0': '5', '0-1': '5' } }), 450);
    expect(Object.values(e).some(m => /Duplicate/.test(m))).toBe(true);
    expect(hasReminder(e)).toBe(false);
  });
});

describe('CH order + filler — SSP enforced via the AB column', () => {
  test('LH order reversed vs AB -> violation', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['13', '11']), ...sa(2, ['11', '13']) }, lhChampionsFinals: { '0-0': '13', '0-1': '11' }, championsFinals: { '2-0': '11', '2-1': '13' } }), 450);
    expect(hasOrderViolation(e)).toBe(true);
  });
  test('SH order reversed vs AB -> violation (SH coverage)', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(1, ['14', '12']), ...sa(2, ['12', '14']) }, shChampionsFinals: { '1-0': '14', '1-1': '12' }, championsFinals: { '2-0': '12', '2-1': '14' } }), 450);
    expect(hasOrderViolation(e)).toBe(true);
  });
  test('valid LH order (subsequence of AB) -> no violation', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['11', '13']), ...sa(2, ['11', '13']) }, lhChampionsFinals: { '0-0': '11', '0-1': '13' }, championsFinals: { '2-0': '11', '2-1': '13' } }), 450);
    expect(hasOrderViolation(e)).toBe(false);
  });
  test('filler before an AB CH cat -> violation; filler after all AB cats -> no violation', () => {
    const before = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['88', '11']), ...sa(2, ['11']) }, lhChampionsFinals: { '0-0': '88', '0-1': '11' }, championsFinals: { '2-0': '11' } }), 450);
    expect(hasOrderViolation(before)).toBe(true);
    const after = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['11', '88']), ...sa(2, ['11']) }, lhChampionsFinals: { '0-0': '11', '0-1': '88' }, championsFinals: { '2-0': '11' } }), 450);
    expect(hasOrderViolation(after)).toBe(false);
  });
  test('plain Allbreed order check unchanged (single column)', () => {
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Allbreed')], showAwards: sa(0, ['11', '13']), championsFinals: { '0-0': '11', '0-1': '13' }, lhChampionsFinals: { '0-0': '13', '0-1': '11' } }), 450);
    expect(hasOrderViolation(e)).toBe(true);
  });
  test('standalone Longhair ring (no AB sibling): no AB-order check fires', () => {
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Longhair')], showAwards: sa(0, ['13', '11']), lhChampionsFinals: { '0-0': '13', '0-1': '11' } }), 450);
    expect(hasOrderViolation(e)).toBe(false);
  });
});

describe('CH — removed finals-consistency never reappears', () => {
  test('SSP split entry produces no Finals inconsistency error', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['11', '13']), ...sa(1, ['14']), ...sa(2, ['11', '14', '13']) }, lhChampionsFinals: { '0-0': '11', '0-1': '13' }, shChampionsFinals: { '1-0': '14' }, championsFinals: { '2-0': '11', '2-1': '14', '2-2': '13' } }), 450);
    expect(hasInconsistency(e)).toBe(false);
  });
});

describe('CH — live vs import equivalence (AB sub-sections empty vs populated)', () => {
  test('valid SSP ring: identical reminder/order/inconsistency whether AB.lh/sh is empty (live) or a copy (import)', () => {
    const cols = SSP3();
    const showAwards = { ...sa(0, ['11', '13']), ...sa(1, ['14']), ...sa(2, ['11', '14', '13']) };
    const live = validateChampionshipTab(ch({ columns: cols, showAwards, lhChampionsFinals: { '0-0': '11', '0-1': '13' }, shChampionsFinals: { '1-0': '14' }, championsFinals: { '2-0': '11', '2-1': '14', '2-2': '13' } }), 450);
    // import: AB column's LH/SH sub-sections populated as a copy of the specialty columns
    const imported = validateChampionshipTab(ch({ columns: cols, showAwards, lhChampionsFinals: { '0-0': '11', '0-1': '13', '2-0': '11', '2-1': '13' }, shChampionsFinals: { '1-0': '14', '2-0': '14' }, championsFinals: { '2-0': '11', '2-1': '14', '2-2': '13' } }), 450);
    for (const probe of [reminders, orderViolations, inconsistencies]) {
      expect(probe(live).length).toBe(0);
      expect(probe(imported).length).toBe(0);
    }
  });
});

describe('CH edge cases', () => {
  test('voided AB CH cat is ignored (no reminder)', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(2, ['11']) }, championsFinals: { '2-0': 'VOID' } }), 450);
    expect(hasReminder(e)).toBe(false);
  });
  test('5-position breakoff SSP ring still validates order cross-column', () => {
    const e = validateChampionshipTab(ch({ columns: SSP3(), showAwards: { ...sa(0, ['13', '11']), ...sa(2, ['11', '13']) }, lhChampionsFinals: { '0-0': '13', '0-1': '11' }, championsFinals: { '2-0': '11', '2-1': '13' } }, CC5), 450);
    expect(hasOrderViolation(e)).toBe(true);
  });
  test('two SSP rings validated independently', () => {
    const cols = [
      J(1, 'Longhair', 'Super Specialty'), J(1, 'Shorthair', 'Super Specialty'), J(1, 'Allbreed', 'Super Specialty'),
      J(2, 'Longhair', 'Super Specialty'), J(2, 'Shorthair', 'Super Specialty'), J(2, 'Allbreed', 'Super Specialty'),
    ];
    // ring1 valid; ring2 LH order reversed -> exactly one ring violates
    const e = validateChampionshipTab(ch({
      columns: cols,
      showAwards: { ...sa(0, ['11']), ...sa(2, ['11']), ...sa(3, ['23', '21']), ...sa(5, ['21', '23']) },
      lhChampionsFinals: { '0-0': '11', '3-0': '23', '3-1': '21' },
      championsFinals: { '2-0': '11', '5-0': '21', '5-1': '23' },
    }), 450);
    expect(hasOrderViolation(e)).toBe(true);
  });
  test('mixed rings (Allbreed + SSP + OCP): resolver picks the SSP judge\'s own AB column by judge id', () => {
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
    expect(hasOrderViolation(e)).toBe(true);
  });
  test('per-class SSP: a globally-SSP judge with only an AB column in this tab is treated as plain Allbreed', () => {
    // No LH/SH siblings -> resolver returns own column; reminder fires only if not in own LH/SH.
    const e = validateChampionshipTab(ch({ columns: [J(1, 'Allbreed', 'Super Specialty')], showAwards: sa(0, ['1']), championsFinals: { '0-0': '1' } }), 450);
    expect(hasReminder(e)).toBe(true);
  });
});

// ============================== Premiership ==============================
const PC = { gps: 0, lhGps: 5, shGps: 5, lhPrs: 5, shPrs: 5, lhNovs: 0, shNovs: 0, novs: 0, prs: 10 };
function pr(p: Partial<PremiershipValidationInput>): PremiershipValidationInput {
  return {
    columns: [], showAwards: {}, premiersFinals: {}, abPremiersFinals: {}, lhPremiersFinals: {}, shPremiersFinals: {},
    premiershipTotal: 20, premiershipCounts: PC,
    voidedShowAwards: {}, voidedPremiersFinals: {}, voidedABPremiersFinals: {}, voidedLHPremiersFinals: {}, voidedSHPremiersFinals: {},
    ...p,
  } as PremiershipValidationInput;
}

describe('PR — SSP reminder + order/filler via the AB column', () => {
  test('split entry: no false reminder, no finals-inconsistency', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(0, ['11'], 'PR'), ...sa(1, ['14'], 'PR'), ...sa(2, ['11', '14'], 'PR') }, lhPremiersFinals: { '0-0': '11' }, shPremiersFinals: { '1-0': '14' }, abPremiersFinals: { '2-0': '11', '2-1': '14' } }), 450);
    expect(hasReminder(e)).toBe(false);
    expect(hasInconsistency(e)).toBe(false);
  });
  test('genuinely unassigned AB PR cat still flags', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(2, ['99'], 'PR') }, abPremiersFinals: { '2-0': '99' } }), 450);
    expect(hasReminder(e)).toBe(true);
  });
  test('AB PR cat in SH specialty -> no reminder (SH coverage)', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(1, ['14'], 'PR'), ...sa(2, ['14'], 'PR') }, shPremiersFinals: { '1-0': '14' }, abPremiersFinals: { '2-0': '14' } }), 450);
    expect(hasReminder(e)).toBe(false);
  });
  test('LH PR order reversed vs AB -> violation; valid order -> none', () => {
    const bad = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(0, ['13', '11'], 'PR'), ...sa(2, ['11', '13'], 'PR') }, lhPremiersFinals: { '0-0': '13', '0-1': '11' }, abPremiersFinals: { '2-0': '11', '2-1': '13' } }), 450);
    expect(hasOrderViolation(bad)).toBe(true);
    const ok = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(0, ['11', '13'], 'PR'), ...sa(2, ['11', '13'], 'PR') }, lhPremiersFinals: { '0-0': '11', '0-1': '13' }, abPremiersFinals: { '2-0': '11', '2-1': '13' } }), 450);
    expect(hasOrderViolation(ok)).toBe(false);
  });
  test('SH PR filler before AB cat -> violation', () => {
    const e = validatePremiershipTab(pr({ columns: SSP3(), showAwards: { ...sa(1, ['88', '14'], 'PR'), ...sa(2, ['14'], 'PR') }, shPremiersFinals: { '1-0': '88', '1-1': '14' }, abPremiersFinals: { '2-0': '14' } }), 450);
    expect(hasOrderViolation(e)).toBe(true);
  });
});
