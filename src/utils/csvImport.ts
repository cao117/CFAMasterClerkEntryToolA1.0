// CSV Import utility for CFA Master Clerk Entry Tool
// Handles parsing CSV data and restoring application state

import Papa from 'papaparse';

// Type definitions for import functionality
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
    householdPetCount: number;
  };
}

interface SuccessCallback {
  (title: string, message?: string, duration?: number): void;
}

interface ErrorCallback {
  (title: string, message?: string, duration?: number): void;
}

/**
 * Helper to safely trim a string value (returns '' for undefined/null)
 */
function safeTrim(val: string | undefined | null): string {
  return typeof val === 'string' ? val.trim() : '';
}

/**
 * Robustly parse numbers from CSV, always returning 0 if NaN or invalid
 */
function parseNumber(val: any): number {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Parses CSV data and restores the complete application state
 * @param csvData - The CSV string data to parse
 * @param showSuccess - Success callback function
 * @param showError - Error callback function
 * @returns The restored show state object or null if parsing failed
 */
export function parseCSVAndRestoreState(
  csvData: string,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
): ImportedShowState | null {
  try {
    // Parse CSV data
    const result = Papa.parse(csvData, {
      header: false,
      skipEmptyLines: true
    });

    // Filter out non-critical delimiter detection warnings
    const criticalErrors = result.errors.filter(error => 
      !(error.type === 'Delimiter' && error.code === 'UndetectableDelimiter')
    );

    if (criticalErrors.length > 0) {
      showError('CSV Parse Error', 'The CSV file contains formatting errors and cannot be imported.');
      return null;
    }

    const rows = result.data as string[][];
    
    if (rows.length === 0) {
      showError('Empty CSV', 'The CSV file is empty and cannot be imported.');
      return null;
    }

    // Initialize the restored state
    const restoredState: ImportedShowState = {
      general: {
        showDate: '',
        clubName: '',
        masterClerk: '',
        numberOfJudges: 0,
        championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, lhNovs: 0, shNovs: 0, novs: 0, chs: 0, total: 0 },
        kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
        premiershipCounts: { gcs: 0, lhPrs: 0, shPrs: 0, lhNovs: 0, shNovs: 0, novs: 0, prs: 0, total: 0 },
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
        voidedShowAwards: {},
        householdPetCount: 0
      }
    };

    // Add debug log for section header detection
    function isSectionHeader(row: string[]): boolean {
      const header = row[0]?.toLowerCase().trim();
      const isHeader = [
        'general information',
        'judges',
        'championship',
        'championship awards',
        'premiership',
        'premiership awards',
        'kitten',
        'kitten awards',
        'household pet',
        'household pet awards'
      ].includes(header);
      return isHeader;
    }

    // Parse each section of the CSV
    let currentSection = '';
    let currentRowIndex = 0;
    let foundChampionshipSection = false;
    let foundSectionHeaders: string[] = [];

    for (const row of rows) {
      const firstCell = row[0]?.trim() || '';
      
      // Log section header detection
      if (isSectionHeader(row)) {
        const header = row[0]?.toLowerCase().trim();
        foundSectionHeaders.push(row[0] || '');
        
        // Set current section based on detected header
        if (header === 'general information') {
          currentSection = 'general';
          currentRowIndex = 0;
          continue;
        } else if (header === 'judges' || header === 'judge information') {
          currentSection = 'judges';
          currentRowIndex = 0;
          continue;
        } else if (header === 'championship' || header === 'championship tab' || header === 'championship awards') {
          currentSection = 'championship';
          currentRowIndex = 0;
          foundChampionshipSection = true;
          continue;
        } else if (header === 'premiership' || header === 'premiership tab' || header === 'premiership awards') {
          currentSection = 'premiership';
          currentRowIndex = 0;
          continue;
        } else if (header === 'kitten' || header === 'kitten tab' || header === 'kitten awards') {
          currentSection = 'kitten';
          currentRowIndex = 0;
          continue;
        } else if (header === 'household pet' || header === 'household pet tab' || header === 'household pet awards') {
          currentSection = 'household';
          currentRowIndex = 0;
          continue;
        }
      }

      // Skip empty rows and section labels
      if (!firstCell || firstCell.startsWith('---')) {
        continue;
      }

      // Parse based on current section
      switch (currentSection) {
        case 'general':
          parseGeneralSection(row, restoredState.general);
          break;
        case 'judges':
          parseJudgeSection(row, restoredState.judges);
          break;
        case 'championship':
          parseChampionshipSection(row, restoredState.championship, currentRowIndex);
          break;
        case 'premiership':
          parsePremiershipSection(row, restoredState.premiership, currentRowIndex);
          break;
        case 'kitten':
          parseKittenSection(row, restoredState.kitten, currentRowIndex);
          break;
        case 'household':
          parseHouseholdSection(row, restoredState.household, currentRowIndex);
          break;
      }

      currentRowIndex++;
    }
    if (!foundChampionshipSection) {
      showError('CSV Import Error', 'The CSV file does not contain a "Championship" section.');
      return null;
    }

    // Validate the restored state
    if (!validateRestoredState(restoredState)) {
      showError('Invalid CSV Data', 'The CSV file does not contain valid show data.');
      return null;
    }

    showSuccess('CSV Import Successful', 'Show data has been successfully imported from CSV.');
    return restoredState;

  } catch (error) {
    showError('Import Error', 'An error occurred while importing the CSV file.');
    return null;
  }
}

/**
 * Parses the General Information section
 */
function parseGeneralSection(row: string[], general: ImportedShowState['general']) {
  const label = row[0]?.trim() || '';
  const value = row[1]?.trim() || '';

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
    case 'championshipCounts - novs':
      general.championshipCounts.novs = parseNumber(value);
      break;
    case 'championshipCounts - chs':
      general.championshipCounts.chs = parseNumber(value);
      break;
    case 'championshipCounts - total':
      general.championshipCounts.total = parseNumber(value);
      break;
    case 'championshipCounts - lhNovs':
      general.championshipCounts.lhNovs = parseNumber(value);
      break;
    case 'championshipCounts - shNovs':
      general.championshipCounts.shNovs = parseNumber(value);
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
    case 'premiershipCounts - gcs':
      general.premiershipCounts.gcs = parseNumber(value);
      break;
    case 'premiershipCounts - lhPrs':
      general.premiershipCounts.lhPrs = parseNumber(value);
      break;
    case 'premiershipCounts - shPrs':
      general.premiershipCounts.shPrs = parseNumber(value);
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
    case 'premiershipCounts - lhNovs':
      general.premiershipCounts.lhNovs = parseNumber(value);
      break;
    case 'premiershipCounts - shNovs':
      general.premiershipCounts.shNovs = parseNumber(value);
      break;
    case 'householdPetCount':
      general.householdPetCount = parseNumber(value);
      break;
  }
}

/**
 * Parses the Judge Information section
 */
function parseJudgeSection(row: string[], judges: ImportedShowState['judges']) {
  // Skip header row
  if (row[0]?.trim() === 'Judge #' || row[0]?.trim() === 'Judge Name') {
    return;
  }

  const judgeName = row[0]?.trim() || '';
  const ringNumber = row[1]?.trim() || '';
  const acronym = row[2]?.trim() || '';
  const ringType = row[3]?.trim() || '';

  if (judgeName && acronym && ringType) {
    judges.push({
      id: judges.length + 1,
      name: judgeName,
      ringNumber: parseNumber(ringNumber) || judges.length + 1, // Default to judge ID if not provided
      acronym: acronym,
      ringType: ringType
    });
  }
}

/**
 * Parses the Championship tab section
 * 
 * NOTE: Uses static counters attached to the function object for row tracking during CSV import.
 * This is necessary to map CSV rows to UI positions correctly, even if the CSV is not sorted or has missing rows.
 * 
 * @param row - The current CSV row
 * @param championship - The championship state object to populate
 * @param rowIndex - The index of the current CSV row
 */
function parseChampionshipSection(row: string[], championship: ImportedShowState['championship'], rowIndex: number) {
  /**
   * Robustly parses and maps Show Awards and Finals rows by extracting the intended row index from the label.
   * This ensures correct mapping even if the CSV has missing, extra, or out-of-order rows.
   *
   * NOTE: 'Show Awards 1', 'Show Awards 2', etc. are row labels for placements 1, 2, ... in the single Show Awards section (not separate sections).
   *
   * @param row - The current CSV row as an array of strings
   * @param championship - The championship state object to populate
   * @param rowIndex - The index of the current CSV row (relative to the section, not the whole file)
   */
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

  // Not a Show Awards or Finals row: do nothing, but reset any static counters if present (for legacy code safety)
  // (No longer needed, but kept for clarity)
  // At the end of this function, log the current state of the championship object
}

/**
 * Parses the Premiership tab section
 */
function parsePremiershipSection(row: string[], premiership: ImportedShowState['premiership'], rowIndex: number) {
  /**
   * Robustly parses and maps Show Awards and Finals rows by extracting the intended row index from the label.
   * This ensures correct mapping even if the CSV has missing, extra, or out-of-order rows.
   *
   * NOTE: 'Show Awards 1', 'Show Awards 2', etc. are row labels for placements 1, 2, ... in the single Show Awards section (not separate sections).
   */
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

  // Not a Show Awards or Finals row: do nothing
}

/**
 * Parses the Kitten tab section
 */
function parseKittenSection(row: string[], kitten: ImportedShowState['kitten'], rowIndex: number) {
  /**
   * Robustly parses and maps Show Awards rows by extracting the intended row index from the label.
   * This ensures correct mapping even if the CSV has missing, extra, or out-of-order rows.
   *
   * NOTE: 'Show Awards 1', 'Show Awards 2', etc. are row labels for placements 1, 2, ... in the single Show Awards section (not separate sections).
   */
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

  // Not a Show Awards row: do nothing
}

/**
 * Parses the Household Pet tab section
 */
function parseHouseholdSection(row: string[], household: ImportedShowState['household'], rowIndex: number) {
  /**
   * Robustly parses and maps Show Awards rows by extracting the intended row index from the label.
   * This ensures correct mapping even if the CSV has missing, extra, or out-of-order rows.
   *
   * NOTE: 'Show Awards 1', 'Show Awards 2', etc. are row labels for placements 1, 2, ... in the single Show Awards section (not separate sections).
   */
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

  // Not a Show Awards row: do nothing
}

/**
 * Parses a cell value and extracts cat number, status, and void state.
 * Handles the -v suffix for voided cells (both lowercase and uppercase).
 * Accepts both 'cat#-status-v' and 'cat# - status - v' (with or without spaces).
 * @param {string} cellValue - The raw cell value from CSV
 * @returns {{ catNumber: string, status: string, voided: boolean }}
 */
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

/**
 * Validates the restored state to ensure it contains valid data
 */
function validateRestoredState(state: ImportedShowState): boolean {
  // Relaxed validation - only check if basic structure exists (support auto-save incomplete data)
  return !!(
    state.general && 
    typeof state.general === 'object' &&
    Array.isArray(state.judges) &&
    state.championship && 
    typeof state.championship === 'object' &&
    state.premiership && 
    typeof state.premiership === 'object'
  );
}

/**
 * Handles file selection and CSV import
 * @param file - The selected CSV file
 * @param showSuccess - Success callback function
 * @param showError - Error callback function
 * @returns Promise that resolves to the restored state or null
 */
export async function handleCSVFileImport(
  file: File,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
): Promise<ImportedShowState | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      if (!csvData) {
        showError('File Read Error', 'Unable to read the selected file.');
        resolve(null);
        return;
      }
      
      const restoredState = parseCSVAndRestoreState(csvData, showSuccess, showError);
      resolve(restoredState);
    };
    
    reader.onerror = () => {
      showError('File Read Error', 'An error occurred while reading the file.');
      resolve(null);
    };
    
    reader.readAsText(file);
  });
} 