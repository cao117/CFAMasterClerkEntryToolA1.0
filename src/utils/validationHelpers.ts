/**
 * Shared validation helper functions for the CFA Entry Tool
 */

/**
 * Generates a consistent cat number validation error message
 * @param maxCats - The maximum number of cats allowed (from globalSettings.max_cats)
 * @returns Formatted error message
 */
export const getCatNumberValidationMessage = (maxCats: number): string => 
  `Cat number must be between 1-${maxCats} or VOID`;

/**
 * Validates if a cat number is in the correct format (1-maxCats, must be all digits, no letters or symbols)
 * @param value - The cat number string to validate
 * @param maxCats - The maximum number of cats allowed (from globalSettings.max_cats)
 * @returns True if valid
 */
export function validateCatNumber(value: string, maxCats: number): boolean {
  if (!value || value.trim() === '') return true;
  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed)) return false; // Only allow digits
  const num = Number(trimmed);
  return num >= 1 && num <= maxCats;
} 