# OCP Ring Cross-Column Validation Rules

This document outlines the cross-column validation rules for OCP Ring judges in Championship and Premiership tabs. OCP Ring judges create two columns (Allbreed + OCP) with the same judge ID, requiring specific cross-column validation to ensure data integrity.

## Overview

OCP Ring validation runs **AFTER** all existing validation is complete and only applies to OCP Ring judges (2 columns: Allbreed + OCP with same judge ID). The validation ensures consistency between the Allbreed and OCP columns while maintaining the integrity of both individual column validations.

## Validation Rules

### 1. Title/Award Consistency

**Rule**: The same cat number cannot have different titles across Allbreed and OCP columns.

**Championship Tab**:
- Cannot have same cat # labeled `GC` in Allbreed column and `CH` in OCP column
- Cannot have same cat # labeled `CH` in Allbreed column and `GC` in OCP column

**Premiership Tab**:
- Cannot have same cat # labeled `GP` in Allbreed column and `PR` in OCP column
- Cannot have same cat # labeled `PR` in Allbreed column and `GP` in OCP column

**Examples**:

**Championship Tab - Valid**:
```
Allbreed Column: Cat #12345 = GC
OCP Column: Cat #12345 = GC (same title)
```

**Championship Tab - Invalid**:
```
Allbreed Column: Cat #12345 = GC
OCP Column: Cat #12345 = CH (different title - ERROR)
```

**Premiership Tab - Valid**:
```
Allbreed Column: Cat #12345 = GP
OCP Column: Cat #12345 = GP (same title)
```

**Premiership Tab - Invalid**:
```
Allbreed Column: Cat #12345 = GP
OCP Column: Cat #12345 = PR (different title - ERROR)
```

**Error Message**: `Title inconsistency: Cat #12345 has different titles across OCP Ring columns`

### 2. Ranked Cats Priority

**Rule**: Filler cats (not ranked in Allbreed ring) cannot appear in OCP column before ranked cats.

**Ranked Cats Definition**:
- **Championship Tab**: CH cats in top 10/15 OR AB CH OR LH CH OR SH CH
- **Premiership Tab**: PR cats in top 10/15 OR AB PR OR LH PR OR SH PR

**Examples**:

**Championship Tab - Valid**:
```
Allbreed Column: Cat #12345 = CH (ranked)
OCP Column: Cat #12345 = CH (ranked cat appears first)
OCP Column: Cat #67890 = NOV (filler cat appears after ranked cat)
```

**Championship Tab - Invalid**:
```
Allbreed Column: Cat #12345 = CH (ranked)
OCP Column: Cat #67890 = NOV (filler cat appears before ranked cat - ERROR)
OCP Column: Cat #12345 = CH (ranked cat appears after filler cat)
```

**Premiership Tab - Valid**:
```
Allbreed Column: Cat #12345 = PR (ranked)
OCP Column: Cat #12345 = PR (ranked cat appears first)
OCP Column: Cat #67890 = NOV (filler cat appears after ranked cat)
```

**Premiership Tab - Invalid**:
```
Allbreed Column: Cat #12345 = PR (ranked)
OCP Column: Cat #67890 = NOV (filler cat appears before ranked cat - ERROR)
OCP Column: Cat #12345 = PR (ranked cat appears after filler cat)
```

**Error Message**: `Filler cat placed before ranked cats: Cat #67890 is not ranked in Allbreed column but appears in OCP before ranked cats`

### 3. Order Preservation

**Rule**: The order of specialty cats from Allbreed column sections must be preserved in OCP ranking.

**Championship Tab**:
- Order of CH cats in Show Awards (Top 10/15) should be respected in OCP ranking
- **AB CH cats must appear first in exact order in OCP ring (no fillers before AB CH cats)**
- **LH CH cats must preserve order in OCP ring (fillers allowed but order must be maintained)**
- **SH CH cats must preserve order in OCP ring (fillers allowed but order must be maintained)**

**Premiership Tab**:
- Order of PR cats in Show Awards (Top 10/15) should be respected in OCP ranking
- **AB PR cats must appear first in exact order in OCP ring (no fillers before AB PR cats)**
- **LH PR cats must preserve order in OCP ring (fillers allowed but order must be maintained)**
- **SH PR cats must preserve order in OCP ring (fillers allowed but order must be maintained)**

**Examples**:

**Championship Tab - Valid (Show Awards)**:
```
Allbreed Column Show Awards:
- Position 5: Cat #12345 = CH
- Position 6: Cat #67890 = CH
- Position 7: Cat #11111 = CH

OCP Column:
- Cat #12345 (first CH cat appears first)
- Cat #67890 (second CH cat appears second)
- Cat #11111 (third CH cat appears third)
```

**Championship Tab - Invalid (Show Awards)**:
```
Allbreed Column Show Awards:
- Position 5: Cat #12345 = CH
- Position 6: Cat #67890 = CH
- Position 7: Cat #11111 = CH

OCP Column:
- Cat #12345 (first CH cat appears first)
- Cat #11111 (third CH cat appears before second - ERROR)
- Cat #67890 (second CH cat appears after third)
```

**Championship Tab - Valid (Finals)**:
```
Allbreed Column Finals:
- Best AB CH: Cat #12345
- Best LH CH: Cat #67890
- Best SH CH: Cat #11111

OCP Column:
- Cat #12345 (AB CH appears first)
- Cat #67890 (LH CH appears second)
- Cat #11111 (SH CH appears third)
```

**Championship Tab - Invalid (Finals)**:
```
Allbreed Column Finals:
- Best AB CH: Cat #12345
- Best LH CH: Cat #67890
- Best SH CH: Cat #11111

OCP Column:
- Cat #12345 (AB CH appears first)
- Cat #11111 (SH CH appears before LH CH - ERROR)
- Cat #67890 (LH CH appears after SH CH)
```

**Championship Tab - Valid (AB CH First Rule)**:
```
Allbreed Column Finals:
- Best AB CH: Cat #11, #12, #13

OCP Column:
- Cat #11 (AB CH first)
- Cat #12 (AB CH second)
- Cat #13 (AB CH third)
- Cat #999 (filler after AB CH cats - OK)
```

**Championship Tab - Invalid (AB CH First Rule)**:
```
Allbreed Column Finals:
- Best AB CH: Cat #11, #12, #13

OCP Column:
- Cat #999 (filler before AB CH cats - ERROR)
- Cat #11 (AB CH after filler - ERROR)
- Cat #12 (AB CH second)
- Cat #13 (AB CH third)
```

**Championship Tab - Valid (LH CH Order)**:
```
Allbreed Column Finals:
- Best LH CH: Cat #21, #22, #23

OCP Column:
- Cat #21 (LH CH first)
- Cat #999 (filler allowed)
- Cat #22 (LH CH second)
- Cat #888 (filler allowed)
- Cat #23 (LH CH third)
```

**Championship Tab - Invalid (LH CH Order)**:
```
Allbreed Column Finals:
- Best LH CH: Cat #21, #22, #23

OCP Column:
- Cat #21 (LH CH first)
- Cat #23 (LH CH third before second - ERROR)
- Cat #22 (LH CH second after third)
```

**Championship Tab - Valid (SH CH Order)**:
```
Allbreed Column Finals:
- Best SH CH: Cat #31, #32, #33

OCP Column:
- Cat #31 (SH CH first)
- Cat #777 (filler allowed)
- Cat #32 (SH CH second)
- Cat #666 (filler allowed)
- Cat #33 (SH CH third)
```

**Championship Tab - Invalid (SH CH Order)**:
```
Allbreed Column Finals:
- Best SH CH: Cat #31, #32, #33

OCP Column:
- Cat #31 (SH CH first)
- Cat #33 (SH CH third before second - ERROR)
- Cat #32 (SH CH second after third)
```

**Premiership Tab - Valid (Show Awards)**:
```
Allbreed Column Show Awards:
- Position 5: Cat #12345 = PR
- Position 6: Cat #67890 = PR
- Position 7: Cat #11111 = PR

OCP Column:
- Cat #12345 (first PR cat appears first)
- Cat #67890 (second PR cat appears second)
- Cat #11111 (third PR cat appears third)
```

**Premiership Tab - Invalid (Show Awards)**:
```
Allbreed Column Show Awards:
- Position 5: Cat #12345 = PR
- Position 6: Cat #67890 = PR
- Position 7: Cat #11111 = PR

OCP Column:
- Cat #12345 (first PR cat appears first)
- Cat #11111 (third PR cat appears before second - ERROR)
- Cat #67890 (second PR cat appears after third)
```

**Premiership Tab - Valid (AB PR First Rule)**:
```
Allbreed Column Finals:
- Best AB PR: Cat #11, #12, #13

OCP Column:
- Cat #11 (AB PR first)
- Cat #12 (AB PR second)
- Cat #13 (AB PR third)
- Cat #999 (filler after AB PR cats - OK)
```

**Premiership Tab - Invalid (AB PR First Rule)**:
```
Allbreed Column Finals:
- Best AB PR: Cat #11, #12, #13

OCP Column:
- Cat #999 (filler before AB PR cats - ERROR)
- Cat #11 (AB PR after filler - ERROR)
- Cat #12 (AB PR second)
- Cat #13 (AB PR third)
```

**Premiership Tab - Valid (LH PR Order)**:
```
Allbreed Column Finals:
- Best LH PR: Cat #21, #22, #23

OCP Column:
- Cat #21 (LH PR first)
- Cat #999 (filler allowed)
- Cat #22 (LH PR second)
- Cat #888 (filler allowed)
- Cat #23 (LH PR third)
```

**Premiership Tab - Invalid (LH PR Order)**:
```
Allbreed Column Finals:
- Best LH PR: Cat #21, #22, #23

OCP Column:
- Cat #21 (LH PR first)
- Cat #23 (LH PR third before second - ERROR)
- Cat #22 (LH PR second after third)
```

**Premiership Tab - Valid (SH PR Order)**:
```
Allbreed Column Finals:
- Best SH PR: Cat #31, #32, #33

OCP Column:
- Cat #31 (SH PR first)
- Cat #777 (filler allowed)
- Cat #32 (SH PR second)
- Cat #666 (filler allowed)
- Cat #33 (SH PR third)
```

**Premiership Tab - Invalid (SH PR Order)**:
```
Allbreed Column Finals:
- Best SH PR: Cat #31, #32, #33

OCP Column:
- Cat #31 (SH PR first)
- Cat #33 (SH PR third before second - ERROR)
- Cat #32 (SH PR second after third)
```

**Premiership Tab - Valid (Finals)**:
```
Allbreed Column Finals:
- Best AB PR: Cat #12345
- Best LH PR: Cat #67890
- Best SH PR: Cat #11111

OCP Column:
- Cat #12345 (AB PR appears first)
- Cat #67890 (LH PR appears second)
- Cat #11111 (SH PR appears third)
```

**Premiership Tab - Invalid (Finals)**:
```
Allbreed Column Finals:
- Best AB PR: Cat #12345
- Best LH PR: Cat #67890
- Best SH PR: Cat #11111

OCP Column:
- Cat #12345 (AB PR appears first)
- Cat #11111 (SH PR appears before LH PR - ERROR)
- Cat #67890 (LH PR appears after SH PR)
```

**Premiership Tab - Valid (AB PR First Rule)**:
```
Allbreed Column Finals:
- Best AB PR: Cat #11, #12, #13

OCP Column:
- Cat #11 (AB PR first)
- Cat #12 (AB PR second)
- Cat #13 (AB PR third)
- Cat #999 (filler after AB PR cats - OK)
```

**Premiership Tab - Invalid (AB PR First Rule)**:
```
Allbreed Column Finals:
- Best AB PR: Cat #11, #12, #13

OCP Column:
- Cat #999 (filler before AB PR cats - ERROR)
- Cat #11 (AB PR after filler - ERROR)
- Cat #12 (AB PR second)
- Cat #13 (AB PR third)
```

**Error Messages**: 
- `Order violation: Cat #11111 is out of order in OCP. Must preserve order from Show Awards CH column`
- `Order violation: Cat #11111 is out of order in OCP. Must preserve order from AB CH column`
- `Order violation: Cat #11111 is out of order in OCP. Must preserve order from LH CH column`
- `Order violation: Cat #11111 is out of order in OCP. Must preserve order from SH CH column`
- `Filler cat #999 cannot appear before AB CH cats in OCP ring. AB CH cats must appear first in exact order.`
- `Order violation: Cat #11 is out of order in OCP. AB CH cats must appear first in exact order.`

**Premiership Tab Error Messages**:
- `Order violation: Cat #11111 is out of order in OCP. Must preserve order from Show Awards PR column`
- `Order violation: Cat #11111 is out of order in OCP. Must preserve order from AB PR column`
- `Order violation: Cat #11111 is out of order in OCP. Must preserve order from LH PR column`
- `Order violation: Cat #11111 is out of order in OCP. Must preserve order from SH PR column`
- `Filler cat #999 cannot appear before AB PR cats in OCP ring. AB PR cats must appear first in exact order.`

## Implementation Details

### Validation Order

OCP Ring cross-column validation runs **AFTER** all existing validation is complete:

1. **Existing Validation** (unchanged)
   - Individual column validation
   - Finals consistency validation
   - Super Specialty cross-column validation (if applicable)

2. **OCP Ring Cross-Column Validation** (NEW)
   - Title/Award Consistency
   - Ranked Cats Priority
   - Order Preservation

### Scope

- **Applies To**: Only OCP Ring judges (2 columns: Allbreed + OCP with same judge ID)
- **Tabs**: Championship and Premiership tabs only
- **Columns**: Allbreed column and OCP column for the same judge

### Error Placement

Errors are placed on the specific input boxes where violations occur:
- **Title Consistency**: Errors marked on both Allbreed and OCP column cells for the same cat
- **Ranked Cats Priority**: Errors marked on OCP column cells where filler cats appear before ranked cats
- **Order Preservation**: Errors marked on OCP column cells where order violations occur

### Data Sources

**Allbreed Column Data Sources**:
- Show Awards section (main placements)
- Champions/Premiers Finals sections (AB CH/PR, LH CH/PR, SH CH/PR)

**OCP Column Data Sources**:
- Show Awards section only (OCP has exactly 10 placements)

## Technical Implementation

### Function Structure

```typescript
export function validateOCPRingCrossColumn(input: ValidationInput, maxCats: number): { [key: string]: string } {
  const errors: { [key: string]: string } = {};
  
  // Only run for OCP Ring judges
  const ocpRings = findOCPRings(input.columns);
  
  for (const ringInfo of ocpRings) {
    const { allbreedColIdx, ocpColIdx } = ringInfo;
    
    // 1. Title/Award Consistency Validation
    const titleErrors = validateOCPTitleConsistency(input, allbreedColIdx, ocpColIdx);
    Object.assign(errors, titleErrors);
    
    // 2. Ranked Cats Priority Validation
    const priorityErrors = validateOCPRankedCatsPriority(input, allbreedColIdx, ocpColIdx);
    Object.assign(errors, priorityErrors);
    
    // 3. Order Preservation Validation
    const orderErrors = validateOCPOrderPreservation(input, allbreedColIdx, ocpColIdx);
    Object.assign(errors, orderErrors);
  }
  
  return errors;
}
```

### Helper Functions

- `findOCPRings()` - Identifies OCP Ring judges (2 columns with same judge ID)
- `validateOCPTitleConsistency()` - Checks title consistency between columns
- `validateOCPRankedCatsPriority()` - Ensures ranked cats appear before filler cats
- `validateOCPOrderPreservation()` - Maintains order from Allbreed column
- `collectOCPTitlesFromColumn()` - Collects titles from Show Awards and Finals sections
- `getOCPRankedCatsFromColumn()` - Identifies ranked cats from Allbreed column
- `checkOCPRankedCatsPriorityInColumn()` - Validates priority in OCP column
- `getOrderedCatsFromFinals()` - Gets ordered cats from finals sections
- `checkOCPOrderPreservationInColumn()` - Validates order preservation

## Integration

OCP Ring cross-column validation is integrated into the main validation functions:

**Championship Tab**:
```typescript
// In validateChampionshipTab()
const ocpRingErrors = validateOCPRingCrossColumn(input, maxCats);
Object.assign(errors, ocpRingErrors);
```

**Premiership Tab**:
```typescript
// In validatePremiershipTab()
const ocpRingErrors = validateOCPRingCrossColumn(input, maxCats);
Object.assign(errors, ocpRingErrors);
```

## Error Messages

All error messages follow the same pattern as Super Specialty validation for consistency:

- **Title Consistency**: `Title inconsistency: Cat #[number] has different titles across OCP Ring columns`
- **Ranked Cats Priority**: `Filler cat placed before ranked cats: Cat #[number] is not ranked in Allbreed column but appears in OCP before ranked cats`
- **Order Preservation**: `Order violation: Cat #[number] is out of order in OCP. Must preserve order from [section] column`

## Testing Scenarios

### Valid Scenarios

1. **Same titles across columns**
2. **Ranked cats appear before filler cats**
3. **Order preserved from Allbreed to OCP**
4. **No cross-column violations**

### Invalid Scenarios

1. **Different titles for same cat**
2. **Filler cats before ranked cats**
3. **Order violations from Allbreed to OCP**
4. **Multiple violations simultaneously**

## Relationship to Other Validation

- **Super Specialty Validation**: Similar patterns but adapted for 2-column structure vs 3-column structure
- **Existing Validation**: Runs after all existing validation, preserves existing logic
- **Individual Column Validation**: Unchanged, OCP Ring validation is additive

## Maintenance

This validation rule set should be updated when:
- OCP Ring structure changes
- New validation requirements are added
- Error message formats are standardized
- Integration with other validation systems changes 