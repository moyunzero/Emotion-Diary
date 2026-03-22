---
phase: 09-dir-boundary-cleanup
plan: 03
subsystem: infra
tags: [expo, react-native, knip, formatting, dateUtils, shared]

requires:
  - phase: 09-dir-boundary-cleanup
    provides: "09-04 responsiveUtils removal completed (D-05 ordering)"
provides:
  - "All formatDateChinese call sites import from @/shared/formatting"
  - "dateUtils exports only formatDate + ensureMilliseconds"
affects:
  - "09-02 reviewStatsTimeRange cleanup"
  - "09-05 validation sweep"

tech-stack:
  added: []
  patterns:
    - "App code imports Chinese date strings from @/shared/formatting; utils/dateUtils stays for ISO dates and ms normalization"

key-files:
  created: []
  modified:
    - utils/dateUtils.ts
    - utils/aiService.ts
    - components/EntryCard.tsx
    - components/Dashboard.tsx
    - components/Insights/EmotionReleaseArchive.tsx
    - components/ReviewExport/ReviewExportCanvas.tsx
    - services/companionDaysService.ts
    - __tests__/unit/utils/dateUtils.test.ts
    - __tests__/unit/utils/utilityFunctionTypes.test.ts

key-decisions:
  - "Removed Phase-7 thin adapters from dateUtils; duplicated formatting assertions live in shared/formatting tests only"

patterns-established:
  - "New Chinese or M/D formatting: import from @/shared/formatting, not utils/dateUtils"

requirements-completed: [CLN-02]

duration: 15min
completed: 2026-03-22
---

# Phase 9 Plan 03: dateUtils deprecated cleanup Summary

**Chinese and month-day formatting now come only from `@/shared/formatting`; `utils/dateUtils` keeps `formatDate` and `ensureMilliseconds` for store and ISO paths.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-22T05:10:00Z (approx.)
- **Completed:** 2026-03-22T05:25:00Z (approx.)
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Migrated six production paths (plus `companionDaysService` path alias) to `@/shared/formatting` for `formatDateChinese`.
- Deleted deprecated `formatDateChinese` / `formatDateShort` re-exports from `dateUtils`; trimmed unit tests accordingly.
- `yarn test:unit` (targeted) and `npm run verify:governance` pass.

## Task Commits

1. **Task 1: Migrate formatDateChinese and formatDateShort callers to shared/formatting** — `240df33` (feat)
2. **Task 2: Remove deprecated from dateUtils and update tests** — `075ede3` (refactor)

**Plan metadata:** docs commit `docs(09-03): complete dateUtils migration plan` (this SUMMARY + STATE + ROADMAP)

## Files Created/Modified

- `utils/aiService.ts` — `formatDateChinese` from `@/shared/formatting`
- `components/EntryCard.tsx` — same
- `components/Insights/EmotionReleaseArchive.tsx` — same
- `components/ReviewExport/ReviewExportCanvas.tsx` — same
- `components/Dashboard.tsx` — same
- `services/companionDaysService.ts` — `@/shared/formatting` import path
- `utils/dateUtils.ts` — only `formatDate`, `ensureMilliseconds`
- `__tests__/unit/utils/dateUtils.test.ts` — `ensureMilliseconds` only
- `__tests__/unit/utils/utilityFunctionTypes.test.ts` — `formatDateChinese` / `formatMonthDay` from `shared/formatting`

## Decisions Made

None beyond plan — followed D-09 allowlist policy; `allowlist.knip.json` had no remaining dateUtils debt entries to remove.

## Deviations from Plan

None — plan executed as written. `allowlist.knip.json` required no edits (historical debt list already empty for dateUtils).

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Remaining Phase 9 batches: `09-02` (reviewStatsTimeRange), `09-05` (validation).
- `store/useAppStore.ts` continues to use `ensureMilliseconds` from `dateUtils` unchanged.

## Self-Check: PASSED

- `FOUND: .planning/phases/09-dir-boundary-cleanup/09-03-SUMMARY.md`
- `FOUND: 240df33` (task 1) — verified in `git log`
- `FOUND: 075ede3` (task 2) — verified in `git log`
- `FOUND` docs commit — `git log -1 --oneline -- .planning/phases/09-dir-boundary-cleanup/09-03-SUMMARY.md` returns `docs(09-03): complete dateUtils migration plan`

---
*Phase: 09-dir-boundary-cleanup*
*Completed: 2026-03-22*
