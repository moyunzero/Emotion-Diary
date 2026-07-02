# VERIFICATION：012 首次理解路径（onboarding-metaphor）

## 验证目标

- ONB-01–ONB-05 行为与持久化符合 `SPEC.md` 与 CONTEXT D-01–D-16
- 升级 migration 不误伤老用户
- E2E 仅依赖 testID，不依赖 locale 文案

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | ✅ pass（02-04 execute） |
| ESLint | `yarn lint` | ✅ pass，0 errors（7 既有 warnings） |
| 单元测试 | `yarn test __tests__/unit/services/onboardingMetaphor.test.ts --bail` | ✅ 8/8 pass |
| i18n parity | `yarn test __tests__/unit/i18n/namespaceKeys.test.ts --bail` | ✅ 15/15 namespace pairs pass |
| 全量测试 | `yarn test` | ✅ 307/307 pass |
| Maestro E2E | `yarn test:maestro:012` | ✅ pass（Path A/B，2026-07-02 validate） |
| Web E2E | `yarn test:e2e e2e/onboarding-metaphor.spec.ts` | ✅ 2/2 pass（2026-07-02 validate） |
| 治理规则 | `yarn verify:governance` | 未执行 |
| 手工 UAT | 新用户 3 屏 + 首记 hint | Maestro Path B ✅ |
| 手工 UAT — 双语 | 切换语言后 intro 文案 | 见 Manual-Only（无 Profile 重看入口） |

## 行为验证

- [x] 正常路径：新用户 3 屏 → 开始记录 → Record tab + 首记 hint（Maestro Path B）
- [x] Skip 路径：Skip → seen 持久化 → relaunch 无 auto-show（Maestro Path A）
- [ ] 重看路径：~~Profile replay~~（ONB-02 已撤销，2026-07-02）
- [ ] 升级路径：预置 mood_entries / user_session → migration 后无 intro（单元 ✅；Path D 手工）
- [ ] 双语：zh/en 切换后 intro 与 hint 文案更新（Manual-Only）
- [x] Web / iOS：Modal 可见；Web localStorage seen 与 native 语义一致（Playwright + Maestro）

## E2E 映射

| 需求 | 自动化 | 说明 |
| --- | --- | --- |
| ONB-01 | Maestro Path A/B、Playwright fresh storage | `onboarding-modal-root` |
| ONB-02 | **已撤销** — 个人中心不提供重看入口 | — |
| ONB-03 | `namespaceKeys.test.ts` onboarding pair | zh/en 键结构 parity |
| ONB-04 | Maestro Path B | `tab-record` + `record-first-entry-hint` |
| ONB-05 | 单元 migration matrix；Maestro Path A persistence | Path D migration 预置见下方 |

### Maestro Path D（migration 手工）

Maestro 无法在无 UI 侧预置 AsyncStorage。升级路径 smoke：

1. 在设备/模拟器预置 `mood_entries_guest`（非空 JSON 数组）且**不**写入 `onboarding_metaphor_v1_seen`
2. `launchApp: clearState: true`（或冷启动）
3. 断言 `onboarding-modal-root` **不可见**（10s 内）

单元测试 `onboardingMetaphor.test.ts` 已覆盖全部 migration 分支。

## 命令速查

```bash
yarn test __tests__/unit/services/onboardingMetaphor.test.ts __tests__/unit/i18n/namespaceKeys.test.ts --bail
yarn typecheck && yarn lint && yarn test
yarn test:maestro:preflight && yarn start & yarn test:maestro:012
yarn test:e2e e2e/onboarding-metaphor.spec.ts
```

Maestro flow 约束：`grep -v '^#' .maestro/flows/012-onboarding-metaphor.yaml | grep -c 'text:'` 应为 **0**（仅 `id:` 选择器）。

## 未验证项

- Path D 原生 migration 预置 smoke（Maestro 无法预置 AsyncStorage；单元测试已覆盖）
- 双语 Profile 切换 UAT（ROADMAP success criterion #3；无 Profile 重看入口）
- Android Maestro（当前仅 iOS 模拟器验证）

## 剩余风险

- `useSegments()` auto-show 时序（A1）：需 Maestro `clearState: true` 验证
- Web localStorage key 前缀（A4）：Playwright 使用与 AsyncStorage 同名 key `onboarding_metaphor_v1_seen`
- ~~`seed-active-entry.yaml` intro 冲突~~ — **已修复**（2026-07-02）：subflow 先 tap `onboarding-skip-button`，Skip 后 landing Record 再造数

## 文档更新记录

- [x] `openspec/changes/012-onboarding-metaphor/SPEC.md` — plan-phase 创建
- [x] `openspec/changes/012-onboarding-metaphor/VERIFICATION.md` — 02-04 execute 填充命令表与 E2E 映射
