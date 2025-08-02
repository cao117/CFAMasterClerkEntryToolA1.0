
# CFA Master Clerk Entry Tool - Usage Guide

This document provides comprehensive guidance on using the CFA Master Clerk Entry Tool, including settings configuration, data entry, and CSV export/import functionality.

---

## Application Startup

The application is ready to use immediately upon launch. All file operations (Excel export/import) use platform-appropriate methods automatically without requiring manual directory configuration.
### Platform-Specific Behavior

**Tauri Desktop Apps:**
- Uses native OS file dialogs for Excel export/import
- Full file system access with automatic file handling
- **Auto-save**: Creates actual Excel files in AppData directory with 3-file rotation

**Web Browsers:**
- Uses File System Access API where supported for Excel operations
- Fallback to download/upload methods for unsupported browsers
- **Auto-save**: Stores Excel files as base64 in localStorage with 3-file rotation

### Auto-Save System

The application now includes automatic saving functionality that works transparently in the background:

**Auto-Save Features:**
- **Automatic Operation**: Saves form data every 5 minutes automatically
- **Rotating Files**: Maintains 3 auto-save files, overwriting oldest when limit reached
- **Platform Aware**: Uses appropriate storage method based on environment
- **Real-time Updates**: Monitors form changes and saves current state
- **Visual Indicators**: Shows auto-save status with simplified notification bar

**Auto-Save File Locations:**
- **Desktop (Tauri)**: `%APPDATA%/com.cfa.masterclerk.entry/autosave1.xlsx`, `autosave2.xlsx`, `autosave3.xlsx`
- **Browser**: localStorage keys `cfa_autosave1`, `cfa_autosave2`, `cfa_autosave3`

**Auto-Save Behavior:**
- Starts timer automatically when form has data
- Timer runs based on user-configured Save Cycle setting (1-60 minutes)
- First auto-save occurs only after the full save cycle interval is reached
- Cycles through files: autosave1 → autosave2 → autosave3 → autosave1 (repeat)
- Creates complete Excel files identical to manual "Save to Excel"
- No user intervention required - runs transparently in background

---

## Settings Panel Configuration

### Maximum Number of Judges Setting
- **Location**: Settings Panel → General Settings → "Maximum Number of Judges"
- **Purpose**: Controls the maximum number of judges that can be assigned in the General Information tab
- **Default Value**: 12 judges
- **Range**: 1-24 judges (hard cap enforced)
- **Hard Cap Enforcement**: Values are automatically capped at 24 during input, blur, and restore operations
- **Dynamic Behavior**: 
  - When changed, immediately affects the "Number of Judges" field in General Information tab
  - If current number of judges exceeds the new maximum, the General tab will automatically cap the value
  - All validation messages and input limits update dynamically
- **Validation**: Validation occurs ONLY in these three cases:
  - **Case 1**: You finish input and move focus outside the input box (blur event)
  - **Case 2**: You click the built-in spinner down arrow (ArrowDown key)
  - **Case 3**: You click the save settings button
  - All editing actions (clearing, typing, etc.) are allowed without validation during editing
  - Empty field automatically becomes 1 when you leave the field
  - An error modal will appear asking you to reduce the judge count in the General Information tab first

### Maximum Number of Cats Setting
- **Location**: Settings Panel → General Settings → "Maximum Number of Cats"
- **Purpose**: Controls the maximum cat number validation across all tabs
- **Default Value**: 450 cats
- **Range**: 1-1000 cats (hard cap enforced)
- **Hard Cap Enforcement**: Values are automatically capped at 1000 during input, blur, and restore operations
- **Dynamic Behavior**: 
  - When changed, immediately affects all show count input fields in the General Information tab
  - All individual count fields (Championship, Kitten, Premiership, Household Pet) are automatically capped at this value
  - All validation error messages dynamically update to reflect the new maximum (e.g., "Cat number must be between 1-500 or VOID")
  - Test data generation respects this setting
  - All tabs (Championship, Kitten, Premiership, Household Pet, Breed Sheets) automatically use the new maximum for validation
- **Integration**: All show count input fields in General Information tab are automatically capped at this value

### Ring Number Dynamic Cap
- **Location**: General Information tab → Judge Information table → "Ring #" field
- **Purpose**: Ring numbers are dynamically capped based on the current number of judges
- **Dynamic Behavior**: 
  - Ring number maximum = 2 × current number of judges
  - When judge count decreases, invalid ring numbers are automatically cleared
  - Minimum ring number is always 1
  - Maximum ring number changes in real-time as judge count changes
- **Example**: If you have 6 judges, ring numbers can be 1-12. If you reduce to 3 judges, ring numbers become 1-6, and any existing ring numbers 7-12 are cleared

### Placement Threshold Settings
- **Location**: Settings Panel → Placement Threshold Settings
- **Purpose**: Controls the breakpoints for Top 10 vs Top 15 placements in each tab
- **Default Values**:
  - Championship: 85 cats
  - Kitten: 75 cats  
  - Premiership: 50 cats
  - Household Pet: 50 cats
- **Dynamic Behavior**: When changed, immediately affects the number of placement rows shown in each tab

---

## CSV Export & Restore Format

This section documents the precise format of the CSV file generated by the CFA Master Clerk Entry Tool, and how it can be used to restore the full show state. This is the authoritative reference for both export and import/restore logic.

---

## CSV Export & Restore Format (Updated)

### Section Separation
- **A blank row is inserted before the beginning of each new section** (including before General Information, Championship, Premiership, Kitten, Household Pet).
- Each section starts with a section label row in the first column (e.g., "General Information", "Championship Awards").

### Tabular Sections (Championship, Premiership, Kitten, Household Pet)
- Each tabular section is exported as a table:
  - Three header rows: Ring Numbers, Judge Acronyms, Ring Types
  - All placement rows, preserving the table structure and voiding rules
  - Each cell is formatted as `CAT number - status - V` if voided, or `CAT number - status` if not voided, or `-` if empty
- **If a Cat # input is VOID (case-insensitive, trimmed), the status dropdown/label is hidden in the UI and only 'VOID' (uppercase, no spaces) is saved/restored in the CSV for that cell. This applies to all tabs, including Kitten and Household Pet.**
- **All data is exported in a way that matches the documented JSON schema and is fully restoreable**

### Example (Section Separation)

```

General Information
Show Name,Example Cat Show
Show Date,2024-07-01
...
Judges
Judge Name,Ring Number,Acronym,Ring Type
John Smith,JSM,Allbreed
...

Championship Awards
,Ring 1,Ring 2
,JSM,ABC
,Allbreed,Longhair
1st Place,123-GC,456-GC
2nd Place,124-CH,457-CH
...

Premiership Awards
,Ring 1,Ring 2
,JSM,ABC
,Allbreed,Longhair
1st Place,223-GP,256-GP
...

Kitten Awards
,Ring 1,Ring 2
,JSM,ABC
,Allbreed,Longhair
1st Place,323-KIT,356-KIT
...

Household Pet Awards
,Ring 1,Ring 2
,JSM,ABC
,Allbreed,Longhair
1st Place,423-HHP,456-HHP
...
```

### Restoreability
- This format guarantees that **all tabular data, placements, voiding, and section separation can be restored** exactly as entered, per the [CSV_EXPORT_SCHEMA.json](specs/CSV_EXPORT_SCHEMA.json).
- See the schema for the authoritative structure.

---

## 11. Field Escaping and Special Characters

All fields in the CSV are escaped according to the CSV standard to ensure that commas, quotes, and newlines inside field values do not break the file structure:

- **If a field contains a comma, double quote, or newline:**
  - The entire field is enclosed in double quotes (`"...")
  - Any double quotes inside the field are escaped by doubling them (e.g., `"` becomes `""`)

### Examples
- Field with a comma: `John, Williams` → `"John, Williams"`
- Field with a quote: `John "The Cat" Williams` → `"John ""The Cat"" Williams"`
- Field with a newline: `123 Main St\nApt 4` → `"123 Main St
Apt 4"`

**This escaping is applied to all fields, including show names, judge names, addresses, and placement/status cells.**

When restoring from CSV, the parser must reverse this escaping: recognize quoted fields, unescape doubled quotes, and treat embedded commas/newlines as part of the field value.

---

### CSV Export/Import

All tabular data (Championship, Premiership, Kitten, Household Pet) is exported in sectioned format, with all placements, voiding, and headers preserved. The export is always complete, regardless of which tab triggers the export. General tab data is output as key-value pairs, and judge information is included as a table. All fields are properly escaped for CSV (commas, quotes, newlines).

**Household Pet Tab Data**
- Household Pet tab placements and voiding are now fully included in the CSV export and import, matching the structure and restoreability of other tabs.
- The HouseholdPetTab component now receives its data and setter as props (`householdPetTabData`, `setHouseholdPetTabData`), ensuring all changes are reflected in the exported CSV.
- All placements, voiding, and awards for Household Pet are exported and restoreable.

**Breed Sheets Tab Data**
- Breed Sheets tab data is fully included in the CSV export and import, with separate storage for each judge-group-hair length combination.
- The BreedSheetsTab component receives its data and setter as props (`breedSheetsTabData`, `setBreedSheetsTabData`), ensuring all changes are reflected in the exported CSV.
- All BoB, 2BoB, Best CH, and Best PR awards are exported and restoreable.
- Breed list management is integrated with the Settings panel, with dynamic updates when breeds are added/removed.
- Search functionality allows real-time filtering of breed names for improved usability.

**Note:** All tab data is now lifted to the top-level App state for consistency and reliability in export/import. 

#### Key Format for Placements and Voids
All placement and voided keys use hyphens (e.g., '0-0') for column-row addressing. This is required for CSV export compatibility. Do not use underscores.

#### Household Pet Section
The Household Pet section is always included in the CSV export, even if empty. This ensures schema consistency and restoreability.

#### Export Completeness
The CSV export always includes all tabs and sections, regardless of which tab triggers the export or whether any section is empty. 

#### Finals Row Labels
Finals rows in the Championship and Premiership sections now use user-facing labels:
- Championship: 'Best AB CH', '2nd Best AB CH', ..., 'Best LH CH', ..., 'Best SH CH', ...
- Premiership: 'Best AB PR', '2nd Best AB PR', ..., 'Best LH PR', ..., 'Best SH PR', ...
These labels appear in the exported CSV and match the UI, ensuring clarity and restoreability.

#### Finals Row Mapping Fix
The CSV export now correctly writes all 'Best AB CH', 'Best LH CH', and 'Best SH CH' rows (and their ordinal variants) for each judge/column in the Championship section. The export logic maps each finals row to the correct key in the state (e.g., 'championsFinals', 'lhChampionsFinals', 'shChampionsFinals') and writes the cat number for each judge/column. This ensures all finals data is present in the CSV and matches the UI.

#### Defensive Extraction for Placements/Finals
The CSV export now robustly extracts all placement and finals data, regardless of whether the data is stored as a string or object. Each cell is written to the CSV using a defensive extractCell function, ensuring no blanks due to type mismatches. This guarantees all user input is exported.

#### Developer Note
The extractCell logic in excelExport.ts handles string, object, or undefined cell values, preventing blank or missing data in the Excel export.

#### Developer Note
The mapping logic uses the finals row index modulo 5 to select the correct key for each section, ensuring the correct cat number is written for each position and judge. 

## Excel Export Error Handling

### Excel Export File Save Dialog

When you click the 'Save to Excel' button and validation passes (no errors), the application will:

- **Tauri Desktop Apps**: Open a native OS file picker allowing you to choose where to save the Excel file. The filename will be auto-generated in the format `YYYYMMDD_HHMMSS_showName.xlsx` but you can change the location and filename if desired.

- **Modern Browsers (Chrome 86+, Edge 86+)**: Open a browser file save dialog allowing you to choose where to save the Excel file. The filename will be auto-generated in the format `YYYYMMDD_HHMMSS_showName.xlsx` but you can change the location and filename if desired.

- **Older Browsers**: Automatically download the file to your default downloads folder with the auto-generated filename.

The auto-generated filename format is: `YYYYMMDD_HHMMSS_showName.xlsx`
- Example: `20241215_143022_ExampleCatShow.xlsx`

### Environment-Aware File Saving (2025-08-01)

The Excel export feature now automatically detects the runtime environment and uses the appropriate file saving method:

**Detection Logic:**
1. **Tauri Desktop Apps**: Detects `window.__TAURI__` and uses native OS file picker (planned implementation)
2. **Modern Browsers**: Detects `showSaveFilePicker` API and uses browser file picker
3. **Legacy Browsers**: Falls back to automatic download method

**Current Implementation Status:**
- ✅ **Modern Browsers**: Fully implemented with File System Access API
- ✅ **Legacy Browsers**: Fully implemented with automatic download
- 🔄 **Tauri Desktop Apps**: Environment detection implemented, native file picker planned

**Benefits:**
- **Single Codebase**: Same code works in all environments
- **Native Experience**: Tauri users will get native OS file picker (when implemented)
- **Graceful Degradation**: Best possible experience in each environment
- **Error Handling**: Comprehensive error handling with fallbacks

## Excel Import

The application supports importing data from both Excel (`.xlsx`) and CSV (`.csv`) files for backward compatibility. When you click the 'Load from Excel' button, you can select either file type.

### Environment-Aware Excel Import (2025-08-01)

The Excel import feature now automatically detects the runtime environment and uses the appropriate file selection method:

**Detection Logic:**
1. **Tauri Desktop Apps**: Detects `window.__TAURI__` and uses native OS file picker (planned implementation)
2. **Web Browsers**: Uses browser file picker for all browser environments

**Current Implementation Status:**
- ✅ **Web Browsers**: Fully implemented with browser file picker
- 🔄 **Tauri Desktop Apps**: Environment detection implemented, native file picker planned

**Benefits:**
- **Single Codebase**: Same code works in all environments
- **Native Experience**: Tauri users will get native OS file picker (when implemented)
- **Graceful Degradation**: Best possible experience in each environment
- **Error Handling**: Comprehensive error handling with fallbacks

### General Tab: Save to Excel Error Handling

- If you click the 'Save to Excel' button while there are validation errors on the General tab, a modal dialog will appear with the message:
  > Excel cannot be generated until all errors on this tab have been resolved. Please fix all highlighted errors before saving.
- You must resolve all highlighted errors before you can export the Excel file.
- The previous error toast for this scenario has been replaced by this modal for improved clarity.

### Championship Tab: Save to Excel Error Handling

- If you click the 'Save to Excel' button while there are validation errors on the Championship tab, a modal dialog will appear with the message:
  > Excel cannot be generated until all errors on this tab have been resolved. Please fix all highlighted errors before saving.
- You must resolve all highlighted errors before you can export the Excel file.
- The previous error toast for this scenario has been replaced by this modal for improved clarity.

### Premiership Tab: Save to Excel Error Handling

- If you click the 'Save to Excel' button while there are validation errors on the Premiership tab, a modal dialog will appear with the message:
  > Excel cannot be generated until all errors on this tab have been resolved. Please fix all highlighted errors before saving.
- You must resolve all highlighted errors before you can export the Excel file.
- The previous error toast for this scenario has been replaced by this modal for improved clarity.

### Kitten Tab: Save to Excel Error Handling

- If you click the 'Save to Excel' button while there are validation errors on the Kitten tab, a modal dialog will appear with the message:
  > Excel cannot be generated until all errors on this tab have been resolved. Please fix all highlighted errors before saving.
- You must resolve all highlighted errors before you can export the Excel file.
- The previous error toast for this scenario has been replaced by this modal for improved clarity.

### Household Pet Tab: Save to Excel Error Handling

- If you click the 'Save to Excel' button while there are validation errors on the Household Pet tab, a modal dialog will appear with the message:
  > Excel cannot be generated until all errors on this tab have been resolved. Please fix all highlighted errors before saving.
- You must resolve all highlighted errors before you can export the Excel file.
- The previous error toast for this scenario has been replaced by this modal for improved clarity. 

## Status Dropdown Design System (2024-06)

All status dropdowns in the Championship, Premiership, Kitten, and Household Pet tabs now use a uniform, modern design system:

- **If a Cat # input is VOID, the status dropdown/label is hidden (not rendered) for that cell.**
- **Main Box:** Always white (`bg-white`), no theme background fill.
- **Border:** Subtle, rounded, and in the tab's theme color (violet, blue, green, orange).
- **Font:** Modern, readable (`Inter, Montserrat, Arial, Helvetica Neue, sans-serif`), 15px, medium weight.
- **Size:** Consistent pill shape (`h-9`, `min-w-[70px]`, `rounded-full`, `px-3 py-1.5`).
- **Focus:** Border thickens and theme color intensifies slightly, no glow or background fill.
- **Dropdown Menu:** Options use a very light theme background on hover/selected, but the main box remains white.
- **Static Labels:** Kitten and HHP tabs use a styled span matching the dropdown's font, size, border, and color.

**Rationale:**
- Ensures perfect visual and UX parity across all tabs.
- Modern SaaS look: clean, accessible, and easy to scan.
- Theme color is only used for border and dropdown menu highlights, never for the main background or text.

**Implementation:**
- See `CustomSelect.tsx` for the implementation and theme props.
- All usages in the four tabs have been updated for parity. 

## Jump-to-Menu Dropdown (2024-12-19)

All tabular sections (Championship, Premiership, Kitten, Household Pet) feature a jump-to-menu dropdown for quick navigation between rings:

### Functionality
- **Location**: Top-right corner of each tab, next to the tab title
- **Format**: "Ring XX - Judge Acronym - Room Type" (e.g., "Ring 05 - JSM - AB")
- **Ring Numbers**: Displays actual ring numbers entered in General Information tab (not auto-generated sequential IDs)
- **Navigation**: Click to instantly scroll to and highlight the selected ring column
- **Visual Feedback**: Selected ring column is highlighted with a colored border in the tab's theme color

### Ring Number Display
- **Championship/Premiership/Kitten Tabs**: Shows "Ring XX - Judge Acronym - Room Type" (e.g., "Ring 05 - JSM - AB")
- **Household Pet Tab**: Shows "Ring XX - Judge Acronym" (no room type, as household pets don't use room distinctions)
- **Consistency**: Ring numbers displayed match exactly what was entered in the General Information tab
- **Accuracy**: No longer shows auto-generated sequential IDs (1, 2, 3, 4...) but actual ring assignments (5, 12, 3, 8...)

### Theme Colors
- **Championship**: Violet theme with trophy icon (🏆)
- **Premiership**: Blue theme with ribbon icon (🎗️)  
- **Kitten**: Green theme with paw print icon (🐾)
- **Household Pet**: Orange theme with cat icon (🐱)

## Table Column Focus Highlight (2024-06)

All four tab tables (Championship, Premiership, Kitten, Household Pet) now use a perfectly uniform, modern column focus highlight:

- **Focused Column:** Only a thickened border (`border-l-4 border-r-4`) in the tab's theme color (violet, blue, green, orange) is used to indicate focus. No background color is applied to the focused column.
- **Hover:** Table row hover backgrounds remain as designed per tab, but do not affect the focused column highlight.
- **Rationale:** This ensures a clean, modern SaaS look and perfect visual parity across all tabs, with no distracting background color for focused columns. 

### Table Column Width Parity (2024-06)

- The Household Pet tab now uses the exact same column widths as the Kitten tab for perfect visual parity:
  - Judge columns: **170px** wide (header and all data cells)
  - Placement cells: **110px** wide if a cat number is present, **90px** if empty
- This ensures all four tabs (Championship, Premiership, Kitten, HHP) have a consistent, modern SaaS table layout.
- No other logic or style was changed.

### Household Pet Tab VOID Placement Logic (2024-06)

- **VOID Entry:** To mark a placement as VOID, simply type 'v' or 'V' in the Cat # input; it will auto-complete to 'VOID'.
- **Visual:** VOID rows are visually struck through and grayed out for clarity, but remain editable (no disabling).
- **Validation:** VOID placements are ignored by all validation rules (range, sequential, duplicate, status) and are treated as if they do not exist.
- **No Checkbox:** The void checkbox has been removed for simplicity and parity with the Kitten tab.
- **Parity:** This logic is now identical to the Kitten tab's VOID handling, ensuring a consistent user experience.
- **Rationale:** This change streamlines the UI, reduces confusion, and ensures that VOID logic is robust, predictable, and easy to use across both tabs. 

### Household Pet Tab Reset & Autofocus (2024-06)

- The Household Pet tab reset is now instant and robust: when the reset button is confirmed, all visible cells (columns × rows) are immediately re-initialized, and the table is ready for input with no delay.
- On tab activation, the first Cat # input (row 0, column 0) is auto-focused for fast data entry, matching the behavior of the Kitten and Championship tabs.
- This ensures perfect parity and a modern, efficient user experience across all tabs. 

- All numeric fields imported from CSV (e.g., counts, judge numbers, etc.) are now robustly defaulted to 0 if missing or invalid. This prevents React controlled/uncontrolled input warnings and ensures a smooth user experience.
- All number inputs in the UI are always controlled (never undefined or NaN). If a value is missing or invalid, the input will show as empty until a valid number is entered. 

- The Championship tab now uses dynamic validation for Cat # fields in all sections (Top 10/15, Best AB CH, Best LH CH, Best SH CH) that matches the Premiership tab. Cat # validation is only triggered on blur/tab/enter, not on every keystroke. Error order and logic are fully consistent with the Premiership tab. No validation rules or user-facing workflows changed; this is a timing and UX parity update. 
- In the Championship tab, you can now type 'v' or 'V' in any Cat # input (showAwards section) and it will auto-complete to 'VOID', matching the Kitten and HHP tabs. 

# CFA Entry System - Usage Guide

## Overview
The CFA Entry System is a comprehensive web application designed for managing cat show entries and settings. This guide provides detailed information on how to use the various features and components of the system.

## Settings Panel

### Modern Input Design
The settings panel features a newly redesigned, modern input system with the following characteristics:

#### SettingsInput Component
- **Glassmorphism Design**: Modern glass-like appearance with subtle transparency and backdrop blur
- **Smooth Animations**: Hover and focus effects with smooth transitions (300ms duration)
- **Auto-Text Selection**: Automatically selects all text when input is focused for easy editing
- **Consistent Styling**: Unified design across all input types (number, text, etc.)
- **Responsive Design**: Adapts to different screen sizes with proper spacing
- **Accessibility**: Full keyboard navigation and screen reader support

#### Visual Features
- **Gradient Backgrounds**: Subtle color-coded gradients for different input categories
- **Glow Effects**: Animated glow on focus with amber/yellow color scheme
- **Hover States**: Enhanced hover effects with scale transforms and shadow changes
- **Corner Accents**: Decorative corner elements that appear on hover
- **Backdrop Blur**: Modern glassmorphism effect with backdrop blur

### Auto-Save Settings
Configure automatic file saving behavior:
- **Number of Saves**: Set the number of auto-save files to maintain in rotation (1-10, default: 3)
- **Save Cycle**: Set the frequency of auto-saves in minutes (1-60, default: 5)
- **Input Validation**: Values are automatically capped within their respective ranges
- **Real-time Updates**: Changes are applied immediately when you finish editing (on blur)
- **Integration**: Auto-save process uses these user-configured values in real-time
- **Platform Support**: Works with both Tauri (file system) and Browser (localStorage) environments

### General Settings
Configure the maximum number of judges and cats for the show:
- **Maximum Judges**: Set the total number of judges (1-999)
- **Maximum Cats**: Set the total number of cats (1-999)

### Placement Threshold Settings
Configure scoring thresholds for different competition categories:
- **Championship**: Minimum score for championship level (default: 85)
- **Kitten**: Minimum score for kitten category (default: 75)
- **Premiership**: Minimum score for premiership level (default: 50)
- **Household Pet**: Minimum score for household pet category (default: 50)

### Breed List Management
Manage the list of cat breeds for the competition:
- **Short Hair Breeds**: Add, edit, or remove short hair breed names
- **Long Hair Breeds**: Add, edit, or remove long hair breed names
- **Inline Editing**: Click on any breed name to edit it directly
- **Add New Breeds**: Use the "Add Breed" button to add new breeds
- **Delete Confirmation**: Confirmation modal for breed deletion

## Input Component Features

### SettingsInput Props
```typescript
interface SettingsInputProps {
  type?: 'number' | 'text' | 'email' | 'password';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  width?: 'sm' | 'md' | 'lg' | string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}
```

### Width Options
- **sm**: 80px width (w-20)
- **md**: 96px width (w-24) - default
- **lg**: 128px width (w-32)
- **Custom**: Any valid Tailwind width class

### Styling Features
- **Glassmorphism**: Semi-transparent background with backdrop blur
- **Gradient Borders**: Subtle gradient borders that change on focus
- **Focus Ring**: Amber-colored focus ring with 30% opacity
- **Hover Effects**: Scale transform and shadow changes on hover
- **Disabled State**: Reduced opacity and disabled cursor when disabled

## Keyboard Shortcuts

### Settings Panel
- **Escape**: Close the settings panel
- **Enter**: Save changes in input fields
- **Tab**: Navigate between input fields and buttons

### Breed Management
- **Enter**: Save breed name when editing
- **Escape**: Cancel breed editing
- **Delete**: Remove selected breed (with confirmation)

## Responsive Design

The settings panel is fully responsive and adapts to different screen sizes:
- **Desktop**: Full sidebar navigation with detailed input cards
- **Tablet**: Optimized layout with responsive grid
- **Mobile**: Stacked layout with touch-friendly controls

## Accessibility

All input components include:
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Clear focus indicators
- **Color Contrast**: High contrast ratios for readability
- **Screen Reader Support**: Semantic HTML structure

## Performance Features

- **Lazy Loading**: Components load only when needed
- **Optimized Animations**: Hardware-accelerated CSS transitions
- **Efficient Re-renders**: React optimization for minimal re-renders
- **Memory Management**: Proper cleanup of event listeners

## Error Handling

- **Input Validation**: Real-time validation with visual feedback
- **Range Checking**: Automatic min/max value enforcement
- **Duplicate Prevention**: Prevents duplicate breed names
- **Graceful Degradation**: Fallback behavior for unsupported features

## Browser Compatibility

The system supports all modern browsers:
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Troubleshooting

### Common Issues
1. **Input not responding**: Check if the input is disabled
2. **Value not updating**: Ensure the onChange handler is properly connected
3. **Styling issues**: Verify Tailwind CSS is properly loaded
4. **Animation glitches**: Check for conflicting CSS transitions

### Performance Tips
1. **Use appropriate width**: Choose the right width for your use case
2. **Limit concurrent inputs**: Avoid too many focused inputs simultaneously
3. **Optimize re-renders**: Use React.memo for expensive components
4. **Monitor memory usage**: Clean up event listeners properly

## Future Enhancements

Planned improvements include:
- **Custom themes**: User-selectable color schemes
- **Advanced validation**: More sophisticated input validation rules
- **Animation customization**: User-configurable animation speeds
- **Accessibility improvements**: Enhanced screen reader support
- **Mobile optimization**: Better touch interaction patterns 