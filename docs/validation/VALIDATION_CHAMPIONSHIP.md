# Championship Tab Validation Rules

This document describes the **current validation rules** enforced in the Championship tab of the CFA Master Clerk Entry Tool.

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
- **Cat number format**: Must be between 1-450
- **Sequential entry**: Must fill positions sequentially (no skipping)
- **Duplicate check**: No duplicates within the same column
- **Status validation**: All three statuses (GC, CH, NOV) are allowed

### 2. Finals Sections (Best AB CH, Best LH CH, Best SH CH)
- **Cat number format**: Must be between 1-450
- **Sequential entry**: Must fill positions sequentially (no skipping)
- **Duplicate check**: No duplicates within the same section/column
- **Status validation**: Cats listed as GC or NOV in Top 10/15 cannot be in Best CH sections

### 3. Column Relationship Validation
- **Status errors**: Cats listed as GC, NOV, MISSING, or INVALID in Top 10/15 trigger immediate errors
- **Best AB CH order**: Must match CH cats from Top 10/15 in the same order (when CHs exist in Top 10/15)
- **LH/SH assignment**: Each cat in Best AB CH must be assigned to either LH or SH section (reminder if not)
- **Best LH/SH CH validation**: Cats must not be GC, NOV, MISSING, or INVALID
- **Order validation**: Best LH/SH CH cats must appear in the same order as Best AB CH
- **Single specialty strict validation**: For Longhair/Shorthair only rings, strict order validation with Top 10/15

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

### Best AB CH Assignment Reminder
- If a cat is entered in Best AB CH but not assigned to either LH or SH section, a reminder message appears: `"{catNumber} must be assigned to either Longhair or Shorthair section."`
- This reminder only appears if all previous Best AB CH positions are filled and there are no other errors.

### Order Validation
- **Best AB CH**: Must contain CH cats from Top 10/15 in the same order (when CHs exist in Top 10/15)
- **Best LH/SH CH**: Cats must appear in the same order as they appear in Best AB CH
- **Single Specialty**: For Longhair/Shorthair only rings, strict order validation with Top 10/15

### Error Precedence and Reminder Suppression (2024-06-09)

- **Sequential entry errors** ("You must fill in previous empty award placements...") now take precedence over all other errors and reminders in Best AB CH.
- **Assignment reminders** (e.g., "needs to be assigned to either LH or SH CH final") are **suppressed** for all positions at or before the highest sequential error position in a column.
- This ensures that if a sequential error exists for a later position, no reminder will show for earlier empty positions.
- This matches the intended UI/UX: reminders only appear if all previous positions are filled and there are no sequential errors for later positions.

1. **Format errors** (cat number must be 1-450)
2. **Sequential entry errors** (must fill positions sequentially)
3. **Duplicate errors** (no duplicates within section)
4. **Status errors** (GC/NOV/MISSING/INVALID cats cannot be in Best CH)
5. **Order errors** (must match Top 10/15 order)
6. **Assignment reminders** (must assign to LH/SH)

## Void Feature
- Works exactly as in Championship tab: voiding a cat number only affects all instances of that cat number within the same column (judge/ring), not across all columns.
- Voided inputs participate in validation normally.

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
- 2024-06-19 (UI/UX parity with Championship tab)
- 2024-12-19 (Complete validation parity with Championship tab - all rules, order, and error messages now match exactly)

## 2024-06-09: Infinite Recursion Bug Fixed
- Fixed a critical bug in `validateColumnRelationships` where the function would recursively call itself for all columns, causing a stack overflow (maximum call stack size exceeded).
- The function now only validates the current column, as intended, and does not call itself recursively.
- This prevents stack overflow errors and ensures stable validation logic. 