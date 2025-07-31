/**
 * Utility functions for jump to menu dropdown formatting
 * Provides consistent formatting across all tabs with proper alignment and room type abbreviations
 */

/**
 * Maps room types to their abbreviations for consistent display
 * @param roomType - The room type string
 * @returns Abbreviated room type string
 */
export const getRoomTypeAbbreviation = (roomType: string): string => {
  switch (roomType) {
    case 'Allbreed':
      return 'AB';
    case 'Longhair':
      return 'LH';
    case 'Shorthair':
      return 'SH';
    case 'OCP':
      return 'OCP';
    default:
      return roomType;
  }
};

/**
 * Formats jump to menu options with consistent alignment
 * @param columns - Array of column objects with judge and specialty information
 * @returns Array of formatted option strings
 */
export const formatJumpToMenuOptions = (columns: any[]): string[] => {
  return columns.map((col) => {
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym} - ${getRoomTypeAbbreviation(col.specialty)}`;
  });
};

/**
 * Formats the selected value for jump to menu dropdown
 * @param columns - Array of column objects
 * @param focusedColumnIndex - Index of the focused column
 * @returns Formatted selected value string
 */
export const formatJumpToMenuValue = (columns: any[], focusedColumnIndex: number | null): string => {
  if (focusedColumnIndex !== null && focusedColumnIndex >= 0 && focusedColumnIndex < columns.length) {
    const col = columns[focusedColumnIndex];
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym} - ${getRoomTypeAbbreviation(col.specialty)}`;
  } else if (columns.length > 0) {
    const col = columns[0];
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym} - ${getRoomTypeAbbreviation(col.specialty)}`;
  }
  return '';
};

/**
 * Formats jump to menu options for HouseholdPetTab (uses judge.ringType instead of col.specialty)
 * @param columns - Array of column objects with judge information
 * @returns Array of formatted option strings
 */
export const formatJumpToMenuOptionsHHP = (columns: any[]): string[] => {
  return columns.map((col) => {
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym} - ${getRoomTypeAbbreviation(col.judge.ringType)}`;
  });
};

/**
 * Formats the selected value for jump to menu dropdown for HouseholdPetTab
 * @param columns - Array of column objects
 * @param focusedColumnIndex - Index of the focused column
 * @returns Formatted selected value string
 */
export const formatJumpToMenuValueHHP = (columns: any[], focusedColumnIndex: number | null): string => {
  if (focusedColumnIndex !== null && focusedColumnIndex >= 0 && focusedColumnIndex < columns.length) {
    const col = columns[focusedColumnIndex];
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym} - ${getRoomTypeAbbreviation(col.judge.ringType)}`;
  } else if (columns.length > 0) {
    const col = columns[0];
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym} - ${getRoomTypeAbbreviation(col.judge.ringType)}`;
  }
  return '';
};

/**
 * Formats jump to menu options for HouseholdPetTab WITHOUT room type abbreviations
 * Since household pets don't need room type distinction, this shows only Ring and Judge
 * @param columns - Array of column objects with judge information
 * @returns Array of formatted option strings
 */
export const formatJumpToMenuOptionsHHPNoRoomType = (columns: any[]): string[] => {
  return columns.map((col) => {
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym}`;
  });
};

/**
 * Formats the selected value for jump to menu dropdown for HouseholdPetTab WITHOUT room type abbreviations
 * @param columns - Array of column objects
 * @param focusedColumnIndex - Index of the focused column
 * @returns Formatted selected value string
 */
export const formatJumpToMenuValueHHPNoRoomType = (columns: any[], focusedColumnIndex: number | null): string => {
  if (focusedColumnIndex !== null && focusedColumnIndex >= 0 && focusedColumnIndex < columns.length) {
    const col = columns[focusedColumnIndex];
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym}`;
  } else if (columns.length > 0) {
    const col = columns[0];
    const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
    const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0'); // Non-breaking space
    return `Ring ${ringNumber} - ${judgeAcronym}`;
  }
  return '';
}; 