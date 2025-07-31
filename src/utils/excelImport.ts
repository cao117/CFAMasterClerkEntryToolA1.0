// Excel Import utility for CFA Master Clerk Entry Tool
// Handles parsing Excel data and restoring application state

import * as XLSX from 'xlsx';

// Type definitions for import functionality (reusing from csvImport)
interface ImportedShowState {
  general: {
    showDate: string;
    clubName: string;
    masterClerk: string;
    numberOfJudges: number;
    championshipCounts: {
      gcs: number;
      lhGcs: number;
      shGcs: number;
      lhChs: number;
      shChs: number;
      lhNovs: number;
      shNovs: number;
      novs: number;
      chs: number;
      total: number;
    };
    kittenCounts: {
      lhKittens: number;
      shKittens: number;
      total: number;
    };
    premiershipCounts: {
      gcs: number;
      lhPrs: number;
      shPrs: number;
      lhNovs: number;
      shNovs: number;
      novs: number;
      prs: number;
      total: number;
      gps: number;
      lhGps: number;
      shGps: number;
    };
    householdPetCount: number;
  };
  judges: Array<{
    id: number;
    name: string;
    acronym: string;
    ringNumber: number;
    ringType: string;
  }>;
  championship: {
    showAwards: { [key: string]: { catNumber: string; status: string } };
    championsFinals: { [key: string]: string };
    lhChampionsFinals: { [key: string]: string };
    shChampionsFinals: { [key: string]: string };
    voidedShowAwards: { [key: string]: boolean };
    voidedChampionsFinals: { [key: string]: boolean };
    voidedLHChampionsFinals: { [key: string]: boolean };
    voidedSHChampionsFinals: { [key: string]: boolean };
    errors: { [key: string]: string };
  };
  premiership: {
    showAwards: { [key: string]: { catNumber: string; status: string } };
    premiersFinals: { [key: string]: string };
    abPremiersFinals: { [key: string]: string };
    lhPremiersFinals: { [key: string]: string };
    shPremiersFinals: { [key: string]: string };
    voidedShowAwards: { [key: string]: boolean };
    voidedPremiersFinals: { [key: string]: boolean };
    voidedABPremiersFinals: { [key: string]: boolean };
    voidedLHPremiersFinals: { [key: string]: boolean };
    voidedSHPremiersFinals: { [key: string]: boolean };
    errors: { [key: string]: string };
  };
  kitten: {
    showAwards: { [key: string]: { catNumber: string; status: string } };
    voidedShowAwards: { [key: string]: boolean };
    errors: { [key: string]: string };
    focusedColumnIndex: number | null;
    isResetModalOpen: boolean;
    isCSVErrorModalOpen: boolean;
  };
  household: {
    showAwards: { [key: string]: { catNumber: string; status: string } };
    voidedShowAwards: { [key: string]: boolean };
  };
  breedSheets?: {
    selectedJudgeId: number | null;
    selectedGroup: 'Championship' | 'Premiership' | 'Kitten';
    selectedHairLength: 'Longhair' | 'Shorthair';
    breedEntries: { 
      [judgeId: string]: { 
        [groupHairLengthKey: string]: { 
          [breedKey: string]: { 
            bob: string; 
            secondBest: string; 
            bestCH?: string; 
            bestPR?: string 
          } 
        } 
      } 
    };
    errors: { [key: string]: string };
    pingTriggered: boolean;
  };
}

export interface SuccessCallback {
  (title: string, message?: string, duration?: number): void;
}

export interface ErrorCallback {
  (title: string, message?: string, duration?: number): void;
}

/**
 * Parses Excel data and restores the complete application state
 * @param excelBuffer - The Excel file buffer to parse
 * @param showSuccess - Success callback function
 * @param showError - Error callback function
 * @returns The restored show state object or null if parsing failed
 */
export function parseExcelAndRestoreState(
  excelBuffer: ArrayBuffer,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
): { showState: ImportedShowState; settings: any } | null {
  try {
    // Parse Excel workbook
    const workbook = XLSX.read(excelBuffer, { type: 'array' });
    
    // Initialize restored state
    const restoredState: ImportedShowState = {
      general: {
        showDate: '',
        clubName: '',
        masterClerk: '',
        numberOfJudges: 0,
        championshipCounts: {
          gcs: 0,
          lhGcs: 0,
          shGcs: 0,
          lhChs: 0,
          shChs: 0,
          lhNovs: 0,
          shNovs: 0,
          novs: 0,
          chs: 0,
          total: 0
        },
        kittenCounts: {
          lhKittens: 0,
          shKittens: 0,
          total: 0
        },
        premiershipCounts: {
          gcs: 0,
          lhPrs: 0,
          shPrs: 0,
          lhNovs: 0,
          shNovs: 0,
          novs: 0,
          prs: 0,
          total: 0,
          gps: 0,
          lhGps: 0,
          shGps: 0
        },
        householdPetCount: 0
      },
      judges: [],
      championship: {
        showAwards: {},
        championsFinals: {},
        lhChampionsFinals: {},
        shChampionsFinals: {},
        voidedShowAwards: {},
        voidedChampionsFinals: {},
        voidedLHChampionsFinals: {},
        voidedSHChampionsFinals: {},
        errors: {}
      },
      premiership: {
        showAwards: {},
        premiersFinals: {},
        abPremiersFinals: {},
        lhPremiersFinals: {},
        shPremiersFinals: {},
        voidedShowAwards: {},
        voidedPremiersFinals: {},
        voidedABPremiersFinals: {},
        voidedLHPremiersFinals: {},
        voidedSHPremiersFinals: {},
        errors: {}
      },
      kitten: {
        showAwards: {},
        voidedShowAwards: {},
        errors: {},
        focusedColumnIndex: null,
        isResetModalOpen: false,
        isCSVErrorModalOpen: false
      },
      household: {
        showAwards: {},
        voidedShowAwards: {}
      }
    };

    // Parse each worksheet
    const sheetNames = workbook.SheetNames;

    // Parse Settings worksheet first (if present)
    let importedSettings: any = null;
    if (sheetNames.includes('Settings')) {
      const worksheet = workbook.Sheets['Settings'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      importedSettings = parseSettingsWorksheet(data);
    }

    // Parse General_Info worksheet
    if (sheetNames.includes('General_Info')) {
      const worksheet = workbook.Sheets['General_Info'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      parseGeneralInfoWorksheet(data, restoredState.general, restoredState.judges);
    } else {
      showError('Excel Import Error', 'The Excel file does not contain a "General_Info" worksheet.');
      return null;
    }

    // Parse Championship worksheet
    if (sheetNames.includes('CH_Final')) {
      const worksheet = workbook.Sheets['CH_Final'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      parseTabWorksheet(data, restoredState.championship, 'championship');
    }

    // Parse Premiership worksheet
    if (sheetNames.includes('PR_Final')) {
      const worksheet = workbook.Sheets['PR_Final'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      parseTabWorksheet(data, restoredState.premiership, 'premiership');
    }

    // Parse Kitten worksheet
    if (sheetNames.includes('Kitten_Final')) {
      const worksheet = workbook.Sheets['Kitten_Final'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      parseTabWorksheet(data, restoredState.kitten, 'kitten');
    }

    // Parse Household Pet worksheet
    if (sheetNames.includes('HHP_Final')) {
      const worksheet = workbook.Sheets['HHP_Final'];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      parseTabWorksheet(data, restoredState.household, 'household');
    }

    // Parse Breed Sheets worksheets (BS_1, BS_2, etc.)
    const breedSheetWorksheets = sheetNames.filter(name => name.startsWith('BS_'));
    if (breedSheetWorksheets.length > 0) {
      restoredState.breedSheets = {
        selectedJudgeId: null,
        selectedGroup: 'Championship',
        selectedHairLength: 'Longhair',
        breedEntries: {},
        errors: {},
        pingTriggered: false
      };

      for (const sheetName of breedSheetWorksheets) {
        const judgeId = parseInt(sheetName.replace('BS_', ''));
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        parseBreedSheetWorksheet(data, restoredState.breedSheets, judgeId);
      }
    }

    // Validate the restored state
    if (!validateRestoredState(restoredState)) {
      showError('Invalid Excel Data', 'The Excel file does not contain valid show data.');
      return null;
    }

    showSuccess('Excel Import Successful', 'Show data has been successfully imported from Excel file.');
    return { showState: restoredState, settings: importedSettings };

  } catch (error) {
    showError('Import Error', 'An error occurred while importing the Excel file.');
    return null;
  }
}

// Helper functions for parsing

function parseSettingsWorksheet(data: string[][]): any {
  const settings: any = {
    max_judges: 12,
    max_cats: 450,
    placement_thresholds: {
      championship: 85,
      kitten: 75,
      premiership: 50,
      household_pet: 50
    },
    short_hair_breeds: [],
    long_hair_breeds: []
  };

  let currentSection = '';
  let inBreedList = false;
  let breedListType = '';

  for (const row of data) {
    if (!row || row.length === 0) continue;
    
    const firstCell = row[0]?.toString().trim() || '';
    
    // Check for section headers
    if (firstCell === 'General Settings') {
      currentSection = 'general';
      continue;
    } else if (firstCell === 'Placement Thresholds') {
      currentSection = 'thresholds';
      continue;
    } else if (firstCell === 'Long Hair Breeds') {
      currentSection = 'breeds';
      breedListType = 'long_hair_breeds';
      inBreedList = true;
      continue;
    } else if (firstCell === 'Short Hair Breeds') {
      currentSection = 'breeds';
      breedListType = 'short_hair_breeds';
      inBreedList = true;
      continue;
    }
    
    // Parse general settings
    if (currentSection === 'general' && row.length >= 2) {
      const setting = firstCell;
      const value = parseNumber(row[1]);
      
      switch (setting) {
        case 'Max Judges':
          settings.max_judges = value;
          break;
        case 'Max Cats':
          settings.max_cats = value;
          break;
      }
    }
    
    // Parse placement thresholds
    if (currentSection === 'thresholds' && row.length >= 2) {
      const category = firstCell;
      const value = parseNumber(row[1]);
      
      switch (category) {
        case 'Championship':
          settings.placement_thresholds.championship = value;
          break;
        case 'Kitten':
          settings.placement_thresholds.kitten = value;
          break;
        case 'Premiership':
          settings.placement_thresholds.premiership = value;
          break;
        case 'Household Pet':
          settings.placement_thresholds.household_pet = value;
          break;
      }
    }
    
    // Parse breed lists
    if (currentSection === 'breeds' && inBreedList && firstCell && firstCell !== 'Category' && firstCell !== 'Threshold') {
      if (firstCell !== 'No long hair breeds configured' && firstCell !== 'No short hair breeds configured') {
        settings[breedListType].push(firstCell);
      }
    }
  }
  
  return settings;
}

function parseNumber(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function parseGeneralInfoWorksheet(data: string[][], general: ImportedShowState['general'], judges: ImportedShowState['judges']) {
  let inJudgesSection = false;
  
  for (const row of data) {
    if (!row || row.length === 0) continue;
    
    const firstCell = row[0]?.toString().trim() || '';
    
    // Check if we're entering the judges section
    if (firstCell === 'Judges') {
      inJudgesSection = true;
      continue;
    }
    
    // Parse judges header row
    if (inJudgesSection && firstCell === 'Judge Name') {
      continue; // Skip header row
    }
    
    // Parse judge data
    if (inJudgesSection && firstCell && firstCell !== 'Judge Name') {
      judges.push({
        id: judges.length + 1,
        name: firstCell,
        ringNumber: parseNumber(row[1]) || judges.length + 1, // Default to judge ID if not provided
        acronym: row[2]?.toString().trim() || '',
        ringType: row[3]?.toString().trim() || ''
      });
      continue;
    }
    
    // Parse general information (key-value pairs)
    if (!inJudgesSection && row.length >= 2) {
      const label = firstCell;
      const value = row[1]?.toString().trim() || '';
      
      switch (label) {
        case 'showDate':
          general.showDate = value;
          break;
        case 'clubName':
          general.clubName = value;
          break;
        case 'masterClerk':
          general.masterClerk = value;
          break;
        case 'numberOfJudges':
          general.numberOfJudges = parseNumber(value);
          break;
        case 'championshipCounts - gcs':
          general.championshipCounts.gcs = parseNumber(value);
          break;
        case 'championshipCounts - lhGcs':
          general.championshipCounts.lhGcs = parseNumber(value);
          break;
        case 'championshipCounts - shGcs':
          general.championshipCounts.shGcs = parseNumber(value);
          break;
        case 'championshipCounts - lhChs':
          general.championshipCounts.lhChs = parseNumber(value);
          break;
        case 'championshipCounts - shChs':
          general.championshipCounts.shChs = parseNumber(value);
          break;
        case 'championshipCounts - lhNovs':
          general.championshipCounts.lhNovs = parseNumber(value);
          break;
        case 'championshipCounts - shNovs':
          general.championshipCounts.shNovs = parseNumber(value);
          break;
        case 'championshipCounts - novs':
          general.championshipCounts.novs = parseNumber(value);
          break;
        case 'championshipCounts - chs':
          general.championshipCounts.chs = parseNumber(value);
          break;
        case 'championshipCounts - total':
          general.championshipCounts.total = parseNumber(value);
          break;
        case 'kittenCounts - lhKittens':
          general.kittenCounts.lhKittens = parseNumber(value);
          break;
        case 'kittenCounts - shKittens':
          general.kittenCounts.shKittens = parseNumber(value);
          break;
        case 'kittenCounts - total':
          general.kittenCounts.total = parseNumber(value);
          break;
        case 'premiershipCounts - gps':
          general.premiershipCounts.gps = parseNumber(value);
          break;
        case 'premiershipCounts - lhGps':
          general.premiershipCounts.lhGps = parseNumber(value);
          break;
        case 'premiershipCounts - shGps':
          general.premiershipCounts.shGps = parseNumber(value);
          break;
        case 'premiershipCounts - lhPrs':
          general.premiershipCounts.lhPrs = parseNumber(value);
          break;
        case 'premiershipCounts - shPrs':
          general.premiershipCounts.shPrs = parseNumber(value);
          break;
        case 'premiershipCounts - lhNovs':
          general.premiershipCounts.lhNovs = parseNumber(value);
          break;
        case 'premiershipCounts - shNovs':
          general.premiershipCounts.shNovs = parseNumber(value);
          break;
        case 'premiershipCounts - novs':
          general.premiershipCounts.novs = parseNumber(value);
          break;
        case 'premiershipCounts - prs':
          general.premiershipCounts.prs = parseNumber(value);
          break;
        case 'premiershipCounts - total':
          general.premiershipCounts.total = parseNumber(value);
          break;
        case 'householdPetCount':
          general.householdPetCount = parseNumber(value);
          break;
      }
    }
  }
}

function parseTabWorksheet(data: string[][], tabData: any, tabType: string) {
  // Parse each row based on tab type
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    // Convert to string array for consistency with CSV parsing
    const stringRow = row.map(cell => cell?.toString() || '');
    
    switch (tabType) {
      case 'championship':
        parseChampionshipSection(stringRow, tabData, i);
        break;
      case 'premiership':
        parsePremiershipSection(stringRow, tabData, i);
        break;
      case 'kitten':
        parseKittenSection(stringRow, tabData, i);
        break;
      case 'household':
        parseHouseholdSection(stringRow, tabData, i);
        break;
    }
  }
}

// Helper function to parse cell values (copied from csvImport.ts)
function parseCellValue(cellValue: string): { catNumber: string; status: string; voided: boolean } {
  const trimmed = (cellValue || '').trim();
  if (trimmed.toUpperCase() === 'VOID') {
    // If cell is VOID (case-insensitive), set catNumber to 'VOID', no status
    return { catNumber: 'VOID', status: '', voided: true };
  }
  // Otherwise, parse as 'catNumber|status' or just catNumber
  const [catNumber, status] = trimmed.split('|');
  return { catNumber: catNumber || '', status: status || '', voided: false };
}

// Helper function to safely trim values
function safeTrim(value: string): string {
  return (value || '').trim();
}

// Tab-specific parsing functions (adapted from csvImport.ts)
function parseChampionshipSection(row: string[], championship: ImportedShowState['championship'], rowIndex: number) {
  // Only skip the actual section header row (e.g., 'Show Awards'), not the first two data rows
  if (row[0]?.toLowerCase().includes('show awards') && row.length === 1) return;

  const section = row[0]?.trim() || '';
  const expectedColumns = 4; // 1 label + 3 judges
  if (row.length < expectedColumns) {
    return;
  }

  // --- Robust Show Awards row mapping ---
  if (/^Show Awards \d+/.test(section)) {
    // Extract the intended row index from the label (e.g., "Show Awards 3" -> 2)
    const match = section.match(/Show Awards (\d+)/);
    const pos = match ? parseInt(match[1], 10) - 1 : 0;
    for (let col = 1; col < row.length; col++) {
      const cellValue = row[col]?.trim() || '';
      const key = `${col - 1}-${pos}`;
      if (!cellValue || cellValue === '-') {
        championship.showAwards[key] = { catNumber: '', status: '' };
        continue;
      }
      const { catNumber, status, voided } = parseCellValue(cellValue);
      championship.showAwards[key] = { catNumber: safeTrim(catNumber), status: safeTrim(status) };
      if (voided) {
        championship.voidedShowAwards[key] = true;
      }
    }
    return;
  }

  // --- Robust Finals row mapping ---
  // Finals label patterns: "Best AB CH", "2nd Best LH CH", etc.
  const finalsMatch = section.match(/^(\d*(?:st|nd|rd|th)?\s*)?Best (AB|LH|SH) CH/i);
  if (finalsMatch) {
    // Determine finals section and row index
    let finalsSection = '';
    if (finalsMatch[2] === 'AB') finalsSection = 'championsFinals';
    else if (finalsMatch[2] === 'LH') finalsSection = 'lhChampionsFinals';
    else if (finalsMatch[2] === 'SH') finalsSection = 'shChampionsFinals';
    // Row index: parse ordinal (e.g., "2nd Best LH CH" -> 1, "Best LH CH" -> 0)
    let pos = 0;
    const ordinalMatch = section.match(/^(\d+)/);
    if (ordinalMatch) {
      pos = parseInt(ordinalMatch[1], 10) - 1;
    }
    for (let col = 1; col < row.length; col++) {
      const cellValue = row[col]?.trim() || '';
      const key = `${col - 1}-${pos}`;
      if (!cellValue || cellValue === '-') {
        championship[finalsSection as keyof ImportedShowState['championship']][key] = '';
        continue;
      }
      const { catNumber, voided } = parseCellValue(cellValue);
      championship[finalsSection as keyof ImportedShowState['championship']][key] = safeTrim(catNumber);
      if (voided) {
        const voidedSection = finalsSection === 'championsFinals' ? 'voidedChampionsFinals' :
                             finalsSection === 'lhChampionsFinals' ? 'voidedLHChampionsFinals' : 'voidedSHChampionsFinals';
        championship[voidedSection as keyof ImportedShowState['championship']][key] = true;
      }
    }
    return;
  }
}

function parsePremiershipSection(row: string[], premiership: ImportedShowState['premiership'], rowIndex: number) {
  // Only skip the actual section header row (e.g., 'Show Awards'), not the first two data rows
  if (row[0]?.toLowerCase().includes('show awards') && row.length === 1) return;

  const section = row[0]?.trim() || '';

  // --- Robust Show Awards row mapping ---
  if (/^Show Awards \d+/.test(section)) {
    // Extract the intended row index from the label (e.g., "Show Awards 3" -> 2)
    const match = section.match(/Show Awards (\d+)/);
    const pos = match ? parseInt(match[1], 10) - 1 : 0;
    for (let col = 1; col < row.length; col++) {
      const cellValue = row[col]?.trim() || '';
      const key = `${col - 1}-${pos}`;
      if (!cellValue || cellValue === '-') {
        premiership.showAwards[key] = { catNumber: '', status: '' };
        continue;
      }
      const { catNumber, status, voided } = parseCellValue(cellValue);
      premiership.showAwards[key] = { catNumber, status };
      if (voided) {
        premiership.voidedShowAwards[key] = true;
      }
    }
    return;
  }

  // --- Robust Finals row mapping ---
  // Finals label patterns: "Best AB PR", "2nd Best LH PR", etc.
  const finalsMatch = section.match(/^(\d*(?:st|nd|rd|th)?\s*)?Best (AB|LH|SH) PR/i);
  if (finalsMatch) {
    // Determine finals section and row index
    let finalsSection = '';
    if (finalsMatch[2] === 'AB') finalsSection = 'abPremiersFinals';
    else if (finalsMatch[2] === 'LH') finalsSection = 'lhPremiersFinals';
    else if (finalsMatch[2] === 'SH') finalsSection = 'shPremiersFinals';
    // Row index: parse ordinal (e.g., "2nd Best LH PR" -> 1, "Best LH PR" -> 0)
    let pos = 0;
    const ordinalMatch = section.match(/^(\d+)/);
    if (ordinalMatch) {
      pos = parseInt(ordinalMatch[1], 10) - 1;
    }
    for (let col = 1; col < row.length; col++) {
      const cellValue = row[col]?.trim() || '';
      const key = `${col - 1}-${pos}`;
      if (!cellValue || cellValue === '-') {
        (premiership as any)[finalsSection][key] = '';
        continue;
      }
      const { catNumber, voided } = parseCellValue(cellValue);
      (premiership as any)[finalsSection][key] = catNumber;
      if (voided) {
        const voidedSection = finalsSection === 'abPremiersFinals' ? 'voidedABPremiersFinals' :
                             finalsSection === 'lhPremiersFinals' ? 'voidedLHPremiersFinals' : 'voidedSHPremiersFinals';
        (premiership as any)[voidedSection][key] = true;
      }
    }
    return;
  }
}

function parseKittenSection(row: string[], kitten: ImportedShowState['kitten'], rowIndex: number) {
  // Only skip the actual section header row (e.g., 'Show Awards'), not the first two data rows
  if (row[0]?.toLowerCase().includes('show awards') && row.length === 1) return;

  const section = row[0]?.trim() || '';

  // --- Robust Show Awards row mapping ---
  if (/^Show Awards \d+/.test(section)) {
    // Extract the intended row index from the label (e.g., "Show Awards 3" -> 2)
    const match = section.match(/Show Awards (\d+)/);
    const pos = match ? parseInt(match[1], 10) - 1 : 0;
    for (let col = 1; col < row.length; col++) {
      const cellValue = row[col]?.trim() || '';
      const key = `${col - 1}-${pos}`;
      if (!cellValue || cellValue === '-') {
        kitten.showAwards[key] = { catNumber: '', status: '' };
        continue;
      }
      const { catNumber, status, voided } = parseCellValue(cellValue);
      kitten.showAwards[key] = { catNumber, status };
      if (voided) {
        kitten.voidedShowAwards[key] = true;
      }
    }
    return;
  }
}

function parseHouseholdSection(row: string[], household: ImportedShowState['household'], rowIndex: number) {
  // Only skip the actual section header row (e.g., 'Show Awards'), not the first two data rows
  if (row[0]?.toLowerCase().includes('show awards') && row.length === 1) return;

  const section = row[0]?.trim() || '';

  // --- Robust Show Awards row mapping ---
  if (/^Show Awards \d+/.test(section)) {
    // Extract the intended row index from the label (e.g., "Show Awards 3" -> 2)
    const match = section.match(/Show Awards (\d+)/);
    const pos = match ? parseInt(match[1], 10) - 1 : 0;
    for (let col = 1; col < row.length; col++) {
      const cellValue = row[col]?.trim() || '';
      const key = `${col - 1}-${pos}`;
      if (!cellValue || cellValue === '-') {
        // Still create the key with empty value for UI rendering
        household.showAwards[key] = { catNumber: '', status: '' };
        continue;
      }
      const { catNumber, status, voided } = parseCellValue(cellValue);
      household.showAwards[key] = { catNumber, status };
      if (voided) {
        household.voidedShowAwards[key] = true;
      }
    }
    return;
  }
}

function parseBreedSheetWorksheet(data: string[][], breedSheets: NonNullable<ImportedShowState['breedSheets']>, judgeId: number) {
  const judgeIdStr = judgeId.toString();
  breedSheets.breedEntries[judgeIdStr] = {};
  
  let currentSection = '';
  let currentGroup = '';
  let currentHairLength = '';
  let inBreedRows = false;
  
  for (const row of data) {
    if (!row || row.length === 0) {
      inBreedRows = false;
      continue;
    }
    
    const firstCell = row[0]?.toString().trim() || '';
    
    // Check for section headers (CHAMPIONSHIP LH, CHAMPIONSHIP SH, etc.)
    if (firstCell.match(/^(CHAMPIONSHIP|KITTEN|PREMIERSHIP)\s+(LH|SH)$/)) {
      const parts = firstCell.split(' ');
      currentGroup = parts[0];
      currentHairLength = parts[1] === 'LH' ? 'Longhair' : 'Shorthair';
      
      // Convert to title case to match the stored data format
      const titleCaseGroup = currentGroup.charAt(0).toUpperCase() + currentGroup.slice(1).toLowerCase();
      currentSection = `${titleCaseGroup}-${currentHairLength}`;
      inBreedRows = false;
      
      // Initialize section in breed entries
      if (!breedSheets.breedEntries[judgeIdStr][currentSection]) {
        breedSheets.breedEntries[judgeIdStr][currentSection] = {};
      }
      continue;
    }
    
    // Check for table headers (Breed Name, BoB, 2BoB, CH/PR)
    if (firstCell === 'Breed Name') {
      inBreedRows = true;
      continue;
    }
    
    // Parse breed data rows
    if (inBreedRows && firstCell && currentSection) {
      const breedName = firstCell;
      const hairLengthPrefix = currentHairLength === 'Longhair' ? 'lh' : 'sh';
      const breedKey = `${hairLengthPrefix}-${breedName}`;
      
      const bob = row[1]?.toString().trim() || '';
      const secondBest = row[2]?.toString().trim() || '';
      const third = row[3]?.toString().trim() || '';
      
      const breedEntry: any = {
        bob,
        secondBest
      };
      
      // Add CH or PR field based on group
      if (currentGroup === 'Championship') {
        breedEntry.bestCH = third;
      } else if (currentGroup === 'Premiership') {
        breedEntry.bestPR = third;
      }
      // Kitten doesn't have a third field
      
      breedSheets.breedEntries[judgeIdStr][currentSection][breedKey] = breedEntry;
    }
  }
}

function validateRestoredState(state: ImportedShowState): boolean {
  // Basic validation - check if essential fields are present
  const hasShowDate = !!state.general.showDate;
  const hasClubName = !!state.general.clubName;
  const hasMasterClerk = !!state.general.masterClerk;
  const hasJudges = state.judges.length > 0;
  
  return !!(hasShowDate && hasClubName && hasMasterClerk && hasJudges);
} 

/**
 * Handles file selection and Excel import
 * @param file - The selected Excel file
 * @param showSuccess - Success callback function
 * @param showError - Error callback function
 * @returns Promise that resolves to the restored state or null
 */
export async function handleExcelFileImport(
  file: File,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
): Promise<{ showState: ImportedShowState; settings: any } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const excelBuffer = event.target?.result as ArrayBuffer;
      if (!excelBuffer) {
        showError('File Read Error', 'Unable to read the selected file.');
        resolve(null);
        return;
      }
      
      const result = parseExcelAndRestoreState(excelBuffer, showSuccess, showError);
      resolve(result);
    };
    
    reader.onerror = () => {
      showError('File Read Error', 'An error occurred while reading the file.');
      resolve(null);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Handles Excel file selection dialog and import
 * @param showSuccess - Success callback function
 * @param showError - Error callback function
 * @returns Promise that resolves to the restored state or null
 */
export async function handleRestoreFromExcel(
  showSuccess: SuccessCallback,
  showError: ErrorCallback
): Promise<{ showState: ImportedShowState; settings: any } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.display = 'none';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const restoredState = await handleExcelFileImport(file, showSuccess, showError);
        resolve(restoredState);
      } catch (error) {
        showError('Import Error', 'An error occurred while importing the Excel file.');
        resolve(null);
      }
    };
    
    input.oncancel = () => {
      resolve(null);
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
} 