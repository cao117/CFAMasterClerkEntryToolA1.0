# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2025-08-04

### Fixed
- **Judge Information Dropdown Positioning**: Fixed Ring Type dropdown in Judge Information table that was covering ActionButtons due to table stacking context issues. Implemented React Portal solution to render dropdown outside table DOM, ensuring proper z-index layering and positioning above ActionButtons.
- **Smart Positioning**: Enhanced dropdown positioning logic to dynamically position above or below trigger based on available viewport space.
- **Scroll Behavior**: Added scroll event handling to close dropdown when user scrolls, preventing positioning issues with fixed portal positioning.

### Technical Improvements
- **React Portal Implementation**: Migrated dropdown rendering from table cell to document.body using createPortal for proper stacking context isolation.
- **Dynamic Height Calculation**: Implemented real-time dropdown height measurement using scrollHeight for accurate positioning calculations.
- **Button Ref Targeting**: Updated ref targeting from container div to button element for precise positioning calculations.

## [1.2.0] - 2025-08-04

### Added
- **Judge Information Table**: Added comprehensive judge management with Ring Type dropdown selection
- **Smart Dropdown Positioning**: Implemented intelligent positioning logic to prevent dropdown clipping
- **Action Buttons**: Added Save to Excel, Load from Excel, Reset, and Fill Test Data functionality

### Changed
- **UI/UX Enhancements**: Modern card-based design with hover effects and smooth transitions
- **Form Validation**: Comprehensive validation for all judge information fields
- **Responsive Design**: Improved mobile and tablet compatibility

## [1.1.0] - 2025-08-04

### Added
- **Show Information Section**: Date, club name, master clerk, and judge count management
- **Show Count Management**: Championship, kitten, and premiership count tracking
- **Modern UI Components**: Gradient backgrounds, hover effects, and smooth animations

### Changed
- **Design System**: Implemented consistent color schemes and typography
- **Form Handling**: Enhanced input validation and error state management
- **Accessibility**: Improved ARIA labels and keyboard navigation

## [1.0.0] - 2025-08-04

### Added
- **Initial Release**: CFA Entry application with tabbed interface
- **General Tab**: Core show management functionality
- **Settings Panel**: Configuration and customization options
- **Excel Integration**: Import/export functionality for show data
- **Validation System**: Comprehensive form validation and error handling 