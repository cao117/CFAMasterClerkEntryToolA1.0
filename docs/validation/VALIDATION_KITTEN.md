# Kitten Tab Validation Rules

This document describes the **current validation rules** enforced in the Kitten tab of the CFA Master Clerk Entry Tool.

## UI/UX Structure
- The Kitten tab is visually and functionally identical to the Premiership tab, except for the following reductions:
  - Only one section: **Top 10/15 Kittens** (no finals or sub-sections)
  - Columns are dynamically generated from the General tab judges/ring types (AB=1, LH=1, SH=1, Double Specialty=2)
  - Only one status: **KIT** (all caps), always selected in the dropdown
  - **If a Cat # input is VOID (case-insensitive, trimmed), the status label is hidden (not rendered) for that cell, and only 'VOID' is saved/restored in the CSV.**
  - Three action buttons at the bottom: Save to CSV, Load from CSV, Reset (shared logic)
  - Voiding logic, error display, keyboard navigation, and all styling match the Premiership tab exactly

## Hair-Specific Breakpoint Logic

The Kitten tab uses **hair-specific breakpoints** based on ring type. The breakpoint threshold is configurable in the General Settings panel (default: 75).

### Allbreed Rings
- **Breakpoint**: Total kittens (LH + SH) ≥ [configurable threshold]
- **If ≥ threshold**: Top 15 positions
- **If < threshold**: Top 10 positions

### Longhair Rings
- **Breakpoint**: LH kittens ≥ [configurable threshold]
- **If ≥ threshold**: Top 15 positions
- **If < threshold**: Top 10 positions

### Shorthair Rings
- **Breakpoint**: SH kittens ≥ [configurable threshold]
- **If ≥ threshold**: Top 15 positions
- **If < threshold**: Top 10 positions

## Validation Rules
- **Cat number format:** Must be between 1-{max_cats}
- **Sequential entry:** Must fill positions sequentially (no skipping; VOID placements are treated as if they do not exist for validation. If a VOID appears before a filled placement, it does not block sequential entry.)
- **Duplicate check:** No duplicates within the same section of the final. VOID placements are treated as if they do not exist for validation. If a VOID appears in a row, it is ignored for duplicate checks. If a duplicate is found, the error is shown on all cells with the same value in that section (not just the last entered cell). The error message is: 'Duplicate cat number within this section of the final'.
- **Status validation:** Only KIT is allowed (always selected)
- **If a Cat # input is VOID, the status label is hidden (not rendered) for that cell.**
- **Voiding:** Voiding a cat number in any cell in a column voids all instances of that cat number in that column
- **Error display:** Errors are shown inline, with the same styling and precedence as the Premiership tab

## Super Specialty Cross-Column Validation
The Kitten tab includes Super Specialty cross-column validation for rings with exactly 3 columns (Longhair + Shorthair + Allbreed) with the same judge ID:

- **Title/Award Consistency**: KIT status must be consistent across all Super Specialty columns
- **Ranked Cats Priority**: Filler cats cannot be placed before ranked cats in the Allbreed column
- **Order Preservation Within Hair Length**: Cats from specialty columns must maintain their relative order when appearing in the Allbreed column
- **Cross-Column Duplicate Prevention**: A cat number cannot appear in both Longhair and Shorthair columns within the same Super Specialty ring

**Note**: Specialty Finals Consistency rule does not apply to Kitten tab as it has no finals sections.

## Error Precedence
For each cell, only the highest-precedence error is shown:
1. Duplicate error (within section of the final; shown on all cells with the same value; message: 'Duplicate cat number within this section of the final')
2. Range error (cat number not 1-{max_cats})
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
- **VOID placements are treated as if they do not exist for validation.** For sequential and duplicate checks, only non-empty, non-VOID placements are considered. If a VOID appears before a filled placement, it does not block sequential entry (i.e., it is as if the VOID row does not exist at all). This is enforced in both Kitten and Championship tabs for parity.
- **If a Cat # input is VOID, the status label is hidden (not rendered) for that cell, and only 'VOID' is saved/restored in the CSV.**
- This logic applies across the full column, matching Championship, Premiership, and Household Pet tabs. 

- Only filled rows require status 'KIT'.
- Empty rows (no cat number) are allowed and do not trigger errors.
- When importing from CSV, a blank Kitten section does not cause validation errors. 