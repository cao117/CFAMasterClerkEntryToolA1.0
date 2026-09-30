# Household Pet Tab Validation Rules

This document describes the **current validation rules** enforced in the Household Pet tab of the CFA Master Clerk Entry Tool.

## UI/UX Structure
- The Household Pet tab is visually and functionally identical to the Kitten tab, except for the following reductions:
  - Only one section: **Top 10/15 Household Pets** (no finals or sub-sections)
  - Columns are dynamically generated from the General tab judges/ring types (AB=1, LH=1, SH=1, Double Specialty=2)
  - Only one status: **HHP** (all caps), always selected in the dropdown
  - **If a Cat # input is VOID (case-insensitive, trimmed), the status label is hidden (not rendered) for that cell, and only 'VOID' is saved/restored in the CSV.**
  - Three action buttons at the bottom: Save to CSV, Load from CSV, Reset (shared logic)
  - Voiding logic, error display, keyboard navigation, and all styling match the Kitten tab exactly

## Breakpoint Logic
- **Breakpoint:** [configurable threshold] household pets (total, default: 30 per CFA Show Rule 11.32)
  - If **≥ threshold household pets**: Top 15 positions
  - If **< threshold household pets**: Top 10 positions
  - All columns use the same row count, regardless of ring type
  - The threshold is configurable in the General Settings panel

## Cutoff Value: Why a Saved 50 Is Read as 30 (MCE-9)

### The rule
CFA Show Rule 11.32 (same wording in the 2025-26 and 2026-27 editions):

> The awards for Household Pet Finals shall be Best through Tenth Best Cat and, if 30 or more are entered, Eleventh through Fifteenth Best Cat.

### What went wrong
From the first version of this tab (2025-07-04) until MCE-9 (2026-09-30) the tool used a cutoff of **50**. 50 was never a CFA rule for Household Pets in any season; it was a build error. A show with 30–49 household pets was given 10 rows instead of 15.

### Why changing the default was not enough
The cutoff is saved in two places outside the code, and both override the built-in default:

1. **Each clerk's machine** — localStorage key `cfa_global_settings`. The app writes its settings there on first launch, so every install that ever ran the old build has `household_pet: 50` saved.
2. **Every saved show file** — the `Settings` sheet of each exported Excel file and autosave carries a `Household Pet | 50` row. Loading a file applies its cutoffs to the running app, which then saves them to localStorage.

### What the code does
`correctedHouseholdPetThreshold()` in `src/utils/settingsLoader.ts` turns a saved **50 into 30** and leaves every other value alone. It runs in two places:

- `loadGlobalSettings()` in `src/utils/settingsLoader.ts` — when the app starts and reads localStorage
- `parseSettingsWorksheet()` in `src/utils/excelImport.ts` — when a saved Excel file or autosave is loaded

Rewriting every saved 50 is correct here because 50 was never valid for any show, past or present, and a saved 50 cannot be told apart from the old default.

### Known limitation
Nobody can keep a Household Pet cutoff of exactly 50: it is read as 30 on the next launch or file load. Every other custom value is kept.

## Changing the Cutoff (If CFA Changes the Rule)

Read this before changing the Household Pet cutoff. The same saved-value problem applies to the Championship, Kitten and Premiership cutoffs.

### A rule change is not the same as MCE-9
MCE-9 corrected a number that was never right, so it rewrote every saved copy. A real rule change has an effective date: shows held before that date were correctly scored under the old cutoff, and their saved files should keep it. Decide how old show files are treated before writing code.

### Steps
1. **Confirm with the project owner:** the new cutoff, the date it takes effect, and whether show files dated before that date keep their old cutoff (recommended: yes).
2. **Change the default everywhere it appears.** Find every copy with `grep -rnE "household_pet|householdPet" src | grep -w 30`:
   - `DEFAULT_SETTINGS` in `src/App.tsx`
   - `DEFAULT_SETTINGS` and the Household Pet input `placeholder` in `src/components/SettingsPanel.tsx`
   - the default in `parseSettingsWorksheet()` in `src/utils/excelImport.ts`
   - the default parameter of `validateHouseholdPetTab()` in `src/validation/householdPetValidation.ts`
   - three places in `src/utils/excelExport.ts`: the Settings sheet fallback, the `HHP_Final` row count in `transformTabData()` (a fixed number that does not read Settings), and the fallback in `getMaxAwardRows()`
3. **Convert the value saved on clerks' machines.** In `loadGlobalSettings()`, turn the retired default (30) into the new cutoff. Without this, updated installs stay on 30.
4. **Convert saved files by show date.** In `parseSettingsWorksheet()`, use the file's show date (`showDate` in the `General_Info` sheet): a file dated before the effective date keeps its cutoff, a file dated on or after it has the retired default converted.
5. **Update the tests** in `src/utils/hhpPlacementCutoff.test.ts` to the new boundary, and update this document.

### If the new cutoff is 50
This is the one case the current code works against. With the 50 → 30 conversion still in place, the app would save the new default of 50 and read it back as 30 on the next launch. The guard test "the legacy-50 conversion never rewrites the current default cutoff" fails to flag this.

Replace the conversion rather than adding to it:

| Saved value | Where | Show date | Result | Why |
|---|---|---|---|---|
| 30 | localStorage | — | 50 | 30 is now the retired default |
| 50 | localStorage | — | 50 | Already correct; the 50 → 30 conversion is removed here |
| 30 | show file | on or after the effective date | 50 | Saved by a build older than the rule change |
| 50 | show file | on or after the effective date | 50 | Already correct |
| 30 | show file | before the effective date | 30 | Correct for that show's season |
| 50 | show file | before the effective date | 30 | A pre-MCE-9 file carrying the old build error; the rule for that show was 30 |

This procedure is reasoned from how the settings are stored; it has not been implemented or tested. One point still needs a decision at that time: the localStorage conversion takes effect when a clerk installs the update, so an update released before the effective date would apply the new cutoff early.

## Validation Rules
- **Cat number format:** Must be between 1-{max_cats}
- **Sequential entry:** Must fill positions sequentially (no skipping)
- **Duplicate check:** No duplicates within the same section of the final. If a duplicate is found, the error is shown on all cells with the same value in that section (not just the last entered cell). The error message is: 'Duplicate cat number within this section of the final'.
- **Status validation:** Only HHP is allowed (always selected)
- **If a Cat # input is VOID, the status label is hidden (not rendered) for that cell.**
- **Voiding:** Voiding a cat number in any cell in a column voids all instances of that cat number in that column
- **Error display:** Errors are shown inline, with the same styling and precedence as the Kitten tab

## Error Precedence
For each cell, only the highest-precedence error is shown:
1. Duplicate error (within section of the final; shown on all cells with the same value; message: 'Duplicate cat number within this section of the final')
2. Range error (cat number not 1-{max_cats})
3. Sequential entry error ("You must fill previous placements before entering this position.")
4. Status error (should always be HHP)

## Parity with Kitten Tab
- All UI/UX, error display, voiding, and keyboard navigation are identical to the Kitten tab
- Only the number of sections and allowed status differ

## Last Updated
- 2024-06-22 

## Voiding Logic
- If a cat number is voided anywhere in a column, all instances of that cat number in that column are voided (including new ones).
- Unchecking void in any cell unvoids all instances in that column for that cat number.
- This logic applies across the full column, matching Championship, Premiership, and Kitten tabs. 
- **If a Cat # input is VOID, the status label is hidden (not rendered) for that cell, and only 'VOID' is saved/restored in the CSV.**

## Household Pet Tab Validation Rules

- Only filled rows require status 'HHP'.
- Empty rows (no cat number) are allowed and do not trigger errors.
- When importing from CSV, a blank Household Pet section does not cause validation errors. 