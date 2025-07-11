// Kitten tab validation logic (reduced from premiershipValidation)

/**
 * @typedef {Object} KittenValidationInput
 * @property {Array<{judge: any, specialty: string, columnIndex: number}>} columns - Columns for the tab
 * @property {Record<string, {catNumber: string, status: string}>} showAwards - Cat numbers/statuses by cell key
 * @property {Record<string, boolean>} voidedShowAwards - Voided state by cell key
 * @property {Object} kittenCounts - Hair-specific kitten counts for breakpoint calculation
 */
export type KittenValidationInput = {
  columns: { judge: any; specialty: string; columnIndex: number }[];
  showAwards: Record<string, { catNumber: string; status: string }>;
  voidedShowAwards: Record<string, boolean>;
  kittenCounts: {
    lhKittens: number;
    shKittens: number;
    total: number;
  };
};

/**
 * Validate the Kitten tab: sequential entry, duplicate, range, voiding. Only KIT status allowed.
 *
 * - If catNumber is empty, do not require or check status (no error).
 * - Only filled rows require status === 'KIT'.
 *
 * @param {KittenValidationInput} input
 * @returns {Record<string, string>} errors keyed by cell
 */
export function validateKittenTab(input: KittenValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const { columns, showAwards, voidedShowAwards, kittenCounts } = input;
  
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
    let firstEmpty = -1;
    const maxRows = getBreakpointForRingType(col.specialty);
    // Map from catNumber to all row indices where it appears (excluding voided and empty)
    const catNumberToRows: Record<string, number[]> = {};
    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const cell = showAwards[key] || { catNumber: '', status: 'KIT' };
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
      // Status check: Only require status === 'KIT' if catNumber is present
      if (cell.catNumber && cell.status !== 'KIT') {
        errors[key] = 'Status must be KIT';
        continue;
      }
      // If catNumber is empty, do not check or require status (no error)
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