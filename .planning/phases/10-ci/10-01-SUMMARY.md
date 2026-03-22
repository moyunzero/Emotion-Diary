---
phase: 10-ci
plan: 01
subsystem: testing
tags: [jest, fast-check, time-range, smoke]

requires: []
provides:
  - 移除示例/重复单测后仍绿的 test:ci 与治理 smoke
affects: [10-02, 10-03]

tech-stack:
  added: []
  patterns:
    - "time-range 语义以 __tests__/unit/shared/time-range 为 canonical"

key-files:
  created: []
  modified:
    - __tests__/unit/shared/time-range/periods.test.ts

key-decisions:
  - "reviewStatsTimeRange.test.ts 中未在 periods 覆盖的用例已迁移后再删除原文件"

patterns-established:
  - "与 shared/time-range 重复的单测只保留 shared 侧目录下的文件"

requirements-completed: [TST-01]

duration: 15min
completed: 2026-03-22
---

# Phase 10-ci Plan 01 Summary

**示例 Jest/fast-check 脚手架测试已删；time-range 重复单测合并进 shared canonical，`yarn test:ci` 与治理 smoke 全绿。**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 1（periods.test.ts）；删除 3 个测试文件

## Accomplishments

- 删除 `example.test.ts` 与 `example.property.test.ts`（D-01）
- 将 `reviewStatsTimeRange.test.ts` 独有断言迁移至 `periods.test.ts` 后删除 utils 侧文件（D-03）
- `node scripts/verify-governance-smoke.js` 通过，SMOKE_PATHS 未改

## Task Commits

1. **Task 1–3** — 见下方单次提交（本阶段内联执行，合并为一条提交以保持工作区一致）

## Files Created/Modified

- `__tests__/unit/shared/time-range/periods.test.ts` — 增补 last_month 边界与固定日期全 preset 回归
- 删除：`__tests__/unit/utils/example.test.ts`、`__tests__/property/example.property.test.ts`、`__tests__/unit/utils/reviewStatsTimeRange.test.ts`

## Deviations from Plan

**None** — `periods.test.ts` 原先未覆盖 `2026-2-21` 全量 preset 与「上月 previous 早于 current」断言，已按计划在删除前迁移。

## Issues Encountered

None

---
*Phase: 10-ci*
*Completed: 2026-03-22*
