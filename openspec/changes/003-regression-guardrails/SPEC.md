# SPEC：回归地基 · 单测扩展与手工回归清单

## 背景

- **当前问题**：`syncFromCloud` 合并、`recordingCoordinator` 的 `clipHandler` 释放语义、软删过滤等属于 **脆弱区**（`engineering-quality.md` §2），但单测覆盖不足；后续 004–007 将集中改同步与数据信任，缺少回归清单易引入不可复现问题。
- **用户或业务影响**：合并逻辑或录音回调误改可导致「删了又回来」「编辑后记一笔录音失败」等难排查问题。
- **相关代码**：`store/useAppStore.ts`（`syncFromCloud`）、`shared/sync/tombstone.ts`、`shared/entries/visibility.ts`、`shared/audio/recordingCoordinator.ts`、`store/modules/storage.ts`（`mergeEntries`）。
- **相关文档**：[`iteration-roadmap-2026.md`](../../iteration-roadmap-2026.md) 波 0 / 任务 003；[`002-entry-backup-soft-delete/SPEC.md`](../002-entry-backup-soft-delete/SPEC.md)；[`engineering-quality.md`](../../engineering-quality.md) §2.3。

## 目标

- **必须达成**：
  1. 将 **拉云合并**（本地独有 id 保留、同 id 云端覆盖、墓碑过滤、timestamp 降序）提取为 **纯函数** 并单测覆盖（行为与改前 `useAppStore.syncFromCloud` 一致）。
  2. 扩展 **软删可见性** 单测（边界值）。
  3. 为 **`releaseRecordingClipHandler`** 增加单测（不误清其他 handler）。
  4. 在 `changes/003/` 内成文 **手工回归清单**（供 004–009 与设备验证引用）。
  5. **不修**同步算法、录音手势、UI；**不接** Sentry。
- **不在本次范围**：
  - `generateForecast` 门槛是否排除软删（OQ-4）— 记入开放问题，建议 004 与产品一并定稿。
  - `useAppStore` 全链路 mock 集成测（过重，本任务不做）。
  - 004 的同步 UX、005 回收站 UI。

## 用户行为

- **触发入口**：无用户可见变更（本任务为开发者回归能力）。
- **期望结果**：CI `yarn test` 新增用例全绿；后续 SSD 任务合并前可对照清单做手工验证。
- **异常或边界场景**：清单中覆盖软删拉云、墓碑、录音多挂载点、登出/登录合并。

## 技术约束

- **架构边界**：纯函数放 `shared/sync/`；`store` 调用纯函数，不引 `components`。
- **数据兼容**：合并函数输入为已映射的 `MoodEntry[]`；墓碑集与 `tombstone.ts` 一致。
- **多端要求**：单测在 Node；手工清单标注 iOS / Android 优先项。
- **安全与隐私**：清单与测试不含真实日记正文样本。

## 验收标准

- [x] `mergeCloudPullEntries`（或等价名）纯函数 + 单测覆盖：本地独有、同 id 云覆盖、墓碑剔除本地、排序
- [x] `releaseRecordingClipHandler` 单测：仅释放本人 handler
- [x] 软删可见性边界单测补充
- [x] `REGRESSION-CHECKLIST.md` 成文
- [x] `useAppStore.syncFromCloud` 使用同一纯函数（行为不变）
- [x] `VERIFICATION.md` 记录 CI 结果
- [ ] OQ-4 关闭（推迟至 004）

## 依据

- **产品依据**：[`iteration-roadmap-2026.md`](../../iteration-roadmap-2026.md) 任务 003。
- **技术依据**：`state-management.md` `syncFromCloud` 合并语义；`engineering-quality.md` §2.3 录音协调约定。
- **历史决策**：编辑弹窗卸载误清全局 `clipHandler` 的 bug 修复后须防回归。

## 开放问题

| ID | 问题 | 计划 |
|----|------|------|
| OQ-4 | `generateForecast` 的 `entries.length < 3` 是否改为可见条数 | 004 |
