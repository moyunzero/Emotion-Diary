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
| Maestro E2E | `yarn test:maestro:012` | 未执行（需模拟器 + dev build） |
| Web E2E | `yarn test:e2e e2e/onboarding-metaphor.spec.ts` | 未执行（需 Playwright + Metro Web） |
| 治理规则 | `yarn verify:governance` | 未执行 |
| 手工 UAT | 新用户 3 屏 + Profile 重看 + 首记 hint | 未执行 |
| 手工 UAT — 双语 | Profile 切换 zh/en 时 intro / replay 文案随 i18next 更新（ROADMAP #3） | 未执行 |

## 行为验证

- [ ] 正常路径：新用户 3 屏 → 开始记录 → Record tab + 首记 hint
- [ ] Skip 路径：Skip → seen 持久化 → relaunch 无 auto-show
- [ ] 重看路径：Profile replay → Modal 从 slide 1；有条目时不显示首记 hint
- [ ] 升级路径：预置 mood_entries / user_session → migration 后无 intro
- [ ] 双语：zh/en 切换后 intro 与 hint 文案更新
- [ ] Web / iOS / Android：Modal 可见；Web localStorage seen 与 native 语义一致

## E2E 映射

| 需求 | 自动化 | 说明 |
| --- | --- | --- |
| ONB-01 | Maestro Path A/B、Playwright fresh storage | `onboarding-modal-root` |
| ONB-02 | Maestro Path C | `emotiondiary://profile` + `profile-replay-intro-item` |
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

- Maestro 012 全路径（需 iOS/Android 模拟器 + dev build）
- Playwright Web smoke（需本地 Metro Web）
- 双语 Profile 切换 UAT（ROADMAP success criterion #3）
- Path D 原生 migration 预置 smoke（见上表）

## 剩余风险

- `useSegments()` auto-show 时序（A1）：需 Maestro `clearState: true` 验证
- Web localStorage key 前缀（A4）：Playwright 使用与 AsyncStorage 同名 key `onboarding_metaphor_v1_seen`
- `seed-active-entry.yaml` 在 intro 启用后可能需先 dismiss intro — 011 流程独立，012 Path B 自包含

## 文档更新记录

- [x] `openspec/changes/012-onboarding-metaphor/SPEC.md` — plan-phase 创建
- [x] `openspec/changes/012-onboarding-metaphor/VERIFICATION.md` — 02-04 execute 填充命令表与 E2E 映射
