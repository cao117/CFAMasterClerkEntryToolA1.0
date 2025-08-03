# Project Changelog

This changelog records major changes to the CFA Master Clerk Entry Tool, including validation rule changes, documentation restructuring, feature additions, and UI/UX improvements.

### [2025-08-03 21:30:50] Version 0.3.0 Release
- **Area:** Application version update and documentation
- **Change:** Updated application version to 0.3.0 and updated project documentation
- **Summary:**
  - **Version Update**: Changed version from 0.0.0 to 0.3.0 in package.json
  - **Documentation**: Updated changelog with current timestamp and version information
  - **Status**: Application now properly reflects version 0.3.0 across all documentation
- **Affected Files**: `package.json`, `docs/meta/CHANGELOG.md`
- **Result**: Application version now correctly displays as 0.3.0
- **Rationale:** Proper version management and documentation tracking for application releases
- **Impact:** Clear version identification and documentation consistency

### [2025-08-03 03:12:39] Recent Work Resume Modal Implementation
- **Area:** Application startup and user experience enhancement
- **Change:** Implemented comprehensive Recent Work Resume Modal that appears on startup when recent work exists within 24 hours
- **Summary:**
  - **Root Need**: Users needed seamless ability to resume work from previous sessions without manual file restoration
  - **Problem**: Users had to manually access auto-save files to resume work, creating friction in the workflow
  - **Solution**: Added automatic detection of recent work within 24 hours with startup modal offering resume option
  - **Technical Details**:
    - Created `useRecentWorkDetection` hook for 24-hour time-based work detection
    - Created `ResumeWorkModal` component following existing modal design patterns
    - Integrated with existing Recent Save localStorage structure and timestamp field
    - Used existing `parseExcelAndRestoreState` function for consistent data restoration
    - Implemented proper page load detection to ensure modal only appears after complete initialization
    - Added comprehensive error handling and user feedback through toast notifications
  - **User Experience Flow**:
    1. User works on form → Recent Save automatically stores progress every 15 seconds
    2. User closes browser/tab → Work preserved in Recent Save localStorage
    3. User returns later → Application detects recent work within 24 hours
    4. Modal appears: "Resume work from [timestamp]?" with formatted timestamp
    5. User clicks "Resume Work" → Data restored using existing Excel parsing logic
    6. Alternative: "Start Fresh" → Modal closes, user begins with empty form
  - **Critical Timing Requirement**: Modal only appears after page is COMPLETELY loaded and initialized
  - **Affected Files**: `src/hooks/useRecentWorkDetection.ts` (new), `src/components/ResumeWorkModal.tsx` (new), `src/App.tsx` (modified)
  - **Result**: Users can now seamlessly resume work from previous sessions with automatic detection and restoration
- **Rationale:** Improve user experience by eliminating manual file restoration steps and providing automatic work recovery
- **Impact:** Users experience seamless work continuity with automatic detection and one-click resume functionality

### [2025-08-03 02:05:56] Empty Form Detection for Save Prevention
- **Area:** Auto-save and recent-save system enhancement
- **Change:** Implemented DOM-based empty form detection to prevent unnecessary saves when no user input exists
- **Problem**: Auto-save (5 min default) and recent-save (15 seconds) were creating empty save files when users hadn't entered any data
- **Solution**: Added comprehensive empty form detection system using DOM event delegation
- **Implementation Details**:
  - Created `useFormEmptyDetection` hook with DOM event delegation
  - Added enhanced wrapper functions `triggerEnhancedAutoSave` and `triggerEnhancedRecentSave`
  - Integrated empty form detection into auto-save and recent-save services
  - Added comprehensive debug logging throughout the save process
  - Added user-friendly console logging when saves are skipped
  - Works with conditional tab rendering (only checks visible tabs)
  - Zero changes to existing save logic - just adds pre-checks
- **Debug Features**:
  - 🔍 DEBUG: Empty form detection logs show when detection is triggered and results
  - 🔍 DEBUG: Auto-save logs show when saves are triggered, skipped, or completed
  - 🔍 DEBUG: Recent-save logs show when saves are triggered, skipped, or completed
  - ✅ DEBUG: Success indicators when saves proceed with user input
  - ❌ DEBUG: Skip indicators when saves are prevented due to empty forms
- **Fixes Applied**:
  - **Default Values Problem**: Updated empty form detection to ignore auto-populated date inputs and default number values (0)
  - **Recent Save Integration**: Fixed recent save service to properly use enhanced empty form detection
  - **Auto-Save Integration**: Fixed auto-save service to properly use enhanced empty form detection
  - **Enhanced Detection Logic**: 
    - Skip date inputs (auto-populated)
    - Skip number inputs with default value 0
    - Only count positive numbers as user input
    - Proper handling of checkboxes, radios, and selects
- **Affected Files**: `src/hooks/useFormEmptyDetection.ts` (new), `src/hooks/useAutoSave.ts`, `src/hooks/useRecentSave.ts`, `src/utils/autoSaveService.ts`, `src/utils/recentSaveService.ts`, `src/App.tsx`
- **Result**: Auto-save and recent-save now skip execution when no user input is detected, preventing empty save files
- **Rationale**: Improve storage efficiency and prevent unnecessary file creation when users haven't started entering data
- **Impact**: Users experience cleaner auto-save behavior with no empty files created, plus comprehensive debugging for development

### [2025-08-03 00:20:16] Breed Sheets Autosave Restoration Bug Fix
- **Area:** Auto-save system and breed sheets data restoration
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

### [2025-08-02 23:50:41] Recent Save Implementation Removal
- **Area:** Auto-save system simplification
- **Change:** Completely removed Recent Save implementation and related functionality
- **Summary:**
  - **Removed Components**: RecoveryModal component, tier1EventService, recentSaveUtils
  - **Removed Functions**: triggerMostRecentSave() from AutoSaveService, all Tier 1 event handlers
  - **Removed State**: showRecoveryModal, recentSavePreview, isRecoveryLoading, recoveryInProgress
  - **Removed Handlers**: handleResumePrevious, handleStartFresh, handleRecoveryCancel
  - **Removed localStorage**: 'Recent Save' key usage and checking
  - **Cleaned Up**: Removed all Tier 1 event props from GeneralTab component
  - **Result**: App now works exactly as it did before Recent Save was added, with only the original rotating auto-save functionality
- **Rationale:** Simplified the auto-save system by removing the user-triggered Recent Save feature to focus on the core rotating auto-save functionality

### [2025-08-02 19:33:46] Most Recent Auto-Save System Implementation
- **Area:** Auto-save system enhancement with immediate user protection
- **Change:** Implemented comprehensive Most Recent Auto-Save functionality with recovery modal
- **Summary:**
  - **Root Need**: Users needed immediate protection of form work and seamless recovery from accidental page refreshes
  - **Problem**: Existing rotating auto-save only protected work at timed intervals (1-60 minutes), leaving gaps in protection
  - **Solution**: Added user-triggered "Recent Save" that captures work immediately on form interactions
  - **Technical Details**:
    - Leverages existing Excel blob system for consistent data format and restoration
    - Uses separate "Recent Save" localStorage key independent of rotating saves
    - Triggers on Tier 1 events: text field blur, dropdown changes, checkbox/radio button changes
    - Recovery modal shows meaningful preview: Show Date, Club Name, Master Clerk, Judge count
    - Safety net: "Start Fresh" preserves Recent Save for accidental clicks
    - Improved localStorage key naming: `cfa_autosave1` → `Auto Save 1` (cleaner, user-friendly)
  - **User Experience Flow**:
    1. User fills form fields → Recent Save triggers on blur/change
    2. User accidentally refreshes page → Recovery modal appears with preview
    3. User chooses "Resume Previous Work" → Exact state restored instantly
    4. Alternative: "Start Fresh" → Modal closes, work preserved as safety net
  - **Affected Files**: `AutoSaveService`, `RecoveryModal`, `recentSaveUtils`, `tier1EventService`, `App.tsx`, `useAutoSave`, `AutoSaveFileList`, documentation
  - **Result**: Users now have instant work protection and can recover seamlessly from interruptions
- **Rationale:** Bridge the protection gap between user actions and timed auto-saves while maintaining existing auto-save reliability
- **Impact:** Eliminates data loss from accidental page refreshes and provides confidence for users to work without fear of losing progress

### [2025-08-02 16:04:54] File Restore Icon Functionality Implementation
- **Area:** Header navigation and auto-save modal integration
- **Change:** Implemented functionality for File Restore icon to open auto-save files modal
- **Summary:**
  - **Root Cause**: File Restore icon had no functionality - clicking did nothing
  - **Problem**: Icon existed in header but was not connected to auto-save file list modal
  - **Solution**: Lifted AutoSaveFileList modal state to App.tsx level for cross-component access
  - **Technical Details**:
    - Added `showAutoSaveFiles` state and `handleShowAutoSaveFiles` handler in App.tsx
    - Moved AutoSaveFileList component from AutoSaveNotificationBar to App.tsx level
    - Updated AutoSaveNotificationBar to accept external `onShowAutoSaves` prop
    - Connected File Restore icon onClick to `handleShowAutoSaveFiles` function
    - Both File Restore icon and Test Auto-Saves button now control same modal instance
  - **Affected Files**: `src/App.tsx`, `src/components/AutoSaveNotificationBar.tsx`
  - **Result**: File Restore icon now opens auto-save files modal, allowing users to restore from auto-saved files
- **Rationale:** Header navigation should provide quick access to key functionality like auto-save file recovery
- **Impact:** Users can now access auto-save file recovery from the main header, improving accessibility and user experience

### [2025-08-02 15:40:03] BreedSheets CH/PR Column Import Bug Fix
- **Area:** Excel import functionality for BreedSheets tab
- **Change:** Fixed critical bug where CH (Championship) and PR (Premiership) column values were not being imported from Excel files
- **Summary:**
  - **Root Cause**: Case sensitivity mismatch in field assignment conditions during Excel import parsing
  - **Problem**: When importing Excel files, BoB and 2BoB values loaded correctly but CH and PR column values appeared empty
  - **Solution**: Fixed case mismatch between uppercase group names from Excel headers and title case conditions in code
  - **Technical Details**:
    - Excel headers "CHAMPIONSHIP LH" resulted in `currentGroup = "CHAMPIONSHIP"` (uppercase)
    - Code conditions checked `if (currentGroup === 'Championship')` (title case) - never matched
    - Fixed conditions to use uppercase: `if (currentGroup === 'CHAMPIONSHIP')`
    - Applied same fix for Premiership: `if (currentGroup === 'PREMIERSHIP')`
  - **Affected Files**: `src/utils/excelImport.ts`
  - **Result**: CH and PR column values now import correctly from Excel files into BreedSheets form fields
- **Rationale:** Import functionality must handle case sensitivity correctly to ensure all data fields are preserved
- **Impact:** BreedSheets Excel import now works completely - all columns (BoB, 2BoB, CH, PR) import correctly

### [2025-07-31 23:23:01] OCP Ring Order Preservation Bug Fix
- **Area:** Championship validation file
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

### [2025-07-31 23:00:25] OCP Ring Title Inconsistency Bug Fix
- **Area:** Championship and Premiership tab components, validation files
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

### [2025-07-31 17:52:19] Championship Tab: OCP Ring Placement Bug Fix
- **Area:** src/components/ChampionshipTab.tsx
- **Change:** Fixed bug where OCP rings in Championship tab were showing 15 placements instead of correct 1-10 range
- **Summary:**
  - **Root Cause**: Missing OCP case in `getChampionshipCountForRingType()` function in ChampionshipTab component
  - **Fix**: Added `case 'OCP': return 10;` to handle OCP rings correctly
  - **Consistency**: Now matches pattern used in KittenTab and PremiershipTab components
  - **Validation**: `getFinalsPositionsForRingType()` in validation file already correctly handled OCP rings
  - **Result**: OCP rings in Championship tab now show exactly 10 placements (1-10) instead of 15
- **Rationale:** OCP rings should always have exactly 10 placements regardless of championship counts, consistent with other tabs
- **Impact:** OCP rings in Championship tab now display correct 1-10 placement range

### [2025-07-31 19:04:38] Super Specialty Cross-Column Validation Implementation
- **Area:** Championship, Premiership, and Kitten validation files
- **Change:** Added comprehensive cross-column validation for Super Specialty rings
- **Summary:**
  - **Title/Award Consistency**: Ensures same cat has same title across all Super Specialty columns
  - **Implicit Title Detection**: Cats in specialty sections automatically assigned implicit titles
  - **Ranked Cats Priority**: Prevents filler cats from being placed before ranked cats
  - **Order Preservation**: Maintains relative order of cats from specialty columns in Allbreed column
  - **Additive Validation**: Super Specialty validation runs after all existing validation
  - **Cross-Column Errors**: Errors displayed under all offending input boxes
  - **Scope**: Only applies to Super Specialty rings (3 columns with same judge ID)
- **Technical Details:**
  - Added `validateSuperSpecialtyCrossColumn()` functions to all validation files
  - Integrated into main validation functions as final validation step
  - Preserves all existing validation order and logic
- **Impact:** Provides comprehensive cross-column validation while maintaining existing validation integrity

### [2025-07-31 19:15:42] Enhanced Title Consistency Validation
- **Area:** Championship and Premiership validation files
- **Change:** Enhanced title consistency validation with implicit title detection
- **Summary:**
  - **Implicit Title Assignment**: Cats in specialty sections (CH/PR) automatically assigned implicit titles
  - **Enhanced Error Messages**: More specific error messages indicating section-based implicit titles
  - **Section-Specific Validation**: Different error messages for Championship (CH) vs Premiership (PR) sections
  - **Documentation**: Updated Super Specialty validation documentation with implicit title examples
- **Technical Details:**
  - Enhanced `collectTitlesFromColumn()` functions to include section-specific implicit titles
  - Updated error marking functions with section-specific error messages
  - Added section name tracking for better error reporting
- **Impact:** More accurate and informative title consistency validation for Super Specialty rings

### [2025-07-31 22:25:53] OCP Ring Cross-Column Validation Implementation
- **Area:** Championship and Premiership validation files, documentation
- **Change:** Added comprehensive cross-column validation for OCP Ring judges
- **Summary:**
  - **Validation Order**: Runs AFTER all existing validation is complete
  - **Title/Award Consistency**: Cannot have same cat # labeled GC/GP in AB column and CH/PR in OCP column
  - **Ranked Cats Priority**: Filler cats (not ranked in AB ring) cannot appear in OCP before ranked cats
  - **Order Preservation**: Order of AB CH/LH CH/SH CH and AB PR/LH PR/SH PR in AB column should be respected in OCP ranking
  - **Error Messages**: Uses similar error messages to SSP validation for consistency
  - **Implementation**: Follows same patterns as Super Specialty validation but adapted for OCP Ring structure
- **Technical Details:**
  - Added `validateOCPRingCrossColumn()` functions to Championship and Premiership validation files
  - Integrated into main validation functions as final validation step
  - Preserves all existing validation order and logic
  - Only applies to OCP Ring judges (2 columns: Allbreed + OCP with same judge ID)
  - Created comprehensive validation documentation in `docs/validation/VALIDATION_OCP_RING.md`
- **Rationale:** OCP Ring judges require specific cross-column validation rules to ensure data integrity
- **Impact:** Provides comprehensive cross-column validation for OCP Ring judges while maintaining existing validation integrity

### [2025-07-31 22:02:30] OCP Ring Status Lock Implementation
- **Area:** Championship and Premiership tab components
- **Change:** OCP ring status dropdowns are now locked to appropriate values (CH for Championship, PR for Premiership)
- **Summary:**
  - **Championship Tab**: OCP ring status dropdowns are locked to "CH" status (same pattern as Kitten tab KIT status)
  - **Premiership Tab**: OCP ring status dropdowns are locked to "PR" status (same pattern as Kitten tab KIT status)
  - **UI Implementation**: OCP rings show static span with locked status instead of dropdown (matches Kitten tab pattern)
  - **Data Handling**: OCP rings automatically set correct status when cat numbers are entered
  - **Code changes**:
    - Updated `ChampionshipTab.tsx` to lock OCP ring status to "CH"
    - Updated `PremiershipTab.tsx` to lock OCP ring status to "PR"
    - Modified `updateShowAward` functions to auto-set correct status for OCP rings
    - Updated `getShowAward` functions to ensure OCP rings always return correct status
- **Rationale:** OCP rings should have fixed status values that cannot be changed, following the same pattern as Kitten tab
- **Impact:** OCP rings now have consistent, locked status behavior across Championship and Premiership tabs

### [2025-07-31 16:54:17] OCP Ring Type Implementation
- **Area:** All tab components, validation files, documentation
- **Change:** Added new "OCP Ring" ring type that creates two columns (Allbreed, OCP) across Championship, Premiership, and Kittens tabs
- **Summary:**
  - **New ring type**: Added "OCP Ring" to ring type options in General tab
  - **Column generation**: OCP Ring judges create two columns across Championship, Premiership, and Kittens tabs:
    - Allbreed column (same validation as existing Allbreed rings)
    - OCP column (always exactly 10 placements, no threshold checking)
  - **Breed Sheets behavior**: OCP Ring behaves exactly like Allbreed on Breed Sheets tab, with "OCP" label instead of "AB"
  - **Validation rules**: OCP column uses same validation logic as Championship Top Ten - always exactly 10 placements
  - **CSV schema**: Updated CSV export schema to include "OCP Ring" in ring type enum
  - **Excel export**: Updated excel export to handle OCP Ring column generation
  - **Documentation updates**: Updated PROJECT_OVERVIEW.md with OCP Ring mapping and examples
  - **Code changes**:
    - Updated `GeneralTab.tsx` to include "OCP Ring" in ring type options
    - Updated `ChampionshipTab.tsx`, `PremiershipTab.tsx`, `KittenTab.tsx` to handle OCP Ring column generation
    - Updated `BreedSheetsTab.tsx` to show "OCP" label and handle OCP Ring like Allbreed
    - Updated `excelExport.ts` to handle OCP Ring in breed sheets and tabular sections
    - Updated validation files to handle OCP Ring with always 10 placements
    - Updated CSV schema to include "OCP Ring" enum value
- **Rationale:** OCP Ring judges need to award Allbreed and OCP finals separately, requiring two distinct columns with independent validation
- **Impact:** Provides support for OCP Ring type with proper column generation, validation, and labeling across all tabs

### [2025-07-31 16:40:10] BreedSheets Tab: Super Specialty Bug Fix
- **Area:** src/components/BreedSheetsTab.tsx
- **Change:** Fixed bug where Super Specialty (SSP) judges were not showing input fields on the right-hand side in BreedSheets tab
- **Summary:**
  - **Root Cause**: Missing "Super Specialty" case in `getBreedsForJudge()` and `getAvailableHairLengths()` functions
  - **Fix**: Added "Super Specialty" to switch statements to return both long and short hair breeds (same as Allbreed behavior)
  - **Result**: Super Specialty judges now properly display input fields and both Longhair/Shorthair sections
- **Rationale:** Super Specialty should behave identically to Allbreed in BreedSheets tab except for label display (SSP vs AB)
- **Impact:** Super Specialty judges now work correctly in BreedSheets tab with proper input field display

### [2025-07-31 08:21:20] Super Specialty Ring Type Implementation
- **Area:** All tab components, validation files, documentation
- **Change:** Added new "Super Specialty" ring type that creates three columns (Longhair, Shorthair, Allbreed) across Championship, Premiership, and Kitten tabs
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

### [2024-12-19] Settings Panel: Maximum Number of Rings Field Added
- **Area:** src/components/SettingsPanel.tsx, src/App.tsx
- **Change:** Added new "Maximum Number of Rings" setting to the General Settings section in the Settings Panel. This field is positioned between "Maximum Number of Judges" and "Maximum Number of Cats" for logical grouping.
- **Summary:**
  - **New Field**: Added `max_rings` property to SettingsData interface with default value of 8
  - **UI Design**: Purple/indigo color theme with ring icon, matching the modern glassmorphism design pattern
  - **Validation**: 3-digit number input (1-999 range) with auto-text selection on focus
  - **Positioning**: Placed between max_judges and max_cats for logical workflow grouping
  - **Consistency**: Uses same SettingsInput component and styling as other general settings
- **Rationale:** Provides users with a centralized setting to configure the maximum number of rings for their show, improving the configuration workflow and maintaining consistency with other general settings.
- **Impact:** Users can now configure ring limits alongside judge and cat limits in a single, organized interface.

### [2024-12-19] Settings Panel: Maximum Number of Rings Field Removed
- **Area:** src/components/SettingsPanel.tsx, src/App.tsx
- **Change:** Removed "Maximum Number of Rings" field as it was not needed for the application functionality
- **Rationale:** The field was not required for the current application workflow

### [2024-12-19] Settings Panel: Maximum Number of Judges Integration
- **Area:** src/components/GeneralTab.tsx, src/App.tsx, src/validation/generalValidation.ts, docs/USAGE.md, docs/validation/VALIDATION_GENERAL.md
- **Change:** Integrated the "Maximum Number of Judges" setting with the General Information tab
- **Summary:**
  - **Dynamic Validation**: Number of judges field now respects the maximum set in Settings Panel
  - **Real-time Updates**: When setting changes, General tab immediately reflects new maximum
  - **Error Handling**: Shows error when trying to set maximum lower than current judge count
  - **Documentation**: Updated USAGE.md and validation docs to reflect configurable limits
  - **Validation Messages**: All error messages now show dynamic maximum instead of hardcoded 12
- **Rationale:** Provides flexible configuration for judge limits while maintaining data integrity and user guidance
- **Impact:** Users can now configure judge limits according to their show requirements, with proper validation and error handling

### [2024-12-19] Settings Panel: Maximum Number of Cats Integration
- **Area:** src/components/GeneralTab.tsx, docs/USAGE.md
- **Change:** Integrated the "Maximum Number of Cats" setting with all show count input fields in the General Information tab
- **Summary:**
  - **Automatic Capping**: All show count input fields are automatically capped at the max_cats setting
  - **Silent Enforcement**: No error messages shown - values are silently capped to the maximum
  - **Comprehensive Coverage**: Championship, Kitten, Premiership, and Household Pet count fields all respect the limit
  - **Test Data Integration**: Test data generation now respects the max_cats setting instead of hardcoded 450
  - **Documentation**: Updated USAGE.md to reflect the integration and behavior
- **Rationale:** Provides centralized control over maximum cat counts while maintaining a smooth user experience without disruptive error messages
- **Impact:** Users can now configure cat limits according to their show requirements, with automatic enforcement across all input fields

### [2024-12-19] Ring Number Dynamic Cap Implementation
- **Area:** src/components/GeneralTab.tsx, src/App.tsx, src/components/SettingsPanel.tsx, docs/USAGE.md
- **Change:** Implemented dynamic ring number capping and updated settings hard limits
- **Summary:**
  - **Dynamic Ring Number Cap**: Ring numbers now capped at 2 × current number of judges (instead of static max_judges setting)
  - **Automatic Clearing**: Invalid ring numbers are automatically cleared when judge count decreases
  - **Settings Hard Limits**: Increased max_judges hard cap from 12 to 24, max_cats hard cap from 450 to 1000 (defaults remain 12 and 450)
  - **Hard Cap Enforcement**: Values are now automatically capped at hard limits during input, blur, and restore operations
  - **Minimum Judge Count**: Enforced minimum of 1 judge (prevents 0 judges)
  - **Real-time Updates**: Ring number maximum changes dynamically as judge count changes
  - **Documentation**: Updated USAGE.md with new Ring Number Dynamic Cap section
- **Rationale:** Provides more flexible ring number assignment while maintaining data integrity and preventing invalid states
- **Impact:** Users can now assign ring numbers up to 2x their judge count, with automatic cleanup when reducing judge count

### [2024-12-19] Jump-to-Menu Dropdown: Ring Number Display Fix
- **Area:** src/utils/jumpToMenuUtils.ts, all tab components (Championship, Premiership, Kitten, Household Pet)
- **Change:** Fixed jump-to-menu dropdown to display actual ring numbers instead of auto-generated sequential IDs. All utility functions now use `col.judge.ringNumber` instead of `col.judge.id` for ring number display.
- **Summary:**
  - **Before**: Dropdown showed auto-index values (Ring 01, Ring 02, Ring 03...) regardless of actual ring numbers entered
  - **After**: Dropdown now shows actual ring numbers entered in General Information tab (Ring 05, Ring 12, Ring 03...)
  - **Functions Updated**: All 6 utility functions in jumpToMenuUtils.ts updated to use `col.judge.ringNumber`
  - **Tabs Affected**: Championship, Premiership, Kitten, and Household Pet tabs all now display correct ring numbers
  - **Consistency**: Dropdown display now matches table headers and selection logic
- **Rationale:** Previously, the dropdown showed sequential auto-index values (1, 2, 3, 4...) while the table headers and selection logic used actual ring numbers (5, 12, 3, 8...). This created confusion and made the dropdown unusable. Now the dropdown displays the actual ring numbers that users entered in the General Information tab.
- **Impact:** Users can now effectively use the jump-to-menu dropdown to navigate to specific rings, as the displayed ring numbers match the actual ring assignments.

### [2024-12-19] General Tab: Show Count Section UI Redesign - Two-Color Alternating System
- **Area:** src/components/GeneralTab.tsx
- **Change:** Redesigned Show Count section with clean two-color alternating system and improved visual hierarchy
- **Summary:** 
  - **Two-color system**: Implemented alternating emerald/green and purple/pink color themes across all four sections
  - **Championship Count**: Emerald/Green theme (first color) - avoids conflict with Show Information section above
  - **Kitten Count**: Purple/Pink theme (second color) - vibrant, engaging design
  - **Premiership Count**: Emerald/Green theme (first color, alternating back) - professional, growth-oriented
  - **Household Pet Count**: Purple/Pink theme (second color, alternating back) - consistent with second color
  - **Label consistency**: All sections now use "Total Count:" label for uniform appearance
  - **Alignment fixes**: Standardized label width to `w-32` across all sections for perfect horizontal alignment
  - **Color coordination**: All inputs, labels, borders, and accents follow consistent color schemes within each section
  - **Professional appearance**: Emerald/green theme is more subdued and professional, purple/pink adds personality without being overwhelming
- **Rationale:** Reduces visual noise from previous four-color system while maintaining clear section distinction and avoiding color conflicts with adjacent UI elements
- **Impact:** Creates a clean, organized, and professional appearance that's easier on the eyes while maintaining clear visual hierarchy and section identification

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
- 2024-12-19 

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

## [Unreleased] - 2025-08-02

### Fixed
- **Area:** Auto-Save Integration with Settings Panel
- **Change:** Connected auto-save functionality to use user-configured values from Settings Panel
- **Problem**: Auto-save process used hardcoded values (3 files, 5 minutes) instead of user settings
- **Solution**: Integrated globalSettings with auto-save configuration throughout the application
- **Technical Details**:
  - Added `numberOfSaves` and `saveCycle` properties to App.tsx DEFAULT_SETTINGS
  - Updated autoSaveOptions to use `globalSettings.numberOfSaves` and `globalSettings.saveCycle`
  - Enhanced settings merge logic to handle auto-save properties with fallback defaults
  - Removed type casting in SettingsPanel now that App.tsx has proper types
  - Added comprehensive comments documenting the integration
- **Affected Files**: `src/App.tsx`, `src/components/SettingsPanel.tsx`
- **Result**: Auto-save now respects user-configured values from Settings Panel in real-time
- **Impact**: Complete auto-save settings integration - users can control file count and frequency

### Fixed
- **Area:** Settings Panel Auto-Save section  
- **Change:** Fixed non-editable input fields for "Number of Saves" and "Save Cycle" settings
- **Problem**: Auto-save settings input fields had empty onChange handlers, making them non-interactive
- **Solution**: Added proper state management and onChange handlers for auto-save settings
- **Technical Details**:
  - Added `numberOfSaves` and `saveCycle` properties to SettingsData interface
  - Implemented `updateAutoSaveSetting` function with proper validation
  - Added onBlur handlers with input validation and capping
  - Updated SettingsPanelProps interface to include auto-save properties
  - Added default values (3 files, 5 minutes) to DEFAULT_SETTINGS
- **Affected Files**: `src/components/SettingsPanel.tsx`
- **Result**: Users can now edit auto-save settings using keyboard input and browser spinner controls
- **Impact**: Improved user experience for auto-save configuration with proper input validation

## [Unreleased]

### Enhanced
- **Area:** Auto-Save Notification Bar Animation  
- **Change:** Implemented cool fade-in/fade-out animation system for auto-save notifications
- **Problem**: Auto-save notification appeared and stayed visible without smooth transitions
- **Solution**: Added sophisticated animation system with fade-in, display, and fade-out phases
- **Technical Details**:
  - Added custom CSS animations: autosave-fade-in, autosave-fade-out, autosave-icon-pulse, autosave-text-slide
  - Implemented state management with isAnimating and shouldShow for smooth transitions
  - Added timing logic: 300ms fade-in, 2000ms display, 300ms fade-out
  - Enhanced icon with pulse effect and enhanced shadow during display
  - Added staggered text slide animations with delays for polished feel
  - Updated App.tsx to auto-hide notification after 2.6 seconds
  - Fixed fade-out animation conflict by removing internal timer and relying on App.tsx timing
- **Affected Files**: `src/components/AutoSaveNotificationBar.tsx`, `src/App.tsx`, `src/index.css`
- **Result**: Cool, smooth animations that provide clear feedback without being jarring
- **Impact**: Enhanced user experience with premium feel and clear auto-save feedback

### Fixed
- **Area:** Auto-Save Notification Bar Fade-Out Animation
- **Change:** Fixed fade-out animation not completing properly
- **Problem**: Component unmounted before fade-out animation could complete due to conflicting timers
- **Solution**: Removed internal 2-second timer and let App.tsx handle timing, ensuring fade-out completes
- **Technical Details**:
  - Removed conflicting internal setTimeout in component useEffect
  - Updated component to respond to isVisible prop changes for fade-out trigger
  - Maintained 300ms fade-out duration with proper state cleanup
  - Preserved all existing animation effects and timing
- **Affected Files**: `src/components/AutoSaveNotificationBar.tsx`
- **Result**: Fade-out animation now completes smoothly before component unmounts
- **Impact**: Smooth, complete fade-out animation that matches design expectations

### Enhanced
- **Area:** Auto-Save Notification Bar Animation Timing
- **Change:** Slowed down fade-in/fade-out animations and adjusted display timing
- **Problem**: Animations were too fast and display time wasn't exactly 2 seconds
- **Solution**: Doubled animation duration and adjusted total timing for precise 2-second display
- **Technical Details**:
  - Increased fade-in duration from 0.3s to 0.6s (2x slower)
  - Increased fade-out duration from 0.3s to 0.6s (2x slower)
  - Updated total timing from 2.6s to 3.2s (0.6s + 2s + 0.6s)
  - Updated component reset timer to match new fade-out duration
  - Preserved all existing animation effects and easing curves
- **Affected Files**: `src/index.css`, `src/components/AutoSaveNotificationBar.tsx`, `src/App.tsx`
- **Result**: More elegant, slower animations with exactly 2 seconds of display time
- **Impact**: Enhanced user experience with more graceful, visually appealing transitions

### Enhanced
- **Area:** Auto-Save Notification Bar Animation Timing
- **Change:** Made fade-in/fade-out animations 2x slower for ultra-premium feel
- **Problem**: Animations were still too fast for maximum elegance
- **Solution**: Doubled animation duration again for ultra-slow, premium transitions
- **Technical Details**:
  - Increased fade-in duration from 0.6s to 1.2s (2x slower)
  - Increased fade-out duration from 0.6s to 1.2s (2x slower)
  - Updated total timing from 3.2s to 4.4s (1.2s + 2s + 1.2s)
  - Updated component reset timer to match new 1.2s fade-out duration
  - Preserved all existing animation effects and easing curves
- **Affected Files**: `src/index.css`, `src/components/AutoSaveNotificationBar.tsx`, `src/App.tsx`
- **Result**: Ultra-slow, premium animations with exactly 2 seconds of display time
- **Impact**: Enhanced user experience with ultra-graceful, premium transitions

### Enhanced
- **Area:** Auto-Save Notification Bar Layout Alignment
- **Change:** Changed content alignment from left to right for better visual balance
- **Problem**: Left-aligned content didn't provide optimal visual hierarchy
- **Solution**: Updated flex container to use justify-end for right alignment
- **Technical Details**:
  - Changed flex container from `justify-between` to `justify-end`
  - Updated component comments to reflect right alignment
  - Preserved all existing animations, colors, and styling
  - Maintained responsive behavior across all devices
- **Affected Files**: `src/components/AutoSaveNotificationBar.tsx`
- **Result**: Right-aligned notification content with improved visual balance
- **Impact**: Better visual hierarchy and more natural status notification positioning

### Enhanced
- **Area:** Auto-Save System Simplification and Unification
- **Change:** Unified auto-save implementation to use localStorage for both browser and Tauri modes
- **Problem**: Dual implementation was overly complex with separate Tauri filesystem and browser localStorage methods
- **Solution**: Simplified to single localStorage implementation for both platforms, removing unnecessary complexity
- **Technical Details**:
  - Removed Tauri filesystem auto-save methods (saveToTauriFile, cleanupExcessTauriFiles)
  - Unified performRotatingAutoSave to use only localStorage for both browser and Tauri
  - Simplified cleanup logic to only handle localStorage entries
  - Removed platform detection from auto-save operations
  - Updated notification system to reflect unified localStorage platform
  - Removed unused Tauri API type declarations
- **Affected Files**: `src/utils/autoSaveService.ts`, `src/components/SettingsPanel.tsx`
- **Result**: Single, simplified auto-save implementation using localStorage for all platforms
- **Impact**: Reduced code complexity, easier maintenance, and consistent behavior across all environments

### Enhanced
- **Area:** Auto-Save File Management and Consistency
- **Change:** Implemented automatic cleanup and consistent display of auto-save files
- **Problem**: Modal showed all auto-save files regardless of settings, and excess files weren't cleaned up when settings were reduced
- **Solution**: Added automatic cleanup when numberOfSaves is reduced and limited modal display to match settings
- **Technical Details**:
  - Limited AutoSaveFileList modal to display only numberOfSaves files (from settings)
  - Added cleanup logic for excess localStorage auto-save entries when numberOfSaves is reduced
  - Integrated cleanup into updateAutoSaveSetting function with async handling
  - Added unified cleanup methods for localStorage management
- **Affected Files**: `src/components/AutoSaveFileList.tsx`, `src/components/SettingsPanel.tsx`, `src/utils/autoSaveService.ts`, `src/App.tsx`
- **Result**: Consistent auto-save file management across settings and UI
- **Impact**: Cleaner storage management and consistent user experience between settings and modal display

### Removed
- **Area:** Auto-Save Status Indicator in General Tab
- **Change:** Removed auto-save status indicator that displayed configuration details
- **Problem**: Technical auto-save information "Auto-save: Active (every 5 min, 3 files)" was visible to users
- **Solution**: Completely removed the auto-save status indicator from GeneralTab component
- **Technical Details**:
  - Removed auto-save status indicator JSX from `src/components/GeneralTab.tsx`
  - Eliminated technical configuration display from user interface
  - Cleaned up status indicator styling and layout
  - Maintained proper spacing between components
- **Affected Files**: `src/components/GeneralTab.tsx`
- **Result**: Cleaner General tab interface without technical auto-save details
- **Impact**: Improved user experience by removing technical configuration information

### Removed
- **Area:** Auto-Save Debug Information Component
- **Change:** Removed debug component that displayed localStorage auto-save count
- **Problem**: Debug information "Auto-saves in localStorage:3" was visible to users
- **Solution**: Completely removed AutoSaveDebugInfo component and its usage
- **Technical Details**:
  - Deleted `src/components/AutoSaveDebugInfo.tsx` file
  - Removed import statement from `src/App.tsx`
  - Removed component usage from App.tsx layout
  - Cleaned up debug-related UI elements
- **Affected Files**: `src/components/AutoSaveDebugInfo.tsx` (deleted), `src/App.tsx`
- **Result**: Cleaner UI without debug information visible to users
- **Impact**: Improved user experience by removing technical debug information

### Removed
- **Area:** Auto-Save Notification Bar UI  
- **Change:** Removed all action buttons from AutoSaveNotificationBar component
- **Problem**: Auto-save notification bar had unnecessary action buttons (Recovery, Test Auto-Saves, Manual Auto-Save, Dismiss) that were not needed
- **Solution**: Simplified AutoSaveNotificationBar to show only status information without action buttons
- **Technical Details**:
  - Removed all button JSX elements from AutoSaveNotificationBar component
  - Removed button-related props from AutoSaveNotificationBarProps interface
  - Removed button handler functions from App.tsx (handleViewRecovery, handleDismissAutoSave)
  - Updated component description to reflect simplified functionality
  - Preserved notification bar visibility and status display functionality
- **Affected Files**: `src/components/AutoSaveNotificationBar.tsx`, `src/App.tsx`
- **Result**: Cleaner, simpler auto-save notification that shows only status without unnecessary buttons
- **Impact**: Improved user experience with less visual clutter while maintaining auto-save status visibility

### Fixed
- **Area:** Auto-Save System Timing  
- **Change:** Removed unwanted auto-save execution on page load
- **Problem**: Auto-save was performing an immediate save when the page loaded, before the save cycle interval
- **Solution**: Modified startAutoSave method to only start the timer without immediate execution
- **Technical Details**:
  - Removed immediate performRotatingAutoSave call from startAutoSave method
  - Timer now starts when form data is available but waits for full save cycle interval
  - Updated comments to reflect new behavior: timer starts but no immediate save
  - Auto-save now executes only after the user-configured Save Cycle interval is reached
- **Affected Files**: `src/utils/autoSaveService.ts`
- **Result**: Auto-save timer starts on page load but waits for the configured interval before first execution
- **Impact**: Users no longer experience unwanted auto-save on page load; timer behaves as expected

### Added
- **Ring Number Field**: Added new "Ring Number" input field for each judge in General Information tab
- **Judge Reordering**: Automatic reordering of judges by Ring Number when field loses focus
- **Acronym Auto-Uppercase**: Automatic conversion of judge acronym input to uppercase
- **Excel Export/Import**: Ring Number field now correctly saved to and loaded from Excel files
- **Jump to Menu Enhancement**: Updated dropdown to show "Ring Number - Judge Acronym - Room Type" format
- **Judge Table Redesign**: Modern, professional styling for judge information table
- **Error Display Redesign**: Replaced text errors with visual indicators (red border, pink background)
- **Show Count Section Redesign**: Two-color alternating system for consistent design
- **Excel Import Wrapper**: Added `handleRestoreFromExcel` function for file dialog and import

### Changed
- **UI Labels**: Changed "Ring #" to "Judge #" in all table headers and navigation
- **Excel Export**: Ring Number now saved in correct column order (after Judge Name, before Acronym)
- **Excel Import**: Ring Number now loaded from correct column position
- **CSV Import**: Updated to match new Excel column order for backward compatibility
- **Action Buttons**: Updated prop names from CSV to Excel (onSaveToExcel, onLoadFromExcel)
- **Documentation**: Updated all references from CSV to Excel export/import
- **Import Function**: App.tsx now uses `handleRestoreFromExcel` instead of `handleRestoreFromCSV`

### Removed
- **Unused Files**: Removed `src/utils/csvExport.ts` and `src/utils/formActions.ts` (consolidated into Excel functionality)
- **Duplicate Validation**: Removed ring number uniqueness validation (not required)
- **CSV Wrapper**: Removed `handleSaveToCSV` wrapper function (direct Excel export now)
- **Form Actions**: Removed `handleReset` and `handleRestoreFromCSV` functions (replaced with direct calls and Excel import)

### Fixed
- **Import Errors**: Fixed all component imports to use `handleSaveToExcel` from `excelExport.ts`
- **Action Buttons Props**: Updated all components to use correct Excel prop names
- **Column Order**: Fixed Ring Number column position in Excel export/import
- **Backward Compatibility**: Maintained support for loading older CSV files
- **Build Errors**: Resolved all import errors and build now completes successfully
- **Function References**: Replaced all references to removed `formActions.ts` functions 

### [2024-12-19 15:30:00] FIXED: Show count inputs now behave consistently for backspace deletion
  - Issue: All show count inputs (except HHP total count) were converting to 0 immediately when deleting text
  - Resolution: Inputs now preserve empty state during deletion and convert to 0 only when leaving focus
  - Impact: Improved user experience for data entry across all show count inputs 

### [2025-08-01 15:26:58] Environment-Aware Excel Export (2025-08-01 15:26:58)
- **Area:** src/utils/excelExport.ts
- **Change:** Implemented cross-platform Excel file saving that automatically detects runtime environment:
  - **Modern Browsers**: Uses File System Access API (`showSaveFilePicker`) for user-controlled file saving
  - **Legacy Browsers**: Falls back to automatic download method
  - **Tauri Desktop Apps**: Environment detection implemented, native file picker planned for future implementation
  - **Detection Logic**: Automatically detects `window.__TAURI__` for Tauri apps and `showSaveFilePicker` for modern browsers
  - **Error Handling**: Comprehensive error handling with graceful fallbacks between methods
  - **Single Codebase**: Same implementation works across all environments without separate builds
  - **Dependencies**: Added `@tauri-apps/api@2.7.0` for future Tauri desktop support
  - **Type Safety**: Added TypeScript declarations for Tauri APIs in `src/types/tauri.d.ts`
  - **Status**: Browser functionality fully working, Tauri implementation planned 

### [2025-08-01 15:43:21] Environment-Aware Excel Import (2025-08-01 15:43:21)
- **Area:** src/utils/excelImport.ts
- **Change:** Implemented cross-platform Excel import that automatically detects runtime environment:
  - **Web Browsers**: Uses browser file picker for file selection
  - **Tauri Desktop Apps**: Environment detection implemented, native file picker planned for future implementation
  - **Detection Logic**: Automatically detects `window.__TAURI__` for Tauri apps
  - **Error Handling**: Comprehensive error handling with graceful fallbacks between methods
  - **Single Codebase**: Same implementation works across all environments without separate builds
  - **Status**: Browser functionality fully working, Tauri implementation planned 

## [Version 0.2.2] - 2025-08-03 00:48:14

### Added
- **Recent Save System**: New automatic save mechanism that runs every 15 seconds
- **Independent Timer**: Recent Save operates completely separately from main auto-save
- **File Restore Integration**: Recent Save files appear in File Restore modal
- **Silent Operation**: Recent Save runs in background without user notifications

### Technical Details
- Created `RecentSaveService` class for independent 15-second timer
- Added `useRecentSave` hook for React integration
- Updated `AutoSaveFileList` component to include Recent Save files
- Recent Save uses same Excel generation as main auto-save system

## [Version 0.2.1] - 2025-08-01 19:45:07

### Added
- **Application Startup Save Location Setup**: Implemented mandatory save location configuration on application startup
  - **Startup Validation**: App checks save location validity on every load (path exists, is directory, has write permissions)
  - **Blocking Modal**: Mandatory setup modal appears if no location is configured or location is invalid
  - **Cross-Platform Support**: Works in both Tauri desktop apps and web browsers
  - **Folder Picker**: Native OS folder picker for Tauri, File System Access API for browsers
  - **Settings Integration**: Save location configuration integrated into Settings panel
  - **Navigation Control**: App blocks access until save location is properly configured
  - **Validation Logic**: Comprehensive validation including path existence, directory type, and write permissions
  - **Error Handling**: Graceful fallbacks and user-friendly error messages for all scenarios

### Technical Implementation
- **New Utilities**: 
  - `src/utils/saveLocationValidation.ts` - Cross-platform save location validation
  - `src/utils/folderPicker.ts` - Cross-platform folder picker functionality
- **New Components**:
  - `src/components/StartupModal.tsx` - Blocking startup modal component
- **Enhanced Components**:
  - `src/components/SettingsPanel.tsx` - Added save location configuration with folder picker
  - `src/App.tsx` - Added startup validation logic and app readiness state
- **Tauri Configuration**: Updated capabilities to include dialog and file system permissions 

### User Experience
- **First-Time Setup**: New users see mandatory setup modal on first app load
- **Location Validation**: App validates save location on every startup to ensure it's still accessible
- **Settings Integration**: Users can configure save location through Settings panel with folder picker
- **Success Feedback**: Clear success messages when save location is configured
- **Error Recovery**: Helpful error messages guide users to fix invalid save locations 

### Platform Support
- **Tauri Desktop**: Native OS folder picker with full file system access
- **Web Browsers**: File System Access API with graceful fallbacks for unsupported browsers
- **Cross-Platform Consistency**: Same user experience regardless of platform 