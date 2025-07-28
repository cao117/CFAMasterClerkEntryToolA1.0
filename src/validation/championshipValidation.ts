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
    lhNovs: number;
    shNovs: number;
  };
  voidedShowAwards?: { [key: string]: boolean };
  voidedChampionsFinals?: { [key: string]: boolean };
  voidedLHChampionsFinals?: { [key: string]: boolean };
  voidedSHChampionsFinals?: { [key: string]: boolean };
}

/**
 * Validates if a cat number is in the correct format (1-450, must be all digits, no letters or symbols)
 * Returns false if the value is not a valid integer string or out of range.
 */
export function validateCatNumber(value: string): boolean {
  if (!value || value.trim() === '') return true;
  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed)) return false; // Only allow digits
  const num = Number(trimmed);
  return num >= 1 && num <= 450;
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
  // VOID placements are always ignored for all validation and ordering (see KittenTab parity)
  for (let position = 0; position < 15; position++) {
    const key = `${columnIndex}-${position}`;
    const award = showAwards[key];
    if (
      award &&
      award.status === 'CH' &&
      award.catNumber &&
      award.catNumber.trim() !== '' &&
      !isVoidInput(award.catNumber)
    ) {
      chCats.push(award.catNumber.trim());
    }
  }
  return chCats;
}

/**
 * Validates Best AB CH finals against Top 15/10 Show Awards for the current column only.
 * Ensures that a cat is not awarded Best AB CH if it is a GC or NOV in the same column's Show Awards.
 * This check is column-specific and does not consider other columns' Show Awards.
 */
export function validateBestCHWithTop15AndGetFirstError(input: ChampionshipValidationInput, columnIndex: number): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  /**
   * VOID placements are always ignored for all validation and ordering (KittenTab parity).
   * This applies to all required lists, order checks, and error assignment.
   */
  const { columns, championsFinals, championshipTotal, showAwards } = input;
  const column = columns[columnIndex];
  if (!column || column.specialty !== 'Allbreed') {
    return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
  }
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  const numAwardRows = championshipTotal >= 85 ? 15 : 10;
  // Build list of all non-VOID placements in the championship final
  const championshipFinalCats: {catNumber: string, status: string}[] = [];
  for (let i = 0; i < numAwardRows; i++) {
    const award = showAwards[`${columnIndex}-${i}`];
    if (
      award &&
      award.catNumber &&
      award.catNumber.trim() !== '' &&
      !isVoidInput(award.catNumber)
    ) {
      championshipFinalCats.push({catNumber: award.catNumber.trim(), status: award.status});
    }
  }
  // Find CHs in championship final, skipping VOID
  const chInChampionshipFinal = championshipFinalCats.filter(c => c.status === 'CH').map(c => c.catNumber);
  // Build required Best AB CH list, skipping VOID
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
    // No CHs in championship final - Best AB CH can be filled with any CH cats entered in the show (not in the final), skipping VOID
    const allCHs = new Set<string>();
    for (let i = 0; i < numAwardRows; i++) {
      const key = `${columnIndex}-${i}`;
      const award = showAwards[key];
      if (
        award &&
        award.status === 'CH' &&
        award.catNumber &&
        award.catNumber.trim() !== '' &&
        !isVoidInput(award.catNumber)
      ) {
        allCHs.add(award.catNumber.trim());
      }
    }
    requiredBestCH = Array.from(allCHs).slice(0, numPositions);
  }
  // Validate Best AB CH, skipping VOID in all order/placement logic
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const finalsValue = championsFinals[key];
    // Only check order if the cell is filled (not empty/VOID), matching PremiershipTab logic
    if (!finalsValue || finalsValue.trim() === '' || isVoidInput(finalsValue)) {
        continue;
    }
    // Check if this cat is a GC or NOV in the current column's Show Awards only
    let isGC = false;
    let isNOV = false;
    for (let i = 0; i < numAwardRows; i++) {
      const key = `${columnIndex}-${i}`;
      const award = showAwards[key];
      if (
        award &&
        award.catNumber.trim() === finalsValue.trim() &&
        !isVoidInput(award.catNumber)
      ) {
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
    // If there are CHs in championship final, check order requirements, skipping VOID
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
  /**
   * VOID placements are always ignored for all validation and ordering (KittenTab parity).
   */
  const chCats = getTop15CHCats(input, columnIndex); // Now skips VOID
  const numPositions = input.championshipTotal >= 85 ? 5 : 3;
  const N = chCats.length;
  const seen = new Set<string>();
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = input.lhChampionsFinals[key];
    if (!value || value.trim() === '' || isVoidInput(value)) continue;
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
          errorMessage: `${value.trim()} is a ${championshipFinalAward.status} in Championship Final and cannot be used in CH finals.`
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
  /**
   * VOID placements are always ignored for all validation and ordering (KittenTab parity).
   */
  const chCats = getTop15CHCats(input, columnIndex); // Now skips VOID
  const numPositions = input.championshipTotal >= 85 ? 5 : 3;
  const N = chCats.length;
  const seen = new Set<string>();
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = input.shChampionsFinals[key];
    if (!value || value.trim() === '' || isVoidInput(value)) continue;
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
          errorMessage: `${value.trim()} is a ${showAward.status} in Show Awards and cannot be used in CH finals.`
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
    if (abValue && abValue.trim() !== '' && !isVoidInput(abValue)) {
      let foundInLH = false;
      let foundInSH = false;
      // Check if this cat appears in LH section
      for (let j = 0; j < numPositions; j++) {
        const lhValue = lhChampionsFinals[`${columnIndex}-${j}`];
        if (lhValue && lhValue.trim() === abValue.trim() && !isVoidInput(lhValue)) foundInLH = true;
      }
      // Check if this cat appears in SH section
      for (let j = 0; j < numPositions; j++) {
        const shValue = shChampionsFinals[`${columnIndex}-${j}`];
        if (shValue && shValue.trim() === abValue.trim() && !isVoidInput(shValue)) foundInSH = true;
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
 * Validates that the order of cats in Best LH CH or SH CH is a subsequence of AB CH order.
 * Only show an order error if the order is violated (not a subsequence).
 * Error is shown on the first cell where the order is violated.
 * FILLERS (cats not in AB CH) are allowed anywhere after the AB CH cats.
 * @param input ChampionshipValidationInput
 * @param columnIndex number
 * @param hair 'LH' | 'SH'
 * @returns { [position: number]: string } errors object
 */
function validateBestHairCHOrder(input: ChampionshipValidationInput, columnIndex: number, hair: 'LH' | 'SH') {
  const { championsFinals, lhChampionsFinals, shChampionsFinals, championshipTotal } = input;
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Get Best AB CH cats for this column
  const abCats: string[] = [];
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}-${i}`;
    const value = championsFinals[key];
    if (value && value.trim() !== '' && !isVoidInput(value)) {
      abCats.push(value.trim());
    }
  }
  
  // Get section values (LH or SH CH)
  const sectionFinals = hair === 'LH' ? lhChampionsFinals : shChampionsFinals;
  const hairCats: string[] = [];
  for (let i = 0; i < numPositions; i++) {
    const key = `${columnIndex}-${i}`;
    const value = sectionFinals[key];
    if (value && value.trim() !== '' && !isVoidInput(value)) {
      hairCats.push(value.trim());
    }
  }
  
  // Create a set of AB CH cats for quick lookup
  const abCatsSet = new Set(abCats);
  
  // Extract only the AB CH cats from the hair section (in order)
  const abCatsInHairSection: string[] = [];
  for (const cat of hairCats) {
    if (abCatsSet.has(cat)) {
      abCatsInHairSection.push(cat);
    }
  }
  
  // Validate that the AB CH cats in the hair section form a subsequence of the AB CH list
  let abIdx = 0;
  for (let i = 0; i < abCatsInHairSection.length; i++) {
    const currentCat = abCatsInHairSection[i];
    // PATCH: Always compare as trimmed strings
    while (abIdx < abCats.length && abCats[abIdx].trim() !== currentCat.trim()) {
      abIdx++;
    }
    // Debug log for comparison
    if (abIdx === abCats.length) {
      // Not found in the remaining AB CH cats: order violation
      // Find the position of this cat in the hair section to return the correct error position
      const errorPosition = hairCats.findIndex(hc => hc.trim() === currentCat.trim());
      return { [errorPosition]: `Order violation: ${currentCat.trim()} is out of order in ${hair} CH. Must preserve the order from Best AB CH (subsequence required).` };
    }
    abIdx++;
  }
  
  // Check that all fillers come after all AB CH cats
  let foundFirstFiller = false;
  for (let i = 0; i < hairCats.length; i++) {
    const cat = hairCats[i];
    if (abCatsSet.has(cat)) {
      if (foundFirstFiller) {
        // AB CH cat appears after a filler - this is an error
        return { [i]: `Order violation: ${cat.trim()} (AB CH) must be above all fillers in ${hair} CH.` };
      }
    } else {
      foundFirstFiller = true;
    }
  }
  
  return {};
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
  
  // --- Best AB CH: Validate each cell independently for status, sequential, order, and assignment reminder ---
  if (column.specialty === 'Allbreed') {
    // 1. Status errors per cell (GC/NOV/MISSING/INVALID) - HIGHEST PRIORITY after duplicates
    for (let i = 0; i < numPositions; i++) {
      const finalsKey = `champions-${columnIndex}-${i}`;
      const value = championsFinals[`${columnIndex}-${i}`];
      if (value && value.trim() !== '' && !isVoidInput(value)) {
        // Skip if duplicate error already set (duplicates handled elsewhere)
        if (errors[finalsKey]) continue;
        
        const status = getShowAwardStatus(value.trim());
        if (status === 'GC' || status === 'NOV') {
          errors[finalsKey] = `${value.trim()} is listed as a ${status} in Show Awards and cannot be awarded CH final.`;
          continue;
        } else if (status === 'MISSING') {
          errors[finalsKey] = `${value.trim()} in Show Awards is missing a status (GC/CH/NOV) and cannot be awarded CH final.`;
          continue;
        } else if (status === 'INVALID') {
          errors[finalsKey] = `${value.trim()} in Show Awards has an invalid status and cannot be awarded CH final.`;
          continue;
        }
      }
    }
    
    // 2. Sequential errors per cell (must come AFTER status errors)
    for (let i = 0; i < numPositions; i++) {
      const finalsKey = `champions-${columnIndex}-${i}`;
      const value = championsFinals[`${columnIndex}-${i}`];
      if (value && value.trim() !== '' && !isVoidInput(value)) {
        // Skip if higher-priority error already set
        if (errors[finalsKey]) continue;
        
        if (!validateSequentialEntry(input, 'champions', columnIndex, i, value)) {
          errors[finalsKey] = 'You must fill previous placements before entering this position.';
          continue; // Skip all other error checks for this cell
        }
      }
    }
    
    // 3. Order error: Must be X (Nth CH required by CFA rules)
    const bestCHResult = validateBestCHWithTop15AndGetFirstError(input, columnIndex);
    if (!bestCHResult.isValid && bestCHResult.firstErrorPosition !== -1) {
      const finalsKey = `champions-${columnIndex}-${bestCHResult.firstErrorPosition}`;
      if (!errors[finalsKey]) {
        errors[finalsKey] = bestCHResult.errorMessage;
      }
    }
    
    // 4. Assignment reminder for each cell (LOWEST PRIORITY - if no higher-precedence error in that cell)
    const lhshResult = validateLHSHWithBestCHAndGetFirstError(input, columnIndex);
    if (lhshResult.errorKeys && lhshResult.errorMessages) {
      lhshResult.errorKeys.forEach((errorKey, idx) => {
        // errorKey is already section-prefixed (e.g., 'champions-0-0')
        if (!errors[errorKey]) {
          errors[errorKey] = `[REMINDER] ${lhshResult.errorMessages ? lhshResult.errorMessages[idx] : 'LH/SH split reminder'}`;
        }
      });
    }
  }
  
  // Check LH CH for GC/NOV/MISSING/INVALID errors
  if (column.specialty === 'Allbreed' || column.specialty === 'Longhair') {
    for (let i = 0; i < numPositions; i++) {
      const finalsKey = `lhChampions-${columnIndex}-${i}`;
      const value = lhChampionsFinals[`${columnIndex}-${i}`];
      if (value && value.trim() !== '' && !isVoidInput(value)) {
        const status = getShowAwardStatus(value.trim());
        if (status === 'GC' || status === 'NOV') {
          errors[finalsKey] = `${value.trim()} is listed as a ${status} in Show Awards and cannot be awarded CH final.`;
        } else if (status === 'MISSING') {
          errors[finalsKey] = `${value.trim()} in Show Awards is missing a status (GC/CH/NOV) and cannot be awarded CH final.`;
        } else if (status === 'INVALID') {
          errors[finalsKey] = `${value.trim()} in Show Awards has an invalid status and cannot be awarded CH final.`;
        }
      }
    }
  }
  
  // Check SH CH for GC/NOV/MISSING/INVALID errors
  if (column.specialty === 'Allbreed' || column.specialty === 'Shorthair') {
    for (let i = 0; i < numPositions; i++) {
      const finalsKey = `shChampions-${columnIndex}-${i}`;
      const value = shChampionsFinals[`${columnIndex}-${i}`];
      if (value && value.trim() !== '' && !isVoidInput(value)) {
        const status = getShowAwardStatus(value.trim());
        if (status === 'GC' || status === 'NOV') {
          errors[finalsKey] = `${value.trim()} is listed as a ${status} in Show Awards and cannot be awarded CH final.`;
        } else if (status === 'MISSING') {
          errors[finalsKey] = `${value.trim()} in Show Awards is missing a status (GC/CH/NOV) and cannot be awarded CH final.`;
        } else if (status === 'INVALID') {
          errors[finalsKey] = `${value.trim()} in Show Awards has an invalid status and cannot be awarded CH final.`;
        }
      }
    }
  }
  
  // Validate Best LH CH with new logic (all errors)
  const bestLHErrors = validateBestHairCHWithFiller(input, columnIndex, 'LH');
  Object.entries(bestLHErrors).forEach(([pos, msg]) => {
    const finalsKey = `lhChampions-${columnIndex}-${pos}`;
    if (!errors[finalsKey]) {
      errors[finalsKey] = msg;
    }
  });
  
  // Validate Best SH CH with new logic (all errors)
  const bestSHErrors = validateBestHairCHWithFiller(input, columnIndex, 'SH');
  Object.entries(bestSHErrors).forEach(([pos, msg]) => {
    const finalsKey = `shChampions-${columnIndex}-${pos}`;
    if (!errors[finalsKey]) {
      errors[finalsKey] = msg;
    }
  });
  
  // Validate LH/SH CH order (new rule) - only if no higher precedence errors
  const lhOrderErrors = validateBestHairCHOrder(input, columnIndex, 'LH');
  Object.entries(lhOrderErrors).forEach(([pos, msg]) => {
    const finalsKey = `lhChampions-${columnIndex}-${pos}`;
    if (!errors[finalsKey]) {
      errors[finalsKey] = msg;
    }
  });
  const shOrderErrors = validateBestHairCHOrder(input, columnIndex, 'SH');
  Object.entries(shOrderErrors).forEach(([pos, msg]) => {
    const finalsKey = `shChampions-${columnIndex}-${pos}`;
    if (!errors[finalsKey]) {
      errors[finalsKey] = msg;
    }
  });
  
  // Single Specialty LH strict validation
  if (column.specialty === 'Longhair') {
    const lhResult = validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'LH');
    if (!lhResult.isValid) {
      const finalsKey = `lhChampions-${columnIndex}-${lhResult.firstErrorPosition}`;
      if (!errors[finalsKey]) {
        errors[finalsKey] = lhResult.errorMessage;
      }
      return errors;
    }
  }
  // Single Specialty SH strict validation
  if (column.specialty === 'Shorthair') {
    const shResult = validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'SH');
    if (!shResult.isValid) {
      const finalsKey = `shChampions-${columnIndex}-${shResult.firstErrorPosition}`;
      if (!errors[finalsKey]) {
        errors[finalsKey] = shResult.errorMessage;
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
  // If the new value is empty, no sequential entry error
  if (!newValue || newValue.trim() === '') {
    return true;
  }

  // Get the section data based on the section type
  let sectionData: Record<string, unknown>;
  switch (section) {
    case 'showAwards':
      sectionData = input.showAwards;
      break;
    case 'champions':
      sectionData = input.championsFinals;
      break;
    case 'lhChampions':
      sectionData = input.lhChampionsFinals;
      break;
    case 'shChampions':
      sectionData = input.shChampionsFinals;
      break;
    default:
      return true;
  }

  // Check if there are any empty positions before the current position
  for (let i = 0; i < position; i++) {
    const key = `${columnIndex}-${i}`;
    const value = sectionData[key];
    
    // For showAwards, check the catNumber field
    if (section === 'showAwards') {
      const cellData = value as CellData;
      if (!cellData || !cellData.catNumber || cellData.catNumber.trim() === '') {
        return false; // Sequential entry error
      }
    } else {
      // For finals sections, check the string value directly
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return false; // Sequential entry error
      }
    }
  }

  return true; // No sequential entry error
}

/**
 * Checks if a cat number input is VOID (case-insensitive)
 * @param {string} catNumber - The cat number to check
 * @returns {boolean} True if the input is VOID
 */
function isVoidInput(catNumber: string): boolean {
  return typeof catNumber === 'string' && catNumber.trim().toUpperCase() === 'VOID';
}

/**
 * Validates the Championship tab, skipping all validation for any cat number that is 'VOID' (case-insensitive).
 * This ensures that voided placements are always ignored for all checks, matching KittenTab behavior.
 * @param input ChampionshipValidationInput
 * @returns { [key: string]: string } errors object with section-prefixed keys
 */
export function validateChampionshipTab(input: ChampionshipValidationInput): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  // --- Top 10/15 (Show Awards) Section ---
  for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
    const numAwardRows = input.championshipTotal >= 85 ? 15 : 10;
    // Build a filtered list of non-VOID, non-empty placements for sequential and duplicate logic
    const placements: { pos: number, catNumber: string, status: string }[] = [];
    for (let pos = 0; pos < numAwardRows; pos++) {
      const key = `${colIdx}-${pos}`;
      const cell = input.showAwards[key];
      if (cell && cell.catNumber && cell.catNumber.trim() && !isVoidInput(cell.catNumber)) {
        placements.push({ pos, catNumber: cell.catNumber.trim(), status: cell.status });
      }
    }
    // Range validation (still applies to all non-empty, non-VOID cells)
    for (let pos = 0; pos < numAwardRows; pos++) {
      const key = `${colIdx}-${pos}`;
      const cell = input.showAwards[key];
      if (cell && cell.catNumber && cell.catNumber.trim() && !isVoidInput(cell.catNumber) && !validateCatNumber(cell.catNumber)) {
        errors[key] = 'Cat number must be between 1-450 or VOID.';
      }
    }
    // Duplicate detection: only non-VOID, non-empty cat numbers
    const catNumberToPositions: { [cat: string]: number[] } = {};
    placements.forEach(({ pos, catNumber }) => {
      if (!catNumberToPositions[catNumber]) catNumberToPositions[catNumber] = [];
      catNumberToPositions[catNumber].push(pos);
    });
    Object.entries(catNumberToPositions).forEach(([, positions]) => {
      if (positions.length > 1) {
        positions.forEach(pos => {
          const errorKey = `${colIdx}-${pos}`;
          if (errors[errorKey]) {
            errors[errorKey] = 'Cat number must be between 1-450 or VOID. Duplicate: This cat is already placed in another position.';
          } else {
            errors[errorKey] = 'Duplicate: This cat is already placed in another position.';
          }
        });
      }
    });
    // Sequential entry: treat VOID as non-existent (skip them)
    let firstEmpty = -1;
    for (let pos = 0; pos < numAwardRows; pos++) {
      const key = `${colIdx}-${pos}`;
      const cell = input.showAwards[key];
      // Only set sequential error if there is no range or duplicate error present (matches PremiershipTab)
      if (errors[key]) continue;
      if (!cell || isVoidInput(cell.catNumber)) continue; // VOID rows are skipped for sequential logic
      if (cell.catNumber === '' && firstEmpty === -1) {
        firstEmpty = pos;
      }
      if (cell.catNumber !== '' && firstEmpty !== -1 && pos > firstEmpty) {
        errors[key] = 'You must fill previous placements before entering this position.';
      }
    }
  }

  // --- Finals sections (Best AB CH, LH CH, SH CH) ---
  const finalsSections = [
    { key: 'championsFinals', prefix: 'champions' },
    { key: 'lhChampionsFinals', prefix: 'lhChampions' },
    { key: 'shChampionsFinals', prefix: 'shChampions' },
  ];

  for (const section of finalsSections) {
    for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
      const finals = (input as any)[section.key] as { [key: string]: string };
      const column = input.columns[colIdx];
      const numPositions = getFinalsPositionsForRingType(input, column.specialty);
      const catNumbers: { [pos: number]: string } = {};
      for (let pos = 0; pos < numPositions; pos++) {
        const dataKey = `${colIdx}-${pos}`;
        const value = finals ? finals[dataKey] : '';
        if (value && value.trim() && !isVoidInput(value)) catNumbers[pos] = value.trim();
      }
      // 1. Range error: assign first
      for (let pos = 0; pos < numPositions; pos++) {
        const errorKey = `${section.prefix}-${colIdx}-${pos}`;
        const value = finals ? finals[`${colIdx}-${pos}`] : '';
        if (value && value.trim() && !isVoidInput(value) && !validateCatNumber(value)) {
          errors[errorKey] = 'Cat number must be between 1-450 or VOID.';
        }
      }
      // 2. Duplicate error: merge with range if both
      const seen: { [cat: string]: number[] } = {};
      Object.entries(catNumbers).forEach(([pos, cat]) => {
        if (!seen[cat]) seen[cat] = [];
        seen[cat].push(Number(pos));
      });
      Object.entries(seen).forEach(([, positions]) => {
        if (positions.length > 1) {
          positions.forEach(pos => {
            const errorKey = `${section.prefix}-${colIdx}-${pos}`;
            if (errors[errorKey]) {
              errors[errorKey] = 'Cat number must be between 1-450 or VOID. Duplicate: This cat is already placed in another finals position.';
            } else {
              errors[errorKey] = 'Duplicate: This cat is already placed in another finals position.';
            }
          });
        }
      });
      // 2.5. Cross-section duplicate error: LH CH and SH CH cannot contain the same cat number
      if (section.prefix === 'lhChampions' || section.prefix === 'shChampions') {
        Object.entries(catNumbers).forEach(([pos, cat]) => {
          const errorKey = `${section.prefix}-${colIdx}-${pos}`;
          if (errors[errorKey]) return; // skip if range or duplicate error present
          const otherSection = section.prefix === 'lhChampions' ? 'shChampions' : 'lhChampions';
          const otherFinals = (input as any)[`${otherSection}Finals`] as { [key: string]: string };
          const otherNumPositions = getFinalsPositionsForRingType(input, column.specialty);
          for (let otherPos = 0; otherPos < otherNumPositions; otherPos++) {
            const otherKey = `${colIdx}-${otherPos}`;
            const otherValue = otherFinals ? otherFinals[otherKey] : '';
            if (otherValue && otherValue.trim() === cat && !isVoidInput(otherValue)) {
              errors[errorKey] = 'Duplicate: a cat cannot be both longhair and shorthair';
              break;
            }
          }
        });
      }
      // 3. Status error: only if no range, duplicate, or cross-section duplicate error
      Object.entries(catNumbers).forEach(([pos, cat]) => {
        const errorKey = `${section.prefix}-${colIdx}-${pos}`;
        if (errors[errorKey]) return; // skip if range, duplicate, or cross-section duplicate error present
        let status: string | undefined = undefined;
        for (let i = 0; i < 15; i++) {
          const showAward = input.showAwards[`${colIdx}-${i}`];
          if (showAward && showAward.catNumber && showAward.catNumber.trim() === cat && !isVoidInput(showAward.catNumber)) {
            status = showAward.status;
            break;
          }
        }
        if (status === 'GC' || status === 'NOV') {
          errors[errorKey] = `${cat} is listed as a ${status} in Show Awards and cannot be awarded CH final.`;
        }
      });
      // 4. Sequential error: only if no range, duplicate, or status error
      Object.entries(catNumbers).forEach(([pos, cat]) => {
        const errorKey = `${section.prefix}-${colIdx}-${pos}`;
        if (errors[errorKey]) return; // skip if range, duplicate, or status error present
        let sequentialError = false;
        for (let i = 0; i < Number(pos); i++) {
          const prevKey = `${colIdx}-${i}`;
          const prevValue = finals ? finals[prevKey] : '';
          if (!prevValue || prevValue.trim() === '') {
            sequentialError = true;
            break;
          }
        }
        if (sequentialError) {
          errors[errorKey] = 'You must fill previous placements before entering this position.';
          return;
      }
        // 5. Order error: only for Best AB CH, LH CH, SH CH, and only if no higher error
        if (!errors[errorKey]) {
        let orderError: string | undefined;
        if (section.prefix === 'champions') {
          const orderResult = validateBestCHWithTop15AndGetFirstError(input, colIdx);
          if (!orderResult.isValid && Number(pos) === orderResult.firstErrorPosition) {
            orderError = orderResult.errorMessage;
          }
        } else if (section.prefix === 'lhChampions' || section.prefix === 'shChampions') {
          const hair = section.prefix === 'lhChampions' ? 'LH' : 'SH';
          const orderErrors = validateBestHairCHOrder(input, colIdx, hair);
          orderError = orderErrors[Number(pos)];
        }
        if (orderError) {
          errors[errorKey] = orderError;
        }
      }
        // 6. Assignment reminder for Best AB CH (champions section)
        if (!errors[errorKey] && section.prefix === 'champions' && column.specialty === 'Allbreed') {
          let foundInLH = false, foundInSH = false;
          const lhFinals = input.lhChampionsFinals || {};
          const shFinals = input.shChampionsFinals || {};
          for (let j = 0; j < numPositions; j++) {
            if (lhFinals[`${colIdx}-${j}`] && lhFinals[`${colIdx}-${j}`].trim() === cat && !isVoidInput(lhFinals[`${colIdx}-${j}`])) {
              foundInLH = true;
              break;
            }
          }
          for (let j = 0; j < numPositions; j++) {
            if (shFinals[`${colIdx}-${j}`] && shFinals[`${colIdx}-${j}`].trim() === cat && !isVoidInput(shFinals[`${colIdx}-${j}`])) {
              foundInSH = true;
              break;
            }
          }
          if (!foundInLH && !foundInSH) {
            errors[errorKey] = `${cat} needs to be assigned to either LH or SH CH final.`;
          }
        }
      });
    }
  }

  // Assignment reminder for Best AB CH (champions section):
  for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
    const numPositions = getFinalsPositionsForRingType(input, input.columns[colIdx].specialty);
    for (let pos = 0; pos < numPositions; pos++) {
      const errorKey = `champions-${colIdx}-${pos}`;
      if (errors[errorKey]) continue;
      const cat = (input.championsFinals && input.championsFinals[`${colIdx}-${pos}`]) ? input.championsFinals[`${colIdx}-${pos}`].trim() : '';
      if (!cat || isVoidInput(cat)) continue;
      let foundInLH = false, foundInSH = false;
      const lhFinals = input.lhChampionsFinals || {};
      const shFinals = input.shChampionsFinals || {};
      for (let i = 0; i < numPositions; i++) {
        if (lhFinals[`${colIdx}-${i}`] && lhFinals[`${colIdx}-${i}`].trim() === cat && !isVoidInput(lhFinals[`${colIdx}-${i}`])) foundInLH = true;
        if (shFinals[`${colIdx}-${i}`] && shFinals[`${colIdx}-${i}`].trim() === cat && !isVoidInput(shFinals[`${colIdx}-${i}`])) foundInSH = true;
      }
      if (!foundInLH && !foundInSH) {
        errors[errorKey] = `${cat} needs to be assigned to either LH or SH CH final.`;
      }
    }
  }

  // Validate column relationships (including validateBestHairCHWithFiller logic)
  for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
    const columnErrors = validateColumnRelationships(input, colIdx);
    Object.entries(columnErrors).forEach(([errorKey, errorMessage]) => {
      if (!errors[errorKey]) {
        errors[errorKey] = errorMessage;
      }
    });
  }

  return errors;
}

/**
 * Returns the number of finals positions for a given ring type (AB/LH/SH) in Championship
 * @param input ChampionshipValidationInput
 * @param ringType string
 * @returns number of finals positions (5 or 3)
 */
export function getFinalsPositionsForRingType(input: ChampionshipValidationInput, ringType: string): number {
  let count = 0;
  switch (ringType) {
    case 'Allbreed':
      count = input.championshipCounts.lhGcs + input.championshipCounts.shGcs + input.championshipCounts.lhChs + input.championshipCounts.shChs + input.championshipCounts.lhNovs + input.championshipCounts.shNovs;
      break;
    case 'Longhair':
      count = input.championshipCounts.lhGcs + input.championshipCounts.lhChs + input.championshipCounts.lhNovs;
      break;
    case 'Shorthair':
      count = input.championshipCounts.shGcs + input.championshipCounts.shChs + input.championshipCounts.shNovs;
      break;
    default:
      count = input.championshipCounts.lhGcs + input.championshipCounts.shGcs + input.championshipCounts.lhChs + input.championshipCounts.shChs + input.championshipCounts.lhNovs + input.championshipCounts.shNovs;
      break;
  }
  return count >= 85 ? 5 : 3;
}

/**
 * Validates Best LH/SH CH sections, enforcing order, eligibility, and filler logic.
 * All AB CH cats assigned to the section must be at the top (in AB CH order), fillers can only appear after all AB CH cats.
 * The AB CH cats in LH/SH must form a subsequence of the AB CH list (order preserved, but not necessarily consecutive).
 * If any filler appears before an AB CH cat, show an order error on the first offending cell.
 * @param input ChampionshipValidationInput
 * @param columnIndex number
 * @param hair 'LH' | 'SH'
 * @returns { [key: string]: string } errors object with section-prefixed keys
 */
export function validateBestHairCHWithFiller(input: ChampionshipValidationInput, columnIndex: number, hair: 'LH' | 'SH'): { [key: string]: string } {
  const { championshipTotal } = input;
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  const sectionFinals = hair === 'LH' ? input.lhChampionsFinals : input.shChampionsFinals;
  const errors: { [key: string]: string } = {};
  const seen = new Set<string>();
  
  // Build set of AB CH cats for this section
  const abCHSet = new Set<string>([]);
  for (let i = 0; i < numPositions; i++) {
    const abCat = input.championsFinals[`${columnIndex}-${i}`];
    if (abCat && abCat.trim() && !isVoidInput(abCat)) abCHSet.add(abCat.trim());
  }
  
  // Get all cats in the hair section (in order)
  const hairCats: string[] = [];
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = sectionFinals[key];
    if (value && value.trim() !== '' && !isVoidInput(value)) {
      hairCats.push(value.trim());
    }
  }
  
  // Extract only the AB CH cats from the hair section (in order)
  const abCatsInHairSection: string[] = [];
  for (const cat of hairCats) {
    if (abCHSet.has(cat)) {
      abCatsInHairSection.push(cat);
    }
  }
  
  // Check for duplicates first
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = sectionFinals[key];
    if (!value || value.trim() === '' || isVoidInput(value)) continue;
    
    if (seen.has(value.trim())) {
      const errorKey = `${hair === 'LH' ? 'lhChampions' : 'shChampions'}-${columnIndex}-${position}`;
      errors[errorKey] = `${value.trim()} is a duplicate in ${hair} CH.`;
      continue;
    }
    seen.add(value.trim());
  }
  
  // Check that AB CH cats form a subsequence of the AB CH list
  const abCHList = Array.from(abCHSet);
  let abIdx = 0;
  for (let i = 0; i < abCatsInHairSection.length; i++) {
    const currentCat = abCatsInHairSection[i];
    while (abIdx < abCHList.length && abCHList[abIdx].trim() !== currentCat.trim()) {
      abIdx++;
    }
    if (abIdx === abCHList.length) {
      // Not found in the remaining AB CH cats: order violation
      // Find the position of this cat in the hair section to return the correct error position
      const errorPosition = hairCats.findIndex(hc => hc.trim() === currentCat.trim());
      const errorKey = `${hair === 'LH' ? 'lhChampions' : 'shChampions'}-${columnIndex}-${errorPosition}`;
      if (!errors[errorKey]) {
        errors[errorKey] = `Order violation: ${currentCat.trim()} is out of order in ${hair} CH. Must preserve the order from Best AB CH (subsequence required).`;
      }
      break;
    }
    abIdx++;
  }
  
  // Check that all fillers come after all AB CH cats
  let foundFirstFiller = false;
  for (let i = 0; i < hairCats.length; i++) {
    const cat = hairCats[i];
    if (abCHSet.has(cat)) {
      if (foundFirstFiller) {
        // AB CH cat appears after a filler - this is an error
        const errorKey = `${hair === 'LH' ? 'lhChampions' : 'shChampions'}-${columnIndex}-${i}`;
        if (!errors[errorKey]) {
          errors[errorKey] = `Order violation: ${cat.trim()} (AB CH) must be above all fillers in ${hair} CH.`;
        }
        break;
      }
    } else {
      foundFirstFiller = true;
    }
  }
  
  return errors;
}

/**
 * Validates strict order and eligibility for single specialty rings (LH or SH).
 * Returns { isValid, firstErrorPosition, errorMessage }.
 */
export function validateSingleSpecialtyCHWithTop15AndGetFirstError(input: ChampionshipValidationInput, columnIndex: number, hair: 'LH' | 'SH'): { isValid: boolean, firstErrorPosition: number, errorMessage: string } {
  const { championshipTotal } = input;
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  const sectionFinals = hair === 'LH' ? input.lhChampionsFinals : input.shChampionsFinals;
  const chCats = getTop15CHCats(input, columnIndex);
  const N = chCats.length;
  const seen = new Set<string>();
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = sectionFinals[key];
    if (!value || value.trim() === '' || isVoidInput(value)) continue;
    if (seen.has(value.trim())) {
      return { isValid: false, firstErrorPosition: position, errorMessage: `${value.trim()} is a duplicate in ${hair} CH.` };
    }
    seen.add(value.trim());
    if (position < N) {
      // Main positions: must match CH cats from championship final in order
      if (value !== chCats[position]) {
        return { isValid: false, firstErrorPosition: position, errorMessage: `Must be ${chCats[position]} (CH cat from championship final in order)` };
      }
    } else {
      // Filler positions: only check for not being a non-CH from Championship Final
      const championshipFinalAward = getShowAwardByCatNumber(input, columnIndex, value);
      if (championshipFinalAward && championshipFinalAward.status !== 'CH') {
        return { isValid: false, firstErrorPosition: position, errorMessage: `${value.trim()} is a ${championshipFinalAward.status} in Championship Final and cannot be used in CH finals.` };
      }
      // Do NOT check 'must match CH cats from championship final in order' for fillers
    }
  }
  return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
}