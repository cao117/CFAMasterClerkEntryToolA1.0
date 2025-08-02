# CFA Master Clerk Entry Tool – Project Overview

## Table of Contents
1. [Project Purpose](#project-purpose)
2. [User Interface Overview](#user-interface-overview)
   - [Tab Structure](#tab-structure)
3. [Dynamic Tab & Column Generation: Mapping from General Tab to Finals Tabs](#dynamic-tab--column-generation-mapping-from-general-tab-to-finals-tabs)
4. [Field & Data Definitions](#field--data-definitions)
   - [General Information Fields](#general-information-fields)
   - [Judge Fields](#judge-fields)
   - [Championship Tab Fields](#championship-tab-fields)
   - [Premiership Tab Fields](#premiership-tab-fields)
   - [Breed Sheets Tab Fields](#breed-sheets-tab-fields)
5. [Award Assignment & Validation Rules](#award-assignment--validation-rules)
6. [Validation Error Types & Logic](#validation-error-types--logic)
7. [Voiding Logic](#voiding-logic)
8. [State Management & Persistence](#state-management--persistence)
9. [UI/UX Features](#uiux-features)
10. [Action Buttons & Workflow](#action-buttons--workflow)
11. [CSV Export/Import](#csv-exportimport)
12. [Technical Notes & Changelog](#technical-notes--changelog)

---

## Project Purpose

The CFA Master Clerk Entry Tool is a professional data management application for CFA cat shows. It enables master clerks to efficiently enter, validate, and export show results for Championship, Premiership, and (future) Kitten finals, ensuring strict adherence to CFA rules and providing robust error handling, state persistence, and a user-friendly interface.

---

## User Interface Overview

### Tab Structure
- **General Tab**: Enter show details (date, club, master clerk), judge information, and cat counts for each class.
- **Championship Tab**: Enter and validate Championship Final (Top 10/15), Best AB CH, Best LH CH, and Best SH CH awards for each judge/ring.
- **Premiership Tab**: Enter and validate Premiership Final (Top 10/15), Best AB PR, Best LH PR, and Best SH PR awards for each judge/ring.
- **Breed Sheets Tab**: Enter Best of Breed (BoB), 2nd Best of Breed (2BoB), Best CH (Championship only), and Best PR (Premiership only) awards for each breed by judge, with dynamic breed list management and search functionality.
- **Kitten Tab**: (Coming soon) For Kitten finals.

Tabs are enabled only when all required information is entered in the General tab.

---

## Dynamic Tab & Column Generation: Mapping from General Tab to Finals Tabs

The columns in the Championship and Premiership tabs are generated dynamically based on the judges and their ring types entered in the General tab. This ensures the tool matches CFA show logistics and judging rules.

### Mapping Rules

| Judge Ring Type      | Columns Created in Finals Tabs         | Column Label(s)         |
|----------------------|----------------------------------------|-------------------------|
| Allbreed             | 1 column                               | Allbreed                |
| Longhair             | 1 column                               | Longhair                |
| Shorthair            | 1 column                               | Shorthair               |
| Double Specialty     | 2 columns (one LH, one SH)             | Longhair, Shorthair     |
| Super Specialty      | 3 columns (LH, SH, AB)                 | Longhair, Shorthair, Allbreed |
| OCP Ring             | 2 columns (AB, OCP)                     | Allbreed, OCP           |

- **Double Specialty**: Each judge with this ring type is split into two columns—one for Longhair, one for Shorthair—because CFA rules require these to be judged and awarded separately.

#### Example Mapping

Suppose the General tab has the following judges:

| Judge Name | Ring Number | Acronym | Ring Type         |
|------------|---------|-------------------|
| Smith      | 1       | SM      | Allbreed          |
| Jones      | 2       | JN      | Double Specialty  |
| Lee        | 3       | LE      | Shorthair         |
| Brown      | 4       | BR      | Super Specialty   |
| Wilson     | 5       | WL      | OCP Ring          |

**Resulting columns in Championship/Premiership tabs:**

| Column  | Label      | Judge Acronym | Ring Type   |
|---------|------------|---------------|-------------|
| 1       | Allbreed   | SM            | Allbreed    |
| 2       | Longhair   | JN            | Double Spec |
| 3       | Shorthair  | JN            | Double Spec |
| 4       | Shorthair  | LE            | Shorthair   |
| 5       | Longhair   | BR            | Super Spec  |
| 6       | Shorthair  | BR            | Super Spec  |
| 7       | Allbreed   | BR            | Super Spec  |
| 8       | Allbreed   | WL            | OCP Ring    |
| 9       | OCP        | WL            | OCP Ring    |

- The "Double Specialty" judge (JN) appears as two columns: one for Longhair, one for Shorthair.
- The "Super Specialty" judge (BR) appears as three columns: one for Longhair, one for Shorthair, and one for Allbreed.
- The "OCP Ring" judge (WL) appears as two columns: one for Allbreed, one for OCP.

#### Column Labeling

- Each column is labeled with the ring number, judge acronym, and specialty (e.g., "Ring 2 - JN - Longhair").
- The order of columns matches the order of judges in the General tab, with Double Specialty judges split into two consecutive columns.

#### Background: Why Double Specialty, Super Specialty, and OCP Ring Judges Create Multiple Columns

- In CFA shows, a "Double Specialty" ring means the judge awards Longhair and Shorthair finals separately, as if they were two distinct rings.
- A "Super Specialty" ring means the judge awards Longhair, Shorthair, and Allbreed finals separately, as if they were three distinct rings.
- An "OCP Ring" means the judge awards Allbreed and OCP finals separately, as if they were two distinct rings.
- Therefore, the tool must provide separate columns for each specialty, ensuring that awards and validation are handled independently for each specialty.

---

## Field & Data Definitions

### General Information Fields
- **Show Date**: Date of the show (YYYY-MM-DD).
- **Club Name**: Name of the hosting club (max 255 chars).
- **Master Clerk**: Name of the master clerk (max 120 chars).
- **Number of Judges**: Total number of judges/rings.
- **Championship Counts**: Number of GCs, CHs, NOVs, and totals (auto-calculated).
- **Kitten Counts**: Number of LH kittens, SH kittens, and totals (auto-calculated).
- **Premiership Counts**: Number of GPs, PRs, NOVs, and totals (auto-calculated).
- **Household Pet Count**: Number of household pets (auto-calculated).

### Judge Fields
- **Name**: Judge's full name (max 120 chars, unique).
- **Acronym**: Judge's acronym (max 6 chars, unique).
- **Ring Type**: One of: Allbreed, Longhair, Shorthair, Double Specialty, Super Specialty.

### Championship Tab Fields
- **Show Awards (Top 10/15)**: Cat # and status (GC, CH, NOV) for each placement per judge/ring.
- **Best AB CH**: Cat # for Best Allbreed Champions (3 or 5, depending on breakpoint).
- **Best LH CH**: Cat # for Best Longhair Champions (3 or 5).
- **Best SH CH**: Cat # for Best Shorthair Champions (3 or 5).
- **Voided**: Checkbox to mark an award as voided (award given but not received by cat).

### Premiership Tab Fields
- **Show Awards (Top 10/15)**: Cat # and status (GP, PR, NOV) for each placement per judge/ring.
- **Best AB PR**: Cat # for Best Allbreed Premiers (3 or 5).
- **Best LH PR**: Cat # for Best Longhair Premiers (3 or 5).
- **Best SH PR**: Cat # for Best Shorthair Premiers (3 or 5).
- **Voided**: Checkbox to mark an award as voided.

### Kitten Tab Fields
- **Show Awards (Top 10/15)**: Cat # and status (KIT) for each placement per judge/ring.
  - **Note:** Empty rows are allowed and do not trigger errors. Only filled rows require status 'KIT'.

### Household Pet Tab Fields
- **Show Awards (Top 10/15)**: Cat # and status (HHP) for each placement per judge/ring.
  - **Note:** Empty rows are allowed and do not trigger errors. Only filled rows require status 'HHP'.

### Breed Sheets Tab Fields
- **Best of Breed (BoB)**: Cat # for Best of Breed award for each breed per judge/ring.
- **2nd Best of Breed (2BoB)**: Cat # for 2nd Best of Breed award for each breed per judge/ring.
- **Best CH**: Cat # for Best Championship award (Championship group only).
- **Best PR**: Cat # for Best Premiership award (Premiership group only).
- **Breed List Management**: Dynamic breed lists from Settings panel, with automatic updates when breeds are added/removed.
- **Search Functionality**: Real-time breed name filtering for improved usability.
- **Group and Hair Length Selection**: Switch-based navigation between Championship/Premiership/Kitten groups and Longhair/Shorthair sections.
- **Input Persistence**: Separate storage for each judge-group-hair length combination to maintain data when switching views.

---

## Award Assignment & Validation Rules

### Championship Tab Rules
- **Breakpoints**:
  - Allbreed: If (LH GC + SH GC + LH CH + SH CH) ≥ 85, use Top 15/5 Best; else Top 10/3 Best.
  - Longhair: If (LH GC + LH CH) ≥ 85, use Top 15/5 Best; else Top 10/3 Best.
  - Shorthair: If (SH GC + SH CH) ≥ 85, use Top 15/5 Best; else Top 10/3 Best.
- **Show Awards**:
  - Cat # must be 1-{max_cats}.
  - Status: GC, CH, or NOV.
  - No duplicates within a column.
  - Must fill positions sequentially (no skipping).
- **Best AB/LH/SH CH**:
  - Cat # must be 1-{max_cats}.
  - No duplicates within a section.
  - Must fill positions sequentially.
  - Only cats NOT listed as GC or NOV in Show Awards are eligible.
  - Best AB CH must match CH cats from Show Awards in order (if any CHs exist in Top 10/15).
  - Each Best AB CH must be assigned to either LH or SH section (reminder if not).
  - Best LH/SH CH must match order from Best AB CH (if present), and only include eligible cats.
- **Error Precedence** (per cell):
  1. Duplicate error
  2. Status error (GC/NOV)
  3. Sequential entry error
  4. Order error
  5. Assignment reminder
- **Voiding**: Voiding a cat number in any cell in a column voids all other cells in that column with the same cat number (across all sections).

### Premiership Tab Rules
- **Breakpoints**:
  - Allbreed: If (GP + PR + NOV) ≥ 85, use Top 15/5 Best; else Top 10/3 Best.
  - Longhair: If (LH PR + GP) ≥ 85, use Top 15/5 Best; else Top 10/3 Best.
  - Shorthair: If (SH PR + GP) ≥ 85, use Top 15/5 Best; else Top 10/3 Best.
- **Show Awards**:
  - Cat # must be 1-{max_cats}.
  - Status: GP, PR, or NOV.
  - No duplicates within a column.
  - Must fill positions sequentially.
- **Best AB/LH/SH PR**:
  - Cat # must be 1-{max_cats}.
  - No duplicates within a section.
  - Must fill positions sequentially.
  - Only cats NOT listed as GP or NOV in Show Awards are eligible.
  - Best AB PR must match PR cats from Show Awards in order (if any PRs exist in Top 10/15).
  - Each Best AB PR must be assigned to either LH or SH section (reminder if not).
  - Best LH/SH PR must match order from Best AB PR (if present), and only include eligible cats.
- **Error Precedence** (per cell):
  1. Duplicate error
  2. Status error (GP/NOV)
  3. Sequential entry error
  4. Order error
  5. Assignment reminder
- **Voiding**: Voiding a cat number in any cell in a column voids all other cells in that column with the same cat number (across all sections).

### Breed Sheets Tab Rules
- **Visibility Logic**:
  - **Group Visibility**: A group (Championship, Premiership, Kitten) is shown only if its total count (LH + SH) for that group is greater than 0.
  - **Hair Length Visibility**: 
    - For Allbreed (AB) and Double Specialty (DBSP) rings: Both LH and SH sections appear if their respective counts for the selected group are greater than 0.
    - For Longhair (LH) rings: Only LH section appears if its count for the selected group is greater than 0.
    - For Shorthair (SH) rings: Only SH section appears if its count for the selected group is greater than 0.
  - **NOV Count Inclusion**: For Championship and Premiership groups, NOV cats are included in visibility calculations as they can receive BoB and 2BoB awards.
- **Input Validation**:
  - Cat # must be 1-{max_cats} or VOID.
  - No duplicates within the same judge-group-hair length combination.
  - Input values persist separately for each judge-group-hair length combination.
- **Breed List Management**:
  - Breed lists are dynamically loaded from Settings panel.
  - Changes to breed lists in Settings are immediately reflected in Breed Sheets tab.
  - Breeds are automatically sorted alphabetically.
  - Existing input values are preserved when breeds are added/removed.

### General Validation Rules
- All required fields in General tab must be filled before other tabs are enabled.
- Judge names and acronyms must be unique and within length limits.
- All counts are auto-calculated for consistency.
- All validation errors are shown inline, with only the highest-precedence error per cell.

---

## Validation Error Types & Logic

This section defines all validation error types used in the Championship and Premiership tabs, explains how each is checked, and clarifies the order (precedence) in which errors are displayed. This ensures that anyone reading this document—human or LLM—can fully reconstruct the validation logic and user experience.

### Error Precedence (Order of Validation)
For every input cell, **only the highest-precedence error is shown**. The order is:
1. **Duplicate Error**
2. **Status Error** (GC/NOV/GP/PR eligibility)
3. **Sequential Entry Error**
4. **Order Error**
5. **Assignment Reminder**
6. **Format Error** (cat number range)
7. **Voiding Error**
8. **General/Other Errors**

If a higher-precedence error is present, lower-precedence errors/reminders are suppressed for that cell.

### Error Type Definitions & Logic

#### 1. Duplicate Error
- **Definition:** The same cat number appears more than once within the same section (e.g., within a single column's Show Awards, Best AB CH, Best LH CH, or Best SH CH).
- **How Checked:** On every entry, the tool checks if the cat number already exists in the same section/column.
- **Example:**
  - If cat #101 is entered twice in the Top 10/15 for Ring 1, the second entry will show a duplicate error.
- **Error Message:**
  - "Duplicate cat number within this column"

#### 2. Status Error (Eligibility Error)
- **Definition:** A cat is entered in a section where its status (GC, CH, NOV, GP, PR) makes it ineligible.
- **How Checked:**
  - For Best AB/LH/SH CH: Only cats NOT listed as GC or NOV in Show Awards are eligible.
  - For Best AB/LH/SH PR: Only cats NOT listed as GP or NOV in Show Awards are eligible.
- **Example:**
  - Cat #201 is listed as GC in Show Awards but entered in Best AB CH. This triggers a status error.
- **Error Message:**
  - "201 is listed as a GC in Show Awards and cannot be awarded CH final."

#### 3. Sequential Entry Error
- **Definition:** A position is filled while a previous position is left empty (no skipping allowed).
- **How Checked:**
  - The tool checks that all previous positions in a section are filled before allowing entry in a later position.
- **Example:**
  - If position 2 is filled but position 1 is empty, a sequential entry error appears in position 2.
- **Error Message:**
  - "You must fill in previous empty award placements before entering this position."

#### 4. Order Error
- **Definition:** The order of entries does not match the required order (e.g., Best AB CH must match the order of CH cats from Show Awards).
- **How Checked:**
  - For Best AB CH/PR: Must match the order of CH/PR cats from Show Awards (if any exist).
  - For Best LH/SH CH/PR: Must match the order from Best AB CH/PR (if present).
- **Example:**
  - If the 1st Best AB CH is not the same as the 1st CH in Show Awards, an order error appears.
- **Error Message:**
  - "Must be 402 (1st CH required by CFA rules)"

#### 5. Assignment Reminder
- **Definition:** A cat entered in Best AB CH/PR is not assigned to either LH or SH section.
- **How Checked:**
  - For every filled Best AB CH/PR cell, if the cat is not present in either LH or SH section, a reminder is shown (unless a higher-precedence error is present).
- **Example:**
  - Cat #301 is entered in Best AB CH but not in LH or SH CH. A reminder appears in the Best AB CH cell.
- **Error Message:**
  - "301 needs to be assigned to either LH or SH CH final."

#### 6. Format Error (Cat Number Range)
- **Definition:** Cat number is not within the valid range (1-{max_cats}).
- **How Checked:**
  - On every entry, the tool checks if the cat number is a valid integer between 1 and {max_cats}.
- **Example:**
  - Cat #999 is entered. A format error appears.
- **Error Message:**
  - "Cat number must be between 1-{max_cats}"

#### 7. Voiding Error (Voiding Logic)
- **Definition:** Not an error per se, but voiding a cat number in any cell in a column voids all other cells in that column with the same cat number (across all sections). Unvoiding is synchronized as well.
- **How Checked:**
  - When a void checkbox is toggled, all matching cat numbers in the same column are voided/unvoided.
- **Example:**
  - Cat #401 is voided in Best AB CH in Ring 2. All other cells in Ring 2 with cat #401 are also voided.
- **Error Message:**
  - (No error message; voided cells are visually distinct.)

#### 8. General/Other Errors
- **Definition:** Any other error not covered above (e.g., missing required fields, invalid judge info).
- **How Checked:**
  - General tab: All required fields must be filled, judge names/acronyms must be unique and within length limits.
- **Example:**
  - Two judges have the same acronym. An error appears in the General tab.
- **Error Message:**
  - "Judge acronyms must be unique."

### Error Types Table

| Error Type         | Where It Appears                | Example Scenario                                         | Example Error Message                                      |
|--------------------|----------------------------------|----------------------------------------------------------|------------------------------------------------------------|
| Duplicate          | Any section/column               | Cat #101 entered twice in Top 10/15                      | Duplicate cat number within this column                    |
| Status (Eligibility)| Best AB/LH/SH CH/PR             | Cat #201 (GC) in Best AB CH                              | 201 is listed as a GC in Show Awards and cannot be awarded CH final. |
| Sequential Entry   | Any section/column               | Position 2 filled, position 1 empty                      | You must fill in previous empty award placements before entering this position. |
| Order              | Best AB/LH/SH CH/PR              | 1st Best AB CH not matching 1st CH in Show Awards        | Must be 402 (1st CH required by CFA rules)                 |
| Assignment Reminder| Best AB CH/PR                    | Cat #301 in Best AB CH not assigned to LH/SH             | 301 needs to be assigned to either LH or SH CH final.      |
| Format             | Any section/column               | Cat #999 entered                                         | Cat number must be between 1-{max_cats}                           |
| Voiding            | Any section/column               | Cat #401 voided in any cell                              | (No error message; cell is voided)                         |
| General/Other      | General tab                      | Duplicate judge acronym                                  | Judge acronyms must be unique.                             |

### Notes
- **Only the highest-precedence error is shown per cell.**
- **Reminders** (assignment) are only shown if no higher-precedence error is present.
- **Voided cells** are visually distinct and participate in validation as normal.
- **All validation logic is strictly enforced and matches CFA rules.**

### References
- For full details and edge cases, see:
  - [docs/validation/VALIDATION_CHAMPIONSHIP.md](./validation/VALIDATION_CHAMPIONSHIP.md)
  - [docs/validation/VALIDATION_PREMIERSHIP.md](./validation/VALIDATION_PREMIERSHIP.md)
  - [docs/validation/VALIDATION_GENERAL.md](./validation/VALIDATION_GENERAL.md)

---

## Voiding Logic
- If a cat number is voided in any cell in a given column (ring), all other cells in that column with the same cat number (across all award sections) are also voided automatically.
- Unvoiding any of these cells unvoids all instances in that column.
- Voided cells are visually distinct and participate in validation as normal.

---

## State Management & Persistence

The application uses React state management with localStorage persistence for settings and auto-save functionality. Form data is automatically saved to prevent data loss, with configurable save intervals and file rotation.

### Auto-Save System
- **Auto-Save**: Configurable frequency (1-60 minutes, default: 5 minutes) with rotating file management
- **Recent Save**: Automatic saves every 15 seconds for immediate protection
- **Empty Form Detection**: Prevents unnecessary saves when no user input exists across any visible tabs
- **Platform Aware**: Uses appropriate storage method (localStorage for browser, file system for Tauri)
- **Visual Indicators**: Shows auto-save status with notification bar

### Recent Work Resume System
- **Automatic Detection**: Detects recent work within 24 hours of the last save
- **Startup Modal**: Presents resume option when returning to the application
- **Seamless Integration**: Uses existing Recent Save infrastructure for data storage
- **One-Click Restoration**: Provides instant resume functionality with existing Excel parsing
- **Work Continuity**: Ensures seamless work continuity across browser sessions and page refreshes

---

## UI/UX Features
- **Dynamic Columns:**  
  The number and type of columns in the Championship and Premiership tabs are generated dynamically based on the judges and their ring types from the General tab.  
  - Each judge/ring is represented as a column.
  - Double Specialty judges are split into two columns (Longhair and Shorthair).
  - The UI updates in real time as judges are added/edited in the General tab.
- **Column Headers:**  
  - Each column header displays the ring number, judge acronym, and specialty.  
  - Example: "Ring 2 - JN - Longhair"
- **Tab Navigation:**  
  - Tabs for General, Championship, Premiership, and Kitten (future).
  - Tabs are enabled only when all required General tab fields are filled.
- **Other UI Features:**  
  (as previously documented: sticky headers, jump to ring, frozen columns, etc.)

#### Example Scenario

If you have 2 Allbreed judges and 1 Double Specialty judge, the Championship and Premiership tabs will display **4 columns**:
- Ring 1 - [Acronym1] - Allbreed
- Ring 2 - [Acronym2] - Allbreed
- Ring 3 - [Acronym3] - Longhair (Double Specialty)
- Ring 4 - [Acronym3] - Shorthair (Double Specialty)

## UI/UX: Main Tab Bar Redesign (2024-04)

The main navigation tab bar (General, Championship, Kittens, Premiership, Household Pet) has been redesigned for a premium, business-class look:
- Dark, semi-transparent background (CFA-branded)
- Subtle CFA gold border at the bottom
- Modern, bold font and minimal, outline-style icons for each tab
- Active tab: gold underline, gold text, and subtle gold glow
- Inactive tabs: muted color, gold hover underline
- Smooth transitions and professional spacing

This design matches the premium style of the SettingsPanel and ensures a cohesive, high-class user experience throughout the application.

## UI/UX: Show Count Section Redesign (2024-12-19)

The Show Count section in the General tab has been redesigned with a clean two-color alternating system:
- **Two-color system**: Alternating emerald/green and purple/pink color themes across all four sections
- **Championship Count**: Emerald/Green theme (professional, growth-oriented) - avoids conflict with Show Information section above
- **Kitten Count**: Purple/Pink theme (vibrant, engaging design)
- **Premiership Count**: Emerald/Green theme (alternating back to first color)
- **Household Pet Count**: Purple/Pink theme (alternating back to second color)
- **Label consistency**: All sections use "Total Count:" label for uniform appearance
- **Perfect alignment**: Standardized label width ensures horizontal alignment across all sections
- **Professional appearance**: Reduces visual noise while maintaining clear section distinction

## Action Buttons & Workflow

The following action buttons are present in the Championship and Premiership tabs (and, where relevant, the General tab). These buttons are essential for data management, validation, and workflow completion:

### Championship & Premiership Tabs

- **Save to Excel**
  - **Purpose:** Exports the current tab's data to an Excel file for backup, review, or official submission.
  - **Validation:** Runs full validation before export. If any errors are present, export is blocked and the user is notified to fix errors.
  - **Location:** Bottom of Championship and Premiership tabs.

- **Load from Excel**
  - **Purpose:** Imports data from a previously saved Excel file, restoring all fields and voids for the current tab with environment-aware file selection.
  - **Environment Support:** Automatically detects runtime environment (Tauri desktop apps or web browsers) and uses appropriate file picker.
  - **Validation:** Imported data is validated upon load. Any errors are shown inline.
  - **Location:** Bottom of Championship and Premiership tabs.

- **Reset**
  - **Purpose:** Clears all data for the current tab (Championship or Premiership) and resets the form to its initial state. Does not affect General tab or other tabs.
  - **Confirmation:** User is prompted to confirm before data is cleared.
  - **Location:** Bottom of Championship and Premiership tabs.

### General Tab

- **Save to Excel**: Exports validated data for submission with environment-aware file saving.
- **Load from Excel**: Imports data from a previously saved Excel file with environment-aware file selection.
- **Reset**: Clears all form data and returns to default values.
- **Fill Test Data**: Populates the form with realistic test data for development and testing purposes.

### Workflow Notes

- **Save to Excel**: Exports validated data for submission with environment-aware file saving.
- **Load from Excel**: Imports data from a previously saved Excel file with environment-aware file selection.
- **Reset**: Clears all form data and returns to default values.
- **Fill Test Data**: Populates the form with realistic test data for development and testing purposes.

### Workflow Notes
- All action buttons are placed together at the bottom of each tab for easy access.
- Validation is always performed before any export action. Only the highest-precedence error per cell is shown.
- For CSV schema and voiding logic, see `docs/specs/CSV_SCHEMA.md` and `docs/specs/CSV_EXPORT_VOID_QUESTION.md`.
- For validation rules, see the relevant validation markdowns in `docs/validation/`.

---

## Excel Export/Import
- **Save to Excel**: Exports validated data for submission with environment-aware file saving (supports Tauri desktop apps and web browsers).
- **Load from Excel**: Imports data from an Excel file, restoring all fields and voids with environment-aware file selection (supports Tauri desktop apps and web browsers).
- **Environment Detection**: Automatically detects runtime environment and uses appropriate file handling methods:
  - **Tauri Desktop Apps**: Uses native OS file picker and file system APIs
  - **Web Browsers**: Uses browser file picker and FileReader API
- CSV schema and voiding logic are documented in `docs/specs/CSV_SCHEMA.md` and `docs/specs/CSV_EXPORT_VOID_QUESTION.md`.

---

## CSV Import/Restore and UI Row Rendering (v1.26+)

- **Robust Row Mapping for All Tabs (v1.27+)**: The CSV import logic for ALL tabs (Championship, Premiership, Kitten, and Household Pet) now parses the row label (e.g., "Show Awards 3", "2nd Best AB CH") to determine the correct UI row position. This ensures that all Show Awards and Finals rows are mapped to their intended positions, even if the CSV has missing, extra, or out-of-order rows. This prevents partial or misaligned data after import.
- **CSV Import Fix (v1.28+)**: Fixed dynamic import issue in formActions.ts that was causing "parseCSVAndRestoreState is not a function" error. Now uses regular import for reliable CSV import functionality.
- **Clarification:** In the CSV, 'Show Awards 1', 'Show Awards 2', etc. are row labels for placements 1, 2, ... in the single Show Awards section. They are not separate sections—there is only one Show Awards section, followed by the finals sections (Best AB CH, Best LH CH, Best SH CH). This avoids confusion for users and developers.
- **Fixed Row Indexing Issue**: The CSV import now uses static counters to ensure that Show Awards and Finals rows are mapped to sequential UI positions (0, 1, 2, ...) regardless of CSV row gaps or order.
- **Robust Row Rendering**: All tabs (Championship, Premiership, Kitten, Household Pet) now dynamically render all Show Awards and Finals rows present in imported CSV data, regardless of the calculated breakpoint or show totals.
- **Consistent Positioning**: The number of rows shown for each column/section is the maximum of the calculated breakpoint (10/15 for Show Awards, 3/5 for Finals) and the number of rows present in the imported data for that column/section.
- **Empty Cell Handling**: Even empty cells ("-") in the CSV are now properly mapped to UI positions, ensuring all rows are rendered for visual consistency.
- **Enhanced Debug Logging**: Added comprehensive logging for CSV import operations to aid in debugging and troubleshooting.
- **Void State Parsing**: Fixed void state parsing to handle both "-v" and "- V" formats for voided cells in CSV import.
- **Kitten Tab Empty Row Handling (v1.28+)**: When importing a CSV, empty rows in the Kitten tab are allowed and do not trigger errors. Only filled rows require status 'KIT'. This ensures that a blank Kitten section in the CSV does not cause validation errors in the UI.
- **Household Pet Tab Empty Row Handling (v1.28+)**: When importing a CSV, empty rows in the Household Pet tab are allowed and do not trigger errors. Only filled rows require status 'HHP'. This ensures that a blank Household Pet section in the CSV does not cause validation errors in the UI.

---

## Technical Notes & Changelog
- All validation logic is documented in `docs/validation/VALIDATION_CHAMPIONSHIP.md` and `docs/validation/VALIDATION_PREMIERSHIP.md`.
- Error precedence, voiding, and assignment reminder logic are strictly enforced and documented.
- State management, UI/UX parity, and bug fixes are tracked in `docs/meta/CHANGELOG.md`.
- For detailed validation rule changes, see `docs/validation/VALIDATION_CHANGELOG.md`.

---

_Last updated: 2025-08-03_ 