---
phase: 09-dir-boundary-cleanup
verified: 2026-03-22T00:00:00Z
status: passed
score: 6/6 must-haves verified
---

# Phase 9: 目录边界治理与冗余清理 Verification Report

**Phase Goal:** 目录边界规则可执行、依赖关系可控，且高置信冗余代码被安全移除。

**Verified:** 2026-03-22

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status     | Evidence |
| --- | ----- | ---------- | -------- |
| 1   | features/ 与 shared/ 已纳入治理 scope | ✓ VERIFIED | `scripts/verify-governance.js` GOVERNANCE_SCOPE 含 `features`, `shared`；`allowlist.knip.json` scope 含 `features`, `shared`；`depcruise.cjs` GOVERNANCE_SCOPE 含 `^features/`, `^shared/` |
| 2   | 三项规则（跨层越界、循环依赖、未使用导出）已升 error | ✓ VERIFIED | depcruise 中 no-cross-layer-boundary、no-new-circular 为 severity `error`；knip 作为 Stage 1 执行；eslint `governanceGateLevel = 'error'`，`boundaries/element-types:error` |
| 3   | depcruise 使用 scripts/governance/depcruise.cjs 配置 | ✓ VERIFIED | verify-governance.js args: `["depcruise", "--config", "scripts/governance/depcruise.cjs", ...GOVERNANCE_SCOPE]` |
| 4   | verify:governance 全绿可复现 | ✓ VERIFIED | 实际执行 `npm run verify:governance` 退出码 0，knip/depcruise/boundaries 三阶段均为 PASS |
| 5   | 高置信死代码已安全移除，deprecated 清零 | ✓ VERIFIED | utils/dateUtils.ts、utils/responsiveUtils.ts、utils/reviewStatsTimeRange.ts 已删除；`grep` 无运行时 import 残留；全部迁移至 @/shared/formatting、@/shared/time-range、hooks/useResponsiveStyles、shared/responsive |
| 6   | 双端 smoke 与关键路径验证通过 | ✓ VERIFIED | `node scripts/verify-governance-smoke.js` 退出码 0；09-05-SUMMARY 记录 record/export/sync 三路径 PASS；09-VALIDATION.md Per-Plan Map 全绿 |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `scripts/verify-governance.js` | GOVERNANCE_SCOPE 含 features, shared；depcruise 传 --config | ✓ VERIFIED | 第 5–15 行 GOVERNANCE_SCOPE；第 27 行 args 含 `--config`, `scripts/governance/depcruise.cjs` |
| `scripts/governance/depcruise.cjs` | features 规则；三项规则 severity=error | ✓ VERIFIED | no-cross-layer-boundary、no-new-circular 为 error；no-features-to-app 存在；GOVERNANCE_SCOPE 含 features/shared |
| `eslint.config.js` | features/shared boundaries；features 不得 import app/features | ✓ VERIFIED | boundaries/elements 含 features、shared；rules 含 from:features disallow:app、disallow:features；shared disallow app/features/components/store |
| `.planning/codebase/STRUCTURE.md` | shared/utils 边界说明 | ✓ VERIFIED | 第 27–31 行「Shared 与 Utils 边界」节；utils deprecated Phase 9 清零 |
| `utils/dateUtils.ts` | 已删除 | ✓ VERIFIED | 文件不存在，store/useAppStore 与测试改用 @/shared/formatting |
| `utils/responsiveUtils.ts` | 已删除 | ✓ VERIFIED | 文件不存在，调用方使用 useResponsiveStyles/createResponsiveMetrics |
| `utils/reviewStatsTimeRange.ts` | 已删除 | ✓ VERIFIED | 文件不存在，调用方使用 @/shared/time-range |
| `06-SMOKE-CHECKLIST.md` | 路径 4 删除/迁移路径（Phase 9） | ✓ VERIFIED | 第 84–95 行「路径 4：删除/迁移路径」 |
| `shared/formatting/index.ts` | formatDate、formatDateChinese、ensureMilliseconds 等 | ✓ VERIFIED | 导出 formatDate、formatDateChinese、formatMonthDay、formatRelativeDayLabel、ensureMilliseconds |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| scripts/verify-governance.js | scripts/governance/depcruise.cjs | depcruise --config | ✓ WIRED | args 包含 `--config`, `scripts/governance/depcruise.cjs` |
| store/useAppStore.ts | shared/formatting | import ensureMilliseconds | ✓ WIRED | 第 12 行 `import { ensureMilliseconds } from "@/shared/formatting"` |
| components/EntryCard.tsx | shared/formatting | import formatDateChinese | ✓ WIRED | 第 22 行 |
| utils/aiService.ts | shared/formatting | import formatDateChinese | ✓ WIRED | 第 2 行 |
| utils/reviewStats.ts | shared/time-range | import getCalendarMonthRange | ✓ WIRED | 第 6 行 |
| utils/reviewExportClosingInput.ts | shared/time-range | import ReviewExportPreset | ✓ WIRED | 第 8 行 |
| hooks/useResponsiveStyles.ts | shared/responsive | import createResponsiveMetrics | ✓ WIRED | 第 9 行 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CLN-01 | 09-01-PLAN | 建立目录边界规则并执行依赖检查，避免新增跨层耦合与循环依赖 | ✓ SATISFIED | verify-governance 含 depcruise + knip + boundaries；features/shared 已纳入 scope；三项规则 error 级 |
| CLN-02 | 09-02, 09-03, 09-04, 09-05 | 删除高置信死代码（未使用导出、废弃 hook/工具），并保留删除证据与回滚点 | ✓ SATISFIED | 三 deprecated 模块已删除；09-02/03/04/05-SUMMARY 记录删除清单与回滚 commit |
| CLN-03 | 09-05-PLAN | 清理后通过双端 smoke 与关键路径验证，确保无动态引用误删 | ✓ SATISFIED | verify-governance-smoke.js 退出码 0；verify:governance 全绿；无 responsiveUtils/dateUtils/reviewStatsTimeRange import 残留 |

**Orphaned requirements:** 无。REQUIREMENTS.md 中 CLN-01、CLN-02、CLN-03 均映射到 Phase 9，且均有对应 plan 的 requirements 字段声明。

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | — | — | 无 blocker 或 warning 级 anti-pattern |

（`__tests__/unit/utils/dateUtils.test.ts` 的 describe 名称为 `dateUtils` 但实际测试 `@/shared/formatting`，属于迁移后的合理命名遗留，不影响目标达成。）

### Human Verification Required

| 测试项 | 说明 | 原因 |
| ------ | ---- | ---- |
| 双端真机 smoke（可选） | 按 06-SMOKE-CHECKLIST 手测 record/export/sync；至少一端真机 | D-13：验证以脚本为主，真机为可选 |

### Gaps Summary

无。Phase 9 目标已达成：
- 目录边界规则可执行（verify:governance 三阶段全绿）
- 依赖关系可控（features/shared 纳入 scope，depcruise + boundaries 规则生效）
- 高置信冗余代码已安全移除（dateUtils、responsiveUtils、reviewStatsTimeRange 已删除，引用全部迁移至 shared/hooks）

---

_Verified: 2026-03-22_
_Verifier: Claude (gsd-verifier)_
