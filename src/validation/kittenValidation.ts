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
export function validateKittenTab(input: KittenValidationInput, maxCats: number): Record<string, string> {
  const errors: Record<string, string> = {};
  const { columns, showAwards, kittenCounts } = input;
  
  // Helper function to get breakpoint for a ring type
  const getBreakpointForRingType = (ringType: string): number => {
    if (ringType === 'Allbreed') {
      return kittenCounts.total >= 75 ? 15 : 10;
    } else if (ringType === 'Longhair') {
      return kittenCounts.lhKittens >= 75 ? 15 : 10;
    } else if (ringType === 'Shorthair') {
      return kittenCounts.shKittens >= 75 ? 15 : 10;
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
  
  return errors;
} 