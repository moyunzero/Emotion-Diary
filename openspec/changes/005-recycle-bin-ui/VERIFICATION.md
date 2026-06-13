# VERIFICATION：005-recycle-bin-ui

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | 通过 |
| ESLint | `yarn lint` | 通过 |
| 单元测试 | `yarn test` | 通过（169 tests，2026-06 复验） |
| Maestro E2E | `yarn test:maestro:preflight` + `yarn test:maestro` | 通过（restore + purge，iOS Simulator + dev build） |
| Playwright E2E | `yarn test:e2e` | 通过（3 tests，Expo Web 回收站主路径） |
| 手工 | 删除→回收站→恢复 | **已由 E2E 覆盖** |

## 行为验证

- [x] `restoreEntry` store action
- [x] 路由 `app/recycle-bin.tsx`
- [x] Profile 入口与计数副文案
- [x] 删除 Alert 改为「移至回收站」
- [x] 设备：恢复后主列表可见 — Maestro `recycle-bin-restore.yaml`
- [x] 设备：永久删除 — Maestro `recycle-bin-purge.yaml`

## 文档

- `openspec/state-management.md`（restoreEntry）
- `openspec/changes/005-recycle-bin-ui/SPEC.md`
