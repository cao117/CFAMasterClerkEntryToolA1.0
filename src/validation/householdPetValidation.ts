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
 * Validate the Household Pet tab: sequential entry, duplicate, range, voiding. Only HHP status allowed.
 * @param {HouseholdPetValidationInput} input
 * @returns {Record<string, string>} errors keyed by cell
 */
export function validateHouseholdPetTab(input: HouseholdPetValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const { columns, showAwards, voidedShowAwards, householdPetCount } = input;
  
  // Breakpoint logic: 50 household pets for 15 positions
  const maxRows = householdPetCount >= 50 ? 15 : 10;

  // For each column
  columns.forEach((col, colIdx) => {
    const seen: Set<string> = new Set();
    let firstEmpty = -1;
    
    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`; // Use hyphen separator to match component
      const cell = showAwards[key] || { catNumber: '', status: 'HHP' };
      const voided = voidedShowAwards[key];
      
      // Skip validation for voided cells
      if (voided) continue;
      
      // Range check
      if (cell.catNumber && (isNaN(Number(cell.catNumber)) || Number(cell.catNumber) < 1 || Number(cell.catNumber) > 450)) {
        errors[key] = 'Cat number must be between 1 and 450';
        continue;
      }
      
      // Sequential entry
      if (cell.catNumber === '' && firstEmpty === -1) {
        firstEmpty = rowIdx;
      }
      if (cell.catNumber !== '' && firstEmpty !== -1 && rowIdx > firstEmpty) {
        errors[key] = 'You must fill previous placements before entering this position.';
        continue;
      }
      
      // Duplicate check (within column)
      if (cell.catNumber && seen.has(cell.catNumber)) {
        errors[key] = 'Duplicate cat number within this column';
        continue;
      }
      if (cell.catNumber) seen.add(cell.catNumber);
      
      // Status check (should always be HHP)
      if (cell.status !== 'HHP') {
        errors[key] = 'Status must be HHP';
        continue;
      }
    }
  });
  return errors;
} 