# Component Changelog

This document tracks changes to individual components in the CFA Entry application.

## [Unreleased]

### [2025-08-15] BreedSheetsTab: OCP Ring Kitten Support Fix
- **Component:** BreedSheetsTab
- **Change:** Added OCP Ring support for Kitten group in breed sheets
- **Root Cause:** OCP Ring was missing from the ring type check for Kitten hair length availability
- **Solution:** Added `|| selectedJudge.ringType === 'OCP Ring'` to Kitten case in `getAvailableHairLengths()`
- **Files Modified:** `src/components/BreedSheetsTab.tsx`
- **Impact:** OCP Ring judges can now properly select LH/SH for Kitten breed sheets, matching CH/PR behavior

## Final Awards Worksheet

### Version 1.0.0 - 2025-08-15

#### New Feature
- **Final Awards Worksheet**: Added new comprehensive Final Awards worksheet to Excel export containing all Championship, Premiership, Kitten, and Household Pet finals

#### Implementation Details
- **Data Structure**: CSV-format worksheet with columns: Type, Ring, Ring Type, Award, Catalog Number, CH/PR
- **Data Sources**: Extracts from Championship, Premiership, Kitten, and Household Pet tabs
- **Ring Processing**: Processes data ring-by-ring in column order as displayed in tabs
- **Ring Type Mapping**: Correctly identifies Allbreed, Longhair, Shorthair, and OCP ring types

#### Features
- **Championship Awards**: Includes Show Awards 1-10/15 + Best AB CH + Best LH CH + Best SH CH sections
- **Premiership Awards**: Includes Show Awards 1-10/15 + Best AB PR + Best LH PR + Best SH PR sections
- **Kitten Awards**: Show Awards 1-10/15 only (no finals sections)
- **Household Pet Awards**: Show Awards 1-10/15 only (no finals sections)
- **Dynamic Row Counts**: Adjusts to 10 vs 15 awards and 3 vs 5 finals based on entry counts

#### Special Handling
- **OCP Rings**: CH/PR status column left empty for all OCP ring entries
- **SSP Rings**: AB column includes LH CH/PR and SH CH/PR sections (unlike CH_Final/PR_Final sheets)
- **Status Column**: Populated only for Show Awards sections, empty for finals sections
- **VOID Entries**: Excluded from Final Awards worksheet

#### Technical Implementation
- **Function**: `buildFinalAwardsSection()` - Main worksheet builder
- **Helper**: `extractFinalAwardsFromTab()` - Tab-specific data extraction
- **Helper**: `extractFinalsDataForColumn()` - Finals section data extraction
- **Data Format Handling**: Supports both object format (Championship) and string format (Premiership) for finals data

#### Files Modified
- `src/utils/excelExport.ts` - Added Final Awards worksheet generation functions

## Excel Import Utility

### Version 1.1.0 - 2025-08-14

#### Major Enhancement
- **SSP Ring Import AB Column Population**: Implemented logic to properly populate SSP AB column Best LH/SH sections from LH/SH column data during Excel import

#### Technical Changes
- **Enhanced populateSuperSpecialtyABColumns**: Updated function to copy LH/SH Best section data to corresponding AB column sections
- **Data Flow Logic**: LH column Best LH CH/PR → AB column Best LH CH/PR sections
- **Data Flow Logic**: SH column Best SH CH/PR → AB column Best SH CH/PR sections
- **Championship/Premiership Support**: Lines 942-958 implement SSP-specific import logic

#### Features
- **Round-Trip Consistency**: Ensures export → import cycles maintain proper AB column data
- **Validation Compatibility**: AB column data restoration enables full SSP validation functionality
- **Data Integrity**: Maintains business logic expectations for AB column content

#### Impact
- **SSP Rings**: AB column properly populated with LH/SH specific data after import
- **Other Ring Types**: Allbreed, Double Specialty, OCP rings unaffected
- **User Experience**: Complete functionality preserved across export/import operations

#### Files Modified
- `src/utils/excelImport.ts` - Enhanced SSP AB column population logic in populateTabSuperSpecialtyAB function

## Excel Export Utility

### Version 1.1.0 - 2025-08-14

#### Major Bug Fix
- **SSP Ring Export Duplication**: Fixed critical Excel export issue where Super Specialty ring data was duplicated between LH/SH columns and AB column sections

#### Technical Changes
- **enabledFor Logic Application**: Modified `transformTabData` function to properly apply existing `enabledFor` checks during data population
- **Conditional Data Population**: Added logic to export empty values for disabled sections instead of duplicating data
- **Championship Section**: Lines 658-680 updated with `section.enabledFor(col)` validation
- **Premiership Section**: Lines 755-777 updated with `section.enabledFor(col)` validation

#### Bug Fixes
- **Data Duplication**: SSP rings no longer export LH/SH data to both specialty columns AND AB column sections
- **Business Rule Compliance**: AB column now correctly contains only AB-specific data for SSP rings
- **Export Integrity**: Maintains data separation between LH, SH, and AB sections as intended

#### Impact
- **SSP Rings**: AB column Best LH CH/PR and Best SH CH/PR sections export as empty
- **Other Ring Types**: Allbreed, Double Specialty, OCP rings unaffected
- **Data Consistency**: Excel exports now match UI data entry patterns

#### Files Modified
- `src/utils/excelExport.ts` - Fixed data population logic in transformTabData function

## CustomSelect Component

### Version 1.2.1 - 2025-08-04

#### Major Improvements
- **React Portal Implementation**: Migrated dropdown rendering from table cell to document.body using createPortal for proper stacking context isolation
- **Smart Positioning**: Enhanced dropdown positioning logic to dynamically position above or below trigger based on available viewport space
- **Dynamic Height Calculation**: Implemented real-time dropdown height measurement using scrollHeight for accurate positioning calculations
- **Button Ref Targeting**: Updated ref targeting from container div to button element for precise positioning calculations
- **Scroll Behavior**: Added scroll event handling to close dropdown when user scrolls, preventing positioning issues with fixed portal positioning

#### Technical Changes
- **Portal Rendering**: Dropdown now renders at document.body level using createPortal
- **Position Calculation**: Uses getBoundingClientRect() on button element for accurate positioning
- **Height Measurement**: Implements useEffect to measure actual dropdown height using scrollHeight
- **Scroll Handling**: Added scroll event listener to close dropdown on scroll for better UX
- **Z-Index Management**: Increased z-index to z-50 for proper layering above ActionButtons

#### Bug Fixes
- **Stacking Context Issue**: Resolved dropdown covering ActionButtons by rendering outside table DOM
- **Positioning Accuracy**: Fixed positioning offset by targeting button element instead of container
- **Height Calculation**: Replaced fixed CSS max-height with dynamic actual height measurement
- **Scroll Positioning**: Fixed dropdown staying in wrong position when page scrolls

#### API Changes
- **New Props**: Added dropdownRef for internal height measurement
- **New State**: Added dropdownHeight and dropdownRect state variables
- **New Effects**: Added useEffect for height measurement and scroll handling

#### Performance Improvements
- **Reduced DOM Manipulation**: Portal rendering minimizes DOM changes
- **Efficient Positioning**: Real-time height calculation prevents layout shifts
- **Memory Management**: Proper cleanup of scroll event listeners

### Version 1.2.0 - 2025-08-04

#### Initial Release
- **Basic Dropdown Functionality**: Standard dropdown with options selection
- **Theme Support**: Configurable border and text colors
- **Accessibility**: ARIA labels and keyboard navigation
- **Responsive Design**: Adapts to different screen sizes

## GeneralTab Component

### Version 1.2.1 - 2025-08-04

#### Integration Updates
- **CustomSelect Integration**: Updated to use new portal-based CustomSelect component
- **Z-Index Management**: Ensured ActionButtons remain above dropdown elements
- **Container Overflow**: Added overflow-visible to prevent dropdown clipping

### Version 1.2.0 - 2025-08-04

#### Initial Release
- **Judge Information Table**: Comprehensive judge management interface
- **Show Information Section**: Date, club name, master clerk management
- **Show Count Management**: Championship, kitten, premiership tracking
- **Action Buttons**: Excel import/export and data management

## ActionButtons Component

### Version 1.2.1 - 2025-08-04

#### Z-Index Management
- **Proper Layering**: Ensured buttons appear above dropdown elements
- **Stacking Context**: Positioned relative to prevent z-index conflicts

### Version 1.2.0 - 2025-08-04

#### Initial Release
- **Excel Integration**: Save to Excel and Load from Excel functionality
- **Data Management**: Reset and Fill Test Data actions
- **Modern Design**: Gradient buttons with hover effects
- **Responsive Layout**: Flexbox layout with proper spacing

## SettingsPanel Component

### Version 1.2.0 - 2025-08-04

#### Initial Release
- **Configuration Management**: Settings for judges, cats, and thresholds
- **Breed List Management**: Add, edit, and remove breed names
- **Auto-save Settings**: Configure automatic file saving behavior
- **Modern UI**: Glassmorphism design with smooth animations

---

_Last updated: 2025-08-04_ 