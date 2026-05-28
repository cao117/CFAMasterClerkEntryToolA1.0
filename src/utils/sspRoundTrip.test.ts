import { describe, test, expect } from '@jest/globals';
import { createExcelFromFormData } from './excelExport';
import { parseExcelAndRestoreState } from './excelImport';

/**
 * End-to-end persistence proof: per-class Super Specialty selection survives an
 * Excel export -> import round-trip (the same path used by autosave/restore).
 */
function makeShowState(judges: any[]) {
  const emptyChamp = {
    showAwards: {}, championsFinals: {}, lhChampionsFinals: {}, shChampionsFinals: {},
    voidedShowAwards: {}, voidedChampionsFinals: {}, voidedLHChampionsFinals: {}, voidedSHChampionsFinals: {}, errors: {},
  };
  const emptyPrem = {
    showAwards: {}, premiersFinals: {}, abPremiersFinals: {}, lhPremiersFinals: {}, shPremiersFinals: {},
    voidedShowAwards: {}, voidedPremiersFinals: {}, voidedABPremiersFinals: {}, voidedLHPremiersFinals: {}, voidedSHPremiersFinals: {}, errors: {},
  };
  const emptyKitten = { showAwards: {}, voidedShowAwards: {}, errors: {} };
  const emptyHHP = { showAwards: {}, voidedShowAwards: {}, errors: {} };
  return {
    general: {
      showDate: '2026-03-14', clubName: 'Test Club', masterClerk: 'Test Clerk',
      numberOfJudges: judges.length,
      championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, lhNovs: 0, shNovs: 0, novs: 0, chs: 0, total: 0 },
      kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
      premiershipCounts: { gps: 0, lhGps: 0, shGps: 0, lhPrs: 0, shPrs: 0, lhNovs: 0, shNovs: 0, novs: 0, prs: 0, total: 0 },
      householdPetCount: 0,
    },
    judges,
    championship: emptyChamp,
    premiership: emptyPrem,
    kitten: emptyKitten,
    household: emptyHHP,
    breedSheets: { breedEntries: {}, errors: {} },
    globalSettings: {
      max_judges: 12, max_cats: 450,
      placement_thresholds: { championship: 85, kitten: 75, premiership: 50, household_pet: 50 },
      short_hair_breeds: [], long_hair_breeds: [],
    },
  };
}

function roundTrip(judges: any[]) {
  const { buffer } = createExcelFromFormData(makeShowState(judges));
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const result = parseExcelAndRestoreState(ab as ArrayBuffer, () => {}, () => {});
  return result!.showState.judges;
}

describe('per-class SSP Excel round-trip', () => {
  test('partial SSP selection is preserved through export -> import', () => {
    const judges = [
      { id: 1, name: 'Alpha', acronym: 'AL', ringNumber: 1, ringType: 'Allbreed' },
      { id: 2, name: 'Bravo', acronym: 'BR', ringNumber: 2, ringType: 'Super Specialty', sspClasses: { championship: false, premiership: true, kitten: false } },
    ];
    const restored = roundTrip(judges);
    const ssp = restored.find(j => j.acronym === 'BR')!;
    expect(ssp.ringType).toBe('Super Specialty');
    expect(ssp.sspClasses).toEqual({ championship: false, premiership: true, kitten: false });
    // Non-SSP judge carries no sspClasses
    const ab = restored.find(j => j.acronym === 'AL')!;
    expect(ab.sspClasses).toBeUndefined();
  });

  test('all-selected SSP default round-trips as all true', () => {
    const judges = [
      { id: 1, name: 'Charlie', acronym: 'CH', ringNumber: 1, ringType: 'Super Specialty', sspClasses: { championship: true, premiership: true, kitten: true } },
    ];
    const restored = roundTrip(judges);
    expect(restored[0].sspClasses).toEqual({ championship: true, premiership: true, kitten: true });
  });
});
