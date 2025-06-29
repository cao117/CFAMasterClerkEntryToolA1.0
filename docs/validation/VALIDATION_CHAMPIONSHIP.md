# Championship Tab Validation Rules

This document describes the **current validation rules** enforced in the Championship tab of the CFA Master Clerk Entry Tool.

## Void Feature
- **Purpose**: Allows marking placements as "voided" when a cat wins an award but is not present to receive it physically in the show hall.
- **Visual Indication**: When a void checkbox is checked, the corresponding cat number input is struck through, grayed out, and becomes read-only (disabled).
- **Cross-Section Behavior**: When a cat number is voided in one section, ALL instances of that cat number across ALL sections are voided simultaneously. Unvoiding any instance unvoids all instances.
- **Conditional Visibility**: Void checkboxes are grayed out and disabled when the corresponding cat number input is empty.
- **Validation Impact**: Voided inputs participate in validation normally - all validation rules continue to apply as if the placement is normal.
- **Behavior**: 
  - Void checkboxes appear after status dropdowns in Show Awards and after cat number inputs in Finals sections
  - Checkboxes have red borders and show tooltips on hover explaining their purpose
  - Tab navigation remains on cat number inputs only (void checkboxes are not part of tab sequence)
  - Voided inputs are disabled and cannot be edited until unvoided
  - Unchecking a void checkbox restores normal input appearance and editability

## Cat Number Validation
- Must be a number between 1 and 450.
- Empty values are allowed and skip further validation for that position.

## Duplicate Validation
- No duplicate cat numbers allowed within the same section:
  - **Championship Final (Top 10/15)**: No duplicates within this section only
  - **Best AB CH Final**: No duplicates within this section only
  - **Best LH CH Final**: No duplicates within this section only
  - **Best SH CH Final**: No duplicates within this section only
- **Cross-section duplicates are allowed**: A cat number can appear in multiple sections (e.g., #1 in both Championship Final and Best AB CH Final) as long as it is not a duplicate within any single section.
- **Note:** For finals sections (Best AB CH, Best LH CH, Best SH CH), duplicate validation is only within their own section. There is no duplicate check against Show Awards or other finals sections.
- Empty values don't count as duplicates.

## Sequential Entry Validation
- Must fill positions sequentially (no skipping positions).
- Empty values are allowed and don't break sequential entry.

## Show Awards Validation
- Cat numbers must be between 1-450.
- Status must be one of: GC, CH, NOV.
- No duplicates within the same column.

## Finals Validation
- Cat numbers must be between 1-450.
- No duplicates within the same section.
- Must fill positions sequentially.

## Best CH Validation (Allbreed Rings Only)
- Best CH must contain CH cats from Show Awards in the same order.
- If there are no CHs in Show Awards, Best CH can be filled with any CH cats entered in the show.

## LH/SH Split Validation (Allbreed Rings Only)
- The union of Best LH CH and Best SH CH must exactly match all Best CH cats (no missing, no extra, no duplicates).
- Best LH CH and Best SH CH must contain exactly all Best CH cats without duplicates.

## Best LH CH Validation (Longhair Rings Only)
- Best LH CH must contain CH cats from Show Awards in the same order.
- If there are no CHs in Show Awards, Best LH CH can be filled with any CH cats entered in the show.

## Best SH CH Validation (Shorthair Rings Only)
- Best SH CH must contain CH cats from Show Awards in the same order.
- If there are no CHs in Show Awards, Best SH CH can be filled with any CH cats entered in the show.

## Cross-Section Validation
- A cat cannot be both LH CH and SH CH in the same column.
- GC and NOV cats from Show Awards cannot be awarded CH finals.

## Order Validation
- Best AB CH cats must appear in the same order in LH CH and SH CH sections.
- Best AB CH cats must appear before any other cats in LH CH and SH CH sections.

## Championship Final Section (Top 10/15)
- **Cat Number**
  - Must be a number between 1 and 450.
  - No duplicate cat numbers within a column.
  - Must fill positions sequentially (no skipping positions).
  - Empty values are allowed and skip further validation for that position.
- **Status**
  - Must be one of: GC, CH, NOV.

## Champions Finals (Best CH)
- **Best AB CH (Allbreed only)**
  - If there are CHs in the Championship Final (Top 10/15), those CHs (in order) must be at the top of Best AB CH, then fill with other CHs from Championship Final (in order, skipping any already used) up to the number of finals positions.
  - If there are no CHs in the Championship Final, Best AB CH can be filled with any CH cats entered in the show (not in the final), in any order.
  - **Important**: When there are no CHs in Championship Final, cats used in Best AB CH are assumed to be CHs entered in the show but not in the Championship Final. They do not need to be added to Championship Final first.
  - GC and NOV are never eligible for Best AB CH.
  - No duplicate cat numbers.
  - Each cat must be a CH entered in the show at the time of validation.
  - Filler positions (if fewer CH cats than finals positions) can be left blank or filled with unique CHs entered in the show.

### Example: All Championship Final are GC or NOV
If Championship Final (top 10) = [1: GC, 2: GC, 3: NOV, 4: GC, 5: GC, 6: GC, 7: GC, 8: GC, 9: GC, 10: GC], and there are other CHs entered in the show (e.g., [11: CH, 12: CH, 13: CH]), then Best AB CH = [11, 12, 13] is valid.

> **Note:** "Any CH cats entered in the show" means any cat with status CH in the entry list, regardless of whether they appear in the Championship Final (top 10/15) or not.

## Longhair/Short Hair Champions Finals (Best LH CH, Best SH CH)
- **Best LH CH / Best SH CH (Allbreed only)**
  - All Best CH cats must be assigned to either LH or SH (using odd/even split for test data, but user input is free-form).
  - The union of Best LH CH and Best SH CH must exactly match all Best CH cats (no missing, no extra, no duplicates).
  - No cat may appear in both LH and SH.
  - Filler positions (beyond the number of split cats) can be any value, but must not be a non-CH from Championship Final, a duplicate, or in both LH and SH.
- **Best LH CH (Longhair ring)**
  - Must match CH cats from Championship Final in order (up to finals positions).
- **Best SH CH (Shorthair ring)**
  - Must match CH cats from Championship Final in order (up to finals positions).

## Error Display
- Errors are shown inline, next to the relevant field.
- Only the first problematic position is highlighted for each rule.
- **Error/Warning Precedence for Best AB CH:**
  1. **Red Error:** Sequential entry violation (e.g., "You must fill Best AB CH and 2nd Best AB CH before entering 3rd Best AB CH.") takes precedence and is shown first.
  2. **Red Error:** Other validation errors (e.g., duplicate, invalid cat number, GC/NOV status, etc.) are shown next.
- The message "X needs to be assigned to either LH or SH CH final" is always shown as a regular error (red), regardless of whether LH/SH sections are fully filled or not. There is no warning/reminder distinction for this message.

## Additional Rules
- **Required Field Indicators**
  - All required fields are marked with a red asterisk (*).
- **Auto-Indexing**
  - Ring numbers and positions are automatically managed.

## Last Updated
- 2024-06-09 

## Test Data Generation (Test Population)

- When using the "Test Population" feature, the tool fills the Best CH (Allbreed) section with all CH cats from Championship Final, in order, up to the number of finals positions (3 or 5).
- If there are fewer CH cats than finals positions, unique filler cat numbers are used to fill the remaining Best CH positions.
- **Every cat number in Best CH (including fillers) is then split into Best LH CH and Best SH CH using the odd/even rule (odd = LH, even = SH).**
- This guarantees that after test data fill, there are never any "missing from LH/SH split" validation errors, regardless of the number of real CH cats.
- The split is performed on the entire Best CH array, not just the real CH cats.

## Validation Rule: Best CH, LH/SH Split

- The union of Best LH CH and Best SH CH must exactly match all Best CH cats, with no omissions or duplicates.
- During test data fill, this is always satisfied by splitting the full Best CH array (including fillers) according to the odd/even rule.

## Best LH/SH CH Validation (Allbreed)

- For each position in Best LH CH and Best SH CH:
  - If the value is in Best AB CH, strict validation applies ('is not in Best CH').
  - Otherwise, it is treated as a filler and only checked for not being a non-CH from Championship Final and not being a duplicate.
  - There is no 'first N' or index-based logic; validation is per-position based on intersection with Best AB CH.

## Test Data Generation
- Filler positions in LH/SH (when there are fewer Best CH cats than finals positions) are not required to match Best CH and will not trigger errors if not present in Best CH.
- The 'is not in Best CH' error is only applied to the first N positions (N = number of Best CH cats) in Best LH/SH CH.
- Filler positions (beyond N) will never trigger this error, regardless of their value.

- For both Allbreed and specialty (Longhair/Shorthair) columns:
  - Filler positions in Best LH/SH CH (positions beyond N) never trigger 'is not in Best CH' or 'must match CH cats from championship final in order' errors.
  - For fillers, only check for not being a non-CH from Championship Final and not being a duplicate.

- For Best LH CH and Best SH CH:
  - Only positions in LH/SH CH that are also present in Best AB CH are strictly validated for 'is not in Best CH'.
  - All other positions are treated as fillers and do not trigger this error.
  - Fillers are only checked for not being a non-CH from Championship Final and not being a duplicate.

## New Validation Rule: Order of Cats in Best LH CH and Best SH CH
- The order of cats in Best LH CH and Best SH CH must preserve the order from Best CH.
- **Validation Rule:** If a filler (not in Best AB CH) appears before a Best AB CH cat in LH/SH CH, an error is shown on both the filler and the out-of-order Best AB CH cat. All Best AB CH cats must appear at the top of LH/SH CH, in order, before any fillers.
- Fillers (cats not in Best AB CH) may only appear after all Best AB CH cats are placed, if more positions are available than Best AB CH cats.
- It is not possible for a Best AB CH cat to be 2nd or 3rd in either specialty final; by definition, Best AB CH is the best cat regardless of hair length.

## Order Rule (Subsequence): All Best AB CH cats that appear in Best LH CH or Best SH CH must be at the top, in the same order as in Best AB CH. Not all Best AB CH cats are required to appear in LH/SH CH; only those that do must preserve the order. No filler (not in Best AB CH) may appear before any present Best AB CH cat. After all present Best AB CH cats, fillers may appear.

**Example:**
If Best AB CH = [A, B, C, D, E] and Best SH CH = [A, D, B, X, Y]:
  - This is invalid because B appears after D, but in Best AB CH, B comes before D.
  - The valid order for present Best AB CH cats in SH CH would be [A, B, D, ...].
  - Any fillers (X, Y) must come after all present Best AB CH cats.

## Error Precedence and Relationship Rules

- If a cat is listed as GC or NOV in Championship Final, the error 'X is listed as a GC/NOV in Championship Final and cannot be awarded CH final.' always takes precedence over any other error (including 'Best CH is missing from LH/SH split').
- The 'Best CH is missing from LH/SH split' error is never shown for a cat that is a GC or NOV in Championship Final; only the GC/NOV error is shown for that cat.
- If a cat is not found in Championship Final, no error is shown for that specific check.
- If a cat in Championship Final is missing a status (GC/CH/NOV), the error 'X in Championship Final is missing a status (GC/CH/NOV) and cannot be awarded CH final.' always takes precedence over any other error (including 'Best CH is missing from LH/SH split').
- If a cat in Championship Final has an invalid status (not GC, CH, or NOV), the error 'X in Championship Final has an invalid status and cannot be awarded CH final.' always takes precedence over any other error (including 'Best CH is missing from LH/SH split').

## Warning Messages
- **LH/SH Assignment Reminder**: When a Best AB CH cat is not yet assigned to either LH or SH CH final, a warning message appears in orange
- **Timing**: Warning only appears when both LH and SH sections are not fully filled, indicating the user is still in the process of assigning cats
- **Purpose**: Provides helpful guidance without blocking validation, encouraging users to complete the assignment process 

## Single Specialty Ring (LH/SH) Best CH Validation (2024-06)

For **Longhair** or **Shorthair** rings (single specialty):
- If there are CHs (Champions) in the Championship Final, those CHs (in order) must be at the top of the enabled section (LH or SH CH), in order.
- If there are no CHs in the final, any CH entered in the show (for that column) can be used in the enabled section.
- GC (Grand Champion) and NOV (Novice) cats are never eligible for Best LH/SH CH.
- Duplicates are not allowed within the section.
- The order of CHs in the enabled section must match the order in the final if present.
- Error messages and display are consistent with Allbreed logic.

This ensures strict per-section validation for single specialty rings, matching CFA rules and the Allbreed logic for Best CH. 