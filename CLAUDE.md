# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CFA Entry Tool is a desktop application built with React, TypeScript, Vite, and Tauri for managing Cat Fanciers' Association (CFA) show data. This is a professional cat show data management system with comprehensive form handling, Excel integration, and a complex multi-tab interface.

### Key Architecture Components

**Frontend Stack:**
- React 19.1+ with TypeScript for type safety
- Vite for development and build tooling
- Tailwind CSS for styling
- Tauri for desktop application wrapper

**Core Application Structure:**
- **Tab-based Interface**: 6 main tabs (General, Championship, Kitten, Premiership, Household Pet, Breed Sheets)
- **State Management**: Complex lifted state architecture with synchronized counters across tabs
- **Data Flow**: Judge information flows from General tab to all other tabs, auto-calculating totals
- **Settings System**: Global configuration stored in localStorage with DEFAULT_SETTINGS fallback

## Development Commands

### Essential Commands
```bash
# Development
npm run dev                    # Start Vite dev server
npm run tauri:dev             # Start Tauri desktop app in development mode

# Building
npm run build                 # Build frontend for production
npm run tauri:build           # Build Tauri desktop application
npm run tauri:build:debug    # Build Tauri app with debug symbols

# Quality Assurance
npm run lint                  # Run ESLint for code quality
npm run preview              # Preview production build locally
```

### Tauri-specific Development
- **Desktop Window**: Custom frameless window (1280x800 min, maximized by default)
- **Platform Detection**: Use `isTauriEnvironment()` to conditionally render desktop-specific UI
- **Title Bar**: Custom TitleBar component for frameless window controls

## Architecture Deep Dive

### State Architecture
The application uses a complex lifted state pattern where the main App component manages all state:

**Core State Objects:**
- `showData`: Show information and counters (automatically calculated)
- `judges`: Judge array that drives all tab functionality
- `championshipTabData`, `premiershipTabData`, etc.: Tab-specific data objects
- `globalSettings`: Application configuration with localStorage persistence

**Critical State Synchronization:**
- Judge changes in General tab trigger `handleJudgeRingTypeChange()` which resets ALL tab data
- Counter auto-calculation via useEffect chains: LH + SH → Total counts
- Form validation gates prevent access to tabs until General tab is complete

### Tab System & Validation
**Tab Enablement Logic:**
- General: Always enabled (entry point)
- Championship/Kitten/Premiership: Require valid show info + judges + non-zero counts
- Household Pet: Require valid show info + judges + householdPetCount > 0
- Breed Sheets: Only require valid show info + judges (no count requirements)

**Validation Functions:**
- `isShowInfoValid()`: Validates show date, club name, master clerk
- `areJudgesValid()`: Validates judge completeness and uniqueness

### Data Persistence System
**Auto-save Features:**
- `useAutoSave()`: Periodic saves to numbered files (rotation based on globalSettings.numberOfSaves)
- `useRecentSave()`: Single most recent save for session resumption
- **Resume Work Modal**: Appears on app start if recent work detected

**Excel Integration:**
- Import/Export via `excelExport.ts` and `excelImport.ts`
- Handles complex state restoration across all tabs
- Settings import/export included in Excel files

### Component Architecture Patterns

**Custom Dropdown System:**
- `CustomSelect.tsx` uses React Portal for proper z-index layering
- Smart positioning logic prevents clipping in table containers
- Scroll-aware dropdown closure

**Form Components:**
- Extensive validation with real-time feedback
- Sticky elements using `react-sticky-el`
- Toast notification system for user feedback

**Tab Components:**
- Each tab receives `getShowState()` callback for data access
- Consistent prop interface: judges, counts, show functions, globalSettings
- Reset functionality via `onTabReset` callbacks

## Key Development Considerations

### State Management
- **flushSync Usage**: Critical for preventing race conditions during Excel import/restore
- **useEffect Dependencies**: Complex dependency arrays for auto-calculation, handle with care
- **Judge Ring Type Changes**: Full tab data reset required when judge ring types change

### Performance Optimizations
- **Zoom System**: CSS transform-based zoom with smooth transitions
- **Portal Rendering**: Dropdowns render outside table DOM for proper layering
- **Form Empty Detection**: `useFormEmptyDetection()` prevents unnecessary auto-saves

### Common Development Patterns
- **Global Settings Access**: Always check for fallback to DEFAULT_SETTINGS
- **Show State Access**: Use `getShowState()` callback rather than direct state access
- **Error Handling**: Use toast notifications for user feedback (showSuccess, showError, etc.)
- **Validation**: Check both form validity and business logic before enabling features

### File Processing
- **Excel Files**: Uses `xlsx` library for import/export operations
  - **Final Awards Worksheet**: New comprehensive worksheet added to Excel exports containing all show finals
  - **Worksheet Order**: Settings, General_Info, CH_Final, PR_Final, Kitten_Final, HHP_Final, BS_[judge], Final Awards
  - **Special Handling**: OCP rings have empty CH/PR column, SSP rings include LH/SH sections in AB column
- **Fake Data**: `@faker-js/faker` for test data generation
- **CSV Parsing**: `papaparse` for CSV data handling

## Testing & Quality
- **Screen Requirements**: Enforces minimum 1280px width via `useScreenGuard()`
- **Fallback UI**: `FallbackNotice` for unsupported screen sizes
- **Form Validation**: Comprehensive validation before data export
- **Auto-save Validation**: Empty form detection prevents meaningless saves

## Important Notes
- **Tab Dependencies**: Always validate General tab before enabling other tabs
- **Judge Changes**: Ring type changes reset ALL tab data - warn users appropriately  
- **Settings Persistence**: Global settings auto-save to localStorage with proper merging
- **Window Management**: Frameless Tauri window requires custom title bar implementation
- **Data Integrity**: Excel import/export includes settings - ensure consistency across operations

# Mandatory Documentation Rules

## Overview

This project maintains comprehensive documentation across multiple domains. **ALL** confirmed changes (fixes, implementations, UI designs) MUST be properly documented in the relevant sections. This is not optional.

## Documentation Triggers

### 1. Fix Confirmed
When any bug fix, validation fix, or error correction is confirmed working:

**MANDATORY Updates:**
- **Primary**: Update relevant `docs/validation/VALIDATION_[TAB].md` if validation-related
- **Primary**: Add entry to `docs/validation/VALIDATION_CHANGELOG.md` with detailed technical information
- **Secondary**: Update `docs/meta/BUGFIX-CHANGELOG.md` with summary
- **If Component**: Update `docs/COMPONENT-CHANGELOG.md`
- **Cross-Reference**: Update any affected documentation with references to the fix

**Example Fix Documentation Pattern:**
```markdown
### [YYYY-MM-DD] Tab Name: Brief Fix Description
- **Tabs:** Affected tabs
- **Change:** What was fixed
- **Root Cause:** Technical cause
- **Solution:** How it was resolved
- **Files Modified:** List of changed files
- **Impact:** User-facing result
```

### 2. Implementation Confirmed
When any new feature, function, or system implementation is confirmed working:

**MANDATORY Updates:**
- **Primary**: Update `docs/PROJECT_OVERVIEW.md` if architecture changes
- **Primary**: Update relevant `docs/specs/` files (FOLDER_STRUCTURE.md, TECHNOLOGY_STACK.md)
- **Primary**: Add entry to `docs/COMPONENT-CHANGELOG.md` for component changes
- **If Validation**: Create/update `docs/validation/VALIDATION_[DOMAIN].md`
- **If API**: Update relevant specification files
- **Cross-Reference**: Update CLAUDE.md sections if development patterns change

### 3. UI Design Confirmed
When any UI/UX design, layout, or visual change is confirmed:

**MANDATORY Updates:**
- **Primary**: Add entry to `docs/DESIGN-CHANGELOG.md` with implementation details
- **Secondary**: Update `docs/COMPONENT-CHANGELOG.md` if components affected
- **If New Patterns**: Update relevant sections in `docs/PROJECT_OVERVIEW.md`
- **Cross-Reference**: Update any user guides in `docs/guides/`

**Design Documentation Pattern:**
```markdown
### [Design vX.Y.Z] - YYYY-MM-DD
### [DESIGN-CATEGORY]
- **Brief Description**: What changed visually
- **Problem**: What design issue was addressed
- **Solution**: How it was implemented
- **Impact**: User experience improvement
- **Files Modified**: List of changed files
```

### 4. "Document Previous Changes" Command
When user explicitly requests documentation of previous changes:

**MANDATORY Process:**
1. **Review ALL changelogs** for recent undocumented changes
2. **Audit documentation gaps** across all domains
3. **Update missing documentation** following established patterns
4. **Verify cross-references** between related documents
5. **Ensure consistency** across validation, component, design, and technical docs

## Documentation Structure Reference

### Root Documentation (`docs/`)
- **PROJECT_OVERVIEW.md**: Architecture, features, comprehensive project documentation
- **DESIGN-CHANGELOG.md**: UI/UX changes, visual design evolution
- **COMPONENT-CHANGELOG.md**: Component-specific changes and updates
- **USAGE.md**: User guides and operational instructions
- **SCREEN_SIZE_REQUIREMENTS.md**: Technical requirements

### Guides (`docs/guides/`)
- **SETUP_AND_INSTALLATION.md**: Installation and setup procedures
- **TEST_DATA.md**: Testing documentation and data generation

### Meta Documentation (`docs/meta/`)
- **BUGFIX-CHANGELOG.md**: Bug fix tracking and resolution history
- **DEBUG-METHODOLOGY-LOG.md**: Debugging procedures and methodologies
- **CONTRIBUTING.md**: Development guidelines and standards
- **LICENSE.md**: Legal and licensing information
- **ROOT-CAUSE-ANALYSIS.md**: Deep technical analysis documentation
- **SOLUTION-VERIFICATION.md**: Solution testing and verification procedures

### Technical Specifications (`docs/specs/`)
- **FOLDER_STRUCTURE.md**: Project organization and architecture
- **TECHNOLOGY_STACK.md**: Technology specifications and versions
- **CSV_SCHEMA.md**: Data format specifications
- **PACKAGING.md**: Build and distribution specifications
- **SHOW_PROCESS_FOR_FINALS.md**: Business logic documentation

### Validation Documentation (`docs/validation/`)
- **VALIDATION_CHANGELOG.md**: All validation rule changes (CRITICAL for fixes)
- **VALIDATION_CHAMPIONSHIP.md**: Championship tab validation rules
- **VALIDATION_PREMIERSHIP.md**: Premiership tab validation rules
- **VALIDATION_KITTEN.md**: Kitten tab validation rules
- **VALIDATION_HOUSEHOLD.md**: Household Pet tab validation rules
- **VALIDATION_BREED_SHEETS.md**: Breed Sheets tab validation rules
- **VALIDATION_GENERAL.md**: General tab validation rules
- **VALIDATION_OCP_RING.md**: OCP Ring cross-column validation
- **VALIDATION_SUPER_SPECIALTY.md**: Super Specialty cross-column validation

## Documentation Standards

### Changelog Entry Requirements
- **Date**: Always include date in YYYY-MM-DD format
- **Affected Components**: Clearly identify what was changed
- **Technical Details**: Include root cause, solution, files modified
- **Impact Statement**: Describe user-facing or system impact
- **Cross-References**: Link to related documentation

### Cross-Reference Maintenance
- **Update Related Docs**: When updating one document, check for related content in other docs
- **Consistent Terminology**: Use consistent terms across all documentation
- **Link Accuracy**: Verify all internal links remain valid after changes

### Documentation Quality Standards
- **Completeness**: Cover all aspects of the change
- **Accuracy**: Ensure technical details are correct
- **Clarity**: Write for appropriate audience (developer vs user)
- **Consistency**: Follow established patterns and formatting
- **Timeliness**: Update documentation immediately when changes are confirmed

## Enforcement

**Non-Negotiable Rule**: No change is considered complete until its documentation is updated. This includes:
- Code fixes without validation documentation updates
- New implementations without architectural documentation
- UI changes without design changelog entries
- Any change without appropriate changelog entries

**Quality Check**: Before marking any task complete, verify that all relevant documentation has been updated according to these rules.