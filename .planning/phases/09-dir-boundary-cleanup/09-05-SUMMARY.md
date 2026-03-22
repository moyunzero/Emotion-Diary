---
phase: 09-dir-boundary-cleanup
plan: 05
subsystem: infra
tags: [governance, smoke, validation, knip, depcruise, boundaries]

requires:
  - phase: 09-dir-boundary-cleanup
    provides: "09-01～09-04 deprecated cleanup complete"
provides:
  - "verify:governance 全绿、smoke 通过、test:unit 通过"
  - "utils/dateUtils 残留清除，formatDate/ensureMilliseconds 迁至 shared/formatting"
affects:
  - "Phase 10 readiness"

tech-stack:
  added: []
  patterns:
    - "Phase 9 最终验证：governance + smoke + unit 三轨全过"

key-files:
  created: []
  modified:
    - shared/formatting/date.ts
    - shared/formatting/index.ts
    - store/useAppStore.ts
    - __tests__/unit/utils/dateUtils.test.ts
    - __tests__/unit/utils/utilityFunctionTypes.test.ts
  deleted:
    - utils/dateUtils.ts

key-decisions:
  - "09-05 发现 store 仍引用 utils/dateUtils，将 formatDate/ensureMilliseconds 迁至 shared/formatting 并删除 dateUtils 以满足 must_haves"

requirements-completed: [CLN-03]

duration: ~10min
completed: 2026-03-22
---

# Phase 9 Plan 05: Final Validation Summary

**verify:governance 全绿、关键路径 smoke 通过、test:unit 全量通过；utils/dateUtils 残留清除，formatDate/ensureMilliseconds 迁至 shared/formatting**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files modified:** 6 (incl. 1 deleted)

## Accomplishments

- `npm run verify:governance` 退出码 0（knip、depcruise、boundaries 全 PASS）
- `node scripts/verify-governance-smoke.js` 退出码 0（record、export、sync 三路径全 PASS）
- `yarn test:unit` 533 tests 全通过
- 清除 utils/dateUtils 残留：formatDate、ensureMilliseconds 迁至 shared/formatting，store/useAppStore 与测试改用 @/shared/formatting
- 09-VALIDATION.md 更新为 nyquist_compliant: true，Per-Plan Map 全绿

## 删除的 deprecated 模块清单

| 模块 | 删除计划 | 迁移目标 | 状态 |
|------|----------|----------|------|
| utils/reviewStatsTimeRange.ts | 09-02 | @/shared/time-range | ✅ 已删除 |
| utils/responsiveUtils.ts | 09-04 | useResponsiveStyles / createResponsiveMetrics | ✅ 已删除 |
| utils/dateUtils.ts | 09-05 验证阶段发现残留 | @/shared/formatting (formatDate, ensureMilliseconds) | ✅ 已删除 |

## Task Commits

1. **Task 1: Run full governance and smoke verification + dateUtils migration** - `5147597` (fix)
2. **Task 2: Update VALIDATION.md and create 09-05-SUMMARY.md** - `780a54d` (docs)

## 验证结果

- **verify:governance:** knip PASS、depcruise PASS、eslint-plugin-boundaries PASS
- **smoke:** record PASS、export PASS、sync PASS
- **test:unit:** 46 suites、533 tests PASS
- **deprecated 残留检查:** `rg "responsiveUtils|dateUtils|reviewStatsTimeRange" utils/ components/ app/ store/ services/ features/ shared/ styles/` 无命中

## 回滚点说明

| Plan | 回滚 commit | 说明 |
|------|-------------|------|
| 09-01 | 797ffc9, 86b462a | 扩展 governance scope、smoke checklist |
| 09-02 | aa44cb4, a03b703 | reviewStatsTimeRange 迁移与删除 |
| 09-03 | 240df33, 075ede3 | dateUtils formatDateChinese 迁移 |
| 09-04 | 3d42020, 48421f2, 83414f9 | responsiveUtils 迁移与删除 |
| 09-05 | 5147597 | dateUtils 残留清除、shared/formatting 迁移 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] 清除 utils/dateUtils 残留**
- **Found during:** Task 1（deprecated 残留检查）
- **Issue:** store/useAppStore.ts 仍 import ensureMilliseconds from utils/dateUtils，违反 must_haves「无 dateUtils 残留」
- **Fix:** 将 formatDate、ensureMilliseconds 迁至 shared/formatting，更新 store 与测试 import，删除 utils/dateUtils.ts
- **Files modified:** shared/formatting/date.ts, shared/formatting/index.ts, store/useAppStore.ts, __tests__/unit/utils/dateUtils.test.ts, __tests__/unit/utils/utilityFunctionTypes.test.ts, utils/dateUtils.ts (deleted)
- **Committed in:** 5147597

**Total deviations:** 1 auto-fixed（Rule 2 - Missing Critical）
**Impact:** 满足 plan must_haves，无 scope creep

## Issues Encountered

None

## Next Phase Readiness

- Phase 9 完成，CLN-03 达成
- verify:governance、smoke、test:unit 均通过，可进入 Phase 10

---
*Phase: 09-dir-boundary-cleanup*
*Completed: 2026-03-22*
