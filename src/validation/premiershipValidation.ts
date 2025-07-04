/**
 * @file premiershipValidation.ts
 * @description Premiership tab validation logic. All key generation and lookups use hyphens (e.g., '0-1'), never underscores, per .cursor/rules/naming-conventions.mdc.
 * This is CRITICAL for validation and CSV export compatibility.
 *
 * Logic mirrors championshipValidation.ts, but for PR/GP/NOV, with strict error precedence and all rules as clarified by user and docs.
 *
 * NOTE: All debug logging should use the project's Winston logger module (see src/utils/logger.ts or equivalent).
 * Add `logger.debug(...)` calls at all critical validation and error-merging points.
 */

// Placeholder: import { logger } from '../utils/logger';

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
export function getFinalsPositionsForRingType(input: PremiershipValidationInput, ringType: string): number {
  const count = getPremiershipCountForRingType(input, ringType);
  return count >= 50 ? 3 : 2; // 3 positions if 15 awards, 2 if 10 awards
}

/**
 * Helper function to get the premiership count for a given ring type (AB/LH/SH)
 * @param input PremiershipValidationInput
 * @param ringType string
 * @returns number
 */
export function getPremiershipCountForRingType(input: PremiershipValidationInput, ringType: string): number {
  const { premiershipTotal, premiershipCounts } = input;
  switch (ringType) {
    case 'Allbreed':
      return premiershipTotal;
    case 'Longhair':
      return premiershipCounts.lhPrs;
    case 'Shorthair':
      return premiershipCounts.shPrs;
    default:
      return premiershipTotal;
  }
}

/**
 * Helper function to get the breakpoint for a given ring type (AB/LH/SH)
 * Returns 15 if count >= 50, otherwise 10
 * @param input PremiershipValidationInput
 * @param ringType string
 * @returns number (15 or 10)
 */
export function getBreakpointForRingType(input: PremiershipValidationInput, ringType: string): number {
  const count = getPremiershipCountForRingType(input, ringType);
  return count >= 50 ? 15 : 10;
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
 * Main validation function for the Premiership tab.
 * Enforces strict error precedence: duplicate > status > sequential > assignment reminder.
 * All error keys are section-prefixed and use hyphens.
 * Mirrors validateChampionshipTab from championshipValidation.ts.
 * @param input PremiershipValidationInput
 * @returns { [key: string]: string } Error object keyed by section-prefixed cell keys
 */
export function validatePremiershipTab(input: PremiershipValidationInput): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  // Finals sections to validate
  const finalsSections = [
    { key: 'abPremiersFinals', prefix: 'abPremiersFinals', checkDuplicate: checkDuplicateCatNumbersInABPremiersFinals },
    { key: 'lhPremiersFinals', prefix: 'lhPremiersFinals', checkDuplicate: checkDuplicateCatNumbersInLHPremiersFinals },
    { key: 'shPremiersFinals', prefix: 'shPremiersFinals', checkDuplicate: checkDuplicateCatNumbersInSHPremiersFinals },
  ];
  // 1. Duplicate detection for all finals sections (highest precedence)
  for (const section of finalsSections) {
    for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
      const finals = (input as any)[section.key] as { [key: string]: string };
      const catNumbers: { [pos: number]: string } = {};
      const column = input.columns[colIdx];
      const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
      for (let pos = 0; pos < numPositions; pos++) {
        const dataKey = `${colIdx}-${pos}`;
        const value = finals ? finals[dataKey] : '';
        if (value && value.trim()) catNumbers[pos] = value.trim();
      }
      // Find duplicates
      const seen: { [cat: string]: number[] } = {};
      Object.entries(catNumbers).forEach(([pos, cat]) => {
        if (!seen[cat]) seen[cat] = [];
        seen[cat].push(Number(pos));
      });
      Object.entries(seen).forEach(([, positions]) => {
        if (positions.length > 1) {
          positions.forEach(pos => {
            const errorKey = `${section.prefix}-${colIdx}-${pos}`;
            errors[errorKey] = 'Duplicate cat number within this section of the final';
            // logger.debug(`[VALIDATION] Duplicate error set for ${errorKey}`);
          });
        }
      });
    }
  }
  // 2. Status, sequential, and assignment reminder errors (only if no duplicate error present)
  for (const section of finalsSections) {
    for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
      const finals = (input as any)[section.key] as { [key: string]: string };
      const column = input.columns[colIdx];
      const numPositions = column ? getFinalsPositionsForRingType(input, column.specialty) : 3;
      for (let pos = 0; pos < numPositions; pos++) {
        const dataKey = `${colIdx}-${pos}`;
        const errorKey = `${section.prefix}-${colIdx}-${pos}`;
        const value = finals ? finals[dataKey] : '';
        if (!value || !value.trim()) continue;
        if (errors[errorKey]) continue; // Skip if duplicate, status, or sequential error present
        // Status error: Only PR eligible for finals (no GP/NOV)
        let status: string | undefined = undefined;
        for (let i = 0; i < 15; i++) {
          const showAward = input.showAwards[`${colIdx}-${i}`];
          if (showAward && showAward.catNumber && showAward.catNumber.trim() === value.trim()) {
            status = showAward.status;
            break;
          }
        }
        if (status && status !== 'PR') {
          errors[errorKey] = `${value.trim()} is listed as a ${status} in Show Awards and cannot be awarded PR final.`;
          continue;
        }
        // Sequential error: must fill previous positions first
        if (!validateSequentialEntry(input, section.prefix.replace('Finals','') as any, colIdx, pos, value)) {
          errors[errorKey] = 'You must fill previous placements before entering this position.';
          continue;
        }
        // --- Assignment reminder logic for Best AB PR (Allbreed only) ---
        /**
         * If this is an Allbreed column and section is abPremiersFinals,
         * and this PR cat does not appear in any LH or SH PR input for this column,
         * set a reminder error on this cell.
         */
        if (section.prefix === 'abPremiersFinals' && column.specialty === 'Allbreed') {
          let foundInLH = false;
          let foundInSH = false;
          const lhFinals = (input as any)['lhPremiersFinals'] as { [key: string]: string };
          const shFinals = (input as any)['shPremiersFinals'] as { [key: string]: string };
          for (let j = 0; j < numPositions; j++) {
            if (lhFinals && lhFinals[`${colIdx}-${j}`] && lhFinals[`${colIdx}-${j}`].trim() === value.trim()) {
              foundInLH = true;
              break;
            }
          }
          for (let j = 0; j < numPositions; j++) {
            if (shFinals && shFinals[`${colIdx}-${j}`] && shFinals[`${colIdx}-${j}`].trim() === value.trim()) {
              foundInSH = true;
              break;
            }
          }
          if (!foundInLH && !foundInSH) {
            errors[errorKey] = `${value.trim()} needs to be assigned to either LH or SH PR final.`;
            // logger.debug(`[VALIDATION] Assignment reminder set for ${errorKey}`);
          }
        }
        // ... (other lowest-precedence logic if needed)
      }
    }
  }
  // 3. Show Awards section (Top 15) validation
  for (let colIdx = 0; colIdx < input.columns.length; colIdx++) {
    const column = input.columns[colIdx];
    const breakpoint = getPremiershipCountForRingType(input, column.specialty) >= 50 ? 15 : 10;
    // --- Duplicate error logic: assign to all involved cells ---
    /**
     * Build a map of cat numbers to all positions where they appear in this column.
     * If a cat number appears more than once, assign the duplicate error to all those positions.
     */
    const catNumToPositions: { [cat: string]: number[] } = {};
    for (let pos = 0; pos < breakpoint; pos++) {
      const key = `${colIdx}-${pos}`;
      const award = input.showAwards[key];
      if (award && award.catNumber && award.catNumber.trim() !== '') {
        const cat = award.catNumber.trim();
        if (!catNumToPositions[cat]) catNumToPositions[cat] = [];
        catNumToPositions[cat].push(pos);
      }
    }
    Object.entries(catNumToPositions).forEach(([, positions]) => {
      if (positions.length > 1) {
        positions.forEach(pos => {
          const key = `${colIdx}-${pos}`;
          errors[key] = 'Duplicate cat number within this section of the final';
        });
      }
    });
    // --- Other error checks (only if no duplicate error present) ---
    for (let pos = 0; pos < breakpoint; pos++) {
      const key = `${colIdx}-${pos}`;
      const award = input.showAwards[key];
      if (award && award.catNumber && award.catNumber.trim() !== '') {
        if (errors[key]) continue; // Never overwrite duplicate error
        if (!validateCatNumber(award.catNumber)) {
          errors[key] = 'Cat number must be between 1-450';
          continue;
        }
        if (!validateSequentialEntry(input, 'showAwards', colIdx, pos, award.catNumber)) {
          errors[key] = 'You must fill previous placements before entering this position.';
          continue;
        }
      }
    }
  }
  // logger.debug('[VALIDATION] PremiershipTab errors:', errors);
  return errors;
}

// ... (add any additional helper functions as needed for full parity with championshipValidation.ts)