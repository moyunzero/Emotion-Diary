# VERIFICATION：回归地基 · 单测扩展与手工回归清单

## 验证目标

- 拉云合并语义有纯函数单测；`clipHandler` 释放语义有单测；手工回归清单可供 004+ 引用。
- **无用户可见行为变更**（`mergeCloudPullEntries` 与改前 `syncFromCloud` 内联合并逻辑等价）。

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | 通过 |
| 单元测试 | `yarn test` | 通过（169 tests，2026-06 复验） |
| ESLint | `yarn lint` | 通过 |
| 治理规则 | `yarn verify:governance` | 未执行（非 push master） |
| 手工 / E2E | 见 `REGRESSION-CHECKLIST.md` | V1 回收站路径已由 Playwright + Maestro 覆盖（005） |

## 行为验证

- [x] 正常路径：`mergeCloudPullEntries` 单测覆盖本地独有、云覆盖、墓碑剔除本地、排序
- [x] 异常路径：`releaseRecordingClipHandler` 非当前 handler 不误清（协调器仍可由 `set(null)` 清空）
- [x] 数据持久化：无变更
- [x] 云端同步：逻辑提取为纯函数，`useAppStore.syncFromCloud` 调用同一函数
- [ ] Web / iOS / Android 差异：未测（无 UI 变更）

## 未验证项

- `REGRESSION-CHECKLIST.md` S/R/A 系列其余条目 — 004+ 合并前按需设备执行。
- ~~OQ-4：`generateForecast` 门槛是否排除软删~~ — **已关闭**（004：`store/modules/ai.ts` 使用 `excludeSoftDeletedEntries`）。

## 剩余风险

- 无 Sentry；线上回归仍依赖清单与后续 SSD 的手工记录。
- `mergeCloudPullEntries` 假定 `cloudEntries` 已在调用方剔除墓碑（与 `useAppStore` 一致）；若未来调用方遗漏过滤，墓碑 id 仍可能从云端行写入。

## 文档更新记录

- 新增 `openspec/changes/003-regression-guardrails/`（SPEC、VERIFICATION、REGRESSION-CHECKLIST）
- 新增 `shared/sync/cloudMerge.ts`
- 更新 `openspec/iteration-roadmap-2026.md`（003 状态）
- 更新 `store/useAppStore.ts`（调用 `mergeCloudPullEntries`）
