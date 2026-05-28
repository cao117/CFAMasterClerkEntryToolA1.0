import { describe, test, expect } from '@jest/globals';
import {
  isSspForClass,
  getEffectiveRingType,
  generateColumnsForTab,
  remapColumnKeyedData,
  SSP_CLASS_DEFAULT,
  type ClassTab,
} from './ringTypeUtils';

const TABS: ClassTab[] = ['championship', 'premiership', 'kitten'];

interface TestJudge {
  id: number;
  name?: string;
  acronym?: string;
  ringNumber?: number;
  ringType: string;
  sspClasses?: { championship: boolean; premiership: boolean; kitten: boolean };
}

function judge(over: Partial<TestJudge> = {}): TestJudge {
  return { id: 1, name: 'J', acronym: 'J', ringNumber: 1, ringType: 'Allbreed', ...over };
}

describe('isSspForClass', () => {
  test('non-SSP judge is never SSP for any class', () => {
    const j = judge({ ringType: 'Allbreed' });
    TABS.forEach(t => expect(isSspForClass(j, t)).toBe(false));
  });

  test('SSP judge with undefined sspClasses defaults to true for all classes', () => {
    const j = judge({ ringType: 'Super Specialty' });
    TABS.forEach(t => expect(isSspForClass(j, t)).toBe(true));
  });

  test('SSP judge respects per-class selection', () => {
    const j = judge({ ringType: 'Super Specialty', sspClasses: { championship: false, premiership: true, kitten: false } });
    expect(isSspForClass(j, 'championship')).toBe(false);
    expect(isSspForClass(j, 'premiership')).toBe(true);
    expect(isSspForClass(j, 'kitten')).toBe(false);
  });
});

describe('getEffectiveRingType', () => {
  test('non-SSP types are returned unchanged for every tab', () => {
    ['Allbreed', 'Longhair', 'Shorthair', 'Double Specialty', 'OCP Ring'].forEach(rt => {
      TABS.forEach(t => expect(getEffectiveRingType(judge({ ringType: rt }), t)).toBe(rt));
    });
  });

  test('SSP judge: selected class -> Super Specialty, unselected -> Allbreed', () => {
    const j = judge({ ringType: 'Super Specialty', sspClasses: { championship: false, premiership: true, kitten: false } });
    expect(getEffectiveRingType(j, 'championship')).toBe('Allbreed');
    expect(getEffectiveRingType(j, 'premiership')).toBe('Super Specialty');
    expect(getEffectiveRingType(j, 'kitten')).toBe('Allbreed');
  });

  test('SSP judge with no sspClasses -> Super Specialty everywhere (backward compatible)', () => {
    const j = judge({ ringType: 'Super Specialty' });
    TABS.forEach(t => expect(getEffectiveRingType(j, t)).toBe('Super Specialty'));
  });
});

describe('generateColumnsForTab', () => {
  const specialties = (cols: { specialty: string }[]) => cols.map(c => c.specialty);

  test('SSP judge selected for class -> 3 columns LH/SH/AB', () => {
    const cols = generateColumnsForTab([judge({ ringType: 'Super Specialty' })], 'championship');
    expect(specialties(cols)).toEqual(['Longhair', 'Shorthair', 'Allbreed']);
  });

  test('SSP judge NOT selected for class -> 1 Allbreed column', () => {
    const j = judge({ ringType: 'Super Specialty', sspClasses: { championship: false, premiership: true, kitten: true } });
    expect(specialties(generateColumnsForTab([j], 'championship'))).toEqual(['Allbreed']);
    expect(specialties(generateColumnsForTab([j], 'premiership'))).toEqual(['Longhair', 'Shorthair', 'Allbreed']);
  });

  test('OCP Ring -> AB+OCP in CH/PR but AB-only in Kitten', () => {
    const j = judge({ ringType: 'OCP Ring' });
    expect(specialties(generateColumnsForTab([j], 'championship'))).toEqual(['Allbreed', 'OCP']);
    expect(specialties(generateColumnsForTab([j], 'premiership'))).toEqual(['Allbreed', 'OCP']);
    expect(specialties(generateColumnsForTab([j], 'kitten'))).toEqual(['Allbreed']);
  });

  test('Double Specialty -> 2 columns in every class', () => {
    const j = judge({ ringType: 'Double Specialty' });
    TABS.forEach(t => expect(specialties(generateColumnsForTab([j], t))).toEqual(['Longhair', 'Shorthair']));
  });

  test('mixed judges produce correct ordered columns (Midland CH scenario)', () => {
    // CG = SSP PR-only (AB in CH), JC = SSP CH-only (SSP in CH), Allbreed judge
    const judges = [
      judge({ id: 1, ringType: 'Allbreed' }),
      judge({ id: 2, ringType: 'Super Specialty', sspClasses: { championship: false, premiership: true, kitten: false } }),
      judge({ id: 3, ringType: 'Super Specialty', sspClasses: { championship: true, premiership: false, kitten: false } }),
    ];
    const cols = generateColumnsForTab(judges, 'championship');
    // J1 AB(1) | J2 AB(1) | J3 LH/SH/AB(3) = 5 columns
    expect(cols.map(c => `${c.judge.id}:${c.specialty}`)).toEqual([
      '1:Allbreed', '2:Allbreed', '3:Longhair', '3:Shorthair', '3:Allbreed',
    ]);
  });

  test('SSP_CLASS_DEFAULT is all true', () => {
    expect(SSP_CLASS_DEFAULT).toEqual({ championship: true, premiership: true, kitten: true });
  });
});

describe('remapColumnKeyedData (column re-indexing on count change)', () => {
  const J = (id: number, ringType: string, ssp?: TestJudge['sspClasses']): TestJudge =>
    ({ id, ringType, ...(ssp ? { sspClasses: ssp } : {}) });
  const OFF_CH = { championship: false, premiership: true, kitten: true };

  test('middle SSP judge toggled OFF (3->1 col): later judge re-indexed, affected dropped, earlier kept', () => {
    const before = [J(1, 'Allbreed'), J(2, 'Super Specialty'), J(3, 'Allbreed')];
    const after = [J(1, 'Allbreed'), J(2, 'Super Specialty', OFF_CH), J(3, 'Allbreed')];
    const oldCols = generateColumnsForTab(before, 'championship'); // [1AB,2LH,2SH,2AB,3AB]
    const newCols = generateColumnsForTab(after, 'championship');  // [1AB,2AB,3AB]
    const data = { '0-0': 'j1', '1-0': '2lh', '2-0': '2sh', '3-0': '2ab', '4-0': 'j3' };
    expect(remapColumnKeyedData(oldCols, newCols, 2, data)).toEqual({ '0-0': 'j1', '2-0': 'j3' });
  });

  test('middle SSP judge toggled ON (1->3 col): later judge shifts up by 2', () => {
    const before = [J(1, 'Allbreed'), J(2, 'Super Specialty', OFF_CH), J(3, 'Allbreed')];
    const after = [J(1, 'Allbreed'), J(2, 'Super Specialty'), J(3, 'Allbreed')];
    const oldCols = generateColumnsForTab(before, 'championship'); // [1AB,2AB,3AB]
    const newCols = generateColumnsForTab(after, 'championship');  // [1AB,2LH,2SH,2AB,3AB]
    const data = { '0-0': 'j1', '1-0': '2ab', '2-0': 'j3' };
    expect(remapColumnKeyedData(oldCols, newCols, 2, data)).toEqual({ '0-0': 'j1', '4-0': 'j3' });
  });

  test('first SSP judge toggled OFF: all later judges shift left by 2', () => {
    const before = [J(1, 'Super Specialty'), J(2, 'Allbreed'), J(3, 'Allbreed')];
    const after = [J(1, 'Super Specialty', OFF_CH), J(2, 'Allbreed'), J(3, 'Allbreed')];
    const oldCols = generateColumnsForTab(before, 'championship'); // [1LH,1SH,1AB,2AB,3AB]
    const newCols = generateColumnsForTab(after, 'championship');  // [1AB,2AB,3AB]
    const data = { '3-0': 'j2', '4-0': 'j3' };
    expect(remapColumnKeyedData(oldCols, newCols, 1, data)).toEqual({ '1-0': 'j2', '2-0': 'j3' });
  });

  test('multi-position keys preserved when re-indexing', () => {
    const before = [J(1, 'Super Specialty'), J(2, 'Allbreed')];
    const after = [J(1, 'Super Specialty', OFF_CH), J(2, 'Allbreed')];
    const oldCols = generateColumnsForTab(before, 'championship'); // [1LH,1SH,1AB,2AB]
    const newCols = generateColumnsForTab(after, 'championship');  // [1AB,2AB]
    const data = { '0-0': 'x', '3-0': 'j2a', '3-1': 'j2b' };
    expect(remapColumnKeyedData(oldCols, newCols, 1, data)).toEqual({ '1-0': 'j2a', '1-1': 'j2b' });
  });
});
