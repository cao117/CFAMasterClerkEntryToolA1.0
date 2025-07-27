# Breed Sheets Tab Validation Rules

## Overview

The Breed Sheets tab allows master clerks to enter Best of Breed (BoB), 2nd Best of Breed (2BoB), Best CH (Championship only), and Best PR (Premiership only) awards for each breed by judge. This document outlines all validation rules, error types, and logic specific to this tab.

## Tab Structure

### Group and Hair Length Selection
- **Group Switch**: Championship, Premiership, Kitten
- **Hair Length Switch**: Longhair, Shorthair
- **Visibility Logic**: Groups and hair length sections are shown based on show counts and judge ring type

### Input Fields
- **Best of Breed (BoB)**: Cat # for Best of Breed award
- **2nd Best of Breed (2BoB)**: Cat # for 2nd Best of Breed award  
- **Best CH**: Cat # for Best Championship award (Championship group only)
- **Best PR**: Cat # for Best Premiership award (Premiership group only)

## Visibility Rules

### Group Visibility
A group (Championship, Premiership, Kitten) button appears only if:
- **Championship**: `(LH GC + LH CH + LH NOV) + (SH GC + SH CH + SH NOV)` > 0
- **Premiership**: `(LH GP + LH PR + LH NOV) + (SH GP + SH PR + SH NOV)` > 0
- **Kitten**: `(LH Kittens + SH Kittens)` > 0

### Hair Length Visibility
Hair length sections (LH/SH) appear based on judge ring type and show counts:

#### Allbreed (AB) and Double Specialty (DBSP) Rings
- **LH Section**: Appears if `LH count for selected group` > 0
- **SH Section**: Appears if `SH count for selected group` > 0

#### Longhair (LH) Rings
- **LH Section Only**: Appears if `LH count for selected group` > 0
- **SH Section**: Never appears

#### Shorthair (SH) Rings  
- **SH Section Only**: Appears if `SH count for selected group` > 0
- **LH Section**: Never appears

### NOV Count Inclusion
For Championship and Premiership groups, NOV cats are included in visibility calculations because they can receive BoB and 2BoB awards, even though they cannot receive Best CH or Best PR awards.

## Input Validation Rules

### Cat Number Validation
- **Valid Range**: 1-450
- **VOID Support**: Input can be "VOID" (case-insensitive)
- **Format**: Numeric only (except for VOID)
- **Auto-completion**: Typing "v" or "V" auto-completes to "VOID"

### Sequential Entry Requirements
- **2BoB cannot be filled before BoB**: Must fill Best of Breed before entering 2nd Best of Breed
- **Best CH/PR cannot be filled before BoB**: Must fill Best of Breed before entering Best CH (Championship) or Best PR (Premiership)
- **Kitten group**: No sequential requirements for Best CH/PR (not applicable)

### Duplicate Prevention
- **Scope**: Within the same judge-group-hair length combination
- **Rule**: No duplicate cat numbers within the same view across all fields (BoB, 2BoB, Best CH, Best PR)
- **Example**: If cat #123 is entered as BoB for Persian, it cannot be entered as 2BoB, Best CH, or Best PR for any breed in the same view

### BoB and 2BoB Validation
- **Same cat prevention**: BoB and 2BoB cannot be the same cat number
- **Error display**: Error shown on 2BoB field when same cat is entered

### Input Persistence
- **Separate Storage**: Each judge-group-hair length combination has its own data storage
- **Data Retention**: Switching between groups/hair lengths preserves existing input values
- **Example**: Data entered in Ch-LH is separate from Ch-SH, Pr-LH, etc.

## Breed List Management

### Dynamic Breed Lists
- **Source**: Settings panel breed lists (LH breeds and SH breeds)
- **Integration**: Changes in Settings immediately reflect in Breed Sheets tab
- **Sorting**: Breeds are automatically sorted alphabetically

### Breed Addition/Removal
- **Addition**: New breeds are inserted in alphabetical order
- **Removal**: Deleted breeds are removed from all views
- **Data Preservation**: Existing input values are preserved when breeds are modified

### Search Functionality
- **Real-time Filtering**: Breed names can be filtered by typing in search box
- **Case-insensitive**: Search works regardless of case
- **Dynamic Updates**: Filtered results update as user types

## Error Types and Messages

### Format Error
- **Trigger**: Cat number outside 1-450 range (excluding VOID)
- **Message**: "Cat number must be between 1-450 or VOID"
- **Precedence**: Highest priority

### Duplicate Error
- **Trigger**: Same cat number entered multiple times in same view across all fields
- **Message**: "Duplicate cat number within this view"
- **Precedence**: Second priority

### Sequential Entry Error
- **Trigger**: 2BoB filled before BoB, or Best CH/PR filled before BoB
- **Message**: 
  - "You must fill Best of Breed before entering 2nd Best of Breed"
  - "You must fill Best of Breed before entering Best CH/PR"
- **Precedence**: Third priority

### BoB/2BoB Same Cat Error
- **Trigger**: BoB and 2BoB are the same cat number
- **Message**: "Best of Breed and 2nd Best of Breed cannot be the same cat"
- **Precedence**: Fourth priority

### VOID Handling
- **Input**: "v" or "V" auto-completes to "VOID"
- **Validation**: VOID is always valid
- **Display**: VOID inputs are visually distinguished (grayed out, strikethrough)

## UI/UX Features

### Judge Selection
- **Left Panel**: Scrollable judge list with ring information
- **Display Format**: "Ring {id} • {initials} • {abbreviation}"
- **Selection Indicator**: Visual feedback for selected judge

### Control Panel
- **Group Switch**: Animated buttons for Championship/Premiership/Kitten
- **Hair Length Switch**: Animated buttons for Longhair/Shorthair
- **Connector Animation**: Visual effect showing relationship between switches
- **Search Box**: Real-time breed filtering

### Layout
- **Three-Column Grid**: Breed list displayed in 3 columns for space efficiency
- **Right-Aligned Inputs**: Input boxes aligned to the right side of each row
- **Top-Aligned Text**: Breed names and input labels aligned at the top
- **Error Display**: Error messages shown below input fields in red text
- **Error Styling**: Invalid inputs have red border and background
- **VOID Styling**: VOID inputs are grayed out with strikethrough
- **Responsive Design**: Adapts to different screen sizes

## State Management

### Data Structure
```typescript
type BreedSheetsTabData = {
  selectedJudgeId: number | null;
  selectedGroup: 'Championship' | 'Premiership' | 'Kitten';
  selectedHairLength: 'Longhair' | 'Shorthair';
  breedEntries: {
    [judgeId: string]: {
      [groupHairLengthKey: string]: {
        [breedKey: string]: {
          bob: string;
          secondBest: string;
          bestCH?: string;
          bestPR?: string;
        }
      }
    }
  };
  errors: { [key: string]: string };
  pingTriggered: boolean;
};
```

### Key Functions
- `createGroupHairLengthKey()`: Creates unique key for judge-group-hair length combination
- `updateBreedEntry()`: Updates specific breed entry field
- `getBreedEntryValue()`: Retrieves specific breed entry value
- `getFilteredBreeds()`: Filters breed list based on search term

## Integration Points

### Settings Panel
- **Breed Lists**: LH and SH breed lists are managed in Settings
- **Global State**: Breed lists are stored in global settings state
- **Real-time Updates**: Changes in Settings immediately affect Breed Sheets

### CSV Export/Import
- **Export**: All breed sheet data is included in CSV export
- **Import**: Breed sheet data can be restored from CSV
- **Structure**: Data is exported in a format that preserves all relationships

### Other Tabs
- **General Tab**: Provides judge information and show counts
- **Championship/Premiership Tabs**: Share validation patterns but are independent
- **State Persistence**: Data persists across tab switches 