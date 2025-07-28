# Premiership Tab Validation Rules

**[2024-06-22] Validation logic fully refactored for strict error precedence and code parity with Championship tab.**
- All validation logic is now implemented in `validatePremiershipTab` in `premiershipValidation.ts`.
- Strict error precedence is enforced: **duplicate > status (GP/NOV/MISSING/INVALID) > sequential > assignment reminder**.
- All error keys and data keys use section prefixes and hyphens (e.g., `abPremiers-0-1`).
- There are exactly four duplicate check functions, one per section.
- Debug logging is present at all critical validation and error-merging points.
- Documentation and code are now in full parity with the Championship tab, except for PR/GP/NOV domain differences and 50/15/10/3/2 breakpoints.

## Hair-Specific Breakpoint Logic

The Premiership tab uses **hair-specific breakpoints** based on ring type:

### Allbreed Rings
- **Breakpoint**: Premiership cats + Novices (LH GP + SH GP + LH PR + SH PR + LH NOV + SH NOV) ≥ 50
- **Note**: Novices (NOV) ARE included in the premiership count for breakpoint calculation
- **If ≥ 50**: Top 15 positions, 3 Best AB PR, 3 Best LH PR, 3 Best SH PR
- **If < 50**: Top 10 positions, 2 Best AB PR, 2 Best LH PR, 2 Best SH PR

### Longhair Rings
- **Breakpoint**: LH premiership cats + LH novices (LH GP + LH PR + LH NOV) ≥ 50
- **Note**: LH novices ARE included in the longhair count for breakpoint calculation
- **If ≥ 50**: Top 15 positions, 3 Best LH PR
- **If < 50**: Top 10 positions, 2 Best LH PR
- **Note**: Best AB PR and Best SH PR sections are disabled (not applicable)

### Shorthair Rings
- **Breakpoint**: SH premiership cats + SH novices (SH GP + SH PR + SH NOV) ≥ 50
- **Note**: SH novices ARE included in the shorthair count for breakpoint calculation
- **If ≥ 50**: Top 15 positions, 3 Best SH PR
- **If < 50**: Top 10 positions, 2 Best SH PR
- **Note**: Best AB PR and Best LH PR sections are disabled (not applicable)

## Validation Order and Structure

The Premiership tab validation follows the **exact same order and structure** as the Championship tab, with only the necessary differences in terminology and breakpoints:

### 1. Show Awards Section (Top 10/15)
- **Cat number format**: Must be between 1-450
- **Sequential entry**: Must fill positions sequentially (no skipping). The error is only shown on the first empty cell after the last filled cell in each column, and never on filled cells.
- **Duplicate check**: No duplicates within the same column
- **Status validation**: All three statuses (GP, PR, NOV) are allowed

### 2. Finals Sections (Best AB PR, Best LH PR, Best SH PR)
- **Cat number format**: Must be between 1-450
- **Sequential entry**: Must fill positions sequentially (no skipping)
- **Duplicate check**: No duplicates within the same section/column
- **Cross-section duplicate check**: Same cat number cannot appear in both LH PR and SH PR sections
- **Status validation**: Cats listed as GP or NOV in Top 10/15 cannot be in Best PR sections

### 3. Column Relationship Validation
- **Status errors**: Cats listed as GP, NOV, MISSING, or INVALID in Top 10/15 trigger immediate errors
- **Best AB PR order**: Must match PR cats from Top 10/15 in the same order
- **LH/SH assignment**: Each cat in Best AB PR must be assigned to either LH or SH section (reminder if not)
- **Best LH/SH PR validation**: Cats must not be GP, NOV, MISSING, or INVALID
- **Order validation (stricter rule as of 2024-06-22):**
  - All AB PR cats assigned to a specialty section (LH/SH PR) must be at the top, in the same order as Best AB PR.
  - Fillers (cats not in Best AB PR) can only appear after all AB PR cats.
  - If any filler appears before an AB PR cat, this is an error and will be flagged on the first offending cell.

#### Example: LH/SH PR Order (Top-Aligned)
Suppose Best AB PR is [8, 6].
- **Valid LH PR:** [8, 6, 9] (8 and 6 are at the top, filler 9 after)
- **Invalid LH PR:** [9, 8, 6] (9 is a filler above AB PR cats; error on 9)
- **Valid SH PR:** [6, 7] (6 is at the top, filler 7 after)
- **Invalid SH PR:** [7, 6] (7 is a filler above AB PR cat 6; error on 7)

- **Single specialty strict validation**: For Longhair/Shorthair only rings, strict order validation with Top 10/15

## Eligibility Rules

- **Premiership Final (Top 10/15):**
  - All three statuses are allowed: **GP** (Grand Premier), **PR** (Premier), **NOV** (Novice)
- **Best AB PR, Best LH PR, Best SH PR:**
  - **Only cats NOT listed as GP or NOV in the Top 10/15 section are eligible.**
  - Cats listed as **GP** (Grand Premier) or **NOV** (Novice) in the Top 10/15 section are **not eligible** for Best PR finals.
  - Cats not found in the Top 10/15 section or listed as **PR** (Premier) are assumed to be valid for Best PR finals.
  - If a GP or NOV cat from the Top 10/15 section is entered in any Best PR final, it triggers a validation error with the message: `"{catNumber} is listed as a {status} in Show Awards and cannot be awarded PR final."`
  - **Status checks for Best AB PR, LH PR, and SH PR search all columns' Show Awards for the cat number, not just the current column. If a cat is GP or NOV in any judge's Top 10/15, it is ineligible for Best PR finals in all columns.**
  - **If a cat number is not found in the Top 10/15 section, it is allowed in Best PR finals (unless it is found as GP or NOV). Only show errors for cats found in Top 10/15 as GP, NOV, MISSING, or INVALID.**
  - **This matches the Championship tab logic exactly.**

### Example
Suppose you have the following cats in the Premiership Final (Top 10/15):

| Cat # | Status (Ring 1) | Status (Ring 2) |
|-------|-----------------|-----------------|
| 401   | GP              | PR              |
| 402   | PR              | PR              |
| 403   | NOV             | PR              |
| 404   | PR              | GP              |
| 405   | GP              | GP              |

- **If cat 401 is entered in Best AB PR in any column, it is ineligible (GP in Ring 1).**
- **If cat 404 is entered in Best AB PR in any column, it is ineligible (GP in Ring 2).**
- **If cat 402 is entered in Best AB PR in any column, it is eligible (PR in all columns).**

## Cross-Section Validation Rules

### Cross-Section Duplicate Validation (LH PR vs SH PR)
- **Rule**: The same cat number cannot appear in both the Longhair Premier Finals (LH PR) and Shorthair Premier Finals (SH PR) sections
- **Error Message**: "Duplicate: a cat cannot be both longhair and shorthair"
- **Validation Order**: This check occurs after within-section duplicate checks but before status validation
- **Scope**: Only applies to LH PR and SH PR sections (does not affect Best AB PR)
- **Example**: If cat #123 is entered in "Best LH PR" and also in "Best SH PR", both cells will show the error "Duplicate: a cat cannot be both longhair and shorthair"

### Best AB PR Assignment Reminder
- If a cat is entered in Best AB PR but not assigned to either LH or SH section, a reminder message appears: `"{catNumber} must be assigned to either Longhair or Shorthair section."`
- **This reminder only appears if all previous Best AB PR positions are filled and there are no other errors for that cell (e.g., status errors for GP/NOV take precedence and block the reminder).**

### Duplicate Checks
- There are exactly **four** duplicate check functions, one for each section:
  - `checkDuplicateCatNumbersInShowAwards` (Top 15)
  - `checkDuplicateCatNumbersInABPremiersFinals` (Best AB PR)
  - `checkDuplicateCatNumbersInLHPremiersFinals` (Best LH PR)
  - `checkDuplicateCatNumbersInSHPremiersFinals` (Best SH PR)
- **No redundant or legacy duplicate check functions remain.**

### Error Precedence (Finals Sections)
- For each cell in Best AB PR, Best LH PR, and Best SH PR, only the highest-precedence error is ever shown:
  1. **Duplicate error** (within section, highest priority)
  2. **Status error** (GP/NOV/MISSING/INVALID from Show Awards)
  3. **Sequential entry error** ("You must fill previous placements before entering this position.")
  4. **Assignment reminder** (e.g., "must be assigned to either Longhair or Shorthair section")
- The assignment reminder is only shown if there is no duplicate, status, or sequential entry error for that cell.
- This logic is now strictly enforced in code (see `validatePremiershipTab` in `premiershipValidation.ts`).
- Debug logging is present in the validation code to trace error assignment and precedence.

### Error Precedence (2024-06-20, strictly enforced)
- For each cell in **Best AB PR**, **Best LH PR**, and **Best SH PR**, only the highest-precedence error is ever shown:
  1. Duplicate error (within section)
  2. GP/NOV/MISSING/INVALID status error (from Show Awards)
  3. Assignment reminder (e.g., "must be assigned to LH/SH")
- **Assignment reminders are only shown if there is no duplicate or status error for that cell.**
- This strict order is now enforced in code and UI for all PR award sections, matching the Championship tab logic.

## Error Precedence (Finals Sections)
- For each cell in Best AB PR, Best LH PR, and Best SH PR, only the highest-precedence error is ever shown:
  1. Range error (cat number not 1-450)
  2. Duplicate error (within section, highest priority)
  3. Cross-section duplicate error (LH PR vs SH PR) - "Duplicate: a cat cannot be both longhair and shorthair"
  4. Status error (GP/NOV/MISSING/INVALID from Show Awards)
  5. Sequential entry error ("You must fill previous placements before entering this position.")
  6. **Order error** (e.g., "Must be X (Nth PR required by CFA rules)" or "Order violation: X is out of order in LH/SH PR. Must preserve the order from Best AB PR (subsequence required).")
  7. Assignment reminder (e.g., "must be assigned to either Longhair or Shorthair section")
- **Order errors are now enforced for all finals sections (Best AB PR, LH PR, SH PR) after range, duplicate, status, and sequential errors, and only shown if no higher-precedence error is present.**
- Debug logging is present for order errors to aid in tracing error assignment and merging.
- This matches the logic and error precedence of the Championship tab.

### Example
If the 1st PR in Show Awards is cat #402, but the 1st Best AB PR is cat #404, an order error will appear: "Must be 402 (1st PR required by CFA rules)".

## Void Feature
- Works exactly as in Championship tab: voiding a cat number only affects all instances of that cat number within the same column (judge/ring), not across all columns.
- Voided inputs participate in validation normally.

## VOID Placement Handling (ChampionshipTab Parity)

- **VOID placements are always ignored for all validation and ordering in the Premiership tab.**
- This applies to:
  - Top 10/15 Show Awards: VOID rows are skipped for all validation, duplicate, and sequential entry logic.
  - Best AB PR, LH PR, SH PR finals: VOID placements are skipped for all required, order, and duplicate logic.
  - If a VOID is present in any position, it is treated as if that cell does not exist for all validation purposes.
- This matches the logic in the Championship tab for full parity and user clarity.

## Duplicate Validation
- No duplicate cat numbers allowed within the same section (Premiership Final, Best AB PR, Best LH PR, Best SH PR).
- Cross-section duplicates are allowed.

## Sequential Entry Validation
- Must fill positions sequentially (no skipping positions).

## Sequential Placement and VOID Handling

- In all awards and finals sections (including Best AB PR, Best LH PR, Best SH PR), if a placement is marked as VOID, it is treated as a valid skip for sequential placement validation.
- This means you can have, for example:

  | 1st | 2nd  | 3rd |
  |-----|------|------|
  | #1  | VOID | #2   |

  and this is valid. You will NOT get a 'fill previous placements' error for #2.
- This matches the behavior in the Top 10/15 section, where VOID is also a valid skip.

**Example:**
- Valid: 1st: 101, 2nd: VOID, 3rd: 102
- Invalid: 1st: (empty), 2nd: VOID, 3rd: 102 (error: must fill 1st before 3rd)

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

## 2024-06-22: Stricter Cat Number Validation & Error Precedence Refactor
- Cat numbers must now be all digits (no letters or symbols) and in the range 1-450.
- Any non-integer input (e.g., '15a', '1.5', 'abc') is now rejected as invalid.
- Finals and Show Awards: error precedence is now range > duplicate > status (GP/NOV) > sequential > order > assignment reminder (Best AB PR only).
- If both range and duplicate errors are present, both are shown (range first).
- If a higher-precedence error is present, all lower-precedence errors are suppressed.
- Debug logging is present for all error assignment and merging steps.

## Bug Fixes & Technical Notes

### 2024-06-21: Controlled Input Warning Fix
- All cat number input fields in the Premiership tab are now always controlled (never undefined or null). This prevents React's warning about changing a controlled input to uncontrolled, ensuring robust state management and a consistent user experience.
- This fix applies to all cat number fields in Show Awards, Best AB PR, Best LH PR, and Best SH PR sections.

## Column Reset on Ring Type Change

- If a judge's ring type is changed to any other type (regardless of the old or new type), the affected columns in the Premiership tab are reset: all data for those columns is cleared and the columns start empty.
- This ensures that data from the previous configuration does not persist when the number or type of columns changes for a judge.
- Other judges' columns and data are not affected.

_Last Updated: 2024-06-22_ 

## Order Validation for Best LH PR and SH PR
- The order of cats in Best LH PR and Best SH PR must be a **subsequence** of the order in Best AB PR (relative order preserved).
- You may select any subset of AB PR cats for LH/SH PR, but their order must match the order in AB PR.
- If the order is violated (i.e., a cat appears before another cat that comes after it in AB PR), an order error is shown on the first cell where the violation occurs.
- This matches the logic in the Championship tab for LH/SH CH order validation.

### Example
Suppose Best AB PR (in order) is: 1, 2, 3
- **Valid LH PR:** 2, 3 (order preserved, subset)
- **Valid LH PR:** 1, 2 (order preserved, subset)
- **Invalid LH PR:** 2, 1 (order violated; error on '1')
- **Invalid LH PR:** 3, 2, 1 (order violated; error on '2' and '1')

The error message will appear on the first cell where the order is violated, e.g.,
- "Order violation: 1 is out of order in LH PR. Must preserve AB PR order." 

## Cat # Validation Order by Section (as of [today's date])

| Section         | Validation Order (Current)                                                                 |
|----------------|--------------------------------------------------------------------------------------------|
| Top 10/15      | VOID → format → duplicate (full-form) → sequential                                         |
| AB/LH/SH PR    | VOID → format → duplicate (full-form) → sequential → status → order → assignment reminder  |

- **Note:** In all sections, duplicate errors always take precedence over sequential errors. In finals sections, after sequential, status, order, and assignment checks are performed, but only the highest-precedence error is shown for each cell. This matches the current code and is strictly enforced in the validation logic. See the Error Precedence section below for details. See VALIDATION_CHANGELOG.md for rationale and history. 