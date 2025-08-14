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

import { validateCatNumber as validateCatNumberHelper, getCatNumberValidationMessage } from '../utils/validationHelpers';

/**
 * Validates if a cat number is in the correct format (1-maxCats, must be all digits, no letters or symbols)
 * Returns false if the value is not a valid integer string or out of range.
 * @param value - The cat number string to validate
 * @param maxCats - The maximum number of cats allowed (from globalSettings.max_cats)
 * @returns True if valid
 */
export function validateCatNumber(value: string, maxCats: number): boolean {
  return validateCatNumberHelper(value, maxCats);
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
 * Gets the count for a specific ring type based on championship counts
 * Mirrors getPremiershipCountForRingType logic from premiershipValidation.ts
 * @param input ChampionshipValidationInput
 * @param ringType string
 * @returns number
 */
export function getChampionshipCountForRingType(input: ChampionshipValidationInput, ringType: string): number {
  const { championshipCounts } = input;
  
  let count = 0;
  switch (ringType) {
    case 'Allbreed':
      count = championshipCounts.lhGcs + championshipCounts.shGcs + championshipCounts.lhChs + championshipCounts.shChs + championshipCounts.lhNovs + championshipCounts.shNovs; // Total GCs + Total CHs + Novices
      break;
    case 'Longhair':
      count = championshipCounts.lhGcs + championshipCounts.lhChs + championshipCounts.lhNovs; // LH GCs + LH CHs + LH Novices
      break;
    case 'Shorthair':
      count = championshipCounts.shGcs + championshipCounts.shChs + championshipCounts.shNovs; // SH GCs + SH CHs + SH Novices
      break;
    case 'OCP':
      return 10; // OCP always requires exactly 10 placements, no threshold checking
    default:
      count = championshipCounts.lhGcs + championshipCounts.shGcs + championshipCounts.lhChs + championshipCounts.shChs + championshipCounts.lhNovs + championshipCounts.shNovs; // Default to total including novices
      break;
  }
  
  return count;
}

/**
 * Helper function to get the breakpoint for a given ring type (AB/LH/SH)
 * Returns 15 if count >= 85, otherwise 10
 * @param input ChampionshipValidationInput
 * @param ringType string
 * @returns number (15 or 10)
 */
export function getBreakpointForRingType(input: ChampionshipValidationInput, ringType: string, championshipThreshold: number = 85): number {
  const count = getChampionshipCountForRingType(input, ringType);
  const breakpoint = count >= championshipThreshold ? 15 : 10;
  return breakpoint;
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
  const numPositions = getChampionshipCountForRingType(input, column.specialty) >= 85 ? 5 : 3;
  const numAwardRows = getBreakpointForRingType(input, column.specialty);
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
  const column = input.columns[columnIndex];
  const numPositions = column ? getChampionshipCountForRingType(input, column.specialty) >= 85 ? 5 : 3 : 3;
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
  const column = input.columns[columnIndex];
  const numAwardRows = column ? getBreakpointForRingType(input, column.specialty) : (input.championshipTotal >= 85 ? 15 : 10);
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
  const column = input.columns[columnIndex];
  const numPositions = column ? getChampionshipCountForRingType(input, column.specialty) >= 85 ? 5 : 3 : 3;
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
  const { championsFinals, lhChampionsFinals, shChampionsFinals } = input;
  const column = input.columns[columnIndex];
  const numPositions = column ? getChampionshipCountForRingType(input, column.specialty) >= 85 ? 5 : 3 : 3;
  
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
  const { columns, showAwards, championsFinals, lhChampionsFinals, shChampionsFinals } = input;
  const column = columns[columnIndex];
  if (!column) return errors;
  const numPositions = getChampionshipCountForRingType(input, column.specialty) >= 85 ? 5 : 3;
  
  // Helper to check Show Awards status
  function getShowAwardStatus(catNum: string): string | null {
    const numAwardRows = getBreakpointForRingType(input, column.specialty);
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
export function validateChampionshipTab(input: ChampionshipValidationInput, maxCats: number): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  // --- Top 10/15 (Show Awards) Section ---
  for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
    const column = input.columns[colIdx];
    const numAwardRows = getBreakpointForRingType(input, column.specialty);
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
      if (cell && cell.catNumber && cell.catNumber.trim() && !isVoidInput(cell.catNumber) && !validateCatNumber(cell.catNumber, maxCats)) {
        errors[key] = getCatNumberValidationMessage(maxCats);
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
            errors[errorKey] = `${getCatNumberValidationMessage(maxCats)} Duplicate: This cat is already placed in another position.`;
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
        if (value && value.trim() && !isVoidInput(value) && !validateCatNumber(value, maxCats)) {
          errors[errorKey] = getCatNumberValidationMessage(maxCats);
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
              errors[errorKey] = `${getCatNumberValidationMessage(maxCats)} Duplicate: This cat is already placed in another finals position.`;
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

  // OCP Ring cross-column validation (runs AFTER all existing validation)
  const ocpRingErrors = validateOCPRingCrossColumn(input, maxCats, errors);
  Object.assign(errors, ocpRingErrors);

  // Super Specialty cross-column validation (runs AFTER all existing validation)
  const superSpecialtyErrors = validateSuperSpecialtyCrossColumn(input, maxCats, errors);
  Object.assign(errors, superSpecialtyErrors);

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
  const column = input.columns[columnIndex];
  const numPositions = column ? getChampionshipCountForRingType(input, column.specialty) >= 85 ? 5 : 3 : 3;
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
  const column = input.columns[columnIndex];
  const numPositions = column ? getChampionshipCountForRingType(input, column.specialty) >= 85 ? 5 : 3 : 3;
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

/**
 * Validates OCP Ring cross-column relationships for Championship tab
 * This function runs AFTER all existing validation is complete
 * Only applies to OCP Ring judges (2 columns: Allbreed + OCP with same judge ID)
 */
export function validateOCPRingCrossColumn(input: ChampionshipValidationInput, maxCats: number, allExistingErrors: { [key: string]: string } = {}): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Only run for OCP Ring judges
  const ocpRings = findOCPRings(input.columns);
  
  for (const ringInfo of ocpRings) {
    const { allbreedColIdx, ocpColIdx } = ringInfo;
    
    // 1. Title/Award Consistency Validation (respect existing errors)
    const titleErrors = validateOCPTitleConsistency(input, allbreedColIdx, ocpColIdx, allExistingErrors, {});
    Object.assign(errors, titleErrors);
    
    // 2. Ranked Cats Priority Validation (pass existing errors to respect validation precedence)
    const priorityErrors = validateOCPRankedCatsPriority(input, allbreedColIdx, ocpColIdx, { ...allExistingErrors, ...errors }, {});
    Object.assign(errors, priorityErrors);
    
    // 3. Order Preservation Validation (pass existing errors to respect validation precedence)
    const orderErrors = validateOCPOrderPreservation(input, allbreedColIdx, ocpColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, orderErrors);
  }
  
  return errors;
}

/**
 * Finds OCP Ring judges (2 columns: Allbreed + OCP with same judge ID)
 */
function findOCPRings(columns: { judge: Judge; specialty: string }[]): Array<{
  allbreedColIdx: number;
  ocpColIdx: number;
}> {
  const rings: Array<{
    allbreedColIdx: number;
    ocpColIdx: number;
  }> = [];
  
  // Group columns by judge ID
  const judgeColumns: { [judgeId: number]: Array<{ colIdx: number; specialty: string }> } = {};
  
  columns.forEach((column, colIdx) => {
    const judgeId = column.judge.id;
    if (!judgeColumns[judgeId]) {
      judgeColumns[judgeId] = [];
    }
    judgeColumns[judgeId].push({ colIdx, specialty: column.specialty });
  });
  
  // Find OCP Ring judges (2 columns: Allbreed + OCP with same judge ID)
  Object.entries(judgeColumns).forEach(([judgeId, judgeColumns]) => {
    if (judgeColumns.length >= 2) {
      const allbreed = judgeColumns.find(col => col.specialty === 'Allbreed');
      const ocp = judgeColumns.find(col => col.specialty === 'OCP');
      
      if (allbreed && ocp) {
        rings.push({
          allbreedColIdx: allbreed.colIdx,
          ocpColIdx: ocp.colIdx
        });
        
        console.log('OCP Ring found:', { 
          judgeId: parseInt(judgeId),
          allbreedColIdx: allbreed.colIdx, 
          allbreedSpecialty: allbreed.specialty,
          ocpColIdx: ocp.colIdx,
          ocpSpecialty: ocp.specialty
        });
      }
    }
  });
  
  return rings;
}

/**
 * Validates title/award consistency between Allbreed and OCP columns
 * Cannot have same cat # labeled CH in AB column and GC in OCP column
 */
function validateOCPTitleConsistency(
  input: ChampionshipValidationInput,
  allbreedColIdx: number,
  ocpColIdx: number,
  allExistingErrors: { [key: string]: string } = {},
  currentErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  const catTitles: { [catNumber: string]: { [column: string]: string } } = {};
  
  // Collect titles from Allbreed column (Show Awards + Finals)
  collectOCPTitlesFromColumn(input, allbreedColIdx, 'Allbreed', catTitles);
  
  // Collect titles from OCP column (Show Awards only)
  collectOCPTitlesFromColumn(input, ocpColIdx, 'OCP', catTitles);
  
  // Check for title inconsistencies
  Object.entries(catTitles).forEach(([catNumber, titles]) => {
    if (titles.Allbreed && titles.OCP && titles.Allbreed !== titles.OCP) {
      // Cannot have same cat # labeled CH in AB column and GC in OCP column
      if ((titles.Allbreed === 'CH' && titles.OCP === 'GC') ||
          (titles.Allbreed === 'GC' && titles.OCP === 'CH')) {
        markOCPTitleInconsistencyErrors(input, catNumber, allbreedColIdx, ocpColIdx, errors, allExistingErrors, currentErrors);
      }
    }
  });
  
  return errors;
}

/**
 * Collects titles from a column for OCP validation (Show Awards + Finals for Allbreed, Show Awards only for OCP)
 */
function collectOCPTitlesFromColumn(
  input: ChampionshipValidationInput,
  colIdx: number,
  columnType: string,
  catTitles: { [catNumber: string]: { [column: string]: string } }
): void {
  // Collect from Show Awards
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 10) { // Top 10 for OCP validation
      const cell = input.showAwards[key];
      if (cell.catNumber && !isVoidInput(cell.catNumber)) {
        const catNumber = cell.catNumber.trim();
        if (!catTitles[catNumber]) {
          catTitles[catNumber] = {};
        }
        catTitles[catNumber][columnType] = cell.status;
      }
    }
  });
  
  // For Allbreed column, also collect from Finals
  if (columnType === 'Allbreed') {
    // Collect from Champions Finals
    Object.keys(input.championsFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx && row < 5) { // Top 5 for OCP validation
        const catNumber = input.championsFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          const trimmedCatNumber = catNumber.trim();
          if (!catTitles[trimmedCatNumber]) {
            catTitles[trimmedCatNumber] = {};
          }
          catTitles[trimmedCatNumber][columnType] = 'CH'; // Finals cats are CH
        }
      }
    });
    
    // Collect from LH Champions Finals
    Object.keys(input.lhChampionsFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx && row < 5) { // Top 5 for OCP validation
        const catNumber = input.lhChampionsFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          const trimmedCatNumber = catNumber.trim();
          if (!catTitles[trimmedCatNumber]) {
            catTitles[trimmedCatNumber] = {};
          }
          catTitles[trimmedCatNumber][columnType] = 'CH'; // Finals cats are CH
        }
      }
    });
    
    // Collect from SH Champions Finals
    Object.keys(input.shChampionsFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx && row < 5) { // Top 5 for OCP validation
        const catNumber = input.shChampionsFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          const trimmedCatNumber = catNumber.trim();
          if (!catTitles[trimmedCatNumber]) {
            catTitles[trimmedCatNumber] = {};
          }
          catTitles[trimmedCatNumber][columnType] = 'CH'; // Finals cats are CH
        }
      }
    });
  }
}

/**
 * Marks title inconsistency errors for OCP rings
 */
function markOCPTitleInconsistencyErrors(
  input: ChampionshipValidationInput,
  catNumber: string,
  allbreedColIdx: number,
  ocpColIdx: number,
  errors: { [key: string]: string },
  allExistingErrors: { [key: string]: string } = {},
  currentErrors: { [key: string]: string } = {}
): void {
  const errorMessage = `Title inconsistency: Cat #${catNumber} has different titles across OCP Ring columns`;
  
  // Mark errors in Allbreed column
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === allbreedColIdx && row < 10) {
      const cell = input.showAwards[key];
      if (cell.catNumber && cell.catNumber.trim() === catNumber) {
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[key] && !currentErrors[key] && !errors[key]) {
          errors[key] = errorMessage;
        }
      }
    }
  });
  
  // Mark errors in OCP column
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === ocpColIdx && row < 10) {
      const cell = input.showAwards[key];
      if (cell.catNumber && cell.catNumber.trim() === catNumber) {
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[key] && !currentErrors[key] && !errors[key]) {
          errors[key] = errorMessage;
        }
      }
    }
  });
}

/**
 * Validates ranked cats priority for OCP rings
 * Filler cats (not ranked in AB ring) cannot appear in OCP before ranked cats
 */
function validateOCPRankedCatsPriority(
  input: ChampionshipValidationInput,
  allbreedColIdx: number,
  ocpColIdx: number,
  titleErrors: { [key: string]: string } = {},
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get ranked cats from Allbreed column
  const rankedCats = getOCPRankedCatsFromColumn(input, allbreedColIdx);
  
  console.log('Ranked cats validation (CH) - AB cats:', Array.from(rankedCats));
  
  // Check OCP column for filler cats appearing before ranked cats
  checkOCPRankedCatsPriorityInColumn(input, ocpColIdx, rankedCats, errors, titleErrors, allExistingErrors);
  
  console.log('Ranked cats validation (CH) - Errors found:', errors);
  
  return errors;
}

/**
 * Gets ranked cats from Allbreed column for OCP validation
 * Ranked cats = GC or CH in top 10 or AB CH or LH CH or SH CH
 */
function getOCPRankedCatsFromColumn(input: ChampionshipValidationInput, colIdx: number): Set<string> {
  const rankedCats = new Set<string>();
  
  // Collect from Show Awards (GC and CH cats in top 10)
  console.log(`Getting ranked cats from AB column ${colIdx}:`);
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 10) { // Top 10 for OCP validation
      const cell = input.showAwards[key];
      if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
        console.log(`  Row ${row}: Cat #${cell.catNumber}, status: ${cell.status}`);
        if (cell.status === 'GC' || cell.status === 'CH') {
          rankedCats.add(cell.catNumber.trim());
          console.log(`    Added ${cell.catNumber} as ranked cat`);
        }
      }
    }
  });
  
  // Collect from Champions Finals
  Object.keys(input.championsFinals).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 5) { // Top 5 for OCP validation
      const catNumber = input.championsFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        rankedCats.add(catNumber.trim());
      }
    }
  });
  
  // Collect from LH Champions Finals
  Object.keys(input.lhChampionsFinals).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 5) { // Top 5 for OCP validation
      const catNumber = input.lhChampionsFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        rankedCats.add(catNumber.trim());
      }
    }
  });
  
  // Collect from SH Champions Finals
  Object.keys(input.shChampionsFinals).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 5) { // Top 5 for OCP validation
      const catNumber = input.shChampionsFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        rankedCats.add(catNumber.trim());
      }
    }
  });
  
  return rankedCats;
}

/**
 * Checks ranked cats priority in OCP column
 */
function checkOCPRankedCatsPriorityInColumn(
  input: ChampionshipValidationInput,
  colIdx: number,
  rankedCats: Set<string>,
  errors: { [key: string]: string },
  titleErrors: { [key: string]: string } = {},
  allExistingErrors: { [key: string]: string } = {}
): void {
  console.log('Checking OCP ranked cats priority (CH) for column', colIdx);
  console.log('All ranked cats (CH):', Array.from(rankedCats));
  
  // Collect all placed cats and separate into ranked/filler
  const placedCats: Array<{cat: string, position: number, isRanked: boolean}> = [];
  
  for (let row = 0; row < 10; row++) { // OCP has exactly 10 placements
    const key = `${colIdx}-${row}`;
    const cell = input.showAwards[key];
    
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      const isRanked = rankedCats.has(catNumber);
      
      console.log(`  Row ${row}: Cat #${catNumber}, is ranked: ${isRanked}`);
      
      // Skip validation for cats that have any existing errors (title, duplicate, etc.)
      if (titleErrors[key] || allExistingErrors[key]) {
        console.log(`    Skipping validation for cat ${catNumber} due to existing error`);
        continue;
      }
      
      placedCats.push({cat: catNumber, position: row, isRanked});
    }
  }
  
  // Find all ranked cats that have been placed
  const placedRankedCats = placedCats.filter(c => c.isRanked);
  const placedFillerCats = placedCats.filter(c => !c.isRanked);
  
  console.log('Placed ranked cats:', placedRankedCats);
  console.log('Placed filler cats:', placedFillerCats);
  
  // Rule: ALL ranked cats must be placed before ANY filler cats
  // Check if there are any filler cats when ranked cats exist
  if (rankedCats.size > 0 && placedFillerCats.length > 0) {
    // Check if there are unplaced ranked cats that should come before any filler cats
    const placedRankedCatNumbers = new Set(placedRankedCats.map(c => c.cat));
    const unplacedRankedCats = Array.from(rankedCats).filter(cat => !placedRankedCatNumbers.has(cat));
    
    if (unplacedRankedCats.length > 0) {
      console.log(`Unplaced ranked cats: ${unplacedRankedCats.join(', ')}`);
      
      // Any filler cat is invalid if there are unplaced ranked cats
      for (const fillerCat of placedFillerCats) {
        const key = `${colIdx}-${fillerCat.position}`;
        console.log(`    Filler cat ${fillerCat.cat} at position ${fillerCat.position} violates rule - ranked cats ${unplacedRankedCats.join(', ')} should be placed first!`);
        // Respect duplicate error precedence - only set if no existing error
        if (!errors[key]) {
          errors[key] = `Filler cat placed before ranked cats: Cat #${fillerCat.cat} is not ranked in Allbreed column but appears in OCP before all ranked cats are placed (${unplacedRankedCats.join(', ')} not placed yet)`;
        }
      }
    } else {
      console.log('All ranked cats have been placed, filler cats are now allowed');
    }
  }
}

/**
 * Validates order preservation for OCP rings
 * Order of AB CH, LH CH, SH CH in AB column should be respected in OCP ranking
 * ENHANCED: AB CH cats must appear first in exact order in OCP ring
 */
function validateOCPOrderPreservation(
  input: ChampionshipValidationInput,
  allbreedColIdx: number,
  ocpColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get ordered cats from Allbreed column sections
  const showAwardsCHOrder = getOrderedCHCatsFromShowAwards(input, allbreedColIdx);
  const abCHOrder = getOrderedABCHCatsFromChampionsFinals(input, allbreedColIdx);
  const lhCHOrder = getOrderedLHCHCatsFromLHChampionsFinals(input, allbreedColIdx);
  const shCHOrder = getOrderedSHCHCatsFromSHChampionsFinals(input, allbreedColIdx);
  
  // Check order preservation in OCP column (4 sections in sequence like PR tab)
  checkOCPOrderPreservationInColumn(input, ocpColIdx, showAwardsCHOrder, 'Show Awards CH', errors, allExistingErrors);
  checkOCPOrderPreservationInColumn(input, ocpColIdx, abCHOrder, 'AB CH', errors, allExistingErrors);
  checkOCPOrderPreservationInColumn(input, ocpColIdx, lhCHOrder, 'LH CH', errors, allExistingErrors);
  checkOCPOrderPreservationInColumn(input, ocpColIdx, shCHOrder, 'SH CH', errors, allExistingErrors);
  
  return errors;
}

/**
 * Gets ordered CH cats from Show Awards for a column
 */
function getOrderedCHCatsFromShowAwards(
  input: ChampionshipValidationInput,
  colIdx: number
): string[] {
  const orderedCats: string[] = [];
  
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 10) { // Top 10 for OCP validation
      const cell = input.showAwards[key];
      if (cell.catNumber && cell.status === 'CH' && !isVoidInput(cell.catNumber)) {
        orderedCats[row] = cell.catNumber.trim();
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}

/**
 * Checks order preservation in OCP column
 * ENHANCED: Now enforces that AB CH cats must appear first in exact order
 */
function checkOCPOrderPreservationInColumn(
  input: ChampionshipValidationInput,
  colIdx: number,
  specialtyOrder: string[],
  hairLength: string,
  errors: { [key: string]: string },
  allExistingErrors: { [key: string]: string } = {}
): void {
  if (specialtyOrder.length === 0) return;
  
  const ocpCats: string[] = [];
  
  // Collect cats from OCP column
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 10) { // OCP has exactly 10 placements
      const cell = input.showAwards[key];
      if (cell.catNumber && !isVoidInput(cell.catNumber)) {
        ocpCats[row] = cell.catNumber;
      }
    }
  });
  
  // SIMPLIFIED VALIDATION: Direct side-by-side comparison for Show Awards CH and AB CH cats
  if (hairLength === 'Show Awards CH' || hairLength === 'AB CH') {
    // Compare specialty cats with OCP cats position by position
    for (let i = 0; i < Math.min(specialtyOrder.length, ocpCats.length); i++) {
      const specialtyCat = specialtyOrder[i];
      const ocpCat = ocpCats[i];
      
      // If OCP position has a cat but it doesn't match the specialty cat for this position
      if (ocpCat && specialtyCat && ocpCat !== specialtyCat) {
        const errorKey = `${colIdx}-${i}`;
        // Skip if there's already an error (duplicate, title, etc.) - respect validation precedence
        if (!allExistingErrors[errorKey] && !errors[errorKey]) {
          errors[errorKey] = `Order violation: ${ocpCat} is out of order in OCP. Must preserve order from ${hairLength} column`;
        }
      }
    }
  } else if (hairLength === 'LH CH' || hairLength === 'SH CH') {
    // For LH CH and SH CH sections, use order preservation logic with fillers allowed
    let lastSpecialtyIndex = -1;
    for (const specialtyCat of specialtyOrder) {
      const currentIndex = ocpCats.indexOf(specialtyCat);
      if (currentIndex !== -1 && currentIndex < lastSpecialtyIndex) {
        // Order violation found
        const errorKey = `${colIdx}-${currentIndex}`;
        // Skip if there's already an error (duplicate, title, etc.) - respect validation precedence
        if (!allExistingErrors[errorKey] && !errors[errorKey]) {
          errors[errorKey] = `Order violation: ${specialtyCat} is out of order in OCP. Must preserve order from ${hairLength} column`;
        }
        break;
      }
      if (currentIndex !== -1) {
        lastSpecialtyIndex = currentIndex;
      }
    }
  } else {
    // For Show Awards CH section, use original order preservation logic
    let lastSpecialtyIndex = -1;
    for (const specialtyCat of specialtyOrder) {
      const currentIndex = ocpCats.indexOf(specialtyCat);
      if (currentIndex !== -1 && currentIndex < lastSpecialtyIndex) {
        // Order violation found
        const errorKey = `${colIdx}-${currentIndex}`;
        // Skip if there's already an error (duplicate, title, etc.) - respect validation precedence
        if (!allExistingErrors[errorKey] && !errors[errorKey]) {
          errors[errorKey] = `Order violation: ${specialtyCat} is out of order in OCP. Must preserve order from ${hairLength} column`;
        }
        break;
      }
      if (currentIndex !== -1) {
        lastSpecialtyIndex = currentIndex;
      }
    }
  }
}

/**
 * Gets ordered AB CH cats from Champions Finals for a column
 */
function getOrderedABCHCatsFromChampionsFinals(
  input: ChampionshipValidationInput,
  colIdx: number
): string[] {
  const orderedCats: string[] = [];
  
  // AB CH cats are stored in championsFinals with keys like "0-0", "0-1", "0-2" etc.
  // where the first number is column index and second is position (0=Best, 1=2nd Best, 2=3rd Best)
  Object.keys(input.championsFinals).forEach(key => {
    const [col, pos] = key.split('-').map(Number);
    if (col === colIdx && pos < 10) { // Top 10 for OCP validation
      const catNumber = input.championsFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        orderedCats[pos] = catNumber.trim();
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}

/**
 * Gets ordered LH CH cats from LH Champions Finals for a column
 */
function getOrderedLHCHCatsFromLHChampionsFinals(
  input: ChampionshipValidationInput,
  colIdx: number
): string[] {
  const orderedCats: string[] = [];
  
  // LH CH cats are stored in lhChampionsFinals with keys like "0-0", "0-1", "0-2" etc.
  // where the first number is column index and second is position (0=Best, 1=2nd Best, 2=3rd Best)
  Object.keys(input.lhChampionsFinals).forEach(key => {
    const [col, pos] = key.split('-').map(Number);
    if (col === colIdx && pos < 10) { // Top 10 for OCP validation
      const catNumber = input.lhChampionsFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        orderedCats[pos] = catNumber.trim();
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}

/**
 * Gets ordered SH CH cats from SH Champions Finals for a column
 */
function getOrderedSHCHCatsFromSHChampionsFinals(
  input: ChampionshipValidationInput,
  colIdx: number
): string[] {
  const orderedCats: string[] = [];
  
  // SH CH cats are stored in shChampionsFinals with keys like "0-0", "0-1", "0-2" etc.
  // where the first number is column index and second is position (0=Best, 1=2nd Best, 2=3rd Best)
  Object.keys(input.shChampionsFinals).forEach(key => {
    const [col, pos] = key.split('-').map(Number);
    if (col === colIdx && pos < 10) { // Top 10 for OCP validation
      const catNumber = input.shChampionsFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        orderedCats[pos] = catNumber.trim();
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}

/**
 * Validates Super Specialty cross-column relationships for Championship tab
 * This function runs AFTER all existing validation is complete
 * Only applies to Super Specialty ring judges (3 columns: LH + SH + AB with same judge ID)
 */
export function validateSuperSpecialtyCrossColumn(input: ChampionshipValidationInput, maxCats: number, allExistingErrors: { [key: string]: string } = {}): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Only run for Super Specialty judges
  const superSpecialtyRings = findSuperSpecialtyRings(input.columns);
  
  // Debug logging to see if Super Specialty rings are detected
  console.log('Super Specialty validation (CH) - Input columns:', input.columns);
  console.log('Super Specialty validation (CH) - Found rings:', superSpecialtyRings);
  
  for (const ringInfo of superSpecialtyRings) {
    const { lhColIdx, shColIdx, abColIdx, judge } = ringInfo;
    
    console.log('Processing Super Specialty ring (CH):', { lhColIdx, shColIdx, abColIdx });
    
    // 1. Title/Award Consistency Validation (respect existing errors)
    const titleErrors = validateTitleConsistencyCH(input, lhColIdx, shColIdx, abColIdx, allExistingErrors, {});
    Object.assign(errors, titleErrors);
    
    // 2. Ranked Cats Priority Validation (respect existing errors)
    const priorityErrors = validateRankedCatsPriorityCH(input, lhColIdx, shColIdx, abColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, priorityErrors);
    
    // 3. Order Preservation Within Hair Length Validation (respect existing errors)
    const orderErrors = validateOrderPreservationCH(input, lhColIdx, shColIdx, abColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, orderErrors);
    
    // 4. Specialty Finals Consistency Validation (respect existing errors)
    const finalsErrors = validateSpecialtyFinalsConsistencyCH(input, lhColIdx, shColIdx, abColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, finalsErrors);
    
    // 5. Cross-Column Duplicate Prevention Validation (respect existing errors)
    const duplicateErrors = validateCrossColumnDuplicatesCH(input, lhColIdx, shColIdx, abColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, duplicateErrors);
  }
  
  return errors;
}

/**
 * Cross-Column Duplicate Prevention Validation for Championship (matches PR validateCrossColumnDuplicates)
 * Rule: A cat number cannot be both longhair and shorthair in the same Super Specialty ring
 */
function validateCrossColumnDuplicatesCH(
  input: ChampionshipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  console.log('validateCrossColumnDuplicatesCH called for ring:', { longhairColIdx, shorthairColIdx, allbreedColIdx });
  
  // Collect cats from Longhair column
  const lhCats: Set<string> = new Set();
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${longhairColIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      lhCats.add(catNumber);
      console.log(`LH cat collected (CH): ${catNumber} at position ${rowIdx}`);
    }
  }
  
  console.log('LH cats collected (CH):', Array.from(lhCats));
  
  // Check if any LH cats appear in SH column
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${shorthairColIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      
      if (lhCats.has(catNumber)) {
        console.log(`Duplicate found (CH): Cat #${catNumber} appears in both LH and SH columns`);
        
        // Mark error in SH column (respect existing error precedence)
        if (!allExistingErrors[key] && !errors[key]) {
          errors[key] = `Duplicate: Cat #${catNumber} cannot be both longhair and shorthair`;
        }
        
        // Mark error in LH column (find the position)
        for (let lhRowIdx = 0; lhRowIdx < 15; lhRowIdx++) {
          const lhKey = `${longhairColIdx}-${lhRowIdx}`;
          const lhCell = input.showAwards[lhKey];
          if (lhCell && lhCell.catNumber && lhCell.catNumber.trim() === catNumber) {
            // Respect existing error precedence
            if (!allExistingErrors[lhKey] && !errors[lhKey]) {
              errors[lhKey] = `Duplicate: Cat #${catNumber} cannot be both longhair and shorthair`;
            }
            break;
          }
        }
      }
    }
  }
  
  console.log('Cross-column duplicate validation (CH) errors:', errors);
  return errors;
}

/**
 * Title/Award Consistency Validation for Championship - Show Awards + Finals sections
 * Rule: Same cat cannot have different titles (status) across columns
 */
function validateTitleConsistencyCH(
  input: ChampionshipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {},
  currentErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get all cat numbers and their titles from all three columns
  const catTitles: { [catNumber: string]: { [column: string]: string } } = {};
  
  // Collect titles from Longhair column
  collectTitlesFromColumnCH(input, longhairColIdx, 'Longhair', catTitles);
  
  // Collect titles from Shorthair column
  collectTitlesFromColumnCH(input, shorthairColIdx, 'Shorthair', catTitles);
  
  // Collect titles from Allbreed column
  collectTitlesFromColumnCH(input, allbreedColIdx, 'Allbreed', catTitles);
  
  // Check for title inconsistencies
  Object.entries(catTitles).forEach(([catNumber, titles]) => {
    const uniqueTitles = Array.from(new Set(Object.values(titles)));
    if (uniqueTitles.length > 1) {
      // Find all cells with this cat number and mark them with error
      markTitleInconsistencyErrorsCH(input, catNumber, longhairColIdx, shorthairColIdx, allbreedColIdx, errors, allExistingErrors, currentErrors);
    }
  });
  
  return errors;
}

/**
 * Collects titles for a specific cat number from a column
 */
function collectTitlesFromColumnCH(
  input: ChampionshipValidationInput,
  colIdx: number,
  columnType: string,
  catTitles: { [catNumber: string]: { [column: string]: string } }
): void {
  // Check Show Awards section
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${colIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      if (!catTitles[catNumber]) catTitles[catNumber] = {};
      catTitles[catNumber][columnType] = cell.status;
    }
  }
  
  // Check Finals sections based on column type
  if (columnType === 'Allbreed') {
    // AB CH cats are stored in championsFinals
    Object.keys(input.championsFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx) {
        const catNumber = input.championsFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          if (!catTitles[catNumber]) catTitles[catNumber] = {};
          catTitles[catNumber][columnType] = 'CH'; // Finals cats are CH
        }
      }
    });
  } else if (columnType === 'Longhair') {
    // LH CH cats are stored in lhChampionsFinals
    Object.keys(input.lhChampionsFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx) {
        const catNumber = input.lhChampionsFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          if (!catTitles[catNumber]) catTitles[catNumber] = {};
          catTitles[catNumber][columnType] = 'CH'; // Finals cats are CH
        }
      }
    });
  } else if (columnType === 'Shorthair') {
    // SH CH cats are stored in shChampionsFinals
    Object.keys(input.shChampionsFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx) {
        const catNumber = input.shChampionsFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          if (!catTitles[catNumber]) catTitles[catNumber] = {};
          catTitles[catNumber][columnType] = 'CH'; // Finals cats are CH
        }
      }
    });
  }
}

/**
 * Marks title inconsistency errors for all occurrences of a cat number
 */
function markTitleInconsistencyErrorsCH(
  input: ChampionshipValidationInput,
  catNumber: string,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  errors: { [key: string]: string },
  allExistingErrors: { [key: string]: string } = {},
  currentErrors: { [key: string]: string } = {}
): void {
  const errorMessage = `Title inconsistency: Cat #${catNumber} has different titles across Super Specialty columns`;
  
  // Mark errors in Show Awards
  [longhairColIdx, shorthairColIdx, allbreedColIdx].forEach(colIdx => {
    for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const cell = input.showAwards[key];
      if (cell && cell.catNumber && cell.catNumber.trim() === catNumber) {
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[key] && !currentErrors[key] && !errors[key]) {
          errors[key] = errorMessage;
        }
      }
    }
  });
  
  // Mark errors in Finals sections
  Object.keys(input.championsFinals).forEach(key => {
    if (input.championsFinals[key] && input.championsFinals[key].trim() === catNumber) {
      const errorKey = `champions-${key}`;
      // Respect duplicate error precedence - only set if no existing error
      if (!allExistingErrors[errorKey] && !currentErrors[errorKey] && !errors[errorKey]) {
        errors[errorKey] = errorMessage;
      }
    }
  });
  
  Object.keys(input.lhChampionsFinals).forEach(key => {
    if (input.lhChampionsFinals[key] && input.lhChampionsFinals[key].trim() === catNumber) {
      const errorKey = `lhChampions-${key}`;
      // Respect duplicate error precedence - only set if no existing error
      if (!allExistingErrors[errorKey] && !currentErrors[errorKey] && !errors[errorKey]) {
        errors[errorKey] = errorMessage;
      }
    }
  });
  
  Object.keys(input.shChampionsFinals).forEach(key => {
    if (input.shChampionsFinals[key] && input.shChampionsFinals[key].trim() === catNumber) {
      const errorKey = `shChampions-${key}`;
      // Respect duplicate error precedence - only set if no existing error
      if (!allExistingErrors[errorKey] && !currentErrors[errorKey] && !errors[errorKey]) {
        errors[errorKey] = errorMessage;
      }
    }
  });
}

/**
 * Ranked Cats Priority Validation for Championship - Show Awards section
 * Rule: Filler cats (cats not ranked in specialty columns) cannot be placed before ranked cats
 */
function validateRankedCatsPriorityCH(
  input: ChampionshipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get ranked cats from specialty columns
  const longhairRankedCats = getRankedCatsFromColumnCH(input, longhairColIdx);
  const shorthairRankedCats = getRankedCatsFromColumnCH(input, shorthairColIdx);
  
  console.log('Ranked cats validation (CH) - LH cats:', Array.from(longhairRankedCats));
  console.log('Ranked cats validation (CH) - SH cats:', Array.from(shorthairRankedCats));
  
  // Check Allbreed column for violations
  checkRankedCatsPriorityInColumnCH(input, allbreedColIdx, longhairRankedCats, shorthairRankedCats, errors, allExistingErrors);
  
  console.log('Ranked cats validation (CH) - Errors found:', errors);
  
  return errors;
}

/**
 * Gets ranked cats from a column (cats that appear in Show Awards)
 */
function getRankedCatsFromColumnCH(input: ChampionshipValidationInput, colIdx: number): Set<string> {
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
function checkRankedCatsPriorityInColumnCH(
  input: ChampionshipValidationInput,
  colIdx: number,
  longhairRankedCats: Set<string>,
  shorthairRankedCats: Set<string>,
  errors: { [key: string]: string },
  allExistingErrors: { [key: string]: string } = {}
): void {
  const allRankedCats = new Set([...longhairRankedCats, ...shorthairRankedCats]);
  
  console.log('Checking ranked cats priority (CH) for column', colIdx);
  console.log('All ranked cats (CH):', Array.from(allRankedCats));
  
  // Check each position in the Allbreed column
  console.log(`Checking Allbreed column (CH) ${colIdx} for cats:`);
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${colIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      console.log(`  Row ${rowIdx}: Cat #${catNumber}, is ranked: ${allRankedCats.has(catNumber)}`);
      
      // If this is a filler cat (not ranked in specialty columns)
      if (!allRankedCats.has(catNumber)) {
        console.log(`  Found filler cat (CH) ${catNumber} at position ${rowIdx}`);
        
        // Check if there are any ranked cats that should be placed before this position
        // by looking at the ranked cats list and checking if any should come before this position
        const rankedCatsArray = Array.from(allRankedCats);
        if (rankedCatsArray.length > 0) {
          console.log(`    There are ${rankedCatsArray.length} ranked cats that should be placed first: ${rankedCatsArray.join(', ')}`);
          console.log(`    Filler cat ${catNumber} at position ${rowIdx} violates the rule - ranked cats should come first!`);
          // Respect duplicate error precedence - only set if no existing error
          if (!allExistingErrors[key] && !errors[key]) {
            errors[key] = `Filler cat placed before ranked cats: Cat #${catNumber} is not ranked in specialty columns but appears in Allbreed before ranked cats`;
          }
        }
      }
    }
  }
}

/**
 * Order Preservation Validation for Championship - Show Awards section
 * Rule: Cats must preserve LH/SH order in AB Show Awards column
 */
function validateOrderPreservationCH(
  input: ChampionshipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Validate Longhair order preservation
  validateHairLengthOrderPreservationCH(input, longhairColIdx, allbreedColIdx, 'Longhair', errors, allExistingErrors);
  
  // Validate Shorthair order preservation
  validateHairLengthOrderPreservationCH(input, shorthairColIdx, allbreedColIdx, 'Shorthair', errors, allExistingErrors);
  
  return errors;
}

/**
 * Validates order preservation for a specific hair length
 */
function validateHairLengthOrderPreservationCH(
  input: ChampionshipValidationInput,
  specialtyColIdx: number,
  allbreedColIdx: number,
  hairLength: string,
  errors: { [key: string]: string },
  allExistingErrors: { [key: string]: string } = {}
): void {
  // Get ordered cats from specialty column
  const specialtyOrder = getOrderedCatsFromColumnCH(input, specialtyColIdx);
  
  // Check order preservation in Allbreed column
  checkOrderPreservationInAllbreedCH(input, allbreedColIdx, specialtyOrder, hairLength, errors, allExistingErrors);
}

/**
 * Gets ordered cats from a column
 */
function getOrderedCatsFromColumnCH(input: ChampionshipValidationInput, colIdx: number): string[] {
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
function checkOrderPreservationInAllbreedCH(
  input: ChampionshipValidationInput,
  colIdx: number,
  specialtyOrder: string[],
  hairLength: string,
  errors: { [key: string]: string },
  allExistingErrors: { [key: string]: string } = {}
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
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[key] && !errors[key]) {
          errors[key] = `Order violation: ${allbreedCat} is out of order in Allbreed. Must preserve order from ${hairLength} column`;
        }
      }
      specialtyIndex++;
    }
  }
}

/**
 * Specialty Finals Consistency Validation for Championship - Finals sections only
 * Rule: LH/SH finals consistency with AB column finals
 */
function validateSpecialtyFinalsConsistencyCH(
  input: ChampionshipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Validate Longhair finals consistency (LH CH section to LH CH section)
  validateHairLengthFinalsConsistencyCH(input, longhairColIdx, allbreedColIdx, 'Longhair', 'lhChampionsFinals', errors, allExistingErrors);
  
  // Validate Shorthair finals consistency (SH CH section to SH CH section)
  validateHairLengthFinalsConsistencyCH(input, shorthairColIdx, allbreedColIdx, 'Shorthair', 'shChampionsFinals', errors, allExistingErrors);
  
  return errors;
}

/**
 * Validates finals consistency for a specific hair length
 */
function validateHairLengthFinalsConsistencyCH(
  input: ChampionshipValidationInput,
  specialtyColIdx: number,
  allbreedColIdx: number,
  hairLength: string,
  finalsSection: 'lhChampionsFinals' | 'shChampionsFinals',
  errors: { [key: string]: string },
  allExistingErrors: { [key: string]: string } = {}
): void {
  // Check each position individually (0, 1, 2, 3, 4, etc.)
  for (let pos = 0; pos < 15; pos++) {
    const specialtyKey = `${specialtyColIdx}-${pos}`;
    const allbreedKey = `${allbreedColIdx}-${pos}`;
    
    const specialtyValue = (input as any)[finalsSection][specialtyKey];
    const allbreedValue = (input as any)[finalsSection][allbreedKey];
    
    // Check if there's a mismatch between specialty and allbreed for the same position
    if (specialtyValue !== allbreedValue) {
      if (specialtyValue && !allbreedValue) {
        // Specialty has value but allbreed doesn't
        const sectionName = finalsSection === 'lhChampionsFinals' ? 'lhChampions' : 'shChampions';
        const errorKey = `${sectionName}-${allbreedColIdx}-${pos}`;
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[errorKey] && !errors[errorKey]) {
          errors[errorKey] = `Finals inconsistency: ${hairLength} specialty has ${specialtyValue} but Allbreed column is missing this cat for position ${pos + 1}`;
        }
      } else if (!specialtyValue && allbreedValue) {
        // Allbreed has value but specialty doesn't
        const sectionName = finalsSection === 'lhChampionsFinals' ? 'lhChampions' : 'shChampions';
        const errorKey = `${sectionName}-${allbreedColIdx}-${pos}`;
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[errorKey] && !errors[errorKey]) {
          errors[errorKey] = `Finals inconsistency: Allbreed column has ${allbreedValue} but ${hairLength} specialty is missing this cat for position ${pos + 1}`;
        }
      } else if (specialtyValue && allbreedValue && specialtyValue !== allbreedValue) {
        // Both have values but they're different
        const sectionName = finalsSection === 'lhChampionsFinals' ? 'lhChampions' : 'shChampions';
        const errorKey = `${sectionName}-${allbreedColIdx}-${pos}`;
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[errorKey] && !errors[errorKey]) {
          errors[errorKey] = `Finals inconsistency: ${hairLength} specialty has ${specialtyValue} but Allbreed column has ${allbreedValue} for position ${pos + 1}`;
        }
      }
    }
  }
}

/**
 * Finds Super Specialty rings (3 columns: LH + SH + AB with same judge ID)
 */
function findSuperSpecialtyRings(columns: { judge: Judge; specialty: string }[]): Array<{
  lhColIdx: number;
  shColIdx: number;
  abColIdx: number;
  judge: Judge;
}> {
  const rings: Array<{
    lhColIdx: number;
    shColIdx: number;
    abColIdx: number;
    judge: Judge;
  }> = [];
  
  // Group columns by judge ID
  const judgeColumns: { [judgeId: number]: Array<{ colIdx: number; specialty: string }> } = {};
  
  columns.forEach((column, colIdx) => {
    const judgeId = column.judge.id;
    if (!judgeColumns[judgeId]) {
      judgeColumns[judgeId] = [];
    }
    judgeColumns[judgeId].push({ colIdx, specialty: column.specialty });
  });
  
  console.log('findSuperSpecialtyRings (CH) - judgeColumns:', judgeColumns);
  
  // Find Super Specialty judges (3 columns: LH + SH + AB with same judge ID)
  Object.entries(judgeColumns).forEach(([judgeId, judgeColumns]) => {
    console.log(`Checking judge ${judgeId} with ${judgeColumns.length} columns:`, judgeColumns);
    
    if (judgeColumns.length >= 3) {
      const longhair = judgeColumns.find(col => col.specialty === 'Longhair');
      const shorthair = judgeColumns.find(col => col.specialty === 'Shorthair');
      const allbreed = judgeColumns.find(col => col.specialty === 'Allbreed');
      
      console.log(`Judge ${judgeId} specialties found:`, { longhair, shorthair, allbreed });
      
      if (longhair && shorthair && allbreed) {
        const judge = columns.find(col => col.judge.id === parseInt(judgeId))?.judge;
        if (judge) {
          console.log(`Super Specialty ring detected for judge ${judge.name} (${judge.acronym})`);
          rings.push({
            lhColIdx: longhair.colIdx,
            shColIdx: shorthair.colIdx,
            abColIdx: allbreed.colIdx,
            judge: judge
          });
        }
      }
    }
  });
  
  console.log('findSuperSpecialtyRings (CH) - final rings:', rings);
  return rings;
}

