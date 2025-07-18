# Project Changelog

This changelog records major changes to the CFA Master Clerk Entry Tool, including validation rule changes, documentation restructuring, and feature additions.

## Validation Rule Change Log

### [2024-12-19] KittenTab and HouseholdPetTab: Duplicate Error Display Consistency Fix
- **Area:** src/components/KittenTab.tsx, src/components/HouseholdPetTab.tsx
- **Change:** Fixed duplicate error display inconsistency between tabs. Kitten and Household Pet tabs now show error borders on ALL cells with duplicate cat numbers (matching Championship and Premiership behavior), instead of only showing errors on the current cell. Added getBorderStyle, getCleanMessage, and getErrorStyle helper functions to ensure consistent error display across all tabs.
- **Rationale:** Previously, when entering duplicate cat numbers, only the cell being edited showed the error border in Kitten and Household Pet tabs, while Championship and Premiership tabs correctly showed error borders on all cells with the same duplicate cat number. This fix ensures consistent user experience and proper visual feedback for duplicate validation errors.
- **Validation Precedence:** No changes to validation logic or precedence - only UI display consistency improvements.

### [2024-12-19] KittenTab and HouseholdPetTab: Validation Logic Fixes
- **Area:** src/validation/kittenValidation.ts, src/validation/householdPetValidation.ts, src/components/HouseholdPetTab.tsx
- **Change:** Fixed validation logic for both Kitten and Household Pet tabs. KittenTab had a key format mismatch (underscore vs hyphen separators) that prevented validation from working. HouseholdPetTab was missing the complete validation implementation. Both tabs now have proper validation for cat number format (1-450), sequential entry, duplicate checking, status validation, and voiding logic.
- **Rationale:** Validation was not working due to key format mismatches and missing implementations, causing users to not receive proper error feedback when entering invalid data.

### [2024-12-19] KittenTab: Full State Management Lift to App Level
- **Area:** KittenTab.tsx, App.tsx, docs/specs/FOLDER_STRUCTURE.md
- **Change:** KittenTab now uses fully lifted state management, with all data (showAwards, voidedShowAwards, errors, focusedColumnIndex, isResetModalOpen) managed in App.tsx and passed as props. This provides consistency with Championship and Premiership tabs and ensures data persistence across tab switches. All local state has been removed from KittenTab, making it a pure presentation component.
- **Rationale:** Ensures consistent state management across all tabular sections and prevents data loss when switching between tabs.

### [2024-12-19] Championship Tab: Hair-Specific Breakpoint Implementation
- **Area:** ChampionshipTab.tsx, GeneralTab.tsx, championshipValidation.ts
- **Change:** Implemented hair-specific breakpoint logic for championship cats. The system now calculates breakpoints based on ring type:
  - **Allbreed Rings**: Use total championship cats (GC + CH + NOV) for breakpoint
  - **Longhair Rings**: Use LH championship cats (LH GC + LH CH) for breakpoint  
  - **Shorthair Rings**: Use SH championship cats (SH GC + SH CH) for breakpoint
  - Updated General Tab to include separate LH GC and SH GC input fields
  - Updated validation functions to use ring-specific breakpoints
  - Updated UI to dynamically enable/disable positions based on ring-specific breakpoints
  - Updated test data generation to respect ring-specific breakpoints
- **Rationale:** Corrects the breakpoint calculation to match CFA rules where specialty rings (Longhair/Shorthair) use hair-specific championship counts for breakpoint determination, not the total championship count. This ensures proper position availability and validation per ring type.

### [2024-06-09] Allbreed Best CH → LH/SH Split (Test Data Generation)
- **Area:** ChampionshipTab.tsx (test data generation)
- **Change:** Updated logic to split Best CH cats into LH/SH using the odd/even rule (odd = LH, even = SH) for test data population. All Best CH cats are now assigned to either LH or SH, and only fillers are used if there are more positions than cats.
- **Rationale:** Ensures test data always matches intended validation logic and passes validation. Prevents missing Best CH cats in LH/SH split and aligns with user requirements.

### [2024-06-09] Validation Info Box Removed
- **Area:** ChampionshipTab.tsx (UI)
- **Change:** Removed the static 'Validation Rules' info box from the Championship tab UI. Users now rely solely on inline error messages for guidance.
- **Rationale:** Reduces UI clutter and encourages users to use error messages for understanding validation failures.

### [2024-06-09] Documentation Restructuring
- **Area:** docs/
- **Change:** Grouped all markdown documentation into subfolders: validation, guides, specs, meta. Recreated missing validation markdowns and changelog.
- **Rationale:** Improves organization, maintainability, and clarity of project documentation.

## Other Recent Changes
- See git history for code-level changes and feature additions.

## Last Updated
- 2024-06-09 

## 2024-06-19
- UI/UX: Championship tab now renders only the number of rows needed for each column/section, per ring type and championship count. No extra rows are shown for columns that do not need them (e.g., SH ring with <85 cats only shows 10 Show Awards rows and 3 Best SH CH rows). This ensures the UI always matches the correct CFA logic and prevents user confusion.
- Void functionality in Championship tab is now column-local: voiding a cat number only affects all instances of that cat number within the same column (judge/ring), not across all columns. This improves accuracy and matches show logic.
- Championship count calculation for Allbreed rings corrected: novices (NOV) are now excluded from breakpoint calculations. Only championship cats (GC + CH) are used to determine position availability, aligning with CFA rules.

### [2024-06-19] Premiership Tab: Initial Implementation and Validation Logic
- **Area:** PremiershipTab.tsx, validation/premiershipValidation.ts, docs/validation/VALIDATION_PREMIERSHIP.md
- **Change:** Implemented the Premiership tab with full validation logic and UI structure closely mimicking the Championship tab. Key rules:
  - Premiership Final (top 10/15) allows all statuses: GP (Grand Premier), PR (Premier), NOV (Novice)
  - Best AB PR, Best LH PR, Best SH PR: Only PR cats are eligible; GP and NOV are not eligible and will trigger validation errors if entered
  - Hair-specific breakpoints for placements and finals based on ring type and count (≥50 or <50)
  - Duplicate and sequential entry validation per section
  - Void feature and UI/UX matches Championship tab
  - All action buttons (Save to CSV, Load from CSV, Reset) are present and use shared logic across all tabs
- **Rationale:** Ensures the Premiership tab enforces CFA rules for eligibility and placements, provides a consistent user experience, and maintains codebase modularity and maintainability.

### [2024-06-19] Premiership Tab: Full UI/UX Parity with Championship Tab
- **Area:** PremiershipTab.tsx, docs/validation/VALIDATION_PREMIERSHIP.md
- **Change:** Premiership tab is now a full visual and functional replica of the Championship tab. All UI/UX features are consistent:
  - "Jump to Ring" dropdown for quick navigation
  - Sticky headers, frozen position column, and horizontally scrollable table
  - Paging/scrolling for large numbers of judges
  - Ring glow effect for focused/jumped-to columns
  - Voiding logic is column-local and visually identical
  - Error highlighting, tooltips, and inline error messages match Championship tab
  - All action buttons are placed and styled identically
  - Keyboard navigation and accessibility features are present and consistent
- **Rationale:** Ensures a seamless and consistent user experience across tabs. Only the rules for eligibility, breakpoints, and award labels differ.

### [2024-06-19] Premiership Tab: UI Bug Fix for Duplicate Error Display in Best AB PR
- **Area:** PremiershipTab.tsx
- **Change:** Fixed a UI bug where only one cell would show the duplicate error when the same cat number was entered in multiple Best AB PR positions. The cell key for each Best AB PR input now includes the error state, forcing React to re-render both cells when the error changes. This ensures both cells display the duplicate error, matching the behavior of the Championship tab.
- **Rationale:** The validation logic was correct, but React's reconciliation did not re-render both cells unless their keys changed. This fix ensures error display parity and a consistent user experience.

### [2024-06-19] Premiership Tab: Best AB PR Duplicate/Status Error Precedence Fix
- **Area:** PremiershipTab validation (premiershipValidation.ts)
- **Change:** Refactored validation so that duplicate errors in Best AB PR are checked and set for all involved positions before status errors. If a duplicate is found, both (or all) positions with the duplicate value show the duplicate error, and status errors are only set if there is no duplicate. This matches the behavior of the Championship tab.
- **Rationale:** Previously, a status error (e.g., GP/NOV) would short-circuit validation, causing an alert loop and preventing duplicate errors from being shown. Now, duplicate errors take precedence, and the UI/UX is consistent with ChampionshipTab.
- **User Impact:** Both Best and 2nd Best AB PR will now correctly show duplicate errors if the same cat number is entered, and the alert loop is resolved.

### [2024-06-19] Premiership Tab: Removed alert() from Validation Logic
- **Area:** PremiershipTab validation (premiershipValidation.ts)
- **Change:** Removed all alert() calls from validation logic for Best AB PR and other finals. Alerts in validation caused infinite loops due to React re-renders. Errors are now set in the errors object and displayed in the UI, matching ChampionshipTab behavior.
- **Rationale:** Alerts in validation logic are not safe in React and should not be used for error display or debugging. No user-facing validation logic changed, only the debug mechanism.

### [2024-06-19] Premiership Tab: Duplicate Error Precedence Fix
- **Area:** PremiershipTab validation (premiershipValidation.ts)
- **Change:** Fixed error merging logic so that duplicate errors always take precedence over status errors and reminders in Best AB PR and other finals. Status errors and reminders will never overwrite a duplicate error for the same cell. This matches the behavior of the Championship tab and resolves the root cause of the precedence bug.
- **Rationale:** Previously, status errors could overwrite duplicate errors due to the order of error merging, breaking the intended validation precedence. Now, duplicate errors are always shown if present, ensuring UI/UX parity and correct CFA rule enforcement.

### 2024-06-20
- **Bugfix:** Premiership tab dynamic validation now updates error messages immediately after status dropdown changes in Show Awards. Validation is now always in sync with the latest state. No validation logic changed, only timing/UI bugfix.

## [1.0.10] - 2024-06-21
### Changed
- Refactored state management for Championship and Premiership tabs: all tab data is now managed in `App.tsx` and persists across tab switches.
- Each tab's data is only reset when the user clicks the reset button on that tab.
- Prevents accidental data loss when navigating between tabs.

## 2024-06-21
- Refactored ChampionshipTab to use fully lifted state (like PremiershipTab), with all data managed in App.tsx and passed as props.
- Data is now preserved across tab switches for both tabs.
- Fixes previous issue where Championship data was lost when switching tabs.
- Removed all orange and navy blue border logic from ChampionshipTab. Only red border for errors and default border otherwise. Matches PremiershipTab.
- Updated documentation accordingly.

## [2024-06-21] Premiership Tab Controlled Input Warning Fix
- Fixed a React warning: "A component is changing a controlled input to be uncontrolled" in the Premiership tab.
- All cat number input fields are now always controlled (never undefined/null), preventing React warnings and ensuring robust state management.
- Applies to Show Awards, Best AB PR, Best LH PR, and Best SH PR sections.

## [2024-06-21] ChampionshipTab Error State Refactor & Infinite Loop Fix
- Refactored error state management in ChampionshipTab: errors are now managed in a local state variable, not inside championshipTabData.
- This fixes a critical bug: "Maximum update depth exceeded" (infinite update loop) caused by updating errors inside the main tab data state.
- Error handling is now consistent between Championship and Premiership tabs.
- No user-facing behavior changed; this is a technical/internal refactor for stability and maintainability.

### [2024-06-22] ChampionshipTab: Best AB CH Validation Now Column-Specific
- **Area:** championshipValidation.ts
- **Change:** Fixed a bug where the Best AB CH validation in the Championship tab incorrectly checked all columns' Show Awards for GC/NOV status. The validation is now column-specific: it only checks the current column's Show Awards for GC/NOV when determining eligibility for Best AB CH. This prevents errors from appearing when a cat is a GC/NOV in another ring but not in the current one.
- **Rationale:** Ensures that validation logic matches CFA rules and user expectations. Prevents false errors and aligns with the correct behavior already present in the Premiership tab.

### [2024-06-22] Championship Tab: Sequential Entry and Order Error Logic Improved
- **Area:** src/validation/championshipValidation.ts, docs/validation/VALIDATION_CHAMPIONSHIP.md
- **Change:**
  - Sequential entry errors are now robustly enforced: if any previous position in a finals section is empty, a sequential error is shown (unless a duplicate or status error is present).
  - Order errors are only shown if there are no duplicate, status, or sequential errors for that cell, and only for Best AB CH section.
  - All error keys use hyphens (e.g., 'champions-0-0'), never underscores, for both validation and UI lookup.
  - Debug logging is now present in the validation logic for duplicate, status, sequential, and order errors to aid in tracing error assignment and merging.
  - Error precedence is strictly: duplicate > status > sequential > order > assignment reminder.
- **Rationale:** Ensures robust, user-friendly, and maintainable error handling, strict adherence to project rules, and complete documentation parity.

### [2024-06-22] Championship Tab: Assignment Reminder Logic Improved
- **Area:** src/validation/championshipValidation.ts, docs/validation/VALIDATION_CHAMPIONSHIP.md
- **Change:**
  - Assignment reminder for Best AB CH is now always set after all other errors, using the correct error key ('champions-{colIdx}-{pos}'), and is robustly enforced for every filled cell not assigned to LH or SH CH.
  - Debug logging is present for assignment reminders to aid in tracing error assignment and merging.
- **Rationale:** Ensures robust, user-friendly, and maintainable error handling, strict adherence to project rules, and complete documentation parity for assignment reminders.

### [2024-06-22] Championship Tab: Top 10/15 (Show Awards) Error Precedence Logic
- **Area:** src/validation/championshipValidation.ts, docs/validation/VALIDATION_CHAMPIONSHIP.md
- **Change:**
  - Only duplicate and sequential entry (fill previous) errors are enforced in the Top 10/15 (Show Awards) section.
  - Precedence is: duplicate > sequential entry.
  - Only the highest-precedence error is shown per cell.
  - Debug logging is present for both error types to aid in tracing error assignment and merging.
- **Rationale:** Ensures robust, user-friendly, and maintainable error handling, strict adherence to project rules, and complete documentation parity for Show Awards error precedence.

### [2024-06-22] Championship Tab: Show Awards Error Merging Logic
- **Area:** src/validation/championshipValidation.ts, docs/validation/VALIDATION_CHAMPIONSHIP.md
- **Change:**
  - If a cell in the Top 10/15 (Show Awards) section has both a duplicate and a range error, both messages are shown (duplicate first, then range).
  - Precedence is: duplicate > range > sequential entry.
  - Only the highest-precedence error(s) are shown per cell.
  - Debug logging is present for merged errors to aid in tracing error assignment and merging.
- **Rationale:** Ensures robust, user-friendly, and maintainable error handling, strict adherence to project rules, and complete documentation parity for Show Awards error merging.

### [2024-06-22] Championship Tab: Error Precedence and Merging Refactor
- **Area:** src/validation/championshipValidation.ts, docs/validation/VALIDATION_CHAMPIONSHIP.md
- **Change:**
  - Top 10/15 (Show Awards): error precedence is now range > duplicate > sequential entry, merge range+duplicate if both (range first)
  - Finals (Best AB CH, LH CH, SH CH): error precedence is now range > duplicate > status (GC/NOV) > sequential > order > assignment reminder, merge range+duplicate if both (range first)
  - If a higher-precedence error is present, all lower-precedence errors are suppressed
  - Debug logging is present for all error assignment and merging steps
- **Rationale:** Ensures robust, user-friendly, and maintainable error handling, strict adherence to project rules, and complete documentation parity for error precedence and merging.

### [2024-06-22] Championship Tab: Stricter Cat Number Validation
- **Area:** src/validation/championshipValidation.ts, docs/validation/VALIDATION_CHAMPIONSHIP.md
- **Change:**
  - Cat numbers must now be all digits (no letters or symbols) and in the range 1-450.
  - Any non-integer input (e.g., '15a', '1.5', 'abc') is now rejected as invalid.
  - The validation logic no longer uses parseInt; only valid integer strings are accepted.
  - Documentation updated to reflect stricter validation.
- **Rationale:** Ensures robust, user-friendly, and maintainable error handling, strict adherence to project rules, and complete documentation parity for cat number validation.

### [2024-06-22] Premiership Tab: Stricter Cat Number Validation & Error Precedence Refactor
- **Area:** src/validation/premiershipValidation.ts, docs/validation/VALIDATION_PREMIERSHIP.md
- **Change:**
  - Cat numbers must now be all digits (no letters or symbols) and in the range 1-450.
  - Any non-integer input (e.g., '15a', '1.5', 'abc') is now rejected as invalid.
  - Finals and Show Awards: error precedence is now range > duplicate > status (GP/NOV) > sequential > order > assignment reminder (Best AB PR only).
  - If both range and duplicate errors are present, both are shown (range first).
  - If a higher-precedence error is present, all lower-precedence errors are suppressed.
  - Debug logging is present for all error assignment and merging steps.
- **Rationale:** Ensures robust, user-friendly, and maintainable error handling, strict adherence to project rules, and complete documentation parity for cat number validation and error precedence.

### [2024-06-22] Premiership Tab: Order Error Logic Implemented in Finals Sections
- **Area:** validation/premiershipValidation.ts, docs/validation/VALIDATION_PREMIERSHIP.md
- **Change:** Implemented order error logic for Best AB PR, LH PR, and SH PR in the finals sections. Order errors (e.g., "Must be X (Nth PR required by CFA rules)") are now enforced after range, duplicate, status, and sequential errors, and only shown if no higher-precedence error is present. Debug logging is present for order errors. This matches the logic and error precedence of the Championship tab.
- **Rationale:** Ensures strict CFA rule enforcement, robust error handling, and full UI/UX and validation parity between Championship and Premiership tabs. Documentation updated accordingly.

### [2024-06-22] Premiership Tab: Status Check Now Searches All Columns' Show Awards
- **Area:** validation/premiershipValidation.ts, docs/validation/VALIDATION_PREMIERSHIP.md
- **Change:** Status validation for Best AB PR, LH PR, and SH PR now searches all columns' Show Awards for the cat number, not just the current column. If a cat is listed as GP or NOV in any ring, it is ineligible for Best PR finals in all columns. This ensures strict CFA rule enforcement and correct error display. Documentation updated accordingly.

### [2024-06-22] Premiership Tab: LH/SH PR Order Validation Now Enforces Subsequence Rule
- **Area:** validation/premiershipValidation.ts, docs/validation/VALIDATION_PREMIERSHIP.md
- **Change:** The order of cats in Best LH PR and SH PR must now be a subsequence of the order in Best AB PR (relative order preserved). You may select any subset of AB PR cats for LH/SH PR, but their order must match AB PR. An order error is shown on the first cell where the order is violated. This matches the logic in the Championship tab for LH/SH CH order validation. Documentation updated with examples and rule clarification.
- **Rationale:** Ensures strict CFA rule enforcement, robust error handling, and full UI/UX and validation parity between Championship and Premiership tabs.

### [2024-06-22] Championship Tab: LH/SH CH Order Validation Now Enforces Subsequence Rule
- **Area:** validation/championshipValidation.ts, docs/validation/VALIDATION_CHAMPIONSHIP.md
- **Change:** The order of cats in Best LH CH and SH CH must now be a subsequence of the order in Best AB CH (relative order preserved). You may select any subset of AB CH cats for LH/SH CH, but their order must match AB CH. An order error is shown on the first cell where the order is violated. This matches the logic in the Premiership tab for LH/SH PR order validation. Documentation updated with examples and rule clarification.
- **Rationale:** Ensures strict CFA rule enforcement, robust error handling, and full UI/UX and validation parity between Championship and Premiership tabs.

### [2024-06-22] Championship Tab: LH/SH CH Strict Pairwise Order Validation
- **Area:** validation/championshipValidation.ts, docs/validation/VALIDATION_CHAMPIONSHIP.md
- **Change:** For each filled cell in LH/SH CH, if any previously filled cell is ranked lower in AB CH, an error is shown on the current cell: "X must come after Y in LH CH because Y is ranked higher in AB CH." Only the first such violation is flagged for clarity. Documentation updated with the new rule and example.
- **Rationale:** Ensures strict CFA rule enforcement, robust error handling, and user feedback for order violations in LH/SH CH.

## Last Updated
- 2024-06-20 