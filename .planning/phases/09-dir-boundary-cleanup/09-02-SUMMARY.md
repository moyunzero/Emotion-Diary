---
phase: 09-dir-boundary-cleanup
plan: 02
subsystem: governance
tags: [shared, time-range, deprecated-cleanup, knip]

# Dependency graph
requires:
  - phase: 09-03
    provides: dateUtils migration (D-05 batch order)
provides:
  - reviewStatsTimeRange deprecated thin adapter removed
  - All time-range imports canonical at @/shared/time-range
affects: [09-01, 09-05, CLN-02]

# Tech tracking
tech-stack:
  added: []
  patterns: [thin adapter removal, import consolidation]

key-files:
  created: []
  modified: [utils/reviewStats.ts, utils/reviewExportClosingInput.ts, __tests__/unit/utils/reviewExportDerived.test.ts, __tests__/unit/utils/reviewExportClosingInput.test.ts, __tests__/unit/utils/reviewStatsTimeRange.test.ts]
  deleted: [utils/reviewStatsTimeRange.ts]

key-decisions:
  - "Remove redundant re-export consistency test from reviewStatsTimeRange.test.ts after migration (thin adapter no longer exists)"

patterns-established:
  - "Per D-05: Migrate all call sites first, then delete deprecated thin adapter in single commit"

requirements-completed: [CLN-02]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 09 Plan 02: reviewStatsTimeRange Migration Summary

**Delete utils/reviewStatsTimeRange.ts thin adapter and consolidate all time-range imports to @/shared/time-range**

## Performance

- **Duration:** ~5 min
- **Tasks:** 2
- **Files modified:** 5 modified, 1 deleted

## Accomplishments

- Migrated all reviewStatsTimeRange import sites to @/shared/time-range
- Deleted utils/reviewStatsTimeRange.ts (14 lines, pure re-export)
- Export and insight unit tests pass
- npm run verify:governance passes

## Task Commits

1. **Task 1: Migrate all reviewStatsTimeRange imports to shared/time-range** - `aa44cb4` (feat)
2. **Task 2: Delete utils/reviewStatsTimeRange.ts and tighten allowlist** - `a03b703` (feat)

**Rollback point:** Revert `a03b703` and `aa44cb4` to restore utils/reviewStatsTimeRange.ts.

## Files Created/Modified

- `utils/reviewStats.ts` - getCalendarMonthRange from @/shared/time-range
- `utils/reviewExportClosingInput.ts` - ReviewExportPreset type from @/shared/time-range
- `__tests__/unit/utils/reviewExportDerived.test.ts` - getReviewExportPeriods from @/shared/time-range
- `__tests__/unit/utils/reviewExportClosingInput.test.ts` - getReviewExportPeriods from @/shared/time-range
- `__tests__/unit/utils/reviewStatsTimeRange.test.ts` - import from @/shared/time-range, removed redundant re-export consistency test
- `utils/reviewStatsTimeRange.ts` - **deleted**

## Decisions Made

- Removed "keeps old entry and shared canonical output consistent" test from reviewStatsTimeRange.test.ts; it compared thin adapter output to shared output, redundant after migration.
- allowlist.knip.json required no changes (no historicalDebt entries for reviewStatsTimeRange).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- CLN-02 partial: reviewStatsTimeRange deprecated cleared
- Ready for 09-05 or remaining dir-boundary-cleanup work

## Self-Check: PASSED

- 09-02-SUMMARY.md exists
- Commits aa44cb4, a03b703 present
- utils/reviewStatsTimeRange.ts deleted

---
*Phase: 09-dir-boundary-cleanup*
*Completed: 2026-03-22*
