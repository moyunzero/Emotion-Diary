---
phase: 12
slug: code-health-tests-size
status: passed
verified: 2026-03-22
requirements: [QA-01, QA-02, TST2-01, TST2-02, SIZE-01]
---

# Phase 12 — Goal Verification

**Goal（ROADMAP）:** 去除高置信死代码与调试残留；精简测试集（可审计）；建立大单文件清单并启动拆分。

## Must-haves

| ID | 要求摘要 | 证据 |
|----|----------|------|
| QA-01 | knip 退出码 0；变更可审计 | `12-KNIP-SNAPSHOT.txt`；`npx knip` 本地 0；`knip.json` 本轮未扩大忽略（理由见 `12-01-SUMMARY.md`） |
| QA-02 | 生产路径诊断 `console.log` 收敛 | `store/useAppStore.ts` 与 `store/modules/user.ts` 无 `^\s*console\.log` 裸行；诊断语句均为 `if (__DEV__) console.log` |
| TST2-01 | 删除可审计；smoke / test:ci 绿 | `12-TEST-DELETIONS.md` 含 Smoke 全路径；本轮无删除；`yarn test:ci` 与 `node scripts/verify-governance-smoke.js` 已通过 |
| TST2-02 | 贡献文档链到测试 README | `CONTRIBUTING.md` 含 `## 测试布局与 CI` 与 `[__tests__/README.md](./__tests__/README.md)`、`yarn test:ci` |
| SIZE-01 | 清单 + 至少一批拆分 | `12-SIZE-OVERVIEW.md`；`createUserSlice` 于 `store/modules/user.ts`；`useAppStore.ts` 由 ~1292 行降至 653 行（见 `12-03-SUMMARY.md`） |

## 自动化命令（执行日）

- `yarn typecheck && yarn lint && yarn test:ci` — 通过  
- `node scripts/verify-governance-smoke.js` — 通过  
- `npx knip` — 退出码 0  

## Gaps

无。

## human_verification

无（本阶段以自动化与文档证据为主）。
