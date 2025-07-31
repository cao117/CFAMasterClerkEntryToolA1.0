# General Tab Validation Rules

This document describes the **current validation rules** enforced in the General tab of the CFA Master Clerk Entry Tool.

## Show Information
- **Show Date**
  - Required. Must be a valid date.
- **Club Name**
  - Required. Cannot be empty or whitespace.
  - Maximum 255 characters.
- **Master Clerk Name**
  - Required. Cannot be empty or whitespace.
  - Maximum 120 characters.

## Number of Judges
- **# of Judges**
  - Required. Must be between 1 and the maximum set in Settings Panel (default: 12).
  - Setting to 0 clears all judges.
  - Setting above the maximum is capped at the maximum.
  - Setting below 0 is capped at 0.
  - **Dynamic Maximum**: The maximum is configurable in Settings Panel → General Settings → "Maximum Number of Judges"

## Judge Information
- **Judge Name**
  - Required for each judge.
  - Maximum 120 characters.
  - Must be unique among all judges.
- **Acronym**
  - Required for each judge.
  - Maximum 6 characters.
  - Must be unique among all judges.
- **Ring Type**
  - Required for each judge.
  - Must be one of: Longhair, Shorthair, Allbreed, Double Specialty, Super Specialty, OCP Ring.
- **Ring Number**
  - Required for each judge.
  - Must be between 1 and the maximum set in Settings Panel (default: 12).
  - Must be unique among all judges.
  - **Dynamic Maximum**: The maximum is configurable in Settings Panel → General Settings → "Maximum Number of Judges"

## Championship, Kitten, and Premiership Counts
- **Championship Counts**
  - # of LH GCs, SH GCs, LH CHs, SH CHs, LH NOVs, SH NOVs: Each must be a non-negative integer.
  - Each count is automatically capped at the maximum cats setting (default: 450).
  - When the maximum cats setting changes, existing values exceeding the new maximum are automatically capped.
  - # of GCs, CHs, and Total Count: Auto-calculated, read-only.
  - **Dynamic Maximum**: The maximum is configurable in Settings Panel → General Settings → "Maximum Number of Cats"
- **Kitten Count**
  - # of LH Kittens, SH Kittens: Each must be a non-negative integer.
  - Each count is automatically capped at the maximum cats setting (default: 450).
  - When the maximum cats setting changes, existing values exceeding the new maximum are automatically capped.
  - Total Count: Auto-calculated, read-only.
  - **Dynamic Maximum**: The maximum is configurable in Settings Panel → General Settings → "Maximum Number of Cats"
- **Premiership Counts**
  - # of LH GPs, SH GPs, LH PRs, SH PRs, LH NOVs, SH NOVs: Each must be a non-negative integer.
  - Each count is automatically capped at the maximum cats setting (default: 450).
  - When the maximum cats setting changes, existing values exceeding the new maximum are automatically capped.
  - # of GPs, PRs, and Total Count: Auto-calculated, read-only.
  - **Dynamic Maximum**: The maximum is configurable in Settings Panel → General Settings → "Maximum Number of Cats"

## Household Pet Count
- **# of Household Pets**
  - Required. Must be a non-negative integer.
  - Automatically capped at the maximum cats setting (default: 450).
  - When the maximum cats setting changes, existing values exceeding the new maximum are automatically capped.
  - No longhair/shorthair split; single total only.
  - Default is 0.
  - **Dynamic Maximum**: The maximum is configurable in Settings Panel → General Settings → "Maximum Number of Cats"

## Additional Rules
- **Required Field Indicators**
  - All required fields are marked with a red asterisk (*).
- **Error Display**
  - Errors are shown inline, next to the relevant field.
- **Focus-Based Helper Text**
  - Helper text appears when focusing on a field, if there is no error.
- **Auto-Indexing**
  - Judge numbers are automatically re-indexed when judges are added or removed.
- **Dynamic Validation**
  - When the maximum cats setting changes, all show count fields are automatically re-validated.
  - Values exceeding the new maximum are automatically capped to the new maximum.
  - Only values that exceed the new maximum are modified; values within the new limit remain unchanged.

## Last Updated
- 2024-12-19

## Shared CSV Action Buttons

- The following action buttons are present on all tabs (General, Championship, Kittens, Premiership, Household Pet):
  - Save to CSV
  - Load from CSV
  - Reset
- These buttons always operate on the full dataset (all tabs), not just the current tab.
- The logic for these buttons is shared and implemented in `src/utils/formActions.ts`. 