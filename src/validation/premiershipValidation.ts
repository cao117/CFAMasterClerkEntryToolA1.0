// Premiership validation logic for CFA Master Clerk Entry Tool
// Closely mirrors championshipValidation.ts but for Premiership rules
// Only PR are eligible for Best PR finals; GP and NOV are not eligible
// Hair-specific breakpoints per ring type; void, duplicate, and sequential logic enforced

/**
 * @fileoverview Premiership tab validation logic for CFA Master Clerk Entry Tool.
 * - Only PR eligible for Best PR finals (AB/LH/SH)
 * - GP, PR, NOV eligible for Premiership Final (top 10/15)
 * - Hair-specific breakpoints per ring type
 * - Duplicate, sequential, and void logic enforced
 * - Closely mirrors championshipValidation.ts structure and order
 */

/**
 * Judge interface for validation context
 */
export interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

/**
 * CellData for each placement cell
 */
export interface CellData {
  catNumber: string;
  status: string; // GP, PR, NOV
  voided?: boolean;
}

/**
 * PremiershipValidationInput: all data needed for validation
 */
export interface PremiershipValidationInput {
  columns: { judge: Judge; specialty: string }[];
  showAwards: { [key: string]: CellData };
  premiersFinals: { [key: string]: string };
  abPremiersFinals: { [key: string]: string };
  lhPremiersFinals: { [key: string]: string };
  shPremiersFinals: { [key: string]: string };
  premiershipTotal: number;
  premiershipCounts: {
    gcs: number;
    lhPrs: number;
    shPrs: number;
    novs: number;
  };
  voidedShowAwards?: { [key: string]: boolean };
  voidedPremiersFinals?: { [key: string]: boolean };
  voidedABPremiersFinals?: { [key: string]: boolean };
  voidedLHPremiersFinals?: { [key: string]: boolean };
  voidedSHPremiersFinals?: { [key: string]: boolean };
}

/**
 * Validates if a cat number is in the correct format (1-450)
 */
export function validateCatNumber(value: string): boolean {
  if (!value || value.trim() === '') return true;
  
  const num = parseInt(value.trim());
  return !isNaN(num) && num >= 1 && num <= 450;
}

/**
 * Checks for duplicate cat numbers within the show awards section only
 */
export function checkDuplicateCatNumbersInShowAwards(
  input: PremiershipValidationInput, 
  columnIndex: number, 
  newValue: string,
  excludeKey?: string
): boolean {
  const { showAwards } = input;
  
  if (!newValue || newValue.trim() === '') {
    return false; // Empty values don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  
  // Collect all cat numbers from show awards in this column only
  for (let position = 0; position < 15; position++) {
    const key = `${columnIndex}_${position}`;
    if (key !== excludeKey && showAwards[key]?.catNumber) {
      const catNum = showAwards[key].catNumber.trim();
      if (catNum && catNum !== '') {
        valuesInSection.add(catNum);
      }
    }
  }
  
  return valuesInSection.has(trimmedValue);
}

/**
 * Checks for duplicate cat numbers within the premiers finals section only
 */
export function checkDuplicateCatNumbersInPremiersFinals(
  input: PremiershipValidationInput, 
  columnIndex: number, 
  newValue: string, 
  excludeKey?: string
): boolean {
  const { premiersFinals, columns } = input;
  
  if (!newValue || newValue.trim() === '') {
    return false; // Empty values don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  
  // Collect all cat numbers from premiers finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}_${position}`;
    if (key !== excludeKey && premiersFinals[key]) {
      const catNum = premiersFinals[key].trim();
      if (catNum && catNum !== '') {
        valuesInSection.add(catNum);
      }
    }
  }
  
  return valuesInSection.has(trimmedValue);
}

/**
 * Checks for duplicate cat numbers within the AB premiers finals section only
 */
export function checkDuplicateCatNumbersInABPremiersFinals(
  input: PremiershipValidationInput, 
  columnIndex: number, 
  newValue: string, 
  excludeKey?: string
): boolean {
  const { abPremiersFinals, columns } = input;
  
  if (!newValue || newValue.trim() === '') {
    return false; // Empty values don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  
  // Collect all cat numbers from AB premiers finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}_${position}`;
    if (key !== excludeKey && abPremiersFinals[key]) {
      const catNum = abPremiersFinals[key].trim();
      if (catNum && catNum !== '') {
        valuesInSection.add(catNum);
      }
    }
  }
  
  const hasDuplicate = valuesInSection.has(trimmedValue);
  
  return hasDuplicate;
}

/**
 * Checks for duplicate cat numbers within the LH premiers finals section only
 */
export function checkDuplicateCatNumbersInLHPremiersFinals(
  input: PremiershipValidationInput, 
  columnIndex: number, 
  newValue: string, 
  excludeKey?: string
): boolean {
  const { lhPremiersFinals, columns } = input;
  
  if (!newValue || newValue.trim() === '') {
    return false; // Empty values don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  
  // Collect all cat numbers from LH premiers finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}_${position}`;
    if (key !== excludeKey && lhPremiersFinals[key]) {
      const catNum = lhPremiersFinals[key].trim();
      if (catNum && catNum !== '') {
        valuesInSection.add(catNum);
      }
    }
  }
  
  return valuesInSection.has(trimmedValue);
}

/**
 * Checks for duplicate cat numbers within the SH premiers finals section only
 */
export function checkDuplicateCatNumbersInSHPremiersFinals(
  input: PremiershipValidationInput, 
  columnIndex: number, 
  newValue: string, 
  excludeKey?: string
): boolean {
  const { shPremiersFinals, columns } = input;
  
  if (!newValue || newValue.trim() === '') {
    return false; // Empty values don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  
  // Collect all cat numbers from SH premiers finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}_${position}`;
    if (key !== excludeKey && shPremiersFinals[key]) {
      const catNum = shPremiersFinals[key].trim();
      if (catNum && catNum !== '') {
        valuesInSection.add(catNum);
      }
    }
  }
  
  return valuesInSection.has(trimmedValue);
}

/**
 * Gets the top 15 PR cats from premiership final for a column
 */
export function getTop15PRCats(input: PremiershipValidationInput, columnIndex: number): string[] {
  const { showAwards } = input;
  const prCats: string[] = [];
  
  for (let position = 0; position < 15; position++) {
    const key = `${columnIndex}_${position}`;
    const award = showAwards[key];
    if (award && award.status === 'PR' && award.catNumber && (award.catNumber ?? '').trim() !== '') {
      prCats.push(award.catNumber.trim());
    }
  }
  
  return prCats;
}

/**
 * Get premiership count for a ring type (for breakpoint logic)
 */
export function getPremiershipCountForRingType(input: PremiershipValidationInput, ringType: string): number {
  if (ringType === 'Allbreed') {
    // Allbreed: LH GP + SH GP + LH PR + SH PR
    return input.premiershipCounts.gcs + input.premiershipCounts.lhPrs + input.premiershipCounts.shPrs;
  } else if (ringType === 'Longhair') {
    // Longhair: LH GP + LH PR
    return input.premiershipCounts.gcs + input.premiershipCounts.lhPrs;
  } else if (ringType === 'Shorthair') {
    // Shorthair: SH GP + SH PR
    return input.premiershipCounts.gcs + input.premiershipCounts.shPrs;
  }
  return 0;
}

/**
 * Get breakpoint for a ring type (>=50 or <50)
 */
export function getBreakpointForRingType(input: PremiershipValidationInput, ringType: string): number {
  return getPremiershipCountForRingType(input, ringType) >= 50 ? 15 : 10;
}

/**
 * Get number of Best PR finals for a ring type (3 if >=50, 2 if <50)
 */
export function getFinalsPositionsForRingType(input: PremiershipValidationInput, ringType: string): number {
  return getPremiershipCountForRingType(input, ringType) >= 50 ? 3 : 2;
}

/**
 * Validates that positions are filled sequentially (no skipping)
 */
export function validateSequentialEntry(
  input: PremiershipValidationInput,
  section: 'showAwards' | 'premiers' | 'abPremiers' | 'lhPremiers' | 'shPremiers', 
  columnIndex: number, 
  position: number, 
  newValue: string
): boolean {
  const { showAwards, premiersFinals, abPremiersFinals, lhPremiersFinals, shPremiersFinals } = input;
  
  if (!newValue || newValue.trim() === '') return true; // Empty values are okay
  
  // Get the appropriate data source
  let dataSource: { [key: string]: any };
  switch (section) {
    case 'showAwards':
      dataSource = showAwards;
      break;
    case 'premiers':
      dataSource = premiersFinals;
      break;
    case 'abPremiers':
      dataSource = abPremiersFinals;
      break;
    case 'lhPremiers':
      dataSource = lhPremiersFinals;
      break;
    case 'shPremiers':
      dataSource = shPremiersFinals;
      break;
  }
  
  // Check if all previous positions are filled
  for (let i = 0; i < position; i++) {
    const key = `${columnIndex}_${i}`;
    let hasValue = false;
    
    if (section === 'showAwards') {
      hasValue = dataSource[key]?.catNumber && (dataSource[key].catNumber ?? '').trim() !== '';
    } else {
      hasValue = dataSource[key] && (dataSource[key] ?? '').trim() !== '';
    }
    
    if (!hasValue) {
      return false; // Found a gap, sequential entry violated
    }
  }
  
  return true; // All previous positions are filled
}

/**
 * Check eligibility for Best PR finals (only PR allowed)
 */
export function isPREligible(status: string): boolean {
  return status === 'PR';
}

// Move getShowAwardStatus to search all columns for the cat number, not just the current column
function getShowAwardStatus(input: PremiershipValidationInput, _columnIndex: number, catNum: string): string | null {
  const { columns, showAwards } = input;
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const numAwardRows = getBreakpointForRingType(input, columns[colIdx].specialty);
    for (let j = 0; j < numAwardRows; j++) {
      const award = showAwards[`${colIdx}_${j}`];
      if (
        award &&
        typeof award.catNumber === 'string' &&
        (award.catNumber ?? '').trim().toUpperCase() === catNum.trim().toUpperCase()
      ) {
        if (typeof window !== 'undefined' && window.console) {
          console.debug(`[VALIDATION] Found cat ${catNum} in Show Awards at col ${colIdx}, pos ${j}, status: ${award.status}`);
        }
        if (!award.status || typeof award.status !== 'string' || (award.status ?? '').trim() === '') {
          return 'MISSING';
        }
        const status = (award.status ?? '').trim().toUpperCase();
        if (status === 'GP' || status === 'PR' || status === 'NOV') {
          return status;
        } else {
          return 'INVALID';
        }
      }
    }
  }
  if (typeof window !== 'undefined' && window.console) {
    console.debug(`[VALIDATION] Cat ${catNum} not found in any Show Awards`);
  }
  return null;
}

// --- Winston-style logger for browser/Node (minimal, replace with real Winston in Node) ---
const logger = {
  debug: (...args: any[]) => {}, // Only enable if needed for a specific bug
  info: (...args: any[]) => {},
  warn: (...args: any[]) => {},
};

/**
 * Main column relationship validation function - matches Championship structure exactly
 */
export function validateColumnRelationships(input: PremiershipValidationInput, columnIndex: number): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  const { columns, showAwards, abPremiersFinals, lhPremiersFinals, shPremiersFinals } = input;
  const column = columns[columnIndex];
  if (!column) return errors;
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);

  // --- Best AB PR: Duplicate check first, then status check (matches ChampionshipTab) ---
  if (column.specialty === 'Allbreed') {
    // 1. Collect all values and count occurrences
    const valueCounts: { [cat: string]: number } = {};
    for (let i = 0; i < numPositions; i++) {
      const value = abPremiersFinals[`${columnIndex}_${i}`];
      if (value && (value ?? '').trim() !== '') {
        const trimmed = (value ?? '').trim();
        valueCounts[trimmed] = (valueCounts[trimmed] || 0) + 1;
      }
    }
    
    // 2. Set duplicate errors for all positions with duplicate values
    for (let i = 0; i < numPositions; i++) {
      const value = abPremiersFinals[`${columnIndex}_${i}`];
      if (value && (value ?? '').trim() !== '') {
        const trimmed = (value ?? '').trim();
        // Do NOT use alert() here; alerts in validation cause infinite loops due to React re-renders.
        // Errors should be set in the errors object and displayed in the UI, matching ChampionshipTab behavior.
        if (valueCounts[trimmed] > 1) {
          const key = `abPremiersFinals_${columnIndex}_${i}`;
          errors[key] = `Duplicate cat number within Best AB PR Final section`;
        }
      }
    }
    // 3. Only set status errors for positions that do NOT have a duplicate error
    for (let i = 0; i < numPositions; i++) {
      const value = abPremiersFinals[`${columnIndex}_${i}`];
      const key = `abPremiersFinals_${columnIndex}_${i}`;
      if (value && (value ?? '').trim() !== '' && !errors[key]) {
        const status = getShowAwardStatus(input, columnIndex, (value ?? '').trim());
        if (status === 'GP' || status === 'NOV') {
          errors[key] = `${(value ?? '').trim()} is listed as a ${status} in Show Awards and cannot be awarded PR final.`;
        }
      }
    }
  }

  // --- Best LH/SH PR: Duplicate check first, then status check (matches Best AB PR logic) ---
  if (column.specialty === 'Allbreed' || column.specialty === 'Longhair') {
    // LH PR
    // 1. Collect all values and count occurrences
    const valueCounts: { [cat: string]: number } = {};
    for (let i = 0; i < numPositions; i++) {
      const value = lhPremiersFinals[`${columnIndex}_${i}`];
      if (value && (value ?? '').trim() !== '') {
        const trimmed = (value ?? '').trim();
        valueCounts[trimmed] = (valueCounts[trimmed] || 0) + 1;
      }
    }
    // 2. Set duplicate errors for all positions with duplicate values
    for (let i = 0; i < numPositions; i++) {
      const value = lhPremiersFinals[`${columnIndex}_${i}`];
      if (value && (value ?? '').trim() !== '') {
        const trimmed = (value ?? '').trim();
        const key = `lhPremiersFinals_${columnIndex}_${i}`;
        if (valueCounts[trimmed] > 1) {
          errors[key] = `Duplicate cat number within Best LH PR Final section`;
        }
      }
    }
    // 3. Only set status errors for positions that do NOT have a duplicate error
    for (let i = 0; i < numPositions; i++) {
      const value = lhPremiersFinals[`${columnIndex}_${i}`];
      const key = `lhPremiersFinals_${columnIndex}_${i}`;
      if (value && (value ?? '').trim() !== '' && !errors[key]) {
        const status = getShowAwardStatus(input, columnIndex, (value ?? '').trim());
        if (status === 'GP' || status === 'NOV') {
          errors[key] = `${(value ?? '').trim()} is listed as a ${status} in Show Awards and cannot be awarded PR final.`;
        } else if (status === 'MISSING') {
          errors[key] = `${(value ?? '').trim()} in Show Awards is missing a status (GP/PR/NOV) and cannot be awarded PR final.`;
        } else if (status === 'INVALID') {
          errors[key] = `${(value ?? '').trim()} in Show Awards has an invalid status and cannot be awarded PR final.`;
        }
      }
    }
  }
  if (column.specialty === 'Allbreed' || column.specialty === 'Shorthair') {
    // SH PR
    // 1. Collect all values and count occurrences
    const valueCounts: { [cat: string]: number } = {};
    for (let i = 0; i < numPositions; i++) {
      const value = shPremiersFinals[`${columnIndex}_${i}`];
      if (value && (value ?? '').trim() !== '') {
        const trimmed = (value ?? '').trim();
        valueCounts[trimmed] = (valueCounts[trimmed] || 0) + 1;
      }
    }
    // 2. Set duplicate errors for all positions with duplicate values
    for (let i = 0; i < numPositions; i++) {
      const value = shPremiersFinals[`${columnIndex}_${i}`];
      if (value && (value ?? '').trim() !== '') {
        const trimmed = (value ?? '').trim();
        const key = `shPremiersFinals_${columnIndex}_${i}`;
        if (valueCounts[trimmed] > 1) {
          errors[key] = `Duplicate cat number within Best SH PR Final section`;
        }
      }
    }
    // 3. Only set status errors for positions that do NOT have a duplicate error
    for (let i = 0; i < numPositions; i++) {
      const value = shPremiersFinals[`${columnIndex}_${i}`];
      const key = `shPremiersFinals_${columnIndex}_${i}`;
      if (value && (value ?? '').trim() !== '' && !errors[key]) {
        const status = getShowAwardStatus(input, columnIndex, (value ?? '').trim());
        if (status === 'GP' || status === 'NOV') {
          errors[key] = `${(value ?? '').trim()} is listed as a ${status} in Show Awards and cannot be awarded PR final.`;
        } else if (status === 'MISSING') {
          errors[key] = `${(value ?? '').trim()} in Show Awards is missing a status (GP/PR/NOV) and cannot be awarded PR final.`;
        } else if (status === 'INVALID') {
          errors[key] = `${(value ?? '').trim()} in Show Awards has an invalid status and cannot be awarded PR final.`;
        }
      }
    }
  }

  // --- Best AB PR: Order/assignment reminders and other logic as before ---
  // Validate Best PR with top 15 PR (order, assignment, etc.)
  const bestPRResult = validateBestPRWithTop15AndGetFirstError(input, columnIndex, errors);
  if (!bestPRResult.isValid) {
    const key = `abPremiersFinals_${columnIndex}_${bestPRResult.firstErrorPosition}`;
    // Only set this error if not already set (i.e., duplicate error takes precedence)
    if (!errors[key]) {
      errors[key] = bestPRResult.errorMessage;
    }
    // Do not return early; allow other errors to be set for other positions
  }

  // Validate LH/SH split with new logic (only if no GP/NOV errors in Best AB PR)
  const lhshResult = validateLHSHWithBestPRAndGetFirstError(input, columnIndex);
  if (!lhshResult.isValid && lhshResult.errorKeys && lhshResult.errorMessages) {
    lhshResult.errorKeys.forEach((key, idx) => {
      if (!errors[key]) {
        errors[key] = lhshResult.errorMessages ? lhshResult.errorMessages[idx] || 'LH/SH split error' : 'LH/SH split error';
      }
    });
  } else if (lhshResult.isReminder && lhshResult.errorKeys && lhshResult.errorMessages) {
    lhshResult.errorKeys.forEach((key, idx) => {
      if (!errors[key]) {
        errors[key] = `[REMINDER] ${lhshResult.errorMessages ? lhshResult.errorMessages[idx] : 'LH/SH split reminder'}`;
      }
    });
  }

  // Validate Best LH PR with new logic (all errors)
  const bestLHErrors = validateBestHairPRWithFiller(input, columnIndex, 'LH');
  Object.entries(bestLHErrors).forEach(([pos, msg]) => {
    const key = `lhPremiersFinals_${pos}`;
    errors[key] = msg;
  });

  // Validate Best SH PR with new logic (all errors)
  const bestSHErrors = validateBestHairPRWithFiller(input, columnIndex, 'SH');
  Object.entries(bestSHErrors).forEach(([pos, msg]) => {
    const key = `shPremiersFinals_${pos}`;
    errors[key] = msg;
  });

  // Validate LH/SH PR order (new rule)
  const lhOrderErrors = validateBestHairPROrder(input, columnIndex, 'LH');
  Object.entries(lhOrderErrors).forEach(([pos, msg]) => {
    const key = `lhPremiersFinals_${pos}`;
    errors[key] = msg;
  });
  const shOrderErrors = validateBestHairPROrder(input, columnIndex, 'SH');
  Object.entries(shOrderErrors).forEach(([pos, msg]) => {
    const key = `shPremiersFinals_${pos}`;
    errors[key] = msg;
  });

  // Single Specialty LH strict validation
  if (column.specialty === 'Longhair') {
    const lhResult = validateSingleSpecialtyPRWithTop15AndGetFirstError(input, columnIndex, 'LH');
    if (!lhResult.isValid) {
      const key = `lhPremiersFinals_${lhResult.firstErrorPosition}`;
      errors[key] = lhResult.errorMessage;
      return errors;
    }
  }
  // Single Specialty SH strict validation
  if (column.specialty === 'Shorthair') {
    const shResult = validateSingleSpecialtyPRWithTop15AndGetFirstError(input, columnIndex, 'SH');
    if (!shResult.isValid) {
      const key = `shPremiersFinals_${shResult.firstErrorPosition}`;
      errors[key] = shResult.errorMessage;
      return errors;
    }
  }

  return errors;
}

/**
 * Main validation function - matches Championship structure and order exactly
 */
export function validatePremiershipTab(input: PremiershipValidationInput): { [key: string]: string } {
  const { columns, showAwards, premiersFinals, abPremiersFinals, lhPremiersFinals, shPremiersFinals } = input;
  const errors: { [key: string]: string } = {};
  
  // Validate show awards
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    for (let position = 0; position < 15; position++) {
      const key = `${columnIndex}_${position}`;
      const award = showAwards[key];
      
      if (award && award.catNumber && (award.catNumber ?? '').trim() !== '') {
        // Validate cat number format
        if (!validateCatNumber(award.catNumber)) {
          errors[key] = 'Cat number must be between 1-450';
          continue;
        }
        // Section-specific sequential entry error for Premiership Final
        if (!validateSequentialEntry(input, 'showAwards', columnIndex, position, award.catNumber)) {
          errors[key] = 'You must fill in previous empty award placements in Premiership Final before entering this position.';
          continue;
        }
        // Validate no duplicates within column
        if (checkDuplicateCatNumbersInShowAwards(input, columnIndex, award.catNumber, key)) {
          errors[key] = 'Duplicate cat number within this column';
          continue;
        }
      }
    }
  }
  
  // Validate finals sections
  const sections = [
    { name: 'premiers', data: premiersFinals, prefix: 'premiers' },
    { name: 'abPremiers', data: abPremiersFinals, prefix: 'abPremiers' },
    { name: 'lhPremiers', data: lhPremiersFinals, prefix: 'lhPremiers' },
    { name: 'shPremiers', data: shPremiersFinals, prefix: 'shPremiers' }
  ] as const;
  
  for (const section of sections) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      const numPositions = getFinalsPositionsForRingType(input, column.specialty);
      
      for (let position = 0; position < numPositions; position++) {
        const key = `${columnIndex}_${position}`;
        const errorKey = `${section.prefix}_${columnIndex}_${position}`;
        const value = section.data[key];
        
        if (value && (value ?? '').trim() !== '') {
          // Validate cat number format
          if (!validateCatNumber(value)) {
            errors[errorKey] = 'Cat number must be between 1-450';
            continue;
          }
          // Sequential entry error (must take precedence over assignment reminder)
          if (!validateSequentialEntry(input, section.name, columnIndex, position, value)) {
            let sectionLabel = '';
            switch (section.name) {
              case 'premiers':
                sectionLabel = 'Premiers Final';
                break;
              case 'abPremiers':
                sectionLabel = 'Best AB PR Final';
                break;
              case 'lhPremiers':
                sectionLabel = 'Best LH PR Final';
                break;
              case 'shPremiers':
                sectionLabel = 'Best SH PR Final';
                break;
              default:
                sectionLabel = 'Premiership Final';
            }
            errors[errorKey] = `You must fill in previous empty award placements in ${sectionLabel} before entering this position.`;
            continue;
          }
          // Validate no duplicates within own section only
          let hasDuplicate = false;
          switch (section.name) {
            case 'premiers':
              hasDuplicate = checkDuplicateCatNumbersInPremiersFinals(input, columnIndex, value, key);
              break;
            case 'abPremiers':
              hasDuplicate = checkDuplicateCatNumbersInABPremiersFinals(input, columnIndex, value, key);
              break;
            case 'lhPremiers':
              hasDuplicate = checkDuplicateCatNumbersInLHPremiersFinals(input, columnIndex, value, key);
              break;
            case 'shPremiers':
              hasDuplicate = checkDuplicateCatNumbersInSHPremiersFinals(input, columnIndex, value, key);
              break;
          }
          if (hasDuplicate) {
            let sectionName = '';
            switch (section.name) {
              case 'premiers':
                sectionName = 'Premiers Final';
                break;
              case 'abPremiers':
                sectionName = 'Best AB PR Final';
                break;
              case 'lhPremiers':
                sectionName = 'Best LH PR Final';
                break;
              case 'shPremiers':
                sectionName = 'Best SH PR Final';
          break;
            }
            errors[errorKey] = `Duplicate cat number within ${sectionName} section`;
            continue;
          }
        }
      }
    }
  }
  
  // Validate column relationships
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    // --- Custom precedence for Best AB PR: duplicate > status > sequential > order > assignment reminder ---
    const columnErrors = validateColumnRelationships(input, columnIndex);
    Object.entries(columnErrors).forEach(([key, msg]) => {
      // Only show the highest-precedence error for each cell
      const isDuplicate = msg.toLowerCase().includes('duplicate');
      const isStatus = /is listed as a (gp|nov)/i.test(msg) || /missing a status/i.test(msg) || /invalid status/i.test(msg);
      const isSequential = msg.startsWith('You must fill in previous empty award placements');
      const isOrder = msg.startsWith('Must be ');
      const isReminder = msg.startsWith('[REMINDER]');
      if (isDuplicate) {
        errors[key] = msg;
      } else if (isStatus) {
        if (!errors[key] || !errors[key].toLowerCase().includes('duplicate')) {
          errors[key] = msg;
        }
      } else if (isSequential) {
        if (!errors[key] || (!errors[key].toLowerCase().includes('duplicate') && !/is listed as a (gp|nov)/i.test(errors[key]) && !/missing a status/i.test(errors[key]) && !/invalid status/i.test(errors[key]))) {
          errors[key] = msg;
        }
      } else if (isOrder) {
        if (!errors[key] || (!errors[key].toLowerCase().includes('duplicate') && !/is listed as a (gp|nov)/i.test(errors[key]) && !/missing a status/i.test(errors[key]) && !/invalid status/i.test(errors[key]) && !errors[key].startsWith('You must fill in previous empty award placements'))) {
          errors[key] = msg;
        }
      } else if (isReminder) {
        if (!errors[key]) {
          errors[key] = msg;
        }
      } else {
        if (!errors[key]) {
          errors[key] = msg;
        }
        }
      });
    }

  return errors;
}

/**
 * Enhanced: Validates that Best AB PR matches PR cats from Premiership Final (Top 10/15) in order
 * For Allbreed rings: Best AB PR must contain PR cats from Premiership Final in the same order (when PRs exist in Top 10/15)
 * If there are no PRs in Premiership Final, Best AB PR can be filled with any PRs from Show Awards (not in the final)
 * Returns the first position with an error, or -1 if valid
 */
export function validateBestPRWithTop15AndGetFirstError(input: PremiershipValidationInput, columnIndex: number, errorsObj?: { [key: string]: string }): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  const { columns, abPremiersFinals, showAwards } = input;
  const column = columns[columnIndex];
  if (!column || column.specialty !== 'Allbreed') {
    return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
  }
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);
  // Collect premiership final cats (in order) - this is the "top 10/15" section
  const numAwardRows = getBreakpointForRingType(input, column.specialty);
  const premiershipFinalCats: {catNumber: string, status: string}[] = [];
  for (let i = 0; i < numAwardRows; i++) {
    const award = showAwards[`${columnIndex}_${i}`];
    if (award && award.catNumber && (award.catNumber ?? '').trim() !== '') {
      premiershipFinalCats.push({catNumber: award.catNumber.trim(), status: award.status});
    }
  }
  // Find PRs in premiership final
  const prInPremiershipFinal = premiershipFinalCats.filter(c => c.status === 'PR').map(c => c.catNumber);
  // Build required Best AB PR list
  let requiredBestPR: string[] = [];
  if (prInPremiershipFinal.length > 0) {
    // If there are PRs in premiership final, they must be at the top of Best AB PR in order
    requiredBestPR = [...prInPremiershipFinal];
    for (const c of premiershipFinalCats) {
      if (c.status === 'PR' && !requiredBestPR.includes(c.catNumber)) {
        requiredBestPR.push(c.catNumber);
        if (requiredBestPR.length === numPositions) break;
      }
    }
  } else {
    // No PRs in premiership final - Best AB PR can be filled with any PRs from Show Awards (not in the final)
    const allPRs = new Set<string>();
    for (let i = 0; i < numAwardRows; i++) {
      const key = `${columnIndex}_${i}`;
      const award = showAwards[key];
      if (award && award.status === 'PR' && award.catNumber && (award.catNumber ?? '').trim() !== '') {
        allPRs.add(award.catNumber.trim());
      }
    }
    requiredBestPR = Array.from(allPRs).slice(0, numPositions);
  }
  // Validate Best AB PR
  for (let position = 0; position < numPositions; position++) {
    const key = `abPremiersFinals_${columnIndex}_${position}`;
    if (errorsObj && errorsObj[key]) continue; // Skip if duplicate error already set
    const finalsValue = abPremiersFinals[`${columnIndex}_${position}`];
    if (!finalsValue || (finalsValue ?? '').trim() === '') {
      if (position < requiredBestPR.length) {
        return {
          isValid: false,
          firstErrorPosition: position,
          errorMessage: `Must be ${requiredBestPR[position]} (${position + 1}${getOrdinalSuffix(position + 1)} PR required by CFA rules)`
        };
      } else {
        continue;
      }
    }
    // Check if this cat is a PR in the eligible set
    let isGP = false;
    let isNOV = false;
    for (const key in showAwards) {
      const award = showAwards[key];
      if (award && (award.catNumber ?? '').trim() === (finalsValue ?? '').trim()) {
        if (award.status === 'GP') isGP = true;
        if (award.status === 'NOV') isNOV = true;
            break;
          }
    }
    if (isGP || isNOV) {
      return {
        isValid: false,
        firstErrorPosition: position,
        errorMessage: `${(finalsValue ?? '').trim()} is listed as a ${isGP ? 'GP' : 'NOV'} in Show Awards and cannot be awarded PR final.`
      };
    }
    // If there are PRs in premiership final, check order requirements
    if (prInPremiershipFinal.length > 0 && position < requiredBestPR.length && (finalsValue ?? '').trim() !== requiredBestPR[position]) {
      return {
        isValid: false,
        firstErrorPosition: position,
        errorMessage: `Must be ${requiredBestPR[position]} (${position + 1}${getOrdinalSuffix(position + 1)} PR required by CFA rules)`
      };
    }
    // If no PRs in premiership final, do NOT require the cat to be found as PR in show awards; accept any cat unless it is explicitly GP or NOV
  }
  return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Validates that Best AB PR cats are assigned to either LH or SH sections
 * Returns error information if validation fails
 */
export function validateLHSHWithBestPRAndGetFirstError(input: PremiershipValidationInput, columnIndex: number): { isValid: boolean, errorKeys?: string[], errorMessages?: string[], isReminder?: boolean } {
  const { columns, abPremiersFinals, lhPremiersFinals, shPremiersFinals, showAwards } = input;
  const column = columns[columnIndex];
  
  // Only validate for Allbreed rings
  if (!column || column.specialty !== 'Allbreed') {
    return { isValid: true };
  }
  
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);
  const errorKeys: string[] = [];
  const errorMessages: string[] = [];
  
  // Check each Best AB PR cat
  for (let i = 0; i < numPositions; i++) {
    const abKey = `${columnIndex}_${i}`;
    const abValue = abPremiersFinals[abKey];
    
    if (abValue && (abValue ?? '').trim() !== '') {
      const trimmedValue = (abValue ?? '').trim();
      let foundInLH = false;
      let foundInSH = false;
      
      // Check if this cat appears in LH section
      for (let j = 0; j < numPositions; j++) {
        const lhKey = `${columnIndex}_${j}`;
        const lhValue = lhPremiersFinals[lhKey];
        if (lhValue && (lhValue ?? '').trim() === trimmedValue) {
          foundInLH = true;
          break;
        }
      }
      
      // Check if this cat appears in SH section
      for (let j = 0; j < numPositions; j++) {
        const shKey = `${columnIndex}_${j}`;
        const shValue = shPremiersFinals[shKey];
        if (shValue && (shValue ?? '').trim() === trimmedValue) {
          foundInSH = true;
          break;
        }
      }
      
      // NO SUCH LOGIC EXISTS - cats do NOT need to be in Show Awards first
      // This was completely wrong and has been removed
      // If cat is not assigned to either LH or SH, it's a reminder
      if (!foundInLH && !foundInSH) {
        errorKeys.push(`abPremiersFinals_${columnIndex}_${i}`);
        errorMessages.push(`${trimmedValue} must be assigned to either Longhair or Shorthair section.`);
      }
    }
  }
  
  if (errorKeys.length > 0) {
    return {
      isValid: false,
      errorKeys,
      errorMessages,
      isReminder: true // This is a reminder, not a hard error
    };
  }
  
  return { isValid: true };
}

/**
 * Validates Best LH PR with Top 15 and returns first error
 */
export function validateBestLHPRWithTop15AndGetFirstError(input: PremiershipValidationInput, columnIndex: number): { isValid: boolean, errorIndex: number, errorMessage: string } {
  const { columns, lhPremiersFinals } = input;
  const column = columns[columnIndex];
  
  // Only validate for Allbreed and Longhair rings
  if (!column || (column.specialty !== 'Allbreed' && column.specialty !== 'Longhair')) {
    return { isValid: true, errorIndex: -1, errorMessage: '' };
  }
  
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);
  const top15PRCats = getTop15PRCats(input, columnIndex);
  
  // For single specialty Longhair, validate strict order
  if (column.specialty === 'Longhair') {
    for (let i = 0; i < numPositions; i++) {
          const key = `${columnIndex}_${i}`;
    const lhValue = lhPremiersFinals[key];
      
      if (lhValue && (lhValue ?? '').trim() !== '') {
        const trimmedValue = (lhValue ?? '').trim();
        const prIndex = top15PRCats.indexOf(trimmedValue);
        
        if (prIndex === -1) {
          return {
            isValid: false,
            errorIndex: i,
            errorMessage: `${trimmedValue} is not in the Top ${getBreakpointForRingType(input, column.specialty)} PR cats from Premiership Final.`
          };
        }
        
        if (prIndex !== i) {
          return {
            isValid: false,
            errorIndex: i,
            errorMessage: `${trimmedValue} should be in position ${prIndex + 1} based on Premiership Final order, not position ${i + 1}.`
          };
        }
      }
    }
  }
  
  return { isValid: true, errorIndex: -1, errorMessage: '' };
}

/**
 * Validates Best SH PR with Top 15 and returns first error
 */
export function validateBestSHPRWithTop15AndGetFirstError(input: PremiershipValidationInput, columnIndex: number): { isValid: boolean, errorIndex: number, errorMessage: string } {
  const { columns, shPremiersFinals } = input;
  const column = columns[columnIndex];
  
  // Only validate for Allbreed and Shorthair rings
  if (!column || (column.specialty !== 'Allbreed' && column.specialty !== 'Shorthair')) {
    return { isValid: true, errorIndex: -1, errorMessage: '' };
  }
  
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);
  const top15PRCats = getTop15PRCats(input, columnIndex);
  
  // For single specialty Shorthair, validate strict order
  if (column.specialty === 'Shorthair') {
    for (let i = 0; i < numPositions; i++) {
          const key = `${columnIndex}_${i}`;
    const shValue = shPremiersFinals[key];
      
      if (shValue && (shValue ?? '').trim() !== '') {
        const trimmedValue = (shValue ?? '').trim();
        const prIndex = top15PRCats.indexOf(trimmedValue);
        
        if (prIndex === -1) {
          return {
            isValid: false,
            errorIndex: i,
            errorMessage: `${trimmedValue} is not in the Top ${getBreakpointForRingType(input, column.specialty)} PR cats from Premiership Final.`
          };
        }
        
        if (prIndex !== i) {
          return {
            isValid: false,
            errorIndex: i,
            errorMessage: `${trimmedValue} should be in position ${prIndex + 1} based on Premiership Final order, not position ${i + 1}.`
          };
        }
      }
    }
  }
  
  return { isValid: true, errorIndex: -1, errorMessage: '' };
}

/**
 * Validates Best LH/SH PR order and returns errors
 */
function validateBestHairPROrder(input: PremiershipValidationInput, columnIndex: number, hair: 'LH' | 'SH') {
  const { columns, lhPremiersFinals, shPremiersFinals, abPremiersFinals } = input;
  const column = columns[columnIndex];
  
  // Only validate for Allbreed rings
  if (!column || column.specialty !== 'Allbreed') {
    return {};
  }
  
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);
  const sectionFinals = hair === 'LH' ? lhPremiersFinals : shPremiersFinals;
  const errors: { [position: number]: string } = {};
  
  // Get Best AB PR cats in order
  const bestABPRCats: string[] = [];
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}_${i}`;
    const value = abPremiersFinals[key];
    if (value && (value ?? '').trim() !== '') {
      bestABPRCats.push(value.trim());
    }
  }
  
  // Check if Best Hair PR cats appear in the same order as Best AB PR
  let currentABIndex = 0;
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}_${i}`;
    const hairValue = sectionFinals[key];
    
    if (hairValue && (hairValue ?? '').trim() !== '') {
      const trimmedValue = (hairValue ?? '').trim();
      const abIndex = bestABPRCats.indexOf(trimmedValue);
      
      if (abIndex !== -1 && abIndex < currentABIndex) {
        const ordinal = (n: number) => ['Best', '2nd Best', '3rd Best', '4th Best', '5th Best'][n] || `${n+1}th Best`;
        errors[i] = `${ordinal(i)} ${hair} PR should be ${ordinal(abIndex)} AB PR, not ${ordinal(currentABIndex)} AB PR.`;
      }
      
      if (abIndex !== -1) {
        currentABIndex = Math.max(currentABIndex, abIndex + 1);
      }
    }
  }

  return errors;
}

/**
 * Validates Best Hair PR with filler logic (for Allbreed rings)
 */
function validateBestHairPRWithFiller(input: PremiershipValidationInput, columnIndex: number, hair: 'LH' | 'SH') {
  const { columns, lhPremiersFinals, shPremiersFinals, showAwards } = input;
  const column = columns[columnIndex];
  if (!column || column.specialty !== 'Allbreed') return {};
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);
  
  const sectionFinals = hair === 'LH' ? lhPremiersFinals : shPremiersFinals;
  const errors: { [position: number]: string } = {};
  
  // Check for non-PR in fillers, duplicates, and cross-section conflicts
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}_${i}`;
    const value = sectionFinals[key];
    if (!value || (value ?? '').trim() === '') continue;
    
    // Check Show Awards status for this cat number
    const status = getShowAwardStatus(input, columnIndex, (value ?? '').trim());
    if (status === 'GP' || status === 'NOV') {
      errors[i] = `${(value ?? '').trim()} is listed as a ${status} in Show Awards and cannot be awarded PR final.`;
      continue;
    } else if (status === 'MISSING') {
      errors[i] = `${(value ?? '').trim()} in Show Awards is missing a status (GP/PR/NOV) and cannot be awarded PR final.`;
      continue;
    } else if (status === 'INVALID') {
      errors[i] = `${(value ?? '').trim()} in Show Awards has an invalid status and cannot be awarded PR final.`;
      continue;
    }
  }

  return errors;
}

/**
 * Validates single specialty PR with Top 15 and returns first error
 */
function validateSingleSpecialtyPRWithTop15AndGetFirstError(input: PremiershipValidationInput, columnIndex: number, hair: 'LH' | 'SH'): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  const { columns, lhPremiersFinals, shPremiersFinals } = input;
  const column = columns[columnIndex];
  
  // Only validate for single specialty rings
  if (!column || column.specialty !== hair) {
    return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
  }
  
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);
  const sectionFinals = hair === 'LH' ? lhPremiersFinals : shPremiersFinals;
  const top15PRCats = getTop15PRCats(input, columnIndex);
  
  // Validate strict order for single specialty
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}_${i}`;
    const value = sectionFinals[key];
    
    if (value && (value ?? '').trim() !== '') {
      const trimmedValue = (value ?? '').trim();
      const prIndex = top15PRCats.indexOf(trimmedValue);
      
      if (prIndex === -1) {
        return {
          isValid: false,
          firstErrorPosition: i,
          errorMessage: `${trimmedValue} is not in the Top ${getBreakpointForRingType(input, column.specialty)} PR cats from Premiership Final.`
        };
      }
      
      if (prIndex !== i) {
        return {
          isValid: false,
          firstErrorPosition: i,
          errorMessage: `${trimmedValue} should be in position ${prIndex + 1} based on Premiership Final order, not position ${i + 1}.`
        };
      }
    }
  }
  
  return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
}