// Kitten tab validation logic (reduced from premiershipValidation)

/**
 * @typedef {Object} KittenValidationInput
 * @property {Array<{judge: any, specialty: string, columnIndex: number}>} columns - Columns for the tab
 * @property {Record<string, {catNumber: string, status: string}>} showAwards - Cat numbers/statuses by cell key
 * @property {Record<string, boolean>} voidedShowAwards - Voided state by cell key (DEPRECATED: now handled via VOID in catNumber)
 * @property {Object} kittenCounts - Hair-specific kitten counts for breakpoint calculation
 */
export type KittenValidationInput = {
  columns: { judge: any; specialty: string; columnIndex: number }[];
  showAwards: Record<string, { catNumber: string; status: string }>;
  voidedShowAwards: Record<string, boolean>; // DEPRECATED: kept for backward compatibility
  kittenCounts: {
    lhKittens: number;
    shKittens: number;
    total: number;
  };
};

/**
 * Check if a cat number input is VOID (case-insensitive)
 * @param {string} catNumber - The cat number to check
 * @returns {boolean} True if the input is VOID
 */
export function isVoidInput(catNumber: string): boolean {
  return catNumber.trim().toUpperCase() === 'VOID';
}

import { validateCatNumber as validateCatNumberHelper, getCatNumberValidationMessage } from '../utils/validationHelpers';

/**
 * Validate cat number format: either a number 1-maxCats or VOID (case-insensitive)
 * @param {string} catNumber - The cat number to validate
 * @param {number} maxCats - The maximum number of cats allowed (from globalSettings.max_cats)
 * @returns {boolean} True if valid
 */
export function validateCatNumberFormat(catNumber: string, maxCats: number): boolean {
  if (!catNumber || catNumber.trim() === '') return true; // Empty is valid
  if (isVoidInput(catNumber)) return true; // VOID is valid
  return validateCatNumberHelper(catNumber, maxCats);
}

/**
 * Validate the Kitten tab: sequential entry, duplicate, range, voiding. Only KIT status allowed.
 *
 * - If catNumber is empty, do not require or check status (no error).
 * - If catNumber is VOID, do not require or check status (no error).
 * - Only filled rows require status === 'KIT'.
 * - VOIDED placements are treated as if they don't exist for validation purposes.
 *
 * @param {KittenValidationInput} input
 * @returns {Record<string, string>} errors keyed by cell
 */
export function validateKittenTab(input: KittenValidationInput, maxCats: number, kittenThreshold: number = 75): Record<string, string> {
  const errors: Record<string, string> = {};
  const { columns, showAwards, kittenCounts } = input;
  
  // Helper function to get breakpoint for a ring type
  const getBreakpointForRingType = (ringType: string): number => {
    if (ringType === 'Allbreed') {
      return kittenCounts.total >= kittenThreshold ? 15 : 10;
    } else if (ringType === 'Longhair') {
      return kittenCounts.lhKittens >= kittenThreshold ? 15 : 10;
    } else if (ringType === 'Shorthair') {
      return kittenCounts.shKittens >= kittenThreshold ? 15 : 10;
    }
    return 10; // Default fallback
  };

  // For each column
  columns.forEach((col, colIdx) => {
    const maxRows = getBreakpointForRingType(col.specialty);
    // Map from catNumber to all row indices where it appears (excluding voided and empty)
    const catNumberToRows: Record<string, number[]> = {};
    
    // First pass: collect all non-VOID cat numbers for duplicate detection
    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const cell = showAwards[key] || { catNumber: '', status: 'KIT' };
      
      // Skip VOIDED placements for validation (treat as if they don't exist)
      if (isVoidInput(cell.catNumber)) continue;
      
      // Build map for duplicate detection (only for non-VOID cat numbers)
      if (cell.catNumber && !isVoidInput(cell.catNumber)) {
        if (!catNumberToRows[cell.catNumber]) catNumberToRows[cell.catNumber] = [];
        catNumberToRows[cell.catNumber].push(rowIdx);
      }
    }
    
    // Second pass: apply validation in order (matching PremiershipTab)
    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const cell = showAwards[key] || { catNumber: '', status: 'KIT' };
      
      // Skip VOIDED placements for validation (treat as if they don't exist)
      if (isVoidInput(cell.catNumber)) continue;
      
      // 1. Format validation (Range error) - assign first
      if (cell.catNumber && !validateCatNumberFormat(cell.catNumber, maxCats)) {
        errors[key] = getCatNumberValidationMessage(maxCats);
        continue;
      }
      
      // 2. Duplicate error - only if no format error
      if (cell.catNumber && catNumberToRows[cell.catNumber] && catNumberToRows[cell.catNumber].length > 1) {
        if (errors[key]) {
          errors[key] = `${getCatNumberValidationMessage(maxCats)} Duplicate: This cat is already placed in another position.`;
        } else {
          errors[key] = 'Duplicate: This cat is already placed in another position.';
        }
        continue;
      }
      
      // 3. Sequential entry error - only if no format or duplicate error
      if (cell.catNumber && !errors[key]) {
        let sequentialError = false;
        for (let i = 0; i < rowIdx; i++) {
          const prevKey = `${colIdx}-${i}`;
          const prevCell = showAwards[prevKey] || { catNumber: '', status: 'KIT' };
          // FIX: Treat VOID as a valid skip (do NOT trigger sequential error if previous is VOID)
          if (!prevCell.catNumber || prevCell.catNumber.trim() === '') {
            sequentialError = true;
            break;
          }
          // If prevCell.catNumber is VOID, treat as a valid skip (do NOT set sequentialError)
        }
        if (sequentialError) {
          errors[key] = 'You must fill previous placements before entering this position.';
          continue;
        }
      }
      
      // 4. Status check: Only require status === 'KIT' if catNumber is present and not VOID
      if (cell.catNumber && !isVoidInput(cell.catNumber) && cell.status !== 'KIT') {
        errors[key] = 'Status must be KIT';
        continue;
      }
    }
  });

  // Super Specialty cross-column validation (runs AFTER all existing validation)
  const superSpecialtyErrors = validateSuperSpecialtyCrossColumn(input, maxCats);
  Object.assign(errors, superSpecialtyErrors);

  return errors;
} 

/**
 * Validates Super Specialty cross-column relationships for Kitten tab
 * This function runs AFTER all existing validation is complete
 * Only applies to Super Specialty rings (3 columns with same judge ID)
 */
export function validateSuperSpecialtyCrossColumn(input: KittenValidationInput, maxCats: number): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Only run for Super Specialty rings
  const superSpecialtyRings = findSuperSpecialtyRings(input.columns);
  
  for (const ringInfo of superSpecialtyRings) {
    const { longhairColIdx, shorthairColIdx, allbreedColIdx } = ringInfo;
    
    // 1. Title/Award Consistency Validation
    const titleErrors = validateTitleConsistency(input, longhairColIdx, shorthairColIdx, allbreedColIdx);
    Object.assign(errors, titleErrors);
    
    // 2. Ranked Cats Priority Validation
    const priorityErrors = validateRankedCatsPriority(input, longhairColIdx, shorthairColIdx, allbreedColIdx);
    Object.assign(errors, priorityErrors);
    
    // 3. Order Preservation Within Hair Length Validation
    const orderErrors = validateOrderPreservation(input, longhairColIdx, shorthairColIdx, allbreedColIdx);
    Object.assign(errors, orderErrors);
    
    // 4. Cross-Column Duplicate Prevention Validation (NEW)
    const duplicateErrors = validateCrossColumnDuplicates(input, longhairColIdx, shorthairColIdx);
    Object.assign(errors, duplicateErrors);
  }
  
  return errors;
}

/**
 * Finds Super Specialty rings (3 columns with same judge ID)
 */
function findSuperSpecialtyRings(columns: { judge: any; specialty: string; columnIndex: number }[]): Array<{
  longhairColIdx: number;
  shorthairColIdx: number;
  allbreedColIdx: number;
}> {
  const rings: Array<{
    longhairColIdx: number;
    shorthairColIdx: number;
    allbreedColIdx: number;
  }> = [];
  
  // Group columns by judge ID
  const columnsByJudge: { [judgeId: number]: Array<{ colIdx: number; specialty: string }> } = {};
  
  columns.forEach((col, colIdx) => {
    const judgeId = col.judge?.id || col.columnIndex; // Fallback to columnIndex if judge.id not available
    if (!columnsByJudge[judgeId]) {
      columnsByJudge[judgeId] = [];
    }
    columnsByJudge[judgeId].push({ colIdx, specialty: col.specialty });
  });
  
  // Find Super Specialty rings (3 columns with same judge ID)
  Object.values(columnsByJudge).forEach(judgeColumns => {
    if (judgeColumns.length === 3) {
      const longhair = judgeColumns.find(col => col.specialty === 'Longhair');
      const shorthair = judgeColumns.find(col => col.specialty === 'Shorthair');
      const allbreed = judgeColumns.find(col => col.specialty === 'Allbreed');
      
      if (longhair && shorthair && allbreed) {
        rings.push({
          longhairColIdx: longhair.colIdx,
          shorthairColIdx: shorthair.colIdx,
          allbreedColIdx: allbreed.colIdx
        });
      }
    }
  });
  
  return rings;
}

/**
 * Validates title/award consistency across Super Specialty columns
 */
function validateTitleConsistency(
  input: KittenValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get all cat numbers and their titles from all three columns
  const catTitles: { [catNumber: string]: { [column: string]: string } } = {};
  
  // Collect titles from Longhair column
  collectTitlesFromColumn(input, longhairColIdx, 'Longhair', catTitles);
  
  // Collect titles from Shorthair column
  collectTitlesFromColumn(input, shorthairColIdx, 'Shorthair', catTitles);
  
  // Collect titles from Allbreed column
  collectTitlesFromColumn(input, allbreedColIdx, 'Allbreed', catTitles);
  
  // Check for title inconsistencies
  Object.entries(catTitles).forEach(([catNumber, titles]) => {
    const uniqueTitles = [...new Set(Object.values(titles))];
    if (uniqueTitles.length > 1) {
      // Find all cells with this cat number and mark them with error
      markTitleInconsistencyErrors(input, catNumber, longhairColIdx, shorthairColIdx, allbreedColIdx, errors);
    }
  });
  
  return errors;
}

/**
 * Collects titles for a specific cat number from a column
 */
function collectTitlesFromColumn(
  input: KittenValidationInput,
  colIdx: number,
  columnType: string,
  catTitles: { [catNumber: string]: { [column: string]: string } }
): void {
  // Check Show Awards section (Kitten only has Show Awards, no Finals)
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${colIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      if (!catTitles[catNumber]) catTitles[catNumber] = {};
      catTitles[catNumber][columnType] = cell.status; // KIT for all kittens
    }
  }
}

/**
 * Marks title inconsistency errors for all cells containing the inconsistent cat
 */
function markTitleInconsistencyErrors(
  input: KittenValidationInput,
  catNumber: string,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  errors: { [key: string]: string }
): void {
  const columns = [longhairColIdx, shorthairColIdx, allbreedColIdx];
  
  columns.forEach(colIdx => {
    // Check Show Awards section (Kitten only has Show Awards)
    for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const cell = input.showAwards[key];
      if (cell && cell.catNumber && cell.catNumber.trim() === catNumber) {
        errors[key] = `Title inconsistency: Cat #${catNumber} has different titles across Super Specialty columns`;
      }
    }
  });
}

/**
 * Validates ranked cats priority (filler cats cannot be placed before ranked cats)
 */
function validateRankedCatsPriority(
  input: KittenValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get ranked cats from specialty columns
  const longhairRankedCats = getRankedCatsFromColumn(input, longhairColIdx);
  const shorthairRankedCats = getRankedCatsFromColumn(input, shorthairColIdx);
  
  // Check Allbreed column for violations
  checkRankedCatsPriorityInColumn(input, allbreedColIdx, longhairRankedCats, shorthairRankedCats, errors);
  
  return errors;
}

/**
 * Gets ranked cats from a column (cats that appear in Show Awards)
 */
function getRankedCatsFromColumn(input: KittenValidationInput, colIdx: number): Set<string> {
  const rankedCats = new Set<string>();
  
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${colIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      rankedCats.add(cell.catNumber.trim());
    }
  }
  
  return rankedCats;
}

/**
 * Checks ranked cats priority in Allbreed column
 * Rule: Filler cats (cats not ranked in specialty columns) cannot be placed before ranked cats
 */
function checkRankedCatsPriorityInColumn(
  input: KittenValidationInput,
  colIdx: number,
  longhairRankedCats: Set<string>,
  shorthairRankedCats: Set<string>,
  errors: { [key: string]: string }
): void {
  const allRankedCats = new Set([...longhairRankedCats, ...shorthairRankedCats]);
  
  // Check each position in the Allbreed column
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${colIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      
      // If this is a filler cat (not ranked in specialty columns)
      if (!allRankedCats.has(catNumber)) {
        // Check if there are any ranked cats that should be placed before this position
        // by looking at the ranked cats list and checking if any should come before this position
        const rankedCatsArray = Array.from(allRankedCats);
        if (rankedCatsArray.length > 0) {
          errors[key] = `Filler cat placed before ranked cats: Cat #${catNumber} is not ranked in specialty columns but appears in Allbreed before ranked cats`;
        }
      }
    }
  }
}

/**
 * Validates order preservation within hair length categories
 */
function validateOrderPreservation(
  input: KittenValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Validate Longhair order preservation
  validateHairLengthOrderPreservation(input, longhairColIdx, allbreedColIdx, 'Longhair', errors);
  
  // Validate Shorthair order preservation
  validateHairLengthOrderPreservation(input, shorthairColIdx, allbreedColIdx, 'Shorthair', errors);
  
  return errors;
}

/**
 * Validates order preservation for a specific hair length
 */
function validateHairLengthOrderPreservation(
  input: KittenValidationInput,
  specialtyColIdx: number,
  allbreedColIdx: number,
  hairLength: string,
  errors: { [key: string]: string }
): void {
  // Get ordered cats from specialty column
  const specialtyOrder = getOrderedCatsFromColumn(input, specialtyColIdx);
  
  // Check order preservation in Allbreed column
  checkOrderPreservationInAllbreed(input, allbreedColIdx, specialtyOrder, hairLength, errors);
}

/**
 * Gets ordered cats from a column
 */
function getOrderedCatsFromColumn(input: KittenValidationInput, colIdx: number): string[] {
  const orderedCats: string[] = [];
  
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${colIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      orderedCats.push(cell.catNumber.trim());
    }
  }
  
  return orderedCats;
}

/**
 * Checks order preservation in Allbreed column
 */
function checkOrderPreservationInAllbreed(
  input: KittenValidationInput,
  colIdx: number,
  specialtyOrder: string[],
  hairLength: string,
  errors: { [key: string]: string }
): void {
  const allbreedCats: string[] = [];
  
  // Get cats from Allbreed column
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${colIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      allbreedCats.push(cell.catNumber.trim());
    }
  }
  
  // Check if specialty cats appear in correct order in Allbreed
  let specialtyIndex = 0;
  for (let allbreedIndex = 0; allbreedIndex < allbreedCats.length; allbreedIndex++) {
    const allbreedCat = allbreedCats[allbreedIndex];
    
    if (specialtyOrder.includes(allbreedCat)) {
      // This cat should appear in the same order as in specialty
      const expectedSpecialtyIndex = specialtyOrder.indexOf(allbreedCat);
      if (expectedSpecialtyIndex !== specialtyIndex) {
        // Order violation found
        const key = `${colIdx}-${allbreedIndex}`;
        errors[key] = `Order violation: ${allbreedCat} is out of order in Allbreed. Must preserve order from ${hairLength} column`;
      }
      specialtyIndex++;
    }
  }
} 

/**
 * Validates that a cat number cannot appear in both Longhair and Shorthair columns
 * Rule: A cat number cannot be both longhair and shorthair in the same Super Specialty ring
 */
function validateCrossColumnDuplicates(
  input: KittenValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  console.log('validateCrossColumnDuplicates (KT) called for ring:', { longhairColIdx, shorthairColIdx });
  
  // Collect cats from Longhair column
  const lhCats: Set<string> = new Set();
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${longhairColIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      lhCats.add(catNumber);
      console.log(`LH cat collected (KT): ${catNumber} at position ${rowIdx}`);
    }
  }
  
  console.log('LH cats collected (KT):', Array.from(lhCats));
  
  // Check if any LH cats appear in SH column
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${shorthairColIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      
      if (lhCats.has(catNumber)) {
        console.log(`Duplicate found (KT): Cat #${catNumber} appears in both LH and SH columns`);
        
        // Mark error in SH column
        errors[key] = `Duplicate: Cat #${catNumber} cannot be both longhair and shorthair`;
        
        // Mark error in LH column (find the position)
        for (let lhRowIdx = 0; lhRowIdx < 15; lhRowIdx++) {
          const lhKey = `${longhairColIdx}-${lhRowIdx}`;
          const lhCell = input.showAwards[lhKey];
          if (lhCell && lhCell.catNumber && lhCell.catNumber.trim() === catNumber) {
            errors[lhKey] = `Duplicate: Cat #${catNumber} cannot be both longhair and shorthair`;
            break;
          }
        }
      }
    }
  }
  
  console.log('Cross-column duplicate validation (KT) errors:', errors);
  return errors;
} 