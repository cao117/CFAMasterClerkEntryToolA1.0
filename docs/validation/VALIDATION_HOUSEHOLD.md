# Household Pet Tab Validation Rules

This document describes the **current validation rules** enforced in the Household Pet tab of the CFA Master Clerk Entry Tool.

## UI/UX Structure
- The Household Pet tab is visually and functionally identical to the Kitten tab, except for the following reductions:
  - Only one section: **Top 10/15 Household Pets** (no finals or sub-sections)
  - Columns are dynamically generated from the General tab judges/ring types (AB=1, LH=1, SH=1, Double Specialty=2)
  - Only one status: **HHP** (all caps), always selected in the dropdown
  - **If a Cat # input is VOID (case-insensitive, trimmed), the status label is hidden (not rendered) for that cell, and only 'VOID' is saved/restored in the CSV.**
  - Three action buttons at the bottom: Save to CSV, Load from CSV, Reset (shared logic)
  - Voiding logic, error display, keyboard navigation, and all styling match the Kitten tab exactly

## Breakpoint Logic
- **Breakpoint:** 50 household pets (total)
  - If **≥50 household pets**: Top 15 positions
  - If **<50 household pets**: Top 10 positions
  - All columns use the same row count, regardless of ring type

## Validation Rules
- **Cat number format:** Must be between 1-{max_cats}
- **Sequential entry:** Must fill positions sequentially (no skipping)
- **Duplicate check:** No duplicates within the same section of the final. If a duplicate is found, the error is shown on all cells with the same value in that section (not just the last entered cell). The error message is: 'Duplicate cat number within this section of the final'.
- **Status validation:** Only HHP is allowed (always selected)
- **If a Cat # input is VOID, the status label is hidden (not rendered) for that cell.**
- **Voiding:** Voiding a cat number in any cell in a column voids all instances of that cat number in that column
- **Error display:** Errors are shown inline, with the same styling and precedence as the Kitten tab

## Error Precedence
For each cell, only the highest-precedence error is shown:
1. Duplicate error (within section of the final; shown on all cells with the same value; message: 'Duplicate cat number within this section of the final')
2. Range error (cat number not 1-{max_cats})
3. Sequential entry error ("You must fill previous placements before entering this position.")
4. Status error (should always be HHP)

## Parity with Kitten Tab
- All UI/UX, error display, voiding, and keyboard navigation are identical to the Kitten tab
- Only the number of sections and allowed status differ

## Last Updated
- 2024-06-22 

## Voiding Logic
- If a cat number is voided anywhere in a column, all instances of that cat number in that column are voided (including new ones).
- Unchecking void in any cell unvoids all instances in that column for that cat number.
- This logic applies across the full column, matching Championship, Premiership, and Kitten tabs. 
- **If a Cat # input is VOID, the status label is hidden (not rendered) for that cell, and only 'VOID' is saved/restored in the CSV.**

## Household Pet Tab Validation Rules

- Only filled rows require status 'HHP'.
- Empty rows (no cat number) are allowed and do not trigger errors.
- When importing from CSV, a blank Household Pet section does not cause validation errors. 