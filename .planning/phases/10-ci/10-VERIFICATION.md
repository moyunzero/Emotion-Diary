---
phase: 10-ci
status: passed
verified: 2026-03-22
requirements: [TST-01, TST-02, TST-03]
---

# Phase 10 — Verification

## Goal

测试体系围绕关键路径稳定运行，CI 在速度与风险控制之间达成平衡（见 `ROADMAP.md` Phase 10）。

## Must-haves（对照计划）

| ID | 验证项 | 证据 |
|----|--------|------|
| TST-01 | 示例 Jest/fast-check 已删；time-range 重复单测已合并至 shared canonical | 文件不存在：`__tests__/unit/utils/example.test.ts`、`__tests__/property/example.property.test.ts`、`__tests__/unit/utils/reviewStatsTimeRange.test.ts`；`__tests__/unit/shared/time-range/periods.test.ts` 含 `getReviewExportPeriods` 与 `REVIEW_PRESET_LABEL` |
| TST-01 | `yarn test:ci` 与 `node scripts/verify-governance-smoke.js` 通过 | 执行退出码 0 |
| TST-02 | Profile 单测在 `__tests__/unit/features/profile.test.tsx` | `test -f`；原 `unit/app/profile.test.tsx` 不存在 |
| TST-02 | ensureMilliseconds 单测在 `__tests__/unit/shared/formatting/ensureMilliseconds.test.ts` | `describe('shared/formatting ensureMilliseconds'` |
| TST-02 | README 含映射表；jest `collectCoverageFrom` 含 features 与 shared | `__tests__/README.md` 标题 `## 源码目录 → 单测根目录映射`；`jest.config.js` 字面量 `"features/**/*.{ts,tsx}"`、`"shared/**/*.{ts,tsx}"` |
| TST-03 | 分层 CI workflow | `.github/workflows/ci.yml`：`pr-gate`（PR）仅 lint + test:ci；`governance`（push）含 `yarn verify:governance` 一次与 `node scripts/verify-governance-smoke.js` |
| TST-03 | Node 20 | `.nvmrc` 为 `20`；`package.json` engines `>=20.0.0 <21`；workflow `node-version: '20'` |

## Automated checks run

- `yarn test:ci`
- `node scripts/verify-governance-smoke.js`

## human_verification

- [ ] 在 GitHub 上创建一次 PR，确认 `pr-gate` job 出现且通过（需远程仓库默认分支与 `on.push.branches` 配置一致；本 workflow 使用 `main`）。

## Gaps

None（远程 PR 行为列为可选人工确认项，不阻塞本仓库自动化结论）。
