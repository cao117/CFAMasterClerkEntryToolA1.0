# CSV Export Void Representation Question

## Question to Address During CSV Export Implementation

When implementing CSV save/export functionality, the following question needs to be answered:

**How should voided placements be represented in CSV export?**

### Options to Consider:
1. **Separate "VOID" column**: Add a boolean column indicating if each placement is voided
2. **Modify existing fields**: Replace cat number with "VOID" text when voided
3. **Special marker**: Use a special character or prefix in existing fields
4. **Additional metadata**: Include void information in a separate metadata section

### Context:
- Void feature allows marking placements as "voided" when cats win awards but are not present to receive them
- Voiding does not affect validation rules
- Need to ensure CSV export accurately represents voided state for downstream processing

### Implementation Trigger:
This question should be addressed whenever CSV save/export functionality is being implemented or modified.

### Related Files:
- `src/components/ChampionshipTab.tsx` - Contains void state management
- `src/validation/championshipValidation.ts` - Contains void data structures
- `src/utils/formActions.ts` - Contains CSV export functions (to be updated)

---

**Note**: This file serves as a reminder to address the void representation question during CSV export implementation. The question should be resolved based on the specific requirements of the CSV format and downstream processing needs. 