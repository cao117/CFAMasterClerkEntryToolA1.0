// Household Pet tab validation logic (matching KittenTab except for breakpoint and status)

/**
 * @typedef {Object} HouseholdPetValidationInput
 * @property {Array<{judge: any, columnIndex: number}>} columns - Columns for the tab
 * @property {Record<string, {catNumber: string, status: string}>} showAwards - Cat numbers/statuses by cell key
 * @property {Record<string, boolean>} voidedShowAwards - Voided state by cell key
 * @property {number} householdPetCount - Total household pet count for breakpoint calculation
 */
export type HouseholdPetValidationInput = {
  columns: { judge: any; columnIndex: number }[];
  showAwards: Record<string, { catNumber: string; status: string }>;
  voidedShowAwards: Record<string, boolean>;
  householdPetCount: number;
};

/**
 * Utility: Check if a cat number input is VOID (case-insensitive)
 * @param {string} catNumber - The cat number to check
 * @returns {boolean} True if the input is VOID
 */
function isVoidInput(catNumber: string): boolean {
  return typeof catNumber === 'string' && catNumber.trim().toUpperCase() === 'VOID';
}

/**
 * Validate the Household Pet tab: sequential entry, duplicate, range, voiding. Only HHP status allowed.
 *
 * - If catNumber is empty, do not require or check status (no error).
 * - If catNumber is VOID, do not require or check status (no error).
 * - Only filled rows require status === 'HHP'.
 * - VOIDED placements are treated as if they don't exist for validation purposes.
 *
 * @param {HouseholdPetValidationInput} input
 * @returns {Record<string, string>} errors keyed by cell
 */
export function validateHouseholdPetTab(input: HouseholdPetValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const { columns, showAwards, householdPetCount } = input;
  // Breakpoint logic: 50 household pets for 15 positions
  const maxRows = householdPetCount >= 50 ? 15 : 10;
  // For each column
  columns.forEach((_, colIdx) => {
    // Map from catNumber to all row indices where it appears (excluding voided and empty)
    const catNumberToRows: Record<string, number[]> = {};
    
    // First pass: collect all non-VOID cat numbers for duplicate detection
    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const cell = showAwards[key] || { catNumber: '', status: 'HHP' };
      
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
      const cell = showAwards[key] || { catNumber: '', status: 'HHP' };
      
      // Skip VOIDED placements for validation (treat as if they don't exist)
      if (isVoidInput(cell.catNumber)) continue;
      
      // 1. Range check (Format validation) - assign first
      const catNum = Number(cell.catNumber);
      if (cell.catNumber && (isNaN(catNum) || catNum < 1 || catNum > 450)) {
        errors[key] = 'Cat number must be between 1 and 450 or VOID';
        continue;
      }
      
      // 2. Duplicate error - only if no range error
      if (cell.catNumber && catNumberToRows[cell.catNumber] && catNumberToRows[cell.catNumber].length > 1) {
        if (errors[key]) {
          errors[key] = 'Cat number must be between 1 and 450 or VOID. Duplicate: This cat is already placed in another position.';
        } else {
          errors[key] = 'Duplicate: This cat is already placed in another position.';
        }
        continue;
      }
      
      // 3. Sequential entry error - only if no range or duplicate error
      if (cell.catNumber && !errors[key]) {
        let sequentialError = false;
        for (let i = 0; i < rowIdx; i++) {
          const prevKey = `${colIdx}-${i}`;
          const prevCell = showAwards[prevKey] || { catNumber: '', status: 'HHP' };
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
      
      // 4. Status check: Only require status === 'HHP' if catNumber is present and not VOID
      if (cell.catNumber && !isVoidInput(cell.catNumber) && cell.status !== 'HHP') {
        errors[key] = 'Status must be HHP';
        continue;
      }
      // If catNumber is empty or VOID, do not check or require status (no error)
    }
  });
  return errors;
} 