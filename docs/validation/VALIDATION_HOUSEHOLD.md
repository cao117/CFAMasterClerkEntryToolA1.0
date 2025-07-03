# Household Pet Tab Validation Rules

This document describes the **current validation rules** enforced in the Household Pet tab of the CFA Master Clerk Entry Tool.

## UI/UX Structure
- The Household Pet tab is visually and functionally identical to the Kitten tab, except for the following reductions:
  - Only one section: **Top 10/15 Household Pets** (no finals or sub-sections)
  - Columns are dynamically generated from the General tab judges/ring types (one per judge, regardless of ring type)
  - Only one status: **HHP** (Household Pet), always selected in the dropdown
  - Four action buttons at the bottom: Save to Temp CSV, Generate Final CSV, Restore from CSV, Reset (shared logic)
  - Voiding logic, error display, keyboard navigation, and all styling match the Kitten tab exactly

## Breakpoint Logic
- **Breakpoint:** 50 household pets (total)
  - If **≥50 household pets**: Top 15 positions
  - If **<50 household pets**: Top 10 positions
  - All columns use the same row count, regardless of ring type

## Validation Rules
- **Cat number format:** Must be between 1-450
- **Sequential entry:** Must fill positions sequentially (no skipping)
- **Duplicate check:** No duplicates within the same column
- **Status validation:** Only HHP is allowed (always selected)
- **Voiding:** Voiding a cat number in any cell in a column voids all instances of that cat number in that column
- **Error display:** Errors are shown inline, with the same styling and precedence as the Kitten tab

## Error Precedence
For each cell, only the highest-precedence error is shown:
1. Duplicate error (within column)
2. Range error (cat number not 1-450)
3. Sequential entry error ("You must fill previous placements before entering this position.")
4. Status error (should always be HHP)

## Parity with Kitten Tab
- All UI/UX, error display, voiding, and keyboard navigation are identical to the Kitten tab
- Only the number of sections and allowed status differ

## Last Updated
- 2024-06-22 