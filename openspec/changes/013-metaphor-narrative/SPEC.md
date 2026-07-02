# SPEC：013 隐喻叙事加深（metaphor-narrative）

## 背景

- **当前问题：** Phase 1（011 视觉）与 Phase 2（onboarding）已完成，但日常使用中气象站仍偏数字、和解为 instant 操作、花园缺少生长反馈、Dashboard 空态 icon 未隐喻化。
- **用户影响：** 老用户难以持续感受到「关系天气 / 心灵花园 / 仪式」在说话；Maestro 011 和解路径因缺失 testID 与 confirm/ceremony 组件而失败。
- **相关代码：** `components/WeatherStation.tsx`、`components/Dashboard.tsx`、`components/EntryCard.tsx`、`components/Insights/HealingProgress.tsx`、`store/modules/weather.ts`、`store/modules/entries.ts`。
- **相关文档：** `.planning/REQUIREMENTS.md` NAR-01–NAR-05；`openspec/changes/011-metaphor-activation/UI-SPEC.md`；`.planning/phases/03-metaphor-narrative/03-UI-SPEC.md`。

## 目标

| ID | 能力 | 实现要点 |
|----|------|----------|
| NAR-01 | Weather Station 情境叙事行 | `shared/weather/weatherNarrative.ts` 规则引擎 + `dashboard.json` `weatherNarrative.*`；主卡片隐藏 header score |
| NAR-02 | 花园生长里程碑 | `services/gardenMilestone.ts` + `resolveEntry` stage diff；HealingProgress 内联庆祝；每 stage 一次 |
| NAR-03 | 和解/焚烧仪式微交互 | `ResolveConfirmOverlay` + `ResolveCeremonyHost`；`rituals.json`；burn post-complete copy + haptic |
| NAR-04 | 关系花盆 per-person 标签 | `insights.json` `utils.potStatus.*` zh/en 抛光；状态机不变 |
| NAR-05 | Dashboard 空态隐喻 icon | filter → Sprout/Leaf/Flame/CloudSun；Insights 空态本 Phase 不改 |

### 不在本次范围

- 分享卡片（Phase 4 SHR）
- RevisitBanner / WeeklyReview 动态 copy（Phase 5 RET）
- onboarding intro（Phase 2 已完成）
- 011 全站 token 迁移（Phase 1 已完成）
- 日常叙事默认走 AI（D-01：AI 保留 forecast 折叠区）
- 焚烧统一 RitualHost 替换 Alert（D-10）
- Insights `EmptyGarden` 等空态改动（D-15）

## 用户行为

### 触发入口

1. **Dashboard / WeatherStation：** 用户查看关系天气 → 主卡片显示规则引擎叙事行；header 显示四档 `weatherAdvice`。
2. **EntryCard 和解：** `entry-resolve-button` → confirm overlay → ~3s ceremony（可 Skip）→ `resolveEntry`。
3. **EntryCard 焚烧：** 保留 Alert + 动画 → post-complete micro-copy 2.5s + 统一 haptic。
4. **Insights：** 和解后 resolve rate 跨阈值 → 下次进入 Insights 时 HealingProgress 内联里程碑庆祝（一次/stage）。

### 期望结果

- 叙事随 active 条目 mood mix + deadline 压力变化（非纯数字）。
- 和解路径满足 Maestro 011 testID 契约。
- 里程碑非 toast/全屏 overlay；焚烧不新增 Skip 控件。

### 异常或边界

- 叙事 i18n 缺键 → fallback 至 `weatherStation.descriptions.{condition}`。
- milestone AsyncStorage 失败 → 静默跳过庆祝，不阻塞 Insights。
- seed stage 不庆祝；仅从 sprout 起。

## 技术约束

- **架构：** 纯函数 `weatherNarrative.ts`；AsyncStorage `gardenMilestone.ts`；`components/rituals/` 和解组件。
- **数据：** 叙事读 store `weather.condition` + active entries；milestone pending 跨冷启动。
- **i18n：** 新 `rituals` namespace；`dashboard` 扩展 36 narrative 键 + rainy/stormy advice；`insights` milestone + potStatus。
- **多端：** iOS/Android Maestro `011-metaphor-acceptance`；Web 无 Maestro 降级为 unit + manual UAT。
- **视觉：** 011 `COLORS.ritual.*`；和解绿/生长 vs 焚烧橙/释放。
- **E2E：** testID-first；`yarn test:maestro:011` Phase gate。

## 锁定决策（CONTEXT D-01–D-15）

| ID | 决策 |
|----|------|
| D-01 | 日常叙事 = 规则引擎 + i18n，非 AI 默认句 |
| D-02 | WeatherStation 主卡片隐藏 `{score}°` |
| D-03 | 规则输入 = 天气四档 + active mood 分布 + deadline 压力 |
| D-04 | 叙事同步 WeatherStation + Dashboard header `weatherAdvice` 四档 |
| D-05 | 触发 = resolve rate 跨 `getGrowthStage` 五档阈值 |
| D-06 | 呈现 = HealingProgress 内联庆祝（非全屏/toast-only） |
| D-07 | 每 stage 只庆祝一次（AsyncStorage seen） |
| D-08 | 和解时检测 stage 变化设 pending；下次进入 Insights 展示 |
| D-09 | 和解 = confirm Overlay + ~3s ceremony + rituals.json |
| D-10 | 焚烧 = post-complete micro-copy + haptic；保留 Alert + Skia |
| D-11 | 仪式文案 = `locales/*/rituals.json` + namespaceKeys parity |
| D-12 | 和解 ceremony 可 Skip ~3s；焚烧无 Skip |
| D-13 | 花盆三档状态机不变；仅 copy 抛光 |
| D-14 | Dashboard 空态按 filter 换 Lucide icon |
| D-15 | Insights 空态本 Phase 不改 |

## 验收标准

- [ ] WeatherStation 主卡片无 header score；叙事随 mix 变化；Dashboard advice 四档（NAR-01）
- [ ] resolve rate 跨阈值 → Insights 内联庆祝一次（NAR-02）
- [ ] 和解 confirm + ceremony + Skip；焚烧 post-complete + haptic（NAR-03）
- [ ] pot 三档 zh/en copy 抛光（NAR-04）
- [ ] Dashboard 四 filter 空态 icon 正确（NAR-05）
- [ ] `rituals.json` zh/en parity + namespaceKeys
- [ ] `yarn test:maestro:011` 和解路径绿
- [ ] `yarn typecheck && yarn lint && yarn test` CI 绿

## 依据

- **产品：** `.planning/ROADMAP.md` Phase 3；`.planning/REQUIREMENTS.md` NAR-*
- **技术：** `.planning/phases/03-metaphor-narrative/03-RESEARCH.md`、`03-PATTERNS.md`、`03-UI-SPEC.md`
- **视觉：** `openspec/changes/011-metaphor-activation/UI-SPEC.md`
