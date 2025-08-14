/**
 * @file premiershipValidation.ts
 * @description Premiership tab validation logic. All key generation and lookups use hyphens (e.g., '0-1'), never underscores, per .cursor/rules/naming-conventions.mdc.
 * This is CRITICAL for validation and CSV export compatibility.
 *
 * Logic mirrors championshipValidation.ts, but for PR/GP/NOV, with strict error precedence and all rules as clarified by user and docs.
 */

export interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

export interface CellData {
  catNumber: string;
  status: string; // GP, PR, NOV
  voided?: boolean;
}

export interface PremiershipValidationInput {
  columns: { judge: Judge; specialty: string }[];
  showAwards: { [key: string]: CellData };
  premiersFinals: { [key: string]: string };
  abPremiersFinals: { [key: string]: string };
  lhPremiersFinals: { [key: string]: string };
  shPremiersFinals: { [key: string]: string };
  premiershipTotal: number;
  premiershipCounts: {
    gps: number;
    lhGps: number;
    shGps: number;
    lhPrs: number;
    shPrs: number;
    lhNovs: number;
    shNovs: number;
    novs: number;
    prs: number;
  };
  voidedShowAwards?: { [key: string]: boolean };
  voidedPremiersFinals?: { [key: string]: boolean };
  voidedABPremiersFinals?: { [key: string]: boolean };
  voidedLHPremiersFinals?: { [key: string]: boolean };
  voidedSHPremiersFinals?: { [key: string]: boolean };
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
  input: PremiershipValidationInput,
  columnIndex: number,
  newValue: string,
  excludeKey?: string
): boolean {
  const { showAwards } = input;
  if (!newValue || newValue.trim() === '') return false;
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  for (let position = 0; position < 15; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && showAwards[key]?.catNumber) {
      const catNum = showAwards[key].catNumber.trim();
      if (catNum && catNum !== '') valuesInSection.add(catNum);
    }
  }
  return valuesInSection.has(trimmedValue);
}

/**
 * Checks for duplicate cat numbers within the AB PR finals section only
 */
export function checkDuplicateCatNumbersInABPremiersFinals(
  input: PremiershipValidationInput,
  columnIndex: number,
  newValue: string,
  excludeKey?: string
): boolean {
  const { abPremiersFinals, columns } = input;
  if (!newValue || newValue.trim() === '') return false;
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && abPremiersFinals[key]) {
      const catNum = abPremiersFinals[key].trim();
      if (catNum && catNum !== '') valuesInSection.add(catNum);
    }
  }
  return valuesInSection.has(trimmedValue);
}

/**
 * Checks for duplicate cat numbers within the LH PR finals section only
 */
export function checkDuplicateCatNumbersInLHPremiersFinals(
  input: PremiershipValidationInput,
  columnIndex: number,
  newValue: string,
  excludeKey?: string
): boolean {
  const { lhPremiersFinals, columns } = input;
  if (!newValue || newValue.trim() === '') return false;
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && lhPremiersFinals[key]) {
      const catNum = lhPremiersFinals[key].trim();
      if (catNum && catNum !== '') valuesInSection.add(catNum);
    }
  }
  return valuesInSection.has(trimmedValue);
}

/**
 * Checks for duplicate cat numbers within the SH PR finals section only
 */
export function checkDuplicateCatNumbersInSHPremiersFinals(
  input: PremiershipValidationInput,
  columnIndex: number,
  newValue: string,
  excludeKey?: string
): boolean {
  const { shPremiersFinals, columns } = input;
  if (!newValue || newValue.trim() === '') return false;
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const column = columns[columnIndex];
  const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && shPremiersFinals[key]) {
      const catNum = shPremiersFinals[key].trim();
      if (catNum && catNum !== '') valuesInSection.add(catNum);
    }
  }
  return valuesInSection.has(trimmedValue);
}

/**
 * Helper function to get the number of finals positions for a given ring type (AB/LH/SH)
 * Mirrors championshipValidation.ts logic, but uses premiership counts.
 * @param input PremiershipValidationInput
 * @param ringType string
 * @returns number of finals positions (5 or 3)
 */
export function getFinalsPositionsForRingType(input: PremiershipValidationInput, ringType: string, premiershipThreshold: number = 50): number {
  const count = getPremiershipCountForRingType(input, ringType);
  const positions = count >= premiershipThreshold ? 3 : 2; // 3 positions if 15 awards, 2 if 10 awards
  return positions;
}

/**
 * Helper function to get the premiership count for a given ring type (AB/LH/SH)
 * @param input PremiershipValidationInput
 * @param ringType string
 * @returns number
 */
export function getPremiershipCountForRingType(input: PremiershipValidationInput, ringType: string): number {
  const { premiershipCounts } = input;
  
  let count = 0;
  switch (ringType) {
    case 'Allbreed':
      count = premiershipCounts.gps + premiershipCounts.prs + premiershipCounts.lhNovs + premiershipCounts.shNovs; // Total GPs + Total PRs + Novices
      break;
    case 'Longhair':
      count = premiershipCounts.lhGps + premiershipCounts.lhPrs + premiershipCounts.lhNovs; // LH GPs + LH PRs + LH Novices
      break;
    case 'Shorthair':
      count = premiershipCounts.shGps + premiershipCounts.shPrs + premiershipCounts.shNovs; // SH GPs + SH PRs + SH Novices
      break;
    case 'OCP':
      return 10; // OCP always requires exactly 10 placements, no threshold checking
    default:
      count = premiershipCounts.gps + premiershipCounts.prs + premiershipCounts.lhNovs + premiershipCounts.shNovs; // Default to total including novices
      break;
  }
  
  return count;
}

/**
 * Helper function to get the breakpoint for a given ring type (AB/LH/SH)
 * Returns 15 if count >= 50, otherwise 10
 * @param input PremiershipValidationInput
 * @param ringType string
 * @returns number (15 or 10)
 */
export function getBreakpointForRingType(input: PremiershipValidationInput, ringType: string, premiershipThreshold: number = 50): number {
  const count = getPremiershipCountForRingType(input, ringType);
  const breakpoint = count >= premiershipThreshold ? 15 : 10;
  return breakpoint;
}

/**
 * Validates that positions are filled sequentially (no skipping)
 * Mirrors championshipValidation.ts logic
 */
export function validateSequentialEntry(
  input: PremiershipValidationInput,
  section: 'showAwards' | 'abPremiers' | 'lhPremiers' | 'shPremiers',
  columnIndex: number,
  position: number,
  newValue: string
): boolean {
  if (!newValue || newValue.trim() === '') return true;
  let sectionData: Record<string, unknown>;
  switch (section) {
    case 'showAwards':
      sectionData = input.showAwards;
      break;
    case 'abPremiers':
      sectionData = input.abPremiersFinals;
      break;
    case 'lhPremiers':
      sectionData = input.lhPremiersFinals;
      break;
    case 'shPremiers':
      sectionData = input.shPremiersFinals;
      break;
    default:
      return true;
  }
  for (let i = 0; i < position; i++) {
    const key = `${columnIndex}-${i}`;
    const value = sectionData[key];
    if (section === 'showAwards') {
      const cellData = value as CellData;
      if (!cellData || !cellData.catNumber || cellData.catNumber.trim() === '') {
        return false;
      }
    } else {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Helper to get the list of PR cats from Top 10/15 (Show Awards) for a column, in order
 * VOID placements are always skipped (parity with ChampionshipTab)
 */
function getTop15PRCats(input: PremiershipValidationInput, columnIndex: number): string[] {
  const { showAwards } = input;
  const prCats: string[] = [];
  for (let position = 0; position < 15; position++) {
    const key = `${columnIndex}-${position}`;
    const award = showAwards[key];
    // FIX: skip VOID placements for full parity with ChampionshipTab
    if (
      award &&
      award.status === 'PR' &&
      award.catNumber &&
      award.catNumber.trim() !== '' &&
      !isVoidInput(award.catNumber)
    ) {
      prCats.push(award.catNumber.trim());
    }
  }
  return prCats;
}

/**
 * Validates that Best LH PR finals contain only cats from PR cats in show awards (for Longhair rings)
 * Returns { isValid, firstErrorPosition, errorMessage }
 */
export function validateBestLHPRWithTop15AndGetFirstError(input: PremiershipValidationInput, columnIndex: number): { isValid: boolean, firstErrorPosition: number, errorMessage: string } {
  const prCats = getTop15PRCats(input, columnIndex);
  const numPositions = input.columns[columnIndex] ? getFinalsPositionsForRingType(input, input.columns[columnIndex].specialty) : 3;
  const N = prCats.length;
  const seen = new Set<string>();
  
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = input.lhPremiersFinals[key];
    if (!value || value.trim() === '') continue;
    
    if (seen.has(value.trim())) {
      return { isValid: false, firstErrorPosition: position, errorMessage: `${value.trim()} is a duplicate in LH PR.` };
    }
    seen.add(value.trim());
    
    if (position < N) {
      // Main positions: must match PR cats from show awards in order
      if (value.trim() !== prCats[position]) {
        return {
          isValid: false,
          firstErrorPosition: position,
          errorMessage: `Must be ${prCats[position]} (${ordinal(position + 1)} PR required by CFA rules)`
        };
      }
    } else {
      // Filler positions: only check for not being a non-PR from Show Awards
      const showAward = getShowAwardByCatNumber(input, columnIndex, value);
      if (showAward && showAward.status !== 'PR') {
        return {
          isValid: false,
          firstErrorPosition: position,
          errorMessage: `${value.trim()} is a ${showAward.status} in Show Awards and cannot be used in PR finals.`
        };
      }
      // Do NOT check 'must match PR cats from show awards in order' for fillers
    }
  }
  return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
}

/**
 * Validates that Best SH PR finals contain only cats from PR cats in show awards (for Shorthair rings)
 * Returns { isValid, firstErrorPosition, errorMessage }
 */
export function validateBestSHPRWithTop15AndGetFirstError(input: PremiershipValidationInput, columnIndex: number): { isValid: boolean, firstErrorPosition: number, errorMessage: string } {
  const prCats = getTop15PRCats(input, columnIndex);
  const numPositions = input.columns[columnIndex] ? getFinalsPositionsForRingType(input, input.columns[columnIndex].specialty) : 3;
  const N = prCats.length;
  const seen = new Set<string>();
  
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const value = input.shPremiersFinals[key];
    if (!value || value.trim() === '') continue;
    
    if (seen.has(value.trim())) {
      return { isValid: false, firstErrorPosition: position, errorMessage: `${value.trim()} is a duplicate in SH PR.` };
    }
    seen.add(value.trim());
    
    if (position < N) {
      // Main positions: must match PR cats from show awards in order
      if (value.trim() !== prCats[position]) {
        return {
          isValid: false,
          firstErrorPosition: position,
          errorMessage: `Must be ${prCats[position]} (${ordinal(position + 1)} PR required by CFA rules)`
        };
      }
    } else {
      // Filler positions: only check for not being a non-PR from Show Awards
      const showAward = getShowAwardByCatNumber(input, columnIndex, value);
      if (showAward && showAward.status !== 'PR') {
        return {
          isValid: false,
          firstErrorPosition: position,
          errorMessage: `${value.trim()} is a ${showAward.status} in Show Awards and cannot be used in PR finals.`
        };
      }
      // Do NOT check 'must match PR cats from show awards in order' for fillers
    }
  }
  return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
}

// Helper to get show award by cat number for a column
function getShowAwardByCatNumber(input: PremiershipValidationInput, columnIndex: number, catNumber: string) {
  for (let i = 0; i < 15; i++) {
    const key = `${columnIndex}-${i}`;
    const award = input.showAwards[key];
    if (award && award.catNumber && award.catNumber.trim() === catNumber.trim()) {
      return award;
    }
  }
  return null;
}

/**
 * Helper to check order for Best AB PR: Nth PR in Best AB PR must match Nth PR in Top 10/15 (Show Awards)
 */
function validateBestABPROrder(input: PremiershipValidationInput, colIdx: number, pos: number, cat: string): string | undefined {
  const prCats = getTop15PRCats(input, colIdx);
  if (prCats.length > pos) {
    const requiredCat = prCats[pos];
    if (cat !== requiredCat) {
      return `Must be ${requiredCat} (${ordinal(pos + 1)} PR required by CFA rules)`;
    }
  }
  return undefined;
}

/**
 * Validates that in LH/SH PR sections, all AB PR cats assigned to the section must be at the top (in AB PR order), and fillers (non-AB PR) can only appear after all AB PR cats.
 * The AB PR cats in LH/SH must form a subsequence of the AB PR list (order preserved, but not necessarily consecutive).
 * If any filler appears before an AB PR cat, show an order error on the first offending cell.
 * @param input PremiershipValidationInput
 * @param sectionKey 'lhPremiersFinals' | 'shPremiersFinals'
 * @param colIdx number
 * @param pos number
 * @param cat string
 * @returns string | undefined
 */
function validateBestHairPROrder(input: PremiershipValidationInput, sectionKey: 'lhPremiersFinals' | 'shPremiersFinals', colIdx: number, pos: number, _cat: string): string | undefined {
  const abFinals = (input as any)['abPremiersFinals'] as { [key: string]: string };
  const numPositions = input.columns[colIdx] ? getFinalsPositionsForRingType(input, input.columns[colIdx].specialty) : 3;
  
  // Build the AB PR order array
  const abCats: string[] = [];
  for (let i = 0; i < numPositions; i++) {
    const abCat = abFinals ? abFinals[`${colIdx}-${i}`] : '';
    if (abCat && abCat.trim()) abCats.push(abCat.trim());
  }
  
  // Build the current LH/SH PR order up to and including this position
  const sectionFinals = (input as any)[sectionKey] as { [key: string]: string };
  const hairCats: string[] = [];
  for (let i = 0; i <= pos; i++) {
    const hairCat = sectionFinals ? sectionFinals[`${colIdx}-${i}`] : '';
    if (hairCat && hairCat.trim()) hairCats.push(hairCat.trim());
  }
  
  // Create a set of AB PR cats for quick lookup
  const abCatsSet = new Set(abCats);
  
  // Extract only the AB PR cats from the hair section (in order)
  const abCatsInHairSection: string[] = [];
  for (const hairCat of hairCats) {
    if (abCatsSet.has(hairCat)) {
      abCatsInHairSection.push(hairCat);
    }
  }
  
  // Check that AB PR cats form a subsequence of the AB PR list
  let abIdx = 0;
  for (let i = 0; i < abCatsInHairSection.length; i++) {
    const currentCat = abCatsInHairSection[i];
    while (abIdx < abCats.length && abCats[abIdx] !== currentCat) {
      abIdx++;
    }
    if (abIdx === abCats.length) {
      // Not found in the remaining AB PR cats: order violation
      return `Order violation: ${currentCat} is out of order in ${sectionKey.replace('PremiersFinals','')} PR. Must preserve the order from Best AB PR (subsequence required).`;
    }
    abIdx++;
  }
  
  // Check that all fillers come after all AB PR cats
  let foundFirstFiller = false;
  for (let i = 0; i < hairCats.length; i++) {
    const currentCat = hairCats[i];
    if (abCatsSet.has(currentCat)) {
      if (foundFirstFiller) {
        // AB PR cat appears after a filler - this is an error
        return `Order violation: ${currentCat} (AB PR) must be above all fillers in ${sectionKey.replace('PremiersFinals','')} PR.`;
      }
    } else {
      foundFirstFiller = true;
    }
  }
  
  return undefined;
}

/**
 * Main validation function for the Premiership tab.
 * Enforces strict error precedence: duplicate > status > sequential > assignment reminder.
 * All error keys are section-prefixed and use hyphens.
 * Mirrors validateChampionshipTab from championshipValidation.ts.
 * @param input PremiershipValidationInput
 * @returns { [key: string]: string } Error object keyed by section-prefixed cell keys
 */
export function validatePremiershipTab(input: PremiershipValidationInput, maxCats: number, premiershipThreshold: number = 50): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Debug: Log the input columns to see what we're working with
  console.log('Premiership validation - Input columns:', input.columns);
  console.log('Premiership validation - Column specialties:', input.columns.map(col => ({ id: col.judge.id, specialty: col.specialty })));
  
  // Finals sections to validate
  const finalsSections = [
    { key: 'abPremiersFinals', prefix: 'abPremiersFinals', checkDuplicate: checkDuplicateCatNumbersInABPremiersFinals },
    { key: 'lhPremiersFinals', prefix: 'lhPremiersFinals', checkDuplicate: checkDuplicateCatNumbersInLHPremiersFinals },
    { key: 'shPremiersFinals', prefix: 'shPremiersFinals', checkDuplicate: checkDuplicateCatNumbersInSHPremiersFinals },
  ];
  // --- Finals validation ---
  for (const section of finalsSections) {
    for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
      const finals = (input as any)[section.key] as { [key: string]: string };
      const catNumbers: { [pos: number]: string } = {};
      const column = input.columns[colIdx];
      const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
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
      // 2.5. Cross-section duplicate error: LH PR and SH PR cannot contain the same cat number
      if (section.prefix === 'lhPremiersFinals' || section.prefix === 'shPremiersFinals') {
        Object.entries(catNumbers).forEach(([pos, cat]) => {
          const errorKey = `${section.prefix}-${colIdx}-${pos}`;
          if (errors[errorKey]) return; // skip if range or duplicate error present
          
          // Check if this cat appears in the other hair section (LH vs SH)
          const otherSection = section.prefix === 'lhPremiersFinals' ? 'shPremiersFinals' : 'lhPremiersFinals';
          const otherFinals = (input as any)[`${otherSection}`] as { [key: string]: string };
          const otherNumPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
          
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
        // Status error: Only PR eligible for finals (no GP/NOV)
        // CFA rule: Must search ONLY the current column's Show Awards for this cat number
        let status: string | undefined = undefined;
        // Only check the current column's Show Awards, not all columns
        for (let i = 0; i < 15; i++) {
          const showAward = input.showAwards[`${colIdx}-${i}`];
          if (showAward && showAward.catNumber && showAward.catNumber.trim() === cat && !isVoidInput(showAward.catNumber)) {
            status = showAward.status;
            break;
          }
        }
        if (status === 'GP' || status === 'NOV') {
          errors[errorKey] = `${cat} is listed as a ${status} in Show Awards and cannot be awarded PR final.`;
        }
      });
      Object.entries(catNumbers).forEach(([pos, cat]) => {
        const errorKey = `${section.prefix}-${colIdx}-${pos}`;
        if (errors[errorKey]) return; // skip if range, duplicate, or status error present
        // 4. Sequential entry error: only if no range, duplicate, or status error
        let sequentialError = false;
        for (let i = 0; i < Number(pos); i++) {
          const prevKey = `${colIdx}-${i}`;
          const prevValue = finals ? finals[prevKey] : '';
          // FIX: Treat VOID as a valid skip (do NOT trigger sequential error if previous is VOID)
          if (!prevValue || prevValue.trim() === '') {
            sequentialError = true;
            break;
          }
          // If prevValue is VOID, treat as a valid skip (do NOT set sequentialError)
        }
        if (sequentialError) {
          errors[errorKey] = 'You must fill previous placements before entering this position.';
          return;
        }
        // 5. Order error: only for Best AB PR, LH PR, SH PR, and only if no higher error
        if (!errors[errorKey]) {
          let orderError: string | undefined;
          if (section.prefix === 'abPremiersFinals') {
            orderError = validateBestABPROrder(input, colIdx, Number(pos), cat);
          } else if (section.prefix === 'lhPremiersFinals') {
            // For LH PR: use single specialty validation for Longhair rings, AB validation for Allbreed rings
            if (column.specialty === 'Longhair') {
              const lhResult = validateBestLHPRWithTop15AndGetFirstError(input, colIdx);
              if (!lhResult.isValid && lhResult.firstErrorPosition === Number(pos)) {
                orderError = lhResult.errorMessage;
              }
            } else if (column.specialty === 'Allbreed') {
              orderError = validateBestHairPROrder(input, 'lhPremiersFinals', colIdx, Number(pos), cat);
            }
          } else if (section.prefix === 'shPremiersFinals') {
            // For SH PR: use single specialty validation for Shorthair rings, AB validation for Allbreed rings
            if (column.specialty === 'Shorthair') {
              const shResult = validateBestSHPRWithTop15AndGetFirstError(input, colIdx);
              if (!shResult.isValid && shResult.firstErrorPosition === Number(pos)) {
                orderError = shResult.errorMessage;
              }
            } else if (column.specialty === 'Allbreed') {
              orderError = validateBestHairPROrder(input, 'shPremiersFinals', colIdx, Number(pos), cat);
            }
          }
          if (orderError) {
            errors[errorKey] = orderError;
          }
        }
        // 6. Assignment reminder handled after all other errors
        // Only set assignment reminder if there is no error already present for this cell
        if (!errors[errorKey] && section.prefix === 'abPremiersFinals' && column.specialty === 'Allbreed') {
          let foundInLH = false;
          let foundInSH = false;
          const lhFinals = (input as any)['lhPremiersFinals'] as { [key: string]: string };
          const shFinals = (input as any)['shPremiersFinals'] as { [key: string]: string };
          for (let j = 0; j < numPositions; j++) {
            if (lhFinals && lhFinals[`${colIdx}-${j}`] && lhFinals[`${colIdx}-${j}`].trim() === cat && !isVoidInput(lhFinals[`${colIdx}-${j}`])) {
              foundInLH = true;
              break;
            }
          }
          for (let j = 0; j < numPositions; j++) {
            if (shFinals && shFinals[`${colIdx}-${j}`] && shFinals[`${colIdx}-${j}`].trim() === cat && !isVoidInput(shFinals[`${colIdx}-${j}`])) {
              foundInSH = true;
              break;
            }
          }
          if (!foundInLH && !foundInSH) {
            errors[errorKey] = `${cat} needs to be assigned to either LH or SH PR final.`;
          }
        }
      });
    }
  }
  // --- Show Awards (Top 10/15) validation ---
  for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
    const column = input.columns[colIdx];
    const breakpoint = getPremiershipCountForRingType(input, column.specialty) >= premiershipThreshold ? 15 : 10;
    const catNumToPositions: { [cat: string]: number[] } = {};
    for (let pos = 0; pos < breakpoint; pos++) {
      const key = `${colIdx}-${pos}`;
      const award = input.showAwards[key];
      if (award && award.catNumber && award.catNumber.trim() !== '' && !isVoidInput(award.catNumber)) {
        const cat = award.catNumber.trim();
        if (!catNumToPositions[cat]) catNumToPositions[cat] = [];
        catNumToPositions[cat].push(pos);
      }
    }
    // 1. Range error: assign first
    for (let pos = 0; pos < breakpoint; pos++) {
      const key = `${colIdx}-${pos}`;
      const award = input.showAwards[key];
              if (award && award.catNumber && award.catNumber.trim() !== '' && !isVoidInput(award.catNumber) && !validateCatNumber(award.catNumber, maxCats)) {
                  errors[key] = getCatNumberValidationMessage(maxCats);
      }
    }
    // 2. Duplicate error: merge with range if both
    Object.entries(catNumToPositions).forEach(([, positions]) => {
      if (positions.length > 1) {
        positions.forEach(pos => {
          const key = `${colIdx}-${pos}`;
          if (errors[key]) {
            errors[key] = `${getCatNumberValidationMessage(maxCats)} Duplicate: This cat is already placed in another position.`;
          } else {
            errors[key] = 'Duplicate: This cat is already placed in another position.';
          }
        });
      }
    });
    // 3. Sequential entry error: only if no range or duplicate error
    for (let pos = 0; pos < breakpoint; pos++) {
      const key = `${colIdx}-${pos}`;
      const award = input.showAwards[key];
      if (award && award.catNumber && award.catNumber.trim() !== '' && !isVoidInput(award.catNumber)) {
        if (errors[key]) continue; // skip if range or duplicate error present
        if (!validateSequentialEntry(input, 'showAwards', colIdx, pos, award.catNumber)) {
          errors[key] = 'You must fill previous placements before entering this position.';
        }
      }
    }
  }

  // Super Specialty cross-column validation (runs AFTER all existing validation)
  console.log('About to call Super Specialty validation...');
  const superSpecialtyErrors = validateSuperSpecialtyCrossColumn(input, maxCats, errors);
  console.log('Super Specialty validation completed, errors:', superSpecialtyErrors);
  Object.assign(errors, superSpecialtyErrors);

  // OCP Ring cross-column validation (runs AFTER all existing validation)
  const ocpRingErrors = validateOCPRingCrossColumn(input, maxCats, errors);
  Object.assign(errors, ocpRingErrors);

  return errors;
}

// Helper for ordinal suffix
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Helper to check if a cat number input is VOID (case-insensitive)
 * @param {string} catNumber - The cat number to check
 * @returns {boolean} True if the input is VOID
 */
function isVoidInput(catNumber: string): boolean {
  return typeof catNumber === 'string' && catNumber.trim().toUpperCase() === 'VOID';
}

/**
 * Validates OCP Ring cross-column relationships for Premiership tab
 * This function runs AFTER all existing validation is complete
 * Only applies to OCP Ring judges (2 columns: Allbreed + OCP with same judge ID)
 */
export function validateOCPRingCrossColumn(input: PremiershipValidationInput, maxCats: number, allExistingErrors: { [key: string]: string } = {}): { [key: string]: string } {
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
  const columnsByJudge: { [judgeId: number]: Array<{ colIdx: number; specialty: string }> } = {};
  
  columns.forEach((col, colIdx) => {
    if (!columnsByJudge[col.judge.id]) {
      columnsByJudge[col.judge.id] = [];
    }
    columnsByJudge[col.judge.id].push({ colIdx, specialty: col.specialty });
  });
  
  // Find OCP Ring judges (2 columns: Allbreed + OCP with same judge ID)
  Object.values(columnsByJudge).forEach(judgeColumns => {
    if (judgeColumns.length === 2) {
      const allbreed = judgeColumns.find(col => col.specialty === 'Allbreed');
      const ocp = judgeColumns.find(col => col.specialty === 'OCP');
      
      if (allbreed && ocp) {
        rings.push({
          allbreedColIdx: allbreed.colIdx,
          ocpColIdx: ocp.colIdx
        });
        console.log('OCP Ring found:', { 
          allbreedColIdx: allbreed.colIdx, 
          ocpColIdx: ocp.colIdx,
          allbreedSpecialty: allbreed.specialty,
          ocpSpecialty: ocp.specialty
        });
      }
    }
  });
  
  return rings;
}

/**
 * Validates title/award consistency between Allbreed and OCP columns
 * Cannot have same cat # labeled GP in AB column and PR in OCP column
 */
function validateOCPTitleConsistency(
  input: PremiershipValidationInput,
  allbreedColIdx: number,
  ocpColIdx: number,
  allExistingErrors: { [key: string]: string } = {},
  currentErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get all cat numbers and their titles from both columns
  const catTitles: { [catNumber: string]: { [column: string]: string } } = {};
  
  // Collect titles from Allbreed column (Show Awards + Finals)
  collectOCPTitlesFromColumn(input, allbreedColIdx, 'Allbreed', catTitles);
  
  // Collect titles from OCP column (Show Awards only)
  collectOCPTitlesFromColumn(input, ocpColIdx, 'OCP', catTitles);
  
  // Check for title inconsistencies
  Object.entries(catTitles).forEach(([catNumber, titles]) => {
    if (titles.Allbreed && titles.OCP && titles.Allbreed !== titles.OCP) {
      // Cannot have same cat # labeled GP in AB column and PR in OCP column
      if ((titles.Allbreed === 'GP' && titles.OCP === 'PR') || 
          (titles.Allbreed === 'PR' && titles.OCP === 'GP')) {
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
  input: PremiershipValidationInput,
  colIdx: number,
  columnType: string,
  catTitles: { [catNumber: string]: { [column: string]: string } }
): void {
  // Collect from Show Awards
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx) {
      const cell = input.showAwards[key];
      if (cell.catNumber && !isVoidInput(cell.catNumber)) {
        if (!catTitles[cell.catNumber]) catTitles[cell.catNumber] = {};
        catTitles[cell.catNumber][columnType] = cell.status;
      }
    }
  });
  
  // Collect from Finals sections (only for Allbreed column)
  if (columnType === 'Allbreed') {
    // AB Premiers Finals
    Object.keys(input.abPremiersFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx) {
        const catNumber = input.abPremiersFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          if (!catTitles[catNumber]) catTitles[catNumber] = {};
          catTitles[catNumber][columnType] = 'PR'; // Finals cats are implicitly PR
        }
      }
    });
    
    // LH Premiers Finals
    Object.keys(input.lhPremiersFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx) {
        const catNumber = input.lhPremiersFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          if (!catTitles[catNumber]) catTitles[catNumber] = {};
          catTitles[catNumber][columnType] = 'PR'; // Finals cats are implicitly PR
        }
      }
    });
    
    // SH Premiers Finals
    Object.keys(input.shPremiersFinals).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx) {
        const catNumber = input.shPremiersFinals[key];
        if (catNumber && !isVoidInput(catNumber)) {
          if (!catTitles[catNumber]) catTitles[catNumber] = {};
          catTitles[catNumber][columnType] = 'PR'; // Finals cats are implicitly PR
        }
      }
    });
  }
}

/**
 * Marks title inconsistency errors for OCP rings
 */
function markOCPTitleInconsistencyErrors(
  input: PremiershipValidationInput,
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
      if (cell.catNumber === catNumber && !isVoidInput(cell.catNumber)) {
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[key] && !currentErrors[key]) {
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
      if (cell.catNumber === catNumber && !isVoidInput(cell.catNumber)) {
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[key] && !currentErrors[key]) {
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
  input: PremiershipValidationInput,
  allbreedColIdx: number,
  ocpColIdx: number,
  titleErrors: { [key: string]: string } = {},
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get ranked cats from Allbreed column (Show Awards + Finals)
  const rankedCats = getOCPRankedCatsFromColumn(input, allbreedColIdx);
  
  console.log('Ranked cats validation (PR) - AB cats:', Array.from(rankedCats));
  
  // Check OCP column for filler cats appearing before ranked cats
  checkOCPRankedCatsPriorityInColumn(input, ocpColIdx, rankedCats, errors, titleErrors, allExistingErrors);
  
  console.log('Ranked cats validation (PR) - Errors found:', errors);
  
  return errors;
}

/**
 * Gets ranked cats from Allbreed column for OCP validation
 * Ranked cats = PR cats in top 10/15 Show Awards or AB PR or LH PR or SH PR
 * Note: GP cats are NOT considered ranked for OCP because they are not eligible for OCP placement
 */
function getOCPRankedCatsFromColumn(input: PremiershipValidationInput, colIdx: number): Set<string> {
  const rankedCats = new Set<string>();
  
  // Collect from Show Awards (Only PR cats in top 10/15 for OCP validation)
  // GP cats are not eligible for OCP placement, so they should not be considered "ranked" for OCP
  console.log(`Getting ranked cats from AB column ${colIdx}:`);
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 10) { // Top 10 for OCP validation
      const cell = input.showAwards[key];
      if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
        console.log(`  Row ${row}: Cat #${cell.catNumber}, status: ${cell.status}`);
        if (cell.status === 'PR') { // Only PR cats are ranked for OCP, not GP
          rankedCats.add(cell.catNumber.trim());
          console.log(`    Added ${cell.catNumber} as ranked cat (PR only)`);
        } else if (cell.status === 'GP') {
          console.log(`    Skipped ${cell.catNumber} - GP cats not eligible for OCP`);
        }
      }
    }
  });
  
  // Collect from Finals sections (AB PR, LH PR, SH PR)
  Object.keys(input.abPremiersFinals).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx) {
      const catNumber = input.abPremiersFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        rankedCats.add(catNumber);
      }
    }
  });
  
  Object.keys(input.lhPremiersFinals).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx) {
      const catNumber = input.lhPremiersFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        rankedCats.add(catNumber);
      }
    }
  });
  
  Object.keys(input.shPremiersFinals).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx) {
      const catNumber = input.shPremiersFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        rankedCats.add(catNumber);
      }
    }
  });
  
  return rankedCats;
}

/**
 * Checks ranked cats priority in OCP column
 */
function checkOCPRankedCatsPriorityInColumn(
  input: PremiershipValidationInput,
  colIdx: number,
  rankedCats: Set<string>,
  errors: { [key: string]: string },
  titleErrors: { [key: string]: string } = {},
  allExistingErrors: { [key: string]: string } = {}
): void {
  console.log('Checking OCP ranked cats priority (PR) for column', colIdx);
  console.log('All ranked cats (PR):', Array.from(rankedCats));
  
  // Collect all placed cats and separate into ranked/filler
  const placedCats: Array<{cat: string, position: number, isRanked: boolean}> = [];
  
  for (let row = 0; row < 10; row++) { // OCP has exactly 10 placements
    const key = `${colIdx}-${row}`;
    const cell = input.showAwards[key];
    
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      // Skip validation for cats that have title inconsistencies  
      if (titleErrors[key]) {
        continue;
      }
      
      const isRanked = rankedCats.has(cell.catNumber);
      placedCats.push({
        cat: cell.catNumber,
        position: row,
        isRanked: isRanked
      });
      
      console.log(`  Position ${row}: Cat ${cell.catNumber}, ranked: ${isRanked}`);
    }
  }
  
  // Check if any filler cats appear before all ranked cats are placed
  const rankedCatsInOCP = placedCats.filter(cat => cat.isRanked);
  const fillerCats = placedCats.filter(cat => !cat.isRanked);
  
  console.log('Ranked cats in OCP:', rankedCatsInOCP.map(c => c.cat));
  console.log('Filler cats in OCP:', fillerCats.map(c => c.cat));
  
  for (const fillerCat of fillerCats) {
    // Find all ranked cats that should be placed but appear after this filler cat
    const unplacedRankedCats = Array.from(rankedCats).filter(rankedCat => {
      const placedRankedCat = rankedCatsInOCP.find(placed => placed.cat === rankedCat);
      return !placedRankedCat || placedRankedCat.position > fillerCat.position;
    });
    
    if (unplacedRankedCats.length > 0) {
      const key = `${colIdx}-${fillerCat.position}`;
      if (unplacedRankedCats.length === Array.from(rankedCats).length) {
        // If ALL ranked cats are unplaced, this filler violates the rule
        console.log(`    Filler cat ${fillerCat.cat} at position ${fillerCat.position} violates rule - ranked cats ${unplacedRankedCats.join(', ')} should be placed first!`);
        // Respect duplicate error precedence - only set if no existing error
        if (!errors[key]) {
          errors[key] = `Filler cat placed before ranked cats: Cat #${fillerCat.cat} is not ranked in Allbreed column but appears in OCP before all ranked cats are placed (${unplacedRankedCats.join(', ')} not placed yet)`;
        }
      }
    } else {
      console.log(`    Filler cat ${fillerCat.cat} at position ${fillerCat.position} is valid - all ranked cats placed before it`);
    }
  }
}

/**
 * Validates order preservation for OCP rings
 * Order of AB PR, LH PR, SH PR in AB column should be respected in OCP ranking
 */
function validateOCPOrderPreservation(
  input: PremiershipValidationInput,
  allbreedColIdx: number,
  ocpColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get ordered cats from Allbreed column sections
  const showAwardsPrOrder = getOrderedPRCatsFromShowAwards(input, allbreedColIdx);
  const abPrOrder = getOrderedABPRCatsFromABPremiersFinals(input, allbreedColIdx);
  const lhPrOrder = getOrderedLHPRCatsFromLHPremiersFinals(input, allbreedColIdx);
  const shPrOrder = getOrderedSHPRCatsFromSHPremiersFinals(input, allbreedColIdx);
  
  // Check order preservation in OCP column (4 sections in sequence like PR tab)
  checkOCPOrderPreservationInColumn(input, ocpColIdx, showAwardsPrOrder, 'Show Awards PR', errors, allExistingErrors);
  checkOCPOrderPreservationInColumn(input, ocpColIdx, abPrOrder, 'AB PR', errors, allExistingErrors);
  checkOCPOrderPreservationInColumn(input, ocpColIdx, lhPrOrder, 'LH PR', errors, allExistingErrors);
  checkOCPOrderPreservationInColumn(input, ocpColIdx, shPrOrder, 'SH PR', errors, allExistingErrors);
  
  return errors;
}

/**
 * Gets ordered cats from finals section
 */
function getOrderedCatsFromFinals(
  input: PremiershipValidationInput,
  colIdx: number,
  finalsSection: 'abPremiersFinals' | 'lhPremiersFinals' | 'shPremiersFinals'
): string[] {
  const orderedCats: string[] = [];
  const finals = input[finalsSection];
  
  Object.keys(finals).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx) {
      const catNumber = finals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        orderedCats[row] = catNumber;
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}

/**
 * Checks order preservation in OCP column
 * ENHANCED: Now enforces that AB PR cats must appear first in exact order
 * ENHANCED: LH PR and SH PR allow fillers but preserve order
 * ENHANCED: Show Awards PR uses order preservation logic
 */
function checkOCPOrderPreservationInColumn(
  input: PremiershipValidationInput,
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
  
  // SIMPLIFIED VALIDATION: Direct side-by-side comparison for AB PR cats
  if (hairLength === 'AB PR') {
    // Compare AB PR cats with OCP cats position by position
    for (let i = 0; i < Math.min(specialtyOrder.length, ocpCats.length); i++) {
      const abPRCat = specialtyOrder[i];
      const ocpCat = ocpCats[i];
      
      // If OCP position has a cat but it doesn't match the AB PR cat for this position
      if (ocpCat && abPRCat && ocpCat !== abPRCat) {
        const errorKey = `${colIdx}-${i}`;
        // Skip if there's already an error (duplicate, title, etc.) - respect validation precedence
        if (!allExistingErrors[errorKey] && !errors[errorKey]) {
          errors[errorKey] = `Order violation: ${ocpCat} is out of order in OCP. Must preserve order from AB PR column`;
        }
      }
    }
  } else if (hairLength === 'LH PR' || hairLength === 'SH PR') {
    // For LH PR and SH PR sections, use order preservation logic with fillers allowed
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
    // For Show Awards PR section, use order preservation logic
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
 * Validates Super Specialty cross-column relationships for Premiership tab
 * This function runs AFTER all existing validation is complete
 * Only applies to Super Specialty rings (3 columns with same judge ID)
 */
export function validateSuperSpecialtyCrossColumn(input: PremiershipValidationInput, maxCats: number, allExistingErrors: { [key: string]: string } = {}): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Only run for Super Specialty rings
  const superSpecialtyRings = findSuperSpecialtyRings(input.columns);
  
  // Debug logging to see if Super Specialty rings are detected
  console.log('Super Specialty validation - Input columns:', input.columns);
  console.log('Super Specialty validation - Found rings:', superSpecialtyRings);
  
  for (const ringInfo of superSpecialtyRings) {
    const { longhairColIdx, shorthairColIdx, allbreedColIdx } = ringInfo;
    
    console.log('Processing Super Specialty ring:', { longhairColIdx, shorthairColIdx, allbreedColIdx });
    
    // 1. Title/Award Consistency Validation (respect existing errors)
    const titleErrors = validateTitleConsistency(input, longhairColIdx, shorthairColIdx, allbreedColIdx, allExistingErrors, {});
    Object.assign(errors, titleErrors);
    
    // 2. Ranked Cats Priority Validation (pass existing errors to respect validation precedence)
    const priorityErrors = validateRankedCatsPriority(input, longhairColIdx, shorthairColIdx, allbreedColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, priorityErrors);
    
    // 3. Order Preservation Within Hair Length Validation (pass existing errors to respect validation precedence)
    const orderErrors = validateOrderPreservation(input, longhairColIdx, shorthairColIdx, allbreedColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, orderErrors);
    
    // 4. Specialty Finals Consistency Validation (pass existing errors to respect validation precedence)
    const finalsErrors = validateSpecialtyFinalsConsistency(input, longhairColIdx, shorthairColIdx, allbreedColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, finalsErrors);
    
    // 5. Cross-Column Duplicate Prevention Validation (pass existing errors to respect validation precedence)
    const duplicateErrors = validateCrossColumnDuplicates(input, longhairColIdx, shorthairColIdx, allbreedColIdx, { ...allExistingErrors, ...errors });
    Object.assign(errors, duplicateErrors);
  }
  
  return errors;
}

/**
 * Finds Super Specialty rings (3 columns with same judge ID)
 */
function findSuperSpecialtyRings(columns: { judge: Judge; specialty: string }[]): Array<{
  longhairColIdx: number;
  shorthairColIdx: number;
  allbreedColIdx: number;
}> {
  const rings: Array<{
    longhairColIdx: number;
    shorthairColIdx: number;
    allbreedColIdx: number;
  }> = [];
  
  console.log('findSuperSpecialtyRings (PR) called with columns:', columns);
  
  // Group columns by judge ID
  const columnsByJudge: { [judgeId: number]: Array<{ colIdx: number; specialty: string }> } = {};
  
  columns.forEach((col, colIdx) => {
    console.log(`Column ${colIdx}:`, { judgeId: col.judge.id, specialty: col.specialty, judgeName: col.judge.name });
    if (!columnsByJudge[col.judge.id]) {
      columnsByJudge[col.judge.id] = [];
    }
    columnsByJudge[col.judge.id].push({ colIdx, specialty: col.specialty });
  });
  
  console.log('Columns grouped by judge ID (PR):', columnsByJudge);
  
  // Find Super Specialty rings (3 columns with same judge ID)
  Object.entries(columnsByJudge).forEach(([judgeId, judgeColumns]) => {
    console.log(`Checking judge ID ${judgeId} with ${judgeColumns.length} columns:`, judgeColumns);
    if (judgeColumns.length === 3) {
      const longhair = judgeColumns.find(col => col.specialty === 'Longhair');
      const shorthair = judgeColumns.find(col => col.specialty === 'Shorthair');
      const allbreed = judgeColumns.find(col => col.specialty === 'Allbreed');
      
      console.log(`Judge ${judgeId} has 3 columns:`, { longhair, shorthair, allbreed });
      
      if (longhair && shorthair && allbreed) {
        rings.push({
          longhairColIdx: longhair.colIdx,
          shorthairColIdx: shorthair.colIdx,
          allbreedColIdx: allbreed.colIdx
        });
        console.log('Super Specialty ring found (PR):', { longhairColIdx: longhair.colIdx, shorthairColIdx: shorthair.colIdx, allbreedColIdx: allbreed.colIdx });
      } else {
        console.log(`Judge ${judgeId} missing required specialties:`, { 
          hasLonghair: !!longhair, 
          hasShorthair: !!shorthair, 
          hasAllbreed: !!allbreed 
        });
      }
    } else {
      console.log(`Judge ${judgeId} has ${judgeColumns.length} columns (not 3)`);
    }
  });
  
  console.log('findSuperSpecialtyRings (PR) returning rings:', rings);
  return rings;
}

/**
 * Validates title/award consistency across Super Specialty columns
 */
function validateTitleConsistency(
  input: PremiershipValidationInput,
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
  collectTitlesFromColumn(input, longhairColIdx, 'Longhair', catTitles);
  
  // Collect titles from Shorthair column
  collectTitlesFromColumn(input, shorthairColIdx, 'Shorthair', catTitles);
  
  // Collect titles from Allbreed column
  collectTitlesFromColumn(input, allbreedColIdx, 'Allbreed', catTitles);
  
  // Check for title inconsistencies
  Object.entries(catTitles).forEach(([catNumber, titles]) => {
    const uniqueTitles = Array.from(new Set(Object.values(titles)));
    if (uniqueTitles.length > 1) {
      // Find all cells with this cat number and mark them with error
      markTitleInconsistencyErrors(input, catNumber, longhairColIdx, shorthairColIdx, allbreedColIdx, errors, allExistingErrors, currentErrors);
    }
  });
  
  return errors;
}

/**
 * Collects titles for a specific cat number from a column
 */
function collectTitlesFromColumn(
  input: PremiershipValidationInput,
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
  
  // Check Finals sections
  const finalsSections = [
    { data: input.abPremiersFinals, prefix: 'abPremiersFinals', implicitTitle: 'PR', sectionName: 'Best AB PR' },
    { data: input.lhPremiersFinals, prefix: 'lhPremiersFinals', implicitTitle: 'PR', sectionName: 'Best LH PR' },
    { data: input.shPremiersFinals, prefix: 'shPremiersFinals', implicitTitle: 'PR', sectionName: 'Best SH PR' }
  ];
  
  finalsSections.forEach(section => {
    for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const catNumber = section.data[key];
      if (catNumber && !isVoidInput(catNumber)) {
        const trimmedCatNumber = catNumber.trim();
        if (!catTitles[trimmedCatNumber]) catTitles[trimmedCatNumber] = {};
        catTitles[trimmedCatNumber][columnType] = section.implicitTitle; // Implicit title based on section
      }
    }
  });
}

/**
 * Marks title inconsistency errors for all cells containing the inconsistent cat
 */
function markTitleInconsistencyErrors(
  input: PremiershipValidationInput,
  catNumber: string,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  errors: { [key: string]: string },
  allExistingErrors: { [key: string]: string } = {},
  currentErrors: { [key: string]: string } = {}
): void {
  const columns = [longhairColIdx, shorthairColIdx, allbreedColIdx];
  
  columns.forEach(colIdx => {
    // Check Show Awards section
    for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
      const key = `${colIdx}-${rowIdx}`;
      const cell = input.showAwards[key];
      if (cell && cell.catNumber && cell.catNumber.trim() === catNumber) {
        // Respect duplicate error precedence - only set if no existing error
        if (!allExistingErrors[key] && !currentErrors[key]) {
          errors[key] = `Title inconsistency: Cat #${catNumber} has different titles across Super Specialty columns`;
        }
      }
    }
    
    // Check Finals sections
    const finalsSections = [
      { data: input.abPremiersFinals, prefix: 'abPremiersFinals', sectionName: 'Best AB PR' },
      { data: input.lhPremiersFinals, prefix: 'lhPremiersFinals', sectionName: 'Best LH PR' },
      { data: input.shPremiersFinals, prefix: 'shPremiersFinals', sectionName: 'Best SH PR' }
    ];
    
    finalsSections.forEach(section => {
      for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
        const key = `${colIdx}-${rowIdx}`;
        const finalsKey = `${section.prefix}-${colIdx}-${rowIdx}`;
        const finalsCatNumber = section.data[key];
        if (finalsCatNumber && finalsCatNumber.trim() === catNumber) {
          // Respect duplicate error precedence - only set if no existing error
          if (!allExistingErrors[finalsKey] && !currentErrors[finalsKey]) {
            errors[finalsKey] = `Title inconsistency: Cat #${catNumber} is implicitly PR in ${section.sectionName} but has different title in other columns`;
          }
        }
      }
    });
  });
}

/**
 * Validates ranked cats priority (filler cats cannot be placed before ranked cats)
 */
function validateRankedCatsPriority(
  input: PremiershipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Get ranked cats from specialty columns
  const longhairRankedCats = getRankedCatsFromColumn(input, longhairColIdx);
  const shorthairRankedCats = getRankedCatsFromColumn(input, shorthairColIdx);
  
  console.log('Ranked cats validation - LH cats:', Array.from(longhairRankedCats));
  console.log('Ranked cats validation - SH cats:', Array.from(shorthairRankedCats));
  
  // Check Allbreed column for violations
  checkRankedCatsPriorityInColumn(input, allbreedColIdx, longhairRankedCats, shorthairRankedCats, errors);
  
  console.log('Ranked cats validation - Errors found:', errors);
  
  return errors;
}

/**
 * Gets ranked cats from a column (cats that appear in Show Awards)
 */
function getRankedCatsFromColumn(input: PremiershipValidationInput, colIdx: number): Set<string> {
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
function checkRankedCatsPriorityInColumn(
  input: PremiershipValidationInput,
  colIdx: number,
  longhairRankedCats: Set<string>,
  shorthairRankedCats: Set<string>,
  errors: { [key: string]: string }
): void {
  const allRankedCats = new Set(Array.from(longhairRankedCats).concat(Array.from(shorthairRankedCats)));
  
  console.log('Checking ranked cats priority for column', colIdx);
  console.log('All ranked cats:', Array.from(allRankedCats));
  
  // Check each position in the Allbreed column
  console.log(`Checking Allbreed column ${colIdx} for cats:`);
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${colIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      console.log(`  Row ${rowIdx}: Cat #${catNumber}, is ranked: ${allRankedCats.has(catNumber)}`);
      
      // If this is a filler cat (not ranked in specialty columns)
      if (!allRankedCats.has(catNumber)) {
        console.log(`  Found filler cat ${catNumber} at position ${rowIdx}`);
        
        // Check if there are any ranked cats that should be placed before this position
        // by looking at the ranked cats list and checking if any should come before this position
        const rankedCatsArray = Array.from(allRankedCats);
        if (rankedCatsArray.length > 0) {
          console.log(`    There are ${rankedCatsArray.length} ranked cats that should be placed first: ${rankedCatsArray.join(', ')}`);
          console.log(`    Filler cat ${catNumber} at position ${rowIdx} violates the rule - ranked cats should come first!`);
          errors[key] = `Filler cat placed before ranked cats: Cat #${catNumber} is not ranked in specialty columns but appears in Allbreed before ranked cats`;
        }
      }
    }
  }
}

/**
 * Validates order preservation within hair length categories
 */
function validateOrderPreservation(
  input: PremiershipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Validate Longhair order preservation
  validateHairLengthOrderPreservation(input, longhairColIdx, allbreedColIdx, 'Longhair', errors);
  
  // Validate Shorthair order preservation
  validateHairLengthOrderPreservation(input, shorthairColIdx, allbreedColIdx, 'Shorthair', errors);
  
  return errors;
}

/**
 * Validates order preservation for a specific hair length
 */
function validateHairLengthOrderPreservation(
  input: PremiershipValidationInput,
  specialtyColIdx: number,
  allbreedColIdx: number,
  hairLength: string,
  errors: { [key: string]: string }
): void {
  // Get ordered cats from specialty column
  const specialtyOrder = getOrderedCatsFromColumn(input, specialtyColIdx);
  
  // Check order preservation in Allbreed column
  checkOrderPreservationInAllbreed(input, allbreedColIdx, specialtyOrder, hairLength, errors);
}

/**
 * Gets ordered cats from a column
 */
function getOrderedCatsFromColumn(input: PremiershipValidationInput, colIdx: number): string[] {
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
function checkOrderPreservationInAllbreed(
  input: PremiershipValidationInput,
  colIdx: number,
  specialtyOrder: string[],
  hairLength: string,
  errors: { [key: string]: string }
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
        errors[key] = `Order violation: ${allbreedCat} is out of order in Allbreed. Must preserve order from ${hairLength} column`;
      }
      specialtyIndex++;
    }
  }
}

/**
 * Validates that cats ranked in specialty columns appear in Allbreed column with same titles
 * Rule: Best LH PR cats from Longhair column must appear in Best LH PR positions in Allbreed column
 * Rule: Best SH PR cats from Shorthair column must appear in Best SH PR positions in Allbreed column
 */
function validateSpecialtyFinalsConsistency(
  input: PremiershipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Validate Longhair finals consistency (LH PR section to LH PR section)
  validateHairLengthFinalsConsistency(input, longhairColIdx, allbreedColIdx, 'Longhair', 'lhPremiersFinals', errors);
  
  // Validate Shorthair finals consistency (SH PR section to SH PR section)
  validateHairLengthFinalsConsistency(input, shorthairColIdx, allbreedColIdx, 'Shorthair', 'shPremiersFinals', errors);
  
  return errors;
}

/**
 * Validates finals consistency for a specific hair length
 */
function validateHairLengthFinalsConsistency(
  input: PremiershipValidationInput,
  specialtyColIdx: number,
  allbreedColIdx: number,
  hairLength: string,
  finalsSection: 'lhPremiersFinals' | 'shPremiersFinals',
  errors: { [key: string]: string }
): void {
  // Check each position individually (0, 1, 2, 3, 4, etc.)
  for (let pos = 0; pos < 15; pos++) {
    const specialtyKey = `${specialtyColIdx}-${pos}`;
    const allbreedKey = `${allbreedColIdx}-${pos}`;
    
    const specialtyCat = input[finalsSection][specialtyKey];
    const allbreedCat = input[finalsSection][allbreedKey];
    
    // If specialty column has a cat at this position
    if (specialtyCat && !isVoidInput(specialtyCat)) {
      const specialtyCatNumber = specialtyCat.trim();
      
      // If Allbreed column has a different cat at this position (or no cat)
      if (!allbreedCat || isVoidInput(allbreedCat) || allbreedCat.trim() !== specialtyCatNumber) {
        // Show error at this specific position
        const sectionName = finalsSection === 'lhPremiersFinals' ? 'lhPremiersFinals' : 'shPremiersFinals';
        const errorKey = `${sectionName}-${allbreedColIdx}-${pos}`;
        
        console.log(`Missing ${hairLength} finals cat ${specialtyCatNumber} at position ${pos} in Allbreed column ${finalsSection} section`);
        errors[errorKey] = `Missing ${hairLength} finals cat: Cat #${specialtyCatNumber} from ${hairLength} column should appear as ${pos === 0 ? 'Best' : pos === 1 ? '2nd Best' : pos === 2 ? '3rd Best' : `${pos + 1}th Best`} ${hairLength === 'Longhair' ? 'LH' : 'SH'} PR`;
      }
    }
  }
}

/**
 * Validates that a cat number cannot appear in both Longhair and Shorthair columns
 * Rule: A cat number cannot be both longhair and shorthair in the same Super Specialty ring
 */
function validateCrossColumnDuplicates(
  input: PremiershipValidationInput,
  longhairColIdx: number,
  shorthairColIdx: number,
  allbreedColIdx: number,
  allExistingErrors: { [key: string]: string } = {}
): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  console.log('validateCrossColumnDuplicates (PR) called for ring:', { longhairColIdx, shorthairColIdx, allbreedColIdx });
  
  // Collect cats from Longhair column
  const lhCats: Set<string> = new Set();
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${longhairColIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      lhCats.add(catNumber);
      console.log(`LH cat collected: ${catNumber} at position ${rowIdx}`);
    }
  }
  
  console.log('LH cats collected (PR):', Array.from(lhCats));
  
  // Check if any LH cats appear in SH column
  for (let rowIdx = 0; rowIdx < 15; rowIdx++) {
    const key = `${shorthairColIdx}-${rowIdx}`;
    const cell = input.showAwards[key];
    if (cell && cell.catNumber && !isVoidInput(cell.catNumber)) {
      const catNumber = cell.catNumber.trim();
      
      if (lhCats.has(catNumber)) {
        console.log(`Duplicate found (PR): Cat #${catNumber} appears in both LH and SH columns`);
        
        // Mark error in SH column
        errors[key] = `Duplicate: Cat #${catNumber} cannot be both longhair and shorthair`;
        
        // Mark error in LH column (find the position)
        for (let lhRowIdx = 0; lhRowIdx < 15; lhRowIdx++) {
          const lhKey = `${longhairColIdx}-${lhRowIdx}`;
          const lhCell = input.showAwards[lhKey];
          if (lhCell && lhCell.catNumber && lhCell.catNumber.trim() === catNumber) {
            errors[lhKey] = `Duplicate: Cat #${catNumber} cannot be both longhair and shorthair`;
            break;
          }
        }
      }
    }
  }
  
  console.log('Cross-column duplicate validation (PR) errors:', errors);
  return errors;
}

/**
 * Gets ordered PR cats from Show Awards for a column (for PR cats in Top 10/15)
 */
function getOrderedPRCatsFromShowAwards(
  input: PremiershipValidationInput,
  colIdx: number
): string[] {
  const orderedCats: string[] = [];
  
  Object.keys(input.showAwards).forEach(key => {
    const [col, row] = key.split('-').map(Number);
    if (col === colIdx && row < 10) { // Top 10 for OCP validation
      const cell = input.showAwards[key];
      if (cell.catNumber && cell.status === 'PR' && !isVoidInput(cell.catNumber)) {
        orderedCats[row] = cell.catNumber.trim();
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}

/**
 * Gets ordered AB PR cats from AB Premiers Finals for a column
 */
function getOrderedABPRCatsFromABPremiersFinals(
  input: PremiershipValidationInput,
  colIdx: number
): string[] {
  const orderedCats: string[] = [];
  
  // AB PR cats are stored in abPremiersFinals with keys like "0-0", "0-1", "0-2" etc.
  // where the first number is column index and second is position (0=Best, 1=2nd Best, 2=3rd Best)
  Object.keys(input.abPremiersFinals).forEach(key => {
    const [col, pos] = key.split('-').map(Number);
    if (col === colIdx && pos < 10) { // Top 10 for OCP validation
      const catNumber = input.abPremiersFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        orderedCats[pos] = catNumber.trim();
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}

/**
 * Gets ordered LH PR cats from LH Premiers Finals for a column
 */
function getOrderedLHPRCatsFromLHPremiersFinals(
  input: PremiershipValidationInput,
  colIdx: number
): string[] {
  const orderedCats: string[] = [];
  
  // LH PR cats are stored in lhPremiersFinals with keys like "0-0", "0-1", "0-2" etc.
  // where the first number is column index and second is position (0=Best, 1=2nd Best, 2=3rd Best)
  Object.keys(input.lhPremiersFinals).forEach(key => {
    const [col, pos] = key.split('-').map(Number);
    if (col === colIdx && pos < 10) { // Top 10 for OCP validation
      const catNumber = input.lhPremiersFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        orderedCats[pos] = catNumber.trim();
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}

/**
 * Gets ordered SH PR cats from SH Premiers Finals for a column
 */
function getOrderedSHPRCatsFromSHPremiersFinals(
  input: PremiershipValidationInput,
  colIdx: number
): string[] {
  const orderedCats: string[] = [];
  
  // SH PR cats are stored in shPremiersFinals with keys like "0-0", "0-1", "0-2" etc.
  // where the first number is column index and second is position (0=Best, 1=2nd Best, 2=3rd Best)
  Object.keys(input.shPremiersFinals).forEach(key => {
    const [col, pos] = key.split('-').map(Number);
    if (col === colIdx && pos < 10) { // Top 10 for OCP validation
      const catNumber = input.shPremiersFinals[key];
      if (catNumber && !isVoidInput(catNumber)) {
        orderedCats[pos] = catNumber.trim();
      }
    }
  });
  
  return orderedCats.filter(cat => cat); // Remove empty slots
}