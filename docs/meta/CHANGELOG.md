# Project Changelog

This changelog records major changes to the CFA Master Clerk Entry Tool, including validation rule changes, documentation restructuring, and feature additions.

## Validation Rule Change Log

### [2024-12-19] Championship Tab: Hair-Specific Breakpoint Implementation
- **Area:** ChampionshipTab.tsx, GeneralTab.tsx, championshipValidation.ts
- **Change:** Implemented hair-specific breakpoint logic for championship cats. The system now calculates breakpoints based on ring type:
  - **Allbreed Rings**: Use total championship cats (GC + CH + NOV) for breakpoint
  - **Longhair Rings**: Use LH championship cats (LH GC + LH CH) for breakpoint  
  - **Shorthair Rings**: Use SH championship cats (SH GC + SH CH) for breakpoint
  - Updated General Tab to include separate LH GC and SH GC input fields
  - Updated validation functions to use ring-specific breakpoints
  - Updated UI to dynamically enable/disable positions based on ring-specific breakpoints
  - Updated test data generation to respect ring-specific breakpoints
- **Rationale:** Corrects the breakpoint calculation to match CFA rules where specialty rings (Longhair/Shorthair) use hair-specific championship counts for breakpoint determination, not the total championship count. This ensures proper position availability and validation per ring type.

### [2024-06-09] Allbreed Best CH → LH/SH Split (Test Data Generation)
- **Area:** ChampionshipTab.tsx (test data generation)
- **Change:** Updated logic to split Best CH cats into LH/SH using the odd/even rule (odd = LH, even = SH) for test data population. All Best CH cats are now assigned to either LH or SH, and only fillers are used if there are more positions than cats.
- **Rationale:** Ensures test data always matches intended validation logic and passes validation. Prevents missing Best CH cats in LH/SH split and aligns with user requirements.

### [2024-06-09] Validation Info Box Removed
- **Area:** ChampionshipTab.tsx (UI)
- **Change:** Removed the static 'Validation Rules' info box from the Championship tab UI. Users now rely solely on inline error messages for guidance.
- **Rationale:** Reduces UI clutter and encourages users to use error messages for understanding validation failures.

### [2024-06-09] Documentation Restructuring
- **Area:** docs/
- **Change:** Grouped all markdown documentation into subfolders: validation, guides, specs, meta. Recreated missing validation markdowns and changelog.
- **Rationale:** Improves organization, maintainability, and clarity of project documentation.

## Other Recent Changes
- See git history for code-level changes and feature additions.

## Last Updated
- 2024-06-09 

## 2024-06-19
- UI/UX: Championship tab now renders only the number of rows needed for each column/section, per ring type and championship count. No extra rows are shown for columns that do not need them (e.g., SH ring with <85 cats only shows 10 Show Awards rows and 3 Best SH CH rows). This ensures the UI always matches the correct CFA logic and prevents user confusion.
- Void functionality in Championship tab is now column-local: voiding a cat number only affects all instances of that cat number within the same column (judge/ring), not across all columns. This improves accuracy and matches show logic.
- Championship count calculation for Allbreed rings corrected: novices (NOV) are now excluded from breakpoint calculations. Only championship cats (GC + CH) are used to determine position availability, aligning with CFA rules. 