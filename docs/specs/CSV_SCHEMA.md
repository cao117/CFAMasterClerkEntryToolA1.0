# CSV Schema

## Columns
- Show Date, Club Name, Master Clerk, Judges, Ring Types, Cat Numbers, Results, etc.

## Sample Payload
```
Show Date,Club Name,Master Clerk,Judge Name,Ring Type,Cat #,Placement
2025/06/14,Example Club,Jane Doe,aaa,Double Specialty,101,1st
```

## Parsing Rules
- Use PapaParse for robust CSV import/export
- Validate required fields 

### Household Pet Section

The household section includes:
- `householdPetCount`: integer
- `placements`: array of placement rows, each with a label and columns array (one per judge/ring)
- Each cell contains `catNumber`, `status`, and `voided` fields, matching the structure of other tabular sections.
- All placements, including empty and voided, are included and exported.
- The section is separated by a blank row and a section label.

**Restoreability:**
- The household section is now fully restoreable and included in the export/import logic, with data lifted to App state for reliability. 

## Key Format for Placements and Voids
All placement and voided keys use hyphens (e.g., '0-0') for column-row addressing. This is required for CSV export compatibility. Do not use underscores.

## Household Pet Section Always Exported
The household section is always included in the CSV export, even if empty, to ensure schema and restoreability consistency. 

## Finals Row Labels
Finals rows in the Championship and Premiership sections use user-facing labels in the CSV:
- Championship: 'Best AB CH', '2nd Best AB CH', ..., 'Best LH CH', ..., 'Best SH CH', ...
- Premiership: 'Best AB PR', '2nd Best AB PR', ..., 'Best LH PR', ..., 'Best SH PR', ...
These labels are required for correct restoreability and must match the UI and schema. 

## Finals Row Mapping Fix
The Championship finals rows ('Best AB CH', 'Best LH CH', 'Best SH CH', etc.) are now always written to the CSV for each judge/column, using the correct mapping from the state finals objects ('championsFinals', 'lhChampionsFinals', 'shChampionsFinals').
The mapping logic uses the finals row index modulo 5 to select the correct key for each section, ensuring the correct cat number is written for each position and judge. 

## Defensive Extraction for Placements/Finals
All placement and finals cells are now exported using a defensive extractCell logic, which handles string, object, or undefined values. This ensures all user input is written to the CSV, regardless of storage format.

## Empty Cell Formatting
When a placement cell has no cat number input, the CSV exports just "-" instead of "- [status]" because the status is meaningless without a cat number. This applies to all tabular sections (Championship, Premiership, Kitten, Household Pet).

## Developer Note
See excelExport.ts for the extractCell function, which prevents blank or missing data in the export. 