# Bugfix Changelog

## [2026-05-27] SSP hair-length exclusivity — consolidated LH/SH cross-column duplicate (MCE-6)
- **Issue**: A cat that was Best LH CH/PR but also placed in the SH Top-10/15 show awards (or the mirror) was not flagged as a duplicate. Reported from a Premiership screenshot — cats 1 and 2 were Best LH Premier and also sat in the SH show awards with no error.
- **Root Cause**: the LH↔SH duplicate check only compared matching sections (show-vs-show via the old `validateCrossColumnDuplicates`, finals-vs-finals via the MCE-5 `validateSpecialtyFinalsCrossColumnDuplicates`). The two cross pairings (LH finals × SH show awards, and LH show awards × SH finals) were never checked.
- **Files Modified**: `src/validation/championshipValidation.ts`, `src/validation/premiershipValidation.ts`
- **Code Changes**: replaced both section-specific functions with one consolidated rule per tab (`validateSSPHairLengthExclusivityCH/PR`) that intersects the LH column's full cat set (show awards ∪ Best LH finals) with the SH column's full cat set and flags every cell of any shared cat. AB column excluded (Best AB is drawn from the specialties).
- **Impact**: any cat recorded in both the LH and SH specialty columns of an SSP ring — in any section — is now flagged "cannot be both longhair and shorthair". Kitten unchanged (no finals → already complete).
- **Testing**: MCE-6 test blocks cover all four pairings + negatives (CH + PR); verified the two cross-pairing tests fail under simulated old behavior. 82 jest tests pass; `vite build` clean; lint at/below baseline.

## [2026-05-27] SSP finals order (PR) + cross-column duplicate + message unification (MCE-4b + MCE-5)
- **Issue (MCE-4b)**: For a Premiership SSP ring, the "Best LH/SH PR must follow Best AB PR order" rule never fired. Reported via a live case: LH PR `[1,2]`, Best AB PR `[2,1]` produced no order violation, while the equivalent Championship case did. MCE-4 had added the resolver but the PR call site gated the check behind `column.specialty === 'Allbreed'`, so it was unreachable for an SSP Longhair/Shorthair column. (Reopen of MCE-4 — the PR finals-order side was never actually closed; its test passed because a different rule emitted a matching "out of order" string.)
- **Issue (MCE-5)**: A cat placed in both Best LH and Best SH finals of an SSP ring was not flagged (the same-column "cannot be both longhair and shorthair" check only compares within one column; SSP splits LH/SH across columns).
- **Root Cause**: Championship runs the LH/SH AB-subsequence order check **unconditionally** (additive with the separate top-15 check); Premiership collapsed both into a single either/or switch on `column.specialty` built on a pre-SSP assumption that a specialty column is always a standalone ring. SSP columns are simultaneously a specialty column and part of an allbreed ring, so the switch skipped the AB check.
- **Files Modified**: `src/validation/championshipValidation.ts`, `src/validation/premiershipValidation.ts`
- **Code Changes**:
  - PR LH/SH order dispatch made **additive** (mirrors CH): `validateBestHairPROrder` now runs for LH/SH regardless of specialty (self-no-ops when there is no AB sibling).
  - Added `validateSpecialtyFinalsCrossColumnDuplicatesCH`/`PR` to the SSP cross-column suite (step 6) for the LH-vs-SH finals duplicate.
  - Unified all finals-section duplicate messages to `Duplicate: Cat #<n> cannot be both longhair and shorthair` (was generic "a cat …"), matching Show Awards.
- **Impact**: Premiership SSP finals order/filler now enforced (parity with Championship); cross-column finals duplicates caught in both tabs; duplicate messages consistent across sections.
- **Testing**: `sspReminder.test.ts` reworked to cell-specific assertions + error-class/partition coverage; confirmed the SSP order tests fail on the pre-fix code. 74 jest tests pass; `vite build` clean; lint at baseline.

## [2026-05-27] SSP cross-column validation: false-positive fix + gap closure (MCE-3 + MCE-4)
- **Issue (MCE-3)**: On a freshly-entered Super Specialty ring, the AB column showed false "needs to be assigned to either LH or SH CH final" reminders even when the cats were placed in the LH/SH specialty columns. Present on production.
- **Issue (MCE-4)**: The "LH/SH CH must be a subsequence of AB CH" order rule and the filler-priority rule were silently unenforced for SSP rings.
- **Root Cause**: Validators built for the single-column Allbreed ring read the AB column's own LH/SH finals sub-sections, which are empty during live entry (populated only on import). For SSP, LH/SH bests live in separate specialty columns, so these checks false-fired (reminder) or no-opped (order/filler).
- **Files Modified**: `src/validation/championshipValidation.ts`, `src/validation/premiershipValidation.ts`
- **Code Changes**:
  - Added SSP-aware helpers `isCatInSpecialtyCHFinal`/`isCatInSpecialtyPRFinal` (reminder reads specialty columns) and `getAbChSourceColIdx`/`getAbPrSourceColIdx` (order/filler read the AB list from the sibling AB column).
  - Consolidated Championship's 3 redundant reminder sites to 1; removed dead `validateLHSHWithBestCHAndGetFirstError`.
  - Removed vacuous `validateSpecialtyFinalsConsistency*` (CH + PR) — compared specialty finals to the empty AB sub-section.
- **Impact**: SSP rings entered live no longer show false "assign to LH/SH" reminders; SSP finals order/filler are now enforced cross-column. Allbreed/OCP/standalone behavior unchanged.
- **Testing**: 65 jest tests pass (full CH rule matrix + SSP suite with live≡import equivalence); `vite build` clean; lint below baseline.

## [2026-02-04] TECHNICAL FIX: Kitten_Final OCP Ring Column Generation
- **Issue**: Kitten_Final worksheet incorrectly included OCP column data for OCP Ring judges when kittens don't compete in OCP rings
- **Root Cause**: `transformTabData()` and `extractFinalAwardsFromTab()` functions created both Allbreed and OCP columns for OCP Ring judges regardless of tab type
- **Files Modified**: `src/utils/excelExport.ts`
- **Code Changes**:
  - Modified `transformTabData()` (lines 584-592): Added tabType check for OCP Ring handling
  - Modified `extractFinalAwardsFromTab()` (lines 957-965): Added matching tabType check for Final Awards consistency
  - Both functions now create only Allbreed column for OCP Ring judges when `tabType === 'kitten'`
- **Impact**: Kitten_Final worksheet now correctly shows only Allbreed column for OCP Ring judges, matching KittenTab.tsx UI behavior
- **Testing**: TypeScript compilation passed, build successful

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