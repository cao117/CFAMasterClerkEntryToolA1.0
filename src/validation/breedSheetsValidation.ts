// Breed Sheets tab validation logic

export interface BreedSheetsValidationInput {
  judgeId: number;
  groupHairLengthKey: string;
  breedEntries: {
    [breedKey: string]: {
      bob: string;
      secondBest: string;
      bestCH?: string;
      bestPR?: string;
    };
  };
  selectedGroup: 'Championship' | 'Premiership' | 'Kitten';
  selectedHairLength: 'Longhair' | 'Shorthair';
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
 * Checks if input is VOID (case-insensitive)
 */
export function isVoidInput(value: string): boolean {
  return typeof value === 'string' && value.trim().toUpperCase() === 'VOID';
}

/**
 * Validates sequential entry for BoB and 2BoB
 * 2BoB cannot be filled before BoB is filled
 */
export function validateSequentialEntry(
  input: BreedSheetsValidationInput,
  breedKey: string,
  field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR',
  value: string
): boolean {
  if (!value || value.trim() === '' || isVoidInput(value)) {
    return true; // Empty or VOID is always valid
  }

  const breedEntry = input.breedEntries[breedKey];
  if (!breedEntry) {
    return true; // No existing entry, so sequential check passes
  }

  // Rule 1: 2BoB cannot be filled before BoB is filled
  if (field === 'secondBest') {
    const bobValue = breedEntry.bob;
    if (!bobValue || bobValue.trim() === '' || isVoidInput(bobValue)) {
      return false; // 2BoB cannot be filled if BoB is empty
    }
  }

  // Rule 2: Best CH/PR cannot be filled before BoB is filled (for Championship/Premiership only)
  if ((field === 'bestCH' && input.selectedGroup === 'Championship') || 
      (field === 'bestPR' && input.selectedGroup === 'Premiership')) {
    const bobValue = breedEntry.bob;
    if (!bobValue || bobValue.trim() === '' || isVoidInput(bobValue)) {
      return false; // Best CH/PR cannot be filled if BoB is empty
    }
  }

  return true;
}

/**
 * Checks for duplicate cat numbers within the same judge-group-hair length combination
 * Returns an object with duplicate status and type information
 */
export function checkDuplicateCatNumbers(
  input: BreedSheetsValidationInput,
  breedKey: string,
  field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR',
  value: string
): { isDuplicate: boolean; isSameBreed: boolean; conflictingField?: string } {
  if (!value || value.trim() === '' || isVoidInput(value)) {
    return { isDuplicate: false, isSameBreed: false }; // Empty or VOID values don't count as duplicates
  }

  const trimmedValue = value.trim();

  // ONLY check BoB vs 2BoB conflict within the same breed (BoB and 2BoB must be different cats)
  const currentEntry = input.breedEntries[breedKey];
  if (currentEntry) {
    // Check ONLY BoB vs 2BoB conflict (they must be different cats)
    if (field === 'secondBest' && currentEntry.bob && currentEntry.bob.trim() === trimmedValue && !isVoidInput(currentEntry.bob)) {
      return { isDuplicate: true, isSameBreed: true, conflictingField: 'bob' };
    }
    if (field === 'bob' && currentEntry.secondBest && currentEntry.secondBest.trim() === trimmedValue && !isVoidInput(currentEntry.secondBest)) {
      return { isDuplicate: true, isSameBreed: true, conflictingField: 'secondBest' };
    }
    // Note: BoB can be same as CH/PR, 2BoB can be same as CH/PR - this is allowed!
  }

  // Then check across different breeds ONLY
  const allValues = new Set<string>();

  // Collect all cat numbers from OTHER breeds only (exclude current breed entirely)
  Object.keys(input.breedEntries).forEach(key => {
    // Skip the ENTIRE current breed (not just current field)
    if (key === breedKey) return;
    
    const entry = input.breedEntries[key];
    
    // Add all fields from OTHER breeds
    if (entry.bob && entry.bob.trim() !== '' && !isVoidInput(entry.bob)) {
      allValues.add(entry.bob.trim());
    }
    if (entry.secondBest && entry.secondBest.trim() !== '' && !isVoidInput(entry.secondBest)) {
      allValues.add(entry.secondBest.trim());
    }
    if (entry.bestCH && entry.bestCH.trim() !== '' && !isVoidInput(entry.bestCH)) {
      allValues.add(entry.bestCH.trim());
    }
    if (entry.bestPR && entry.bestPR.trim() !== '' && !isVoidInput(entry.bestPR)) {
      allValues.add(entry.bestPR.trim());
    }
  });

  // Check if the current value already exists in any other field (cross-breed duplicate)
  if (allValues.has(trimmedValue)) {
    return { isDuplicate: true, isSameBreed: false };
  }

  return { isDuplicate: false, isSameBreed: false };
}

/**
 * Validates that BoB and 2BoB are not the same cat number
 */
export function validateBoB2BoBDifferent(
  input: BreedSheetsValidationInput,
  breedKey: string
): boolean {
  const entry = input.breedEntries[breedKey];
  if (!entry) {
    return true; // No entry, so validation passes
  }

  const bobValue = entry.bob?.trim();
  const secondBestValue = entry.secondBest?.trim();

  if (!bobValue || !secondBestValue || 
      isVoidInput(entry.bob) || isVoidInput(entry.secondBest) ||
      bobValue === '' || secondBestValue === '') {
    return true; // If either is empty or VOID, validation passes
  }

  return bobValue !== secondBestValue;
}

/**
 * Main validation function for Breed Sheets tab
 * Returns an object with error keys and messages
 */
export function validateBreedSheetsTab(input: BreedSheetsValidationInput): { [key: string]: string } {
  const errors: { [key: string]: string } = {};

  Object.keys(input.breedEntries).forEach(breedKey => {
    const entry = input.breedEntries[breedKey];
    
    // Validate each field
    const fields: Array<{ field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR'; value: string }> = [
      { field: 'bob', value: entry.bob || '' },
      { field: 'secondBest', value: entry.secondBest || '' }
    ];

    // Add Best CH/PR fields based on selected group
    if (input.selectedGroup === 'Championship' && entry.bestCH !== undefined) {
      fields.push({ field: 'bestCH', value: entry.bestCH });
    }
    if (input.selectedGroup === 'Premiership' && entry.bestPR !== undefined) {
      fields.push({ field: 'bestPR', value: entry.bestPR });
    }

    fields.forEach(({ field, value }) => {
      const errorKey = `${breedKey}-${field}`;

      // Skip validation for empty or VOID values
      if (!value || value.trim() === '' || isVoidInput(value)) {
        return;
      }

      // 1. Format validation (cat number range)
      if (!validateCatNumber(value)) {
        errors[errorKey] = 'Cat number must be between 1-450 or VOID';
        return;
      }

      // 2. Duplicate validation
      const duplicateCheck = checkDuplicateCatNumbers(input, breedKey, field, value);
      if (duplicateCheck.isDuplicate) {
        if (duplicateCheck.isSameBreed) {
          errors[errorKey] = 'Cat cannot be both BoB and 2BoB';
        } else {
          errors[errorKey] = 'Cat entered in multiple breeds';
        }
        return;
      }

      // 3. Sequential entry validation
      if (!validateSequentialEntry(input, breedKey, field, value)) {
        if (field === 'secondBest') {
          errors[errorKey] = 'BoB must be entered before 2BoB';
        } else if (field === 'bestCH' || field === 'bestPR') {
          errors[errorKey] = 'BoB must be entered before CH/PR';
        }
        return;
      }
    });

    // Note: BoB/2BoB same cat validation is now handled in duplicate validation above
  });

  return errors;
}

/**
 * Validates a single field with proper error precedence
 */
export function validateBreedSheetsField(
  input: BreedSheetsValidationInput,
  breedKey: string,
  field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR',
  value: string
): string | null {
  // Skip validation for empty or VOID values
  if (!value || value.trim() === '' || isVoidInput(value)) {
    return null;
  }

  // 1. Format validation (highest precedence)
  if (!validateCatNumber(value)) {
    return 'Cat number must be between 1-450 or VOID';
  }

  // 2. Duplicate validation
  const duplicateCheck = checkDuplicateCatNumbers(input, breedKey, field, value);
  if (duplicateCheck.isDuplicate) {
    if (duplicateCheck.isSameBreed) {
      return 'Cat cannot be both BoB and 2BoB';
    } else {
      return 'Cat entered in multiple breeds';
    }
  }

  // 3. Sequential entry validation
  if (!validateSequentialEntry(input, breedKey, field, value)) {
    if (field === 'secondBest') {
      return 'BoB must be entered before 2BoB';
    } else if (field === 'bestCH' || field === 'bestPR') {
      return 'BoB must be entered before CH/PR';
    }
  }

  // Note: BoB/2BoB same cat validation is now handled in duplicate validation above

  return null;
} 