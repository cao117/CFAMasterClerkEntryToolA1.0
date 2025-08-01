# Bug Report: Show Count Input Backspace Deletion Inconsistency

## Issue Description
All show count inputs across all tabs (except HHP -> total count) were not behaving consistently for backspace deletion. When users highlighted text and pressed backspace to delete it, the inputs should become empty, but most were converting to 0 immediately due to int parsing issues.

## Expected Behavior
1. When highlighted text gets deleted via backspace, the input should be empty (not convert to zero due to int parsing)
2. When leaving focus of an empty input (user didn't input anything), it should convert to zero

## Actual Behavior
- **HHP -> total count**: Worked correctly (empty on deletion, 0 on blur)
- **All other show count inputs**: Converted to 0 immediately on deletion, not preserving empty state

## Reproduction Steps
1. Go to any show count input (except HHP total count)
2. Type a number (e.g., "123")
3. Select all the text and press backspace to delete it
4. Expected: Input becomes empty
5. Actual: Input converts to 0 immediately

## Root Cause Analysis
The issue was in the update functions (`updateChampionshipCount`, `updatePremiershipCount`, `updateKittenCount`) which immediately converted empty strings to 0, while `updateShowData` (used by HHP total count) allowed empty strings to remain empty.

Additionally, the blur handler for kitten inputs had a field name matching issue that prevented proper conversion to 0 on blur.

## Solution Implemented
1. Modified `updateChampionshipCount`, `updatePremiershipCount`, and `updateKittenCount` to allow empty strings to remain empty (like `updateShowData`)
2. Fixed the blur handler to properly detect kitten input field names using `startsWith('kittenCounts')` instead of exact match

## Files Modified
- `src/components/GeneralTab.tsx`: Updated update functions and blur handler

## Testing Verification
User confirmed the fix works correctly:
- Backspace deletion now preserves empty state
- Blur conversion to 0 works properly for all inputs
- All show count inputs now behave consistently

## Impact
All show count inputs now have consistent backspace deletion behavior, improving user experience and data entry workflow.

## Timestamp
2024-12-19 15:30:00 