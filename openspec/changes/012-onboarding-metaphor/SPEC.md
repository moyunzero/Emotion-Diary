# SPEC：012 首次理解路径（onboarding-metaphor）

## 背景

- **当前问题：** v1.4 隐喻视觉（011）已统一，但新用户首次打开仍可能不理解「关系天气记给自己看」——缺少 ≤3 屏教学路径。
- **用户影响：** 激活率低、首记门槛高；老用户升级不应被重复打扰。
- **相关代码：** `app/_layout.tsx`（splash/i18n 门闩）、`app/(tabs)/_layout.tsx`（Tab chrome）、`features/profile/`（设置重看）、`components/MoodForm.tsx` / `EntryEditor`（首记引导）。
- **相关文档：** `.planning/REQUIREMENTS.md` ONB-01–ONB-05；`openspec/changes/011-metaphor-activation/UI-SPEC.md`（粉色疗愈 token）。

## 目标

| ID | 能力 | 实现要点 |
|----|------|----------|
| ONB-01 | 首次冷启动 ≤3 屏隐喻 intro + Skip | `MetaphorOnboardingModal` 全屏 Modal；气象站→记一笔→花园；Tab 挂载后 auto-show |
| ONB-02 | Profile 可重看 intro | 设置项「重新观看介绍」→ 同一 Modal 从第 1 屏 |
| ONB-03 | zh/en 文案随 locale | `locales/*/onboarding.json` + `i18n/index.ts` 注册；`namespaceKeys` 双语 parity |
| ONB-04 | Intro 结束 landing 记一笔 + 首记 inline hint | `router.replace('/record')`；MoodForm 内联 hint + warm placeholder |
| ONB-05 | 默认只展示一次；冷启动持久化 | AsyncStorage `onboarding_metaphor_v1_seen`；升级 migration |

### 不在本次范围

- 第 4 屏 burn/resolve 仪式教学（Phase 3 NAR）
- intro 内交互 mini-demo
- 每用户独立 seen key
- 首记 top banner / tooltip 模式
- 新 telemetry / 日记内容上报

## 用户行为

### 触发入口

1. **新用户首次进入 (tabs)：** splash 隐藏且 i18n/store init 完成后，auto-show 3 屏 Modal（D-02）。
2. **Profile 设置：** 「重新观看介绍」手动打开同一 Modal（D-04）。
3. **Skip / 开始记录：** 写入 seen，关闭 Modal，确保 Record tab 激活（D-13）。

### 期望结果

- 3 屏内理解 Weather → Record → Garden 隐喻链（D-06）。
- Skip 或完成后不再 auto-show；重看仅经 Profile（D-12）。
- 无可见条目时 Record 页显示 inline 首记 hint，首条保存后消失（D-15）；重看不触发 hint（D-16）。

### 异常或边界

- 升级用户有 `mood_entries*` 或 `user_session` → migration 设 seen，不展示（D-11）。
- 已在 `/record` 时完成 intro → 不重复 `router.replace`（D-13）。
- Profile 登录 Modal 与 intro Modal 不嵌套；replay 由 root Host 覆盖（RESEARCH Pitfall 2）。

## 技术约束

- **架构：** `services/onboardingMetaphor.ts` + `MetaphorOnboardingHost` 挂于 `app/_layout.tsx`（Stack 兄弟节点）；Profile 经 imperative `openOnboardingReplay()`。
- **数据：** 设备级 global key `onboarding_metaphor_v1_seen`（D-10）；不阻塞 `initI18n()`。
- **i18n（Wave 1 已交付）：** `locales/*/onboarding.json`（slides/actions/firstEntry）；`profile.json` → `onboarding.replayIntro`；`i18n/index.ts` 注册 `onboarding` namespace。
- **多端：** iOS/Android Maestro E2E；Web Playwright smoke（localStorage 同 key 名）。
- **视觉：** 011 pink-healing token；Lucide 图标作 illustration（D-05 discretion）。
- **E2E：** 全部控件 stable `testID`，不断言 locale 文案（ROADMAP Phase 2 #5）。

## 锁定决策（CONTEXT D-01–D-16）

| ID | 决策 |
|----|------|
| D-01 | 全屏 Modal，叠于 Tab 之上 |
| D-02 | splash 隐藏且 Tab layout 挂载后展示 |
| D-03 | 仅 Next / Start + Skip；无返回、无 swipe dismiss |
| D-04 | Profile 重看复用同一全屏 Modal |
| D-05 | 每屏 illustration/icon + title + body |
| D-06 | 严格 3 屏：气象站→记一笔→花园 |
| D-07 | 温暖短文案 |
| D-08 | 底部 3-dot pager |
| D-09 | 仅真正新用户 auto-show |
| D-10 | key `onboarding_metaphor_v1_seen` |
| D-11 | 升级 migration：entries 或 user_session → seen |
| D-12 | Skip 写 seen=true |
| D-13 | Complete/Skip 后确保 Record tab |
| D-14 | 首记 inline hint + warm placeholder |
| D-15 | hint 至首条保存 |
| D-16 | Profile 重看不显示首记 hint |

## 验收标准

- [ ] 新用户冷启动见 ≤3 屏 intro，Skip 后 relaunch 不再 auto-show（ONB-01, ONB-05）
- [ ] Profile「重新观看介绍」打开 intro 从第 1 屏（ONB-02）
- [ ] zh/en 文案完整；切换语言后 intro 文案即时更新（ONB-03）
- [ ] Complete/Skip 后 Record tab + `record-first-entry-hint`（无条目时）（ONB-04）
- [ ] `yarn test __tests__/unit/services/onboardingMetaphor.test.ts` 通过 migration 矩阵（ONB-05）
- [ ] Maestro `012-onboarding-metaphor.yaml` 或等效 UAT
- [ ] `yarn typecheck && yarn lint && yarn test` CI 绿

## 依据

- **产品：** `.planning/ROADMAP.md` Phase 2；`.planning/REQUIREMENTS.md` ONB-*
- **技术：** `.planning/phases/02-onboarding-metaphor/02-RESEARCH.md`、`02-PATTERNS.md`
- **视觉：** `openspec/changes/011-metaphor-activation/UI-SPEC.md`
