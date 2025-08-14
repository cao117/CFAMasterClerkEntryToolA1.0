# Bugfix Changelog

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