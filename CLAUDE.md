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