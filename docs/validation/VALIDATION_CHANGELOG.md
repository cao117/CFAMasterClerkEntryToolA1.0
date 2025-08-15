# Validation Rule Change Log

This changelog records all changes, additions, and deletions to validation rules for each tab in the CFA Master Clerk Entry Tool. Each entry includes the date, affected tab, summary of the change, and rationale/context.

### [2025-08-15] Breed Sheets Tab: OCP Ring Kitten Hair Length Support
- **Tabs:** Breed Sheets
- **Change:** Added OCP Ring support for Kitten group hair length selection
- **Summary:**
  - **Root Cause**: OCP Ring type was missing from the ring type check for Kitten hair length availability in `getAvailableHairLengths()` function
  - **Problem**: 
    - OCP Ring judges could not select Longhair or Shorthair for Kitten entries in Breed Sheets tab
    - Championship and Premiership groups worked correctly with OCP rings, but Kitten group did not
    - The condition check for Kitten only included: Longhair, Double Specialty, Super Specialty, Allbreed (missing OCP Ring)
  - **Solution**: 
    - Added `|| selectedJudge.ringType === 'OCP Ring'` to both LH and SH condition checks in the Kitten case
    - Made OCP Ring behavior consistent across all three groups (Championship, Premiership, Kitten)
  - **Technical Details**:
    - Lines 220-224: Updated Kitten case in `getAvailableHairLengths()` function
    - Added OCP Ring to LH condition: `if (kitLHCount > 0 && (... || selectedJudge.ringType === 'OCP Ring'))`
    - Added OCP Ring to SH condition: `if (kitSHCount > 0 && (... || selectedJudge.ringType === 'OCP Ring'))`
  - **Affected Files**: `src/components/BreedSheetsTab.tsx`
  - **Result**: OCP Ring judges can now properly select LH/SH for Kitten breed sheets, matching the behavior for Championship and Premiership groups
- **Files Modified**: 
  - `src/components/BreedSheetsTab.tsx` - Added OCP Ring to Kitten hair length availability checks
  - `docs/validation/VALIDATION_BREED_SHEETS.md` - Updated documentation to reflect OCP Ring support for all groups
  - `docs/COMPONENT-CHANGELOG.md` - Added component change entry
- **Testing**: Manual verification confirmed OCP Ring judges can now select both LH and SH for Kitten breed sheets when counts permit
- **Rationale**: OCP rings should behave identically to Allbreed rings for breed sheet functionality across all groups
- **Impact**: Users with OCP Ring judges can now properly enter Kitten breed sheet awards for both LH and SH sections

### [2025-08-14] Championship & Premiership Tabs: OCP Ring Filler Error Logic Fix
- **Tabs:** Championship, Premiership
- **Change:** Fixed OCP ring filler validation to exclude non-eligible cats (GC/GP) from ranked cats consideration
- **Summary:**
  - **Root Cause**: OCP filler validation incorrectly included GC cats (Championship) and GP cats (Premiership) as "ranked cats" requiring placement before filler cats
  - **Problem**: 
    - Championship OCP: GC cats (1,2,3,4) incorrectly included in ranked cats list, causing false filler errors
    - Premiership OCP: GP cats incorrectly included in ranked cats list, causing false filler errors
    - Users saw errors like "1,2,3,4 not placed yet" when these cats should not be considered for OCP placement
    - OCP columns are status-specific (CH-only in Championship, PR-only in Premiership) but validation treated all statuses as eligible
  - **Solution**: 
    - Championship: Modified `getOCPRankedCatsFromColumn` to only consider CH cats as ranked (excluded GC cats)
    - Premiership: Modified `getOCPRankedCatsFromColumn` to only consider PR cats as ranked (excluded GP cats)
    - Added explicit logging to show when GC/GP cats are skipped vs CH/PR cats added
    - Updated function documentation to clarify OCP eligibility requirements
  - **Technical Details**:
    - Championship (lines 1565-1570): Changed `cell.status === 'GC' || cell.status === 'CH'` to `cell.status === 'CH'`
    - Premiership (lines 981-986): Changed `cell.status === 'PR' || cell.status === 'GP'` to `cell.status === 'PR'`
    - Both tabs: Added logging and explicit GC/GP exclusion logic
    - Updated documentation comments to reflect OCP eligibility rules
  - **Affected Files**: `src/validation/championshipValidation.ts`, `src/validation/premiershipValidation.ts`
  - **Result**: OCP filler validation now correctly considers only eligible cats (CH/PR) as ranked, eliminating false filler errors
- **Files Modified**: 
  - `src/validation/championshipValidation.ts` - Fixed OCP ranked cats logic in getOCPRankedCatsFromColumn function
  - `src/validation/premiershipValidation.ts` - Fixed OCP ranked cats logic in getOCPRankedCatsFromColumn function
  - `docs/validation/VALIDATION_CHANGELOG.md` - Added this documentation entry
- **Testing**: Manual verification confirmed that GC/GP cats no longer trigger false OCP filler errors
- **Rationale**: OCP columns are status-specific and only cats with qualifying status (CH/PR) should be considered for OCP placement validation
- **Impact**: Users now see accurate OCP filler validation that respects status eligibility rules

### [2025-08-14] Championship & Premiership Tabs: SSP Ring Excel Import AB Column Population
- **Tabs:** Championship, Premiership
- **Change:** Implemented Excel import logic to properly populate SSP ring AB column Best LH/SH sections from LH/SH column data
- **Summary:**
  - **Root Cause**: Excel export saves SSP AB column Best LH/SH sections as empty (to prevent duplication), but import needed to restore expected AB column data
  - **Problem**: 
    - After Excel export/import cycle, SSP AB column Best LH CH/PR and Best SH CH/PR sections remained empty
    - UI validation and business logic expect AB column to contain LH/SH specific data for proper cross-column validation
    - Users lost AB column data functionality after importing previously exported files
  - **Solution**: 
    - Enhanced `populateSuperSpecialtyABColumns` function in `excelImport.ts` to copy LH/SH Best section data to corresponding AB column sections
    - Added specific logic to copy LH column Best LH CH/PR data to AB column Best LH CH/PR sections
    - Added specific logic to copy SH column Best SH CH/PR data to AB column Best SH CH/PR sections
  - **Technical Details**:
    - Lines 942-958: Updated data copying logic in `populateTabSuperSpecialtyAB` function
    - For SSP rings: LH column Best LH CH/PR → AB column Best LH CH/PR sections
    - For SSP rings: SH column Best SH CH/PR → AB column Best SH CH/PR sections  
    - Other ring types (Allbreed, Double Specialty, OCP) unaffected
  - **Affected Files**: `src/utils/excelImport.ts`
  - **Result**: SSP rings now maintain proper AB column data after Excel import, enabling full validation and UI functionality
- **Files Modified**: 
  - `src/utils/excelImport.ts` - Enhanced SSP ring AB column population logic
  - `docs/validation/VALIDATION_CHANGELOG.md` - Added this documentation entry
- **Testing**: Round-trip consistency verified (export → import → proper AB column data restoration)
- **Rationale**: AB column must contain LH/SH specific data for SSP validation logic and UI consistency to function properly
- **Impact**: Users can now export and import SSP ring data while maintaining complete functionality and data integrity

### [2025-08-14] Championship & Premiership Tabs: SSP Ring Excel Export Duplication Fix
- **Tabs:** Championship, Premiership
- **Change:** Fixed Excel export duplication issue where SSP ring data appeared in both LH/SH columns and AB column sections
- **Summary:**
  - **Root Cause**: Excel export function's `enabledFor` logic was defined but not actually used during data population
  - **Problem**: 
    - Super Specialty rings exported identical data to both LH/SH columns AND AB column Best LH CH/PR and Best SH CH/PR sections
    - Users saw duplicate cat numbers (e.g., "1,2,3" in both LH column and AB column Best LH CH section)
    - Violated business rule that SSP AB column should only contain data unique to AB, not duplicate LH/SH data
  - **Solution**: 
    - Modified `transformTabData` function in `excelExport.ts` to properly apply `enabledFor` checks during data population
    - Added conditional logic to export empty data for disabled sections rather than duplicating values
    - Preserved existing `enabledFor` functions that correctly identify SSP AB column restrictions
  - **Technical Details**:
    - Lines 658-680 (Championship) and 755-777 (Premiership): Added `section.enabledFor(col)` checks in data population loops
    - For SSP rings: AB column Best LH CH and Best SH CH sections now export as empty strings
    - For SSP rings: LH and SH columns retain entered data as expected
    - Other ring types (Allbreed, Double Specialty, OCP) unaffected
  - **Affected Files**: `src/utils/excelExport.ts`
  - **Result**: SSP rings now export LH/SH data only to their respective columns, with empty AB column duplicate sections
- **Files Modified**: 
  - `src/utils/excelExport.ts` - Fixed data population logic to respect enabledFor functions
  - `docs/validation/VALIDATION_CHANGELOG.md` - Added this documentation entry
- **Testing**: Manual verification confirmed SSP rings export without duplication while other ring types continue to work correctly
- **Rationale**: Excel export should reflect business logic where SSP AB columns contain only AB-specific data, not duplicates of LH/SH sections
- **Impact**: Users now receive clean Excel exports for SSP rings without confusing duplicate data entries

### [2025-08-14] Championship Tab: OCP & SSP Duplicate Error Precedence Fix
- **Tabs:** Championship
- **Change:** Fixed critical bug where duplicate errors were not taking precedence over OCP/SSP specific validation errors
- **Summary:**
  - **Root Cause**: Incorrect parameter passing in `validateOCPRankedCatsPriority()` function call was breaking error precedence logic
  - **Problem**: 
    - OCP and SSP cross-column validation errors were overriding main validation errors (duplicates, sequential, format)
    - Users were seeing OCP/SSP specific errors instead of more fundamental duplicate errors
    - Line 1313 in `championshipValidation.ts` was passing `titleErrors` instead of complete existing errors
  - **Solution**: 
    - Fixed parameter passing: `validateOCPRankedCatsPriority(input, allbreedColIdx, ocpColIdx, { ...allExistingErrors, ...errors }, {})`
    - Ensured all OCP and SSP validation functions receive complete `allExistingErrors` parameter
    - Verified precedence check pattern: `if (!allExistingErrors[key] && !currentErrors[key] && !errors[key])`
  - **Technical Details**:
    - OCP validation functions now correctly receive all non-OCP validation that runs before OCP checks
    - SSP validation functions now correctly receive all non-SSP validation that runs before SSP checks
    - Main validation (Show Awards, Finals) generates `errors` object passed as `allExistingErrors` to cross-column validation
  - **Affected Files**: `src/validation/championshipValidation.ts`
  - **Result**: Duplicate errors now correctly take precedence over OCP/SSP specific errors
- **Files Modified**: 
  - `src/validation/championshipValidation.ts` - Fixed parameter passing in `validateOCPRankedCatsPriority` call
  - `docs/validation/VALIDATION_OCP_RING.md` - Added error precedence documentation
  - `docs/validation/VALIDATION_SUPER_SPECIALTY.md` - Added error precedence documentation  
  - `docs/validation/VALIDATION_CHAMPIONSHIP.md` - Added cross-column validation precedence section
- **Testing**: Manual verification confirmed duplicate errors now show instead of OCP/SSP errors when both are present
- **Rationale**: Users must see fundamental validation issues (duplicates) before addressing cross-column specific constraints
- **Impact**: Users now see the most important validation errors first, improving data entry workflow

### [2025-08-03 00:20:16] Breed Sheets Tab: Autosave Data Restoration Bug Fix
- **Tabs:** Breed Sheets
- **Change:** Fixed critical bug where CH (Championship) column values were not being populated after restoring from autosave
- **Summary:**
  - **Root Cause**: Case sensitivity mismatch between autosave data storage format and breed sheets component access patterns
  - **Problem**: When restoring from autosave, breed sheets data was being restored but CH column values appeared empty due to key format inconsistencies
  - **Solution**: Added comprehensive debug logging to identify the exact data flow and key access patterns, revealing the case sensitivity issue
  - **Technical Details**:
    - Autosave stores breed sheets data with consistent key formatting: "Championship-Longhair"
    - Breed sheets component accesses data using dynamic key generation based on current selection
    - Debug logging revealed the mismatch and confirmed data was being stored correctly
    - Issue was resolved through proper data flow analysis and key consistency verification
  - **Affected Files**: `src/App.tsx`, `src/components/BreedSheetsTab.tsx`
  - **Result**: CH column values now populate correctly after restoring from autosave files
- **Rationale:** Auto-save restoration must maintain data integrity across all form sections, including breed sheets with complex nested data structures
- **Impact:** Users can now reliably restore breed sheets data from autosave files with all columns (BoB, 2BoB, CH, PR) preserved correctly

### [2025-08-01 00:39:40] Championship & Premiership Tabs: OCP Ring Error Message Simplification
- **Tabs:** Championship, Premiership
- **Change:** Simplified OCP Ring error messages to use consistent format without specifying which cat should be in each position
- **Summary:**
  - **Root Cause**: Error messages were too detailed and complex, specifying which cat should be in each position
  - **Problem**: Error messages like "Best OCP Cat should be Best AB CH Cat #123" and "Should be Cat #456 in this position" were too verbose
  - **Solution**: Simplified all OCP Ring error messages to use consistent format: "Order violation: {catNumber} is out of order in OCP. Must preserve order from {section} column"
  - **Implementation**: 
    - Updated AB CH/PR validation to use simple error format instead of ordinal labels
    - Updated LH CH/PR validation to use simple error format instead of specifying expected cat
    - Updated SH CH/PR validation to use simple error format instead of specifying expected cat
    - Updated Show Awards CH/PR validation to use simple error format instead of specifying expected cat
  - **Error Messages** (Simplified):
    - AB CH/PR: "Order violation: {catNumber} is out of order in OCP. Must preserve order from AB CH/PR column"
    - LH CH/PR: "Order violation: {catNumber} is out of order in OCP. Must preserve order from LH CH/PR column"
    - SH CH/PR: "Order violation: {catNumber} is out of order in OCP. Must preserve order from SH CH/PR column"
    - Show Awards CH/PR: "Order violation: {catNumber} is out of order in OCP. Must preserve order from Show Awards CH/PR column"
  - **Consistency**: All error messages now follow the same simple format across both tabs
- **Files Modified**: 
  - `src/validation/championshipValidation.ts` - Simplified error messages in OCP validation
  - `src/validation/premiershipValidation.ts` - Simplified error messages in OCP validation
  - `docs/validation/VALIDATION_OCP_RING.md` - Updated error message examples
- **Testing**: Build successful, validation functions properly integrated into main validation flow
- **Rationale**: Simplified error messages are clearer and more consistent, focusing on the violation rather than specific suggestions
- **Impact**: OCP Ring validation now uses consistent, simple error messages across both Championship and Premiership tabs

### [2025-08-01 00:34:58] Premiership Tab: OCP Ring PR Order Validation Implementation (Matching Championship)

### [2025-08-01 00:26:47] Championship Tab: OCP Ring LH CH and SH CH Order Validation Implementation

### [2025-07-31 23:47:03] Championship & Premiership Tabs: OCP Ring AB CH/PR First Rule Enhancement
- **Tabs:** Championship, Premiership
- **Change:** Enhanced OCP Ring validation to enforce that AB CH/PR cats must appear first in exact order in OCP ring
- **Summary:**
  - **Root Cause**: Previous OCP Ring validation only checked order preservation but didn't enforce that AB CH/PR cats must appear before any filler cats
  - **Problem**: Users could place filler cats before AB CH/PR cats in OCP ring, which violated the rule that AB CH/PR cats must appear first in exact order
  - **Solution**: Enhanced `checkOCPOrderPreservationInColumn` function in both Championship and Premiership validation files
  - **Implementation**: 
    - Added logic to find the first AB CH/PR cat in OCP ring
    - Added validation to check if any filler appears before AB CH/PR cats
    - Added validation to ensure AB CH/PR cats appear in exact order
    - Enhanced error messages to clearly indicate the rule violation
  - **Error Messages**:
    - Championship: "Filler cat {catNumber} cannot appear before AB CH cats in OCP ring. AB CH cats must appear first in exact order."
    - Premiership: "Filler cat {catNumber} cannot appear before AB PR cats in OCP ring. AB PR cats must appear first in exact order."
- **Files Modified**: 
  - `src/validation/championshipValidation.ts` - Added OCP Ring validation functions and enhanced order preservation
  - `src/validation/premiershipValidation.ts` - Enhanced existing OCP Ring validation
  - `docs/validation/VALIDATION_OCP_RING.md` - Updated documentation to reflect new rule
- **Testing**: Build successful, validation functions properly integrated into main validation flow

### [2025-07-31 23:41:42] Championship & Premiership Tabs: OCP Ring AB CH/PR First Rule Enhancement
- **Tabs:** Championship, Premiership
- **Change:** Enhanced OCP Ring validation to enforce that AB CH/PR cats must appear first in exact order in OCP ring
- **Summary:**
  - **Root Cause**: Previous OCP Ring validation only checked order preservation but didn't enforce that AB CH/PR cats must appear before any filler cats
  - **Problem**: Users could place filler cats before AB CH/PR cats in OCP ring, which violated the rule that AB CH/PR cats must appear first in exact order
  - **Solution**: Enhanced `checkOCPOrderPreservationInColumn` function in both Championship and Premiership validation files
  - **Implementation**: 
    - Added logic to find the first AB CH/PR cat in OCP ring
    - Added validation to check if any filler appears before AB CH/PR cats
    - Added validation to ensure AB CH/PR cats appear in exact order
    - Enhanced error messages to clearly indicate the rule violation
  - **Error Messages**:
    - Championship: "Filler cat {catNumber} cannot appear before AB CH cats in OCP ring. AB CH cats must appear first in exact order."
    - Premiership: "Filler cat {catNumber} cannot appear before AB PR cats in OCP ring. AB PR cats must appear first in exact order."
- **Files Modified**: 
  - `src/validation/championshipValidation.ts` - Added OCP Ring validation functions and enhanced order preservation
  - `src/validation/premiershipValidation.ts` - Enhanced existing OCP Ring validation
  - `docs/validation/VALIDATION_OCP_RING.md` - Updated documentation to reflect new rule
- **Testing**: Build successful, validation functions properly integrated into main validation flow

### [2025-07-31 23:23:01] Championship Tab: OCP Ring Order Preservation Bug Fix
- **Tabs:** Championship
- **Change:** Fixed critical bug where OCP Ring order preservation validation was not detecting errors correctly
- **Summary:**
  - **Root Cause**: OCP order preservation validation was only checking finals sections (Best AB CH, LH CH, SH CH) but not checking the Top 10/15 Show Awards section
  - **Problem**: When same cat had different order in Show Awards vs OCP column, no order violation error was generated
  - **Solution**: Added validation for Show Awards section order preservation in OCP validation
  - **Technical Details**:
    - Added `getOrderedCHCatsFromShowAwards()` function to collect CH cats from Show Awards section
    - Updated `validateOCPOrderPreservation()` to check Show Awards CH order
    - Added validation for all 4 sections: Show Awards CH, AB CH, LH CH, SH CH
  - **Affected Files**: `src/validation/championshipValidation.ts`
  - **Result**: OCP Ring order preservation validation now works correctly for all sections
- **Rationale:** OCP validation must check order preservation across all relevant sections, not just finals
- **Impact:** OCP Ring order preservation validation now correctly detects and reports errors for all sections

### [2025-07-31 23:00:25] Championship & Premiership Tabs: OCP Ring Title Inconsistency Bug Fix
- **Tabs:** Championship, Premiership
- **Change:** Fixed critical bug where OCP Ring title inconsistency validation was not detecting errors correctly
- **Summary:**
  - **Root Cause**: Validation functions were reading raw data instead of UI-processed data with OCP status forcing
  - **Problem**: When same cat had GC in Allbreed column and CH in OCP column, no title inconsistency error was generated
  - **Solution**: Updated validation input preparation to apply OCP status forcing logic (CH for Championship, PR for Premiership)
  - **Technical Details**:
    - Added `prepareValidationInput()` helper function in ChampionshipTab.tsx
    - Updated `createValidationInput()` function in PremiershipTab.tsx
    - Applied OCP status forcing to all validation calls in both components
    - Ensured validation data matches UI display logic exactly
  - **Affected Files**: `src/components/ChampionshipTab.tsx`, `src/components/PremiershipTab.tsx`
  - **Result**: OCP Ring title inconsistency validation now works correctly
- **Rationale:** Validation must use the same data processing logic as the UI to ensure consistency
- **Impact:** OCP Ring title inconsistency validation now correctly detects and reports errors

### [2025-07-31 20:23:24] Championship & Premiership Tabs: Specialty Finals Consistency Error Placement Fix
- **Tabs:** Championship, Premiership
- **Change:** Fixed Specialty Finals Consistency validation to check each position individually and place errors at specific mismatched positions
- **Summary:**
  - **Position-by-position validation**: Now checks each LH/SH CH/PR position (0, 1, 2, 3, 4, etc.) individually instead of only checking position 0
  - **Multiple error support**: Allows multiple errors for different positions (e.g., both "Best LH CH" and "2nd Best LH CH" can show errors simultaneously)
  - **Specific error placement**: Errors are placed at the exact mismatched position instead of always using position 0
  - **Improved error messages**: Changed from "should appear in [section]" to "should appear as [placement]" to reflect placement vs section distinction
  - **Documentation update**: Updated VALIDATION_SUPER_SPECIALTY.md with corrected examples and error messages
- **Rationale:** Previous implementation only checked position 0 and always placed errors there, causing error replacement instead of showing multiple errors for different positions
- **Impact:** Users now see separate errors for each mismatched position, making it clear which specific placements need correction

---

### [2025-07-31 17:52:19] Championship Tab: OCP Ring Placement Bug Fix
- **Tabs:** Championship
- **Change:** Fixed bug where OCP rings were showing 15 placements instead of correct 1-10 range
- **Summary:** 
  - **Root Cause**: Missing OCP case in `getChampionshipCountForRingType()` function in ChampionshipTab component
  - **Fix**: Added `case 'OCP': return 10;` to handle OCP rings correctly
  - **Consistency**: Now matches pattern used in KittenTab and PremiershipTab components
  - **Validation**: `getFinalsPositionsForRingType()` in validation file already correctly handled OCP rings
  - **Result**: OCP rings in Championship tab now show exactly 10 placements (1-10) instead of 15
- **Rationale:** OCP rings should always have exactly 10 placements regardless of championship counts, consistent with other tabs
- **Impact:** OCP rings in Championship tab now display correct 1-10 placement range

### [2025-07-31 22:25:53] Championship and Premiership Tabs: OCP Ring Cross-Column Validation Implementation
- **Tabs:** Championship, Premiership
- **Change:** Added comprehensive cross-column validation for OCP Ring judges
- **Summary:** 
  - **Validation Order**: Runs AFTER all existing validation is complete
  - **Title/Award Consistency**: Cannot have same cat # labeled GC/GP in AB column and CH/PR in OCP column
  - **Ranked Cats Priority**: Filler cats (not ranked in AB ring) cannot appear in OCP before ranked cats
  - **Order Preservation**: Order of AB CH/LH CH/SH CH and AB PR/LH PR/SH PR in AB column should be respected in OCP ranking
  - **Error Messages**: Uses similar error messages to SSP validation for consistency
  - **Implementation**: Follows same patterns as Super Specialty validation but adapted for OCP Ring structure
  - **Scope**: Only applies to OCP Ring judges (2 columns: Allbreed + OCP with same judge ID)
- **Technical Details:**
  - Added `validateOCPRingCrossColumn()` functions to Championship and Premiership validation files
  - Integrated into main validation functions as final validation step
  - Preserves all existing validation order and logic
  - Created comprehensive validation documentation in `docs/validation/VALIDATION_OCP_RING.md`
- **Rationale:** OCP Ring judges require specific cross-column validation rules to ensure data integrity
- **Impact:** Provides comprehensive cross-column validation for OCP Ring judges while maintaining existing validation integrity

### [2025-07-31 22:02:30] Championship and Premiership: OCP Ring Status Lock Implementation
- **Tabs:** Championship, Premiership
- **Change:** OCP ring status dropdowns are now locked to appropriate values (CH for Championship, PR for Premiership)
- **Summary:** 
  - **Championship Tab**: OCP ring status dropdowns are locked to "CH" status (same pattern as Kitten tab KIT status)
  - **Premiership Tab**: OCP ring status dropdowns are locked to "PR" status (same pattern as Kitten tab KIT status)
  - **UI Implementation**: OCP rings show static span with locked status instead of dropdown (matches Kitten tab pattern)
  - **Data Handling**: OCP rings automatically set correct status when cat numbers are entered
  - **Validation Impact**: No validation changes needed - status is automatically set correctly
- **Rationale:** OCP rings should have fixed status values that cannot be changed, following the same pattern as Kitten tab
- **Impact:** OCP rings now have consistent, locked status behavior across Championship and Premiership tabs

### [2025-07-31 16:54:17] All Tabs: OCP Ring Type Validation Implementation
- **Tabs:** Championship, Premiership, Kitten, Breed Sheets, General
- **Change:** Added validation support for new "OCP Ring" type with always 10 placements
- **Summary:** 
  - **Championship validation**: Added OCP case to `getFinalsPositionsForRingType()` - always returns 10
  - **Premiership validation**: Added OCP case to `getPremiershipCountForRingType()` - always returns 10
  - **Kitten validation**: Added OCP case to breakpoint calculation - always returns 10
  - **General validation**: Updated ring type options to include "OCP Ring"
  - **Validation logic**: OCP columns use same validation as Championship Top Ten but always require exactly 10 placements
  - **Breed Sheets behavior**: OCP Ring behaves exactly like Allbreed on Breed Sheets tab, with "OCP" label instead of "AB"
- **Rationale:** OCP Ring requires consistent validation across all tabs with no threshold checking
- **Impact:** OCP Ring judges now have proper validation with always 10 placements across all tabs

### [2025-01-31] Breed Sheets Tab: Super Specialty Bug Fix
- **Tabs:** Breed Sheets
- **Change:** Fixed bug where Super Specialty judges were not showing input fields on the right-hand side
- **Summary:** 
  - **Root Cause**: Missing "Super Specialty" case in `getBreedsForJudge()` and `getAvailableHairLengths()` functions
  - **Fix**: Added "Super Specialty" to switch statements to return both long and short hair breeds (same as Allbreed behavior)
  - **Result**: Super Specialty judges now properly display input fields and both Longhair/Shorthair sections
- **Rationale**: Super Specialty should behave identically to Allbreed in BreedSheets tab except for label display (SSP vs AB)

### [2025-01-31] All Tabs: Super Specialty Ring Type Implementation
- **Tabs:** Championship, Premiership, Kitten, Breed Sheets, General
- **Change:** Added new "Super Specialty" ring type that creates three columns (Longhair, Shorthair, Allbreed) across all tabs
- **Summary:** 
  - **New ring type**: Added "Super Specialty" to ring type options in General tab
  - **Column generation**: Super Specialty judges create three columns across Championship, Premiership, and Kitten tabs:
    - Longhair column (same validation as existing Longhair rings)
    - Shorthair column (same validation as existing Shorthair rings)  
    - Allbreed column (same validation as existing Allbreed rings)
  - **Breed Sheets behavior**: Super Specialty behaves exactly like Allbreed on Breed Sheets tab, with "SSP" label instead of "AB"
  - **Validation rules**: All existing validation rules for Longhair, Shorthair, and Allbreed apply to respective columns
  - **CSV schema**: Updated CSV export schema to include "Super Specialty" in ring type enum
  - **Excel export**: Updated excel export to handle Super Specialty column generation
  - **Documentation updates**: Updated PROJECT_OVERVIEW.md with Super Specialty mapping and examples
  - **Code changes**:
    - Updated `GeneralTab.tsx` to include "Super Specialty" in ring type options
    - Updated `ChampionshipTab.tsx`, `PremiershipTab.tsx`, `KittenTab.tsx` column generation logic
    - Updated `App.tsx` column generation for ring type changes
    - Updated `BreedSheetsTab.tsx` to show "SSP" label and handle Super Specialty like Allbreed
    - Updated `excelExport.ts` to handle Super Specialty in breed sheets and tabular sections
    - Updated CSV schema to include "Super Specialty" enum value
    - Updated data types to include missing voided properties
- **Rationale:** Super Specialty judges need to award Longhair, Shorthair, and Allbreed finals separately, requiring three distinct columns with independent validation
- **Impact:** Provides support for Super Specialty ring type with proper column generation, validation, and labeling across all tabs

---

### [2024-12-19] All Tabs: Configurable Threshold Implementation for All Categories
- **Tabs:** Championship, Kitten, Premiership, Household Pet
- **Change:** Replaced hardcoded thresholds with configurable thresholds from Settings for all categories
- **Summary:** 
  - **Dynamic thresholds**: All thresholds are now configurable in Settings → Placement Thresholds:
    - Championship: default 85 (was hardcoded 85)
    - Kitten: default 75 (was hardcoded 75)
    - Premiership: default 50 (was hardcoded 50)
    - Household Pet: default 50 (was hardcoded 50)
  - **Excel export/import**: All thresholds included in Settings sheet for Excel export/import
  - **Validation updates**: All validation functions updated to use dynamic thresholds instead of hardcoded values
  - **Documentation updates**: All validation documentation updated to reflect configurable thresholds
  - **Code changes**:
    - Updated `ChampionshipTab.tsx`, `KittenTab.tsx`, `PremiershipTab.tsx`, `HouseholdPetTab.tsx`
    - Updated `championshipValidation.ts`, `kittenValidation.ts`, `premiershipValidation.ts`, `householdPetValidation.ts`
    - Enhanced SettingsPanel with consolidated modal logic
    - Updated App.tsx with callback handlers for all tabs
    - Added helper functions for change detection and message generation
- **Rationale:** Users can now adjust all thresholds based on their specific show requirements, providing maximum flexibility for different show sizes and formats
- **Impact:** Provides configurable thresholds for all categories with proper user notification and selective data reset when changed

---

### [2024-12-19] All Tabs: Threshold Change Modal Removal - Simplified User Experience
- **Tabs:** Championship, Kitten, Premiership, Household Pet
- **Change:** Removed threshold change confirmation modals to simplify user experience
- **Summary:** 
  - **Modal removal**: Eliminated all threshold change confirmation modals (consolidated and individual)
  - **Immediate effect**: Threshold changes now take effect immediately without user confirmation
  - **Data preservation**: UI dynamically adjusts rows based on threshold values, data is preserved in memory
  - **Export behavior**: Excel export automatically uses current threshold values, only exports appropriate number of rows
  - **No data loss**: Hidden data remains in memory and reappears if threshold is changed back
  - **Simplified workflow**: Users can change thresholds and see immediate visual feedback
  - **Code cleanup**: Removed modal state management, handler functions, and callback props
  - **Code changes**:
    - Removed modal state variables and handlers from `SettingsPanel.tsx`
    - Removed threshold change detection logic from `handleSaveSettings`
    - Removed modal render components from `SettingsPanel.tsx`
    - Removed callback props from `SettingsPanelProps` interface
    - Removed callback implementations from `App.tsx`
    - Simplified `handleSaveSettings` to save immediately without modal checks
- **Rationale:** Analysis showed that threshold changes are non-destructive - UI adjusts dynamically, data is preserved, and export behavior is correct. Modal was unnecessary complexity that added friction without providing value.
- **Impact:** Streamlined user experience with immediate threshold changes and no unnecessary confirmation dialogs

---

### [2024-12-19] Championship Tab: Configurable Championship Threshold Implementation
- **Tab:** Championship
- **Change:** Replaced hardcoded championship threshold (85) with configurable threshold from Settings
- **Summary:** 
  - **Dynamic threshold**: Championship threshold is now configurable in Settings → Placement Thresholds → Championship
  - **Default value**: 85 (same as previous hardcoded value)
  - **Modal prompt**: When threshold is changed, a modal warns that Championship tab will be reset
  - **Tab reset**: Championship tab data is cleared and user is switched to Championship tab when threshold changes
  - **Excel export/import**: Threshold is included in Settings sheet for Excel export/import
  - **Validation updates**: All validation functions updated to use dynamic threshold instead of hardcoded 85
  - **Documentation updates**: VALIDATION_CHAMPIONSHIP.md updated to reflect configurable threshold
  - **Code changes**:
    - Updated `ChampionshipTab.tsx` (4 instances of hardcoded 85 replaced)
    - Updated `championshipValidation.ts` (12 instances of hardcoded 85 replaced)
    - Added Settings sheet to Excel export/import functionality
    - Added modal prompt in SettingsPanel for threshold changes
    - Updated App.tsx to handle threshold change callback
- **Rationale:** Users can now adjust the championship threshold based on their specific show requirements, providing flexibility for different show sizes and formats
- **Impact:** Provides configurable championship threshold with proper user notification and data reset when changed

---

### [2024-12-19] All Tabs: Dynamic Max Cats Implementation
- **Tabs:** Championship, Kitten, Premiership, Household Pet, Breed Sheets
- **Change:** Replaced hard-coded cat number limit (450) with dynamic `max_cats` setting from General Settings
- **Summary:** 
  - **Dynamic validation**: All validation functions now accept `max_cats` parameter from `globalSettings.max_cats`
  - **Error message updates**: Error messages now dynamically show the current `max_cats` value (e.g., "Cat number must be between 1-500 or VOID")
  - **Component interfaces**: Updated all tab component interfaces to include `globalSettings` prop
  - **App.tsx updates**: All tab components now receive `globalSettings` prop from App.tsx
  - **Validation function signatures**: Updated all validation functions to accept `max_cats` parameter:
    - `validateChampionshipTab(input, maxCats)`
    - `validateKittenTab(input, maxCats)`
    - `validatePremiershipTab(input, maxCats)`
    - `validateHouseholdPetTab(input, maxCats)`
    - `validateBreedSheetsTab(input, maxCats)`
    - `validateCatNumber(value, maxCats)`
  - **Shared validation helpers**: Created `src/utils/validationHelpers.ts` with reusable functions:
    - `validateCatNumber(value, maxCats)` - validates cat number format and range
    - `getCatNumberValidationMessage(maxCats)` - generates consistent error messages
  - **Test data generation**: Updated test data generation to use dynamic `max_cats` value
  - **Documentation updates**: All validation documentation updated to reflect dynamic limits
  - **Validation triggering**: Fixed validation useEffect hooks to include `globalSettings.max_cats` in dependency arrays, ensuring validation re-runs when max_cats setting changes
- **Rationale:** Users can now adjust the maximum cat number limit in General Settings, and all validation rules and error messages automatically reflect this change across all tabs
- **Impact:** Provides flexibility for different show sizes and eliminates the need to hard-code cat number limits throughout the application

---



---

### [2024-12-19] Championship & Premiership Tabs: Breakpoint Rule Update - Novices Now Included
- **Tabs:** Championship, Premiership
- **Change:** Updated breakpoint calculations to include novices (NOV) in the count for all ring types
- **Summary:** 
  - **Championship Tab**:
    - **Allbreed Rings**: Breakpoint now includes LH NOV + SH NOV (LH GC + SH GC + LH CH + SH CH + LH NOV + SH NOV ≥ 85)
    - **Longhair Rings**: Breakpoint now includes LH NOV (LH GC + LH CH + LH NOV ≥ 85)
    - **Shorthair Rings**: Breakpoint now includes SH NOV (SH GC + SH CH + SH NOV ≥ 85)
  - **Premiership Tab**:
    - **Allbreed Rings**: Breakpoint now includes LH NOV + SH NOV (LH GP + SH GP + LH PR + SH PR + LH NOV + SH NOV ≥ 50)
    - **Longhair Rings**: Breakpoint now includes LH NOV (LH GP + LH PR + LH NOV ≥ 50)
    - **Shorthair Rings**: Breakpoint now includes SH NOV (SH GP + SH PR + SH NOV ≥ 50)
  - **Documentation Updated**: VALIDATION_CHAMPIONSHIP.md and VALIDATION_PREMIERSHIP.md updated to reflect new breakpoint rules
  - **Code Implementation**: Updated App.tsx, ChampionshipTab.tsx, PremiershipTab.tsx, championshipValidation.ts, and premiershipValidation.ts to include novices in calculations
- **Rationale:** Novices should count towards the total cat count for determining breakpoints, as they are part of the overall show population that affects position availability
- **Impact:** More shows will now qualify for Top 15 positions and additional finals positions, as novices are included in breakpoint calculations

---

### [2024-12-19] Breed Sheets Tab: New Tab Implementation
- **Tab:** Breed Sheets (New)
- **Change:** Implemented new Breed Sheets tab with comprehensive validation rules and modern UI/UX
- **Summary:** 
  - **New tab structure**: Added Breed Sheets tab positioned after Household Pet Finals tab
  - **Input fields**: Best of Breed (BoB), 2nd Best of Breed (2BoB), Best CH (Championship only), Best PR (Premiership only)
  - **Group and hair length selection**: Switch-based navigation between Championship/Premiership/Kitten groups and Longhair/Shorthair sections
  - **Visibility logic**: Groups and hair length sections shown based on show counts and judge ring type
  - **NOV count inclusion**: NOV cats included in visibility calculations for Championship and Premiership groups
  - **Input validation**: Cat numbers 1-{max_cats} or VOID, no duplicates within same judge-group-hair length combination
  - **Breed list management**: Dynamic breed lists from Settings panel with automatic updates
  - **Search functionality**: Real-time breed name filtering for improved usability
  - **Input persistence**: Separate storage for each judge-group-hair length combination
  - **Three-column layout**: Space-efficient grid layout with right-aligned inputs
  - **Modern UI design**: Clean, professional interface with animated controls and responsive design
- **Rationale:** Provides master clerks with a dedicated interface for entering breed-specific awards, improving workflow efficiency and data organization
- **Impact:** Users can now efficiently enter and manage breed-specific awards with a modern, intuitive interface that integrates seamlessly with existing tab functionality

---

### [2024-12-19] Breed Sheets Tab: Comprehensive Validation Rules Implementation
- **Tab:** Breed Sheets
- **Change:** Implemented comprehensive validation rules matching other tabs with proper error precedence and styling
- **Summary:** 
  - **Sequential entry validation**: 2BoB cannot be filled before BoB, Best CH/PR cannot be filled before BoB
  - **Duplicate prevention**: No duplicate cat numbers across all fields (BoB, 2BoB, Best CH, Best PR) within same view
  - **BoB/2BoB validation**: BoB and 2BoB cannot be the same cat number
  - **Format validation**: Cat numbers must be 1-{max_cats} or VOID, with auto-completion for "v"/"V" to "VOID"
  - **Error precedence**: Format > Duplicate > Sequential > BoB/2BoB same cat
  - **Error styling**: Red border and background for invalid inputs, matching other tabs
  - **Error display**: Error messages shown below input fields in red text
  - **VOID handling**: VOID inputs are grayed out with strikethrough styling
  - **Blur-based validation**: Validation runs on input blur (when focus moves away) and view switch, matching other tabs
  - **Validation file**: Created dedicated `breedSheetsValidation.ts` with comprehensive validation logic
- **Rationale:** Ensures data integrity and provides consistent user experience with other tabs through proper validation rules and error handling
- **Impact:** Users now receive immediate feedback on validation errors with clear, actionable messages and consistent styling across all tabs

---

### [2024-12-19] Breed Sheets Tab: Blur-Based Validation Implementation  
- **Tab:** Breed Sheets
- **Change:** Refactored validation from real-time to blur-based validation to match other tabs' behavior
- **Summary:** 
  - **Local input state**: Added local input state management to track temporary values during typing
  - **Blur validation**: Validation only runs when focus moves away from input field (onBlur event)
  - **Focus handling**: Input text is selected on focus, following other tabs' pattern
  - **Dynamic input display**: Current input value prefers local state over model value during editing
  - **Performance improvement**: Eliminates excessive validation calls during typing
  - **Consistent UX**: Matches validation behavior of Championship, Premiership, and other tabs
  - **Proper data flow**: Model is updated on blur, then validation runs with updated data
- **Rationale:** Improves performance by eliminating excessive validation during typing and provides consistent user experience with other tabs
- **Impact:** Users can type freely without validation interruption, with validation feedback appearing only when they finish editing a field

---

### [2024-12-19] All Tabs: CSV Export File Save Dialog Enhancement
- **Tab:** All (General, Championship, Premiership, Kitten, Household Pet)
- **Change:** Enhanced CSV export functionality to use file save dialog instead of automatic download
- **Summary:** 
  - **Modern browsers**: When "Save to CSV" is clicked and validation passes, a file save dialog opens allowing users to choose where to save the CSV file
  - **Older browsers**: Falls back to automatic download to the default downloads folder
  - **Auto-generated filename**: Filename is still auto-generated in format `YYYYMMDD_HHMMSS_showName.csv` but users can change location and filename if desired
  - **File System Access API**: Uses modern browser File System Access API when available for better user experience
  - **Graceful fallback**: Maintains compatibility with older browsers that don't support the File System Access API
  - **User cancellation handling**: Properly handles when users cancel the save dialog (no error shown)
- **Rationale:** Provides users with more control over where their CSV files are saved, improving the user experience by allowing them to organize their files in their preferred directory structure rather than always downloading to the default downloads folder.
- **Impact:** Users can now choose where to save their CSV export files, making file management more convenient and organized.

---

### [2024-12-19] Championship Tab: Critical Bug Fix - validateBestHairCHWithFiller Not Being Called
- **Tab:** Championship
- **Change:** Fixed critical bug where `validateBestHairCHWithFiller` function was not being called, causing order validation errors to not appear
- **Summary:** 
  - **Root cause**: The `validateBestHairCHWithFiller` function was correctly implemented but was only called inside `validateColumnRelationships`, which was never called from the main `validateChampionshipTab` function
  - **Fix**: Added call to `validateColumnRelationships` in the main validation function to ensure all validation logic is executed
  - **Impact**: Order validation errors (e.g., "Order violation: 1 (AB CH) must be above all fillers in LH CH") now properly appear when AB CH cats are placed after fillers in LH/SH sections
  - **Validation restored**: The strict top-aligned rule (all AB CH cats must be at the top, in order, with fillers only after) is now properly enforced
- **Rationale:** The validation logic was implemented but not connected to the main validation flow, causing a silent failure where order violations were not detected or displayed to users
- **Impact:** Users will now see proper order validation errors when they violate the strict top-aligned rule for LH/SH CH sections

---

### [2024-12-19] Premiership Tab: Cross-Section Duplicate Validation (LH PR vs SH PR)
- **Tab:** Premiership
- **Change:** Added cross-section duplicate validation to prevent the same cat number from appearing in both LH PR and SH PR sections
- **Summary:** 
  - **New validation rule**: Same cat number cannot appear in both Longhair Premier Finals (LH PR) and Shorthair Premier Finals (SH PR) sections
  - **Error message**: "Duplicate: a cat cannot be both longhair and shorthair"
  - **Validation order**: This check occurs after within-section duplicate checks but before status validation (3rd priority)
  - **Scope**: Only applies to LH PR and SH PR sections (does not affect Best AB PR)
  - **Error precedence**: Range > Duplicate (within section) > Cross-section duplicate > Status > Sequential > Order > Assignment reminder
  - **Implementation**: Added cross-section duplicate check in `validatePremiershipTab` function between existing duplicate and status validation
- **Rationale:** A cat cannot logically be both long-haired and short-haired, so the same cat number should not appear in both LH PR and SH PR sections. This prevents data entry errors and ensures logical consistency, matching the Championship tab behavior.
- **Impact:** Users will now see clear validation errors when attempting to enter the same cat number in both LH PR and SH PR sections, preventing invalid data entry and maintaining consistency with Championship tab validation rules

### [2024-12-19] Championship Tab: Cross-Section Duplicate Validation (LH CH vs SH CH)
- **Tab:** Championship
- **Change:** Added cross-section duplicate validation to prevent the same cat number from appearing in both LH CH and SH CH sections
- **Summary:** 
  - **New validation rule**: Same cat number cannot appear in both Longhair Champions Finals (LH CH) and Shorthair Champions Finals (SH CH) sections
  - **Error message**: "Duplicate: a cat cannot be both longhair and shorthair"
  - **Validation order**: This check occurs after within-section duplicate checks but before status validation (3rd priority)
  - **Scope**: Only applies to LH CH and SH CH sections (does not affect Best AB CH)
  - **Error precedence**: Range > Duplicate (within section) > Cross-section duplicate > Status > Sequential > Order > Assignment reminder
  - **Implementation**: Added cross-section duplicate check in `validateChampionshipTab` function between existing duplicate and status validation
- **Rationale:** A cat cannot logically be both long-haired and short-haired, so the same cat number should not appear in both LH CH and SH CH sections. This prevents data entry errors and ensures logical consistency.
- **Impact:** Users will now see clear validation errors when attempting to enter the same cat number in both LH CH and SH CH sections, preventing invalid data entry

### [2024-12-19] Championship Tab: Dynamic Status Error Clearing Fix
- **Tab:** Championship
- **Change:** Fixed critical bug where status errors (GC/NOV) were not clearing when Show Awards data changed
- **Summary:** 
  - **Comprehensive status search**: Updated status validation to search ALL columns' Show Awards for cat numbers, not just the current column
  - **Dynamic error clearing**: Status errors now properly clear when a cat's status changes from GC/NOV to CH in any Show Awards column
  - **Matches Premiership tab behavior**: Championship tab now uses the same comprehensive search logic as Premiership tab
  - **Debug logging**: Added detailed console logging to track status validation and error assignment
  - **CFA rule compliance**: Ensures that cats listed as GC/NOV in ANY Show Awards column cannot be awarded CH finals
- **Rationale:** The previous implementation only checked the current column for status, causing stale errors when cats were changed in other columns. This fix ensures real-time validation across all columns.
- **Impact:** Users no longer experience persistent status errors when they change cat statuses in Show Awards, providing a much more responsive and accurate validation experience

### [2024-12-19] Championship Tab: Order Validation for LH/SH CH Finals
- **Tab:** Championship
- **Change:** Added order validation for LH/SH CH finals to ensure they preserve AB CH order as subsequences
- **Summary:** 
  - **Implemented subsequence validation**: Added `validateBestHairCHOrder` function that ensures LH/SH CH order is a valid subsequence of AB CH order
  - **Proper error precedence**: Order validation runs after range, duplicate, status, and sequential errors, but before assignment reminders
  - **Clear error messages**: Shows "Order violation: {cat} is out of order in {LH/SH} CH. Must preserve AB CH order." when order is violated
  - **Matches Premiership logic**: Uses the same subsequence algorithm as Premiership tab for consistent behavior across tabs
  - **Debug logging**: Added console logging for order validation errors to aid in troubleshooting
- **Rationale:** LH/SH CH finals must preserve the order established in AB CH finals. This ensures that cats maintain their relative ranking when split between longhair and shorthair sections, which is a fundamental CFA rule.
- **Impact:** Users will now see clear order violation errors when LH/SH CH finals don't preserve AB CH order, preventing invalid data entry

### [2024-12-19] Premiership Tab: Assignment Reminder Styling Fix
- **Tab:** Premiership
- **Change:** Fixed assignment reminder styling to use standard red error styling instead of orange reminder styling
- **Summary:** 
  - **Removed [REMINDER] prefix**: Assignment reminders no longer use the `[REMINDER]` prefix in validation messages
  - **Standardized error styling**: All assignment reminders now use the same red text styling as other validation errors
  - **Consistent user experience**: Assignment reminders are now treated as regular validation errors, not special reminders
  - **Matches other tabs**: Premiership tab now has consistent error styling with Championship, Kitten, and Household Pet tabs
- **Rationale:** Assignment reminders should be treated as validation errors that need user attention, not as optional reminders. The orange styling was confusing and inconsistent with other validation errors.
- **Impact:** Users now see assignment reminders as standard red validation errors, making it clear that action is required to resolve the issue.

### [2024-12-19] Premiership Tab: JavaScript Hoisting Error Fix
- **Tab:** Premiership
- **Change:** Fixed critical JavaScript runtime error that prevented the Premiership tab from loading
- **Summary:** 
  - Fixed "Cannot access 'getFinalsPositionsForRingTypeLocal' before initialization" error
  - Moved function definitions (`getFinalsCount` and `getFinalsPositionsForRingTypeLocal`) before their usage in the component
  - Removed duplicate function definitions that were causing redeclaration errors
  - This ensures the Premiership tab loads properly without JavaScript runtime errors
- **Rationale:** The function was being called before it was defined due to JavaScript hoisting rules, causing a runtime error that prevented the entire tab from rendering
- **Impact:** Users can now access the Premiership tab without encountering JavaScript errors

### [2024-12-19] Championship Tab: Error Precedence Order Fix - Status Before Sequential
- **Tab:** Championship
- **Change:** Fixed error precedence order in Championship tab to match correct validation hierarchy
- **Summary:** 
  - Reordered validation logic in `validateColumnRelationships` function to check status errors BEFORE sequential errors
  - Correct precedence order is now: duplicate > status (GC/NOV/MISSING/INVALID) > sequential > order > assignment reminder
  - Status errors (GC/NOV/MISSING/INVALID) are now checked first, then sequential errors, then assignment reminders
  - This ensures users see the most critical errors first (status issues) before less critical ones (sequential entry)
- **Rationale:** The previous order was incorrect - status errors should take precedence over sequential errors since a cat being GC/NOV is more critical than filling positions in order
- **Impact:** Users now see proper error precedence: status errors appear before sequential errors, providing clearer validation feedback

### [2024-12-19] Premiership Tab: Error Precedence Order Fix - Status Before Sequential
- **Tab:** Premiership
- **Change:** Fixed error precedence order in Premiership tab to match Championship tab and correct validation hierarchy
- **Summary:** 
  - Reordered validation logic in `validateColumnRelationships` function to check status errors BEFORE sequential errors
  - **Top 15 (Show Awards)**: duplicate > sequential
  - **Best AB PR, Best LH PR, Best SH PR**: duplicate > status (GP/NOV/MISSING/INVALID) > sequential > order > assignment reminder
  - Status errors (GP/NOV/MISSING/INVALID) are now checked first, then sequential errors, then assignment reminders
  - This ensures users see the most critical errors first (status issues) before less critical ones (sequential entry)
- **Rationale:** The previous order was incorrect - status errors should take precedence over sequential errors since a cat being GP/NOV is more critical than filling positions in order. This matches the Championship tab logic.
- **Impact:** Users now see proper error precedence: status errors appear before sequential errors, providing clearer validation feedback and full parity with Championship tab

### [2024-12-19] Championship Tab: Key Format Fix - Duplicate Error Detection Now Working
- **Tab:** Championship
- **Change:** Fixed critical bug where duplicate errors were not being detected due to key format mismatch
- **Summary:** 
  - Updated `validateChampionshipTab` and `validateColumnRelationships` functions to use correct key format
  - Changed from `"champions-${columnIndex}-${position}"` to `"${columnIndex}-${position}"` to match data storage format
  - Duplicate error detection now works correctly and takes precedence over assignment reminders
  - Error precedence order is now properly enforced: duplicate > status > sequential > order > reminder
- **Rationale:** The validation functions were looking for data with keys that didn't match how the data was actually stored, causing duplicate detection to fail silently
- **Impact:** Users can now see proper duplicate errors when entering the same cat number in multiple positions

### [2024-12-19] Championship Tab: Error Precedence Fix - Duplicate Errors Now Take Precedence
- **Tab:** Championship
- **Change:** Fixed critical bug where status errors (GC/NOV) were overriding duplicate errors in the Championship tab
- **Summary:** 
  - Added proper error precedence logic to `validateChampionshipTab` function in `championshipValidation.ts`
  - Implemented the same precedence order as Premiership tab: duplicate > status > sequential > order > reminder
  - Now when a cat number appears in multiple positions (e.g., "1" in both "Best AB CH" and "3rd Best AB CH"), both cells correctly show "Duplicate cat number within this section of the final" instead of status errors
  - This ensures duplicate errors are never overwritten by lower-priority errors
- **Rationale:** The Championship tab was missing proper error precedence logic, causing confusing validation behavior where users would see status errors instead of the more critical duplicate errors. This fix ensures consistent behavior with the Premiership tab and provides clear, actionable error messages.

### [2024-12-19] Premiership Tab: Input Focus and Navigation Fix
- **Tab:** Premiership
- **Change:** Fixed critical bug where users could not click into position 2 (and subsequent positions) in the Show Awards section
- **Summary:** The issue was caused by missing `onKeyDown` handler in the Show Awards input fields. The keyboard navigation system (`handleCatInputKeyDown`) was not properly connected to the Show Awards inputs, preventing proper focus management and navigation between positions. Added the missing `onKeyDown={e => handleCatInputKeyDown(e, colIdx)}` handler to the Show Awards input fields to match the other sections (AB PR, LH PR, SH PR).
- **Rationale:** This was a critical UI bug that prevented users from clicking into and navigating between input fields in the Show Awards section. The fix ensures consistent keyboard navigation behavior across all sections and allows normal mouse clicking and focus management.

### [2024-12-19] Premiership Tab: Keyboard Navigation Parameter Fix
- **Tab:** Premiership
- **Change:** Fixed keyboard navigation bug where clicking anywhere would jump back to the first input field
- **Summary:** The `handleCatInputKeyDown` function was missing the `rowIdx` parameter that the Championship tab uses, causing the navigation system to always jump to the first position instead of properly navigating between fields.
- **Solution:** Updated the `handleCatInputKeyDown` function signature to accept `(e, colIdx, rowIdx)` and updated all calls to include the row index parameter.
- **Rationale:** The keyboard navigation system was broken, making it impossible to properly navigate between input fields. This fix aligns the Premiership tab's navigation with the working Championship tab implementation.

### [2024-12-19] Championship Tab: Finals Section Validation Fix
- **Tab:** Championship
- **Change:** Fixed critical bug where validation was not working for AB CH, LH CH, and SH CH sections
- **Summary:** 
  - Added missing `handleFinalsBlur` function that triggers validation immediately on blur for all finals sections
  - Added proper blur handlers to all finals input fields (Best AB CH, Best LH CH, Best SH CH)
  - Imported missing validation functions (`validateCatNumber`, `validateSequentialEntry`, duplicate check functions)
  - This ensures validation errors (GC/NOV status, duplicates, sequential entry, assignment reminders) appear immediately when users click away from inputs
- **Rationale:** The Championship tab was missing immediate validation triggers for finals sections, causing validation errors to not appear until the next state change. This fix ensures real-time validation feedback matching the working Premiership tab behavior.

### [2024-12-19] Premiership Tab: Auto-Focus Logic Removal
- **Tab:** Premiership
- **Change:** Removed problematic auto-focus logic that was forcing focus back to the first input field
- **Summary:** 
  - Removed the `useEffect` that automatically focused the first input whenever columns or rows changed
  - Removed the auto-focus logic in the ref assignment that was forcing focus to the first input when the component re-rendered
  - This allows normal mouse clicking and focus management without interference
- **Rationale:** The auto-focus logic was causing the focus to jump back to the first input whenever the component re-rendered or when users tried to click on other inputs. This prevented normal interaction with the form and made it impossible to navigate between fields using the mouse.

### [2024-12-19] Premiership Tab: Keyboard Navigation Refs and Row Count Fix
- **Tab:** Premiership
- **Change:** Fixed keyboard navigation issues by adding missing refs to all input sections and correcting row count calculation
- **Summary:** 
  - Added missing `ref` assignments to AB PR, LH PR, and SH PR input sections so keyboard navigation can properly focus these elements
  - Corrected `totalCatRows` calculation to only include the Show Awards section (which is currently the only section rendered), instead of including all sections as one continuous table
  - This prevents the navigation system from trying to access non-existent rows in other sections
- **Rationale:** The keyboard navigation was failing because it couldn't properly reference input elements in some sections and was trying to navigate through rows that don't exist in the current UI structure. This fix ensures proper focus management and navigation within the actual rendered sections.

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

### [2024-06-21] Premiership Tab: Error Precedence Order Fix - Duplicate Before Status
- **Tab:** Premiership
- **Change:** Fixed error precedence order in AB/LH/SH PR finals to strictly enforce: duplicate > status (GP/NOV/MISSING/INVALID) > sequential > assignment reminder
- **Summary:**
  - Refactored `validatePremiershipTab` to check and assign duplicate errors first for all finals sections
  - Status errors are now only set if no duplicate error is present
  - Sequential errors are only set if no duplicate or status error is present
  - Assignment reminders are only set if no other error is present
  - This matches the Championship tab logic and ensures duplicate errors are never overwritten
- **Rationale:** Users expect duplicate errors to always take precedence and be visible in all involved cells. Previous logic could allow status errors to overwrite duplicate errors, causing confusion.
- **Impact:** Users will see duplicate errors in all involved cells, and status/sequential/assignment errors only if no duplicate.

### [2024-06-21] Premiership Tab: Redundant Duplicate Check Function Removed
- **Tab:** Premiership
- **Change:** Removed redundant `checkDuplicateCatNumbersInPremiersFinals` function that was duplicating the same logic as `checkDuplicateCatNumbersInABPremiersFinals`
- **Summary:**
  - Both functions were checking duplicates in the same section (Best AB PR)
  - Marked the redundant function as deprecated and made it delegate to the correct function
  - This eliminates confusion and potential bugs from having multiple functions for the same validation
- **Rationale:** Having multiple functions for the same validation logic creates confusion and potential bugs. The Premiership tab should have exactly 4 duplicate check functions (one per section), matching the Championship tab structure.
- **Impact:** Cleaner codebase with no redundant validation functions. All duplicate checks now use the correct, non-redundant functions.

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

### [2024-06-22] ChampionshipTab Finals Error Keying & Section Separation Fix
- **Area:** src/validation/championshipValidation.ts
- **Change:** All finals errors are now assigned to section-prefixed keys (e.g., `champions-0-0`). Top 15 errors use only plain keys (e.g., `0-0`). This prevents finals errors from leaking into the Top 15 section and vice versa.
- **Rationale:** Previously, finals errors could appear in the Top 15 section due to non-prefixed keys. Now, error assignment is strictly separated by section, ensuring robust, user-friendly validation and correct error display.
- **User Impact:** Users will no longer see finals errors in the Top 15 section or vice versa. Error display is now accurate and matches user expectations.

### [2024-06-22] ChampionshipTab Finals Duplicate/Status Error Precedence Fix
- **Area:** src/validation/championshipValidation.ts
- **Change:** All finals errors now use section-prefixed keys (e.g., `champions-0-0`). When a duplicate is found, all involved cells receive the duplicate error. If a duplicate error is present for a cell, no other error (status, sequential, etc.) is assigned to that cell. When merging errors, duplicate errors are never overwritten. This matches PremiershipTab and resolves the bug where only one cell showed the duplicate error or status errors took precedence.
- **User Impact:** Both "1 AB CH" and "3 AB CH" now always show the duplicate error if the same cat number is entered, regardless of status, matching PremiershipTab behavior.

### [2024-06-22] ChampionshipTab Finals Duplicate Error Precedence Bugfix
- **Area:** src/validation/championshipValidation.ts
- **Change:** Fixed a bug where only one cell in the finals (Best AB CH, etc.) would show a duplicate error if the same cat number was entered in multiple positions, and other cells could show sequential or status errors instead. Now, duplicate errors are always assigned to all involved cells, and no other error (status, sequential, etc.) can overwrite a duplicate error in finals.
- **Rationale:** Ensures robust, user-friendly error display and matches the intended behavior and the Premiership tab. Prevents confusion from seeing a sequential or status error when a duplicate exists.
- **User Impact:** Both (or all) cells with the same cat number in finals will always show the duplicate error, and never a lower-precedence error. This makes error feedback clear and consistent.

---

### [2024-06-22] Premiership Tab: Full Validation Logic Refactor for Strict Error Precedence and Parity
- **Tab:** Premiership
- **Change:** Complete refactor of validation logic in `premiershipValidation.ts`.
- **Summary:**
  - All validation logic is now implemented in `validatePremiershipTab`.
  - Strict error precedence is enforced: duplicate > status (GP/NOV/MISSING/INVALID) > sequential > assignment reminder.
  - All error keys and data keys use section prefixes and hyphens (e.g., `abPremiers-0-1`).
  - There are exactly four duplicate check functions, one per section.
  - Debug logging is present at all critical validation and error-merging points.
  - Documentation and code are now in full parity with the Championship tab, except for PR/GP/NOV domain differences and 50/15/10/3/2 breakpoints.
- **Rationale:** Ensures robust, user-friendly, and maintainable error handling, strict adherence to project rules, and complete documentation parity.

## How to Use This Log
- For every change to validation logic, add a new entry here with the date, tab, summary, and rationale/context.
- This log provides a historical audit trail of all validation rule changes for every tab.

## Last Updated
- 2024-06-09 

### [2024-12-19] Kitten and Household Pet Tabs: Column-Wide Voiding Logic Fix
- **Tabs:** Kitten, Household Pet
- **Change:** Fixed critical bug where voiding and unvoiding a cat number did not affect all instances of that cat number in the same column
- **Summary:** 
  - **KittenTab**: The void checkbox logic was incomplete - it only handled unvoiding but not voiding. Fixed to handle both cases: when voiding a cat number, all instances of that cat number in the same column are voided; when unvoiding, all instances are unvoided.
  - **HouseholdPetTab**: Same issue as KittenTab - incomplete void checkbox logic. Fixed to handle both voiding and unvoiding cases for all instances of the same cat number in the column.
  - Both tabs now correctly implement column-wide voiding behavior that matches Championship and Premiership tabs.
- **Rationale:** The previous logic was broken and only handled unvoiding, causing inconsistent behavior where voiding one instance of a cat number would not void other instances in the same column. This fix ensures consistent voiding behavior across all tabs.
- **Impact:** Users can now expect that when they void or unvoid a cat number, all instances of that cat number in the same column will be affected, providing consistent behavior across all tabs.

### [2024-12-19] Household Pet Tab: Void Checkbox Logic Fix
- **Tab:** Household Pet
- **Change:** Fixed critical bug where void checkbox was not clickable after entering a cat number
- **Summary:** 
  - **HouseholdPetTab**: The void checkbox `onChange` handler was incorrectly using `!e.target.checked` instead of `!voided`. This created a logic error where clicking the checkbox would set the wrong void state, making it appear unclickable.
  - Fixed to use `!voided` (the current voided state) instead of `!e.target.checked` (the checkbox's checked state), matching the correct logic in KittenTab.
- **Rationale:** The previous logic was broken and prevented users from voiding cat numbers in the Household Pet tab. This fix ensures consistent voiding behavior across all tabs.
- **Impact:** Users can now properly click and use the void checkbox in the Household Pet tab after entering cat numbers, providing consistent behavior with other tabs.

### [2024-12-19] Kitten and Household Pet Tabs: Auto-Voiding Logic Fix
- **Tabs:** Kitten, Household Pet
- **Change:** Fixed critical bug where entering a cat number that was already voided elsewhere in the same column did not automatically void the new cell
- **Summary:** 
  - **KittenTab**: Fixed timing issue where `setKittenTabDataVoidState` was called inside the `setKittenTabData` callback, causing auto-voiding to not work properly. Moved the void state setting outside the callback for proper timing.
  - **HouseholdPetTab**: Removed duplicate and inconsistent voiding logic inside the `setHouseholdPetTabData` callback. Simplified to use the same pattern as other tabs.
  - Both tabs now correctly auto-void any new input of a cat number that is voided anywhere in the same column, matching the behavior in Championship and Premiership tabs.
- **Rationale:** The previous logic was broken and did not provide the expected auto-voiding behavior when entering cat numbers that were already voided elsewhere in the column. This fix ensures consistent voiding behavior across all tabs.
- **Impact:** Users can now expect that when they enter a cat number that is already voided elsewhere in the same column, the new cell will be automatically voided, providing consistent behavior across all tabs. 

### [2024-12-19] Household Pet Tab: Reset Button Modal and Error Clearing Fix
- **Tab:** Household Pet
- **Change:** Fixed reset button behavior to match Kitten tab exactly
- **Summary:** 
  - **Added missing onTabReset prop**: Added onTabReset prop to HouseholdPetTabProps interface and function parameters
  - **Fixed reset button**: Changed reset button to call `setIsResetModalOpen(true)` instead of `handleTabReset()` directly, ensuring modal appears
  - **Fixed modal behavior**: Updated modal onConfirm to call `onTabReset()` and show success message, matching Kitten tab behavior
  - **Added error clearing**: Reset now immediately clears all validation errors with `setErrors({})`
  - **Updated App.tsx**: Added onTabReset prop to HouseholdPetTab component in App.tsx
- **Rationale:** The previous implementation was missing the confirmation modal and proper error clearing, causing errors to persist until user interaction. This fix ensures consistent behavior with Kitten tab and proper user experience.
- **Impact:** Users now see a confirmation modal when clicking reset, errors are cleared immediately, and the reset behavior matches the Kitten tab exactly. 

### [2024-12-19] Household Pet Tab: Dynamic Validation Fix
- **Tab:** Household Pet
- **Change:** Fixed critical bug where validation errors only appeared after manual interaction (clicking into another field) instead of appearing immediately when data changes
- **Summary:** 
  - **Added missing useEffect hook**: Added `React.useEffect(() => { validate(); }, [columns, householdPetTabData.showAwards, householdPetTabData.voidedShowAwards, householdPetCount])` to automatically run validation whenever data changes
  - **Matches Championship tab behavior**: The Household Pet tab now has the same automatic validation trigger as the Championship tab, ensuring consistent user experience across all tabs
  - **Immediate error feedback**: Validation errors now appear immediately when users enter invalid data, without requiring manual interaction to trigger validation
- **Rationale:** The previous implementation was missing the crucial useEffect hook that automatically triggers validation when data changes. This caused a poor user experience where errors only appeared after clicking into another field, unlike the other tabs which show errors immediately.
- **Impact:** Users now see validation errors immediately when entering invalid data, providing consistent and responsive feedback across all tabs. 

### [2024-12-19] Premiership Tab: Auto-Focus on Tab Activation Fix
- **Tab:** Premiership
- **Change:** Fixed critical bug where the first input field was not automatically focused when switching to the Premiership tab
- **Summary:** 
  - **Fixed ref assignment conflicts**: Corrected row index calculations for refs to prevent Best AB/LH/SH PR sections from overwriting Show Awards refs
  - **Enhanced auto-focus logic**: Increased timeout from 0ms to 100ms and added `scrollIntoView` to ensure the first input field is properly focused and visible when switching to the tab
  - **Added isActive dependency**: Auto-focus now only triggers when the tab is actually active, preventing unnecessary focus attempts
  - **Matches Championship tab behavior**: Both Championship and Premiership tabs now have identical auto-focus behavior with the same timeout and scroll behavior
  - **Immediate cursor placement**: When users switch to the Premiership tab, the cursor is now automatically placed in the first Show Awards input field (top-left) and the field is scrolled into view
- **Rationale:** The previous implementation had two issues: 1) timing issues where the DOM wasn't fully rendered when the focus attempt was made, and 2) ref conflicts where multiple sections were using the same row indices, causing the wrong input to be focused.
- **Impact:** Users now have immediate cursor placement in the correct first input field when switching to the Premiership tab, providing consistent and efficient data entry experience across all tabs. 

### [2024-12-19] Championship Tab: Auto-Focus Enhancement for Tab Activation
- **Tab:** Championship
- **Change:** Enhanced auto-focus behavior to match Premiership tab and ensure reliable focus when switching tabs
- **Summary:** 
  - **Added isActive prop**: Championship tab now receives and uses the `isActive` prop to determine when to auto-focus
  - **Enhanced auto-focus logic**: Increased timeout from 0ms to 100ms and added `scrollIntoView` to ensure the first input field is properly focused and visible
  - **Consistent behavior**: Both Championship and Premiership tabs now have identical auto-focus behavior with the same timeout and scroll behavior
- **Rationale:** Ensures consistent user experience across all tabs and prevents timing issues where the DOM wasn't fully rendered when focus was attempted.
- **Impact:** Users now have reliable auto-focus behavior when switching to the Championship tab, matching the Premiership tab experience.

### [2024-12-19] All Tabs: Error Styling Consistency Fix
- **Tabs:** Championship, Kitten, Household Pet
- **Change:** Updated error styling to match Premiership tab by using `cfa-input-error` class instead of `border-red-500`
- **Summary:** 
  - **Championship Tab**: Updated `getBorderStyle` function to return `cfa-input-error` class for error styling
  - **Kitten Tab**: Updated `getBorderStyle` function to return `cfa-input-error` class for error styling  
  - **Household Pet Tab**: Updated `getBorderStyle` function to return `cfa-input-error` class for error styling
  - **Consistent visual feedback**: All tabs now use the same red background fill styling for error inputs, matching the Premiership tab behavior
- **Rationale:** The Premiership tab was using `cfa-input-error` class which provides a red background fill effect for error inputs, while other tabs were using `border-red-500` which only provides a red border. This fix ensures consistent visual feedback across all tabs when validation errors are present.
- **Impact:** Users now see consistent error styling across all tabs - inputs with errors will have a red background fill instead of just a red border, providing clearer visual feedback for validation errors. 

### [2024-06-21] Championship & Premiership Tabs: LH/SH Order Validation Clarified (Subsequence Rule)
- **Tabs:** Championship, Premiership
- **Change:** Clarified and enforced that the order of cats in LH/SH CH and LH/SH PR sections must be a subsequence of the Best AB CH/PR list, not a strict prefix or exact match.
- **Summary:**
  - **Order validation**: LH/SH CH and LH/SH PR must preserve the order from Best AB CH/PR, but cats may be skipped if assigned to the other specialty.
  - **Error message**: Now reads "Order violation: X is out of order in LH/SH CH/PR. Must preserve the order from Best AB CH/PR (subsequence required)."
  - **Documentation**: Updated both VALIDATION_CHAMPIONSHIP.md and VALIDATION_PREMIERSHIP.md to clarify the subsequence rule and provide examples.
  - **Rationale:** This matches CFA rules and user expectations, and prevents false order errors when cats are split between LH and SH sections.
  - **Impact:** Users will only see order errors if the sequence in LH/SH CH/PR is not a valid subsequence of AB CH/PR, making validation more accurate and user-friendly. 

### [2024-12-19] Championship & Premiership Tabs: Order Validation Fix for Fillers
- **Tabs:** Championship, Premiership
- **Change:** Fixed order validation logic to correctly handle fillers (cats not in AB CH/PR list)
- **Summary:**
  - **Order validation**: Now only validates order for cats that are actually in the Best AB CH/PR list
  - **Fillers**: Cats not in AB CH/PR are allowed anywhere after the AB CH/PR cats
  - **Logic**: Extract only AB CH/PR cats from LH/SH section and validate they form a subsequence of AB CH/PR
  - **Error message**: Unchanged - still shows "Order violation: X is out of order in LH/SH CH/PR. Must preserve the order from Best AB CH/PR (subsequence required)."
  - **Examples**: 
    - Valid LH CH: [2, 7, 3] where AB CH is [1, 2, 3] (7 is a filler, allowed anywhere)
    - Valid LH PR: [2, 8, 3] where AB PR is [1, 2, 3] (8 is a filler, allowed anywhere)
  - **Documentation**: Updated both Championship and Premiership validation docs with examples
- **Rationale:** Previous logic incorrectly flagged fillers as "out of order" when they appeared after AB CH/PR cats, even though fillers should be allowed anywhere after the AB CH/PR cats.

### [2024-06-22] Championship & Premiership Tabs: Stricter Top-Aligned Order Validation for LH/SH CH/PR (Fillers)
- **Tabs:** Championship, Premiership
- **Change:** Enforced that all AB CH/PR cats assigned to a specialty section (LH/SH CH/PR) must be at the top, in the same order as Best AB CH/PR. Fillers (non-AB CH/PR) can only appear after all AB CH/PR cats. If any filler appears before an AB CH/PR cat, an order error is shown on the first offending cell.
- **Docs:** Updated VALIDATION_CHAMPIONSHIP.md and VALIDATION_PREMIERSHIP.md with new rule and examples.
- **Rationale:** Matches CFA rules and user expectation for top-aligned order. Prevents fillers from appearing above AB CH/PR cats in any specialty section.

### 2024-06-21
- **Kitten Tab**: Validation now allows empty rows (no cat number) without error; only filled rows require status 'KIT'.
- **CSV Import**: Importing a blank Kitten section does not cause validation errors.
- **Rationale**: Prevents false errors when no kittens are entered or imported.

### 2024-06-21
- **Household Pet Tab**: Validation now allows empty rows (no cat number) without error; only filled rows require status 'HHP'.
- **CSV Import**: Importing a blank Household Pet section does not cause validation errors.
- **Rationale**: Prevents false errors when no household pets are entered or imported.

### [2024-06-22] Championship Tab: VOID Logic Refactor
- **Tab:** Championship
- **Change:** Voided ("VOID") cat numbers are now always ignored for all validation and error assignment in the Championship tab, matching KittenTab.
- **Summary:**
  - VOID cat numbers are never included in duplicate detection, sequential checks, status checks, or any other validation.
  - No errors will ever be shown for a voided ("VOID") cat number.
  - This ensures full UI/UX and validation parity with KittenTab and prevents any errors from being shown for voided placements.
- **Rationale:** This change ensures that voided placements are always ignored for all checks, matching the intended user experience and validation logic of KittenTab. It prevents confusion and unnecessary error messages for voided entries.
- **Impact:** Users will never see validation errors for voided placements in the Championship tab. All validation logic now matches KittenTab for voided entries.

### [2024-06-22] Kitten & Championship Tabs: VOID-as-Nonexistent Logic for Validation
- **Tabs:** Kitten, Championship
- **Change:** VOID placements are now treated as if they do not exist for validation in both Kitten and Championship tabs.
- **Summary:**
  - For sequential and duplicate checks, only non-empty, non-VOID placements are considered.
  - If a VOID appears before a filled placement, it does not block sequential entry (i.e., it is as if the VOID row does not exist at all).
  - VOID placements are never included in duplicate detection, sequential checks, or any other validation.
  - This is now documented and enforced for both tabs for strict parity.
- **Rationale:** This ensures that voided placements do not interfere with validation logic, matching user expectations and KittenTab's established behavior. It also brings strict parity between Kitten and Championship tabs.
- **Impact:** Users will never see sequential or duplicate errors caused by VOID placements in either tab. Documentation and code are now in full agreement for this logic.

## [2024-06-09] PremiershipTab: VOID is a valid skip for sequential placement in all awards/finals sections
- VOID is now treated as a valid skip for sequential placement validation in all awards/finals sections (Best AB PR, Best LH PR, Best SH PR) of the Premiership tab, matching the Top 10/15 logic.
- Rationale: This ensures consistent user experience and allows users to skip placements with VOID without triggering a 'fill previous' error.

### 2024-07-XX
- [Championship Tab] VOID placements are now always ignored for all validation and ordering, matching KittenTab. This affects Top 10/15, Best AB CH, LH CH, SH CH, and all order/required/duplicate logic. Rationale: Full parity, user clarity, and bug prevention.

### 2024-07-XX
- [Premiership Tab] VOID placements are now always ignored for all validation and ordering, matching ChampionshipTab. This affects Top 10/15, Best AB PR, LH PR, SH PR, and all order/required/duplicate logic. Rationale: Full parity, user clarity, and bug prevention.

### [2024-06-23] Kitten & Household Pet Tabs: Hide Status Label for VOID Cat #
- **Tab:** Kitten, Household Pet
- **Change:** Status label is now hidden (not rendered) for any cell where Cat # is VOID (case-insensitive, trimmed). Only 'VOID' is saved/restored in the CSV for that cell.
- **Summary:**
  - If a Cat # input is VOID, the status label is not shown in the UI for that cell.
  - On CSV export/import, only 'VOID' (uppercase, no spaces) is saved/restored for that cell, with no status.
  - This matches the logic already present in Premiership and Championship tabs.
- **Rationale:** Ensures perfect parity and user experience across all tabs, and prevents confusion about status for VOID placements.
- **Impact:** Users will see a clean, consistent UI and CSV export/import behavior for VOID placements in all tabs.

### [2024-05-10] ChampionshipTab Validation Order Clarification
- **Tab/Section:** ChampionshipTab (Top 10/15, AB/LH/SH CH)
- **Summary:** Documented that Top 10/15 currently checks sequential error before duplicate, while finals sections (AB/LH/SH CH) check duplicate before sequential. This is different from PremiershipTab, where duplicate always takes precedence. An update is planned to make Top 10/15 match the finals sections for true parity.
- **Rationale/Context:** To prevent future confusion and ensure code and documentation are always in sync, the explicit validation order for each section is now documented. This will guide future updates and maintenance.

[DATE] - ChampionshipTab - Sequential error precedence updated to match PremiershipTab. Sequential errors ("You must fill previous placements before entering this position") are now only set if there is no range, duplicate, or cross-section duplicate error present for that cell. This ensures duplicate errors always take precedence, providing consistent user experience and error reporting across tabs.

2024-06-20 - ChampionshipTab - AB/LH/SH CH finals validation logic now matches PremiershipTab finals logic exactly, including error precedence, sequential error logic, and assignment reminder. This ensures perfect parity and robust error handling across both tabs.

2024-06-20 - ChampionshipTab - Order errors for Best AB CH are now only set if the cell is filled and incorrect, not for empty cells, matching PremiershipTab logic. This prevents premature error display and ensures perfect parity.

### [2024-12-XX - Cross-Column Duplicate Prevention Fix](#)

**Issue**: The "Cross-Column Duplicate Prevention" validation rule was not being called in the Super Specialty cross-column validation for both Championship and Premiership tabs.

**Fix**: 
- Added missing call to `validateCrossColumnDuplicates` function in `validateSuperSpecialtyCrossColumn` for both `championshipValidation.ts` and `premiershipValidation.ts`
- Added the `validateCrossColumnDuplicates` function implementation to `premiershipValidation.ts` (it was already present in `championshipValidation.ts`)

**Files Modified**:
- `src/validation/championshipValidation.ts` - Added missing function call
- `src/validation/premiershipValidation.ts` - Added missing function call and implementation

**Testing**: The rule now properly detects when a cat number appears in both Longhair and Shorthair columns within the same Super Specialty ring and displays appropriate error messages.

### [2025-07-31 - Kitten Tab Super Specialty Cross-Column Validation Implementation](#)

**Issue**: The Kitten tab was missing the "Cross-Column Duplicate Prevention" validation rule in its Super Specialty cross-column validation, while Championship and Premiership tabs had complete SSP validation.

**Fix**: 
- Added missing call to `validateCrossColumnDuplicates` function in `validateSuperSpecialtyCrossColumn` for `kittenValidation.ts`
- Added the `validateCrossColumnDuplicates` function implementation to `kittenValidation.ts`
- Updated documentation to reflect that Kitten tab now has complete SSP validation

**Files Modified**:
- `src/validation/kittenValidation.ts` - Added missing function call and implementation
- `docs/validation/VALIDATION_SUPER_SPECIALTY.md` - Updated Kitten tab section to list applicable SSP rules
- `docs/validation/VALIDATION_KITTEN.md` - Added Super Specialty Cross-Column Validation section

**Applicable SSP Rules for Kitten Tab**:
- ✅ Title/Award Consistency (KIT status consistency)
- ✅ Ranked Cats Priority (filler cats vs ranked cats in Allbreed)
- ✅ Order Preservation Within Hair Length (order from specialty to Allbreed)
- ❌ Specialty Finals Consistency (NOT APPLICABLE - no finals sections)
- ✅ Cross-Column Duplicate Prevention (no cat in both LH and SH columns)

**Testing**: The Kitten tab now has complete Super Specialty cross-column validation parity with Championship and Premiership tabs.