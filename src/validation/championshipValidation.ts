// Championship tab validation logic extracted for reuse

// Local type definitions (not exported from ChampionshipTab.tsx)
export interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

export interface CellData {
  catNumber: string;
  status: string;
  voided?: boolean;
}

export interface ChampionshipValidationInput {
  columns: { judge: Judge; specialty: string }[];
  showAwards: { [key: string]: CellData };
  championsFinals: { [key: string]: string };
  lhChampionsFinals: { [key: string]: string };
  shChampionsFinals: { [key: string]: string };
  championshipTotal: number;
  championshipCounts: {
    lhGcs: number;
    shGcs: number;
    lhChs: number;
    shChs: number;
  };
  voidedShowAwards?: { [key: string]: boolean };
  voidedChampionsFinals?: { [key: string]: boolean };
  voidedLHChampionsFinals?: { [key: string]: boolean };
  voidedSHChampionsFinals?: { [key: string]: boolean };
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
  input: ChampionshipValidationInput, 
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
    const key = `${columnIndex}-${position}`;
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
 * Checks for duplicate cat numbers within the champions finals section only
 */
export function checkDuplicateCatNumbersInChampionsFinals(
  input: ChampionshipValidationInput, 
  columnIndex: number, 
  newValue: string, 
  excludeKey?: string
): boolean {
  const { championsFinals, columns } = input;
  
  if (!newValue || newValue.trim() === '') {
    return false; // Empty values don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  
  // Collect all cat numbers from champions finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && championsFinals[key]) {
      const catNum = championsFinals[key].trim();
      if (catNum && catNum !== '') {
        valuesInSection.add(catNum);
      }
    }
  }
  
  return valuesInSection.has(trimmedValue);
}

/**
 * Checks for duplicate cat numbers within the longhair champions finals section only
 */
export function checkDuplicateCatNumbersInLHChampionsFinals(
  input: ChampionshipValidationInput, 
  columnIndex: number, 
  newValue: string, 
  excludeKey?: string
): boolean {
  const { lhChampionsFinals, columns } = input;
  
  if (!newValue || newValue.trim() === '') {
    return false; // Empty values don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  
  // Collect all cat numbers from longhair champions finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && lhChampionsFinals[key]) {
      const catNum = lhChampionsFinals[key].trim();
      if (catNum && catNum !== '') {
        valuesInSection.add(catNum);
      }
    }
  }
  
  return valuesInSection.has(trimmedValue);
}

/**
 * Checks for duplicate cat numbers within the shorthair champions finals section only
 */
export function checkDuplicateCatNumbersInSHChampionsFinals(
  input: ChampionshipValidationInput, 
  columnIndex: number, 
  newValue: string, 
  excludeKey?: string
): boolean {
  const { shChampionsFinals, columns } = input;
  
  if (!newValue || newValue.trim() === '') {
    return false; // Empty values don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  
  // Collect all cat numbers from shorthair champions finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && shChampionsFinals[key]) {
      const catNum = shChampionsFinals[key].trim();
      if (catNum && catNum !== '') {
        valuesInSection.add(catNum);
      }
    }
  }
  
  return valuesInSection.has(trimmedValue);
}

/**
 * Gets the top 15 CH cats from championship final for a column
 */
export function getTop15CHCats(input: ChampionshipValidationInput, columnIndex: number): string[] {
  const { showAwards } = input;
  const chCats: string[] = [];
  
  for (let position = 0; position < 15; position++) {
    const key = `${columnIndex}-${position}`;
    const award = showAwards[key];
    if (award && award.status === 'CH' && award.catNumber && award.catNumber.trim() !== '') {
      chCats.push(award.catNumber.trim());
    }
  }
  
  return chCats;
}

/**
 * Enhanced: Validates that Best CH finals match CH cats from championship final in order
 * For Allbreed rings: Best AB CH must contain CH cats from championship final in the same order
 * If there are no CHs in the championship final, Best AB CH can be filled with any CH cats entered in the show (not in the final)
 * Returns the first position with an error, or -1 if valid
 */
export function validateBestCHWithTop15AndGetFirstError(input: ChampionshipValidationInput, columnIndex: number): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  const { columns, championsFinals, championshipTotal, showAwards } = input;
  const column = columns[columnIndex];
  if (!column || column.specialty !== 'Allbreed') {
    return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
  }
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Collect championship final cats (in order) - this is the "top 10/15" section
  const numAwardRows = championshipTotal >= 85 ? 15 : 10;
  const championshipFinalCats: {catNumber: string, status: string}[] = [];
  for (let i = 0; i < numAwardRows; i++) {
    const award = showAwards[`${columnIndex}-${i}`];
    if (award && award.catNumber && award.catNumber.trim() !== '') {
      championshipFinalCats.push({catNumber: award.catNumber.trim(), status: award.status});
    }
  }
  // Find CHs in championship final
  const chInChampionshipFinal = championshipFinalCats.filter(c => c.status === 'CH').map(c => c.catNumber);

  // Build required Best AB CH list
  let requiredBestCH: string[] = [];
  if (chInChampionshipFinal.length > 0) {
    // If there are CHs in championship final, they must be at the top of Best AB CH in order
    requiredBestCH = [...chInChampionshipFinal];
    // Fill remaining positions with other CHs from championship final (if any more exist)
    for (const c of championshipFinalCats) {
      if (c.status === 'CH' && !requiredBestCH.includes(c.catNumber)) {
        requiredBestCH.push(c.catNumber);
        if (requiredBestCH.length === numPositions) break;
      }
    }
  } else {
    // No CHs in championship final - Best AB CH can be filled with any CH cats entered in the show (not in the final)
    // Collect all unique CH cat numbers from the current column's show awards only
    const allCHs = new Set<string>();
    for (let i = 0; i < numAwardRows; i++) {
      const key = `${columnIndex}-${i}`;
      const award = showAwards[key];
      if (award && award.status === 'CH' && award.catNumber && award.catNumber.trim() !== '') {
        allCHs.add(award.catNumber.trim());
      }
    }
    requiredBestCH = Array.from(allCHs).slice(0, numPositions);
  }

  // Validate Best AB CH
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const finalsValue = championsFinals[key];
    if (!finalsValue || finalsValue.trim() === '') {
      if (position < requiredBestCH.length) {
        return {
          isValid: false,
          firstErrorPosition: position,
          errorMessage: `Must be ${requiredBestCH[position]} (${position + 1}${getOrdinalSuffix(position + 1)} CH required by CFA rules)`
        };
      } else {
        // Filler position, allow blank
        continue;
      }
    }
    // Check if this cat is a CH in the eligible set
    let isGC = false;
    let isNOV = false;
    // Check all championship final entries for this cat
    for (const key in showAwards) {
      const award = showAwards[key];
      if (award && award.catNumber.trim() === finalsValue.trim()) {
        if (award.status === 'GC') isGC = true;
        if (award.status === 'NOV') isNOV = true;
        break;
      }
    }
    if (isGC || isNOV) {
      return {
        isValid: false,
        firstErrorPosition: position,
        errorMessage: `${finalsValue.trim()} is listed as a ${isGC ? 'GC' : 'NOV'} in Show Awards and cannot be awarded CH final.`
      };
    }
    // If there are CHs in championship final, check order requirements
    if (chInChampionshipFinal.length > 0 && position < requiredBestCH.length && finalsValue.trim() !== requiredBestCH[position]) {
      return {
        isValid: false,
        firstErrorPosition: position,
        errorMessage: `Must be ${requiredBestCH[position]} (${position + 1}${getOrdinalSuffix(position + 1)} CH required by CFA rules)`
      };
    }
    // If no CHs in championship final, do NOT require the cat to be found as CH in show awards; accept any cat unless it is explicitly GC or NOV
    // (No error for 'is not a CH entered in the show')
  }
  return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
}

/**
 * Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
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

// Keep the original function for backward compatibility
export function validateBestCHWithTop15(input: ChampionshipValidationInput, columnIndex: number): boolean {
  return validateBestCHWithTop15AndGetFirstError(input, columnIndex).isValid;
}

/**
 * Validates that Best LH CH finals contain only cats from Best CH (for Allbreed rings)
 * or from CH cats in championship final (for Longhair rings)
 * Returns the first position with an error, or -1 if valid
 */
export function validateBestLHCHWithTop15AndGetFirstError(input: ChampionshipValidationInput, columnIndex: number): { isValid: boolean, errorIndex: number, errorMessage: string } {
  const chCats = getTop15CHCats(input, columnIndex);
  const numPositions = input.championshipTotal >= 85 ? 5 : 3;
  const N = chCats.length;
  const seen = new Set<string>();
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = input.lhChampionsFinals[key];
    if (!value || value.trim() === '') continue;
    if (seen.has(value.trim())) {
      return { isValid: false, errorIndex: position, errorMessage: `${value.trim()} is a duplicate in LH CH.` };
    }
    seen.add(value.trim());
    if (position < N) {
      // Main positions: must match CH cats from championship final in order
      if (value !== chCats[position]) {
        return {
          isValid: false,
          errorIndex: position,
          errorMessage: `Must be ${chCats[position]} (CH cat from championship final in order)`
        };
      }
    } else {
      // Filler positions: only check for not being a non-CH from Championship Final
      const championshipFinalAward = getShowAwardByCatNumber(input, columnIndex, value);
      if (championshipFinalAward && championshipFinalAward.status !== 'CH') {
        return {
          isValid: false,
          errorIndex: position,
          errorMessage: `${value} is a ${championshipFinalAward.status} in Championship Final and cannot be used in CH finals.`
        };
      }
      // Do NOT check 'must match CH cats from championship final in order' for fillers
    }
  }
  return { isValid: true, errorIndex: -1, errorMessage: '' };
}

// Helper to get championship final award by cat number for a column
function getShowAwardByCatNumber(input: ChampionshipValidationInput, columnIndex: number, catNumber: string) {
  const numAwardRows = input.championshipTotal >= 85 ? 15 : 10;
  for (let i = 0; i < numAwardRows; i++) {
    const key = `${columnIndex}-${i}`;
    const award = input.showAwards[key];
    if (award && award.catNumber === catNumber) {
      return award;
    }
  }
  return null;
}

// Keep the original function for backward compatibility
export function validateBestLHCHWithTop15(input: ChampionshipValidationInput, columnIndex: number): boolean {
  return validateBestLHCHWithTop15AndGetFirstError(input, columnIndex).isValid;
}

/**
 * Validates that Best SH CH finals contain only cats from Best CH (for Allbreed rings)
 * or from CH cats in show awards (for Shorthair rings)
 * Returns the first position with an error, or -1 if valid
 */
export function validateBestSHCHWithTop15AndGetFirstError(input: ChampionshipValidationInput, columnIndex: number): { isValid: boolean, errorIndex: number, errorMessage: string } {
  const chCats = getTop15CHCats(input, columnIndex);
  const numPositions = input.championshipTotal >= 85 ? 5 : 3;
  const N = chCats.length;
  const seen = new Set<string>();
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = input.shChampionsFinals[key];
    if (!value || value.trim() === '') continue;
    if (seen.has(value.trim())) {
      return { isValid: false, errorIndex: position, errorMessage: `${value.trim()} is a duplicate in SH CH.` };
    }
    seen.add(value.trim());
    if (position < N) {
      // Main positions: must match CH cats from show awards in order
      if (value !== chCats[position]) {
        return {
          isValid: false,
          errorIndex: position,
          errorMessage: `Must be ${chCats[position]} (CH cat from show awards in order)`
        };
      }
    } else {
      // Filler positions: only check for not being a non-CH from Show Awards
      const showAward = getShowAwardByCatNumber(input, columnIndex, value);
      if (showAward && showAward.status !== 'CH') {
        return {
          isValid: false,
          errorIndex: position,
          errorMessage: `${value} is a ${showAward.status} in Show Awards and cannot be used in CH finals.`
        };
      }
      // Do NOT check 'must match CH cats from show awards in order' for fillers
    }
  }
  return { isValid: true, errorIndex: -1, errorMessage: '' };
}

// Keep the original function for backward compatibility
export function validateBestSHCHWithTop15(input: ChampionshipValidationInput, columnIndex: number): boolean {
  return validateBestSHCHWithTop15AndGetFirstError(input, columnIndex).isValid;
}

/**
 * PATCH: For each filled Best AB CH cell, if the cat is not assigned to either LH or SH CH final,
 * set the assignment reminder in that cell. This ensures reminders are shown for all unassigned cats,
 * matching Premiership logic. Previous logic could miss reminders for multiple unassigned cats.
 */
export function validateLHSHWithBestCHAndGetFirstError(input: ChampionshipValidationInput, columnIndex: number): { isValid: boolean, errorKeys?: string[], errorMessages?: string[], isReminder?: boolean } {
  const { columns, championsFinals, lhChampionsFinals, shChampionsFinals } = input;
  const column = columns[columnIndex];
  // Only validate for Allbreed rings
  if (!column || column.specialty !== 'Allbreed') {
    return { isValid: true };
  }
  const numPositions = getFinalsPositionsForRingType(input, column.specialty);
  const errorKeys: string[] = [];
  const errorMessages: string[] = [];
  // For each Best AB CH cat, check if assigned to LH or SH
  for (let i = 0; i < numPositions; i++) {
    const abValue = championsFinals[`${columnIndex}-${i}`];
    if (abValue && abValue.trim() !== '') {
      let foundInLH = false;
      let foundInSH = false;
      // Check if this cat appears in LH section
      for (let j = 0; j < numPositions; j++) {
        const lhValue = lhChampionsFinals[`${columnIndex}-${j}`];
        if (lhValue && lhValue.trim() === abValue.trim()) {
          foundInLH = true;
          break;
        }
      }
      // Check if this cat appears in SH section
      for (let j = 0; j < numPositions; j++) {
        const shValue = shChampionsFinals[`${columnIndex}-${j}`];
        if (shValue && shValue.trim() === abValue.trim()) {
          foundInSH = true;
          break;
        }
      }
      // If cat is not assigned to either LH or SH, set reminder in this cell
      if (!foundInLH && !foundInSH) {
        /**
         * IMPORTANT: Error key must match 'champions-${columnIndex}-${i}' for UI to display the reminder in the correct cell.
         * If the key does not match, the reminder will not appear in the UI.
         */
        errorKeys.push(`champions-${columnIndex}-${i}`);
        errorMessages.push(`${abValue.trim()} needs to be assigned to either LH or SH CH final.`);
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
 * Validates that all Best AB CH cats present in LH/SH CH are at the top, in the same order as in Best AB CH (subsequence rule).
 * Not all Best AB CH cats are required to appear in LH/SH CH; only those that do must preserve the order.
 * No filler may appear before any present Best AB CH cat.
 * After all present Best AB CH cats, fillers may appear.
 * Returns errors for out-of-order Best AB CH cats or misplaced fillers.
 */
function validateBestHairCHOrder(input: ChampionshipValidationInput, columnIndex: number, hair: 'LH' | 'SH') {
  const { championsFinals, lhChampionsFinals, shChampionsFinals, championshipTotal } = input;
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  // Get Best AB CH cats for this column
  const bestCHCats: string[] = [];
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}-${i}`;
    const value = championsFinals[key];
    if (value && value.trim() !== '') {
      bestCHCats.push(value.trim());
    }
  }
  // Get section values
  const sectionFinals = hair === 'LH' ? lhChampionsFinals : shChampionsFinals;
  const sectionValues: string[] = [];
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}-${i}`;
    const value = sectionFinals[key];
    if (value && value.trim() !== '') {
      sectionValues.push(value.trim());
    } else {
      sectionValues.push('');
    }
  }
  const errors: { [position: number]: string } = {};
  // Find all present Best AB CH cats in section, in their current order and positions
  const presentBestCH: {cat: string, pos: number, abIdx: number}[] = [];
  for (let i = 0; i < sectionValues.length; i++) {
    const val = sectionValues[i];
    const abIdx = bestCHCats.indexOf(val);
    if (abIdx !== -1) {
      presentBestCH.push({cat: val, pos: i, abIdx});
    }
  }
  // Check for out-of-order Best AB CH cats (not a subsequence)
  for (let i = 1; i < presentBestCH.length; i++) {
    if (presentBestCH[i].abIdx < presentBestCH[i-1].abIdx) {
      // Use explicit, detailed error messages
      const ordinal = (n: number) => ['Best', '2nd Best', '3rd Best', '4th Best', '5th Best'][n] || `${n+1}th Best`;
      const prevLabel = ordinal(presentBestCH[i-1].abIdx) + ' AB CH';
      const currLabel = ordinal(presentBestCH[i].abIdx) + ' AB CH';
      errors[presentBestCH[i-1].pos] = `${presentBestCH[i-1].cat} must be above ${presentBestCH[i].cat} in this section because ${presentBestCH[i-1].cat} is ${prevLabel} and ${presentBestCH[i].cat} is ${currLabel}.`;
      errors[presentBestCH[i].pos] = `${presentBestCH[i].cat} must be below ${presentBestCH[i-1].cat} in this section because ${presentBestCH[i].cat} is ${currLabel} and ${presentBestCH[i-1].cat} is ${prevLabel}.`;
      // Only flag the first such pair for clarity
      return errors;
    }
  }
  // Find the first non-Best AB CH cat before any present Best AB CH cat
  let firstNonBestIdx = -1;
  for (let i = 0; i < sectionValues.length; i++) {
    if (!bestCHCats.includes(sectionValues[i]) && sectionValues[i]) {
      firstNonBestIdx = i;
      break;
    }
  }
  if (firstNonBestIdx !== -1) {
    // After first non-Best AB CH cat, there should be no Best AB CH cats
    for (let i = firstNonBestIdx + 1; i < sectionValues.length; i++) {
      if (bestCHCats.includes(sectionValues[i])) {
        errors[firstNonBestIdx] = 'This cat must be below all Best AB CH cats present in this section.';
        errors[i] = `${sectionValues[i]} is a Best AB CH cat and must be above all other cats in this section.`;
        break;
      }
    }
  }
  return errors;
}

/**
 * Validates relationships within a column
 */
export function validateColumnRelationships(input: ChampionshipValidationInput, columnIndex: number): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  const { columns, championshipTotal, showAwards, championsFinals, lhChampionsFinals, shChampionsFinals } = input;
  const column = columns[columnIndex];
  if (!column) return errors;
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Helper to check Show Awards status
  function getShowAwardStatus(catNum: string): string | null {
    const numAwardRows = championshipTotal >= 85 ? 15 : 10;
    for (let j = 0; j < numAwardRows; j++) {
      const award = showAwards[`${columnIndex}-${j}`];
      if (
        award &&
        typeof award.catNumber === 'string' &&
        award.catNumber.trim().toUpperCase() === catNum.trim().toUpperCase()
      ) {
        if (!award.status || typeof award.status !== 'string' || award.status.trim() === '') {
          return 'MISSING';
        }
        const status = award.status.trim().toUpperCase();
        if (status === 'GC' || status === 'CH' || status === 'NOV') {
          return status;
        } else {
          return 'INVALID';
        }
      }
    }
    return null;
  }
  
  // --- Best AB CH: Validate each cell independently for GC/NOV, order, and assignment reminder ---
  if (column.specialty === 'Allbreed') {
    // 1. GC/NOV/MISSING/INVALID errors per cell
    for (let i = 0; i < numPositions; i++) {
      const key = `champions-${columnIndex}-${i}`;
      const value = championsFinals[`${columnIndex}-${i}`];
      if (value && value.trim() !== '') {
        const status = getShowAwardStatus(value.trim());
        if (status === 'GC' || status === 'NOV') {
          errors[key] = `${value.trim()} is listed as a ${status} in Show Awards and cannot be awarded CH final.`;
          continue;
        } else if (status === 'MISSING') {
          errors[key] = `${value.trim()} in Show Awards is missing a status (GC/CH/NOV) and cannot be awarded CH final.`;
          continue;
        } else if (status === 'INVALID') {
          errors[key] = `${value.trim()} in Show Awards has an invalid status and cannot be awarded CH final.`;
          continue;
        }
      }
    }
    // 2. Order error: Must be X (Nth CH required by CFA rules)
    const bestCHResult = validateBestCHWithTop15AndGetFirstError(input, columnIndex);
    if (!bestCHResult.isValid && bestCHResult.firstErrorPosition !== -1) {
      const key = `champions-${columnIndex}-${bestCHResult.firstErrorPosition}`;
      // Only set if no duplicate or GC/NOV error already present
      if (!errors[key]) {
        errors[key] = bestCHResult.errorMessage;
      }
    }
    // 3. Assignment reminder for each cell (if no higher-precedence error in that cell)
    const lhshResult = validateLHSHWithBestCHAndGetFirstError(input, columnIndex);
    if (lhshResult.errorKeys && lhshResult.errorMessages) {
      lhshResult.errorKeys.forEach((key, idx) => {
        if (!errors[key]) {
          errors[key] = `[REMINDER] ${lhshResult.errorMessages ? lhshResult.errorMessages[idx] : 'LH/SH split reminder'}`;
        }
      });
    }
  }
  
  // Check LH CH for GC/NOV/MISSING/INVALID errors
  if (column.specialty === 'Allbreed' || column.specialty === 'Longhair') {
    for (let i = 0; i < numPositions; i++) {
      const key = `lhChampions-${columnIndex}-${i}`;
      const value = lhChampionsFinals[`${columnIndex}-${i}`];
      if (value && value.trim() !== '') {
        const status = getShowAwardStatus(value.trim());
        if (status === 'GC' || status === 'NOV') {
          errors[key] = `${value.trim()} is listed as a ${status} in Show Awards and cannot be awarded CH final.`;
        } else if (status === 'MISSING') {
          errors[key] = `${value.trim()} in Show Awards is missing a status (GC/CH/NOV) and cannot be awarded CH final.`;
        } else if (status === 'INVALID') {
          errors[key] = `${value.trim()} in Show Awards has an invalid status and cannot be awarded CH final.`;
        }
      }
    }
  }
  
  // Check SH CH for GC/NOV/MISSING/INVALID errors
  if (column.specialty === 'Allbreed' || column.specialty === 'Shorthair') {
    for (let i = 0; i < numPositions; i++) {
      const key = `shChampions-${columnIndex}-${i}`;
      const value = shChampionsFinals[`${columnIndex}-${i}`];
      if (value && value.trim() !== '') {
        const status = getShowAwardStatus(value.trim());
        if (status === 'GC' || status === 'NOV') {
          errors[key] = `${value.trim()} is listed as a ${status} in Show Awards and cannot be awarded CH final.`;
        } else if (status === 'MISSING') {
          errors[key] = `${value.trim()} in Show Awards is missing a status (GC/CH/NOV) and cannot be awarded CH final.`;
        } else if (status === 'INVALID') {
          errors[key] = `${value.trim()} in Show Awards has an invalid status and cannot be awarded CH final.`;
        }
      }
    }
  }
  
  // Validate Best LH CH with new logic (all errors)
  const bestLHErrors = validateBestHairCHWithFiller(input, columnIndex, 'LH');
  Object.entries(bestLHErrors).forEach(([pos, msg]) => {
    const key = `lhChampions-${columnIndex}-${pos}`;
    // Only set error if not already set (sequential errors take precedence)
    if (!errors[key]) {
      errors[key] = msg;
    }
  });
  
  // Validate Best SH CH with new logic (all errors)
  const bestSHErrors = validateBestHairCHWithFiller(input, columnIndex, 'SH');
  Object.entries(bestSHErrors).forEach(([pos, msg]) => {
    const key = `shChampions-${columnIndex}-${pos}`;
    // Only set error if not already set (sequential errors take precedence)
    if (!errors[key]) {
      errors[key] = msg;
    }
  });
  
  // Validate LH/SH CH order (new rule)
  const lhOrderErrors = validateBestHairCHOrder(input, columnIndex, 'LH');
  Object.entries(lhOrderErrors).forEach(([pos, msg]) => {
    const key = `lhChampions-${columnIndex}-${pos}`;
    // Only set error if not already set (sequential errors take precedence)
    if (!errors[key]) {
      errors[key] = msg;
    }
  });
  const shOrderErrors = validateBestHairCHOrder(input, columnIndex, 'SH');
  Object.entries(shOrderErrors).forEach(([pos, msg]) => {
    const key = `shChampions-${columnIndex}-${pos}`;
    // Only set error if not already set (sequential errors take precedence)
    if (!errors[key]) {
      errors[key] = msg;
    }
  });
  
  // Single Specialty LH strict validation
  if (column.specialty === 'Longhair') {
    const lhResult = validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'LH');
    if (!lhResult.isValid) {
      const key = `lhChampions-${columnIndex}-${lhResult.firstErrorPosition}`;
      // Only set error if not already set (sequential errors take precedence)
      if (!errors[key]) {
        errors[key] = lhResult.errorMessage;
      }
      return errors;
    }
  }
  // Single Specialty SH strict validation
  if (column.specialty === 'Shorthair') {
    const shResult = validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'SH');
    if (!shResult.isValid) {
      const key = `shChampions-${columnIndex}-${shResult.firstErrorPosition}`;
      // Only set error if not already set (sequential errors take precedence)
      if (!errors[key]) {
        errors[key] = shResult.errorMessage;
      }
      return errors;
    }
  }
  
  // No longer recursively validate all columns (removes infinite recursion bug)
  // The function should only validate the current column, not all columns recursively.
  // No suppression of reminders for earlier positions; only set reminders in empty cells if all previous are filled and no sequential error for later cells.
  return errors;
}

/**
 * Validates that positions are filled sequentially (no skipping)
 */
export function validateSequentialEntry(
  input: ChampionshipValidationInput,
  section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', 
  columnIndex: number, 
  position: number, 
  newValue: string
): boolean {
  const { showAwards, championsFinals, lhChampionsFinals, shChampionsFinals } = input;
  
  if (!newValue || newValue.trim() === '') return true; // Empty values are okay
  
  // Get the appropriate data source
  let dataSource: { [key: string]: any };
  switch (section) {
    case 'showAwards':
      dataSource = showAwards;
      break;
    case 'champions':
      dataSource = championsFinals;
      break;
    case 'lhChampions':
      dataSource = lhChampionsFinals;
      break;
    case 'shChampions':
      dataSource = shChampionsFinals;
      break;
  }
  
  // Check if all previous positions are filled
  for (let i = 0; i < position; i++) {
    const key = `${columnIndex}-${i}`;
    let value: string;
    
    if (section === 'showAwards') {
      value = dataSource[key]?.catNumber || '';
    } else {
      value = dataSource[key] || '';
    }
    
    if (!value || value.trim() === '') {
      return false; // Found an empty position before this one
    }
  }
  
  return true;
}

/**
 * Main validation function for the Championship tab
 */
export function validateChampionshipTab(input: ChampionshipValidationInput): { [key: string]: string } {
  const { columns, showAwards, championsFinals, lhChampionsFinals, shChampionsFinals, championshipTotal } = input;
  const errors: { [key: string]: string } = {};
  
  // Validate show awards
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    for (let position = 0; position < 15; position++) {
      const key = `${columnIndex}-${position}`;
      const award = showAwards[key];
      
      if (award && award.catNumber && award.catNumber.trim() !== '') {
        // Validate cat number format
        if (!validateCatNumber(award.catNumber)) {
          errors[key] = 'Cat number must be between 1-450';
          continue;
        }
        // Section-specific sequential entry error for Championship Final
        if (!validateSequentialEntry(input, 'showAwards', columnIndex, position, award.catNumber)) {
          errors[key] = 'You must fill in previous empty award placements in Championship Final before entering this position.';
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
    { name: 'champions', data: championsFinals, prefix: 'champions' },
    { name: 'lhChampions', data: lhChampionsFinals, prefix: 'lhChampions' },
    { name: 'shChampions', data: shChampionsFinals, prefix: 'shChampions' }
  ] as const;
  
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  for (const section of sections) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      for (let position = 0; position < numPositions; position++) {
        const key = `${columnIndex}-${position}`;
        const errorKey = `${section.prefix}-${columnIndex}-${position}`;
        const value = section.data[key];
        
        if (value && value.trim() !== '') {
          // Validate cat number format
          if (!validateCatNumber(value)) {
            errors[errorKey] = 'Cat number must be between 1-450';
            continue;
          }
          // Enhanced sequential entry error message
          if (!validateSequentialEntry(input, section.name, columnIndex, position, value)) {
            let sectionLabel = '';
            switch (section.name) {
              case 'champions':
                sectionLabel = 'Best AB CH Final';
                break;
              case 'lhChampions':
                sectionLabel = 'Best LH CH Final';
                break;
              case 'shChampions':
                sectionLabel = 'Best SH CH Final';
                break;
              default:
                sectionLabel = 'Championship Final';
            }
            errors[errorKey] = `You must fill in previous empty award placements in ${sectionLabel} before entering this position.`;
            continue;
          }
          // Validate no duplicates within own section only
          let hasDuplicate = false;
          switch (section.name) {
            case 'champions':
              hasDuplicate = checkDuplicateCatNumbersInChampionsFinals(input, columnIndex, value, key);
              break;
            case 'lhChampions':
              hasDuplicate = checkDuplicateCatNumbersInLHChampionsFinals(input, columnIndex, value, key);
              break;
            case 'shChampions':
              hasDuplicate = checkDuplicateCatNumbersInSHChampionsFinals(input, columnIndex, value, key);
              break;
          }
          if (hasDuplicate) {
            let sectionName = '';
            switch (section.name) {
              case 'champions':
                sectionName = 'Best AB CH Final';
                break;
              case 'lhChampions':
                sectionName = 'Best LH CH Final';
                break;
              case 'shChampions':
                sectionName = 'Best SH CH Final';
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
    // --- Custom precedence for Best AB CH: duplicate > status > sequential > order > assignment reminder ---
    const columnErrors = validateColumnRelationships(input, columnIndex);
    Object.entries(columnErrors).forEach(([key, msg]) => {
      /**
       * Strict error precedence enforcement:
       * 1. If a duplicate error exists for a cell, it takes absolute precedence (suppress all others).
       * 2. If no duplicate, but a status error exists, it takes precedence (suppress sequential/order/reminder).
       * 3. If no duplicate or status, but a sequential entry error exists, it takes precedence (suppress order/reminder).
       * 4. If no duplicate, status, or sequential, but an order error exists, it takes precedence (suppress reminder).
       * 5. Only if none of the above, show assignment reminder.
       */
      const isDuplicate = msg.toLowerCase().includes('duplicate');
      const isStatus = /is listed as a (gc|nov)/i.test(msg) || /missing a status/i.test(msg) || /invalid status/i.test(msg);
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
        if (!errors[key] || (!errors[key].toLowerCase().includes('duplicate') && !/is listed as a (gc|nov)/i.test(errors[key]) && !/missing a status/i.test(errors[key]) && !/invalid status/i.test(errors[key]))) {
          errors[key] = msg;
        }
      } else if (isOrder) {
        if (!errors[key] || (!errors[key].toLowerCase().includes('duplicate') && !/is listed as a (gc|nov)/i.test(errors[key]) && !/missing a status/i.test(errors[key]) && !/invalid status/i.test(errors[key]) && !errors[key].startsWith('You must fill in previous empty award placements'))) {
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

// Update validateBestHairCHWithFiller to remove 'is not in Best CH' logic
function validateBestHairCHWithFiller(input: ChampionshipValidationInput, columnIndex: number, hair: 'LH' | 'SH') {
  const { columns, lhChampionsFinals, shChampionsFinals, showAwards, championshipTotal } = input;
  const column = columns[columnIndex];
  if (!column || column.specialty !== 'Allbreed') return {};
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Helper to check Show Awards status (same as in validateColumnRelationships)
  function getShowAwardStatus(catNum: string): string | null {
    const numAwardRows = championshipTotal >= 85 ? 15 : 10;
    for (let j = 0; j < numAwardRows; j++) {
      const award = showAwards[`${columnIndex}-${j}`];
      if (
        award &&
        typeof award.catNumber === 'string' &&
        award.catNumber.trim().toUpperCase() === catNum.trim().toUpperCase()
      ) {
        // Check if status is missing or invalid
        if (!award.status || typeof award.status !== 'string' || award.status.trim() === '') {
          return 'MISSING';
        }
        
        const status = award.status.trim().toUpperCase();
        // Only accept valid statuses
        if (status === 'GC' || status === 'CH' || status === 'NOV') {
          return status;
        } else {
          return 'INVALID';
        }
      }
    }
    return null;
  }
  
  // No longer enforce 'is not in Best CH' for any position
  const sectionFinals = hair === 'LH' ? lhChampionsFinals : shChampionsFinals;
  const errors: { [position: number]: string } = {};
  
  // Only check for non-CH in fillers, duplicates, and cross-section conflicts
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}-${i}`;
    const value = sectionFinals[key];
    if (!value || value.trim() === '') continue;
    
    // Check Show Awards status for this cat number
    const status = getShowAwardStatus(value.trim());
    if (status === 'GC' || status === 'NOV') {
      errors[i] = `${value.trim()} is listed as a ${status} in Show Awards and cannot be awarded CH final.`;
      continue;
    } else if (status === 'MISSING') {
      errors[i] = `${value.trim()} in Show Awards is missing a status (GC/CH/NOV) and cannot be awarded CH final.`;
      continue;
    } else if (status === 'INVALID') {
      errors[i] = `${value.trim()} in Show Awards has an invalid status and cannot be awarded CH final.`;
      continue;
    }
    // If not found in Show Awards or status is CH, do nothing for this check
  }
  
  // Check for duplicates within the section
  const seen = new Set<string>();
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}-${i}`;
    const value = sectionFinals[key];
    if (!value || value.trim() === '') continue;
    if (seen.has(value.trim())) {
      errors[i] = `${value.trim()} is a duplicate in this section`;
    }
    seen.add(value.trim());
  }
  
  // Cross-section conflict detection (as before)
  const otherSection = hair === 'LH' ? shChampionsFinals : lhChampionsFinals;
  const otherSet = new Set<string>();
  for (let i = 0; i < numPositions; i++) {
    const otherVal = otherSection[`${columnIndex}-${i}`];
    if (otherVal && otherVal.trim() !== '') {
      otherSet.add(otherVal.trim());
    }
  }
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}-${i}`;
    const value = sectionFinals[key];
    if (!value || value.trim() === '') continue;
    if (otherSet.has(value.trim())) {
      errors[i] = `${value.trim()} cannot be both LH and SH CH.`;
    }
  }
  return errors;
}

/**
 * Validates that Best LH/SH CH finals in single specialty rings match CH cats from championship final in order.
 * For LH/SH rings: Best LH/SH CH must contain CH cats from championship final in the same order (if any), else any CH from Show Awards.
 * No GC or NOV allowed. Duplicates and order checked. Returns first error position or -1 if valid.
 * @param input ChampionshipValidationInput
 * @param columnIndex number
 * @param hair 'LH' | 'SH'
 */
function validateSingleSpecialtyCHWithTop15AndGetFirstError(input: ChampionshipValidationInput, columnIndex: number, hair: 'LH' | 'SH'): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  const { columns, showAwards, lhChampionsFinals, shChampionsFinals, championshipTotal } = input;
  const column = columns[columnIndex];
  if (!column || (hair === 'LH' && column.specialty !== 'Longhair') || (hair === 'SH' && column.specialty !== 'Shorthair')) {
    return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
  }
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  const numAwardRows = championshipTotal >= 85 ? 15 : 10;
  // Collect championship final cats (in order)
  const championshipFinalCats: {catNumber: string, status: string}[] = [];
  for (let i = 0; i < numAwardRows; i++) {
    const award = showAwards[`${columnIndex}-${i}`];
    if (award && award.catNumber && award.catNumber.trim() !== '') {
      championshipFinalCats.push({catNumber: award.catNumber.trim(), status: award.status});
    }
  }
  // Find CHs in championship final
  const chInChampionshipFinal = championshipFinalCats.filter(c => c.status === 'CH').map(c => c.catNumber);
  // Build required Best CH list
  let requiredBestCH: string[] = [];
  if (chInChampionshipFinal.length > 0) {
    requiredBestCH = [...chInChampionshipFinal];
    for (const c of championshipFinalCats) {
      if (c.status === 'CH' && !requiredBestCH.includes(c.catNumber)) {
        requiredBestCH.push(c.catNumber);
        if (requiredBestCH.length === numPositions) break;
      }
    }
  } else {
    // No CHs in championship final - can use any CH from Show Awards
    const allCHs = new Set<string>();
    for (let i = 0; i < numAwardRows; i++) {
      const key = `${columnIndex}-${i}`;
      const award = showAwards[key];
      if (award && award.status === 'CH' && award.catNumber && award.catNumber.trim() !== '') {
        allCHs.add(award.catNumber.trim());
      }
    }
    requiredBestCH = Array.from(allCHs).slice(0, numPositions);
  }
  // Get section finals
  const sectionFinals = hair === 'LH' ? lhChampionsFinals : shChampionsFinals;
  // Validate
  const seen = new Set<string>();
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const finalsValue = sectionFinals[key];
    if (!finalsValue || finalsValue.trim() === '') {
      if (position < requiredBestCH.length) {
        return {
          isValid: false,
          firstErrorPosition: position,
          errorMessage: `Must be ${requiredBestCH[position]} (${position + 1}${getOrdinalSuffix(position + 1)} CH required by CFA rules)`
        };
      } else {
        continue;
      }
    }
    // Check for duplicates
    if (seen.has(finalsValue.trim())) {
      return {
        isValid: false,
        firstErrorPosition: position,
        errorMessage: `${finalsValue.trim()} is a duplicate in this section`
      };
    }
    seen.add(finalsValue.trim());
    // Check if this cat is a CH in the eligible set
    let isGC = false;
    let isNOV = false;
    // Check all championship final entries for this cat
    for (const key in showAwards) {
      const award = showAwards[key];
      if (award && award.catNumber.trim() === finalsValue.trim()) {
        if (award.status === 'GC') isGC = true;
        if (award.status === 'NOV') isNOV = true;
        break;
      }
    }
    if (isGC || isNOV) {
      return {
        isValid: false,
        firstErrorPosition: position,
        errorMessage: `${finalsValue.trim()} is listed as a ${isGC ? 'GC' : 'NOV'} in Show Awards and cannot be awarded CH final.`
      };
    }
    // If there are CHs in championship final, check order requirements
    if (chInChampionshipFinal.length > 0 && position < requiredBestCH.length && finalsValue.trim() !== requiredBestCH[position]) {
      return {
        isValid: false,
        firstErrorPosition: position,
        errorMessage: `Must be ${requiredBestCH[position]} (${position + 1}${getOrdinalSuffix(position + 1)} CH required by CFA rules)`
      };
    }
    // If no CHs in championship final, do NOT require the cat to be found as CH in show awards; accept any cat unless it is explicitly GC or NOV
  }
  return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
}

/**
 * Helper functions to calculate breakpoints based on ring type
 */
export function getChampionshipCountForRingType(input: ChampionshipValidationInput, ringType: string): number {
  const { championshipTotal, championshipCounts } = input;
  switch (ringType) {
    case 'Allbreed':
      return championshipTotal;
    case 'Longhair':
      return championshipCounts.lhGcs + championshipCounts.lhChs;
    case 'Shorthair':
      return championshipCounts.shGcs + championshipCounts.shChs;
    default:
      return championshipTotal;
  }
}

export function getBreakpointForRingType(input: ChampionshipValidationInput, ringType: string): number {
  const count = getChampionshipCountForRingType(input, ringType);
  return count >= 85 ? 15 : 10;
}

export function getFinalsPositionsForRingType(input: ChampionshipValidationInput, ringType: string): number {
  const count = getChampionshipCountForRingType(input, ringType);
  return count >= 85 ? 5 : 3;
} 