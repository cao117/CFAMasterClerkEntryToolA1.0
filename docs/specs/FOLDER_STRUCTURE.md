# Folder Structure

- `src/` - Main application source code (React components, hooks, utils)
- `src-tauri/` - Tauri backend and config
- `public/` - Static assets
- `docs/` - Project documentation
- `tests/` - Test files and fixtures
- `dist/` - Production build output

Follow conventions for naming and organization. New features go in `src/` as components or modules. 

## Folder Structure

## Shared CSV Action Buttons

- The following action buttons are present on all tabs (General, Championship, Kittens, Premiership, Household Cats):
  - Save to Temp CSV
  - Generate Final CSV
  - Restore from CSV
  - Reset
- These buttons always operate on the full dataset (all tabs), not just the current tab.
- The logic for these buttons is shared and implemented in `src/utils/formActions.ts`.

## Premiership Tab UI/UX Parity

- The Premiership tab uses the same UI/UX structure and shared logic as the Championship tab:
  - Jump to Ring dropdown
  - Sticky headers and frozen position column
  - Paging/scrolling for large numbers of judges
  - Voiding, error highlighting, and tooltips
  - Accessibility and keyboard navigation features
- Only the rules for eligibility, breakpoints, and award labels differ.
- This parity is enforced in both code and documentation.

## Tab State Management (as of 1.0.10)

- All state for Championship and Premiership tabs (cat numbers, statuses, voids, errors, etc.) is now managed in `App.tsx`.
- State is passed to each tab as props, ensuring that data is preserved when switching between tabs.
- Each tab has its own reset handler, which only clears its own data, not the other tab or global state.
- Data is only reset when the user clicks the reset button on that tab, not when switching tabs.
- This ensures a seamless user experience and prevents accidental data loss when navigating between tabs.

## 2024-06-21: State Management Update
- ChampionshipTab now uses fully lifted state, with all data managed in App.tsx and passed as props (like PremiershipTab).
- There is no local state for championship data; all updates and resets are handled by the parent.
- This ensures data is preserved across tab switches for both tabs.

## 2024-06-21: UI Border Color Update
- All colored border logic (orange/navy blue) removed from ChampionshipTab.
- Only red border is used for validation errors; default border otherwise.
- This matches PremiershipTab.

```
99_Cursor_CFA_ENTRY/
├── docs/                          # Documentation files
│   ├── CHANGELOG.md              # Version history and changes
│   ├── CONTRIBUTING.md           # Contribution guidelines
│   ├── CSV_SCHEMA.md            # CSV file format specifications
│   ├── FOLDER_STRUCTURE.md      # This file - project organization
│   ├── LICENSE.md               # Project license information
│   ├── PACKAGING.md             # Build and packaging instructions
│   ├── PROJECT_OVERVIEW.md      # High-level project description
│   ├── SETUP_AND_INSTALLATION.md # Setup instructions
│   ├── TECHNOLOGY_STACK.md      # Technology choices and rationale
│   ├── TEST_DATA.md             # Test data generation documentation
│   └── USAGE.md                 # User guide and feature documentation
├── public/                       # Static assets
│   └── vite.svg                 # Vite logo
├── src/                         # Source code
│   ├── assets/                  # Static assets (images, fonts, etc.)
│   │   ├── cfa-logo.png         # CFA logo
│   │   └── react.svg            # React logo
│   ├── components/              # React components
│   │   ├── ChampionshipTab.tsx  # Championship data entry form
│   │   ├── GeneralTab.tsx       # General show information form
│   │   ├── Modal.tsx            # Reusable modal component
│   │   ├── ToastContainer.tsx   # Toast notification container
│   │   └── ToastNotification.tsx # Individual toast notification
│   ├── hooks/                   # Custom React hooks
│   │   └── useToast.ts          # Toast notification management hook
│   ├── utils/                   # Shared utility functions
│   │   └── formActions.ts       # Common action button handlers (Save, Generate, Restore, Reset)
│   ├── validation/              # Validation logic modules
│   │   ├── generalValidation.ts # General tab validation functions
│   │   └── championshipValidation.ts # Championship tab validation functions
│   ├── App.tsx                  # Main application component
│   ├── index.css               # Global styles and Tailwind imports
│   ├── main.tsx                # Application entry point
│   └── vite-env.d.ts           # Vite environment type definitions
├── src-tauri/                   # Tauri (desktop app) configuration
│   ├── capabilities/            # Tauri permissions and capabilities
│   ├── icons/                   # Application icons for different platforms
│   ├── src/                     # Rust backend code
│   │   ├── lib.rs              # Library entry point
│   │   └── main.rs             # Main application entry point
│   ├── build.rs                # Build script
│   ├── Cargo.toml              # Rust dependencies and metadata
│   └── tauri.conf.json         # Tauri configuration
├── yyy/                         # Legacy implementation (reference)
│   └── cfa-tool/               # Original JavaScript implementation
│       ├── ChampionshipTab.md  # Legacy championship documentation
│       ├── GeneralTab.md       # Legacy general tab documentation
│       ├── csv-handler.js      # Legacy CSV handling
│       ├── form-validation.js  # Legacy validation logic
│       ├── index.html          # Legacy HTML interface
│       ├── jquery.js           # jQuery library
│       ├── table-handler.js    # Legacy table management
│       └── test-data.js        # Legacy test data generation
├── .cursor/                     # Cursor IDE configuration
├── .gitignore                   # Git ignore patterns
├── eslint.config.js            # ESLint configuration
├── index.html                  # Main HTML file
├── package.json                # Node.js dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── README.md                   # Project overview and quick start
├── structure.md                # Project structure overview
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.app.json           # TypeScript app configuration
├── tsconfig.json               # Main TypeScript configuration
├── tsconfig.node.json          # TypeScript Node.js configuration
└── vite.config.ts              # Vite build tool configuration
```

### Key Directories Explained

#### `/src/components/`
Contains all React UI components. Each component focuses on rendering and user interaction, with business logic extracted to separate modules.

#### `/src/validation/` ⭐ **New**
**Purpose**: Centralized validation logic for maintainability and reusability
- **Household Cats validation**: See `docs/validation/VALIDATION_HOUSEHOLD.md` for rules (to be implemented).
