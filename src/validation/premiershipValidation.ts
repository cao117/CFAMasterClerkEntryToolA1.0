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
 * Helper to get the list of PR cats from Top 10/15 (Show Awards) for a column, in order
 */
function getTop15PRCats(input: PremiershipValidationInput, columnIndex: number): string[] {
  const { showAwards } = input;
  const prCats: string[] = [];
  for (let position = 0; position < 15; position++) {
    const key = `${columnIndex}-${position}`;
    const award = showAwards[key];
    if (award && award.status === 'PR' && award.catNumber && award.catNumber.trim() !== '') {
      prCats.push(award.catNumber.trim());
    }
  }
  return prCats;
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
export function validatePremiershipTab(input: PremiershipValidationInput): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
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
        if (value && value.trim()) catNumbers[pos] = value.trim();
      }
      // 1. Range error: assign first
      for (let pos = 0; pos < numPositions; pos++) {
        const errorKey = `${section.prefix}-${colIdx}-${pos}`;
        const value = finals ? finals[`${colIdx}-${pos}`] : '';
        if (value && value.trim() && !validateCatNumber(value)) {
          errors[errorKey] = 'Cat number must be between 1-450.';
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
              errors[errorKey] = 'Cat number must be between 1-450. Duplicate: This cat is already placed in another finals position.';
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
            if (otherValue && otherValue.trim() === cat) {
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
          if (showAward && showAward.catNumber && showAward.catNumber.trim() === cat) {
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
          if (!prevValue || prevValue.trim() === '') {
            sequentialError = true;
            break;
          }
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
          } else if (section.prefix === 'lhPremiersFinals' || section.prefix === 'shPremiersFinals') {
            orderError = validateBestHairPROrder(input, section.prefix as any, colIdx, Number(pos), cat);
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
            if (lhFinals && lhFinals[`${colIdx}-${j}`] && lhFinals[`${colIdx}-${j}`].trim() === cat) {
              foundInLH = true;
              break;
            }
          }
          for (let j = 0; j < numPositions; j++) {
            if (shFinals && shFinals[`${colIdx}-${j}`] && shFinals[`${colIdx}-${j}`].trim() === cat) {
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
    const breakpoint = getPremiershipCountForRingType(input, column.specialty) >= 50 ? 15 : 10;
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
    // 1. Range error: assign first
    for (let pos = 0; pos < breakpoint; pos++) {
      const key = `${colIdx}-${pos}`;
      const award = input.showAwards[key];
      if (award && award.catNumber && award.catNumber.trim() !== '' && !validateCatNumber(award.catNumber)) {
        errors[key] = 'Cat number must be between 1-450.';
      }
    }
    // 2. Duplicate error: merge with range if both
    Object.entries(catNumToPositions).forEach(([, positions]) => {
      if (positions.length > 1) {
        positions.forEach(pos => {
          const key = `${colIdx}-${pos}`;
          if (errors[key]) {
            errors[key] = 'Cat number must be between 1-450. Duplicate: This cat is already placed in another position.';
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
      if (award && award.catNumber && award.catNumber.trim() !== '') {
        if (errors[key]) continue; // skip if range or duplicate error present
        if (!validateSequentialEntry(input, 'showAwards', colIdx, pos, award.catNumber)) {
          errors[key] = 'You must fill previous placements before entering this position.';
        }
      }
    }
  }
  return errors;
}

// Helper for ordinal suffix
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ... (add any additional helper functions as needed for full parity with championshipValidation.ts)
// ... (add any additional helper functions as needed for full parity with championshipValidation.ts)