---
phase: 07-shared
plan: 02
subsystem: shared
tags: [time-range, presets, compatibility, insights, testing]
requires:
  - phase: 07-04
    provides: shared formatting baseline and compatibility migration strategy
provides:
  - canonical shared time-range period calculation
  - single-source preset label mapping
  - deprecated compatibility adapter for old time-range entry
  - insights week boundary reuse from shared module
affects: [phase-07, phase-08, review-export, insights]
tech-stack:
  added: []
  patterns: [shared pure function canonical, thin adapter compatibility, boundary-first unit tests]
key-files:
  created:
    - shared/time-range/periods.ts
    - shared/time-range/presets.ts
    - shared/time-range/index.ts
    - __tests__/unit/shared/time-range/periods.test.ts
  modified:
    - shared/index.ts
    - utils/reviewStatsTimeRange.ts
    - components/Insights/utils.tsx
    - __tests__/unit/utils/reviewStatsTimeRange.test.ts
key-decisions:
  - "保留 utils/reviewStatsTimeRange 作为 deprecated thin adapter，避免本包引入破坏性迁移。"
  - "洞察链路仅替换周边界入口为 shared/time-range，导出链路保持可独立迁移。"
patterns-established:
  - "Pattern 1: 旧入口只做 re-export，不再承载业务实现。"
  - "Pattern 2: 周/月边界测试先红后绿，覆盖跨周跨月跨年与空值输入。"
requirements-completed: [SHR-01, SHR-02, SHR-03]
duration: 16min
completed: 2026-03-21
---

# Phase 07 Plan 02: Time-Range Shared 收敛 Summary

**共享 time-range 计算与 preset 文案映射已收敛到 `shared/time-range`，并完成洞察链路复用与边界回归测试保护。**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-21T15:28:00Z
- **Completed:** 2026-03-21T15:44:17Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- 新增 `shared/time-range` canonical 模块，统一周/月 current+previous 计算。
- 将 preset 中文文案集中为 `REVIEW_PRESET_LABEL` 单点映射。
- 旧入口 `utils/reviewStatsTimeRange.ts` 改为 deprecated 兼容层，洞察周边界改为 shared 复用。
- 为 shared 模块与兼容层补齐边界与固定输入回归测试，保障迁移口径一致。

## Task Commits

Each task was committed atomically:

1. **Task 1: 建立 shared time-range canonical 实现与边界单测**  
   - `83a7a47` (test): add failing tests for canonical time-range  
   - `4431aa2` (feat): add canonical shared time-range module
2. **Task 2: 旧入口适配并仅替换洞察链路调用点**  
   - `a060460` (test): add failing compatibility tests for time-range adapter  
   - `a1fa57d` (feat): migrate insights path to shared time-range adapter
3. **Task 3: 洞察链路统计口径一致性检查**  
   - `e18230e` (test): lock fixed-input period semantics for insights path

## Files Created/Modified
- `shared/time-range/periods.ts` - canonical 周/月区间与上期区间纯函数。
- `shared/time-range/presets.ts` - preset 中文文案单一映射来源。
- `shared/time-range/index.ts` - time-range 领域统一导出。
- `shared/index.ts` - 顶层 shared 导出聚合 time-range。
- `utils/reviewStatsTimeRange.ts` - deprecated 薄适配层（转调 shared）。
- `components/Insights/utils.tsx` - `getWeekDates` 改用 shared 周边界。
- `__tests__/unit/shared/time-range/periods.test.ts` - 边界测试（周/月/跨年/空值）。
- `__tests__/unit/utils/reviewStatsTimeRange.test.ts` - 兼容层一致性与固定输入口径回归测试。

## Decisions Made
- 保持 Phase 7 兼容层策略：旧入口不删除，只做可追踪 re-export（符合 D-04/D-06）。
- 本包只迁移洞察链路 time-range 调用点，导出链路后续独立包推进（符合 D-02）。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `shared/time-range` 已可作为导出链路后续迁移的唯一来源。
- 旧入口已标记 deprecated，Phase 8 可按策略继续清理旧 import。

## Self-Check: PASSED

- FOUND: `.planning/phases/07-shared/07-02-SUMMARY.md`
- FOUND commits: `83a7a47`, `4431aa2`, `a060460`, `a1fa57d`, `e18230e`
