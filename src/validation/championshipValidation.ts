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
  isVoided?: boolean; // New field for VOID functionality
}

export interface ChampionshipValidationInput {
  columns: { judge: Judge; specialty: string }[];
  showAwards: { [key: string]: CellData };
  championsFinals: { [key: string]: { catNumber: string; isVoided?: boolean } };
  lhChampionsFinals: { [key: string]: { catNumber: string; isVoided?: boolean } };
  shChampionsFinals: { [key: string]: { catNumber: string; isVoided?: boolean } };
  championshipTotal: number;
}

/**
 * Validates if a cat number is in the correct format (1-450 or "VOID")
 */
export function validateCatNumber(value: string): boolean {
  if (!value || value.trim() === '') return true;
  
  if (value.trim().toUpperCase() === 'VOID') return true;
  
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
  
  if (!newValue || newValue.trim() === '' || newValue.trim().toUpperCase() === 'VOID') {
    return false; // Empty values and VOID don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  
  // Collect all cat numbers from show awards in this column only
  for (let position = 0; position < 15; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && showAwards[key]?.catNumber) {
      const catNum = showAwards[key].catNumber.trim();
      if (catNum && catNum.toUpperCase() !== 'VOID') {
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
  const { championsFinals, championshipTotal } = input;
  
  if (!newValue || newValue.trim() === '' || newValue.trim().toUpperCase() === 'VOID') {
    return false; // Empty values and VOID don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Collect all cat numbers from champions finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && championsFinals[key]) {
      const catNum = championsFinals[key].catNumber.trim();
      if (catNum && catNum.toUpperCase() !== 'VOID') {
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
  const { lhChampionsFinals, championshipTotal } = input;
  
  if (!newValue || newValue.trim() === '' || newValue.trim().toUpperCase() === 'VOID') {
    return false; // Empty values and VOID don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Collect all cat numbers from longhair champions finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && lhChampionsFinals[key]) {
      const catNum = lhChampionsFinals[key].catNumber.trim();
      if (catNum && catNum.toUpperCase() !== 'VOID') {
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
  const { shChampionsFinals, championshipTotal } = input;
  
  if (!newValue || newValue.trim() === '' || newValue.trim().toUpperCase() === 'VOID') {
    return false; // Empty values and VOID don't count as duplicates
  }
  
  const trimmedValue = newValue.trim();
  const valuesInSection = new Set<string>();
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Collect all cat numbers from shorthair champions finals in this column only
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    if (key !== excludeKey && shChampionsFinals[key]) {
      const catNum = shChampionsFinals[key].catNumber.trim();
      if (catNum && catNum.toUpperCase() !== 'VOID') {
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
    if (award && award.status === 'CH' && award.catNumber && 
        award.catNumber.trim() !== '' && 
        award.catNumber.trim().toUpperCase() !== 'VOID') {
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
    if (award && award.catNumber && award.catNumber.trim() !== '' && 
        award.catNumber.trim().toUpperCase() !== 'VOID') {
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
      if (award && award.status === 'CH' && award.catNumber && 
          award.catNumber.trim() !== '' && 
          award.catNumber.trim().toUpperCase() !== 'VOID') {
        allCHs.add(award.catNumber.trim());
      }
    }
    requiredBestCH = Array.from(allCHs).slice(0, numPositions);
  }

  // Validate Best AB CH
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const finalsEntry = championsFinals[key];
    if (!finalsEntry || !finalsEntry.catNumber || finalsEntry.catNumber.trim() === '') {
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
    
    const finalsValue = finalsEntry.catNumber;
    
    // Check if this cat is a CH in the eligible set
    let isCH = false;
    let isGC = false;
    let isNOV = false;
    let isInChampionshipFinal = false;
    // Check all championship final entries for this cat
    for (const key in showAwards) {
      const award = showAwards[key];
      if (award && award.catNumber.trim() === finalsValue.trim()) {
        if (award.status === 'CH') isCH = true;
        if (award.status === 'GC') isGC = true;
        if (award.status === 'NOV') isNOV = true;
        // Check if this cat is in championship final
        const numAwardRows = championshipTotal >= 85 ? 15 : 10;
        for (let i = 0; i < numAwardRows; i++) {
          const finalAward = showAwards[`${columnIndex}-${i}`];
          if (finalAward && finalAward.catNumber.trim() === finalsValue.trim()) {
            isInChampionshipFinal = true;
            break;
          }
        }
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
 * Validates that Best LH CH finals match CH cats from championship final in order
 * For Longhair rings: Best LH CH must contain CH cats from championship final in the same order
 * If there are no CHs in the championship final, Best LH CH can be filled with any CH cats entered in the show (not in the final)
 * Returns the first position with an error, or -1 if valid
 */
export function validateBestLHCHWithTop15AndGetFirstError(input: ChampionshipValidationInput, columnIndex: number): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  return validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'Longhair');
}

/**
 * Validates that Best SH CH finals match CH cats from championship final in order
 * For Shorthair rings: Best SH CH must contain CH cats from championship final in the same order
 * If there are no CHs in the championship final, Best SH CH can be filled with any CH cats entered in the show (not in the final)
 * Returns the first position with an error, or -1 if valid
 */
export function validateBestSHCHWithTop15AndGetFirstError(input: ChampionshipValidationInput, columnIndex: number): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  return validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'Shorthair');
}

/**
 * Validates that Best LH/SH CH finals in single specialty rings match CH cats from championship final in order.
 * For LH/SH rings: Best LH/SH CH must contain CH cats from championship final in the same order (if any)
 * If there are no CHs in the championship final, Best LH/SH CH can be filled with any CH cats entered in the show (not in the final)
 * Returns the first position with an error, or -1 if valid
 */
export function validateSingleSpecialtyCHWithTop15AndGetFirstError(
  input: ChampionshipValidationInput, 
  columnIndex: number, 
  specialty: 'Longhair' | 'Shorthair'
): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  const { columns, lhChampionsFinals, shChampionsFinals, championshipTotal, showAwards } = input;
  const column = columns[columnIndex];
  if (!column || column.specialty !== specialty) {
    return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
  }
  
  const finalsData = specialty === 'Longhair' ? lhChampionsFinals : shChampionsFinals;
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Collect championship final cats (in order) - this is the "top 10/15" section
  const numAwardRows = championshipTotal >= 85 ? 15 : 10;
  const championshipFinalCats: {catNumber: string, status: string}[] = [];
  for (let i = 0; i < numAwardRows; i++) {
    const award = showAwards[`${columnIndex}-${i}`];
    if (award && award.catNumber && award.catNumber.trim() !== '' && 
        award.catNumber.trim().toUpperCase() !== 'VOID') {
      championshipFinalCats.push({catNumber: award.catNumber.trim(), status: award.status});
    }
  }
  // Find CHs in championship final
  const chInChampionshipFinal = championshipFinalCats.filter(c => c.status === 'CH').map(c => c.catNumber);

  // Build required Best LH/SH CH list
  let requiredBestCH: string[] = [];
  if (chInChampionshipFinal.length > 0) {
    // If there are CHs in championship final, they must be at the top of Best LH/SH CH in order
    requiredBestCH = [...chInChampionshipFinal];
    // Fill remaining positions with other CHs from championship final (if any more exist)
    for (const c of championshipFinalCats) {
      if (c.status === 'CH' && !requiredBestCH.includes(c.catNumber)) {
        requiredBestCH.push(c.catNumber);
        if (requiredBestCH.length === numPositions) break;
      }
    }
  } else {
    // No CHs in championship final - Best LH/SH CH can be filled with any CH cats entered in the show (not in the final)
    // Collect all unique CH cat numbers from the current column's show awards only
    const allCHs = new Set<string>();
    for (let i = 0; i < numAwardRows; i++) {
      const key = `${columnIndex}-${i}`;
      const award = showAwards[key];
      if (award && award.status === 'CH' && award.catNumber && 
          award.catNumber.trim() !== '' && 
          award.catNumber.trim().toUpperCase() !== 'VOID') {
        allCHs.add(award.catNumber.trim());
      }
    }
    requiredBestCH = Array.from(allCHs).slice(0, numPositions);
  }

  // Validate Best LH/SH CH
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const finalsEntry = finalsData[key];
    if (!finalsEntry || !finalsEntry.catNumber || finalsEntry.catNumber.trim() === '') {
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
    
    const finalsValue = finalsEntry.catNumber;
    
    // Check if this cat is a CH in the eligible set
    let isCH = false;
    let isGC = false;
    let isNOV = false;
    let isInChampionshipFinal = false;
    // Check all championship final entries for this cat
    for (const key in showAwards) {
      const award = showAwards[key];
      if (award && award.catNumber.trim() === finalsValue.trim()) {
        if (award.status === 'CH') isCH = true;
        if (award.status === 'GC') isGC = true;
        if (award.status === 'NOV') isNOV = true;
        // Check if this cat is in championship final
        const numAwardRows = championshipTotal >= 85 ? 15 : 10;
        for (let i = 0; i < numAwardRows; i++) {
          const finalAward = showAwards[`${columnIndex}-${i}`];
          if (finalAward && finalAward.catNumber.trim() === finalsValue.trim()) {
            isInChampionshipFinal = true;
            break;
          }
        }
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
 * Validates that Best LH/SH CH finals in Allbreed rings match CH cats from championship final in order.
 * For Allbreed rings: Best LH/SH CH must contain CH cats from championship final in the same order (if any)
 * If there are no CHs in the championship final, Best LH/SH CH can be filled with any CH cats entered in the show (not in the final)
 * Returns the first position with an error, or -1 if valid
 */
export function validateBestHairCHWithFiller(input: ChampionshipValidationInput, columnIndex: number, hair: 'LH' | 'SH'): { isValid: boolean; firstErrorPosition: number; errorMessage: string } {
  const { columns, lhChampionsFinals, shChampionsFinals, championshipTotal, showAwards } = input;
  const column = columns[columnIndex];
  if (!column || column.specialty !== 'Allbreed') return { isValid: true, firstErrorPosition: -1, errorMessage: '' };
  
  const finalsData = hair === 'LH' ? lhChampionsFinals : shChampionsFinals;
  const numPositions = championshipTotal >= 85 ? 5 : 3;
  
  // Collect championship final cats (in order) - this is the "top 10/15" section
  const numAwardRows = championshipTotal >= 85 ? 15 : 10;
  const championshipFinalCats: {catNumber: string, status: string}[] = [];
  for (let i = 0; i < numAwardRows; i++) {
    const award = showAwards[`${columnIndex}-${i}`];
    if (award && award.catNumber && award.catNumber.trim() !== '' && 
        award.catNumber.trim().toUpperCase() !== 'VOID') {
      championshipFinalCats.push({catNumber: award.catNumber.trim(), status: award.status});
    }
  }
  // Find CHs in championship final
  const chInChampionshipFinal = championshipFinalCats.filter(c => c.status === 'CH').map(c => c.catNumber);

  // Build required Best LH/SH CH list
  let requiredBestCH: string[] = [];
  if (chInChampionshipFinal.length > 0) {
    // If there are CHs in championship final, they must be at the top of Best LH/SH CH in order
    requiredBestCH = [...chInChampionshipFinal];
    // Fill remaining positions with other CHs from championship final (if any more exist)
    for (const c of championshipFinalCats) {
      if (c.status === 'CH' && !requiredBestCH.includes(c.catNumber)) {
        requiredBestCH.push(c.catNumber);
        if (requiredBestCH.length === numPositions) break;
      }
    }
  } else {
    // No CHs in championship final - Best LH/SH CH can be filled with any CH cats entered in the show (not in the final)
    // Collect all unique CH cat numbers from the current column's show awards only
    const allCHs = new Set<string>();
    for (let i = 0; i < numAwardRows; i++) {
      const key = `${columnIndex}-${i}`;
      const award = showAwards[key];
      if (award && award.status === 'CH' && award.catNumber && 
          award.catNumber.trim() !== '' && 
          award.catNumber.trim().toUpperCase() !== 'VOID') {
        allCHs.add(award.catNumber.trim());
      }
    }
    requiredBestCH = Array.from(allCHs).slice(0, numPositions);
  }

  // Validate Best LH/SH CH
  for (let position = 0; position < numPositions; position++) {
    const key = `${columnIndex}-${position}`;
    const finalsEntry = finalsData[key];
    if (!finalsEntry || !finalsEntry.catNumber || finalsEntry.catNumber.trim() === '') {
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
    
    const finalsValue = finalsEntry.catNumber;
    
    // Check if this cat is a CH in the eligible set
    let isCH = false;
    let isGC = false;
    let isNOV = false;
    let isInChampionshipFinal = false;
    // Check all championship final entries for this cat
    for (const key in showAwards) {
      const award = showAwards[key];
      if (award && award.catNumber.trim() === finalsValue.trim()) {
        if (award.status === 'CH') isCH = true;
        if (award.status === 'GC') isGC = true;
        if (award.status === 'NOV') isNOV = true;
        // Check if this cat is in championship final
        const numAwardRows = championshipTotal >= 85 ? 15 : 10;
        for (let i = 0; i < numAwardRows; i++) {
          const finalAward = showAwards[`${columnIndex}-${i}`];
          if (finalAward && finalAward.catNumber.trim() === finalsValue.trim()) {
            isInChampionshipFinal = true;
            break;
          }
        }
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
    default:
      return true;
  }
  
  // Check if any previous position is empty
  for (let i = 0; i < position; i++) {
    const key = `${columnIndex}-${i}`;
    const entry = dataSource[key];
    
    if (section === 'showAwards') {
      if (!entry || !entry.catNumber || entry.catNumber.trim() === '') {
        return false; // Cannot skip positions
      }
    } else {
      // For finals sections, check the new structure
      if (!entry || !entry.catNumber || entry.catNumber.trim() === '') {
        return false; // Cannot skip positions
      }
    }
  }
  
  return true;
}

/**
 * Validates relationships between columns (e.g., Best AB CH must match CH cats from championship final)
 */
export function validateColumnRelationships(input: ChampionshipValidationInput, columnIndex: number): { isValid: boolean; errorKeys?: string[]; errorMessages?: string[]; isReminder?: boolean } {
  const { columns } = input;
  const column = columns[columnIndex];
  if (!column) return { isValid: true };

  const errors: { key: string; message: string }[] = [];

  // Validate based on ring type
  if (column.specialty === 'Allbreed') {
    // Allbreed ring validation
    const bestCHResult = validateBestCHWithTop15AndGetFirstError(input, columnIndex);
    if (!bestCHResult.isValid) {
      errors.push({
        key: `champions-${columnIndex}-${bestCHResult.firstErrorPosition}`,
        message: bestCHResult.errorMessage
      });
    }

    // Validate LH/SH CH for Allbreed rings
    const lhResult = validateBestHairCHWithFiller(input, columnIndex, 'LH');
    if (!lhResult.isValid) {
      errors.push({
        key: `lhChampions-${columnIndex}-${lhResult.firstErrorPosition}`,
        message: lhResult.errorMessage
      });
    }

    const shResult = validateBestHairCHWithFiller(input, columnIndex, 'SH');
    if (!shResult.isValid) {
      errors.push({
        key: `shChampions-${columnIndex}-${shResult.firstErrorPosition}`,
        message: shResult.errorMessage
      });
    }

  } else if (column.specialty === 'Longhair') {
    // Longhair ring validation
    const lhResult = validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'Longhair');
    if (!lhResult.isValid) {
      errors.push({
        key: `lhChampions-${columnIndex}-${lhResult.firstErrorPosition}`,
        message: lhResult.errorMessage
      });
    }

  } else if (column.specialty === 'Shorthair') {
    // Shorthair ring validation
    const shResult = validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'Shorthair');
    if (!shResult.isValid) {
      errors.push({
        key: `shChampions-${columnIndex}-${shResult.firstErrorPosition}`,
        message: shResult.errorMessage
      });
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errorKeys: errors.map(e => e.key),
      errorMessages: errors.map(e => e.message)
    };
  }

  return { isValid: true };
}

/**
 * Gets the show award for a specific cat number in a column
 */
export function getShowAwardByCatNumber(input: ChampionshipValidationInput, columnIndex: number, catNumber: string): { catNumber: string; status: string } | null {
  const { showAwards } = input;
  
  for (const key in showAwards) {
    const award = showAwards[key];
    if (award && award.catNumber.trim() === catNumber.trim()) {
      return award;
    }
  }
  
  return null;
}

/**
 * Gets the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(num: number): string {
  if (num >= 11 && num <= 13) return 'th';
  switch (num % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Main validation function for the Championship tab
 * Returns a map of error keys to error messages
 */
export function validateChampionshipTab(input: ChampionshipValidationInput): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  const { columns, showAwards, championshipTotal } = input;
  
  // Validate each column
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
    const column = columns[columnIndex];
    if (!column) continue;
    
    const numAwardRows = championshipTotal >= 85 ? 15 : 10;
    
    // Validate show awards for this column
    for (let position = 0; position < numAwardRows; position++) {
      const key = `${columnIndex}-${position}`;
      const award = showAwards[key];
      
      if (award) {
        // Validate cat number format
        if (award.catNumber && !validateCatNumber(award.catNumber)) {
          errors[`showAwards-${key}-catNumber`] = 'Cat number must be between 1-450 or "VOID"';
        }
        
        // Check for duplicates in show awards
        if (award.catNumber && checkDuplicateCatNumbersInShowAwards(input, columnIndex, award.catNumber, key)) {
          errors[`showAwards-${key}-catNumber`] = `${award.catNumber.trim()} is a duplicate in Show Awards`;
        }
        
        // Validate sequential entry
        if (award.catNumber && !validateSequentialEntry(input, 'showAwards', columnIndex, position, award.catNumber)) {
          errors[`showAwards-${key}-catNumber`] = 'Cannot skip positions - fill sequentially';
        }
      }
    }
    
    // Validate finals sections based on ring type
    if (column.specialty === 'Allbreed') {
      // Validate Best AB CH
      const bestCHResult = validateBestCHWithTop15AndGetFirstError(input, columnIndex);
      if (!bestCHResult.isValid) {
        const key = `champions-${columnIndex}-${bestCHResult.firstErrorPosition}`;
        errors[key] = bestCHResult.errorMessage;
      }
      
      // Validate LH/SH CH for Allbreed
      const lhResult = validateBestHairCHWithFiller(input, columnIndex, 'LH');
      if (!lhResult.isValid) {
        const key = `lhChampions-${columnIndex}-${lhResult.firstErrorPosition}`;
        errors[key] = lhResult.errorMessage;
      }
      
      const shResult = validateBestHairCHWithFiller(input, columnIndex, 'SH');
      if (!shResult.isValid) {
        const key = `shChampions-${columnIndex}-${shResult.firstErrorPosition}`;
        errors[key] = shResult.errorMessage;
      }
      
    } else if (column.specialty === 'Longhair') {
      // Validate LH CH for Longhair rings
      const lhResult = validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'Longhair');
      if (!lhResult.isValid) {
        const key = `lhChampions-${columnIndex}-${lhResult.firstErrorPosition}`;
        errors[key] = lhResult.errorMessage;
      }
      
    } else if (column.specialty === 'Shorthair') {
      // Validate SH CH for Shorthair rings
      const shResult = validateSingleSpecialtyCHWithTop15AndGetFirstError(input, columnIndex, 'Shorthair');
      if (!shResult.isValid) {
        const key = `shChampions-${columnIndex}-${shResult.firstErrorPosition}`;
        errors[key] = shResult.errorMessage;
      }
    }
  }
  
  return errors;
} 