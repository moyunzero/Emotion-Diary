# Phase 12 — 测试删除审计

## Smoke 禁止删除（须与脚本一致）

以下路径来自 `scripts/verify-governance-smoke.js` 内 `SMOKE_PATHS`，**禁止**在本阶段删除或重命名而不同步更新烟雾脚本与回归验证：

| id | Jest 目标路径 |
|----|----------------|
| record | `__tests__/unit/store/storage.test.ts` |
| export | `__tests__/unit/utils/reviewExportDerived.test.ts` |
| export | `__tests__/unit/utils/reviewExportClosingInput.test.ts` |
| sync | `__tests__/unit/store/syncStatus.test.ts` |
| sync | `__tests__/unit/store/pendingSyncQueue.test.ts` |

## 候选删除

| path | reason | evidence |
|------|--------|----------|
| — | 本波无合格删除候选（无断言/重复/示例类用例未做全仓逐文件审计） | 仅立表；后续可专期对照 `12-RESEARCH.md` 做 grep 去重 |

## 已执行

**无** — 未删除任何 `__tests__` 文件。
