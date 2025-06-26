# Usage

## Visual Design
- **CFA Black Theme**: Professional black backgrounds for headers and tabs with CFA gold accents
- **Typography**: Georgia serif font for headings, Arial sans-serif for body text (matching CFA website)
- **Color Scheme**: Black (#000000), CFA Gold (#C7B273), and professional grays
- **Pill-shaped tab navigation and action buttons** with CFA gold styling
- **Bordered, clean boxes** for form sections and tables
- **All fields and order match official CFA screenshots**
- **Stable Layout**: Fixed input positioning prevents layout shifts during focus/blur events
- **Focus-Based Helper Text**: Contextual guidance appears when focusing on fields for better UX
- **Required Field Indicators**: Red asterisks (*) with form-level legend indicate mandatory fields for clean, professional appearance
- **Optimized Table Layout**: Carefully balanced column widths prevent helper text wrapping and improve readability
- **Compact Row Design**: Reduced vertical spacing in judge table for efficient use of screen space
- **Smart Number Input Behavior**: Number inputs automatically clear "0" values when clicked for immediate typing, and revert to "0" when clicking out if empty or invalid
- **Consistent Vertical Alignment**: All table cells use align-top for stable positioning during focus/blur interactions
- **Modern Notification System**: Professional toast notifications and modal dialogs replace ugly system alert boxes

## Modern Notification System
The application features a sophisticated notification system that provides superior user experience:

### Toast Notifications
- **Non-blocking**: Appear in top-right corner without interrupting workflow
- **Auto-dismiss**: Automatically disappear after 5 seconds (configurable)
- **Progress bars**: Visual indication of remaining display time
- **Multiple types**: Success (green), Error (red), Warning (yellow), Info (blue)
- **Smooth animations**: Slide in from right with fade effects
- **Manual dismiss**: X button for immediate dismissal
- **Stacking**: Multiple notifications stack vertically with proper spacing

### Modal Dialogs
- **Confirmation dialogs**: Professional modal for critical actions like data reset
- **Backdrop overlay**: Darkens background to focus attention
- **Keyboard support**: ESC key to close, proper focus management
- **Accessibility**: Screen reader friendly with proper ARIA attributes
- **Type-specific styling**: Different colors and icons for warning, alert, and confirm types

### Validation Feedback
- **Inline validation**: Real-time error display below fields
- **Toast notifications**: Form-level validation errors shown as toasts
- **Specific messaging**: Detailed error descriptions with actionable guidance
- **Non-intrusive**: Errors don't block workflow, allow immediate correction

## Tab Navigation
The application features four main tabs for different aspects of CFA show management:

### General Tab
- **Show Information**: Enter show date, club name, and master clerk details
- **Dynamic Judge Management**: Set number of judges (0-12) to automatically populate judge table. Starts at 0 on page load with helpful tips.
- **Ring Types**: Support for "Double Specialty", "Allbreed", "Longhair", and "Shorthair" judge types
- **Show Count**: Championship, Kitten, and Premiership counts with auto-calculated totals
- **Form Validation**: Required field validation, character limits, duplicate judge name checking
- **Action Buttons**: CFA gold pill-shaped buttons for CSV operations, reset, and project management
- **Show Information and Show Count sections**: Use HTML tables for perfect field alignment, matching the original CFA tool UI
- **Enhanced Validation**: User-friendly error messages with specific guidance for each validation rule
- **Focus Management**: Smart focus handling with automatic cursor positioning and contextual helper text
- **Layout Stability**: Fixed input field heights and consistent spacing prevent layout shifts
- **Auto-Indexed Ring Numbers**: Ring numbers automatically index and re-index when judges are added/removed
- **Improved Judge Table**: Enhanced field labels, wider ring type dropdown, and sleek X delete icons
- **Modern Notifications**: Toast notifications for validation errors and info messages, modal for reset confirmation

### Championship Tab
- **Dynamic Columns**: Automatically generates columns based on judges from General tab
- **Live Updates**: Real-time column updates when judge information changes
- **Ring Type Logic**: 
  - "Double Specialty" = 2 columns (Longhair + Shorthair)
  - "Allbreed" = 1 column
  - "Longhair" = 1 column (Longhair only)
  - "Shorthair" = 1 column (Shorthair only)
- **Placement Entry**: Enter cat numbers (1-450) or "VOID" for placements 1-10
- **Special Awards**: Track Best CH, 2nd CH, 3rd CH, Best LH CH, 2nd LH CH, 3rd LH CH, Best SH CH, 2nd SH CH, 3rd SH CH
- **CFA Gold "GC" Buttons**: For each placement, matching CFA style
- **Real-time Validation**: Cat number validation with immediate error feedback
- **Smart Tab Disabling**: Tab disabled when Championship count is 0
- **Disabled Tab Info**: Disabled tabs show tooltips on hover with orange exclamation mark icon (⚠) and consistent messaging about completing required fields in the General tab

### Kitten Tab
- **Coming Soon**: Placeholder for kitten finals functionality
- **Smart Tab Disabling**: Tab disabled when Kitten count is 0
- **Disabled Tab Info**: Disabled tabs show tooltips on hover with orange exclamation mark icon (⚠) and consistent messaging about completing required fields in the General tab

### Premiership Tab
- **Coming Soon**: Placeholder for premiership finals functionality
- **Smart Tab Disabling**: Tab disabled when Premiership count is 0
- **Disabled Tab Info**: Disabled tabs show tooltips on hover with orange exclamation mark icon (⚠) and consistent messaging about completing required fields in the General tab

## Data Management
- **CSV Import/Export**: Use CSV buttons to import/export data (functionality in development)
- **Test Data Generation**: Generate realistic test data for quick setup (functionality in development)
- **Reset Functionality**: Clear all fields and start fresh with confirmation dialog
- **Form Validation**: Comprehensive validation before CSV operations

## Business Logic
- **Auto-calculations**: Championship and Premiership totals calculated automatically
- **Judge Management**: Dynamic judge table based on number of judges setting
- **Ring Type Mapping**: Proper column generation based on judge ring types
- **Validation Rules**: All validation rules from original CFA tool implemented
- **Error Handling**: Real-time error display and validation feedback

## User Experience Features
- **Focus-Based Helper Text**: Contextual guidance appears when focusing on fields
- **Layout Stability**: Fixed input positioning prevents layout shifts during interactions
- **Smart Focus Management**: Automatic cursor positioning and focus handling
- **User-Friendly Validation**: Specific, actionable error messages for each validation rule
- **Auto-Indexing**: Ring numbers automatically manage indexing when judges are added/removed
- **Accessibility**: Enhanced screen reader support and keyboard navigation
- **Required Field Indicators**: Red asterisks (*) with form-level legend provide clear visual indication of mandatory fields without cluttering helper text
- **Optimized Table Layout**: Balanced column widths prevent helper text wrapping and ensure consistent field spacing
- **Space Efficiency**: Compact row heights maximize data density while maintaining readability and usability
- **Professional Notifications**: Modern toast system and modal dialogs provide superior user feedback compared to system alert boxes

## Current Status
- ✅ CFA-styled UI implemented for General and Championship tabs
- ✅ All fields and order match official screenshots
- ✅ Complete dynamic logic from original yyy/cfa-tool implemented
- ✅ Live updates between General and Championship tabs
- ✅ Comprehensive validation and error handling
- ✅ Smart tab disabling based on show counts
- ✅ **CFA Black Theme**: Professional black headers and tabs with gold accents
- ✅ **Professional Typography**: Georgia serif for headings, Arial sans-serif for body text
- ✅ **Enhanced Validation & UX**: User-friendly error messages and focus-based helper text
- ✅ **Layout Stability**: Fixed input positioning prevents layout shifts
- ✅ **Focus Management**: Smart focus handling with contextual guidance
- ✅ **Modern Notification System**: Professional toast notifications and modal dialogs replace system alerts
- 🔄 CSV functionality (in development)
- 🔄 Test data generation (in development)
- 🔄 Kitten and Premiership tab implementation (in development) 