# VERIFICATION：004-sync-ux-clarity

## 验证目标

- Profile 区分「备份到云端」与「从云端合并」；合并前确认；快照能力说明不与当前入口混称。
- store `syncStatus` 在 Profile 可见；`false` / `pending` 不虚假成功。
- `syncLock` 单测；`generateForecast` 门槛用可见条目数。

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | 通过 |
| ESLint | `yarn lint` | 通过（`MoodEntry` 未使用已修） |
| 单元测试 | `yarn test` | 通过（169 tests，2026-06 复验） |
| Playwright E2E | `yarn test:e2e` | 通过（回收站 Web 主路径，与 005 重叠） |
| 手工验证 | Profile 数据与安全区 | **未执行**（文案/状态机已由单测 + Web E2E 部分覆盖） |

## 行为验证

- [x] 文案：`constants/syncDataOps.ts` 与 Profile 菜单标题/副文案
- [x] 合并确认：`handleSyncPull` → `Alert.alert`
- [x] 状态：`storeSyncStatus` 传入 `ProfileSettingsSection`
- [x] 返回值：`runSyncAction` 处理 `pending` / `false`
- [x] OQ-4：`generateForecast` 可见条数门槛
- [ ] 设备：合并确认框、排队提示 — 未测

## 未验证项

- 003 回归清单 S1–S3（建议在合入前设备执行）

## 剩余风险

- Profile 本地 `syncStatus` 与 store `syncStatus` 仍双轨；成功动画用本地，后台同步用 store 标签。

## 文档更新记录

- `openspec/changes/004-sync-ux-clarity/*`
- `openspec/state-management.md`（generateForecast）
- `openspec/engineering-quality.md` §2 H1
- `openspec/iteration-roadmap-2026.md`
