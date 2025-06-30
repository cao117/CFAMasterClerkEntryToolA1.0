# Premiership Tab Validation Rules

This document describes the **planned validation rules** for the Premiership tab of the CFA Master Clerk Entry Tool, based on analysis of similarities and differences with the Championship tab.

## Overview

The Premiership tab follows the same overall structure as the Championship tab but with key differences in cat classes, breakpoints, and validation logic specific to Premiership cats.

## Key Differences from Championship Tab

### Breakpoint
- **Championship:** 85 cats → 15 final positions, 5 finals awards
- **Premiership:** 50 cats → 15 final positions, 3 finals awards

### Cat Classes
- **Championship:** GC (Grand Champion), CH (Champion), NOV (Novice)
- **Premiership:** GC (Grand Champion), PR (Premier), NOV (Novice)

### Finals Structure
- **Championship:** Best AB CH, Best LH CH, Best SH CH
- **Premiership:** Best AB PR, Best LH PR, Best SH PR

## Premiership Cat Calculation

Total Premiership cats = gcs + lhPrs + shPrs + unregistered Premiership cats

Where:
- `gcs` = Grand Champions
- `lhPrs` = Longhair Premiers  
- `shPrs` = Shorthair Premiers
- `unregistered Premiership cats` = Unregistered Premiership cats (not registered with CFA)

## Breakpoint Logic

### Allbreed Rings
- **If ≥50 Premiership cats:**
  - Premiership Final: Top 15 positions
  - Best AB PR: 3 positions
  - Best LH PR: 3 positions  
  - Best SH PR: 3 positions

- **If <50 Premiership cats:**
  - Premiership Final: Top 10 positions
  - Best AB PR: 2 positions
  - Best LH PR: 2 positions
  - Best SH PR: 2 positions

### Longhair Rings
- **If LH Premiership cats ≥50:**
  - LH Premiership Final: Top 15 positions
  - Best LH PR: 3 positions

- **If LH Premiership cats <50:**
  - LH Premiership Final: Top 10 positions
  - Best LH PR: 2 positions

### Shorthair Rings
- **If SH Premiership cats ≥50:**
  - SH Premiership Final: Top 15 positions
  - Best SH PR: 3 positions

- **If SH Premiership cats <50:**
  - SH Premiership Final: Top 10 positions
  - Best SH PR: 2 positions

## Validation Rules (Similar to Championship)

### Void Feature
- **Purpose**: Allows marking placements as "voided" when a cat wins an award but is not present to receive it physically in the show hall.
- **Visual Indication**: When a void checkbox is checked, the corresponding cat number input is struck through, grayed out, and becomes read-only (disabled).
- **Cross-Section Behavior**: When a cat number is voided in one section, ALL instances of that cat number across ALL sections are voided simultaneously. Unvoiding any instance unvoids all instances.
- **Conditional Visibility**: Void checkboxes are grayed out and disabled when the corresponding cat number input is empty.
- **Validation Impact**: Voided inputs participate in validation normally - all validation rules continue to apply as if the placement is normal.

### Cat Number Validation
- Must be a number between 1 and 450.
- Empty values are allowed and skip further validation for that position.

### Duplicate Validation
- No duplicate cat numbers allowed within the same section:
  - **Premiership Final (Top 10/15)**: No duplicates within this section only
  - **Best AB PR Final**: No duplicates within this section only
  - **Best LH PR Final**: No duplicates within this section only
  - **Best SH PR Final**: No duplicates within this section only
- **Cross-section duplicates are allowed**: A cat number can appear in multiple sections as long as it is not a duplicate within any single section.
- Empty values don't count as duplicates.

### Sequential Entry Validation
- Must fill positions sequentially (no skipping positions).
- Empty values are allowed and don't break sequential entry.

### Premiership Final Validation
- Cat numbers must be between 1-450.
- Status must be one of: GC, PR, NOV.
- No duplicates within the same column.

### Finals Validation
- Cat numbers must be between 1-450.
- No duplicates within the same section.
- Must fill positions sequentially.

## Premiership-Specific Validation Rules

### Best PR Validation (Allbreed Rings Only)
- Best PR must contain PR cats from Premiership Final in the same order.
- If there are no PRs in Premiership Final, Best PR can be filled with any PR cats entered in the show.
- GC and NOV are never eligible for Best PR.

### LH/SH Split Validation (Allbreed Rings Only)
- The union of Best LH PR and Best SH PR must exactly match all Best PR cats (no missing, no extra, no duplicates).
- Best LH PR and Best SH PR must contain exactly all Best PR cats without duplicates.

### Best LH PR Validation (Longhair Rings Only)
- Best LH PR must contain PR cats from LH Premiership Final in the same order.
- If there are no PRs in LH Premiership Final, Best LH PR can be filled with any PR cats entered in the show.

### Best SH PR Validation (Shorthair Rings Only)
- Best SH PR must contain PR cats from SH Premiership Final in the same order.
- If there are no PRs in SH Premiership Final, Best SH PR can be filled with any PR cats entered in the show.

### Cross-Section Validation
- A cat cannot be both LH PR and SH PR in the same column.
- GC and NOV cats from Premiership Final cannot be awarded PR finals.

### Order Validation
- Best AB PR cats must appear in the same order in LH PR and SH PR sections.
- Best AB PR cats must appear before any other cats in LH PR and SH PR sections.

## UI/UX Features (Same as Championship)

### Frozen Left Column and Sticky Headers
- Position column remains frozen on the left
- Header rows (Ring Numbers, Judge Acronyms, Ring Types) remain sticky at the top
- Consistent styling with Championship tab

### Jump to Ring Dropdown
- Dropdown to scroll horizontally to a selected ring column
- Styled with rounded corners, subtle shadow, and gold border on focus

### Column Highlighting
- Pale CFA gold background highlight for the focused column
- Excludes the top 3 header rows
- Moves to the column currently interacted with by the user

### Void Functionality
- Red-bordered void checkboxes with tooltips
- Tooltips positioned below to avoid overlap with sticky headers
- Cross-section voiding behavior

### Tab-Specific Reset
- Resets only Premiership tab form data
- Regenerates table structure based on current judge information
- Shows warning modal informing user that reset is irreversible
- Keeps General Info tab and other tabs intact

## Test Data Generation

### Premiership Final Test Data
- Randomly assign statuses (GC, PR, NOV) to each position
- Ensure cat numbers remain unique within each section
- Use correct number of positions based on breakpoint (10 or 15)

### Finals Test Data
- For Allbreed columns: Best PR gets ALL PR cats, then split between LH and SH maintaining order
- For Longhair columns: Best LH PR gets PR cats from LH Premiership Final
- For Shorthair columns: Best SH PR gets PR cats from SH Premiership Final
- Fill remaining positions with unique unused numbers

### LH/SH Split (Allbreed Only)
- Use odd/even rule for split (odd = LH, even = SH)
- Must include ALL Best PR cats (including fillers)
- Place split cats at the top of each section, in order, then fill with unique fillers

## Error Display

- Errors are shown inline, next to the relevant field.
- Only the first problematic position is highlighted for each rule.
- Error/Warning precedence follows the same logic as Championship tab.
- All error messages use "PR" terminology instead of "CH".

## UI Labels

- **Section Headers**: "Premiership Final" instead of "Show Awards"
- **Finals Labels**: "Best AB PR", "Best LH PR", "Best SH PR"
- **Position Labels**: "Best PR", "2nd Best PR", "3rd Best PR", etc.

## Implementation Notes

### Files to Create
1. `src/components/PremiershipTab.tsx` - Main component
2. `src/validation/premiershipValidation.ts` - Validation logic
3. Update `src/App.tsx` to include Premiership tab

### Validation Functions Needed
- `validatePremiershipTab()` - Main validation function
- `validateBestPRWithTop15()` - Best PR validation
- `validateBestLHPRWithTop15()` - Best LH PR validation  
- `validateBestSHPRWithTop15()` - Best SH PR validation
- `validateLHSHWithBestPR()` - LH/SH split validation
- `checkDuplicateCatNumbersInPremiershipFinal()` - Duplicate validation
- `validateSequentialEntry()` - Sequential entry validation

### State Management
- `premiershipData` - All Premiership tab data
- `voidedPremiershipFinal` - Void state for Premiership Final
- `voidedBestPRFinals` - Void state for Best PR Finals
- `voidedLHPRFinals` - Void state for LH PR Finals
- `voidedSHPRFinals` - Void state for SH PR Finals

## Questions for Clarification

1. **Premiership Cat Calculation**: Is the formula `gcs + lhPrs + shPrs + unregistered Premiership cats` correct?

2. **Validation Rules**: Should PR cats from Premiership Final be required in Best PR finals in order?

3. **LH/SH Split Logic**: Should the union must match Best AB PR logic work the same way as Championship?

4. **GC and NOV Eligibility**: Should GC and NOV cats be ineligible for Best PR finals?

5. **Test Data Generation**: Should test data populate PR cats from Premiership Final into Best PR finals?

6. **Odd/Even Split Rule**: Should the odd/even split rule apply for LH/SH assignment in test data?

7. **Void Functionality**: Should void functionality work exactly the same as Championship?

8. **Reset Behavior**: Should tab-specific reset work the same way as Championship?

---

**Note**: This document serves as a planning guide for implementing the Premiership tab. All validation rules and UI/UX features should be implemented to match the Championship tab structure while adapting for Premiership-specific requirements.

## Last Updated
- 2024-12-19 