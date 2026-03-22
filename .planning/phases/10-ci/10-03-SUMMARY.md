---
phase: 10-ci
plan: 03
subsystem: infra
tags: [github-actions, node-20, ci]

requires:
  - phase: 10-01
    provides: 测试基线稳定
provides:
  - PR 快路径与 main 治理分层的 GitHub Actions
  - Node 20 在 workflow、.nvmrc、engines 一致
affects: []

tech-stack:
  added: []
  patterns:
    - "PR 仅 lint + test:ci；push main 追加 verify:governance 与 governance smoke"

key-files:
  created:
    - .github/workflows/ci.yml
    - .nvmrc
  modified:
    - package.json

key-decisions:
  - "按 10-PLAN 硬约束实现 job 条件与步骤顺序"

patterns-established: []

requirements-completed: [TST-03]

duration: 15min
completed: 2026-03-22
---

# Phase 10-ci Plan 03 Summary

**GitHub Actions：`pull_request` 跑 lint + test:ci；`push` 跑全量含 `verify:governance` 与 `verify-governance-smoke.js`；Node 20 经 setup-node、.nvmrc、engines 对齐。**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2

## Accomplishments

- 新增 `.github/workflows/ci.yml`（`pr-gate` / `governance`）
- 根目录 `.nvmrc` 与 `package.json` engines 锁定 `>=20.0.0 <21`

## Deviations from Plan

None

## Issues Encountered

None

---
*Phase: 10-ci*
*Completed: 2026-03-22*
