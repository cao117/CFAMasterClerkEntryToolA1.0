# Validation Rule Change Log

This changelog records all changes, additions, and deletions to validation rules for each tab in the CFA Master Clerk Entry Tool. Each entry includes the date, affected tab, summary of the change, and rationale/context.

---

### [2024-12-19] Championship Tab: Hair-Specific Breakpoint Implementation
- **Tab:** Championship
- **Change:** Implemented hair-specific breakpoint logic for championship cats. The system now calculates breakpoints based on ring type:
  - **Allbreed Rings**: Use total championship cats (GC + CH + NOV) for breakpoint
  - **Longhair Rings**: Use LH championship cats (LH GC + LH CH) for breakpoint
  - **Shorthair Rings**: Use SH championship cats (SH GC + SH CH) for breakpoint
  - Updated General Tab to include separate LH GC and SH GC input fields
  - Updated validation functions to use ring-specific breakpoints
  - Updated UI to dynamically enable/disable positions based on ring-specific breakpoints
  - Updated test data generation to respect ring-specific breakpoints
- **Rationale:** Corrects the breakpoint calculation to match CFA rules where specialty rings (Longhair/Shorthair) use hair-specific championship counts for breakpoint determination, not the total championship count. This ensures proper position availability and validation per ring type.

### [2024-12-19] Championship Tab: Void Feature Behavior Enhanced
- **Tab:** Championship
- **Change:** Enhanced void functionality behavior to include:
  - **Cross-section voiding**: When a cat number is voided in one section, ALL instances of that cat number across ALL sections are voided simultaneously. Unvoiding any instance unvoids all instances.
  - **Conditional checkbox visibility**: Void checkboxes are grayed out and disabled when the corresponding cat number input is empty.
  - **Read-only voided inputs**: Voided inputs become disabled (read-only) and cannot be edited until unvoided.
  - **Visual improvements**: Enhanced CSS styling to ensure voided inputs are clearly struck-through and grayed out with proper disabled cursor.
- **Rationale:** Provides more intuitive void behavior where voiding a cat number affects all instances consistently, prevents voiding empty inputs, and ensures voided inputs cannot be accidentally modified.

### [2024-12-19] Championship Tab: Void Feature Added
- **Tab:** Championship
- **Change:** Added void functionality to allow marking placements as "voided" when cats win awards but are not present to receive them physically in the show hall. This includes:
  - Added `voided` boolean field to `CellData` interface
  - Added voided state tracking to `ChampionshipValidationInput` interface
  - Added red-bordered void checkboxes with tooltips to all sections (Show Awards, Champions Finals, LH/SH Finals)
  - Implemented visual styling for voided inputs (struck-through and grayed out)
  - Added void state management functions
  - Updated documentation to explain void feature
- **Rationale:** Provides a way to handle real-world show scenarios where cats win placements but are not available to receive physical awards, without affecting validation rules or requiring position changes.

### [2024-12-19] Championship Tab: VOID Functionality Removed
- **Tab:** Championship
- **Change:** Completely removed all VOID functionality from the Championship tab. This includes:
  - Removed VOID validation from `validateCatNumber()` function
  - Removed VOID checks from all duplicate validation functions
  - Removed VOID-specific logic from all validation functions
  - Updated error messages to remove VOID references
  - Removed VOID tip from UI
  - Updated documentation to remove VOID references
- **Rationale:** VOID functionality is being redefined from scratch. This removal ensures a clean slate for implementing the new void feature without any legacy code or documentation conflicts.

### [2024-06-09] Championship Tab: Terminology Clarification and Best AB CH Logic Update
- **Tab:** Championship
- **Change:** Updated terminology to use "Championship Final" consistently instead of "Show Awards" throughout validation logic and documentation. Clarified that when no CHs exist in Championship Final (Top 10/15), Best AB CH can be filled with any CHs from Championship Final, and their order will be maintained when split into LH CH and SH CH sections.
- **Rationale:** Ensures consistent terminology across the application and clarifies the validation logic for scenarios where all Championship Final cats are GC or NOV, allowing Best AB CH to be filled with any available CH cats while preserving order in LH/SH splits.

### [2024-06-09] Championship Tab: Allbreed Best CH → LH/SH Split (Test Data Generation)
- **Tab:** Championship
- **Change:** Updated logic to split Best CH cats into LH/SH using the odd/even rule (odd = LH, even = SH) for test data population. All Best CH cats are now assigned to either LH or SH, and only fillers are used if there are more positions than cats.
- **Rationale:** Ensures test data always matches intended validation logic and passes validation. Prevents missing Best CH cats in LH/SH split and aligns with user requirements.

### [2024-06-09] Championship Tab: Validation Info Box Removed
- **Tab:** Championship
- **Change:** Removed the static 'Validation Rules' info box from the Championship tab UI. Users now rely solely on inline error messages for guidance.
- **Rationale:** Reduces UI clutter and encourages users to use error messages for understanding validation failures.

### [2024-06-09] Documentation Restructuring
- **Tab:** All
- **Change:** Grouped all markdown documentation into subfolders: validation, guides, specs, meta. Recreated missing validation markdowns and changelog.
- **Rationale:** Improves organization, maintainability, and clarity of project documentation.

### [2024-06-09] Championship Tab
- **Summary:** For each position in LH/SH CH, if the value is in Best AB CH, strict validation applies ('is not in Best CH'); otherwise, it is treated as a filler and only checked for not being a non-CH from Championship Final and not being a duplicate. No 'first N' or index-based logic remains.
- **Rationale/Context:** Ensures correct, user-expected, and robust validation for all positions. Finalizes the logic for industry-standard validation.

### [2024-06-09] Championship Tab: Best AB CH Order in LH/SH CH
- **Tab:** Championship
- **Change:** Added validation to enforce that all Best AB CH cats must appear at the top of LH/SH CH, in order, before any fillers. If a filler appears before a Best AB CH cat, an error is shown on both positions.
- **Rationale:** Ensures strict order preservation and prevents fillers from appearing before Best AB CH cats in LH/SH CH sections, matching CFA rules and user expectations.

### [2024-06-09] Championship Tab: Best AB CH Subsequence Rule in LH/SH CH
- **Tab:** Championship
- **Change:** Updated validation to enforce the subsequence rule for Best AB CH cats in LH/SH CH. Only those Best AB CH cats present in LH/SH CH must be at the top, in the same order as in Best AB CH. Not all Best AB CH cats are required to appear in LH/SH CH. No filler may appear before any present Best AB CH cat.
- **Rationale:** Ensures correct order preservation for present Best AB CH cats and allows for valid omissions, matching CFA rules and user expectations.

### [2024-06-09] Championship Tab: GC/NOV error precedence over 'Best CH is missing from LH/SH split'
- **Tab:** Championship
- **Change:** Updated validation logic so that the 'Best CH is missing from LH/SH split' error is never shown for a cat that is a GC or NOV in Championship Final. The GC/NOV error always takes precedence and blocks further split errors for that cat.
- **Rationale:** Prevents confusing or misleading errors and ensures users always see the most relevant, actionable error for each cat.

### [2024-06-09] Championship Tab: Missing status error precedence
- **Tab:** Championship
- **Change:** If a cat in Championship Final is missing a status (GC/CH/NOV), an error is shown and no other errors (like split errors) are shown for that cat. This error takes precedence, like GC/NOV errors.
- **Rationale:** Prevents confusing or misleading errors and ensures users always see the most relevant, actionable error for each cat, even if data is incomplete.

### [2024-06-09] Championship Tab: Enhanced status validation with INVALID status handling
- **Tab:** Championship
- **Change:** Enhanced status validation to handle invalid status values (not GC, CH, or NOV) in addition to missing status. Added 'INVALID' status error that takes precedence over other errors, similar to GC/NOV and missing status errors.
- **Rationale:** Provides clearer error messages and prevents confusing validation errors when Championship Final data has invalid status values, ensuring users always see the most relevant, actionable error for each cat.

### [2024-06-09] Championship Tab: Improved LH/SH split error messaging with warnings
- **Tab:** Championship
- **Change:** Updated "Best CH is missing from LH/SH split" error to "X needs to be assigned to either LH or SH CH final" and implemented warning system. Message shows as warning (orange) when LH/SH sections aren't fully filled, and as error (red) when both sections are filled. Added visual distinction between warnings and errors in UI.
- **Rationale:** Provides clearer, more actionable messaging and better user experience by distinguishing between guidance (warnings) and validation failures (errors), helping users understand when they need to complete assignments vs when they've made an actual error.

### [2024-06-09] Championship Tab: Best AB CH logic corrected for top 10/15 all GC/NOV
- **Tab:** Championship
- **Change:** Updated validation so that if there are no CHs in the Championship Final, Best AB CH can be filled with any CHs from Championship Final (in order). If there are CHs in the Championship Final, those must be at the top of Best AB CH, then fill with other CHs as needed. GC and NOV are never eligible for Best AB CH.
- **Rationale:** Corrects logic to match CFA rules and real-world show scenarios, allowing valid Best AB CH assignments when all Championship Final are GC or NOV.

### [2024-06-09] Championship Tab: Clarified Best AB CH fallback rule
- **Tab:** Championship
- **Change:** Clarified that if there are no CHs in the Championship Final (Top 10/15), Best AB CH can be filled with any CH cats entered in the show (from Show Awards), not just those in the final. Updated code and documentation to use this precise language and logic.
- **Rationale:** Prevents confusion and ensures future code and documentation changes use the correct eligibility pool for Best AB CH fallback scenario.

### [2024-06-09] Championship Tab: Clarified requirement for cats to be in Show Awards
- **Tab:** Championship
- **Change:** Added documentation clarification that all cats used in Best AB CH must first be added to the Show Awards section with their correct status (GC, CH, or NOV). Removed debug logging that was cluttering the console.
- **Rationale:** Prevents user confusion when cats not in Show Awards are used in Best AB CH, which causes validation errors. Ensures users understand the proper data entry workflow.

### [2024-06-09] Championship Tab: Fixed Best AB CH validation for no CHs in Championship Final
- **Tab:** Championship
- **Change:** Fixed validation logic so that when there are no CHs in Championship Final (top 10/15), cats used in Best AB CH are assumed to be CHs entered in the show but not in Championship Final. They do not need to be added to Championship Final first. Only show error if cat is not a CH at all.
- **Rationale:** Corrects the validation to match CFA rules where cats not in Championship Final can be used in Best AB CH when no CHs exist in Championship Final. Prevents incorrect errors for valid scenarios.

### 2024-06
- **Championship Tab:** Added strict per-section CH validation for single specialty rings (Longhair and Shorthair). If there are CHs in the final, they must be at the top of the enabled section, in order. If no CHs in the final, any CH from Show Awards can be used. No GC or NOV allowed. Duplicates and order are checked. Error messages and display are consistent with Allbreed logic.
- **Rationale:** Ensures consistency with CFA rules and Allbreed logic, prevents user error, and improves clarity for single specialty ring validation.

### [2024-06-19] Championship Tab: Best AB CH Error Precedence and User-Friendly Sequential Entry
- **Tab:** Championship
- **Change:**
  - Enhanced error precedence for Best AB CH: sequential entry error (with user-friendly message) takes precedence, then other errors, then the LH/SH assignment warning (which only appears if all previous positions are filled and there are no other errors for that row).
  - Sequential entry error message now clearly indicates which previous rows must be filled before entering a later position (e.g., "You must fill Best AB CH and 2nd Best AB CH before entering 3rd Best AB CH.").
  - The "needs to be assigned to either LH or SH CH final" warning is now lowest precedence and is not shown if any other error is present for that row.
- **Rationale:**
  - Improves user experience by making error messages more actionable and clear, and ensures warnings do not obscure more important validation errors.

### [2024-12-19] Championship Tab: Duplicate Validation Clarification and Error Message Improvements
- **Tab:** Championship
- **Change:**
  - **Clarified duplicate validation behavior**: Duplicate checks are performed within each section only (Championship Final, Best AB CH Final, Best LH CH Final, Best SH CH Final), not across the entire column.
  - **Cross-section duplicates are allowed**: A cat number can appear in multiple sections as long as it is not a duplicate within any single section.
  - **Improved error messages**: Updated duplicate validation error messages to be more specific about which section contains the duplicate (e.g., "Duplicate cat number within Championship Final section" instead of "Duplicate cat number within this column").
  - **Updated documentation**: Clarified duplicate validation rules in VALIDATION_CHAMPIONSHIP.md to reflect the correct behavior.
- **Rationale:**
  - Addresses user confusion about duplicate validation behavior where users expected cross-section duplicates to be allowed.
  - Provides clearer error messages that help users understand exactly where the duplicate occurs.
  - Ensures validation behavior matches CFA rules and user expectations.

### [2024-06-19] Championship Tab: Finals Section Duplicate Validation Clarification
- **Tab:** Championship
- **Change:**
  - Clarified that duplicate validation for finals sections (Best AB CH, Best LH CH, Best SH CH) is only within their own section, not against Show Awards or other finals sections.
  - Improved error messages to specify the section where the duplicate occurs.
- **Rationale:**
  - Prevents confusion about cross-section duplicate errors and ensures validation matches CFA rules and user expectations.
  - Makes error messages more actionable and user-friendly.

### [2024-06-XX] Championship Tab: LH/SH Assignment Message Always Error
- **Tab:** Championship
- **Change:** The message 'X needs to be assigned to either LH or SH CH final' is now always treated as a regular error (red), regardless of section fill state or other conditions. All documentation about warning/reminder/orange for this message has been removed.
- **Rationale:** UI/UX and documentation consistency. No validation rule change; only error display and documentation updated.

### [2024-06-19] Championship Tab: UI/UX: Non-applicable rows and sections are now completely hidden (not just disabled) for each ring type and breakpoint. Applies to all sections and extra rows beyond awarded placements. Improves clarity and prevents user confusion.

### [2024-06-19] Championship Tab: Void functionality is now column-local: voiding a cat number only affects all instances of that cat number within the same column (judge/ring), not across all columns.

### [2024-06-19] Championship Tab: Allbreed Championship Count Correction
- **Tab:** Championship
- **Change:** Corrected the championship count calculation for Allbreed rings to exclude novices (NOV). The breakpoint for Allbreed rings now correctly uses only championship cats (LH GC + SH GC + LH CH + SH CH), not the total including novices. This aligns with CFA rules where novices are not considered championship cats for breakpoint purposes.
- **Rationale:** Novices are a separate class from championship cats and should not be included in championship breakpoint calculations. This correction ensures proper position availability based on actual championship cat counts.

### [2024-06-19] Championship Tab: UI/UX: Non-applicable rows and sections are now completely hidden (not just disabled) for each ring type and breakpoint. Applies to all sections and extra rows beyond awarded placements. Improves clarity and prevents user confusion.

### [2024-06-19] Championship Tab: Per-Column Row Rendering Fix
- **Tab:** Championship
- **Change:** UI now renders only the number of rows needed for each column/section, per ring type and championship count. No extra rows are shown for columns that do not need them (e.g., SH ring with <85 cats only shows 10 Show Awards rows and 3 Best SH CH rows). This fixes the bug where specialty rings could show too many rows.
- **Rationale:** Ensures the UI always matches the correct CFA logic and prevents user confusion about available placements.

### [2024-12-19] Premiership Tab: Input Clearing/Blocking Issue Fixed
- **Tab:** Premiership
- **Change:** Fixed critical bug where Best AB PR input fields were being cleared and blocked after entry
- **Summary:** The issue was caused by incorrect key construction in the UI component. The `updateFinals` function used the key format `${colIdx}_${pos}` for state updates, but the render section was trying to read from state using the key format `abPremiersFinals_${colIdx}_${i}`. This mismatch caused the input values to appear empty and prevented further editing. Fixed by using consistent key formats across all Best PR sections (AB, LH, SH).
- **Rationale:** This was a critical UI bug that prevented users from entering data in the Best AB PR section. The fix ensures that input values are properly stored and retrieved from state, allowing normal data entry functionality.

### [2024-12-19] Premiership Tab: Error Key Format Parity Fix
- **Tab:** Premiership
- **Change:** Fixed error key format mismatches between validation logic and UI to ensure rigid parity with Championship tab
- **Summary:** Updated all error key constructions and data storage formats to use consistent `{columnIndex}_{position}` format instead of mixed `{columnIndex}-{position}` and `{columnIndex}_{position}` formats. This ensures that validation errors are properly displayed in the UI, particularly for assignment reminders when Best AB Premier cats are not assigned to either LH or SH sections.
- **Rationale:** The previous inconsistent error key formats caused validation errors (including dynamic assignment reminders) to not display properly in the UI, breaking the rigid parity requirement between Championship and Premiership tabs. This fix ensures all validation logic works identically between both tabs.

### [2024-12-19] Premiership Tab: Status Validation Parity with Championship Tab
- **Tab:** Premiership
- **Change:** Confirmed that status validation logic now exactly matches Championship tab behavior
- **Summary:** 
  - **Best AB PR**: Only checks if cat is GP or NOV in Show Awards (does NOT check for missing statuses)
  - **LH/SH PR**: Checks for all status errors (GP/NOV/MISSING/INVALID) in Show Awards
  - This matches Championship tab behavior where Best AB CH only checks for GC/NOV but LH/SH CH check for all status errors including missing statuses
- **Rationale:** Ensures complete validation parity with Championship tab. The previous confusion about status validation was resolved - both tabs have the same validation logic: Best AB sections only check for ineligible statuses (GC/GP), while LH/SH sections check for all status errors including missing statuses.

### [2024-12-19] Premiership Tab: Duplicate Error Precedence and Key Format Fix
- **Tab:** Premiership
- **Change:** Fixed duplicate error precedence and error key format mismatches to ensure duplicate errors take precedence over status errors, matching Championship tab behavior
- **Summary:** 
  - **Fixed error key format**: Corrected blur handler to use `abPremiersFinals_${colIdx}_${pos}` format instead of `abPremiers_${colIdx}_${pos}` to match validation function expectations
  - **Fixed duplicate error precedence**: Removed early return in blur handler on duplicate detection to allow full validation to handle duplicate errors properly
  - **Removed alert() calls**: Replaced alert() calls with console.log() to prevent infinite alert loops caused by React re-renders
  - **Enhanced error merging logic**: Ensured duplicate errors are never overwritten by status errors in the main validation function
- **Rationale:** The previous implementation had inconsistent error key formats between the blur handler and validation function, causing duplicate errors to not display properly. Additionally, the blur handler was returning early on duplicate detection, preventing the full validation from setting the duplicate error. This fix ensures duplicate errors always take precedence over status errors, matching Championship tab behavior exactly.

### [2024-06-19] Premiership Tab: Complete validation parity with Championship tab
- **Tab:** Premiership
- **Change:** Complete refactor to achieve full validation parity with Championship tab
- **Summary:** Implemented all missing validation rules, helper functions, and relationship checks to match Championship tab exactly
- **Rationale:** User requested exact validation parity between Championship and Premiership tabs. The refactor includes:
  - All missing helper functions (duplicate checks, sequential entry, format validation)
  - Complete column relationship validation with status checks, order validation, and assignment reminders
  - Same validation order and error precedence as Championship tab
  - Same error messages and short-circuiting logic
  - All cross-section validation rules (LH/SH assignment, order validation, single specialty strictness)
  - Reminder logic for assignment to LH/SH sections
  - Complete error message consistency with Championship tab

### [2024-12-19] Premiership Tab: Updated Best PR finals eligibility validation to match Championship tab logic
- **Tab:** Premiership
- **Change:** Updated Best PR finals eligibility validation to match Championship tab logic
- **Summary:** Changed from "only PR cats allowed" to "cats listed as GP or NOV in Top 10/15 cannot be in Best PR sections"
- **Rationale:** Consistency with Championship tab validation logic. The new rule checks if a cat appears in the Top 10/15 section as GP or NOV, and if so, rejects it from Best PR sections. Cats not found in Top 10/15 or listed as PR are assumed valid. Error messages now follow the format: "{catNumber} is listed as a {status} in Show Awards and cannot be awarded Premier final."

### [2024-06-19] Premiership Tab: Initial validation rules implementation
- **Tab:** Premiership
- **Change:** Initial validation rules implementation
- **Summary:** Implemented hair-specific breakpoints, eligibility rules, duplicate validation, sequential entry validation, and void logic
- **Rationale:** Premiership tab needed comprehensive validation matching CFA rules with hair-specific breakpoints and proper eligibility enforcement.

### [2024-06-19] Championship Tab: Initial validation rules implementation
- **Tab:** Championship
- **Change:** Initial validation rules implementation
- **Summary:** Implemented breakpoint logic, eligibility rules, duplicate validation, sequential entry validation, and void logic
- **Rationale:** Championship tab needed comprehensive validation matching CFA rules with proper eligibility enforcement.

### [2024-06-19] General Tab: Initial validation rules implementation
- **Tab:** General
- **Change:** Initial validation rules implementation
- **Summary:** Implemented basic validation for cat numbers, duplicates, and sequential entry
- **Rationale:** General tab needed basic validation to ensure data integrity and proper entry flow.

### [2024-06-19] Premiership Tab: Error Precedence Fix for Assignment Reminder
- **Tab:** Premiership
- **Change:** Fixed error precedence logic so that assignment reminders are only shown when there are no other errors for that cell. Hard errors (GP/NOV status) now take precedence over assignment reminders.
- **Rationale:** Prevents confusing or misleading errors and ensures users always see the most relevant, actionable error for each cat.

### [2024-06-19] Premiership Tab: Automatic Test Data Generation Implementation
- **Tab:** Premiership
- **Change:** Added automatic test data generation mechanism to PremiershipTab component that mirrors the Championship tab's behavior. The component now automatically populates test data when `shouldFillTestData` prop is true, creating realistic test data with proper status assignments (GP, PR, NOV) for Show Awards section.
- **Summary:** The automatic test data generation creates unique cat numbers for each column, assigns random statuses to Show Awards positions, and populates Best PR finals sections with appropriate cats based on ring type and validation rules. This ensures that when users manually enter cat numbers, there are corresponding Show Awards entries with proper statuses for validation.
- **Rationale:** Previously, the Premiership tab lacked automatic test data generation, causing validation issues when users manually entered cat numbers without corresponding Show Awards entries. This fix ensures proper validation testing and user experience parity with the Championship tab, where test data is automatically generated when needed.

### [2024-06-19] Championship Tab: Initial validation rules implementation
- **Tab:** Championship
- **Change:** Initial validation rules implementation
- **Summary:** Implemented breakpoint logic, eligibility rules, duplicate validation, sequential entry validation, and void logic
- **Rationale:** Championship tab needed comprehensive validation matching CFA rules with proper eligibility enforcement.

### [2024-06-19] General Tab: Initial validation rules implementation
- **Tab:** General
- **Change:** Initial validation rules implementation
- **Summary:** Implemented basic validation for cat numbers, duplicates, and sequential entry
- **Rationale:** General tab needed basic validation to ensure data integrity and proper entry flow.

### [2024-06-19] Premiership Tab: Debug Logging for Validation
- **Area:** validation/premiershipValidation.ts, docs/validation/VALIDATION_PREMIERSHIP.md
- **Change:** Added Winston-style debug logging to all critical validation and error-merging points for Best AB PR in Premiership validation. Logs when a hard error is detected, when a reminder is considered/suppressed, and the final error object for each column.
- **Rationale:** Improves traceability and makes it easier to debug and verify error precedence and merging logic, ensuring full parity with Championship tab validation behavior.

### [2024-06-19] Premiership Tab: Validation Timing Fix for UI Consistency
- **Tab:** Premiership
- **Change:** Fixed validation timing to match Championship tab behavior - validation now runs on blur (when input loses focus) instead of on every keystroke, ensuring consistent user experience between tabs.
- **Summary:** Previously, Premiership tab showed validation errors immediately while typing, while Championship tab only showed errors after clicking away from the input. This fix ensures both tabs behave identically and prevents premature error display.
- **Rationale:** User experience consistency is critical for professional tools. The blur-based validation pattern provides better UX by allowing users to complete their input before seeing validation feedback.

### [2024-06-19] Premiership Tab: Automatic Test Data Generation Implementation
- **Tab:** Premiership
- **Change:** Added automatic test data generation mechanism to PremiershipTab component that mirrors the Championship tab's behavior. The component now automatically populates test data when `shouldFillTestData` prop is true, creating realistic test data with proper status assignments (GP, PR, NOV) for Show Awards section.
- **Summary:** The automatic test data generation creates unique cat numbers for each column, assigns random statuses to Show Awards positions, and populates Best PR finals sections with appropriate cats based on ring type and validation rules. This ensures that when users manually enter cat numbers, there are corresponding Show Awards entries with proper statuses for validation.
- **Rationale:** Previously, the Premiership tab lacked automatic test data generation, causing validation issues when users manually entered cat numbers without corresponding Show Awards entries. This fix ensures proper validation testing and user experience parity with the Championship tab, where test data is automatically generated when needed.

### 2024-06-09
- PremiershipTab: Best AB PR validation now searches all columns' Show Awards for cat status (GP/NOV/invalid/missing) to determine hard errors, matching Championship logic. This fixes error precedence and reminder suppression.

### 2024-06-09
- [Championship Tab] Assignment reminders in Best AB CH are now suppressed if a sequential entry error exists for a later position in the same column. This ensures reminders do not show when a sequential error is present for any later position. Rationale: Prevents confusing UI/UX where reminders would appear alongside or before sequential errors, matching intended error precedence and user expectations.

### 2024-06-09
- [Championship Tab] Fixed infinite recursion in `validateColumnRelationships` that caused stack overflow. The function now only validates the current column, not all columns recursively.

### 2024-06-09
- [Championship & Premiership Tabs] Clarified and enforced error precedence logic: only the highest-precedence error is shown per cell (duplicate > GC/NOV > assignment reminder). Assignment reminders are only suppressed in the cell with a hard error, not in other cells. Documentation updated to reflect this logic.

### 2024-06-09
- [Championship Tab] Refined error precedence logic: assignment reminders are only suppressed in the cell with a hard error (duplicate or GC/NOV), not in other cells. All other cells show the assignment reminder if appropriate. Documentation updated to reflect this logic.

### [2024-06-20] Championship Tab: Assignment Reminder Error Placement Fix
- **Tab:** Championship
- **Change:** Fixed assignment reminder error placement in Best AB CH. The 'needs to be assigned to either LH or SH CH final' error is now always shown in the cell where the cat is entered and not assigned, using the actual position index. This prevents off-by-one errors (where the error would appear in the previous/empty cell) and matches the Premiership tab behavior.
- **Rationale:** Ensures the assignment reminder always appears in the correct cell, providing clear and accurate feedback to the user and maintaining UI/UX parity between tabs.

### [2024-06-20] Championship Tab: Assignment Reminder Patch
- **Tab:** Championship
- **Change:** Patched assignment reminder logic. Now, every filled Best AB CH cell where the cat is not assigned to LH or SH CH final will show the reminder, matching Premiership logic. This fixes the bug where reminders were missing for multiple unassigned cats.
- **Rationale:** Ensures all unassigned cats are flagged, not just the first or last, and matches Premiership tab behavior.

### [2024-06-20] Championship & Premiership Tabs: Assignment Reminder Error Precedence Fix
- **Tab:** Championship, Premiership
- **Change:** Assignment reminders are now always suppressed in the cell with a duplicate or GC/GP/NOV error. Duplicate errors always take precedence over reminders. This ensures that only the highest-precedence error is shown per cell, and reminders are never shown alongside hard errors in the same cell.
- **Rationale:** Ensures correct error display and strict UI/UX parity between tabs. Prevents confusing or misleading error messages and matches documented validation rules.

### [2024-06-20] Championship Tab: Strict Error Precedence Enforcement (updated)
- **Tab:** Championship
- **Change:** Assignment reminders are now only shown if there is no duplicate or GC/NOV error for that cell. This prevents multiple errors from appearing in the same cell and ensures clear, unambiguous UI feedback.
- **Rationale:** Prevents confusion and maintains strict, predictable error display for users.

### [2024-06-20] Premiership Tab: Best AB PR strict order validation and error precedence
- **Tab:** Premiership
- **Change:** Best AB PR now strictly enforces that PR cats from Premiership Final (Top 10/15) must be placed in the same order in Best AB PR. If the order is violated, the error 'Must be X (Nth PR required by CFA rules)' is shown in the relevant cell. This matches the logic and error precedence of the Championship tab.
- **Documentation:** Updated VALIDATION_PREMIERSHIP.md to clarify the rule and error precedence. Updated changelog for parity.
- **Rationale:** Ensures strict CFA rule enforcement and UI/UX parity between Championship and Premiership tabs.

### [2024-06-20] Championship Tab: Implemented synchronized voiding logic: toggling the void checkbox for any cat number in any section (Show Awards, Best AB CH, Best LH CH, Best SH CH) in a column will void/unvoid all instances of that cat number in that column. This matches the Premiership tab logic. See `updateVoidStateColumnWide` in `ChampionshipTab.tsx`.

### 2024-06-21
- [Championship Tab] Strict error precedence for 'Must be X' order error in Best AB CH now matches Premiership tab. Only the highest-precedence error is shown per cell: duplicate > GC/NOV > order > assignment reminder. See championshipValidation.ts for details.

## 2024-06-21
- [Championship Tab] Strict error precedence for Best AB CH now enforced: duplicate > status > sequential entry > order > assignment reminder. Assignment reminder only shown if all previous errors are absent. See championshipValidation.ts for details.

### [2024-06-22] Household Cats Tab: Placeholder Tab and Documentation Created
- **Tab:** Household Cats
- **Change:** Added a new Household Cats tab to the UI (after Premiership tab). For now, the tab is a placeholder with 'Coming soon...' and no logic. Created docs/validation/VALIDATION_HOUSEHOLD.md as a placeholder for future validation rules.
- **Rationale:** Prepares the codebase and documentation for future Household Cats features and validation logic, matching the structure of other tabs.

### [2024-06-22] Kitten Tab: Full Implementation and Documentation
- **Tab:** Kitten
- **Change:** Implemented Kitten tab as a strict reduction of the Premiership tab. Only one section (Top 10/15 Kittens), only KIT status, all UI/UX, voiding, error display, and keyboard navigation match Premiership tab. Validation includes duplicate, sequential, range, and voiding logic. Column reset on ring type change is enforced. Documentation updated in VALIDATION_KITTEN.md.
- **Rationale:** Ensures robust, user-friendly, and consistent data entry for kittens, with full parity to Premiership tab except for reduced features.

### [2024-12-19] General Tab & Kitten Tab: Hair-Specific Kitten Count Implementation
- **Tab:** General, Kitten
- **Change:** 
  - **General Tab**: Replaced single "Kitten Count" field with separate "Longhair Kittens" and "Shorthair Kittens" input fields. Total kittens are now auto-calculated as the sum of LH + SH kittens.
  - **Kitten Tab**: Updated to use hair-specific breakpoint logic based on ring type:
    - **Allbreed Rings**: Use total kittens (LH + SH) for breakpoint
    - **Longhair Rings**: Use LH kittens only for breakpoint  
    - **Shorthair Rings**: Use SH kittens only for breakpoint
  - **Breakpoint**: 75 kittens per hair type (≥75 = 15 positions, <75 = 10 positions)
  - Updated validation logic, UI rendering, and documentation to support hair-specific breakpoints
- **Rationale:** Corrects the breakpoint calculation to match CFA rules where specialty rings (Longhair/Shorthair) use hair-specific kitten counts for breakpoint determination, not the total kitten count. This ensures proper position availability and validation per ring type.

### [2024-12-19] Kitten Tab: Column-Specific Row Rendering Fix
- **Tab:** Kitten
- **Change:** Fixed critical bug where all columns were showing the same number of rows based on the maximum breakpoint across all columns. Now each column shows only the number of rows it actually needs based on its own ring type and hair-specific breakpoint:
  - **Shorthair columns with <75 SH kittens**: Show only 10 rows (empty cells for rows 11-15)
  - **Longhair columns with <75 LH kittens**: Show only 10 rows (empty cells for rows 11-15)  
  - **Allbreed columns with ≥75 total kittens**: Show 15 rows
  - **Mixed setup**: Table shows maximum rows needed, but each column only has inputs for its applicable rows
- **Rationale:** Previously, if any column needed 15 rows, all columns would show 15 rows regardless of their individual breakpoints. This fix ensures each column respects its own hair-specific breakpoint calculation, matching CFA rules and user expectations.

### [2024-06-22] Household Pet Tab: Full Implementation and Documentation
- **Tab:** Household Pet
- **Change:** Implemented Household Pet tab as a strict reduction of the Kitten tab. Only one section (Top 10/15 Household Pets), only HHP status, all UI/UX, voiding, error display, and keyboard navigation match Kitten tab. Validation includes duplicate, sequential, range, and voiding logic. Column reset on judge change is enforced. Documentation updated in VALIDATION_HOUSEHOLD.md.
- **Rationale:** Ensures robust, user-friendly, and consistent data entry for household pets, with full parity to Kitten tab except for reduced features.

### [2024-06-22] Kitten & Household Pet Tabs: Duplicate Error Display on All Duplicates
- **Tab:** Kitten, Household Pet
- **Change:** Duplicate errors are now shown on all cells with the same duplicate value in a column, not just the last entered cell.
- **Rationale:** Improves clarity, matches user expectation, and brings Kitten and Household Pet tabs in line with Championship and Premiership tab behavior.

### [2024-06-22] Standardized Duplicate Error Message Across All Tabs
- **Tabs:** Championship, Premiership, Kitten, Household Pet
- **Change:** The duplicate error message is now always 'Duplicate cat number within this section of the final' in all tabs and sections.
- **Rationale:** Improves clarity and ensures consistency for users and documentation.

### [2024-06-22] Standardized Sequential Error Messages Across All Tabs
- **Tabs:** Championship, Premiership, Kitten, Household Pet
- **Change:** All sequential entry error messages now use the consistent text "You must fill previous placements before entering this position." instead of section-specific messages.
- **Rationale:** Improves consistency and reduces confusion for users across all tabs.

### [2024-06-22] Fixed Premiership Tab Key Format and Error Message Consistency
- **Tab:** Premiership
- **Change:** Fixed key generation to use hyphens instead of underscores throughout the validation logic, and updated remaining old sequential error message to use consistent text "You must fill previous placements before entering this position."
- **Rationale:** Ensures validation works properly and maintains consistency with naming convention rule and other tabs.

### [2024-06-22] Premiership Tab Sequential Error Never on Filled Cells
- **Tab:** Premiership
- **Change:** Fixed bug where sequential entry error could appear under filled cells. Now, the error only appears on the first empty cell after the last filled cell, never on filled cells.
- **Rationale:** Matches user expectation and Kitten/Championship tab behavior; prevents confusing errors under filled cells.

### [2024-06-22] Premiership Tab Sequential Entry Validation Logic Fixed
- **Tab:** Premiership
- **Change:** Fixed sequential entry validation logic in Premiership tab to match Championship tab exactly. Replaced the incorrect approach that only showed sequential errors on empty cells with the correct `validateSequentialEntry` function that checks if there are any empty positions before the current filled position within the same section.
- **Rationale:** Fixes bug where sequential errors were not appearing correctly. Now matches Championship tab behavior exactly - if a cell is filled but there are empty cells above it in the same section, the sequential error appears on the filled cell.
- **Rationale:** The previous custom logic was causing sequential errors to appear under filled cells (e.g., entering 1 in position 1 and 2 in position 2 would show sequential error under position 2). This fix ensures consistent behavior with Championship tab and proper user experience.

### [2024-06-22] Premiership Tab Debug Logging Added
- **Tab:** Premiership
- **Change:** Added comprehensive debug logging to `validateSequentialEntry` and `validatePremiershipTab` functions to help diagnose sequential entry validation issues.
- **Rationale:** To identify why sequential entry errors are still appearing incorrectly when positions 1 and 2 are both filled.

### [2024-06-22] Premiership Tab Key Format Bugfix: Hyphens Only
- **Tab:** Premiership
- **Change:** Fixed critical bug where underscore-based keys (e.g., '0_1') were used for placements, voids, and errors, causing sequential entry and duplicate validation to fail. All key generation, storage, and lookups now use hyphens (e.g., '0-1') throughout PremiershipTab and validation logic, per `.cursor/rules/naming-conventions.mdc`.
- **Rationale:** Ensures validation and UI are in sync, fixes sequential entry and duplicate bugs, and maintains CSV export compatibility.

### [2024-06-22] Comprehensive Key Format Audit and Fix
- **Tab:** Premiership
- **Change:** Conducted comprehensive line-by-line audit of all key generation and usage throughout the codebase. Found and fixed all remaining underscore-based keys in PremiershipTab.tsx:
  - Fixed error key generation in `handleShowAwardBlur`: `showAwards_${colIdx}-${pos}` → `showAwards-${colIdx}-${pos}`
  - Fixed error key generation in `handleFinalsBlur`: `${section}_${colIdx}-${pos}` → `${section}-${colIdx}-${pos}`
  - Fixed UI error lookups in rendering sections: `showAwards_${colIdx}-${i}` → `showAwards-${colIdx}-${i}`, etc.
- **Rationale:** Ensures complete consistency with naming convention rule. All object keys now use hyphens exclusively, preventing validation and CSV export bugs.

### [2024-12-19] All Tabs: CSV Button Simplification and UI Updates
- **Tab:** All (General, Championship, Premiership, Kitten, Household Pet)
- **Change:** Simplified CSV action buttons across all tabs and updated UI styling
- **Summary:** 
  - **Removed**: "Save to Temp CSV" button from all tabs
  - **Renamed**: "Generate Final CSV" → "Save to CSV" across all tabs
  - **Renamed**: "Restore from CSV" → "Load from CSV" across all tabs
  - **Updated**: Load from CSV button styling to navy blue color (#1e3a8a) to match CFA branding
  - **Updated**: All component imports and function calls to use the new `handleSaveToCSV` function
  - **Updated**: Documentation across all validation files and project overview to reflect the simplified button structure
  - **Maintained**: All validation logic and error handling remains unchanged
- **Rationale:** Simplifies the user interface by removing redundant functionality and improves visual consistency with CFA branding. The "Save to CSV" button now serves both temporary and final export purposes, while "Load from CSV" provides clear import functionality with distinctive navy blue styling.

---

## How to Use This Log
- For every change to validation logic, add a new entry here with the date, tab, summary, and rationale/context.
- This log provides a historical audit trail of all validation rule changes for every tab.

## Last Updated
- 2024-06-09 