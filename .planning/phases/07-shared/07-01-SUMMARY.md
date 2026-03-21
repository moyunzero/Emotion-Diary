---
phase: 07-shared
plan: 01
subsystem: shared
tags: [formatting, adapter, jest, react-native]
requires:
  - phase: 06-governance-baseline-gates
    provides: 渐进门禁与小包可回滚执行约束
provides:
  - shared 格式化单一入口（日期中文、月日、相对日标签）
  - 旧入口 thin adapter 与 Phase 7 临时兼容标注
  - 日期边界与空值场景自动化测试
affects: [07-04-PLAN, 07-05-PLAN, formatting-migration]
tech-stack:
  added: []
  patterns: [pure-function shared utilities, legacy thin adapter]
key-files:
  created:
    - shared/formatting/date.ts
    - shared/formatting/index.ts
    - shared/index.ts
    - __tests__/unit/shared/formatting/date.test.ts
  modified:
    - utils/dateUtils.ts
    - services/companionDaysService.ts
    - __tests__/unit/utils/dateUtils.test.ts
    - __tests__/unit/services/companionDaysService.test.ts
key-decisions:
  - "shared/formatting 先落地纯函数，再由旧路径转调，避免直接改关键页面导致回归面扩大。"
  - "兼容层保留原签名，仅添加 @deprecated 标识，清理动作延后至 Phase 8。"
patterns-established:
  - "Pattern 1: shared 目录只保留纯函数与领域入口，便于 tree-shaking 与复用。"
  - "Pattern 2: 旧 utils/services 导出统一转调 shared，禁止保留并行业务实现。"
requirements-completed: [SHR-01, SHR-02, SHR-03]
duration: 17min
completed: 2026-03-21
---

# Phase 07 Plan 01: Formatting 收敛首包 Summary

**建立 `shared/formatting` 单一日期语义入口，并将 `dateUtils` 与 `companionDaysService` 的旧格式化 API 收敛为可回滚的 thin adapter。**

## Performance

- **Duration:** 17min
- **Started:** 2026-03-21T15:19:00Z
- **Completed:** 2026-03-21T15:35:55Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- 新增 `shared/formatting/date.ts`，提供 `formatDateChinese`、`formatMonthDay`、`formatRelativeDayLabel` 三个纯函数和空值兜底。
- 建立 `shared/formatting/index.ts` 与 `shared/index.ts` 统一导出入口，满足后续调用点迁移前置条件。
- 将 `utils/dateUtils.ts` 与 `services/companionDaysService.ts` 的日期格式化逻辑改为 thin adapter，避免并行实现继续扩散。
- 补齐单测覆盖：空值、闰年、跨年、跨月相对时间与旧 API 兼容性。

## Task Commits

Each task was committed atomically:

1. **Task 1: 建立 shared formatting 单一入口并补齐边界测试** - `aa02968` (test)
2. **Task 2: 旧入口改为 thin adapter（不触及关键页）** - `b05274d` (feat)

## Files Created/Modified
- `shared/formatting/date.ts` - 新增日期格式化纯函数与空值兜底。
- `shared/formatting/index.ts` - formatting 子域统一导出。
- `shared/index.ts` - shared 顶层导出。
- `__tests__/unit/shared/formatting/date.test.ts` - shared formatting 边界测试。
- `utils/dateUtils.ts` - 旧 `formatDateChinese/formatDateShort` 转调 shared。
- `services/companionDaysService.ts` - `formatStartDate` 转调 shared，并标注临时兼容。
- `__tests__/unit/utils/dateUtils.test.ts` - 增加旧入口兼容层断言。
- `__tests__/unit/services/companionDaysService.test.ts` - 增加无效输入兜底断言。

## Decisions Made
- 先完成 shared 纯函数入口再切旧入口，确保回归问题可定位在“新实现”或“旧适配”其中一层。
- 旧入口仅做代理，不再保留业务逻辑，降低语义漂移风险并为 Phase 8 删除留出明确边界。

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- TDD Red 阶段首次执行失败为“缺少 `shared/formatting/date` 模块”，属于预期失败，随后实现后通过。

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `shared/formatting` 已成为可被调用的单一来源，可继续推进关键页面导入替换包。
- 兼容层已生效，后续可以在不破坏现有调用的前提下逐步迁移。

## Known Stubs
None.

## Self-Check: PASSED
- FOUND: `.planning/phases/07-shared/07-01-SUMMARY.md`
- FOUND commits: `aa02968`, `b05274d`

---
*Phase: 07-shared*
*Completed: 2026-03-21*
