# Excel Export Schema

This document describes the structure and format of Excel files exported by the CFA Entry Tool.

## Worksheet Structure

The exported Excel file contains the following worksheets in order:

1. **Settings** - Application configuration and preferences
2. **General_Info** - Show information and judge details
3. **CH_Final** - Championship tab data
4. **PR_Final** - Premiership tab data
5. **Kitten_Final** - Kitten tab data
6. **HHP_Final** - Household Pet tab data
7. **BS_[judge_id]** - Breed Sheets (one per judge)
8. **Final Awards** - Comprehensive finals summary (NEW)

## Final Awards Worksheet

### Purpose
The Final Awards worksheet provides a consolidated view of all show awards and finals across all categories in a standardized format suitable for reporting and analysis.

### Structure
The worksheet contains the following columns:
- **Type**: Category of award (Championship Awards, Premiership Awards, Kitten Awards, Household Pet Awards)
- **Ring**: Ring number (corresponds to judge ID)
- **Ring Type**: Type of ring (Allbreed, Longhair, Shorthair, OCP)
- **Award**: Award name (Show Award 1-15, Best AB CH/PR, 2nd Best AB CH/PR, etc.)
- **Catalog Number**: Cat entry number
- **CH/PR**: Status indicator (GC/CH for Championship, GP/PR for Premiership)

### Data Organization

#### Championship Awards
- **Show Awards**: Positions 1-10 (or 1-15 if ≥85 entries)
- **Finals**: Best AB CH, 2nd Best AB CH, 3rd Best AB CH (up to 5th if ≥85 entries)
- **Finals**: Best LH CH, 2nd Best LH CH, 3rd Best LH CH (up to 5th if ≥85 entries)
- **Finals**: Best SH CH, 2nd Best SH CH, 3rd Best SH CH (up to 5th if ≥85 entries)

#### Premiership Awards
- **Show Awards**: Positions 1-10 (or 1-15 if ≥85 entries)
- **Finals**: Best AB PR, 2nd Best AB PR, 3rd Best AB PR (up to 5th if ≥85 entries)
- **Finals**: Best LH PR, 2nd Best LH PR, 3rd Best LH PR (up to 5th if ≥85 entries)
- **Finals**: Best SH PR, 2nd Best SH PR, 3rd Best SH PR (up to 5th if ≥85 entries)

#### Kitten Awards
- **Show Awards**: Positions 1-10 (or 1-15 if ≥50 entries)
- No finals sections

#### Household Pet Awards
- **Show Awards**: Positions 1-10 (or 1-15 if ≥50 entries)
- No finals sections

### Special Handling Rules

#### OCP Rings
- OCP (Open Class Premiership) rings have two columns: Allbreed and OCP
- **CH/PR Status Column**: Left empty for all OCP ring entries
- Show Awards and finals are recorded normally, but without status indicators

#### Super Specialty (SSP) Rings
- SSP rings have three columns: Longhair, Shorthair, and Allbreed
- **AB Column Behavior**: Unlike the CH_Final and PR_Final worksheets, the Final Awards worksheet includes:
  - Best LH CH/PR sections in the AB column
  - Best SH CH/PR sections in the AB column
  - This provides complete finals data across all three columns

#### Status Column Rules
- **Show Awards**: Populated with GC/CH or GP/PR status (except for OCP rings)
- **Finals Sections**: Always empty (no status indicator)
- **Kitten/Household Pet**: Status column not used

### Data Processing

1. **Ring-by-Ring Processing**: Data is extracted in the order rings appear in tabs
2. **Column Order**: Follows the column order from left to right in each tab
3. **VOID Exclusion**: Entries marked as VOID are not included
4. **Empty Cell Handling**: Empty cells are skipped, not written as blank rows
5. **Dynamic Counts**: Row counts adjust based on actual entry numbers

### Technical Implementation

#### Key Functions
- `buildFinalAwardsSection()`: Main function that builds the worksheet
- `extractFinalAwardsFromTab()`: Extracts data from each tab type
- `extractFinalsDataForColumn()`: Handles finals section extraction
- `getMaxAwardRows()`: Determines 10 vs 15 show awards based on counts
- `getFinalsRowCount()`: Determines 3 vs 5 finals based on counts

#### Data Format Compatibility
- **Championship Finals**: Stored as objects with `catNumber` property
- **Premiership Finals**: Stored as plain strings
- The extraction functions handle both formats transparently

## File Naming Convention

Excel files are named with the following pattern:
```
YYYYMMDD_HHMMSS_[clubname].xlsx
```

Where:
- YYYYMMDD: Export date
- HHMMSS: Export time
- clubname: Club name from General tab (spaces removed)

## Environment Support

The Excel export functionality supports:
- **Tauri Desktop Apps**: Native file system access
- **Modern Browsers**: File System Access API
- **Legacy Browsers**: Download fallback

## Version History

- **v1.0.0 (2025-08-15)**: Added Final Awards worksheet with comprehensive finals summary
- **v1.1.0 (2025-08-14)**: Fixed SSP ring export duplication and import AB column population
- **v1.0.0 (2025-08-14)**: Initial Excel export/import implementation