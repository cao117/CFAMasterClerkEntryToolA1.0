# Folder Structure

- `src/` - Main application source code (React components, hooks, utils)
- `src-tauri/` - Tauri backend and config
- `public/` - Static assets
- `docs/` - Project documentation
- `tests/` - Test files and fixtures
- `dist/` - Production build output

Follow conventions for naming and organization. New features go in `src/` as components or modules. 

## Folder Structure

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
- **`generalValidation.ts`**: All validation functions for the General tab (form validation, judge validation, count validation)
- **`championshipValidation.ts`**: All validation functions for the Championship tab (cat number validation, sequential entry, duplicate checking, relationship validations)
- **Benefits**: 
  - Easy to test individual validation functions
  - Reusable across multiple components
  - Clear separation of validation logic from UI logic
  - Type-safe with comprehensive interfaces

#### `/src/utils/` ⭐ **New**
**Purpose**: Shared utility functions and common functionality
- **`formActions.ts`**: Common action button handlers (Save to Temp CSV, Generate Final CSV, Restore from CSV, Reset)
- **Benefits**:
  - DRY principle implementation - no code duplication
  - Consistent behavior across tabs
  - Easy to modify common functionality in one place

#### `/src/hooks/`
Custom React hooks for state management and side effects. Currently contains toast notification management.

#### `/docs/`
Comprehensive documentation covering all aspects of the project, from setup to usage to contribution guidelines.

#### `/yyy/` (Legacy)
Contains the original JavaScript implementation for reference. This helps understand the requirements and serves as a specification for the React implementation.

#### `/src-tauri/`
Configuration and backend code for the Tauri desktop application wrapper, allowing the web app to run as a native desktop application.

### Architecture Principles

1. **Separation of Concerns**: UI components, validation logic, and utility functions are clearly separated
2. **Code Reusability**: Common functionality is extracted into shared modules
3. **Type Safety**: Comprehensive TypeScript interfaces ensure data integrity
4. **Maintainability**: Clear folder structure makes it easy to find and modify code
5. **Testability**: Extracted functions can be easily unit tested

### Code Organization Best Practices

- **Components**: Focus on rendering and user interaction
- **Validation**: Pure functions for data validation, easily testable
- **Utils**: Shared functionality used across multiple components
- **Hooks**: Reusable state logic and side effects
- **Types**: Comprehensive interfaces for type safety 