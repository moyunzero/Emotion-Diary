---
phase: 11-github-repo-hygiene
plan: 01
subsystem: infra
tags: [typescript, ci, yarn, security, documentation]

requires: []
provides:
  - package.json typecheck script and passing tsc --noEmit
  - Root SECURITY.md and README developer quick start
  - CI typecheck in pr-gate and governance jobs
affects: [contributors, ci]

tech-stack:
  added: []
  patterns:
    - "Root tsc excludes supabase/functions (Deno edge code)"

key-files:
  created:
    - SECURITY.md
    - .planning/phases/11-github-repo-hygiene/11-01-SUMMARY.md
  modified:
    - package.json
    - README.md
    - .github/workflows/ci.yml
    - tsconfig.json
    - store/useAppStore.ts
    - store/modules/entries.ts
    - __tests__/property/store-type-safety.property.test.ts
    - __tests__/unit/services/companionDaysService.asOf.test.ts

key-decisions:
  - "Zustand v5 StateCreator requires (set, get, store); wired through entries slice and useAppStore"
  - "supabase/functions excluded from root TypeScript program"

patterns-established:
  - "Minimal contributor checks: yarn typecheck && yarn lint && yarn test:ci"

requirements-completed: [GH-01, INT-01, INT-03]

duration: —
completed: 2026-03-22
---

# Phase 11 Wave 1 — Summary

**仓库具备可复现的 `yarn typecheck`、根目录安全说明、README 开发者前置区块，且 CI 与文档一致。**

## Performance

- **Tasks:** 4（计划）+ 为通过 tsc 所需的类型与 tsconfig 调整
- **Files modified:** 见 frontmatter

## Accomplishments

- 新增 `typecheck` 脚本并修复全量 `tsc --noEmit`（含 Zustand 三参、排除 Deno functions、测试夹具）
- 新增 `SECURITY.md`，README 链 `./SECURITY.md` 可用
- README 在核心功能前增加开发者快速上手（Yarn、`master`、CI、文档链接）
- `ci.yml` 的 pr-gate 与 governance 均在 install 后、lint 前执行 `yarn typecheck`

## Task Commits

1. **Task 1（含 tsc 打通）** — `d62ca8c` (feat)
2. **Task 2: SECURITY.md** — `951e821` (docs)
3. **Task 3: README** — `e3b3ce8` (docs)
4. **Task 4: CI** — `56ba420` (ci)

## Self-Check: PASSED

- `yarn typecheck && yarn lint && yarn test:ci` 在 Wave 1 结束时退出码 0

## PLANNING COMPLETE
