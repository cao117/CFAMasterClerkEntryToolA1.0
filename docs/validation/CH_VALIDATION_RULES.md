# Championship Validation — Rules, Execution Order, SSP Impact, Regression Coverage

Exhaustive catalog of every validation rule on the Championship form, **in order of execution**, from `src/validation/championshipValidation.ts`. Premiership (`premiershipValidation.ts`) mirrors this structure. See also `VALIDATION_SUPER_SPECIALTY.md` and `VALIDATION_CHANGELOG.md`.

## Execution plan — `validateChampionshipTab(input, maxCats)` runs 5 phases
1. **Show Awards (Top 10/15)** — per column (range → duplicate → sequential).
2. **Finals** (champions / lhChampions / shChampions) — per section × column (range → duplicate → cross-section duplicate → status → sequential → order → assignment reminder).
3. **Per-column relationships** — `validateColumnRelationships` per column (AB CH status/sequential/order; LH/SH status; filler + order; single-specialty strict).
4. **OCP cross-column** — `validateOCPRingCrossColumn` (only OCP rings).
5. **Super Specialty cross-column** — `validateSuperSpecialtyCrossColumn` (only SSP rings).

Per-cell precedence: range/duplicate → status → sequential → order → reminder (a lower-priority rule skips a cell that already has a higher-priority error). Phases 4–5 run last and only set errors where none exist.

## Rules (execution order)

| # | Rule | Source (fn) | Scope | SSP-specific? | Affected by 3-col split? |
|---|------|-------------|-------|---------------|--------------------------|
| 1 | Show-awards range | section loop | per cell | No | No |
| 2 | Show-awards duplicate | section loop | per column | No | No |
| 3 | Show-awards sequential | section loop | per column | No | No |
| 4 | Finals range | section loop | per cell | No | No |
| 5 | Finals duplicate within section | section loop | per column/section | No | No |
| 6 | Cross-section dup (cat in both LH CH & SH CH) | section loop | same column | Partly | **Yes** — no-ops for SSP; indirectly covered by #21; intentionally skipped |
| 7 | Finals status (GC/NOV can't be CH final) | section loop | per cell vs own column | No | No |
| 8 | Finals sequential | section loop | per column/section | No | No |
| 9 | AB CH order ("Must be X, Nth CH required") | `validateBestCHWithTop15` | AB column | No | No |
| 10 | LH/SH CH order (subsequence of AB CH) | `validateBestHairCHOrder` | AB↔specialty | **Yes** | **Yes — fixed (MCE-4)** |
| 11 | Assignment reminder (AB CH cat in LH/SH) | `isCatInSpecialtyCHFinal` | AB↔specialty | **Yes** | **Yes — fixed (MCE-3)** |
| 12 | AB CH status | `validateColumnRelationships` | AB column | No | No |
| 13 | AB CH sequential | `validateColumnRelationships` | AB column | No | No |
| 14 | AB CH order (dup of #9) | `validateColumnRelationships` | AB column | No | No |
| 15 | LH CH status | `validateColumnRelationships` | lhChampionsFinals[col] | No | Harmless (validated on LH specialty col) |
| 16 | SH CH status | `validateColumnRelationships` | shChampionsFinals[col] | No | Harmless (validated on SH specialty col) |
| 17 | LH/SH filler + order | `validateBestHairCHWithFiller` | AB↔specialty | **Yes** | **Yes — fixed (MCE-4)** |
| 18 | LH/SH order (dup of #10/#17) | `validateBestHairCHOrder` | AB↔specialty | **Yes** | **Yes — fixed (MCE-4)** |
| 19 | Single-specialty strict (LH/SH vs specialty top-15) | `validateSingleSpecialtyCHWithTop15` | specialty column | runs on SSP specialty cols | Correct — validates within the specialty column |
| 20 | OCP title consistency | `validateOCPTitleConsistency` | AB↔OCP | No (OCP-only) | No |
| 21 | OCP ranked-cats priority | `validateOCPRankedCatsPriority` | AB↔OCP | No (OCP-only) | No |
| 22 | OCP order preservation | `validateOCPOrderPreservation` | AB↔OCP | No (OCP-only) | No |
| 23 | SSP title consistency | `validateTitleConsistencyCH` | LH/SH/AB | Yes | SSP-aware ✓ |
| 24 | SSP ranked-cats priority (show awards) | `validateRankedCatsPriorityCH` | LH/SH/AB show awards | Yes | SSP-aware ✓ |
| 25 | SSP order preservation (show awards) | `validateOrderPreservationCH` | LH/SH/AB show awards | Yes | SSP-aware ✓ |
| 26 | SSP cross-column duplicate (show awards) | `validateCrossColumnDuplicatesCH` | LH/SH show awards | Yes | SSP-aware ✓ |
| — | ~~SSP specialty finals consistency~~ | *(removed MCE-3)* | — | Yes | Removed — vacuous (empty live / copy on import) |

## SSP impact summary
- **Affected & fixed:** #10, #11, #17, #18 + the removed finals-consistency.
- **Affected gap, indirectly covered, intentionally skipped:** #6.
- **Run on SSP specialty columns but correct:** #15, #16, #19, Phase-1 show-awards rules.
- **SSP cross-column suite (#23–26):** SSP-specific by design, show-awards-based, already correct.
- **Not SSP-related:** #1–5, #7–9, #12–14 (per-cell/per-column/AB-internal); #20–22 (OCP-only).
- **Root cause of the affected ones:** validators built for the single-column Allbreed ring read the AB column's own LH/SH sub-sections, empty during live entry. Fix: read LH/SH from the specialty columns and the AB list from the sibling AB column.

## Regression coverage (`npm test`, ts-jest + jsdom — 65 tests)
| Test file | Covers | Count |
|-----------|--------|-------|
| `src/validation/chValidationMatrix.test.ts` | All 21 distinct CH rules, trigger + clean each | 21 |
| `src/validation/sspReminder.test.ts` | SSP reminder/order/filler (CH+PR), no-false-inconsistency, live≡import equivalence, edges (voids, 5-position, multi-ring, mixed-ring offsets, per-class single-AB) | 23 |
| `src/utils/ringTypeUtils.test.ts` | per-class resolver, `generateColumnsForTab`, `remapColumnKeyedData` | 12 |
| `src/utils/sspRoundTrip.test.ts` | per-class SSP Excel export→import round-trip | 2 |

**Caveats:** one trigger + one clean per rule (not exhaustive boundary/combinatorial per rule); Premiership has SSP cases but no full per-rule matrix; tests are not yet wired into CI (deploy workflows run `npm ci` + build only).
