---
phase: 06-governance-baseline-gates
plan: 03
subsystem: testing
tags: [governance, smoke, jest, checklist, pr-template]
requires:
  - phase: 06-01
    provides: "governance command baseline and phase-6 scope"
provides:
  - "关键路径 smoke 编排（记录/导出/同步）"
  - "导出结构化断言口径（非像素快照）"
  - "混合验收清单与证据位模板"
  - "治理重构 PR 必填模板与回滚优先约束"
affects: [phase-06, phase-07, phase-08, phase-09, phase-10]
tech-stack:
  added: []
  patterns: ["dry-run first smoke validation", "automation + manual hybrid evidence", "rollback-first governance PR workflow"]
key-files:
  created:
    - scripts/verify-governance-smoke.js
    - .planning/phases/06-governance-baseline-gates/06-SMOKE-CHECKLIST.md
    - .planning/phases/06-governance-baseline-gates/06-GOVERNANCE-PR-TEMPLATE.md
    - __tests__/unit/scripts/verifyGovernanceSmoke.test.ts
  modified:
    - __tests__/unit/scripts/verifyGovernanceSmoke.test.ts
key-decisions:
  - "smoke 路径固定为 record/export/sync，并通过单入口脚本编排"
  - "导出一致性仅使用结构化断言，明确排除像素级快照比对"
  - "每个治理重构包必须按 D-14 字段提交并遵循偏差先回退"
patterns-established:
  - "Pattern 1: 关键路径脚本必须支持 --dry-run 并输出稳定摘要"
  - "Pattern 2: 验收证据模板统一记录案例ID、命令、结果、回滚点"
requirements-completed: [GOV-03]
duration: 3min
completed: 2026-03-21
---

# Phase 06 Plan 03: Governance Critical-Path Guardrails Summary

**交付了记录/导出/同步三路径 smoke 入口、结构化导出断言口径，以及可直接落地的混合验收清单和治理 PR 模板。**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T14:59:10Z
- **Completed:** 2026-03-21T15:01:44Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- 建立 `scripts/verify-governance-smoke.js`，按 record/export/sync 三路径执行关键测试并支持 `--dry-run`。
- 用 TDD 增加 `verifyGovernanceSmoke` 脚本测试，确保 dry-run 输出契约可回归。
- 新增 `06-SMOKE-CHECKLIST.md`，固化自动化 + 手测 + 证据位执行流程。
- 新增 `06-GOVERNANCE-PR-TEMPLATE.md`，强制 D-14 五字段并写明 D-13/D-16 执行约束。

## Task Commits

Each task was committed atomically:

1. **Task 1: 定义关键路径 smoke 编排与结构化断言入口** - `2a4a14c` (test), `1b53d63` (feat)
2. **Task 2: 固化混合验收清单与 PR 小包模板** - `9292e6f` (docs)

_Note: TDD task has test -> feat commits._

## Files Created/Modified
- `scripts/verify-governance-smoke.js` - 关键路径 smoke 编排入口与 dry-run 摘要输出
- `__tests__/unit/scripts/verifyGovernanceSmoke.test.ts` - smoke dry-run 输出契约测试
- `.planning/phases/06-governance-baseline-gates/06-SMOKE-CHECKLIST.md` - 混合验收清单与证据记录模板
- `.planning/phases/06-governance-baseline-gates/06-GOVERNANCE-PR-TEMPLATE.md` - 治理重构 PR 模板（D-14/D-13/D-16）

## Decisions Made
- 使用定向 Jest 用例覆盖记录/导出/同步最小关键路径，保持 60 秒级反馈窗口。
- 导出路径验证仅采用结构化断言与关键文本一致性，避免像素快照不稳定性。
- 文档层面强制小包提交与回滚点填写，确保治理执行可审计、可回退。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修复 smoke 脚本测试路径解析错误**
- **Found during:** Task 1 (TDD GREEN)
- **Issue:** 新增测试中脚本相对路径多回溯一级，导致 `node` 执行返回非 0。
- **Fix:** 将 `../../../..` 修正为 `../../..` 以指向仓库根目录下脚本。
- **Files modified:** `__tests__/unit/scripts/verifyGovernanceSmoke.test.ts`
- **Verification:** `npm test -- --runInBand --watchman=false __tests__/unit/scripts/verifyGovernanceSmoke.test.ts`
- **Committed in:** `1b53d63` (part of task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug fix)
**Impact on plan:** 必要修复，未引入范围扩张。

## Issues Encountered
- `Shell` 环境中 `rg` 命令不可用，改用内置 `rg` 工具完成关键字验证；不影响交付结果。

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GOV-03 护栏已就绪，可在 Phase 7+ 拆分重构中直接复用 smoke 与清单模板。
- 建议后续把 `scripts/verify-governance-smoke.js` 接入 CI 分层门禁流程。

## Self-Check: PASSED
- Found: `scripts/verify-governance-smoke.js`
- Found: `.planning/phases/06-governance-baseline-gates/06-SMOKE-CHECKLIST.md`
- Found: `.planning/phases/06-governance-baseline-gates/06-GOVERNANCE-PR-TEMPLATE.md`
- Found: `.planning/phases/06-governance-baseline-gates/06-03-SUMMARY.md`
- Found commit: `2a4a14c`
- Found commit: `1b53d63`
- Found commit: `9292e6f`

---
*Phase: 06-governance-baseline-gates*
*Completed: 2026-03-21*
