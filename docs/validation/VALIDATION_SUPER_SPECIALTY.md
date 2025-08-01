# Super Specialty Cross-Column Validation Rules

This document describes the **cross-column validation rules** for Super Specialty rings in the CFA Master Clerk Entry Tool.

## Overview

Super Specialty rings consist of three columns with the same judge ID:
- **Longhair column**: Judges all long hair cats and gives placements
- **Shorthair column**: Judges all short hair cats and gives placements  
- **Allbreed column**: Combines both long hair and short hair cats for final placements

## Validation Scope

Super Specialty cross-column validation **ONLY** applies to:
- Rings with exactly 3 columns (Longhair + Shorthair + Allbreed) with the same judge ID
- Each Super Specialty ring is validated independently
- Cross-ring validation is NOT required

## Validation Order

Super Specialty cross-column validation runs **AFTER** all existing validation is complete:

1. **Existing Validation** (unchanged):
   - Format/Range validation
   - Duplicate detection
   - Sequential entry validation
   - Status validation
   - Cross-section validation

2. **Super Specialty Cross-Column Validation** (NEW):
   - Title/Award Consistency
   - Ranked Cats Priority
   - Order Preservation Within Hair Length
   - Specialty Finals Consistency
   - Cross-Column Duplicate Prevention

## Validation Rules

### 1. Title/Award Consistency

**Rule**: If the same cat number appears in different Super Specialty columns, the title/award (GC/CH/PR/NOV/KIT) must be consistent across all columns.

**Implicit Title Assignments**:
- Cats in "Best LH CH" section are implicitly CH
- Cats in "Best SH CH" section are implicitly CH  
- Cats in "Best AB CH" section are implicitly CH
- Cats in "Best LH PR" section are implicitly PR
- Cats in "Best SH PR" section are implicitly PR
- Cats in "Best AB PR" section are implicitly PR

**Examples**:
- **Valid**: Cat #123 is GC in Longhair column and GC in Allbreed column
- **Invalid**: Cat #123 is GC in Longhair column but CH in Allbreed column
- **Invalid**: Cat #456 is in "Best LH CH" section but GC in Allbreed column
- **Invalid**: Cat #789 is in "Best SH PR" section but CH in Allbreed column

**Error Messages**: 
- `"Title inconsistency: Cat #[number] has different titles across Super Specialty columns"`
- `"Title inconsistency: Cat #[number] is implicitly CH in [section] but has different title in other columns"`
- `"Title inconsistency: Cat #[number] is implicitly PR in [section] but has different title in other columns"`

**Error Display**: Error shown under ALL cells containing the inconsistent cat across all columns

### 2. Ranked Cats Priority

**Rule**: Filler cats (cats not ranked in specialty columns) cannot be placed before ranked cats in the Allbreed column.

**Examples**:
- **Valid**: All ranked cats from Longhair/Shorthair placed first, then filler cats
C

**Error Message**: `"Filler cat placed before ranked cats: Cat #[number] is not ranked in specialty columns but appears in Allbreed before ranked cats"`

**Error Display**: Error shown under the filler cat cell in Allbreed column

### 3. Order Preservation Within Hair Length

**Rule**: Cats from specialty columns must maintain their relative order when appearing in the Allbreed column.

**Examples**:
- **Valid**: Longhair cats [1, 2, 3] appear as [1, 2, 3] in Allbreed (with other cats in between)
- **Valid**: Longhair cats [1, 2, 3] appear as [1, 5, 2, 4, 3] in Allbreed (order preserved, others in between)
- **Invalid**: Longhair cats [1, 2, 3] appear as [2, 1, 3] in Allbreed (order violated)

**Error Message**: `"Order violation: [cat] is out of order in Allbreed. Must preserve order from [hairLength] column"`

**Error Display**: Error shown under the out-of-order cat cell in Allbreed column

### 4. Specialty Finals Consistency

**Rule**: Cats ranked in specialty columns must appear in the Allbreed column with the same titles and positions.

**Examples**:
- **Valid**: Cat #1 is "Best LH CH" in Longhair column and "Best LH CH" in Allbreed column
- **Valid**: Cat #3 is "2nd Best LH CH" in Longhair column and "2nd Best LH CH" in Allbreed column
- **Valid**: Cat #4 is "Best SH CH" in Shorthair column and "Best SH CH" in Allbreed column
- **Invalid**: Cat #1 is "Best LH CH" in Longhair column but Cat #2 is "Best LH CH" in Allbreed column
- **Invalid**: Cat #3 is "2nd Best LH CH" in Longhair column but Cat #4 is "2nd Best LH CH" in Allbreed column
- **Invalid**: Cat #4 is "Best SH CH" in Shorthair column but missing from "Best SH CH" section in Allbreed column

**Error Messages**:
- `"Missing Longhair finals cat: Cat #[number] from Longhair column should appear as Best LH CH"`
- `"Missing Longhair finals cat: Cat #[number] from Longhair column should appear as 2nd Best LH CH"`
- `"Missing Shorthair finals cat: Cat #[number] from Shorthair column should appear as Best SH CH"`

**Error Display**: Error shown under the specific mismatched position in Allbreed column finals section

### 5. Cross-Column Duplicate Prevention

**Rule**: A cat number cannot appear in both Longhair and Shorthair columns within the same Super Specialty ring.

**Examples**:
- **Valid**: Cat #1 in Longhair column, Cat #2 in Shorthair column
- **Valid**: Cat #3 in Longhair column, Cat #4 in Shorthair column
- **Invalid**: Cat #1 in both Longhair and Shorthair columns
- **Invalid**: Cat #5 in both Longhair and Shorthair columns

**Error Message**: `"Duplicate: Cat #[number] cannot be both longhair and shorthair"`

**Error Display**: Error shown under ALL instances of the duplicate cat (both in Longhair and Shorthair columns)

## Hair Length Category Respect

**Rule**: Hair length categories must be respected in Allbreed column placements.

- **Longhair placements in Allbreed**: Can only contain cats from Longhair column
- **Shorthair placements in Allbreed**: Can only contain cats from Shorthair column

This is enforced by the existing validation rules and is not part of the cross-column validation.

## Error Display Strategy

### Cross-Column Errors
For cross-column validation errors, the error is displayed under **ALL** offending input boxes:

- **Title Consistency Errors**: Error shown under the cat number input in Longhair column AND the cat number input in Allbreed column
- **Ranked Cats Priority Errors**: Error shown under the filler cat cell in Allbreed column
- **Order Preservation Errors**: Error shown under the out-of-order cat cell in Allbreed column
- **Specialty Finals Consistency Errors**: Error shown under the specific mismatched position in Allbreed column finals section
- **Cross-Column Duplicate Prevention Errors**: Error shown under ALL instances of the duplicate cat (both in Longhair and Shorthair columns)

### Error Precedence
Super Specialty cross-column errors have **lower precedence** than existing validation errors:

1. **Existing validation errors** (highest priority)
2. **Super Specialty cross-column errors** (lower priority)

If a cell has both an existing validation error and a Super Specialty cross-column error, only the existing validation error is displayed.

## Implementation Details

### Function Structure
```typescript
export function validateSuperSpecialtyCrossColumn(
  input: ValidationInput, 
  maxCats: number
): { [key: string]: string }
```

### Integration
Super Specialty validation is integrated into the main validation functions as the final step:

```typescript
// Existing validation (unchanged)
const existingErrors = validateExistingRules(input, maxCats);

// Super Specialty cross-column validation (NEW)
const superSpecialtyErrors = validateSuperSpecialtyCrossColumn(input, maxCats);

// Merge errors (existing errors take precedence)
Object.assign(errors, superSpecialtyErrors);
```

### Ring Detection
Super Specialty rings are detected by:
1. Grouping columns by judge ID
2. Finding groups with exactly 3 columns
3. Verifying the columns are Longhair, Shorthair, and Allbreed

## Tab-Specific Adaptations

### Championship Tab
- **Title validation**: GC, CH, NOV statuses
- **Finals sections**: Includes Best AB CH, Best LH CH, Best SH CH sections
- **Validation scope**: Show Awards and Finals sections

### Premiership Tab  
- **Title validation**: GP, PR, NOV statuses
- **Finals sections**: Includes Best AB PR, Best LH PR, Best SH PR sections
- **Validation scope**: Show Awards and Finals sections

### Kitten Tab
- **Title validation**: KIT status only
- **Finals sections**: None (Kitten only has Show Awards)
- **Validation scope**: Show Awards section only
- **Applicable SSP rules**: Title/Award Consistency, Ranked Cats Priority, Order Preservation Within Hair Length, Cross-Column Duplicate Prevention
- **Non-applicable SSP rules**: Specialty Finals Consistency (no finals sections)

## Testing Scenarios

### Valid Super Specialty Ring
- Longhair column: [Cat 1 (GC), Cat 2 (CH), Cat 3 (NOV)]
- Shorthair column: [Cat 4 (GC), Cat 5 (CH), Cat 6 (NOV)]
- Allbreed column: [Cat 1 (GC), Cat 4 (GC), Cat 2 (CH), Cat 5 (CH), Cat 3 (NOV), Cat 6 (NOV)]

### Invalid Title Consistency
- Longhair column: [Cat 1 (GC)]
- Allbreed column: [Cat 1 (CH)] → **ERROR**

### Invalid Ranked Cats Priority
- Longhair column: [Cat 1 (GC), Cat 2 (CH)]
- Allbreed column: [Cat 3 (filler), Cat 1 (GC), Cat 2 (CH)] → **ERROR**

### Invalid Order Preservation
- Longhair column: [Cat 1 (GC), Cat 2 (CH)]
- Allbreed column: [Cat 2 (CH), Cat 1 (GC)] → **ERROR**

### Invalid Cross-Column Duplicate Prevention
- Longhair column: [Cat 1 (GC), Cat 2 (CH)]
- Shorthair column: [Cat 1 (GC), Cat 3 (CH)] → **ERROR** (Cat #1 appears in both columns)

## Performance Considerations

- **Efficient detection**: Super Specialty rings are detected once per validation cycle
- **Selective validation**: Only Super Specialty rings undergo cross-column validation
- **Error merging**: Cross-column errors are merged with existing errors efficiently
- **Minimal impact**: Existing validation performance is unaffected

## Future Enhancements

Potential future enhancements for Super Specialty validation:
- **Cross-ring validation**: Validation between different Super Specialty rings
- **Advanced order preservation**: More sophisticated order preservation rules
- **Performance optimization**: Further optimization for large numbers of Super Specialty rings
- **User interface**: Enhanced error display and user guidance for Super Specialty validation

---

*Last Updated: 2025-07-31 19:04:38* 