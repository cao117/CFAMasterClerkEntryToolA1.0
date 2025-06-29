# Validation Rule Change Log

This changelog records all changes, additions, and deletions to validation rules for each tab in the CFA Master Clerk Entry Tool. Each entry includes the date, affected tab, summary of the change, and rationale/context.

---

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

---

## How to Use This Log
- For every change to validation logic, add a new entry here with the date, tab, summary, and rationale/context.
- This log provides a historical audit trail of all validation rule changes for every tab.

## Last Updated
- 2024-06-09 