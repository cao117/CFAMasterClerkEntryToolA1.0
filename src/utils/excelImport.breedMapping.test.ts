import { describe, test, expect, jest } from '@jest/globals';
import * as XLSX from 'xlsx';
import { parseExcelAndRestoreState } from './excelImport';
import { SHORT_HAIR_BREEDS, LONG_HAIR_BREEDS, mapLegacyBreedName } from '../data/breedList';
import { withCanonicalBreeds } from './settingsLoader';

/**
 * Areas B, C, E — retro-compatibility of Excel/auto-save import with the
 * 2026-27 breed rename (BENGAL -> BENGAL - SH, MANX - LH -> MANX (TAILLESS) - LH,
 * MANX - SH -> MANX (TAILLESS) - SH) and the 3 new divisions.
 *
 * Fixtures below mirror the exact sheet/row shapes written by
 * src/utils/excelExport.ts:
 *   - buildSettingsSectionForExcel(): 'Settings' sheet — General Settings /
 *     Placement Thresholds / Long Hair Breeds / Short Hair Breeds sections,
 *     one breed name per row, blank separator rows between sections.
 *   - buildGeneralSectionForExcel(): 'General_Info' sheet — key/value rows,
 *     then a 'Judges' section header, then
 *     ['Judge Name','Ring Number','Acronym','Ring Type','SSP Classes'],
 *     then one row per judge.
 *   - buildBreedSheetSection(): 'BS_<judgeId>' sheet — per (group, hairLength)
 *     a '<GROUP> <LH|SH>' header row, a ['Breed Name','BoB','2BoB',<CH|PR>]
 *     table header (Kitten omits the 3rd column), then one row per breed:
 *     [breedName, bob, secondBest, best?].
 *
 * Import (src/utils/excelImport.ts) reads breed sheet rows keyed as
 * `${lh|sh}-${breedName}` (parseBreedSheetWorksheet, ~L809-812). This is
 * the exact place a legacy file's old breed name ("BENGAL", "MANX - LH",
 * "MANX - SH") must be passed through mapLegacyBreedName() before the key
 * is built — that call does not exist yet, which is why the Area B tests
 * below currently fail (TDD red).
 *
 * AUTO-SAVE NOTE FOR THE IMPLEMENTER: autoSaveService.ts (src/utils/autoSaveService.ts)
 * stores auto-saves as a base64-encoded xlsx workbook in localStorage, built via
 * the same createExcelFromFormData() used for manual Excel export, and restored
 * via the same parseExcelAndRestoreState() exercised here. There is no separate
 * auto-save breed-mapping code path to implement — fixing parseBreedSheetWorksheet
 * (and the Settings-sheet-does-not-override-breeds behavior) fixes both Excel
 * import and auto-save restore simultaneously.
 */

const NEW_DIVISIONS = ['BENGAL - LH', 'MANX (TAILED) - LH', 'MANX (TAILED) - SH'];

function buildSettingsSheet(shortHairBreeds: string[], longHairBreeds: string[]): any[][] {
  const rows: any[][] = [];
  rows.push(['Settings']);
  rows.push(['General Settings']);
  rows.push(['Setting', 'Value']);
  rows.push(['Max Judges', 12]);
  rows.push(['Max Cats', 450]);
  rows.push([]);
  rows.push(['Placement Thresholds']);
  rows.push(['Category', 'Threshold']);
  rows.push(['Championship', 85]);
  rows.push(['Kitten', 75]);
  rows.push(['Premiership', 50]);
  rows.push(['Household Pet', 50]);
  rows.push([]);
  rows.push(['Long Hair Breeds']);
  for (const breed of longHairBreeds) rows.push([breed]);
  rows.push([]);
  rows.push(['Short Hair Breeds']);
  for (const breed of shortHairBreeds) rows.push([breed]);
  return rows;
}

function buildGeneralInfoSheet(judges: { name: string; ringNumber: number; acronym: string; ringType: string }[]): any[][] {
  const rows: any[][] = [];
  rows.push(['General Information']);
  rows.push(['showDate', '2026-09-12']);
  rows.push(['clubName', 'Test Club']);
  rows.push(['masterClerk', 'Test Clerk']);
  rows.push([]);
  rows.push(['Judges']);
  rows.push(['Judge Name', 'Ring Number', 'Acronym', 'Ring Type', 'SSP Classes']);
  for (const j of judges) rows.push([j.name, j.ringNumber, j.acronym, j.ringType, '']);
  return rows;
}

/** breedAwards: array of [breedName, bob, secondBest, best] for a single CHAMPIONSHIP SH section. */
function buildBreedSheetForJudge(breedAwards: [string, string, string, string][]): any[][] {
  const rows: any[][] = [];
  rows.push(['CHAMPIONSHIP SH']);
  rows.push(['Breed Name', 'BoB', '2BoB', 'CH']);
  for (const [breedName, bob, secondBest, best] of breedAwards) {
    rows.push([breedName, bob, secondBest, best]);
  }
  return rows;
}

function buildWorkbook(sheets: Record<string, any[][]>): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, ws, name);
  }
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const bytes = new Uint8Array(excelBuffer);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

const ONE_JUDGE = [{ name: 'Test Judge', ringNumber: 1, acronym: 'TJ', ringType: 'Allbreed' }];

function importWorkbook(sheets: Record<string, any[][]>) {
  const buffer = buildWorkbook(sheets);
  const result = parseExcelAndRestoreState(buffer, jest.fn(), jest.fn());
  expect(result).not.toBeNull();
  return result!;
}

describe('Area B — legacy Excel file retro-compatibility (old breed names, old Settings)', () => {
  function legacyWorkbookSheets() {
    return {
      Settings: buildSettingsSheet(
        // Old-format short hair list: the 3 legacy names + 2 unchanged breeds
        ['ABYSSINIAN', 'BENGAL', 'MANX - LH', 'MANX - SH', 'SIAMESE'],
        ['BIRMAN']
      ),
      General_Info: buildGeneralInfoSheet(ONE_JUDGE),
      BS_1: buildBreedSheetForJudge([
        ['ABYSSINIAN', '101', '102', '101'],
        ['BENGAL', '201', '202', '201'],
        ['MANX - LH', '', '', ''],       // MANX - LH is SH-division by CFA convention (see module header)
        ['MANX - SH', '301', '302', '301'],
        ['SIAMESE', '401', '402', '401']
      ])
    };
  }

  test('maps a legacy "BENGAL" award to the "sh-BENGAL - SH" key on import', () => {
    const { showState } = importWorkbook(legacyWorkbookSheets());
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(entries['sh-BENGAL - SH']).toEqual(expect.objectContaining({ bob: '201', secondBest: '202', bestCH: '201' }));
  });

  test('maps a legacy "MANX - SH" award to the "sh-MANX (TAILLESS) - SH" key on import', () => {
    const { showState } = importWorkbook(legacyWorkbookSheets());
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(entries['sh-MANX (TAILLESS) - SH']).toEqual(expect.objectContaining({ bob: '301', secondBest: '302', bestCH: '301' }));
  });

  test('maps a legacy "MANX - LH" row to the "sh-MANX (TAILLESS) - LH" key (still short-hair-list, CFA convention)', () => {
    const { showState } = importWorkbook(legacyWorkbookSheets());
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(entries).toHaveProperty('sh-MANX (TAILLESS) - LH');
  });

  test('zero awards are lost: award row count in equals award row count out', () => {
    const { showState } = importWorkbook(legacyWorkbookSheets());
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(Object.keys(entries)).toHaveLength(5);
  });

  test('unchanged breeds (not part of the rename) are imported under their own name, unaffected', () => {
    const { showState } = importWorkbook(legacyWorkbookSheets());
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(entries['sh-ABYSSINIAN']).toEqual(expect.objectContaining({ bob: '101', secondBest: '102', bestCH: '101' }));
    expect(entries['sh-SIAMESE']).toEqual(expect.objectContaining({ bob: '401', secondBest: '402', bestCH: '401' }));
  });

  test('the 3 new 2026-27 divisions (not present in the legacy file) have no imported award data', () => {
    const { showState } = importWorkbook(legacyWorkbookSheets());
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    for (const division of NEW_DIVISIONS) {
      expect(entries[`sh-${division}`]).toBeUndefined();
    }
  });

  test('old renamed keys ("sh-BENGAL", "sh-MANX - LH", "sh-MANX - SH") do not appear in the imported data', () => {
    const { showState } = importWorkbook(legacyWorkbookSheets());
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(entries).not.toHaveProperty('sh-BENGAL');
    expect(entries).not.toHaveProperty('sh-MANX - LH');
    expect(entries).not.toHaveProperty('sh-MANX - SH');
  });

  test('resulting runtime settings use the canonical breed lists, not the old lists embedded in the file', () => {
    // Documents the expected App.tsx wiring: import handlers must run the parsed
    // Settings-sheet output through withCanonicalBreeds() (src/utils/settingsLoader.ts)
    // instead of spreading `importedSettings` directly over the previous globalSettings.
    const { settings: importedSettings } = importWorkbook(legacyWorkbookSheets());
    const runtimeSettings = withCanonicalBreeds(importedSettings);
    expect(runtimeSettings.short_hair_breeds).toEqual(SHORT_HAIR_BREEDS);
    expect(runtimeSettings.long_hair_breeds).toEqual(LONG_HAIR_BREEDS);
  });

  test('other imported settings (max_judges, max_cats, placement_thresholds) still apply after canonicalizing breeds', () => {
    const { settings: importedSettings } = importWorkbook(legacyWorkbookSheets());
    const runtimeSettings = withCanonicalBreeds(importedSettings);
    expect(runtimeSettings.max_judges).toBe(12);
    expect(runtimeSettings.max_cats).toBe(450);
    // The legacy file's Household Pet 50 is the pre-MCE-9 default, read as 30 (Show Rule 11.32)
    expect(runtimeSettings.placement_thresholds).toEqual({
      championship: 85, kitten: 75, premiership: 50, household_pet: 30
    });
  });
});

describe('Area C — new-format Excel file round-trip (idempotence of the rename map)', () => {
  test('a file already using the 2026-27 breed names imports its awards back unchanged', () => {
    const sheets = {
      Settings: buildSettingsSheet(['ABYSSINIAN', 'BENGAL - SH', 'MANX (TAILLESS) - SH'], ['BIRMAN']),
      General_Info: buildGeneralInfoSheet(ONE_JUDGE),
      BS_1: buildBreedSheetForJudge([
        ['BENGAL - SH', '201', '202', '201'],
        ['MANX (TAILLESS) - SH', '301', '302', '301'],
        ['MANX (TAILED) - SH', '501', '502', '501']
      ])
    };
    const { showState } = importWorkbook(sheets);
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(entries['sh-BENGAL - SH']).toEqual(expect.objectContaining({ bob: '201' }));
    expect(entries['sh-MANX (TAILLESS) - SH']).toEqual(expect.objectContaining({ bob: '301' }));
    expect(entries['sh-MANX (TAILED) - SH']).toEqual(expect.objectContaining({ bob: '501' }));
  });

  test('mapLegacyBreedName applied to every canonical breed name is a true no-op (sanity check backing the round-trip)', () => {
    for (const breed of [...SHORT_HAIR_BREEDS, ...LONG_HAIR_BREEDS]) {
      expect(mapLegacyBreedName(breed)).toBe(breed);
    }
  });
});

describe('Area E — edge cases', () => {
  test('a clerk-added custom breed name not in the canonical list passes through unmapped (orphan breed, not silently dropped)', () => {
    const sheets = {
      Settings: buildSettingsSheet(['CUSTOM UNKNOWN BREED'], []),
      General_Info: buildGeneralInfoSheet(ONE_JUDGE),
      BS_1: buildBreedSheetForJudge([
        ['CUSTOM UNKNOWN BREED', '901', '902', '901']
      ])
    };
    const { showState } = importWorkbook(sheets);
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(entries['sh-CUSTOM UNKNOWN BREED']).toEqual(expect.objectContaining({ bob: '901', secondBest: '902', bestCH: '901' }));
  });

  test('an empty breed name cell does not create a spurious entry', () => {
    const sheets = {
      Settings: buildSettingsSheet(['ABYSSINIAN'], []),
      General_Info: buildGeneralInfoSheet(ONE_JUDGE),
      BS_1: buildBreedSheetForJudge([
        ['ABYSSINIAN', '101', '102', '101'],
        ['', '', '', '']
      ])
    };
    const { showState } = importWorkbook(sheets);
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(Object.keys(entries)).toEqual(['sh-ABYSSINIAN']);
  });

  test('duplicate breed rows for the same (legacy) breed name still merge, preserving non-empty values from either row', () => {
    // Mirrors the existing merge behavior in parseBreedSheetWorksheet (~L839-855):
    // a later row with an empty BoB must not clobber an earlier row's populated BoB.
    const sheets = {
      Settings: buildSettingsSheet(['BENGAL'], []),
      General_Info: buildGeneralInfoSheet(ONE_JUDGE),
      BS_1: buildBreedSheetForJudge([
        ['BENGAL', '201', '', ''],
        ['BENGAL', '', '202', '203']
      ])
    };
    const { showState } = importWorkbook(sheets);
    const entries = showState.breedSheets!.breedEntries['1']['Championship-Shorthair'];
    expect(entries['sh-BENGAL - SH']).toEqual(
      expect.objectContaining({ bob: '201', secondBest: '202', bestCH: '203' })
    );
    // Only one merged entry should exist for the (mapped) breed, not two.
    expect(Object.keys(entries)).toHaveLength(1);
  });
});
