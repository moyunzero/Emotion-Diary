# VISUAL-IDENTITY：心晴MO 签名视觉与商店叙事

> **状态**：设计规范（011 M5 实施依据；商店素材可并行制作）  
> **关联**：[`SPEC.md`](./SPEC.md) M5/M6；[`constants/colors.ts`](../../../constants/colors.ts)

## 1. 设计原则

- **粉色疗愈基调**：以玫瑰粉（`#FB7185` / `#FDA4AF`）为主，辅以淡紫柔光区分天气档位；**禁止**黄绿跳色（如 `#FEF3C7`、`#F0FDF4`）作为主背景
- **单一 token 源**：`COLORS` + `DESIGN_TOKENS` 为权威；`INSIGHTS_COLORS` 仅作洞察别名，映射全局 token
- **强调色统一**：全站交互强调使用 `primaryDark`（`#FB7185`），废弃 Tab/按钮混用 `#EF4444`

## 2. Token 收敛方案

### 2.1 新增/调整（`constants/colors.ts`）

```typescript
// 建议在 COLORS 中增补（实施时写入代码）
background: {
  page: '#FFF5F7',
  gradientStart: '#FFF5F7',  // 玫瑰粉顶
  gradientEnd: '#FFE4E6',    // 玫瑰腮红底（非绿色）
},
tab: {
  active: '#FB7185',         // = primaryDark
  inactive: '#9CA3AF',       // gray.400
},
atmosphere: {
  sunny: '#FFF1F2',          // 晴：玫瑰柔光
  cloudy: '#FAF5FF',         // 阴：淡紫雾
  rainy: '#F5F3FF',          // 雨：薰衣草洗
  stormy: '#FFE4E6',         // 雷：深玫瑰
},
weatherCard: {
  sunny: { bg: '#FFF1F2', text: '#9F1239', icon: '#FB7185' },
  cloudy: { bg: '#FAF5FF', text: '#6B21A8', icon: '#C084FC' },
  rainy: { bg: '#EDE9FE', text: '#5B21B6', icon: '#A78BFA' },
  stormy: { bg: '#FFE4E6', text: '#BE123C', icon: '#FB7185' },
},
ritual: {
  resolve: '#86EFAC',        // accent / 生长（仅仪式语义）
  burn: '#F97316',           // mood.level2 / 释放
},
```

### 2.2 废弃与迁移（011 触达范围，不全仓库一次性改）

| 现状 | 动作 |
|------|------|
| `constants/spacing.ts` `SPACING` / `FONT_SIZE` | 新代码用 `DESIGN_TOKENS`；旧文件随 011 触达逐步替换 |
| `styles/constants.ts` `STYLE_CONSTANTS` | Dashboard/EntryCard 触达时改 import |
| `INSIGHTS_COLORS.bgStart/bgEnd` | 改为 `COLORS.background.gradientStart/End` 引用 |
| 散落 `#EF4444` 作品牌强调 | 改为 `COLORS.tab.active` 或 `COLORS.primaryDark` |
| `COLORS.submit` / `error` 保持红色 | 仅 destructive 语义，不作 Tab 激活 |

### 2.3 011 必改文件清单

- `app/(tabs)/_layout.tsx` — `tabBarActiveTintColor`
- `components/retention/RevisitBanner.tsx`、`retention.styles.ts`
- `features/profile/ProfileScreen.tsx` — ActivityIndicator（可选）
- `components/CompanionDaysModal.tsx` — 里程碑色改用 `primaryDark`
- Insights 根布局 — 渐变背景

## 3. 字体与排版

### 3.1 字体栈

| 层级 | zh-Hans | en-US | 加载方式 |
|------|---------|-------|----------|
| **Display**（页面大标题、气象指数） | 霞鹜文楷 GB / LXGW WenKai | Fraunces 600 | `expo-font`，`app/_layout.tsx` |
| **Body** | 系统默认（PingFang / Noto Sans） | Lato 400/700（保留） | 现有 |
| **数字/指数** | Display 字体 + `letterSpacing: 0.5` | 同左 | WeatherStation |

**011 范围**：仅加载 Display 字体并应用于 `WeatherStation` 主指数、`GardenHeader` 标题；不全站替换 body。

### 3.2 字号层级（沿用 `DESIGN_TOKENS.fontSize`）

- 气象指数：`xxl`–`xxxl`（24–32）
- 卡片标题：`md`–`lg`
- 倒计时 tag：`xs`–`sm`，`primaryDark` 文字

## 4. 渐变与环境

| 页面 | 背景 |
|------|------|
| 气象站 Dashboard | `gradientStart → gradientEnd` 粉色竖向渐变 + M2 氛围叠层 |
| 洞察 Insights | 同上，与 `GardenAmbience` 协调 |
| 记一笔 / Profile | 保持 `background.page` 单色玫瑰粉，避免喧宾夺主 |

实现：`expo-linear-gradient` 或现有 `INSIGHTS_COLORS` 迁移至共享 `ScreenGradient` 组件（011 可新建 `components/ScreenGradient.tsx`）。

## 5. 交互签名色

| 元素 | 色 / 样式 |
|------|-----------|
| Tab 激活 | `primaryDark` `#FB7185` |
| 主 CTA（记一笔提交） | 保持现有 submit 红或改为 `primaryDark`（011 统一为 **primaryDark**） |
| 和解按钮 / 仪式 | `ritual.resolve` 绿系 |
| 焚烧按钮 / 仪式 | `ritual.burn` 橙系 |
| active 卡片描边 | `weather.cloudy` 1px 低透明度 |
| resolved 角标 | `accent` 花瓣 icon |

## 6. App Store 截图叙事（6 张）

**语言**：主市场 zh-Hans；备 en-US 一套。  
**尺寸**：按 App Store Connect 当前要求（6.7" / 6.5" 等）。

| 序号 | 画面 | 叠加文案（示例） | 目的 |
|------|------|------------------|------|
| 1 | 记一笔：人物+触发器+情绪天空 | 「把关系里的情绪，记给自己看」 | 定位：关系情绪，非泛打卡 |
| 2 | 气象站 + 氛围背景 | 「你的关系天气，一目了然」 | 隐喻 1 |
| 3 | 气话焚烧动画定格 | 「气话焚烧 —— 释放，不留痕」 | 文化向记忆点 |
| 4 | 和解仪式定格 / 已解决卡片 | 「和解种下 —— 心晴生长」 | 双仪式差异化 |
| 5 | 心灵花园 + 花盆 | 「每一段关系，一盆花」 | 隐喻 2 |
| 6 | 周回顾导出图（脱敏） | 「温柔回顾，可存相册」 | 传播钩子（为 013 铺垫） |

**视觉要求**：
- 截图内无真实姓名、无日记正文
- 主色粉紫渐变底，Display 字体标题
- Icon 角标与 App Icon 一致（见 §7）

## 7. App Icon 方向（设计稿，非代码）

- **构图**：上半柔和云朵，下半探出一朵小花（气象 + 花园）
- **色**：`#FB7185` 花心 + `#86EFAC` 叶 + `#FFF5F5` 底
- **避免**：爱心、笑脸 emoji、纯日历格子

## 8. Web 落地页主标语（可选）

- 主标语：**「把关系里的天气，记给自己看」**
- 副标语：**「记一笔 · 看天气 · 焚烧或种花」**

## 9. 011 验收勾选

- [ ] Tab 激活色为 `primaryDark`
- [ ] 洞察/气象站渐变可见
- [ ] Display 字体至少应用于气象站指数 + 花园标题
- [ ] 截图叙事稿交付设计/运营（本文 §6）
