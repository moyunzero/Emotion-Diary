# UI-LAYOUT：Profile + 回收站布局统一

## Understanding Summary

1. **范围**：仅 Profile 与回收站。
2. **目标**：Profile 贴近 Apple Settings 分组；回收站条目贴近首页 `EntryCard`（只读 + 轻量操作）。
3. **Profile**：不改信息架构，视觉对齐（边距、footnote、sync 进分组首行）。
4. **回收站**：标题下 footnote；`RecycleBinEntryCard` + 文字操作行；保留 Alert 确认。
5. **非目标**：批量操作、清空回收站、左滑、改 store/sync 逻辑。

## Assumptions

| 假设 | 说明 |
| --- | --- |
| 条目量 | 回收站通常 &lt;100 条，`FlashList` 足够 |
| 组件 | `EntryCard` 只读变体，不复制 700 行交互逻辑 |
| Token | `DESIGN_TOKENS` + `createResponsiveMetrics` |
| 恢复色 | `COLORS.primaryDark`，非 `COLORS.error` |

## Decision Log

| 决策 | 备选 | 理由 |
| --- | --- | --- |
| 文字链操作（C） | 左滑 / 长按 | tall card 最佳实践 + 可发现性 |
| footnote 标题下 | 列表上方独立块 | Apple「最近删除」 |
| `GroupedSettingsCard` | 仅改 style | 统一分组、可复用 |
| sync 进分组首行 | 独立灰条 | 消除宽度错位 |
| Profile 视觉对齐 A | 结构重组 B | YAGNI |

## 组件结构

### 新增（`components/settings/`）

- **`ScreenFootnote`** — xs 灰色说明/footer。
- **`GroupedSettingsCard`** — 白底圆角分组 + 可选 `statusRow` + children。
- **`ProfileSection`**（可选）— Header + footnote? + GroupedSettingsCard。

### Profile

```
AppScreenShell
└─ ScrollView
   ├─ ProfileHeaderSection
   ├─ ProfileStatsSection
   └─ ProfileSettingsSection
      ├─ ProfileSection「数据与安全」
      │   ├─ ScreenFootnote（sectionHint）
      │   └─ GroupedSettingsCard
      │       ├─ statusRow（最后同步）
      │       ├─ 备份 / 合并 / 回收站
      │       └─ ScreenFootnote（合并语义，分组下）
      └─ ProfileSection「留存与提醒」
          └─ GroupedSettingsCard
```

### 回收站

```
AppScreenShell title="回收站"
├─ ScreenFootnote（标题下、列表上）
├─ FlashList → RecycleBinEntryCard
│   ├─ mood + 日期 + 内容预览（EntryCard 布局）
│   └─ actionRow: 恢复 · 永久删除
└─ EmptyState
```

## 样式 Token

### 页面级

| Token | 值 |
| --- | --- |
| 背景 | `COLORS.background.page` |
| 水平边距 | `createResponsiveMetrics().padding.horizontal` |
| 区块间距 | `SPACING.xxl` |

### GroupedSettingsCard

| 属性 | Token |
| --- | --- |
| 背景 | `COLORS.background.primary` |
| 圆角 | `DESIGN_TOKENS.borderRadius.xl` |
| 阴影 | `DESIGN_TOKENS.shadow.md` |
| 行 padding | `DESIGN_TOKENS.spacing.lg` |
| 分隔线 | `COLORS.gray[100]`, `marginLeft: 68` |

### ScreenFootnote

| 属性 | Token |
| --- | --- |
| 字号 | `fontSize.xs` (12) |
| 颜色 | `COLORS.text.tertiary` |
| 行高 | 18 |

### RecycleBinEntryCard

| 区域 | Token |
| --- | --- |
| 外壳 | `borderRadius.xl` + `shadow.md` + `padding.lg`（同 EntryCard） |
| mood badge | 44×44, radius 14 |
| 操作行 | 顶部分隔线；恢复 `primaryDark`；删除 `error` |

## 边界情况

| 场景 | 处理 |
| --- | --- |
| 仅音频无文字 | 「（无文字内容）」+ 可选「含语音」 |
| 操作中 | 禁用同卡 action + loading |
| 空回收站 | 居中 empty + footnote |
| 长内容 | `numberOfLines: 3` |

## 实现文件（计划）

```
components/settings/ScreenFootnote.tsx
components/settings/GroupedSettingsCard.tsx
components/entries/RecycleBinEntryCard.tsx
features/recycleBin/RecycleBinScreen.tsx
features/recycleBin/recycleBin.styles.ts
features/profile/components/ProfileSettingsSection.tsx
styles/components/Profile.styles.ts
```

可选：`shared/styles/entryCardShell.ts`（shell 常量抽离，非必须）。
