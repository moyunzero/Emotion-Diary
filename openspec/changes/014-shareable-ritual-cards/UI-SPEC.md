---
phase: 4
slug: shareable-ritual-cards
status: approved
shadcn_initialized: false
preset: none
created: 2026-07-02
openspec: openspec/changes/014-shareable-ritual-cards/
requirements: SHR-01, SHR-03, SHR-04, SHR-05
extends: openspec/changes/011-metaphor-activation/UI-SPEC.md
---

# Phase 4 — 可分享周回顾卡片 UI 设计契约

> 竖版 9:16 share card：**周回顾**导出，温和传播、零 PII。  
> **2026-07-01 范围变更：** SHR-02 和解/焚烧仪式分享卡已取消；下文 Resolve/Burn/Preview/CTA 章节仅作历史参考，**勿实现**。  
> **权威源**：011 [`UI-SPEC.md`](../011-metaphor-activation/UI-SPEC.md) + [`VISUAL-IDENTITY.md`](../011-metaphor-activation/VISUAL-IDENTITY.md) §6 + [`constants/colors.ts`](../../../constants/colors.ts) `COLORS` / `DESIGN_TOKENS`。  
> **上游锁定**：[`04-CONTEXT.md`](../../../.planning/phases/04-shareable-ritual-cards/04-CONTEXT.md) D-01～D-18。

---

## Design Intent

**Phase 边界**：SHR-01、SHR-03–SHR-05。用户可将 **周回顾** 导出为竖版 PNG 存相册（Web 下载）。**不含**：和解/焚烧仪式分享卡（SHR-02 已取消）、应用内社交 feed、系统 `Share.share` sheet、人物/触发器/日记全文、自动弹出分享流程、Phase 5 回访 Banner 动态 copy。

**传播心理**：温和、可存相册发圈；统一粉壳；week = 回顾。

**叙事 tone**：温暖、短句、隐喻优先（天气 + 花园）；非数据表格、非统计报告。对齐 VISUAL-IDENTITY §6 商店截图脱敏原则。

**上游锁定决策**（`04-CONTEXT.md`）：

| ID | 决策 |
|----|------|
| D-01 | 固定竖版 **9:16**，导出 **1080×1920** PNG |
| D-02 | **统一外壳**（粉系 011）+ **三套内容变体**（week / resolve / burn） |
| D-03 | 视觉重心 = **气象 + 花园隐喻**，非数据表格 |
| D-04 | 文案跟随 App **当前 locale**（zh-Hans / en-US） |
| D-05 | **绝不自动弹出**分享；仅用户点击 CTA |
| D-06 | 入口 = 仪式完成 UI **内嵌小按钮**「生成分享卡」 |
| D-07 | 和解：ceremony 结束（Skip 或自然完成）后显示 CTA |
| D-08 | 焚烧：burn-complete toast 内与 micro-copy 同屏 CTA |
| D-09 | 默认 = **纯隐喻句**，无日记原文 |
| D-10 | 预览页 **opt-in**「加一句自己的话」；**默认关闭** |
| D-11 | 周卡 = 天气隐喻 + 花园成长 + AI 结语；**无** Top 触发器/统计块 |
| D-12 | **永不**展示人名、触发器、可识别关系标签 |
| D-13 | iOS/Android **存系统相册**；复用 `captureRef` + `expo-media-library` |
| D-14 | Web = **PNG 下载**（非 Alert unsupported） |
| D-15 | 复用 `review_export_privacy_ack_v1` 隐私确认 |
| D-16 | **不做**系统 Share sheet |
| D-17 | 水印 = 底部一行小字 + 可选日期 |
| D-18 | 仪式 accent（绿/橙）仅图标或边条，**非**整卡染色 |

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none（Expo React Native StyleSheet + `COLORS` / `DESIGN_TOKENS`） |
| Preset | not applicable |
| Component library | 项目自研 StyleSheet + token |
| Icon library | lucide-react-native |
| Display font | 霞鹜文楷 GB / Fraunces 600（卡片主标题，可选） |
| Body font | Lato 400/700（en）+ 系统默认（zh） |
| Capture | `react-native-view-shot` `captureRef` + `PixelRatio` |
| Persist | `expo-media-library`（native）/ anchor download（web） |

**011 继承**：间距、Typography 角色、60/30/10 色分配、PrimaryButton 规范 **不变**。本 Phase 新增 `ShareCardShell`、`ShareCardWeekContent`、`ReviewExportScreen` 9:16 预览与 opt-in。

---

## Spacing Scale

沿用 `DESIGN_TOKENS.spacing`（4 的倍数）。**011 继承例外**：`md`（12px）、`xl`（20px）已写入 `constants/colors.ts`，本 Phase 沿用。

| Token | Value | Phase 4 用途 |
|-------|-------|--------------|
| xs | 4px | 水印与内容区间距；accent 边条与 icon gap |
| sm | 8px | 天气行 icon 间距；CTA 与 toast 文案间距 |
| md | 12px *(011 例外)* | 卡片内 section 标题下间距 |
| lg | 16px | **ShareCardShell 内边距**（逻辑 48px @3x → 见布局节）；预览屏 control 区 padding |
| xl | 20px *(011 例外)* | 仪式 CTA 按钮 horizontal padding |
| xxl | 24px | 预览 ScrollView 水平 padding；shell 内容与 footer 间距 |
| xxxl | 32px | 预览屏卡片与 opt-in 控件区间距 |

**画幅常量**（`shared/share/shareCardDimensions.ts` 或 `constants/performance.ts`）：

| 常量 | 值 | 说明 |
|------|-----|------|
| `SHARE_CARD_WIDTH_PX` | 1080 | 导出物理宽 |
| `SHARE_CARD_HEIGHT_PX` | 1920 | 导出物理高 |
| `SHARE_CARD_ASPECT_RATIO` | 9/16 | 预览缩放基准 |

**触控例外**（继承 011）：
- 最小可点区域：**44×44px**（仪式内嵌 CTA、预览返回、保存钮）
- 保存主钮高度：**≥ 48px**
- 预览屏 opt-in `Switch`：行高 ≥ 44px（含 label）

**预览缩放**：小屏预览外层 `maxWidth: '90%'` + `aspectRatio: 9/16` 或 `transform: [{ scale }]`；**捕获目标**必须为固定逻辑尺寸的 `ShareCardShell`（WYSIWYG），禁止仅缩放外层。

---

## Typography

本 Phase **卡片内**使用 4 档字号 + 2 档字重；预览屏控件沿用 011 Body/Label。

| Role | Size | Weight | Line Height | Font | Usage |
|------|------|--------|-------------|------|-------|
| Card title | 20px (`xl`) | 600 | 1.25 | Display 或 Lato Bold | 周回顾日期范围；仪式卡类型标题（「种下和解」「气话已飘走」） |
| Metaphor body | 16px (`md`) | 400 | 1.5 | Body | 天气叙事句、花园阶段句、AI 结语、仪式 moment 句 |
| Section label | 12px (`sm`) | 600 | 1.4 | Body | 「本周关系天气」「花园成长」等小标题 |
| Watermark | 12px (`sm`) | 400 | 1.4 | Lato Regular | footer 品牌 + 日期 |
| User snippet | 14px (`base`) | 400 | 1.5 | Body | opt-in 一句（斜体或引号包裹，见内容区） |
| CTA inline | 14px (`base`) | 600 | 1.4 | Body | 仪式内嵌「生成分享卡」 |
| Preview save | 16px (`md`) | 700 | 1.25 | Lato Bold | 预览屏底部保存/下载钮 |

**禁止**：卡片上出现 42px 解决率大数字、柱状图标签、触发器名称（废弃 `ReviewExportCanvas` 统计排版）。

---

## Color System

### 继承 011 60 / 30 / 10

| Role | Token | Hex | Phase 4 用途 |
|------|-------|-----|--------------|
| Dominant (60%) | `background.page` | `#FFF5F7` | ShareCardShell **外缘留白**感（shell 内 secondary 区可选 8% 粉底） |
| Secondary (30%) | `background.primary` | `#FFFFFF` | Shell 主底；内容区卡片 |
| Secondary (30%) | `INSIGHTS_COLORS.cardBg` | `#FFFFFF` | 与 ReviewExport 对齐的壳底 |
| Accent (10%) | `primaryDark` | `#FB7185` | 预览保存钮；周卡天气 icon 主色 |
| Growth | `accent` / `ritual.resolve` | `#86EFAC` | 和解仪式 accent 边条/icon；花园阶段 icon |
| Release | `ritual.burn` | `#F97316` | 焚烧仪式 accent 边条/icon |
| Muted | `text.secondary` | `#6B7280` | 水印、section label |
| Body text | `text.primary` | `#1F2937` | 隐喻正文 |

**Accent (`primaryDark`) 保留用于**：
- 预览屏「保存到相册」/「下载图片」主钮
- 周卡主导天气 icon（`weatherCard[condition].icon`）
- 和解/焚烧 **内嵌 CTA 文字**（Ghost 样式，非实心大钮）

**Accent 禁止用于**：shell 整卡背景、destructive、水印抢主视觉。

### ShareCardShell 外壳

| 元素 | 值 |
|------|-----|
| 背景 | `INSIGHTS_COLORS.cardBg` (`#FFFFFF`) |
| 边框 | 1px `INSIGHTS_COLORS.primary` @ 21% (`#FDA4AF35`) |
| 圆角 | `DESIGN_TOKENS.borderRadius.large` (16px) |
| 内边距 | 逻辑 **48px**（@3x 设备 ≈ `DESIGN_TOKENS.spacing.xxl` 24pt × 2 视觉呼吸）；实现可用 `padding: 24` 逻辑点 + 内容区居中 |
| 阴影 | 预览态可选 `DESIGN_TOKENS.shadow.md`；**捕获 PNG 内不加阴影**（避免相册白边异常） |

### 仪式 accent 用法（D-18）

| Variant | Accent token | 应用位置 | 禁止 |
|---------|--------------|----------|------|
| `week` | 无仪式色 | 天气 `weatherCard[condition]` + 花园 `accent` icon only | 整卡绿/橙底 |
| `resolve` | `ritual.resolve` `#86EFAC` | 左侧 **4px 竖条** 或标题旁 `Sprout` 32px | 背景染色 |
| `burn` | `ritual.burn` `#F97316` | 左侧 **4px 竖条** 或标题旁 `Flame` 32px | 背景染色 |

### 天气内容区色

沿用 `COLORS.weatherCard[condition]`：

| condition | 内容区浅底（可选） | 叙事文字 | icon |
|-----------|-------------------|----------|------|
| sunny | `#FFF1F2` | `#9F1239` | `#FB7185` |
| cloudy | `#FAF5FF` | `#6B21A8` | `#C084FC` |
| rainy | `#EDE9FE` | `#5B21B6` | `#A78BFA` |
| stormy | `#FFE4E6` | `#BE123C` | `#FB7185` |

---

## ShareCardShell — 9:16 布局（1080×1920）

**组件**：`components/share/ShareCardShell.tsx`  
**捕获根**：`testID="share-card-canvas"`，`collapsable={false}`

### 逻辑尺寸

```
logicalWidth  = 1080 / PixelRatio.get()
logicalHeight = 1920 / PixelRatio.get()
aspectRatio   = 9 / 16
```

### 竖版线框（三套变体共用外壳）

```
┌──────────────────────────────────────┐  ← 1080×1920 逻辑框
│  ░░░ 粉白壳 padding (24–48pt) ░░░   │
│  ┌────────────────────────────────┐  │
│  │ [variant accent 4px]  TYPE ICON   │  │  ← Header：仪式 icon + 类型标题
│  │         Card title (20/600)       │  │
│  ├────────────────────────────────┤  │
│  │  🌤 天气隐喻区 (weatherCard bg)   │  │  ← Weather zone
│  │  narrative line (16/400)          │  │
│  ├────────────────────────────────┤  │
│  │  🌱 花园成长区                    │  │  ← Garden zone
│  │  stage icon + stage label         │  │
│  ├────────────────────────────────┤  │
│  │  ✨ 结语 / moment 区              │  │  ← Closing zone（周=AI；仪式=静态 i18n）
│  │  (optional user snippet)          │  │
│  └────────────────────────────────┘  │
│                                      │
│     心晴MO · 关系天气日记 · 2026/7/2   │  ← Watermark (12/400 secondary)
└──────────────────────────────────────┘
```

### 区域规范

| Zone | week | resolve | burn |
|------|------|---------|------|
| Header title | `share.canvas.week.title` + 日期范围 | `share.canvas.resolve.title` | `share.canvas.burn.title` |
| Header icon | `CloudSun` 或主导天气 icon | `Sprout` 32px `ritual.resolve` | `Flame` 32px `ritual.burn` |
| Accent strip | 无 | 左 4px `ritual.resolve` | 左 4px `ritual.burn` |
| Weather | `computeWeatherNarrative` → `t(narrativeKey)` | 当前 `weather.condition` 叙事 | **省略**或极简「释放后的天空」静态句 |
| Garden | `getGrowthStage(rate)` icon + label | 全局 resolve rate stage | **省略**或仅装饰叶 icon |
| Closing | `generateReviewExportClosingLine` / fallback | `share.canvas.resolve.moment` | `share.canvas.burn.moment` |
| User snippet | 仅 opt-in；max **80 字符** | 同左 | 同左 |

**硬门禁（D-11, D-12）**：Shell 及子组件 **禁止** render：`entry.content`、`people[]`、`triggers[]`、`topTriggers`、`resolveTriggerLabel`、解决率 %、柱状图、TopN 列表。

---

## Content Variants

### Week（`ShareCardWeekContent`）

| 字段 | 来源 | 展示 |
|------|------|------|
| 日期范围 | `derived.current.startMs/endMs` | Card title 下副行 |
| 主导天气 | `derived.topWeather[0].bucket` 或 narrative condition | Weather zone |
| 天气叙事 | `computeWeatherNarrative` + i18n | Metaphor body |
| 花园阶段 | `getGrowthStage(compare.current.resolutionRate)` | Garden zone：icon 48px + `utils.growthStage.*` |
| AI 结语 | `generateReviewExportClosingLine` | Closing zone；loading 时预览屏禁用保存 |
| 陪伴天数 | **不上卡**（避免与周范围重复） | — |

### Resolve（`ShareCardResolveContent`）

| 字段 | 来源 | 展示 |
|------|------|------|
| 时刻 | ceremony 完成时间 | footer 日期可选 |
| 天气 | store `weather.condition` | Weather zone 叙事 |
| 花园 | 全局 `computeResolveRate` → stage | Garden zone |
| Moment copy | `share.canvas.resolve.moment` | Closing zone |
| AI | **不调用** | — |

### Burn（`ShareCardBurnContent`）

| 字段 | 来源 | 展示 |
|------|------|------|
| Moment copy | `share.canvas.burn.moment`（可呼应 `rituals.burn.complete.message` tone） | Closing zone 主文案 |
| Weather/Garden | 静态释放隐喻 | 简化：单句 + `Flame` icon，无 entry 数据 |
| AI | **不调用** | — |

### User snippet（opt-in，D-10）

| 属性 | 值 |
|------|-----|
| 默认 | **不渲染** |
| 输入 | 预览屏 `TextInput`，`maxLength={80}` |
| 样式 | 14px/400；两侧引号或左侧竖线 `primaryLight`；`numberOfLines={3}` |
| 隐私 | 预览屏 helper：`share.preview.snippetHint`（提醒用户自审，勿写姓名） |

---

## Preview Screens

### 周回顾 — `ReviewExportScreen`（改造）

| 属性 | 值 |
|------|-----|
| 路由 | `app/review-export.tsx`（现有 stack） |
| 画布 | `ShareCardShell` + `variant="week"` 替换 `ReviewExportCanvas` |
| 预设 chips | **保留**（本周/上周/本月/上月） |
| Opt-in | 新增：Switch + 条件 TextInput（默认 off） |
| 保存 | 底部 `PrimaryButton`；`testID="share-card-save-button"` |
| AI gate | `aiStatus === 'loading'` 时保存钮 disabled |
| 捕获 | 同一 `captureRootRef` → `shared/share/captureViewToPng` |

### 仪式 — `ShareCardPreviewScreen`（modal）

| 属性 | 值 |
|------|-----|
| 路由 | `app/share-card-preview.tsx` |
| 呈现 | `presentation: 'modal'`，`headerShown: false` |
| Params | `variant=resolve\|burn`；**禁止** `content`、`people`、`triggers` query |
| 根容器 | `testID="share-card-preview-root"` |
| Shell | 与周卡相同 `ShareCardShell` |
| Opt-in | 同周卡；`testID="share-card-snippet-toggle"` |
| 保存 | `testID="share-card-save-button"` |
| 返回 | `AppScreenShell` `onBack` → `router.back()` |

### Web 预览 / 下载 UX（D-14）

| 步骤 | 行为 |
|------|------|
| 预览 | 与 native 相同 WYSIWYG；ScrollView 内缩放展示 |
| 保存钮文案 | `share.actions.download`（en: Download image） |
| 点击保存 | `captureRef` `result: 'data-uri'` → `<a download="xinqingmo-share-{timestamp}.png">` |
| 隐私 ack | **同 native** 首次 Alert；key `review_export_privacy_ack_v1` |
| 成功 | Toast 或 Alert：`share.alerts.downloadSuccess` |
| 失败 | `share.alerts.saveFail` + 保留预览（不关闭 modal） |
| 禁止 | `review.alerts.webUnsupported` Alert |

---

## Ritual Inline CTAs（SHR-02）

**硬规则（D-05）**：禁止 `useEffect` / ceremony `onComplete` 内 `router.push`；禁止 Modal/BottomSheet 自动打开。

### 和解 CTA（D-06, D-07）

| 属性 | 值 |
|------|-----|
| 时机 | `ResolveCeremonyHost` 动画结束（Skip 或自然完成）后 |
| 挂载 | **EntryCard** 维护 `showResolveShareCta`；`onComplete` 先切态，**延迟** `resolveEntry` 至用户跳过 CTA 或点击分享后（实现二选一写死于 PLAN） |
| 形态 | 仪式层底部 **Ghost 小按钮**，非全宽 Primary |
| 文案 | `share.cta.generate` |
| testID | `share-card-cta-resolve` |
| 触控 | min 44×44；`accessibilityRole="button"` |
| 点击 | `router.push({ pathname: '/share-card-preview', params: { variant: 'resolve' } })` |
| 视觉 | 文字 `primaryDark`；可选 `Sprout` 16px |

### 焚烧 CTA（D-06, D-08）

| 属性 | 值 |
|------|-----|
| 时机 | `burn-complete-message` toast 显示期间（2.5s 内可点） |
| 挂载 | `showBurnCompleteMessage` 块内，micro-copy **下方** |
| 背景 | 延续 `rgba(249,115,22,0.12)` 条 |
| 文案 | `share.cta.generate` |
| testID | `share-card-cta-burn` |
| 点击 | `router.push({ pathname: '/share-card-preview', params: { variant: 'burn' } })` |
| Toast 消失后 | Phase 4 **默认不保留**次要入口（ashes 卡不加重 CTA） |

### CTA 样式（内嵌小按钮）

| 属性 | 值 |
|------|-----|
| 背景 | transparent 或 `rgba(255,255,255,0.6)` |
| 文字 | 14px/600 `primaryDark` |
| padding | vertical 8px, horizontal 16px |
| 圆角 | `DESIGN_TOKENS.borderRadius.medium` (12px) |
| 边框 | 可选 1px `primaryLight` |

---

## Watermark & Attribution（SHR-05, D-17）

| 元素 | 规范 |
|------|------|
| 位置 | Shell 底部居中，距内容区 `DESIGN_TOKENS.spacing.lg` (16px) |
| 文案 zh | `心晴MO · 关系天气日记`（`share.watermark.brand`） |
| 文案 en | `MoodMO · Relationship weather diary` |
| 日期 | 可选 ` · {{date}}` locale 格式；`share.watermark.withDate` |
| 字号 | 12px/400 |
| 颜色 | `COLORS.text.secondary` |
| 禁止 | QR、App Store 短链、大号 logo |

---

## Copywriting Contract

**Tone**：zh 温柔、口语化、像朋友；en warm, ≤12 words/sentence；**permission-first**（用户主动保存）；**never** imply auto-posting to social.

### Primary CTA

| 场景 | zh | en key |
|------|-----|--------|
| 仪式内嵌 | 生成分享卡 | `share.cta.generate` |
| 预览保存 (native) | 保存到相册 | `share.actions.saveToAlbum` |
| 预览保存 (web) | 下载图片 | `share.actions.download` |
| 隐私继续 | 继续 | `share.actions.continue`（或复用 `review.actions.continue`） |

### Card copy（`locales/*/share.json`）

| Key | zh 示例 | en 方向 |
|-----|---------|---------|
| `canvas.week.title` | 这一周的关系天气 | This week in your weather |
| `canvas.resolve.title` | 种下和解 | A moment of resolve |
| `canvas.burn.title` | 气话已飘走 | Released with care |
| `canvas.resolve.moment` | 让这段情绪慢慢放晴 | Letting this feeling clear |
| `canvas.burn.moment` | 那些气话已经化作青烟 | The sharp words have drifted away |
| `canvas.weatherLabel` | 关系天气 | Relationship weather |
| `canvas.gardenLabel` | 心灵花园 | Inner garden |
| `watermark.brand` | 心晴MO · 关系天气日记 | MoodMO · Relationship weather diary |

### Preview screen

| Key | zh 示例 |
|-----|---------|
| `preview.title` | 分享卡预览 |
| `preview.titleResolve` | 和解时刻 |
| `preview.titleBurn` | 焚烧时刻 |
| `optIn.label` | 加一句自己的话 |
| `optIn.placeholder` | 写一句想带走的心情（请勿写姓名） |
| `optIn.hint` | 这句话会出现在卡片上，保存前请确认不含隐私信息 |
| `optIn.off` | （不上卡） |

### Empty / loading

| 场景 | copy |
|------|------|
| AI 结语 loading | `share.canvas.aiLoading`（周卡预览） |
| 无天气数据 | `share.canvas.weatherFallback`（静态温和句） |
| 捕获未就绪 | 保存钮 disabled；无单独 empty |

### Error state

| 场景 | zh | 下一步 |
|------|-----|--------|
| 捕获失败 | 生成图片失败，请稍后再试 | 重试保存 |
| 相册权限拒 | 需要相册权限 | 打开设置（复用 `review.alerts.permission`） |
| Web 下载失败 | 下载失败 | 重试 |
| 隐私 | 分享卡将保存到设备；请注意他人翻看风险 | 继续 / 取消 |

### Destructive confirmation

**本 Phase 无 destructive 分享动作**。保存非 destructive；不复用 `error` 色按钮。

### 隐私确认（D-15）

复用 `review_export_privacy_ack_v1`；文案可微调为 `share.alerts.privacy.*`（含「分享卡」措辞），**key 不变**。

---

## testID Inventory（Maestro 014）

| testID | 元素 | 要求 |
|--------|------|------|
| `share-card-cta-resolve` | EntryCard 和解后 CTA | ceremony 完成后可见；点击进 preview |
| `share-card-cta-burn` | burn toast 内 CTA | 与 `burn-complete-message` 同屏 |
| `share-card-preview-root` | Modal 根 | variant=resolve/burn |
| `share-card-snippet-toggle` | opt-in Switch | 默认 off |
| `share-card-snippet-input` | opt-in TextInput | toggle on 后可见 |
| `share-card-save-button` | 保存/下载 | 预览屏 footer |
| `share-card-canvas` | 捕获根 View | `collapsable={false}` |
| `review-export-back-button` | ReviewExport 栈顶返回 | deep link 无 back stack 时回首页 |

**Maestro 断言**：仅用 testID，**不匹配** locale 文案（Phase 2/3 先例）。

**SHR-02 验收**：flow 必须先完成仪式，**不得**在未 tap CTA 时 assert `share-card-preview-root`。

---

## Component Inventory

### 新建

| 组件 | 路径 | 职责 |
|------|------|------|
| `ShareCardShell` | `components/share/ShareCardShell.tsx` | 9:16 外壳 + watermark + accent slot |
| `ShareCardWeekContent` | `components/share/ShareCardWeekContent.tsx` | 周回顾内容区 |
| `ShareCardResolveContent` | `components/share/ShareCardResolveContent.tsx` | 和解内容区 |
| `ShareCardBurnContent` | `components/share/ShareCardBurnContent.tsx` | 焚烧内容区 |
| `ShareCardPreviewScreen` | `components/share/ShareCardPreviewScreen.tsx` | 仪式 modal 预览 |
| `captureViewToPng` | `shared/share/captureViewToPng.ts` | 1080×1920 捕获 |
| `saveShareCardImage` | `shared/share/saveShareCardImage.ts` | album + web download |
| `privacyAck` | `shared/share/privacyAck.ts` | `review_export_privacy_ack_v1` |
| `buildShareCardModel` | `shared/share/buildShareCardModel.ts` | PII-safe view-model |
| `share.json` | `locales/zh-Hans`, `en-US` | 卡片与预览 copy |

### 修改

| 组件 | 变更 |
|------|------|
| `ReviewExportScreen` | `ShareCardShell` week variant；opt-in；shared capture/save；Web download |
| `ReviewExportCanvas` | deprecated / 薄包装；**移除** trigger 块 |
| `EntryCard` | resolve/burn inline CTAs；`showResolveShareCta` 态 |
| `app/_layout.tsx` | 注册 `share-card-preview` modal |
| `i18n/index.ts` | 注册 `share` namespace |

### 不改

| 项 | 原因 |
|----|------|
| 系统 `Share.share` | D-16 deferred |
| `ResolveCeremonyHost` 动画视觉 | 仅可选接收 `onSharePress`；不改为分享 UI |
| Insights 统计块上卡 | D-11 |

---

## Accessibility

| 场景 | 要求 |
|------|------|
| 预览捕获区 | `accessibilityLabel` = `share.a11y.canvas`（含 variant） |
| 保存钮 | `accessibilityRole="button"`；busy 时 `accessibilityState={{ busy: true }}` |
| opt-in Switch | `accessibilityLabel` = `share.optIn.label` |
| 内嵌 CTA | 独立可聚焦；不与 toast 合并为一个节点 |
| 颜色 | resolve vs burn 须 icon + 文案，不仅靠 accent 色 |
| 水印 | 随卡片一次性朗读（不单独抢焦点） |

---

## Anti-Patterns（Phase 4）

- 自动 `router.push` 至预览（违反 D-05）
- 卡片展示 `people` / `triggers` / `entry.content`（违反 D-12）
- 延续 `ReviewExportCanvas` 触发器 TopN / 解决率大图（违反 D-11）
- 整卡 `ritual.resolve` / `ritual.burn` 背景（违反 D-18）
- Web 仅 `webUnsupported` Alert（违反 D-14）
- 系统 Share sheet（违反 D-16）
- URL params 传 diary 正文（违反 SHR-03）
- capture 目标未 `collapsable={false}`（Android 空图）
- 新建 hardcoded hex 非 `COLORS.*` / `INSIGHTS_COLORS.*`

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| N/A | — | Expo RN，无 shadcn registry |

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

## 验收勾选（Phase 4）

- [ ] SHR-01：周回顾导出 1080×1920 竖版 PNG 存相册
- [ ] SHR-02：和解/焚烧后 **仅** 内嵌 CTA；无自动弹窗
- [ ] SHR-03：011 粉壳；默认无正文；opt-in snippet 默认 off
- [ ] SHR-04：iOS/Android 相册；Web PNG 下载；隐私 ack 复用
- [ ] SHR-05：footer 水印低调
- [ ] 卡片无 PII（人工 + unit `buildShareCardModel`）
- [ ] Maestro `014-shareable-ritual-cards` testID 路径绿
- [ ] `yarn typecheck && yarn lint && yarn test` 全绿
