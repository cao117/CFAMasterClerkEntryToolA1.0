# Premiership Tab Validation Rules

This document describes the **current validation rules** enforced in the Premiership tab of the CFA Master Clerk Entry Tool.

## Hair-Specific Breakpoint Logic

The Premiership tab uses **hair-specific breakpoints** based on ring type:

### Allbreed Rings
- **Breakpoint**: Premiership cats only (LH GP + SH GP + LH PR + SH PR) ≥ 50
- **Note**: Novices (NOV) are NOT included in the premiership count for breakpoint calculation
- **If ≥ 50**: Top 15 positions, 3 Best AB PR, 3 Best LH PR, 3 Best SH PR
- **If < 50**: Top 10 positions, 2 Best AB PR, 2 Best LH PR, 2 Best SH PR

### Longhair Rings
- **Breakpoint**: LH premiership cats (LH GP + LH PR) ≥ 50
- **If ≥ 50**: Top 15 positions, 3 Best LH PR
- **If < 50**: Top 10 positions, 2 Best LH PR
- **Note**: Best AB PR and Best SH PR sections are disabled (not applicable)

### Shorthair Rings
- **Breakpoint**: SH premiership cats (SH GP + SH PR) ≥ 50
- **If ≥ 50**: Top 15 positions, 3 Best SH PR
- **If < 50**: Top 10 positions, 2 Best SH PR
- **Note**: Best AB PR and Best LH PR sections are disabled (not applicable)

## Validation Order and Structure

The Premiership tab validation follows the **exact same order and structure** as the Championship tab, with only the necessary differences in terminology and breakpoints:

### 1. Show Awards Section (Top 10/15)
- **Cat number format**: Must be between 1-450
- **Sequential entry**: Must fill positions sequentially (no skipping)
- **Duplicate check**: No duplicates within the same column
- **Status validation**: All three statuses (GP, PR, NOV) are allowed

### 2. Finals Sections (Best AB PR, Best LH PR, Best SH PR)
- **Cat number format**: Must be between 1-450
- **Sequential entry**: Must fill positions sequentially (no skipping)
- **Duplicate check**: No duplicates within the same section/column
- **Status validation**: Cats listed as GP or NOV in Top 10/15 cannot be in Best PR sections

### 3. Column Relationship Validation
- **Status errors**: Cats listed as GP, NOV, MISSING, or INVALID in Top 10/15 trigger immediate errors
- **Best AB PR order**: Must match PR cats from Top 10/15 in the same order
- **LH/SH assignment**: Each cat in Best AB PR must be assigned to either LH or SH section (reminder if not)
- **Best LH/SH PR validation**: Cats must not be GP, NOV, MISSING, or INVALID
- **Order validation**: Best LH/SH PR cats must appear in the same order as Best AB PR
- **Single specialty strict validation**: For Longhair/Shorthair only rings, strict order validation with Top 10/15

## Eligibility Rules

- **Premiership Final (Top 10/15):**
  - All three statuses are allowed: **GP** (Grand Premier), **PR** (Premier), **NOV** (Novice)
- **Best AB PR, Best LH PR, Best SH PR:**
  - **Only cats NOT listed as GP or NOV in the Top 10/15 section are eligible.**
  - Cats listed as **GP** (Grand Premier) or **NOV** (Novice) in the Top 10/15 section are **not eligible** for Best PR finals.
  - Cats not found in the Top 10/15 section or listed as **PR** (Premier) are assumed to be valid for Best PR finals.
  - If a GP or NOV cat from the Top 10/15 section is entered in any Best PR final, it triggers a validation error with the message: `"{catNumber} is listed as a {status} in Show Awards and cannot be awarded PR final."`
  - **If a cat number is not found in the Top 10/15 section, it is allowed in Best PR finals (unless it is found as GP or NOV). Only show errors for cats found in Top 10/15 as GP, NOV, MISSING, or INVALID.**
  - **This matches the Championship tab logic exactly.**

### Example
Suppose you have the following cats in the Premiership Final (Top 10/15):

| Cat # | Status |
|-------|--------|
| 401   | GP     |
| 402   | PR     |
| 403   | NOV    |
| 404   | PR     |
| 405   | GP     |

- **Premiership Final (Top 10/15):** All of these cats (GP, PR, NOV) are valid entries.
- **Best AB PR, Best LH PR, Best SH PR:** 
  - Only 402 and 404 (the PRs) are valid.
  - 401, 403, and 405 (GP or NOV) are **not** valid and will trigger validation errors if entered.
  - Error message for 401: "401 is listed as a GP in Show Awards and cannot be awarded PR final."
  - Error message for 403: "403 is listed as a NOV in Show Awards and cannot be awarded PR final."

## Cross-Section Validation Rules

### Best AB PR Assignment Reminder
- If a cat is entered in Best AB PR but not assigned to either LH or SH section, a reminder message appears: `"{catNumber} must be assigned to either Longhair or Shorthair section."`
- **This reminder only appears if all previous Best AB PR positions are filled and there are no other errors for that cell (e.g., status errors for GP/NOV take precedence and block the reminder).**

### Order Validation & Error Precedence (2024-06-21, strictly enforced)
- For each cell in Best AB PR, only the highest-precedence error is ever shown:
  1. Duplicate error (within section)
  2. Status error (GP/NOV from Show Awards)
  3. Sequential entry error (e.g., "You must fill in previous empty award placements in Best AB PR Final before entering this position.")
  4. Order error (e.g., "Must be X (Nth PR required by CFA rules)")
  5. Assignment reminder (e.g., "must be assigned to either Longhair or Shorthair section")
- The assignment reminder is only shown if there is no duplicate, status, or sequential entry error for that cell.
- This logic is now strictly enforced in code (see `validatePremiershipTab` in `premiershipValidation.ts`).
- This matches the Championship tab logic and ensures full UI/UX parity.

### Error Precedence (2024-06-20, strictly enforced)
- For each cell in **Best AB PR**, **Best LH PR**, and **Best SH PR**, only the highest-precedence error is ever shown:
  1. Duplicate error (within section)
  2. GP/NOV/MISSING/INVALID status error (from Show Awards)
  3. Assignment reminder (e.g., "must be assigned to LH/SH")
- **Assignment reminders are only shown if there is no duplicate or status error for that cell.**
- This strict order is now enforced in code and UI for all PR award sections, matching the Championship tab logic.

## Void Feature
- Works exactly as in Championship tab: voiding a cat number only affects all instances of that cat number within the same column (judge/ring), not across all columns.
- Voided inputs participate in validation normally.

## Duplicate Validation
- No duplicate cat numbers allowed within the same section (Premiership Final, Best AB PR, Best LH PR, Best SH PR).
- Cross-section duplicates are allowed.

## Sequential Entry Validation
- Must fill positions sequentially (no skipping positions).

## Finals Validation
- Best AB PR, Best LH PR, Best SH PR: Only cats not listed as GP or NOV in Top 10/15 are allowed.
- No duplicates within the same section.
- Must fill positions sequentially.
- Must match order from Top 10/15 (where applicable).

## UI/UX Parity with Championship Tab

- The Premiership tab is a full visual and functional replica of the Championship tab, except for the underlying rules and award labels.
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
- Only the rules for eligibility, breakpoints, and award labels differ (see above for details).

## Validation Parity with Championship Tab

The Premiership tab now has **complete validation parity** with the Championship tab:

- **Same validation order**: Format → Sequential → Duplicate → Status/Eligibility → Cross-section/Assignment → Order → Reminders
- **Same error messages**: All error messages follow the same format and structure
- **Same relationship checks**: All cross-section and assignment validations are identical
- **Same precedence rules**: Error priorities and short-circuiting logic match exactly
- **Same helper functions**: All validation utilities have equivalent implementations

The only differences are:
- Terminology: "Premier" instead of "Champion", "Grand Premier" instead of "Grand Champion"
- Breakpoints: Hair-specific breakpoints for Premiership vs. unified breakpoints for Championship
- Status values: GP/PR/NOV for Premiership vs. GC/CH/NOV for Championship

## Documentation Note
- The CSV action buttons and their logic are shared across all tabs. See `docs/specs/FOLDER_STRUCTURE.md` for details.

## Last Updated
- 2024-06-19 (UI/UX parity with Championship tab)
- 2024-12-19 (Complete validation parity with Championship tab - all rules, order, and error messages now match exactly)

### Debug Logging for Validation (2024-06-19)
- Winston-style debug logging has been added to the Premiership validation logic.
- Logs are emitted for:
  - When a hard error (GP/NOV) is detected for Best AB PR
  - When a reminder is considered and whether it is suppressed due to a hard error
  - The final error object for each column after validation
- This logging helps trace validation precedence and ensures that error merging and suppression work as intended.

## Best AB PR Hard Error Precedence (2024-06-09)
- The validation for Best AB PR now searches all columns' Show Awards for the cat number, not just the current column.
- If a cat is listed as GP, NOV, has an invalid, or missing status in any column's Show Awards, a hard error is shown and assignment reminders are suppressed.
- This matches the logic in the Championship tab and ensures error precedence is correct.

## 2024-06-19: Assignment Reminder Precedence Patch

- Fixed error precedence so that assignment reminders are always suppressed in the cell with a duplicate or GP/NOV error. Duplicate errors always take precedence over reminders. This matches the Championship tab logic and ensures UI/UX parity.

### Voiding Logic (2024-06-20, strictly enforced)
- If a cat number is voided in any cell in a given column (ring), **all other cells in that column with the same cat number (across all PR award sections: Premiership Final, Best AB PR, Best LH PR, Best SH PR) are also voided automatically**.
- If any of these voided checkboxes is unchecked, **all instances of that cat number in that column are unvoided**.
- This ensures the void state is always synchronized for all matching cat numbers in the same column.
- **Example:**
  - If you void cat #1 in Premiership Final, Best AB PR, or Best LH PR in Ring 1, all other cells in Ring 1 with cat #1 will also be voided.
  - If you unvoid any of them, all will be unvoided.
- This logic is enforced in the UI and validation code.

## Bug Fixes & Technical Notes

### 2024-06-21: Controlled Input Warning Fix
- All cat number input fields in the Premiership tab are now always controlled (never undefined or null). This prevents React's warning about changing a controlled input to uncontrolled, ensuring robust state management and a consistent user experience.
- This fix applies to all cat number fields in Show Awards, Best AB PR, Best LH PR, and Best SH PR sections.

## Column Reset on Ring Type Change

- If a judge's ring type is changed to any other type (regardless of the old or new type), the affected columns in the Premiership tab are reset: all data for those columns is cleared and the columns start empty.
- This ensures that data from the previous configuration does not persist when the number or type of columns changes for a judge.
- Other judges' columns and data are not affected.

_Last Updated: 2024-06-22_ 