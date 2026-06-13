# SPEC：回收站 UI（B1）

## 背景

- **当前问题**：`deleteEntry` 已软删，主列表已隐藏，但用户无法查看/恢复（002 阶段一缺口）。
- **相关代码**：`store/modules/entries.ts`、`shared/entries/visibility.ts`、Profile、`EntryCard`。
- **依赖**：`004-sync-ux-clarity`（合并语义已澄清）。

## 目标

- **必须达成**：
  1. Profile「数据与安全」入口进入 **回收站** 页。
  2. 列表展示 **仅软删** 条目（`onlySoftDeletedEntries`），按删除时间降序。
  3. **恢复** 单条：`restoreEntry` 清除 `deletedAt`，主列表再现。
  4. 删除确认文案说明「移至回收站」。
- **不在本次范围**：永久删除（B4 / 007）、批量恢复、回收站自动清空。

## 验收标准

- [x] 回收站路由与列表
- [x] `restoreEntry` store action
- [x] 单测 `onlySoftDeletedEntries`
- [x] 空状态与计数副文案
- [x] Web E2E 主路径（`e2e/recycle-bin-main-path.spec.ts`）

## 依据

- `iteration-roadmap-2026.md` 005；`002` 阶段一「回收站或筛选可见」。
