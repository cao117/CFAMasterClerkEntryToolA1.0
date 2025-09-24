# Bugfix Changelog

## [2025-01-25] TECHNICAL FIX: Super Specialty Finals Duplication in Final Awards
- **Issue**: Super Specialty rings in Championship/Premiership tabs were duplicating LH/SH finals data in Final Awards Allbreed column
- **Root Cause**: LH/SH finals appeared in both their respective columns AND the Allbreed column for Super Specialty rings
- **Files Modified**: `src/utils/excelExport.ts`
- **Code Changes**:
  - Modified `extractFinalsDataForColumn()` function (lines 1024, 1036, 1054, 1066): Added Super Specialty exclusion logic
  - For Super Specialty rings: LH finals excluded from Allbreed column, SH finals excluded from Allbreed column
  - Added condition `if (col.judge.ringType === 'Super Specialty' && col.specialty === 'Allbreed') return false;`
  - Applied to both Championship (LH/SH CH) and Premiership (LH/SH PR) sections
- **Impact**:
  - **Final Awards**: Super Specialty Allbreed columns now show only AB CH/PR finals (Best AB CH, 2nd Best AB CH, 3rd Best AB CH)
  - **Final Awards**: LH/SH finals remain in their respective columns, removed from Allbreed column for Super Specialty rings
  - **Other Ring Types**: No impact on Allbreed, Double Specialty, OCP, or single specialty rings
  - **Other Worksheets**: No impact on CH_Final, PR_Final, HHP_Final, or Breed Sheets
- **Testing**: TypeScript compilation passed, no new lint errors introduced

## [2025-01-25] TECHNICAL FIX: HHP Ring Number Mapping in Excel Export
- **Issue**: HHP data in Final Awards and HHP_Final sheets showed incorrect ring numbers (only Ring 1 and Ring 2 instead of 1-4)
- **Root Cause**: Column expansion logic for specialty ring types created multiple columns per judge, causing visual Ring #3 and Ring #4 data to be mapped to Judge #2's columns instead of their respective judge columns
- **Files Modified**: `src/utils/excelExport.ts`
- **Code Changes**:
  - **First Fix**: Modified `transformTabData()` function (lines 574-576): Added special handling for household tab type
  - **Second Fix**: Modified `extractFinalAwardsFromTab()` function (lines 919-921): Added identical special handling for household tab type
  - **Third Fix**: Modified `extractFinalAwardsFromTab()` function (lines 958-962): Added empty ring type for household tab in Final Awards
  - Both column functions now use condition `if (tabType === 'household')` to always create exactly 1 column per judge regardless of ring type
  - Ring type assignment now uses `tabType === 'household' ? '' : (original logic)` to make Ring Type column empty for HHP data in Final Awards only
- **Impact**:
  - **Final Awards**: Now correctly shows all 4 rings (1, 2, 3, 4) with EMPTY ring type column for HHP data only
  - **HHP_Final Sheet**: Now shows 4 columns instead of 8, with correct ring numbers and ring types (unchanged)
  - **Other Tabs**: Championship, Premiership, Kitten tabs in Final Awards remain unaffected (still show ring type labels)
- **Testing**: TypeScript compilation passed, no new lint errors introduced

## [2025-08-14 23:15:00] TECHNICAL FIX: OCP Ring Filler Error Logic - Status Eligibility
- **Files Modified**: `src/validation/championshipValidation.ts`, `src/validation/premiershipValidation.ts`
- **Code Changes**:
  - Championship: Modified `getOCPRankedCatsFromColumn()` function (lines 1565-1570): Changed status check from `'GC' || 'CH'` to `'CH'` only
  - Premiership: Modified `getOCPRankedCatsFromColumn()` function (lines 981-986): Changed status check from `'PR' || 'GP'` to `'PR'` only
  - Both tabs: Added explicit GC/GP exclusion logic with detailed logging
  - Both tabs: Updated function documentation to clarify OCP eligibility requirements
  - Added console logging to show which cats are processed vs skipped based on status eligibility
- **Testing Evidence**: Manual verification confirmed GC/GP cats no longer cause false OCP filler errors
- **Root Cause**: OCP filler validation incorrectly considered non-eligible cats (GC in Championship, GP in Premiership) as "ranked cats" requiring placement
- **Impact**: OCP filler validation now accurately reflects status-specific eligibility rules, eliminating false positive errors

## [2025-08-14 23:00:00] TECHNICAL ENHANCEMENT: SSP Ring Excel Import AB Column Population
- **Files Modified**: `src/utils/excelImport.ts`
- **Code Changes**:
  - Enhanced `populateTabSuperSpecialtyAB()` function (lines 942-958): Updated data copying logic to properly populate AB column from LH/SH columns
  - Fixed Championship section: LH column Best LH CH data → AB column Best LH CH sections
  - Fixed Premiership section: LH column Best LH PR data → AB column Best LH PR sections  
  - Fixed Championship section: SH column Best SH CH data → AB column Best SH CH sections
  - Fixed Premiership section: SH column Best SH PR data → AB column Best SH PR sections
  - Updated documentation to clarify SSP-specific import behavior and round-trip consistency
- **Testing Evidence**: Round-trip consistency verified (export → import → proper AB column data restoration)
- **Root Cause**: Excel import needed to restore AB column data that was intentionally exported as empty to prevent duplication
- **Impact**: SSP rings now maintain complete AB column functionality after Excel import, enabling proper validation and UI behavior

## [2025-08-14 22:35:00] TECHNICAL FIX: SSP Ring Excel Export Data Duplication
- **Files Modified**: `src/utils/excelExport.ts`
- **Code Changes**:
  - Modified `transformTabData()` Championship section (lines 658-680): Added `section.enabledFor(col)` validation in data population loop
  - Modified `transformTabData()` Premiership section (lines 755-777): Added `section.enabledFor(col)` validation in data population loop
  - Added conditional logic to export empty data for disabled sections instead of duplicating values
  - Preserved existing `enabledFor` functions that correctly identify SSP AB column restrictions
- **Testing Evidence**: Manual verification confirmed SSP rings export without duplication while other ring types unaffected
- **Root Cause**: Excel export `enabledFor` logic was defined but not actually applied during data population loops
- **Impact**: SSP rings now export LH/SH data only to their respective columns, with empty AB column duplicate sections

## [2024-12-19 15:30:00] TECHNICAL FIX: Show Count Input Backspace Deletion Consistency
- **Files Modified**: `src/components/GeneralTab.tsx`
- **Code Changes**:
  - Modified `updateChampionshipCount()`: Changed `value === '' ? 0 : value` to `value === '' ? '' : value`
  - Modified `updatePremiershipCount()`: Changed `value === '' ? 0 : value` to `value === '' ? '' : value`  
  - Modified `updateKittenCount()`: Changed `value === '' ? 0 : value` to `value === '' ? '' : value`
  - Modified `handleNumberBlur()`: Changed `field === 'kittenCounts'` to `field.startsWith('kittenCounts')`
- **Testing Evidence**: User confirmed fix works for all show count input types
- **Root Cause**: Inconsistent empty string handling between update functions and field name matching issue in blur handler
- **Impact**: All show count inputs now have consistent backspace deletion behavior

## [Previous Entries]
<!-- Add previous bugfix changelog entries here --> 