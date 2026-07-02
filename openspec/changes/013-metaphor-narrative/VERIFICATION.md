# VERIFICATION：013 隐喻叙事加深（metaphor-narrative）

## 验证目标

- NAR-01–NAR-05 行为符合 `SPEC.md` 与 CONTEXT D-01–D-15
- Phase 3 CI gate：`yarn typecheck && yarn lint && yarn test`
- Maestro 011 和解路径 testID 契约（或 signed manual UAT）

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | ✅ pass（03-04 execute，2026-07-02） |
| ESLint | `yarn lint` | ✅ pass，0 errors（8 既有 warnings） |
| 天气叙事单元 | `yarn test __tests__/unit/shared/weather/weatherNarrative.test.ts --bail` | ✅ pass |
| 花园里程碑单元 | `yarn test __tests__/unit/services/gardenMilestone.test.ts --bail` | ✅ pass（9/9） |
| i18n parity | `yarn test __tests__/unit/i18n/namespaceKeys.test.ts --bail` | ✅ pass（含 rituals namespace） |
| 全量测试 | `yarn test` | ✅ 326/326 pass（03-04 execute） |
| Maestro preflight | `yarn test:maestro:preflight` | ⚠️ 模拟器已启动，但未安装 dev build `com.moyunzero.emotiondiary` |
| Maestro E2E 011 | `yarn test:maestro:011` | ⏭️ 未执行 — 需 `yarn ios` 安装 dev build 后重跑 |
| 治理规则 | `yarn verify:governance` | 未执行 |

## 行为验证

- [x] NAR-01：WeatherStation 规则叙事 + Dashboard header `weatherAdvice`（Wave 2，03-02）
- [x] NAR-02：resolve rate 跨阈值 → pending milestone → Insights `garden-milestone-banner`（03-04）
- [x] NAR-03：和解 confirm overlay + ceremony + burn post-copy（Wave 3，03-03）
- [x] NAR-04：`utils.potStatus.*` i18n + `resolvePeopleLabel` 花盆人名（Wave 1 + 03-04 验收）
- [x] NAR-05：Dashboard `dashboard-empty-icon-{filter}` 按筛选换 icon（03-04）
- [ ] Maestro 011 全路径：entry-resolve → resolve-confirm-* → resolve-ceremony-skip → resolved filter → insights `garden-ambience`
- [ ] 手工 UAT — NAR-02 里程碑：和解足够条目使 resolve rate 跨 0.2，重开 Insights 见 banner 一次
- [ ] 手工 UAT — NAR-05 空态：逐一切换 active/resolved/burned/all 空列表，确认 icon 与 testID

## E2E 映射

| 需求 | 自动化 | 说明 |
| --- | --- | --- |
| NAR-01 | `weatherNarrative.test.ts` | 规则引擎 mood/deadline 分支 |
| NAR-02 | `gardenMilestone.test.ts` + manual UAT | `garden-milestone-banner` testID |
| NAR-03 | Maestro 011 resolve path | `resolve-confirm-*`、`resolve-ceremony-skip` |
| NAR-04 | `namespaceKeys.test.ts` insights pair + `insightsCopy.test.ts` | `utils.potStatus.*` zh/en |
| NAR-05 | manual UAT / Maestro 截图 | `dashboard-empty-icon-{filter}` |

### Maestro 011 路径（`.maestro/flows/011-metaphor-acceptance.yaml`）

1. `seed-active-entry` subflow（含 onboarding skip）
2. `entry-resolve-button` → `resolve-confirm-root` → `resolve-confirm-confirm`
3. `resolve-ceremony-skip`（可选）→ ceremony 结束
4. `dashboard-filter-resolved` → 已和解列表
5. `emotiondiary://insights` → `insights-screen` + `garden-ambience`

Flow 约束：`grep -v '^#' .maestro/flows/011-metaphor-acceptance.yaml | grep -c 'text:'` 应为 **0**（仅 `id:` 选择器）。

## 命令速查

```bash
yarn test __tests__/unit/shared/weather/weatherNarrative.test.ts __tests__/unit/services/gardenMilestone.test.ts __tests__/unit/i18n/namespaceKeys.test.ts --bail
yarn typecheck && yarn lint && yarn test
yarn test:maestro:preflight && yarn start & yarn test:maestro:011
```

**Maestro 前置：** 模拟器需已安装 dev build（`yarn ios`）；preflight 检查 `com.moyunzero.emotiondiary`。

## 手工 UAT 清单（Maestro 不可用时）

| 场景 | 步骤 | 期望 |
| --- | --- | --- |
| NAR-02 里程碑 | 创建 ≥5 条 active，和解至 resolve rate ≥0.2；离开 Insights 再进入 | `garden-milestone-banner` 出现一次；再次进入不再出现 |
| NAR-03 和解仪式 | 点 `entry-resolve-button` → 确认 → ceremony（可 Skip） | 条目变 resolved；无 Alert 依赖文案 |
| NAR-05 空态 icon | 清空各 filter 列表或切换至无数据 filter | active=Sprout、resolved=Leaf、burned=Flame、all=CloudSun |
| NAR-04 花盆 | Insights 关系花园有数据时 | 状态标签为 i18n `utils.potStatus.*`；预设人名本地化 |

## testID 清单（03-04 新增/确认）

| testID | 组件 | 用途 |
| --- | --- | --- |
| `garden-milestone-banner` | HealingProgress | 里程碑内联庆祝 |
| `dashboard-empty-icon-active` | Dashboard | 待处理空态 |
| `dashboard-empty-icon-resolved` | Dashboard | 已和解空态 |
| `dashboard-empty-icon-burned` | Dashboard | 已焚烧空态 |
| `dashboard-empty-icon-all` | Dashboard | 全部空态 |

## 未验证项

- Maestro 011 全路径（dev build 未安装于当前模拟器）
- Android Maestro
- `yarn verify:governance`

## 剩余风险

- milestone AsyncStorage 失败时静默跳过庆祝（T-03-08，accept）
- Maestro 011 依赖 Wave 3 resolve ceremony testID；若 dev build 过期需重装

## 文档更新记录

- [x] `openspec/changes/013-metaphor-narrative/SPEC.md` — plan-phase 创建
- [x] `openspec/changes/013-metaphor-narrative/VERIFICATION.md` — 03-04 execute 填充命令表与 E2E 映射
