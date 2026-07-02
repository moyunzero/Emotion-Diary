---
phase: 011
slug: metaphor-activation
status: draft
shadcn_initialized: false
preset: none
created: 2026-07-01
---

# Phase 011 — 全站 UI 风格一致性设计契约

> 温馨粉色疗愈风格在全站的视觉与交互规范。由 gsd-ui-researcher 产出，供 gsd-ui-checker / planner / executor 消费。  
> **权威源**：[`constants/colors.ts`](../../../constants/colors.ts) `COLORS` + `DESIGN_TOKENS`；[`VISUAL-IDENTITY.md`](./VISUAL-IDENTITY.md) 为 011 设计方向。

---

## Design Intent

**产品定位**：关系情绪日记——把关系里的天气记给自己看，非泛情绪打卡。

**视觉人格**：
- **温馨粉色疗愈**：玫瑰粉 `#FB7185` / `#FDA4AF` 为主调，淡紫柔光区分天气与信息层级
- **花园生长隐喻**：洞察页以「生长绿」`accent` / `ritual.resolve` 表达治愈进度，不与主粉冲突
- **双仪式可辨**：和解（绿/生长）与焚烧（橙/释放）保留语义色差，但包裹在同一粉系页面语境中
- **禁止跳色**：黄绿背景 `#FEF3C7` / `#F0FDF4`、功能蓝 `#3B82F6`、录音紫 `#6C63FF`、品牌红 `#EF4444` 作强调均不得再出现

**与上游文档关系**：
| 文档 | 状态 | 本契约处理 |
|------|------|------------|
| [`VISUAL-IDENTITY.md`](./VISUAL-IDENTITY.md) | 011 设计规范 | **主依据** |
| [`openspec/ui-components.md`](../../ui-components.md) §配色 | **过时**（仍写 `#FFF5F5→#F0FDF4` 粉绿渐变） | 以本契约 + VISUAL-IDENTITY 为准；ui-components 待 docs 同步 |
| [`constants/colors.ts`](../../../constants/colors.ts) | 已落地粉系 token | 本契约扩展语义别名与迁移目标 |
| VISUAL-IDENTITY §5 vs §2.2 | **轻微冲突**：§5 记一笔 CTA 用 `primaryDark`；§2.2 保留 `submit` 红仅 destructive | **收敛**：`submit` 红仅 destructive/错误；品牌 CTA 统一 `primaryDark` |

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none（Expo React Native，非 shadcn Web） |
| Preset | not applicable |
| Component library | 项目自研 StyleSheet + token |
| Icon library | lucide-react-native |
| Display font | 霞鹜文楷 GB / Fraunces 600（气象指数、花园标题） |
| Body font | 系统默认 + Lato 400/700（en） |

---

## Spacing Scale

沿用 `DESIGN_TOKENS.spacing`（4 的倍数）：

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | 标签内边距、icon 间距 |
| sm | 8px | 紧凑元素、Tab label margin |
| md | 12px | Banner 内边距 |
| lg | 16px | 卡片内边距、表单区块间距 |
| xl | 20px | Tab 圆角区、section gap |
| xxl | 24px | 页面水平 padding、空状态间距 |
| xxxl | 32px | 表单 section 间距 |

**触控例外**：
- 最小可点区域：**44×44px**（筛选按钮、EntryCard 操作 icon 容器 42→44）
- Tab bar 高度：`60 + safeArea.bottom`

---

## Typography

| Role | Size | Weight | Line Height | Font | Usage |
|------|------|--------|-------------|------|-------|
| Display | 24–32px (`xxl`–`xxxl`) | 600–700 | 1.2 | Display 栈 | 气象指数、GardenHeader 标题 |
| Heading | 16–18px (`md`–`lg`) | 600–700 | 1.25 | Lato Bold / 系统 | 卡片标题、列表标题、section 标题 |
| Body | 14px (`base`) | 400 | 1.5 | Lato / 系统 | 日记正文、说明文案 |
| Label | 10–12px (`xs`–`sm`) | 600 | 1.4 | Lato / 系统 | Tag、倒计时、filter 选项、Tab label |

**011 范围**：Display 仅用于 `WeatherStation` 主指数与 `GardenHeader`；不全站替换 body。

---

## Color System

### 60 / 30 / 10 分配

| Role | Token | Hex | 占比与用途 |
|------|-------|-----|------------|
| Dominant (60%) | `background.page` / `gradientStart` | `#FFF5F7` | 页面底、记一笔/Profile 单色背景 |
| Dominant (60%) | `background.gradientEnd` | `#FFE4E6` | 渐变底（Dashboard、Insights） |
| Secondary (30%) | `background.primary` | `#FFFFFF` | 卡片、Tab bar、Modal、下拉 |
| Secondary (30%) | `background.secondary` / `tertiary` | `#FFF5F7` / `#FFE4E6` | 输入框底、空状态 icon 圆、avatar 占位 |
| Accent (10%) | `primaryDark` | `#FB7185` | **品牌交互强调**（见下表） |
| Accent (10%) | `primary` / `primaryLight` | `#FDA4AF` / `#FECDD3` | 选中 tag 底、resolved 角标、粒子 |

**Accent (`primaryDark`) 保留用于**：
- Tab 激活 icon/label
- 主 CTA 实心按钮（记一笔提交、空状态「去记一笔」、Banner action）
- Filter 选中文字、advanced toggle 链接
- 倒计时 tag 文字、Insights 卡片 accent 图标
- Tag 选中态文字（替代 `COLORS.error`）

**Accent 禁止用于**：destructive 确认、删除、同步失败、Toast error。

### 完整语义色表

| 语义 | Token | Hex | 用途 |
|------|-------|-----|------|
| 品牌主 | `primary` | `#FDA4AF` | 装饰、粒子、轻强调 |
| 品牌强调 | `primaryDark` | `#FB7185` | CTA、Tab、选中态 |
| 品牌浅 | `primaryLight` | `#FECDD3` | Tag 底、角标底 |
| 生长/治愈 | `accent` | `#86EFAC` | 花园 blooming、和解仪式 icon、HealingProgress 环 |
| 和解仪式 | `ritual.resolve` | `#86EFAC` | ResolveRitualHost 确认钮；**EntryCard 操作用** `mood.icon.level4` |
| 焚烧仪式 | `ritual.burn` | `#F97316` | EmotionReleaseArchive 火焰；**EntryCard 操作用** `mood.icon.level5` |
| Destructive | `error` / `submit`* | `#EF4444` | **仅**删除确认、登出、同步错误、Toast error、Switch 危险态 |
| 成功 | `success` | `#10B981` | Toast success；**禁止** EntryCard Resolve icon |
| 信息 | `info` | `#3B82F6` | **废弃作 UI 强调**；仅 Toast info 或待移除 |
| 警告 | `warning` | `#F59E0B` | Insights `growingColor`、deadline week 文字 |

\* **`COLORS.submit` 迁移目标**：语义合并入 `primaryDark`（品牌 CTA）或 `error`（destructive）；不再单独作品牌色。

### Mood 等级（粉系递进）

| Level | Token | Hex |
|-------|-------|-----|
| 1 | `mood.level1` | `#FFF1F2` |
| 2 | `mood.level2` | `#FECDD3` |
| 3 | `mood.level3` | `#FDA4AF` |
| 4 | `mood.level4` | `#FB7185` |
| 5 | `mood.level5` | `#E11D48` |

### Weather / Atmosphere

| 档位 | `atmosphere.*` | `weatherCard.*` | 页面叠层 |
|------|----------------|-----------------|----------|
| sunny | `#FFF1F2` | bg `#FFF1F2`, icon `#FB7185` | 光斑 `weather.sunny` |
| cloudy | `#FAF5FF` | bg `#FAF5FF`, icon `#C084FC` | — |
| rainy | `#F5F3FF` | bg `#EDE9FE`, icon `#A78BFA` | 雨丝 **`weather.rainy`**，非 `info` 蓝 |
| stormy | `#FFE4E6` | bg `#FFE4E6`, icon `#FB7185` | — |

### Deadline Tags（迁移至粉系）

| 类型 | 当前 | 目标 |
|------|------|------|
| today | `#FEE2E2` / `#991B1B` | 保留（玫瑰警示，协调粉调） |
| week | `#FED7AA` / `#9A3412` | 保留（橙棕，近 ritual.burn 族） |
| month | `#FFE4E6` / `#BE123C` | 保留 |
| later | `#DBEAFE` / `#1E40AF` | **改为** bg `#FAF5FF`, text `#6B21A8`（与 cloudy 一致） |
| self | `#F3F4F6` / `#374151` | 保留 |

### 音频 UI（新增 token 建议）

| 语义 | 建议 token | Hex | 替代 |
|------|------------|-----|------|
| 录音主色 | `audio.primary` → 映射 `primaryDark` | `#FB7185` | `#6C63FF` |
| 录音浅底 | `audio.surface` → `atmosphere.rainy` | `#F5F3FF` | `#EEF2FF` |
| 停止/删除 | `error` | `#EF4444` | `#FF5252` |

### Insights 专用别名

`INSIGHTS_COLORS` 继续映射全局 token，**禁止**模块内新增独立 hex：

```typescript
accent → primaryDark
secondary → accent (#86EFAC)
bloomingColor → accent
growingColor → warning
needWaterColor → primaryDark
bgStart/bgEnd → background.gradientStart/End
```

---

## Component Contracts

### PrimaryButton

**用途**：记一笔提交、空状态 CTA、Banner action、Modal 主确认（非 destructive）。

| 属性 | 值 |
|------|-----|
| 背景 | `COLORS.primaryDark` |
| 文字 | `COLORS.text.inverse`，16px，weight 700 |
| 圆角 | `DESIGN_TOKENS.borderRadius.large` (16) |
| 内边距 | vertical 16px，horizontal 24px（空状态） |
| 阴影 | `DESIGN_TOKENS.shadow.lg`–`xl` |
| Disabled | opacity 0.5 |
| 禁止 | `COLORS.submit`、`#EF4444` |

**现有文件**：`styles/sharedStyles.ts` submitButton、`styles/components/MoodForm.styles.ts` moodTipCloseButton、`styles/components/Dashboard.styles.ts` emptyButton、`components/retention/retention.styles.ts` action（已正确）。

### SecondaryButton

**用途**：和解仪式确认、次要表单操作。

| 属性 | 值 |
|------|-----|
| 背景 | `COLORS.ritual.resolve` 或 `COLORS.background.secondary` |
| 文字 | resolve 钮用 `#FFFFFF`；secondary 用 `text.primary` |
| 圆角 | 16px |
| 边框 | 可选 1px `primaryLight` |

**参考**：`ResolveRitualHost.tsx` confirm 态已用 `ritual.resolve`。

### GhostButton

**用途**：筛选、返回、advanced toggle、卡片操作（非仪式）。

| 属性 | 值 |
|------|-----|
| 背景 | transparent 或 `background.secondary` |
| 文字/Icon | 默认 `text.secondary`；激活/链接 `primaryDark` |
| 触控 | 44×44 最小 |

**参考**：Dashboard filterButton（透明，已正确）；`MoodForm` advancedToggle 文字改 `primaryDark`。

### Card

**用途**：EntryCard、Insights 子卡片、WeatherStation 内层。

| 属性 | 值 |
|------|-----|
| 背景 | `background.primary` |
| 圆角 | 16–20px (`large`–`xl`) |
| 阴影 | `DESIGN_TOKENS.shadow.md` |
| Active 描边 | 1px `atmosphere.cloudy` (`#FAF5FF` 可见度需 100% 不透明描边) |
| Resolved | opacity 0.5 + 右上角 `primaryLight` 花瓣角标 |

### FilterBar

**用途**：Dashboard 全部/未处理/已和解。

| 属性 | 值 |
|------|-----|
| 容器背景 | transparent |
| 触发 icon | 默认 `text.secondary`；打开 `primaryDark` |
| 下拉项选中背景 | `background.page` |
| 下拉项选中文字 | **`primaryDark`**（非 `submit`） |
| 下拉项默认文字 | `text.secondary` |

### EntryCardActions

四宫格操作：**Edit / Resolve / Burn / Delete**；**统一粉底 + 灰标签**，icon 在玫瑰色阶内递进；`ritual.*` 仅用于全屏仪式/确认弹窗，**禁止**用于卡片操作栏。

| 操作 | Icon 色 | Icon 底 | 标签 |
|------|---------|---------|------|
| Edit | `primaryDark` | `background.secondary` | `text.secondary` |
| Resolve | `mood.icon.level4` | `background.secondary` | `text.secondary` |
| Burn | `mood.icon.level5` | `background.secondary` | `text.secondary` |
| Mic / Pause | `primaryDark` | `audio.surface` | — |
| Delete（软删） | `text.tertiary` | `background.secondary` | `text.tertiary` |

**audioTag / audioPlay**：文字与 icon 用 `primaryDark`；tag 底 `audio.surface`。

### TabBar

| 属性 | 值 |
|------|-----|
| 背景 | `rgba(255,255,255,0.98)` |
| 激活 | `COLORS.tab.active` = `primaryDark` |
| 未激活 | `COLORS.tab.inactive` = `gray.400` |
| 顶圆角 | 20px |
| Icon size | 28px |

**状态**：`app/(tabs)/_layout.tsx` 已合规。

### ScreenBackground

| 页面 | 实现 |
|------|------|
| Dashboard | `ScreenGradient` + `DashboardAtmosphere` 叠层 |
| Insights | `ScreenGradient` + `GardenAmbience` |
| 记一笔 Record | `background.page` 单色 `#FFF5F7`（无渐变） |
| Profile | `background.page` 单色 |
| Modal | `background.primary` |

**组件**：[`components/ScreenGradient.tsx`](../../../components/ScreenGradient.tsx) — 竖向 `#FFF5F7 → #FFE4E6`。

### Tag / Badge

| 类型 | 背景 | 文字 |
|------|------|------|
| 默认 tag | `background.primary` + border `gray.200` | `text.tertiary` |
| 选中 tag | `primaryLight` 或 `#FFF1F2` | **`primaryDark`**（非 `error`） |
| 选中 border | `primary` 或 `#FCA5A5` | — |
| trigger tag | `#FDF2F8` | `#F472B6` 或 `primaryDark` |
| countdown tag | `primaryLight` 60% | `primaryDark` |
| prescription 警示 badge | `deadline.today.bg` | `deadline.today.text` |

---

## Page-Level 规范

### 气象站 Dashboard

| 元素 | 规范 |
|------|------|
| 背景 | ScreenGradient + Atmosphere 粒子 |
| WeatherStation 卡片 | `weatherCard[condition]` 全套 token |
| 列表头 / 筛选 | 透明底，垂直居中 44px |
| 空状态 | icon 圆 `background.secondary` + `primaryLight` icon；CTA PrimaryButton |
| Avatar 占位 | **`primaryDark`** 底（非 submit 红） |
| RevisitBanner | 已用 `tab.active` — 保持 |

### 记一笔 Record / MoodForm

| 元素 | 规范 |
|------|------|
| 背景 | `background.page` |
| 情绪选择 | 选中 scale 1.05；颜色来自 mood 等级 / weather icon |
| 期限 chip 选中 | 保持 `text.primary` 实心（中性黑粉语境可接受） |
| TagSelector 选中 | 粉底 + `primaryDark` 字 |
| 提交钮 | PrimaryButton（`primaryDark`） |
| 录音控件 | `audio.primary` 系，非紫 |

### 洞察 Insights

| 元素 | 规范 |
|------|------|
| 背景 | ScreenGradient + GardenAmbience |
| 卡片 | 白底 + shadow.md；标题 icon `INSIGHTS_COLORS.accent` |
| 进度环 | stroke `accent`；底环 `gray.200` |
| EmotionReleaseArchive | 火焰 `#EA580C` → `ritual.burn`；resolved 笔记 icon → `ritual.resolve` |
| PrescriptionCard 警示区 | 用 `deadline.today.*` 或粉系 tertiary，非孤立 `#FEF2F2` 硬编码 |
| EmptyGarden CTA 文字 | `INSIGHTS_COLORS.accent` |

### Profile

| 元素 | 规范 |
|------|------|
| 背景 | `background.page` |
| 设置项 icon 底 | `background.secondary` 或 `primaryLight` 15% |
| 选中 check / 语言 | `primaryDark`（非蓝 `#3B82F6`） |
| 同步成功 | `accent` 或 `success`（Toast 级，非列表主色） |
| 危险操作（登出/删号） | `error` + 底 `#FEE2E2` — **允许** |
| ActivityIndicator | `primaryDark`（非 `#EF4444`） |
| CompanionDays 里程碑 | `primaryDark`（非红） |

---

## Copywriting Contract

| Element | zh-Hans | en-US 方向 |
|---------|---------|------------|
| Primary CTA（记一笔） | 保存到情绪日记 / record.submit | Save to diary |
| 空状态标题 | dashboard.empty.title | 沿用 i18n |
| 空状态按钮 | 去记一笔 | Record a moment |
| Insights 空花园 | 种下第一颗种子吧 | Plant your first seed |
| Error state | 说明问题 + 「请稍后再试」/ 检查网络 | problem + next step |
| Destructive — 焚烧 | 确认焚烧：「气话焚烧后无法恢复」 | Burn confirm |
| Destructive — 删除账号 | 二次确认 + error 色按钮 | Account deletion |
| Resolve 确认 | 和解仪式 copy（i18n resolve.*） | Resolve ceremony |

---

## Migration Map

按 **P0 → P1 → P2** 优先级。格式：`文件` | 当前 | 目标 token

### P0 — 品牌跳色（用户第一眼）

| 文件 | 当前 | 目标 |
|------|------|------|
| `styles/sharedStyles.ts` | `submitButton` → `COLORS.submit` | `primaryDark` |
| `styles/components/MoodForm.styles.ts` | submit、moodTipClose、advancedToggle | `primaryDark` |
| `styles/components/Dashboard.styles.ts` | filterOptionTextActive、emptyButton、avatarPlaceholder | `primaryDark` |
| `styles/components/Record.styles.ts` | submitButton | `primaryDark` |
| `components/EditEntryModal/EditEntryModal.styles.ts` | submitButton、链接色 | `primaryDark` |
| `components/EntryCard.tsx` L726–764 | Edit `#3B82F6`, Resolve `#10B981`, Burn `#FF4500`, Mic `#6C63FF` | 见 EntryCardActions 表 |
| `components/TagSelector.tsx` | selected bg `#FEF2F2`, text `COLORS.error` | `primaryLight` / `#FFF1F2`, text `primaryDark` |

### P1 — 音频 & 卡片样式文件

| 文件 | 当前 | 目标 |
|------|------|------|
| `components/AudioRecorder/RecordButton.tsx` | `#6C63FF`, stop `#FF5252` | `primaryDark`, `error` |
| `components/AudioRecorder/WaveformView.tsx` | `#6C63FF` | `primaryDark` |
| `components/AudioRecorder/AudioPreview.tsx` | 紫/红硬编码 | `primaryDark` / `error` |
| `components/AudioRecorder/AudioRecorder.tsx` | icon `#6C63FF` | `primaryDark` |
| `styles/components/EntryCard.styles.ts` | `#EEF2FF`, `#6C63FF`, `#EF4444` audio 失败 | `audio.surface`, `primaryDark`, `error` |
| `components/entries/RecycleBinEntryCard.tsx` | 紫/黄 `#FEF3C7` | token 对齐 EntryCard |

### P1 — Profile & 全局 chrome

| 文件 | 当前 | 目标 |
|------|------|------|
| `features/profile/components/ProfileSettingsSection.tsx` | 多处 `#3B82F6`, `#10B981`, `#EF4444`, `#FEF2F2` | check/语言 → `primaryDark`；危险 → `error`；icon 底 → `primaryLight` |
| `features/profile/styles/profileScreen.styles.ts` | submit 红 avatar/按钮 | `primaryDark` |
| `features/profile/ProfileScreen.tsx` | ActivityIndicator `#EF4444` | `primaryDark` |
| `components/CompanionDaysModal.tsx` | `#EF4444`, `#FEF2F2` | `primaryDark`, `background.secondary` |
| `types/companionDays.ts` | 里程碑绿/蓝/红 | 粉/紫/橙粉系档位 |

### P2 — Insights 残余 & 氛围

| 文件 | 当前 | 目标 |
|------|------|------|
| `components/Insights/EmotionReleaseArchive.tsx` | `#EA580C`, `#16A34A`, `#FFF7ED` | `ritual.burn`, `ritual.resolve`, 橙粉 surface |
| `components/Insights/PrescriptionCard.tsx` | `#FEF2F2`, `#FEE2E2`, `#991B1B` | `deadline.today.*` 或 COLORS 引用 |
| `components/Insights/InsightsDeferredSections.tsx` | ActivityIndicator `#EF4444` | `primaryDark` |
| `components/DashboardAtmosphere.tsx` L102 | rainStreak `COLORS.info` | `weather.rainy` 或 `weatherCard.rainy.icon` |
| `components/retention/WeeklyReviewBanner.tsx` | ImageIcon `#3B82F6` | `primaryDark` |
| `constants/colors.ts` | `deadline.later` 蓝 | 粉紫 cloudy 系 |
| `utils/avatarPresets.ts` | 绿/黄装饰 | 粉/紫/accent 叶 |
| `components/icons/MessageIcon.tsx` | 绿/蓝/红 | 粉/紫/ error 仅 destructive |
| `components/ai/EmotionPodcast.tsx` | 多处硬编码 | 批量换 INSIGHTS_COLORS |

### P2 — 文档同步

| 文件 | 动作 |
|------|------|
| `openspec/ui-components.md` §配色 | 更新为粉系渐变，移除 `#F0FDF4` |
| `constants/colors.ts` | 可选：新增 `audio.*`；`submit` 标注 deprecated |
| `COLORS.shadow.submit` | 改映射 `primaryDark` 或移除 |

---

## Anti-Patterns

**禁止硬编码（新代码 & 触达迁移）**：

| 色值 | 原因 | 替代 |
|------|------|------|
| `#EF4444` / `COLORS.submit` | 品牌强调 | `primaryDark`（CTA）或 `error`（destructive） |
| `#3B82F6` / `COLORS.info` | Material 蓝跳色 | `primaryDark` 或 Toast info 暂留 |
| `#6C63FF` | 旧录音紫 | `primaryDark` + `audio.surface` |
| `#10B981` | Resolve 误用 success 绿 | `ritual.resolve` |
| `#FF4500` / `#FF5252` | 焚烧/停止应用 ritual/error | `ritual.burn` / `error` |
| `#FEF3C7` / `#F0FDF4` | 黄绿背景 | `background.page` / `atmosphere.sunny` |
| `#EEF2FF` / `#DBEAFE` | 冷蓝底 | `atmosphere.rainy` / `FAF5FF` |
| `#FEF2F2` 作品牌选中 | 与 error 底混淆 | `primaryLight` / `#FFF1F2` |

**禁止行为**：
- 用 `success` / `info` 作卡片操作 icon 色
- 在 Insights 新建与 `INSIGHTS_COLORS` 平行的 hex
- Tab / Filter / Tag 选中使用 `submit` 红
- 仪式色（resolve/burn）扩散到非仪式 CTA

---

## Accessibility

### 对比度（WCAG AA 目标 4.5:1 正文 / 3:1 大字）

| 组合 | 风险 | 建议 |
|------|------|------|
| `primaryDark` `#FB7185` on `#FFFFFF` | 大字/按钮 OK；小字 label 边缘 | 小字用 `text.primary`；粉仅 icon/按钮底+白字 |
| `primaryDark` on `#FFF5F7` | 对比偏低 | 链接加 underline 或 weight 700 |
| `text.secondary` `#6B7280` on `#FFE4E6` | 中等 | 正文避免放渐变底；卡片内用白底 |
| `ritual.resolve` on white | 绿 on 白 OK | 保持 |
| `ritual.burn` on `#FFF7ED` | 检查 icon 尺寸 ≥20px | 保持 |
| Tab inactive `#9CA3AF` on white | 通过 | 保持 |

### 触控 & 读屏

- 所有卡片操作：`accessibilityLabel` 沿用 i18n（edit / resolve / burn）
- 仪式动画：保留「跳过」可聚焦按钮
- 禁止仅靠颜色区分 Resolve vs Burn — 必须 icon + 文案并存（已满足）

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| N/A | — | Expo RN 项目，无 shadcn registry |

---

## VISUAL-IDENTITY 冲突与收敛建议

| 冲突点 | 说明 | 收敛 |
|--------|------|------|
| CTA 红 vs 粉 | VISUAL-IDENTITY §5 要求记一笔 `primaryDark`；代码仍大量 `submit` | **本契约锁定 primaryDark**；`submit` 标记 deprecated |
| `success` / `info` 保留在 COLORS | 与「禁止跳色」并存 | 限 Toast / 系统反馈；不进卡片 icon |
| `deadline.later` 蓝色 | colors.ts 未改 | P2 改为 cloudy 粉紫 |
| ui-components.md 粉绿渐变 | 与 VISUAL-IDENTITY 矛盾 | 文档同步，以 VISUAL-IDENTITY 为准 |
| DashboardAtmosphere 雨丝用 `info` | 实现偏离 VISUAL-IDENTITY 粉紫天气 | 改 `weather.rainy` |
| Tag 选中用 error 红 | 未在 VISUAL-IDENTITY 明示 | 本契约补充为 primaryDark |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

## 验收勾选（011 M5 扩展）

- [ ] P0 文件无 `COLORS.submit` 作 CTA/选中强调
- [ ] EntryCard 四操作 icon 无 `#3B82F6` / `#10B981` / `#6C63FF` / `#FF4500`
- [ ] AudioRecorder 全模块无 `#6C63FF`
- [ ] Profile 设置 check 无 `#3B82F6`
- [ ] Dashboard filter 选中文字为 `primaryDark`
- [ ] `yarn typecheck` / `yarn lint` 全绿
- [ ] Maestro 011 acceptance 截图视觉抽检通过
