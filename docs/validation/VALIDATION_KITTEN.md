# Kitten Tab Validation Rules

This document describes the **current validation rules** enforced in the Kitten tab of the CFA Master Clerk Entry Tool.

## UI/UX Structure
- The Kitten tab is visually and functionally identical to the Premiership tab, except for the following reductions:
  - Only one section: **Top 10/15 Kittens** (no finals or sub-sections)
  - Columns are dynamically generated from the General tab judges/ring types (AB=1, LH=1, SH=1, Double Specialty=2)
  - Only one status: **KIT** (all caps), always selected in the dropdown
  - Three action buttons at the bottom: Save to CSV, Load from CSV, Reset (shared logic)
  - Voiding logic, error display, keyboard navigation, and all styling match the Premiership tab exactly

## Hair-Specific Breakpoint Logic

The Kitten tab uses **hair-specific breakpoints** based on ring type:

### Allbreed Rings
- **Breakpoint**: Total kittens (LH + SH) ≥ 75
- **If ≥ 75**: Top 15 positions
- **If < 75**: Top 10 positions

### Longhair Rings
- **Breakpoint**: LH kittens ≥ 75
- **If ≥ 75**: Top 15 positions
- **If < 75**: Top 10 positions

### Shorthair Rings
- **Breakpoint**: SH kittens ≥ 75
- **If ≥ 75**: Top 15 positions
- **If < 75**: Top 10 positions

## Validation Rules
- **Cat number format:** Must be between 1-450
- **Sequential entry:** Must fill positions sequentially (no skipping)
- **Duplicate check:** No duplicates within the same section of the final. If a duplicate is found, the error is shown on all cells with the same value in that section (not just the last entered cell). The error message is: 'Duplicate cat number within this section of the final'.
- **Status validation:** Only KIT is allowed (always selected)
- **Voiding:** Voiding a cat number in any cell in a column voids all instances of that cat number in that column
- **Error display:** Errors are shown inline, with the same styling and precedence as the Premiership tab

## Error Precedence
For each cell, only the highest-precedence error is shown:
1. Duplicate error (within section of the final; shown on all cells with the same value; message: 'Duplicate cat number within this section of the final')
2. Range error (cat number not 1-450)
3. Sequential entry error ("You must fill previous placements before entering this position.")
4. Status error (should always be KIT)

## Column Reset on Ring Type Change
- If a judge's ring type is changed to any other type (regardless of the old or new type), the affected columns in the Kitten tab are reset: all data for those columns is cleared and the columns start empty.
- Other judges' columns and data are not affected.

## Example
Suppose you have 6 judges: 5 Shorthair rings and 1 Allbreed ring:
- **Shorthair rings**: If SH kittens < 75, each shows 10 rows (Top 10)
- **Allbreed ring**: If total kittens ≥ 75, shows 15 rows (Top 15)
- **Result**: Table shows 15 rows total, but only the Allbreed column has inputs for rows 11-15
- **Shorthair columns**: Rows 11-15 show empty cells (no inputs)
- Each column's breakpoint is calculated independently based on its ring type and hair-specific kitten count

## Parity with Premiership Tab
- All UI/UX, error display, voiding, and keyboard navigation are identical to the Premiership tab
- Only the number of sections and allowed status differ

## Last Updated
- 2024-06-22 

## Voiding Logic
- If a cat number is voided anywhere in a column, all instances of that cat number in that column are voided (including new ones).
- Unchecking void in any cell unvoids all instances in that column for that cat number.
- This logic applies across the full column, matching Championship, Premiership, and Household Pet tabs. 