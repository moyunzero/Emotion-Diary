---
phase: 04-engineering-motion
plan: 04
subsystem: testing
tags: [utils, ai-service, review-export, tdd, jest]
requires:
  - phase: 04-01
    provides: 导出摘要与 derived 单一数据源契约
  - phase: 04-02
    provides: 导出链路行为稳定优先策略（D-15）
provides:
  - 回顾导出一句话总结在相同输入下可缓存复用
  - Groq Key 按运行时读取，避免环境变量快照导致行为漂移
  - 非法 firstEntryDate 归一化，防止 companionDays 异常膨胀
affects: [03-ai, review-export, engineering-quality]
tech-stack:
  added: []
  patterns:
    - ai fallback and success-path share fingerprint cache key
    - cross-module input normalization before derived computation
key-files:
  created:
    - __tests__/unit/utils/aiServiceReviewExportClosing.test.ts
  modified:
    - utils/aiService.ts
    - utils/reviewExportClosingInput.ts
    - __tests__/unit/utils/reviewExportClosingInput.test.ts
key-decisions:
  - "Groq API key 改为运行时读取，避免模块加载时静态快照导致测试/运行不一致。"
  - "firstEntryDate <= 0 统一视为缺失值，保持导出摘要 companionDays 的稳定口径。"
patterns-established:
  - "TDD 红绿提交用于 utils 小包优化，确保每个风险点可回滚。"
  - "跨模块小迁移先补契约测试，再做最小行为修正。"
requirements-completed: [ENG-02]
duration: 17min
completed: 2026-03-21
---

# Phase 04 Plan 04: Utils 优化微包 Summary

**回顾导出 AI closing 文案接入摘要指纹缓存并修复运行时 key 读取，同时收敛非法 firstEntryDate 输入以防 companionDays 失真。**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-21T13:38:00Z
- **Completed:** 2026-03-21T13:55:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- 完成 Package C：`aiService` 去冗余与契约收敛，新增回顾 closing 结果缓存并锁定重复调用行为。
- 完成 Package D：`reviewExportClosingInput` 增加 firstEntryDate 归一化，跨模块输入契约更稳。
- 两个包均按 TDD 执行（先失败测试、再修复实现），相关单测全部通过。

## Task Commits

Each task was committed atomically:

1. **Task 1: Optimization Package C（utils 单文件去冗余）** - `694c8aa` (test), `778e5a7` (feat)
2. **Task 2: Optimization Package D（跨模块小迁移 + 测试）** - `84b39d4` (test), `f5a5bc1` (fix)

**Plan metadata:** pending

## Files Created/Modified
- `utils/aiService.ts` - 运行时读取 Groq Key；为 review export closing 增加摘要指纹缓存和失败兜底缓存。
- `__tests__/unit/utils/aiServiceReviewExportClosing.test.ts` - 覆盖无 key 兜底、空数据鼓励文案、重复调用缓存命中。
- `utils/reviewExportClosingInput.ts` - 增加 `firstEntryDate` 归一化函数，非法值按缺失处理。
- `__tests__/unit/utils/reviewExportClosingInput.test.ts` - 增加非法 firstEntryDate 的契约测试，防止 companionDays 异常。

## Decisions Made
- 复用现有内存 cache Map，不引入额外缓存层，保持 1-2 文件小包边界。
- `firstEntryDate` 输入口径在入口归一化，不侵入 `reviewExportDerived` 内部统计实现。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 运行时 API Key 未生效导致测试与运行行为不一致**
- **Found during:** Task 1 (Optimization Package C)
- **Issue:** `GROQ_API_KEY` 在模块加载时固定，后续环境变量变化不会生效。
- **Fix:** 改为 `getGroqApiKey()` 运行时读取，并在 API 调用与配置检测统一使用。
- **Files modified:** `utils/aiService.ts`
- **Verification:** `npx jest __tests__/unit/utils/aiService.test.ts __tests__/unit/utils/aiServiceReviewExportClosing.test.ts`
- **Committed in:** `778e5a7`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** 偏差修复直接服务于行为稳定目标，无范围膨胀。

## Issues Encountered
- `aiServiceReviewExportClosing` 缓存测试初次失败，原因是前序测试已缓存同摘要 fallback；通过测试数据指纹去重后验证通过。

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ENG-02 在 utils 微包层的收敛工作已完成，可继续推进后续工程优化任务。
- 手动关键路径（导出页“生成一句话总结”成功态/兜底态）建议在真机或模拟器执行一次回归确认。

## Known Stubs
None.

## Self-Check: PASSED
- FOUND: `.planning/phases/04-engineering-motion/04-04-SUMMARY.md`
- FOUND: `694c8aa`
- FOUND: `778e5a7`
- FOUND: `84b39d4`
- FOUND: `f5a5bc1`
