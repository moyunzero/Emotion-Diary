---
phase: 3
slug: metaphor-narrative
status: approved
reviewed_at: 2026-07-02
shadcn_initialized: false
preset: none
created: 2026-07-02
openspec: openspec/changes/013-metaphor-narrative/
requirements: NAR-01, NAR-02, NAR-03, NAR-04, NAR-05
extends: openspec/changes/011-metaphor-activation/UI-SPEC.md
---

# Phase 3 — 隐喻叙事加深 UI 设计契约

> 让气象站 / 花园 / 和解·焚烧仪式在日常使用中「说话」。  
> **权威源**：011 [`UI-SPEC.md`](../011-metaphor-activation/UI-SPEC.md) + [`VISUAL-IDENTITY.md`](../011-metaphor-activation/VISUAL-IDENTITY.md) + [`constants/colors.ts`](../../../constants/colors.ts)。  
> **规划 OpenSpec 路径**（planner 创建）：`openspec/changes/013-metaphor-narrative/SPEC.md`

---

## Design Intent

**Phase 边界**：NAR-01～NAR-05；不含分享卡片（Phase 4）、回访 Banner 动态 copy（Phase 5）、onboarding（Phase 2）、011 全站 token 迁移（Phase 1）。

**叙事 tone**：温暖、短句、像「关系天气在跟你说话」——非统计报告、非 AI 口吻。规则引擎 + i18n 模板为默认；AI 预报保留在折叠区。

**上游锁定决策**（`03-CONTEXT.md`）：

| ID | 决策 |
|----|------|
| D-01 | 日常叙事 = 规则引擎 + i18n，非 AI 默认句 |
| D-02 | WeatherStation 主卡片隐藏 `{score}°` |
| D-03 | 规则输入 = 天气四档 + active mood 分布 + deadline 压力 |
| D-04 | 叙事同步 WeatherStation + Dashboard header `weatherAdvice` |
| D-05～D-08 | resolve rate 跨 `getGrowthStage` 阈值；HealingProgress 内联庆祝；每 stage 一次；resolve 检测 → Insights 展示 |
| D-09～D-12 | 和解 confirm overlay + ~3s 可 Skip 仪式；焚烧仅 post-complete copy + haptic；`rituals.json` |
| D-13 | 花盆三档标签 copy 抛光，不改状态机 |
| D-14～D-15 | Dashboard 空态按 filter 换 Lucide icon；Insights 空态不改 |

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none（Expo React Native StyleSheet + `COLORS` / `DESIGN_TOKENS`） |
| Preset | not applicable |
| Component library | 项目自研 StyleSheet + token |
| Icon library | lucide-react-native |
| Display font | 霞鹜文楷 GB / Fraunces 600（仅仪式标题、可选 milestone 标题） |
| Body font | 系统默认 + Lato 400/700（en） |
| Animation | React Native `Animated`；和解仪式参考 `SimpleBurnAnimation` 模式 |
| Haptic | `hooks/useHapticFeedback.ts` |

**011 继承**：间距、Typography 角色、60/30/10 色分配、PrimaryButton / Card / EntryCardActions 规范 **不变**。本 Phase 仅新增叙事行、仪式 overlay、里程碑高亮、空态 icon 映射。

---

## Spacing Scale

沿用 `DESIGN_TOKENS.spacing`（011 契约，4 的倍数）。**GSD 标准 8 点刻度**为 4 / 8 / 16 / 24 / 32 / 48 / 64；**011 继承例外**：`md`（12px）、`xl`（20px）已写入 `constants/colors.ts` `DESIGN_TOKENS.spacing`，本 Phase 沿用、不另映射。

| Token | Value | Phase 3 新增用途 |
|-------|-------|------------------|
| xs | 4px | 叙事行与 condition label 间距 |
| sm | 8px | 仪式 overlay 内 icon gap |
| md | 12px *(011 例外)* | milestone 高亮内边距 |
| lg | 16px | WeatherStation 叙事行 horizontal padding；confirm overlay 卡片 padding |
| xl | 20px *(011 例外)* | 仪式 overlay 卡片 padding |
| xxl | 24px | 仪式 overlay 外边距；Dashboard 空态 icon 与标题间距 |
| xxxl | 32px | 全屏仪式 host 垂直居中区 |

**触控例外**（继承 011）：
- 最小可点区域：**44×44px**（Skip、confirm/cancel、entry-resolve-button）
- 和解确认主钮 / 焚烧 Alert 确认：高度 ≥ 48px

---

## Typography

继承 011；Phase 3 **仅用 3 档字号（12 / 14 / 16）与 2 档字重（400 / 600）**——合并原 Label 10–12→12；Ceremony title 20→16；Narrative 500→400；Milestone title 700→600。

| Role | Size | Weight | Line Height | Font | Usage |
|------|------|--------|-------------|------|-------|
| Narrative | 16px (`md`) | 400 | 1.375 (22px) | Body 栈 | WeatherStation 主叙事行；Dashboard header 不重复叙事（仅 advice 短句） |
| Condition label | 12px (`sm`) | 600 | 1.4 | Body | WeatherStation 天气状况标签（保留） |
| Ceremony title | 16px (`md`) | 600 | 1.25 | Body | ResolveConfirm / ResolveCeremony 标题 |
| Ceremony body | 14px (`base`) | 400 | 1.5 | Body | 仪式说明、burn post-complete |
| Milestone title | 16px (`md`) | 600 | 1.25 | Body | HealingProgress 内联庆祝标题 |
| Milestone body | 14px (`base`) | 400 | 1.5 | Body | 庆祝一行 copy |
| Label | 12px (`sm`) | 600 | 1.4 | Body | Skip 按钮、pot 标签（NAR-04 抛光） |

**011 约束**：Display 24–32px **不再**用于 WeatherStation 主卡片 `{score}°`（D-02 隐藏）。

---

## Color System

### 继承 011 60 / 30 / 10

| Role | Token | Hex | Phase 3 用途 |
|------|-------|-----|--------------|
| Dominant | `background.page` / gradient | `#FFF5F7` → `#FFE4E6` | 页面底；仪式 overlay 半透明遮罩下仍可见粉调 |
| Secondary | `background.primary` | `#FFFFFF` | Confirm 卡片、HealingProgress 卡片 |
| Accent | `primaryDark` | `#FB7185` | Dashboard 空态 CTA、Skip 文字链接（非 destructive） |
| Growth | `accent` / `ritual.resolve` | `#86EFAC` | 和解仪式、里程碑高亮描边/图标、Resolve confirm 主钮 |
| Release | `ritual.burn` | `#F97316` | 焚烧 post-complete 微文案 icon；空态 Flame icon |
| Destructive | `error` | `#EF4444` | 焚烧 Alert 确认、删除 — **仅 destructive** |

### Phase 3 新增语义用法

| 元素 | 背景 | 文字/Icon | 说明 |
|------|------|-----------|------|
| WeatherStation 叙事行 | transparent（卡片 `weatherCard[condition].bg`） | `weatherCard[condition].text` | 与 condition 同色阶 |
| ResolveConfirm overlay 遮罩 | `rgba(31,41,55,0.45)` | — | 全屏 Modal |
| ResolveConfirm 卡片 | `background.primary` | `text.primary` | 圆角 20px，`shadow.xl` |
| ResolveConfirm 主钮 | `ritual.resolve` | `#FFFFFF` | SecondaryButton 变体 |
| ResolveConfirm 取消 | transparent | `text.secondary` | GhostButton |
| ResolveCeremony host | `background.page` 95% 不透明全屏 | `ritual.resolve` 粒子/图标 | 生长/放晴隐喻 |
| ResolveCeremony Skip | transparent | `primaryDark` | 44px 触控 |
| Burn post-complete toast/overlay | `rgba(249,115,22,0.12)` 条或 bottom sheet 条 | `ritual.burn` + `text.primary` | 动画结束后 2.5s 自动消失 |
| Milestone 高亮区 | `accent` 8% 透明度底 `#86EFAC14` | `accent` 左描边 4px | HealingProgress 容器内，非全屏 |
| Dashboard 空态 icon 圆 | `background.secondary` | 见 NAR-05 映射 | 直径 96px 圆 |

**Accent 禁止**：和解/焚烧仪式主交互使用 `error` / `submit` 红。

---

## NAR-01 — 气象站情境叙事

### 规则引擎输入

| 维度 | 来源 | 分档 |
|------|------|------|
| `condition` | `store.modules/weather.ts` `_calculateWeather` | `sunny` (score≤10), `cloudy` (≤20), `rainy` (≤30), `stormy` (>30) |
| `moodMix` | active 条目 `moodLevel` 加权均值 | `calm` (avg≤2), `mixed` (2<avg≤3.5), `heavy` (avg>3.5) |
| `deadlinePressure` | active 条目 `deadline` | `low` (无 today/week), `medium` (含 week), `high` (含 today) |

**优先级**（同键冲突）：`deadlinePressure` 仅在与 `condition` 组合查表时使用；实现于共享 util `shared/weather/weatherNarrative.ts`（建议路径）。

### i18n 键命名

**命名空间**：`dashboard`  
**键前缀**：`weatherNarrative.{condition}.{moodMix}.{deadlinePressure}`

共 4×3×3 = **36 键**；fallback 链：`具体组合` → `weatherStation.descriptions.{condition}` → `weatherStation.descriptions.sunny`（现有实现）。

**示例 copy（zh，tone 参考）**：

| Key 片段 | zh 示例 |
|----------|---------|
| `sunny.calm.low` | 今天的关系天空很晴朗，好好享受这份轻松 |
| `cloudy.mixed.medium` | 云层后面还有话没说开，这周找个时间聊聊 |
| `rainy.heavy.high` | 雨点有点密，先照顾好自己，再慢慢沟通 |
| `stormy.heavy.high` | 风暴天里，先给自己一把伞 |

**en**：同等 warmth，≤12 词/句；避免 clinical 统计用语。

### WeatherStation 主卡片布局变更

```
┌─────────────────────────────────────┐
│ 关系天气                    [无 score] │  ← header：仅 title，移除 header 右侧 {score}°
│           [48px weather icon]        │
│     ┌─────────────────────────┐     │
│     │  叙事行 (16px/400/居中)   │     │  ← 主视觉：规则引擎 narrative
│     └─────────────────────────┘     │
│  ─────────────────────────────────  │
│  情绪指数: {score}  │  天气: {label} │  ← details 区保留数字（D-02）
└─────────────────────────────────────┘
```

| 元素 | 规范 |
|------|------|
| 移除 | `styles.header` 内 `{weather.score}°`（L158–160） |
| 叙事行 | 替换原 `descriptionLabel` 位置；`marginVertical: 8`；`paddingHorizontal: 8` |
| 叙事 typography | Narrative 角色；色 `weatherCard[condition].text` |
| 折叠 forecast | **不变**；AI summary 仍在折叠区 |

### Dashboard header `weatherAdvice` 同步

**现状**：仅 `sunny` vs 其他 → `weatherAdvice.sunny` / `cloudy`。

**目标**：四档与 `weather.condition` 1:1。

| condition | i18n key | zh 示例 | en 示例 |
|-----------|----------|---------|---------|
| sunny | `weatherAdvice.sunny` | 宜开心 | A good day to feel light |
| cloudy | `weatherAdvice.cloudy` | 宜沟通 | A good day to talk it through |
| rainy | `weatherAdvice.rainy` | 宜慢聊 | Take it slow — talk when ready |
| stormy | `weatherAdvice.stormy` | 宜自愈 | Care for yourself first |

**消费点**：`Dashboard.tsx` subtitle — `{date} · {weatherAdvice}`；与 WeatherStation 共用 `condition`，**不**重复完整 narrative（header 保持短 advice）。

**共享 util 输出**：

```typescript
type WeatherNarrativeResult = {
  narrativeKey: string;      // weatherNarrative.*
  adviceKey: string;         // weatherAdvice.*
  condition: WeatherCondition;
};
```

---

## NAR-02 — 花园生长里程碑

### 阈值（沿用 `getGrowthStage`）

| Stage | resolve rate | i18n `utils.growthStage.*` |
|-------|--------------|----------------------------|
| seed | < 0.2 | seed |
| sprout | ≥ 0.2 | sprout |
| seedling | ≥ 0.4 | seedling |
| bud | ≥ 0.6 | bud |
| bloom | ≥ 0.8 | bloom |

### 触发与持久化

| 步骤 | 行为 |
|------|------|
| 1 | `resolveEntry` 成功后计算 resolve rate → `getGrowthStage` |
| 2 | 若 stage 较 resolve 前上升且 `garden_milestone_v1_seen_{stage}` ≠ true → 设 `pendingMilestoneStage` |
| 3 | 用户进入 Insights tab → `HealingProgress` 读取 pending → 展示内联庆祝 → 写入 seen flag |
| 4 | 每 stage **终身一次**（设备级 AsyncStorage，模式同 `onboardingMetaphor.ts`） |

**Storage keys**：

- `GARDEN_MILESTONE_V1_SEEN_PREFIX = 'garden_milestone_v1_seen_'` + stage
- `GARDEN_MILESTONE_V1_PENDING = 'garden_milestone_v1_pending'` → JSON `{ stage: 'sprout' | ... }`

### HealingProgress 内联庆祝 UI

```
┌─ HealingProgress 卡片 ─────────────────┐
│ ♥ 治愈进度                              │
│ ┌─ milestone banner (条件渲染) ───────┐ │
│ │ 🌱 新芽破土啦                         │ │  ← milestone.title
│ │ 你又和解了一次，花园在长大              │ │  ← milestone.body (1 line)
│ └─────────────────────────────────────┘ │
│ [环形进度]  [统计]                        │
│ ...                                      │
└──────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 位置 | 卡片 header 下方、`content` 上方 |
| 背景 | `accent` @ 8% + 左 border 4px `accent` |
| 内边距 | 12px vertical, 16px horizontal |
| 圆角 | 12px |
| 图标 | stage 对应 Lucide（同 `getGrowthStage.icon`），24px，`accent` |
| 标题 | Milestone title 16px/600 |
| 正文 | Milestone body 14px/400，**单行** `numberOfLines={1}` |
| Haptic | 展示时 `trigger('success')` 一次 |
| 动画 | 可选 300ms fade-in；**禁止**全屏 overlay / toast-only |
| testID | `garden-milestone-banner` |
| 自动消失 | **不**自动消失；用户滚动离开即可；下次进入 Insights 不再显示（seen） |

### i18n 键（`insights` namespace）

| Key | zh 示例 | en 方向 |
|-----|---------|---------|
| `milestone.sprout.title` | 新芽破土啦 | A new sprout |
| `milestone.sprout.body` | 和解让花园更有生机 | Each resolve helps your garden grow |
| `milestone.seedling.title` | 幼苗在长高 | Seedlings rising |
| `milestone.seedling.body` | 你在学着照料自己的情绪 | You're learning to tend your feelings |
| `milestone.bud.title` | 花苞出现了 | Buds are forming |
| `milestone.bud.body` | 关系天气在慢慢放晴 | Your weather is clearing |
| `milestone.bloom.title` | 花园开花了 | Your garden is blooming |
| `milestone.bloom.body` | 大部分情绪已和解，真棒 | Most of your entries have found peace |

**注**：`seed` stage 不庆祝（起点）；首次庆祝从 `sprout` 起。

---

## NAR-03 — 和解 / 焚烧仪式

### 和解流程（EntryCard → store 不变）

```
entry-resolve-button
  → ResolveConfirmOverlay (resolve-confirm-*)
  → ResolveCeremonyHost (~3s, resolve-ceremony-*)
  → resolveEntry(id)
  → (可选) garden milestone pending
```

### ResolveConfirmOverlay

**组件**：`components/rituals/ResolveConfirmOverlay.tsx`（建议新建）

| 属性 | 值 |
|------|-----|
| 呈现 | React Native `Modal`，`transparent`，全屏 |
| 遮罩 | `rgba(31,41,55,0.45)` |
| 卡片宽 | min(340px, screenWidth - 48px) |
| 卡片 | 白底，padding 20px，borderRadius 20px，`DESIGN_TOKENS.shadow.xl` |
| 图标 | `CheckCircle` 或 `Sprout`，32px，`ritual.resolve` |
| 标题 | Ceremony title，`rituals.resolve.confirm.title` |
| 正文 | Ceremony body，`rituals.resolve.confirm.message` |
| 主钮 | `rituals.resolve.confirm.confirm`，背景 `ritual.resolve`，白字，高 48px，圆角 16px |
| 取消 | `rituals.resolve.confirm.cancel`，Ghost，高 44px |
| 取消行为 | 关闭 overlay，**不**调用 resolveEntry |
| 确认行为 | 关闭 confirm → 打开 ResolveCeremonyHost |

### ResolveCeremonyHost

**组件**：`components/rituals/ResolveCeremonyHost.tsx`（建议新建）

| 属性 | 值 |
|------|-----|
| 呈现 | 全屏 overlay（非 Modal 亦可），`testID="resolve-ceremony-root"` |
| 背景 | `#FFF5F7` 或 `background.page` + 轻量 green 粒子（参考 `SimpleBurnAnimation` opacity/scale） |
| 动画 | 中心 icon scale 0.8→1.05→1.0 + opacity 0→1，**总时长 ~3000ms** |
| 文案 | `rituals.resolve.ceremony.title` + `rituals.resolve.ceremony.body`，居中 |
| Skip | 右上角或底部；`rituals.resolve.ceremony.skip`；`testID="resolve-ceremony-skip"`；44×44 |
| Skip/完成 | 均调用 `onComplete()` → `resolveEntry` + haptic `success` |
| Haptic 序列 | 动画 start：`light`；complete：`success` |
| 完成后 | 卸载 host；EntryCard 折叠 |

**视觉**：绿/粉 growth token（`ritual.resolve`、`primaryLight` 粒子）；**禁止** orange burn 色。

### 焚烧流程（D-10：Alert + 动画保留）

**Skip 边界**：D-12（~3s 可 Skip）**仅适用于和解 `ResolveCeremonyHost`**；现有 `BurnAnimation` / Skia 路径无 Skip 控件，焚烧保持 Alert 确认 + 完整动画 + post-complete copy（对齐 `03-CONTEXT.md` D-10）。

| 阶段 | 行为 |
|------|------|
| 确认 | 保留 `dashboard.alerts.burn` Alert（**不**迁 rituals confirm） |
| 动画 | 保留 Skia `BurnAnimation` / `SimpleBurnAnimation` |
| Haptic | Alert confirm：`medium`；动画 start：`light`；complete：`success`（统一序列） |
| Post-complete | 动画 `onComplete` 后显示 **micro-copy overlay** 2.5s |

### Burn post-complete micro-copy overlay

| 属性 | 值 |
|------|-----|
| 呈现 | EntryCard 原位 bottom 浮条或卡片内 absolute bottom |
| 背景 | `rgba(249,115,22,0.12)` |
| 图标 | `Flame` 16px `ritual.burn` |
| 文案 | `rituals.burn.complete.message` |
| 字号 | 14px/400 |
| 时长 | **2500ms** 后 fade-out 300ms |
| testID | `burn-complete-message` |
| 禁止 | 全屏 Modal；替换 Skia 动画 |

### `rituals.json` 结构（zh-Hans / en-US）

**注册**：`i18n/index.ts` + `namespaceKeys.test.ts` parity。

```json
{
  "resolve": {
    "confirm": {
      "title": "",
      "message": "",
      "confirm": "",
      "cancel": ""
    },
    "ceremony": {
      "title": "",
      "body": "",
      "skip": ""
    }
  },
  "burn": {
    "complete": {
      "message": ""
    }
  }
}
```

**Copy 方向（zh）**：

| Key | zh |
|-----|-----|
| `resolve.confirm.title` | 和解打卡 |
| `resolve.confirm.message` | 标记和解，就像给这段关系浇一次水。确定吗？ |
| `resolve.confirm.confirm` | 开始和解 |
| `resolve.confirm.cancel` | 再想想 |
| `resolve.ceremony.title` | 种下和解 |
| `resolve.ceremony.body` | 让这段情绪慢慢放晴… |
| `resolve.ceremony.skip` | 跳过 |
| `burn.complete.message` | 气话已化作青烟，心里轻松些了吧 |

**en**：对称键；confirm/cancel 与 dashboard.alerts 语气一致。

---

## NAR-04 — 关系花盆标签

**状态机不变**：`getFlowerPotStatus` — blooming ≥70%, growing ≥30%, needWater <30%。

**本 Phase 仅 copy 抛光**（`insights.json` `utils.potStatus.*`）：

| Key | zh（抛光后） | en（抛光后） |
|-----|-------------|-------------|
| `blooming` | 盛开中 | In full bloom |
| `growing` | 正在生长 | Still growing |
| `needWater` | 需要浇水 | Needs watering |

**验收**：people preset label 与 `resolvePeopleLabel` 一致；pot 标签 12px/600，`INSIGHTS_COLORS` 映射色不变。

---

## NAR-05 — Dashboard 空状态 icon 映射

**文案不变**：沿用 `empty.{filter}.*`。

**Icon 映射**（Lucide，`size={48}`，色 `primaryLight` `#FECDD3`）：

| filter | Icon | testID |
|--------|------|--------|
| `active` | `Sprout` | `dashboard-empty-icon-active` |
| `resolved` | `Leaf` | `dashboard-empty-icon-resolved` |
| `burned` | `Flame` | `dashboard-empty-icon-burned` |
| `all` | `CloudSun` | `dashboard-empty-icon-all` |

| 属性 | 值 |
|------|-----|
| icon 容器 | 96×96 圆，`background.secondary`，居中 |
| 替换 | 移除固定 `PenLine`（L293 Dashboard.tsx） |
| Insights 空态 | **本 Phase 不改**（D-15） |

---

## Copywriting Contract

### Primary CTA（本 Phase 触达）

| 场景 | zh | en key |
|------|-----|--------|
| 和解确认主钮 | 开始和解 | `rituals.resolve.confirm.confirm` |
| 和解 Skip | 跳过 | `rituals.resolve.ceremony.skip` |
| Dashboard 空态 CTA | 去记录 / Start recording | `empty.{filter}.cta`（不变） |

### Empty state（Dashboard only）

| filter | heading key | body key |
|--------|-------------|----------|
| active | `empty.active.title` | `empty.active.desc` |
| resolved | `empty.resolved.title` | `empty.resolved.desc` |
| burned | `empty.burned.title` | `empty.burned.desc` |
| all | `empty.all.title` | `empty.all.desc` |

### Error state

| 场景 | copy |
|------|------|
| 叙事 util 缺键 | fallback 至 `weatherStation.descriptions.{condition}`；**不**显示空白 |
| milestone storage 失败 | 静默跳过庆祝；不阻塞 Insights |
| resolve 失败 | 沿用 store 现有 toast/alert；关闭 ceremony |

### Destructive confirmation

| 动作 | 方式 | copy key |
|------|------|----------|
| 焚烧 | Alert（保留） | `dashboard.alerts.burn.*` |
| 删除/回收站 | Alert（不变） | `dashboard.alerts.moveToRecycle.*` |
| 和解 | **非 destructive** — `ritual.resolve` 主钮 | `rituals.resolve.confirm.*` |

---

## testID Inventory（Maestro / E2E）

| testID | 组件 | 要求 |
|--------|------|------|
| `entry-resolve-button` | EntryCard 和解 action | **新增**；expanded 且非 resolved 可见 |
| `resolve-confirm-root` | ResolveConfirmOverlay | 根容器 |
| `resolve-confirm-confirm` | ResolveConfirmOverlay | 主确认 |
| `resolve-confirm-cancel` | ResolveConfirmOverlay | 取消 |
| `resolve-ceremony-root` | ResolveCeremonyHost | 仪式全屏 |
| `resolve-ceremony-skip` | ResolveCeremonyHost | Skip（可选可见 ≤3s） |
| `burn-complete-message` | EntryCard burn overlay | post-complete |
| `garden-milestone-banner` | HealingProgress | 里程碑内联 |
| `dashboard-empty-icon-{filter}` | Dashboard ListEmpty | active/resolved/burned/all |
| `dashboard-filter-button` | Dashboard | 已有 |
| `dashboard-filter-resolved` | Dashboard | 已有 |
| `mood-entry-card` | EntryCard | 已有 |
| `insights-screen` | Insights | 已有 |
| `garden-ambience` | Insights | 已有 |

**Maestro 复验**：`.maestro/flows/011-metaphor-acceptance.yaml` 和解全路径 Phase 3 收尾必须通过。

---

## Component Inventory

### 新建

| 组件 | 路径 | 职责 |
|------|------|------|
| `ResolveConfirmOverlay` | `components/rituals/ResolveConfirmOverlay.tsx` | 和解确认 Modal |
| `ResolveCeremonyHost` | `components/rituals/ResolveCeremonyHost.tsx` | ~3s 和解动画 + Skip |
| `SimpleResolveAnimation` | `components/rituals/SimpleResolveAnimation.tsx` | 可选；轻量 growth 动画 |
| `weatherNarrative` util | `shared/weather/weatherNarrative.ts` | 规则引擎 + key 解析 |
| `gardenMilestone` service | `services/gardenMilestone.ts` | seen/pending AsyncStorage |
| `rituals.json` | `locales/zh-Hans/rituals.json`, `locales/en-US/rituals.json` | 仪式 copy |

### 修改

| 组件 | 变更 |
|------|------|
| `WeatherStation.tsx` | 隐藏 header score；叙事行；details 保留指数 |
| `Dashboard.tsx` | weatherAdvice 四档；ListEmpty icon 映射 |
| `EntryCard.tsx` | resolve 流程；`entry-resolve-button`；burn post-complete overlay |
| `HealingProgress.tsx` | milestone banner |
| `Insights/index.tsx` | pending milestone 读取与 pass-through |
| `store/modules/entries.ts` | resolve 后 stage diff + pending |
| `locales/*/dashboard.json` | `weatherNarrative.*` ×36 + `weatherAdvice.rainy/stormy` |
| `locales/*/insights.json` | `milestone.*` + potStatus 抛光 |
| `i18n/index.ts` | 注册 `rituals` namespace |

### 不改

| 组件 | 原因 |
|------|------|
| Insights `EmptyGarden` 等空态 | D-15 |
| `BurnAnimation` / Skia 路径 | D-10 |
| `RelationshipGarden` 状态逻辑 | D-13 仅 copy |
| Tab bar / ScreenGradient | 011 已完成 |

---

## Accessibility

| 场景 | 要求 |
|------|------|
| Resolve confirm | `accessibilityViewIsModal`；焦点 trap 于 overlay |
| Skip | `accessibilityRole="button"`；label = i18n skip |
| entry-resolve-button | `accessibilityLabel` = `entryCard.resolveA11y` |
| Milestone banner | `accessibilityLiveRegion="polite"`（Android `accessibilityLiveRegion`) |
| 叙事行 | 作为 WeatherStation 卡片内 Text，随卡片朗读 |
| 颜色 | Resolve vs Burn 仍须 icon + 文案，不仅靠色 |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| N/A | — | Expo RN，无 shadcn registry |

---

## Anti-Patterns（Phase 3）

- 主卡片突出 `{score}°`（违反 D-02）
- 日常叙事默认走 AI（违反 D-01）
- 和解 instant resolve 无 confirm/ceremony
- 焚烧替换为统一 RitualHost（违反 D-10）
- 里程碑全屏 confetti / toast-only（违反 D-06）
- Dashboard 空态改文案为 generic「暂无数据」
- 新 hardcoded hex 非 `COLORS.*`
- Insights 空态本 Phase 改动

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS (FLAG: 011 md/xl 继承例外)
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-07-02

---

## 验收勾选（Phase 3）

- [ ] NAR-01：WeatherStation 主卡片无 header score；叙事随 mix 变化；header advice 四档
- [ ] NAR-02：resolve rate 跨阈值 → Insights 内联庆祝一次
- [ ] NAR-03：和解 confirm + ceremony + Skip；焚烧 post-complete copy + haptic
- [ ] NAR-04：pot 三档 zh/en copy 抛光
- [ ] NAR-05：Dashboard 四 filter 空态 icon 正确
- [ ] `rituals.json` zh/en parity + namespaceKeys
- [ ] Maestro `011-metaphor-acceptance` 和解路径绿
- [ ] `yarn typecheck && yarn lint && yarn test` 全绿
