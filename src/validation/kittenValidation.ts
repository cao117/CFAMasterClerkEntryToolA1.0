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
    const seen: Set<string> = new Set();
    let firstEmpty = -1;
    const maxRows = getBreakpointForRingType(col.specialty);
    for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
      const key = `${colIdx}_${rowIdx}`;
      const cell = showAwards[key] || { catNumber: '', status: 'KIT' };
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
      // Status check (should always be KIT)
      if (cell.status !== 'KIT') {
        errors[key] = 'Status must be KIT';
        continue;
      }
    }
  });
  return errors;
} 