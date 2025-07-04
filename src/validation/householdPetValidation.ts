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
    let firstEmpty = -1;
    // Map from catNumber to all row indices where it appears (excluding voided and empty)
    const catNumberToRows: Record<string, number[]> = {};
    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const cell = showAwards[key] || { catNumber: '', status: 'HHP' };
      const voided = voidedShowAwards[key];
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
      // Build map for duplicate detection
      if (cell.catNumber) {
        if (!catNumberToRows[cell.catNumber]) catNumberToRows[cell.catNumber] = [];
        catNumberToRows[cell.catNumber].push(rowIdx);
      }
      // Status check (should always be HHP)
      if (cell.status !== 'HHP') {
        errors[key] = 'Status must be HHP';
        continue;
      }
    }
    // After collecting, set duplicate error for all rows with duplicate cat numbers
    Object.entries(catNumberToRows).forEach(([catNum, rows]) => {
      if (catNum && rows.length > 1) {
        rows.forEach(rowIdx => {
          const key = `${colIdx}-${rowIdx}`;
          errors[key] = 'Duplicate cat number within this section of the final';
        });
      }
    });
  });
  return errors;
} 