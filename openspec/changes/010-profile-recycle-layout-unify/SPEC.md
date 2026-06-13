# SPEC：Profile + 回收站布局统一（010）

## 背景

- **当前问题**：Profile 分组列表与回收站卡片视觉语言不一致；回收站「恢复」误用 destructive 红色 pill 按钮；Profile「最后同步」独立灰条与下方白卡片宽度错位。
- **相关代码**：`features/profile/`、`features/recycleBin/`、`components/EntryCard.tsx`、`components/Profile/`。
- **设计依据**：头脑风暴确认 — D（EntryCard 视觉）+ A（Apple 分组列表）；详见 [`UI-LAYOUT.md`](./UI-LAYOUT.md)。

## 目标

- **必须达成**：
  1. 抽出 `GroupedSettingsCard`、`ScreenFootnote` 供 Profile 分组使用。
  2. Profile「数据与安全」：sync 状态收进分组首行；section 说明改为 footnote 样式；分组间距/边距统一。
  3. 回收站：标题下 footnote（Apple「最近删除」结构）；`RecycleBinEntryCard` 只读卡片 + 文字操作行（恢复品牌色 / 永久删除 destructive）。
  4. 回收站卡片外壳与首页 `EntryCard` 一致（shadow 白卡，非细边框 pill）。
- **不在本次范围**：左滑/长按操作、批量清空、改 sync/提醒业务逻辑、其他二级页、Dashboard EntryCard 功能变更。

## 验收标准

- [x] Profile 两分组视觉与边距一致；「最后同步」与 menu 同宽且在白卡片内
- [x] 回收站 footnote 在标题下、列表上
- [x] 「恢复」非 error 色；「永久删除」为 destructive 红字；无 pill 按钮
- [x] `yarn typecheck` / `yarn lint` / `yarn test` 通过
- [x] 回收站恢复/永久删除 — Playwright + Maestro E2E

## 依据

- 用户确认之 brainstorm（2026-06-13）；`005-recycle-bin-ui` 功能已完成，本变更仅 UI 统一。
