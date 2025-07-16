# Championship Tab Validation Rules

> **2024-06-22: VOID Logic Refactor**
> - Voided ("VOID") cat numbers are now always ignored for all validation and error assignment in the Championship tab, matching KittenTab.
> - VOID cat numbers are never included in duplicate detection, sequential checks, status checks, or any other validation.
> - **VOID placements are treated as if they do not exist for validation.** For sequential and duplicate checks, only non-empty, non-VOID placements are considered. If a VOID appears before a filled placement, it does not block sequential entry (i.e., it is as if the VOID row does not exist at all). This matches KittenTab and is now enforced in both tabs.
> - This ensures full UI/UX and validation parity with KittenTab and prevents any errors from being shown for voided placements.

This document describes the **current validation rules** enforced in the Championship tab of the CFA Master Clerk Entry Tool.

## VOID Placement Handling (KittenTab Parity)

- **VOID placements are always ignored for all validation and ordering in the Championship tab.**
- This applies to:
  - Top 10/15 Show Awards: VOID rows are skipped for all validation, duplicate, and sequential entry logic.
  - Best AB CH, LH CH, SH CH finals: VOID placements are skipped for all required, order, and duplicate logic.
  - If a VOID is present in any position, it is treated as if that cell does not exist for all validation purposes.
- This matches the behavior in the KittenTab, ensuring full parity and user clarity.
- Example: If VOID is entered as Top 1, it is not considered for any validation or required placements below, and does not block or affect order/required logic for Top 15 or finals.

## Hair-Specific Breakpoint Logic

The Championship tab uses **hair-specific breakpoints** based on ring type:

### Allbreed Rings
- **Breakpoint**: Championship cats only (LH GC + SH GC + LH CH + SH CH) ≥ 85
- **Note**: Novices (NOV) are NOT included in the championship count for breakpoint calculation
- **If ≥ 85**: Top 15 positions, 5 Best AB CH, 5 Best LH CH, 5 Best SH CH
- **If < 85**: Top 10 positions, 3 Best AB CH, 3 Best LH CH, 3 Best SH CH

### Longhair Rings
- **Breakpoint**: LH championship cats (LH GC + LH CH) ≥ 85
- **If ≥ 85**: Top 15 positions, 5 Best LH CH
- **If < 85**: Top 10 positions, 3 Best LH CH
- **Note**: Best AB CH and Best SH CH sections are disabled (not applicable)

### Shorthair Rings
- **Breakpoint**: SH championship cats (SH GC + SH CH) ≥ 85
- **If ≥ 85**: Top 15 positions, 5 Best SH CH
- **If < 85**: Top 10 positions, 3 Best SH CH
- **Note**: Best AB CH and Best LH CH sections are disabled (not applicable)

## Validation Order and Structure

The Championship tab validation follows this order:

### 1. Show Awards Section (Top 10/15)
- **Cat number format**: Must be between 1-450 (except VOID, which is always ignored)
- **Sequential entry**: Must fill positions sequentially (no skipping, except VOID, which is always ignored; VOID placements are treated as if they do not exist for validation)
- **Duplicate check**: No duplicates within the same column (except VOID, which is always ignored; VOID placements are treated as if they do not exist for validation)
- **Status validation**: All three statuses (GC, CH, NOV) are allowed (except VOID, which is always ignored)

### 2. Finals Sections (Best AB CH, Best LH CH, Best SH CH)
- **Cat number format**: Must be between 1-450
- **Sequential entry**: Must fill positions sequentially (no skipping)
- **Duplicate check**: No duplicates within the same section/column
- **Cross-section duplicate check**: Same cat number cannot appear in both LH CH and SH CH sections
- **Status validation**: Cats listed as GC or NOV in Top 10/15 cannot be in Best CH sections

### 3. Column Relationship Validation
- **Status errors**: Cats listed as GC, NOV, MISSING, or INVALID in Top 10/15 trigger immediate errors
- **Best AB CH order**: Must match CH cats from Top 10/15 in the same order (when CHs exist in Top 10/15)
- **LH/SH assignment**: Each cat in Best AB CH must be assigned to either LH or SH section (reminder if not)
- **Best LH/SH CH validation**: Cats must not be GC, NOV, MISSING, or INVALID
- **Order validation (stricter rule as of 2024-06-22):**
  - All AB CH cats assigned to a specialty section (LH/SH CH) must be at the top, in the same order as Best AB CH.
  - Fillers (cats not in Best AB CH) can only appear after all AB CH cats.
  - If any filler appears before an AB CH cat, this is an error and will be flagged on the first offending cell.

#### Example: LH/SH CH Order (Top-Aligned)
Suppose Best AB CH is [3, 2].
- **Valid LH CH:** [3, 2, 5, 4] (3 and 2 are at the top, fillers 5 and 4 after)
- **Invalid LH CH:** [5, 3, 2] (5 is a filler above AB CH cats; error on 5)
- **Valid SH CH:** [2, 4] (2 is at the top, filler 4 after)
- **Invalid SH CH:** [4, 2] (4 is a filler above AB CH cat 2; error on 4)

## Eligibility Rules

- **Championship Final (Top 10/15):**
  - All three statuses are allowed: **GC** (Grand Champion), **CH** (Champion), **NOV** (Novice)
- **Best AB CH, Best LH CH, Best SH CH:**
  - **Only cats NOT listed as GC or NOV in the Top 10/15 section are eligible.**
  - Cats listed as **GC** (Grand Champion) or **NOV** (Novice) in the Top 10/15 section are **not eligible** for Best CH finals.
  - Cats not found in the Top 10/15 section or listed as **CH** (Champion) are assumed to be valid for Best CH finals.
  - If a GC or NOV cat from the Top 10/15 section is entered in any Best CH final, it triggers a validation error with the message: `"{catNumber} is listed as a {status} in Show Awards and cannot be awarded CH final."`

### CRITICAL: Best AB CH Validation Logic

**Best AB CH validation ONLY checks if cats are listed as GC or NOV in Show Awards:**

- **If a cat is listed as GC or NOV in Show Awards**: Error - cannot be in Best AB CH
- **If a cat is listed as CH in Show Awards**: Allowed - can be in Best AB CH
- **If a cat is NOT found in Show Awards**: Allowed - can be in Best AB CH
- **If a cat has missing or invalid status in Show Awards**: Error - cannot be in Best AB CH

**The validation does NOT require cats to be in the Top 10/15 CH cats list.** This is a common mistake that has been corrected. Cats can be used in Best AB CH as long as they are not explicitly listed as GC or NOV in Show Awards.

### Example
Suppose you have the following cats in the Championship Final (Top 10/15):

| Cat # | Status |
|-------|--------|
| 401   | GC     |
| 402   | CH     |
| 403   | NOV    |
| 404   | CH     |
| 405   | GC     |

- **Championship Final (Top 10/15):** All of these cats (GC, CH, NOV) are valid entries.
- **Best AB CH, Best LH CH, Best SH CH:** 
  - Only 402 and 404 (the CHs) are valid.
  - 401, 403, and 405 (GC or NOV) are **not** valid and will trigger validation errors if entered.
  - Error message for 401: "401 is listed as a GC in Show Awards and cannot be awarded CH final."
  - Error message for 403: "403 is listed as a NOV in Show Awards and cannot be awarded CH final."
  - **Cat 999 (not in Show Awards):** Allowed - can be used in Best AB CH

## Cross-Section Validation Rules

### Cross-Section Duplicate Validation (LH CH vs SH CH)
- **Rule**: The same cat number cannot appear in both the Longhair Champions Finals (LH CH) and Shorthair Champions Finals (SH CH) sections
- **Error Message**: "Duplicate: a cat cannot be both longhair and shorthair"
- **Validation Order**: This check occurs after within-section duplicate checks but before status validation
- **Scope**: Only applies to LH CH and SH CH sections (does not affect Best AB CH)
- **Example**: If cat #123 is entered in "Best LH CH" and also in "Best SH CH", both cells will show the error "Duplicate: a cat cannot be both longhair and shorthair"

### Best AB CH Assignment Reminder
- If a cat is entered in Best AB CH but not assigned to either LH or SH section, a reminder message appears: `"{catNumber} needs to be assigned to either LH or SH CH final."`
- **This reminder is now shown in every filled Best AB CH cell where the cat is not assigned to LH or SH CH final, regardless of other cells.**
- This matches the Premiership tab logic and ensures all unassigned cats are flagged.
- This logic avoids off-by-one errors and ensures the error appears in the correct cell, even if earlier cells are empty.
- This matches the behavior of the Premiership tab.

_Last Updated: 2024-06-20_

### Order Validation & Error Precedence (2024-06-21, strictly enforced)
- For each cell in Best AB CH, only the highest-precedence error is ever shown:
  1. **Duplicate error** (within section) - HIGHEST PRIORITY
  2. **Status error** (GC/NOV/MISSING/INVALID from Show Awards) - SECOND PRIORITY
  3. **Sequential entry error** ("You must fill previous placements before entering this position.") - THIRD PRIORITY
  4. **Order error** (e.g., "Must be X (Nth CH required by CFA rules)" or "Order violation: X is out of order in LH/SH CH. Must preserve the order from Best AB CH (subsequence required).") - FOURTH PRIORITY
  5. **Assignment reminder** (e.g., "needs to be assigned to LH/SH") - LOWEST PRIORITY
- Status errors (GC/NOV/MISSING/INVALID) are checked BEFORE sequential errors to ensure proper precedence.
- Sequential entry errors are checked AFTER status errors but BEFORE assignment reminders.
- Assignment reminder is only shown if all higher-priority errors are absent for that cell.
- This logic is now strictly enforced in code (see `validateColumnRelationships` in `championshipValidation.ts`).
- This matches the Premiership tab logic and ensures full UI/UX parity.

## Error Precedence and Validation Order (as of [DATE])

| Error Type                | When is it set?                                                                                 |
|--------------------------|-------------------------------------------------------------------------------------------------|
| Range error               | Always checked first.                                                                            |
| Duplicate error           | Set if duplicate found, merges with range error if both.                                         |
| Cross-section duplicate   | (Finals only) Set if cat appears in both LH and SH finals, only if no range/duplicate error.     |
| Status error              | (Finals only) Set if cat is not eligible for CH final, only if no range/duplicate/cross error.   |
| Sequential error          | Set only if there is NO range, duplicate, or cross-section duplicate error for that cell.        |
| Order error               | Set only if there is NO higher error for that cell.                                              |

**Note:** This matches PremiershipTab error precedence exactly as of [DATE].

## 2024-06-20: Strict Error Precedence Enforcement (updated)
- Assignment reminders are now only shown if there is no duplicate or GC/NOV error for that cell. This prevents multiple errors from appearing in the same cell and ensures clear, unambiguous UI feedback.

## Finals Error Precedence (Best AB CH, LH/SH CH)

- **Duplicate errors** (same cat number in multiple finals positions) are always assigned to all involved cells in the section (e.g., both "Best AB CH" and "3rd Best AB CH" if the same cat number is entered).
- **No other error** (status, sequential, order, reminder) will ever be shown in a cell if a duplicate error is present for that cell.
- This ensures that users always see the duplicate error in every cell involved, and never see a misleading or lower-precedence error in those cells.
- This logic matches the Premiership tab and is enforced in the validation code.

## Void Feature
- **NEW (2024-06-22):** Voided ("VOID") cat numbers are now always ignored for all validation and error assignment in the Championship tab, matching KittenTab.
- If a cat number is voided (entered as "VOID", case-insensitive) in any cell in a given column (ring), **all other cells in that column with the same cat number (across all CH award sections: Championship Final, Best AB CH, Best LH CH, Best SH CH) are also voided automatically**.
- **Voided ("VOID") cat numbers are never included in duplicate detection, sequential checks, status checks, or any other validation.**
- **VOID placements are treated as if they do not exist for validation.** For sequential and duplicate checks, only non-empty, non-VOID placements are considered. If a VOID appears before a filled placement, it does not block sequential entry (i.e., it is as if the VOID row does not exist at all). This matches KittenTab and is now enforced in both tabs.
- **No errors will ever be shown for a voided ("VOID") cat number.**
- If any of these voided checkboxes is unchecked, **all instances of that cat number in that column are unvoided**.
- This ensures the void state is always synchronized for all matching cat numbers in the same column.
- **This logic is now strictly enforced in the codebase (see `validateChampionshipTab` in `championshipValidation.ts`).**
- **Example:**
  - If you void cat #1 in Championship Final, Best AB CH, or Best LH CH in Ring 1, all other cells in Ring 1 with cat #1 will also be voided.
  - If you unvoid any of them, all will be unvoided.
- This logic is enforced in the UI and validation code.

## Duplicate Validation
- No duplicate cat numbers allowed within the same section (Championship Final, Best AB CH, Best LH CH, Best SH CH).
- Cross-section duplicates are allowed.

## Sequential Entry Validation
- Must fill positions sequentially (no skipping positions).

## Finals Validation
- Best AB CH, Best LH CH, Best SH CH: Only cats not listed as GC or NOV in Top 10/15 are allowed.
- No duplicates within the same section.
- Must fill positions sequentially.
- Must match order from Top 10/15 (where applicable).

## UI/UX Parity with Championship Tab

- The Championship tab serves as the reference implementation for UI/UX features.
- All UI/UX features are consistent:
  - "Jump to Ring" dropdown for quick navigation between judges/rings
  - Sticky headers for ring number, judge acronym, and ring type
  - Horizontally scrollable table with frozen position column
  - Paging/scrolling for large numbers of judges
  - Ring glow effect for focused/jumped-to columns
  - Voiding logic is column-local and visually identical
  - Error highlighting, tooltips, and inline error messages match Championship tab
  - All action buttons are placed and styled identically
  - Keyboard navigation and accessibility features are present and consistent

## Validation Parity with Championship Tab

The Championship tab serves as the reference implementation for validation logic:

- **Same validation order**: Format → Sequential → Duplicate → Status/Eligibility → Cross-section/Assignment → Order → Reminders
- **Same error messages**: All error messages follow the same format and structure
- **Same relationship checks**: All cross-section and assignment validations are identical
- **Same precedence rules**: Error priorities and short-circuiting logic match exactly
- **Same helper functions**: All validation utilities have equivalent implementations

## Documentation Note
- The CSV action buttons and their logic are shared across all tabs. See `docs/specs/FOLDER_STRUCTURE.md` for details.

## Last Updated
- 2024-06-20 (Assignment reminder error placement fix in Best AB CH)
- 2024-06-19 (UI/UX parity with Championship tab)
- 2024-12-19 (Complete validation parity with Championship tab - all rules, order, and error messages now match exactly)

## 2024-06-09: Infinite Recursion Bug Fixed
- Fixed a critical bug in `validateColumnRelationships` where the function would recursively call itself for all columns, causing a stack overflow (maximum call stack size exceeded).
- The function now only validates the current column, as intended, and does not call itself recursively.
- This prevents stack overflow errors and ensures stable validation logic.

## 2024-06-10: Bugfix - Assignment Reminder Display

- Fixed a bug where the 'assign to LH/SH' reminder for Best AB CH did not appear in the UI due to an error key mismatch in the validation logic.
- The error key for the reminder must be 'champions-{columnIndex}-{i}' to match the UI's expectations. If the key does not match, the reminder will not display.
- This fix ensures that the reminder now appears in every filled Best AB CH cell where the cat is not assigned to either LH or SH, unless a higher-precedence error is present.

## 2024-06-20: Assignment Reminder Error Placement Fix & Precedence Patch

- Fixed assignment reminder error placement in Best AB CH. The 'needs to be assigned to either LH or SH CH final' error is now always shown in the cell where the cat is entered and not assigned, using the actual position index. This prevents off-by-one errors (where the error would appear in the previous/empty cell) and matches the Premiership tab behavior.
- **Assignment reminders are now always suppressed in the cell with a duplicate or GC/NOV error. Duplicate errors always take precedence over reminders.**
- This ensures the assignment reminder always appears in the correct cell, providing clear and accurate feedback to the user and maintaining UI/UX parity between tabs.

### Voiding Logic (2024-06-20, strictly enforced)
- If a cat number is voided in any cell in a given column (ring), **all other cells in that column with the same cat number (across all CH award sections: Championship Final, Best AB CH, Best LH CH, Best SH CH) are also voided automatically**.
- If any of these voided checkboxes is unchecked, **all instances of that cat number in that column are unvoided**.
- This ensures the void state is always synchronized for all matching cat numbers in the same column.
- **This logic is now strictly enforced in the codebase (see `updateVoidStateColumnWide` in `ChampionshipTab.tsx`).**
- **Example:**
  - If you void cat #1 in Championship Final, Best AB CH, or Best LH CH in Ring 1, all other cells in Ring 1 with cat #1 will also be voided.
  - If you unvoid any of them, all will be unvoided.
- This logic is enforced in the UI and validation code.

## 2024-12-19: Key Format Fix - Duplicate Error Detection Now Working

**CRITICAL FIX**: The Championship tab now correctly detects and displays duplicate errors because the validation functions use the correct key format.

### Root Cause
The validation functions were using incorrect key formats:
- **Data Storage**: Keys like `"0-0"`, `"0-1"`, `"0-2"` (columnIndex-position)
- **Validation Expected**: Keys like `"champions-0-0"`, `"champions-0-1"` (section-columnIndex-position)

This mismatch prevented duplicate error detection from working.

### Fix Applied
Updated `validateChampionshipTab` and `validateColumnRelationships` functions to use the correct key format:
- **Before**: `const key = \`champions-${columnIndex}-${position}\`;`

## Cat # Validation Order by Section (as of [today's date])

| Section         | Validation Order (Current)                                                                 |
|----------------|--------------------------------------------------------------------------------------------|
| Top 10/15      | VOID → format → duplicate (full-form) → sequential                                         |
| AB/LH/SH CH    | VOID → format → duplicate (full-form) → sequential → status → order → assignment reminder  |

- **Note:** In all sections, duplicate errors always take precedence over sequential errors. In finals sections, after sequential, status, order, and assignment checks are performed, but only the highest-precedence error is shown for each cell. This matches the current code and is strictly enforced in the validation logic. See the Error Precedence section below for details. See VALIDATION_CHANGELOG.md for rationale and history.

> **2024-06-20:** AB/LH/SH CH finals validation logic now matches PremiershipTab finals logic exactly, including error precedence, sequential error logic, and assignment reminder. See table below for error order.

| Error Type                | When is it set?                                                                                 |
|--------------------------|-------------------------------------------------------------------------------------------------|
| Range error               | Always checked first.                                                                            |
| Duplicate error           | Set if duplicate found, merges with range error if both.                                         |
| Cross-section duplicate   | (Finals only) Set if cat appears in both LH and SH finals, only if no range/duplicate error.     |
| Status error              | (Finals only) Set if cat is not eligible for CH final, only if no range/duplicate/cross error.   |
| Sequential error          | Set only if there is NO range, duplicate, or status error for that cell.                         |
| Order error               | Set only if there is NO higher error for that cell.                                              |
| Assignment reminder       | (AB only) Set only if there is NO higher error for that cell.                                    |

> **2024-06-20:** Order errors for Best AB CH are now only set if the cell is filled and incorrect, not for empty cells, matching PremiershipTab logic. No order error is shown for empty Best AB CH cells.
