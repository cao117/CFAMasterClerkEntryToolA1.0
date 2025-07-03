# Kitten Tab Validation Rules

This document describes the **current validation rules** enforced in the Kitten tab of the CFA Master Clerk Entry Tool.

## UI/UX Structure
- The Kitten tab is visually and functionally identical to the Premiership tab, except for the following reductions:
  - Only one section: **Top 10/15 Kittens** (no finals or sub-sections)
  - Columns are dynamically generated from the General tab judges/ring types (AB=1, LH=1, SH=1, Double Specialty=2)
  - Only one status: **KIT** (all caps), always selected in the dropdown
  - Four action buttons at the bottom: Save to Temp CSV, Generate Final CSV, Restore from CSV, Reset (shared logic)
  - Voiding logic, error display, keyboard navigation, and all styling match the Premiership tab exactly

## Breakpoint Logic
- **Breakpoint:** 75 kittens
  - If **≥75 kittens**: Top 15 positions
  - If **<75 kittens**: Top 10 positions

## Validation Rules
- **Cat number format:** Must be between 1-450
- **Sequential entry:** Must fill positions sequentially (no skipping)
- **Duplicate check:** No duplicates within the same column
- **Status validation:** Only KIT is allowed (always selected)
- **Voiding:** Voiding a cat number in any cell in a column voids all instances of that cat number in that column
- **Error display:** Errors are shown inline, with the same styling and precedence as the Premiership tab

## Error Precedence
For each cell, only the highest-precedence error is shown:
1. Duplicate error (within column)
2. Range error (cat number not 1-450)
3. Sequential entry error ("You must fill previous placements before entering this position.")
4. Status error (should always be KIT)

## Column Reset on Ring Type Change
- If a judge's ring type is changed to any other type (regardless of the old or new type), the affected columns in the Kitten tab are reset: all data for those columns is cleared and the columns start empty.
- Other judges' columns and data are not affected.

## Example
Suppose you have 3 judges (all Allbreed) and 80 kittens:
- The table will have 3 columns (one per judge), 10 rows (Top 10 Kittens)
- You enter cat numbers 1-10 in each column
- If you void cat #3 in column 1, all instances of cat #3 in column 1 are voided
- If you change judge 2's ring type to Double Specialty, column 2 is replaced by two columns (LH, SH), both start empty

## Parity with Premiership Tab
- All UI/UX, error display, voiding, and keyboard navigation are identical to the Premiership tab
- Only the number of sections and allowed status differ

## Last Updated
- 2024-06-22 