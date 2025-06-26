# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added
- Initial project scaffold with Vite + React + TypeScript
- Tailwind CSS v3.4.0 integration with custom styling
- Tauri v2.6.0 setup for desktop app development
- PapaParse for CSV handling
- Faker.js for test data generation
- Multi-tab interface (General, Championship, Kitten, Premiership)
- GeneralTab component with judge management
- ChampionshipTab component with dynamic column generation
- Responsive design with Tailwind CSS
- TypeScript interfaces for type safety
- CFA branding: logo, gold/black color scheme, pill-shaped tabs and buttons
- GeneralTab and ChampionshipTab refactored to match official CFA screenshots
- All fields, order, and labels preserved as per screenshots
- Table layouts and gold "GC" buttons in ChampionshipTab
- Updated documentation to reflect new UI/UX
- **COMPLETE DYNAMIC LOGIC IMPLEMENTATION**: Full replication of original yyy/cfa-tool functionality
- **LIVE UPDATES**: Real-time synchronization between General and Championship tabs
- **COMPREHENSIVE VALIDATION**: All validation rules from original implementation
- **BUSINESS LOGIC**: Complete ring type logic (Double Specialty, Allbreed, Longhair, Shorthair)
- **AUTO-CALCULATIONS**: Automatic totals for Championship and Premiership counts
- **TAB DISABLING**: Smart tab disabling based on show counts
- **FORM VALIDATION**: Required field validation, character limits, duplicate checking
- **CAT NUMBER VALIDATION**: 1-450 range validation with VOID support
- **ERROR HANDLING**: Real-time error display and validation feedback
- Refactored General tab's Show Information and Show Count sections to use semantic HTML tables for pixel-perfect alignment, matching the original yyy/cfa-tool UI
- Increased container width to max-w-7xl (1280px) for better data entry experience
- Optimized field widths: Show Date (w-32), # of Judges (w-20), Club/Master Clerk names (w-64), count inputs (w-20)
- Enhanced UI with modern professional styling: gradients, shadows, hover effects, and polished components
- Added custom CSS classes for consistent design system (cfa-card, cfa-input, cfa-button, cfa-table, etc.)
- Implemented smooth animations, custom scrollbars, and focus states for better UX
- **CFA BLACK THEME**: Professional black backgrounds for headers and tabs with CFA gold accents
- **PROFESSIONAL TYPOGRAPHY**: Georgia serif font for headings, Arial sans-serif for body text (matching CFA website)
- **UPDATED COLOR SCHEME**: Black (#000000), CFA Gold (#C7B273), and professional grays
- **ENHANCED HEADER DESIGN**: Black header with gold text and professional typography
- **ENHANCED VALIDATION & UX**: Comprehensive form validation with user-friendly error messages and focus-based helper text
- **FOCUS MANAGEMENT**: Smart focus handling with useRef for improved accessibility and user experience
- **LAYOUT STABILITY**: Fixed input field positioning to prevent layout shifts during focus/blur events
- **HELPER TEXT SYSTEM**: Contextual helper text that appears on focus for mandatory fields and complex inputs
- **IMPROVED JUDGE MANAGEMENT**: Enhanced judge table with better field labels, wider ring type dropdown, and sleek delete icons
- **AUTO-INDEXING**: Ring numbers automatically index and re-index when judges are added/removed
- **REDUCED VERTICAL SPACING**: Optimized spacing in Show Information section for better data density
- **SMART NUMBER INPUT UX**: Number inputs automatically clear "0" values on focus for immediate typing, and revert to "0" on blur if empty or invalid
- **Modern Notification System**: Replaced ugly system alert boxes with professional toast notifications and modal dialogs
  - Toast notifications with auto-dismiss, progress bars, and smooth animations
  - Modal dialogs for confirmation actions with backdrop overlay
  - Type-specific styling (success, error, warning, info) with appropriate colors and icons
  - Non-blocking notifications that don't interrupt user workflow
  - Keyboard support (ESC to close modals) and accessibility features
  - Stacking support for multiple notifications
- **Enhanced User Experience**: Improved validation feedback with specific, actionable error messages
- **Professional Design**: Toast notifications match CFA branding with consistent styling

### Changed
- **VALIDATION MESSAGES**: Replaced generic error messages with specific, user-friendly validation feedback
- **HELPER TEXT BEHAVIOR**: Changed from always-visible to focus-based helper text for cleaner UI
- **INPUT FIELD STABILITY**: Fixed horizontal shifting issues by implementing consistent field heights and spacing
- **JUDGE TABLE LAYOUT**: Replaced "Actions" header with cleaner design, updated delete button to X icon
- **RING NUMBER INPUTS**: Changed from editable inputs to read-only auto-indexed display elements
- **FIELD LABELS**: Updated "Acronym" placeholder and improved field descriptions for clarity
- **REQUIRED FIELD INDICATORS**: Replaced repetitive "Required field" text in helper text with red asterisks (*) and legend for cleaner, more professional appearance
- **REQUIRED FIELD LEGEND PLACEMENT**: Moved required field legend to form level (above all sections) following web form best practices
- **JUDGE TABLE COLUMN OPTIMIZATION**: Adjusted column widths to prevent helper text wrapping in Acronym field and improved overall table layout
- **JUDGE TABLE ROW OPTIMIZATION**: Reduced row heights and vertical spacing for more compact, efficient table layout
- **DISABLED TAB UX**: Replaced the old Disabled badge with a simple lock icon (🔒) positioned inside disabled tabs at the top right corner. Clean, minimal design without background styling. Added hover tooltips with specific activation messages for each disabled tab (Championship, Kitten, Premiership).
- **CSS IMPROVEMENTS**: Added `.cfa-info-icon`, `.cfa-info-tooltip`, and `.cfa-info-tooltip-content` classes for consistent, accessible, and branded info icon/tooltip styling in tab navigation.
- **JUDGE COUNT VALIDATION**: Updated number of judges to start at 0 on page load, allowing users to set count between 0-12, with 0 showing helpful tips in judge information section.
- **Tab Navigation UX**: Removed lock icons from disabled tabs for cleaner appearance
- **Tooltip Design**: Improved disabled tab tooltip readability with white background and dark text
- **Tooltip Positioning**: Moved tooltips above tabs instead of below for better UX following industry best practices
- **Consistent Messaging**: All disabled tabs now show the same tooltip message: "Complete all required fields in the General tab to continue."
- **Validation Feedback**: Form validation errors now display as toast notifications instead of system alerts
- **Reset Confirmation**: Data reset now uses a professional modal dialog instead of browser confirm
- **Info Messages**: All "coming soon" and informational messages use toast notifications
- **Disabled Tab Tooltips**: Added orange exclamation mark icon (⚠) to disabled tab tooltips for better visual alert indication

### Fixed
- **Tooltip Readability**: Fixed grayed-out tooltip text that was difficult to read
- **Tooltip Positioning**: Adjusted tooltip position to appear above tabs for better visual flow

### Technical
- Configured PostCSS with Autoprefixer
- Set up ESLint with React and TypeScript rules
- Added Tauri scripts to package.json
- Created comprehensive documentation structure
- Implemented dynamic mapping logic between General and Championship tabs
- **STATE MANAGEMENT**: Centralized state management with proper data flow
- **TYPE SAFETY**: Complete TypeScript interfaces for all data structures
- **VALIDATION ENGINE**: Comprehensive form and business rule validation
- **RESPONSIVE DESIGN**: Mobile-friendly layout with proper breakpoints
- **CFA THEME SYSTEM**: Complete color and typography system matching CFA website standards
- **ACCESSIBILITY IMPROVEMENTS**: Enhanced focus management and screen reader support
- **LAYOUT ENGINEERING**: Stable input positioning with fixed heights and consistent spacing
- Added `ToastNotification` component with smooth animations and progress bars
- Added `ToastContainer` component for managing multiple notifications
- Added `Modal` component with backdrop overlay and keyboard support
- Added `useToast` custom hook for easy toast management
- Integrated notification system into main App component 