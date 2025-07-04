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
  - Required. Must be between 1 and 12 (inclusive).
  - Setting to 0 clears all judges.
  - Setting above 12 is capped at 12.
  - Setting below 0 is capped at 0.

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
  - Must be one of: Longhair, Shorthair, Allbreed, Double Specialty.

## Championship, Kitten, and Premiership Counts
- **Championship Counts**
  - # of GCs, LH CHs, SH CHs, NOVs: Each must be a non-negative integer.
  - # of CHs and Total Count: Auto-calculated, read-only.
- **Kitten Count**
  - Must be a non-negative integer.
- **Premiership Counts**
  - # of GCs, LH PRs, SH PRs, NOVs: Each must be a non-negative integer.
  - # of PRs and Total Count: Auto-calculated, read-only.

## Household Pet Count
- **# of Household Pets**
  - Required. Must be a non-negative integer.
  - No longhair/shorthair split; single total only.
  - Default is 0.

## Additional Rules
- **Required Field Indicators**
  - All required fields are marked with a red asterisk (*).
- **Error Display**
  - Errors are shown inline, next to the relevant field.
- **Focus-Based Helper Text**
  - Helper text appears when focusing on a field, if there is no error.
- **Auto-Indexing**
  - Judge numbers are automatically re-indexed when judges are added or removed.

## Last Updated
- 2024-06-09

## Shared CSV Action Buttons

- The following action buttons are present on all tabs (General, Championship, Kittens, Premiership, Household Pet):
  - Save to CSV
  - Load from CSV
  - Reset
- These buttons always operate on the full dataset (all tabs), not just the current tab.
- The logic for these buttons is shared and implemented in `src/utils/formActions.ts`. 