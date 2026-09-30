import { describe, test, expect, jest } from '@jest/globals';
import * as XLSX from 'xlsx';
import { exportShowToExcel } from './excelExport';
import { parseExcelAndRestoreState } from './excelImport';
import { loadGlobalSettings, correctedHouseholdPetThreshold } from './settingsLoader';
import type { GlobalSettings } from './settingsLoader';
import { validateHouseholdPetTab } from '../validation/householdPetValidation';

/**
 * MCE-9 — Household Pet finals cutoff.
 *
 * CFA Show Rule 11.32: "The awards for Household Pet Finals shall be Best
 * through Tenth Best Cat and, if 30 or more are entered, Eleventh through
 * Fifteenth Best Cat." The tool shipped with a cutoff of 50.
 *
 * Changing the cutoff for a new CFA rule is more than editing these numbers:
 * see "Changing the Cutoff" in docs/validation/VALIDATION_HOUSEHOLD.md.
 */

const JUDGES = [{ id: 1, name: 'Alpha', acronym: 'AL', ringNumber: 1, ringType: 'Allbreed' }];

/** Cat numbers 101..115 placed in rows 1..15 of the single HHP column. */
function fifteenPlacements() {
  const showAwards: Record<string, { catNumber: string; status: string }> = {};
  for (let pos = 0; pos < 15; pos++) showAwards[`0-${pos}`] = { catNumber: String(101 + pos), status: 'HHP' };
  return showAwards;
}

function makeShowState(householdPetCount: number, globalSettings: unknown) {
  return {
    general: {
      showDate: '2026-09-26', clubName: 'Test Club', masterClerk: 'Test Clerk', numberOfJudges: JUDGES.length,
      championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, lhNovs: 0, shNovs: 0, novs: 0, chs: 0, total: 0 },
      kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
      premiershipCounts: { gps: 0, lhGps: 0, shGps: 0, lhPrs: 0, shPrs: 0, lhNovs: 0, shNovs: 0, novs: 0, prs: 0, total: 0 },
      householdPetCount,
    },
    judges: JUDGES,
    championship: {
      showAwards: {}, championsFinals: {}, lhChampionsFinals: {}, shChampionsFinals: {},
      voidedShowAwards: {}, voidedChampionsFinals: {}, voidedLHChampionsFinals: {}, voidedSHChampionsFinals: {}, errors: {},
    },
    premiership: {
      showAwards: {}, premiersFinals: {}, abPremiersFinals: {}, lhPremiersFinals: {}, shPremiersFinals: {},
      voidedShowAwards: {}, voidedPremiersFinals: {}, voidedABPremiersFinals: {}, voidedLHPremiersFinals: {}, voidedSHPremiersFinals: {}, errors: {},
    },
    kitten: { showAwards: {}, voidedShowAwards: {}, errors: {} },
    household: { showAwards: fifteenPlacements(), voidedShowAwards: {}, errors: {} },
    breedSheets: { breedEntries: {}, errors: {} },
    globalSettings,
  };
}

function settingsWithHouseholdPetThreshold(household_pet: number) {
  return {
    max_judges: 12, max_cats: 450,
    placement_thresholds: { championship: 85, kitten: 75, premiership: 50, household_pet },
    short_hair_breeds: [], long_hair_breeds: [],
  };
}

function sheetRows(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1 });
}

/** Number of "Show Awards N" rows written to the HHP_Final sheet. */
function hhpFinalPlacementRowCount(workbook: XLSX.WorkBook): number {
  return sheetRows(workbook, 'HHP_Final').filter(r => /^Show Awards \d+$/.test(String(r?.[0] ?? ''))).length;
}

/** Number of Final Awards rows carrying one of the 15 household pet cat numbers. */
function finalAwardsHouseholdRowCount(workbook: XLSX.WorkBook): number {
  return sheetRows(workbook, 'Final Awards')
    .filter(r => (r || []).some(c => /^1(0[1-9]|1[0-5])$/.test(String(c)))).length;
}

function toArrayBuffer(workbook: XLSX.WorkBook): ArrayBuffer {
  const bytes = new Uint8Array(XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function importedHouseholdPetThreshold(workbook: XLSX.WorkBook): number {
  const result = parseExcelAndRestoreState(toArrayBuffer(workbook), jest.fn(), jest.fn());
  expect(result).not.toBeNull();
  return result!.settings.placement_thresholds.household_pet;
}

/** A saved file with no Household Pet row in its Settings sheet, so the importer falls back to its default. */
function workbookWithoutHouseholdPetRow(): XLSX.WorkBook {
  const { workbook } = exportShowToExcel(makeShowState(35, settingsWithHouseholdPetThreshold(50)));
  const withoutRow = sheetRows(workbook, 'Settings').filter(r => r?.[0] !== 'Household Pet');
  workbook.Sheets['Settings'] = XLSX.utils.aoa_to_sheet(withoutRow);
  return workbook;
}

describe('MCE-9 — HHP_Final export sheet', () => {
  test('writes 15 placement rows when 30 household pets are entered', () => {
    const { workbook } = exportShowToExcel(makeShowState(30, settingsWithHouseholdPetThreshold(30)));
    expect(hhpFinalPlacementRowCount(workbook)).toBe(15);
  });

  test('writes 10 placement rows when 29 household pets are entered', () => {
    const { workbook } = exportShowToExcel(makeShowState(29, settingsWithHouseholdPetThreshold(30)));
    expect(hhpFinalPlacementRowCount(workbook)).toBe(10);
  });
});

describe('MCE-9 — export fallbacks when no household pet threshold is configured', () => {
  test('Final Awards sheet carries all 15 household pet placements at 30 entries', () => {
    const { workbook } = exportShowToExcel(makeShowState(30, undefined));
    expect(finalAwardsHouseholdRowCount(workbook)).toBe(15);
  });

  test('Final Awards sheet carries 10 household pet placements at 29 entries', () => {
    const { workbook } = exportShowToExcel(makeShowState(29, undefined));
    expect(finalAwardsHouseholdRowCount(workbook)).toBe(10);
  });

  test('Settings sheet records the household pet threshold as 30', () => {
    const { workbook } = exportShowToExcel(makeShowState(0, undefined));
    const row = sheetRows(workbook, 'Settings').find(r => r?.[0] === 'Household Pet');
    expect(row).toEqual(['Household Pet', 30]);
  });
});

describe('MCE-9 — validateHouseholdPetTab default cutoff', () => {
  // Rows 11 and 12 hold the same cat: only flagged if rows 11-15 are in play.
  function inputWithDuplicateInRows11And12(householdPetCount: number) {
    const showAwards = fifteenPlacements();
    showAwards['0-11'] = { catNumber: '111', status: 'HHP' };
    return { columns: [{ judge: JUDGES[0], columnIndex: 0 }], showAwards, voidedShowAwards: {}, householdPetCount };
  }

  test('validates rows 11-15 when 30 household pets are entered', () => {
    const errors = validateHouseholdPetTab(inputWithDuplicateInRows11And12(30), 450);
    expect(Object.keys(errors).sort()).toEqual(['0-10', '0-11']);
  });

  test('ignores rows 11-15 when 29 household pets are entered', () => {
    const errors = validateHouseholdPetTab(inputWithDuplicateInRows11And12(29), 450);
    expect(errors).toEqual({});
  });
});

describe('MCE-9 — settings saved by builds that shipped the 50 cutoff', () => {
  const DEFAULTS: GlobalSettings = {
    max_judges: 12, max_cats: 450,
    placement_thresholds: { championship: 85, kitten: 75, premiership: 50, household_pet: 30 },
    short_hair_breeds: [], long_hair_breeds: [],
    numberOfSaves: 3, saveCycle: 5,
  };

  function storedBlob(household_pet: number) {
    return JSON.stringify({
      max_judges: 12, max_cats: 450,
      placement_thresholds: { championship: 85, kitten: 75, premiership: 50, household_pet },
      numberOfSaves: 3, saveCycle: 5,
    });
  }

  test('a household pet threshold of 50 in localStorage loads as 30', () => {
    const result = loadGlobalSettings(storedBlob(50), DEFAULTS);
    expect(result.placement_thresholds.household_pet).toBe(30);
  });

  test('a clerk-customized household pet threshold in localStorage is preserved', () => {
    const result = loadGlobalSettings(storedBlob(40), DEFAULTS);
    expect(result.placement_thresholds.household_pet).toBe(40);
  });

  test('loading a stored 50 leaves the other thresholds untouched', () => {
    const result = loadGlobalSettings(storedBlob(50), DEFAULTS);
    expect(result.placement_thresholds.championship).toBe(85);
    expect(result.placement_thresholds.kitten).toBe(75);
    expect(result.placement_thresholds.premiership).toBe(50);
  });

  test('a saved file whose Settings sheet says Household Pet 50 imports as 30', () => {
    const { workbook } = exportShowToExcel(makeShowState(35, settingsWithHouseholdPetThreshold(50)));
    expect(importedHouseholdPetThreshold(workbook)).toBe(30);
  });

  test('a saved file with a clerk-customized household pet threshold imports unchanged', () => {
    const { workbook } = exportShowToExcel(makeShowState(35, settingsWithHouseholdPetThreshold(40)));
    expect(importedHouseholdPetThreshold(workbook)).toBe(40);
  });

  test('importing a file with Household Pet 50 leaves its Premiership 50 untouched', () => {
    const { workbook } = exportShowToExcel(makeShowState(35, settingsWithHouseholdPetThreshold(50)));
    const result = parseExcelAndRestoreState(toArrayBuffer(workbook), jest.fn(), jest.fn());
    expect(result!.settings.placement_thresholds.premiership).toBe(50);
  });

  test('a saved file whose Settings sheet has no Household Pet row imports as 30', () => {
    expect(importedHouseholdPetThreshold(workbookWithoutHouseholdPetRow())).toBe(30);
  });
});

describe('MCE-9 — guard for a future cutoff change', () => {
  // A failure here means the default cutoff is now a value the legacy
  // conversion rewrites: the app would save its own default and read it back
  // as something else. Follow "Changing the Cutoff" in
  // docs/validation/VALIDATION_HOUSEHOLD.md.
  test('the legacy-50 conversion never rewrites the current default cutoff', () => {
    const currentDefault = importedHouseholdPetThreshold(workbookWithoutHouseholdPetRow());
    expect(correctedHouseholdPetThreshold(currentDefault)).toBe(currentDefault);
  });
});
