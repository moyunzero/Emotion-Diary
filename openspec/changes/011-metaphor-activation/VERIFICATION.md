# VERIFICATION：011 隐喻激活

## 验证目标

- 全站 011 粉系 token 迁移无 legacy 跳色回归（P0 清单）
- 和解仪式 Overlay + Ceremony 可 E2E 验收
- CI 全绿

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | 通过（2026-07-01） |
| ESLint | `yarn lint` | 通过（0 errors，既有 warnings） |
| Jest | `yarn test` | 通过（298 tests） |
| P0 跳色 grep | `COLORS.submit` 作 CTA、硬编码 `#6C63FF`/`#3B82F6` 作强调 | 无组件层违规 |
| ui-components 同步 | 人工对照 §配色 | 已更新 011 段 |
| Maestro 011 seed | `seed-active-entry.yaml` 经 intro skip 造数 | ✅ pass（2026-07-02；B-01 修复） |
| Maestro 011 全流 | `yarn test:maestro:011` | seed 段 ✅；主 flow 和解步骤需设备复验 |

## 行为验证

- [x] 正常路径：展开卡片 → 和解 → 确认 Overlay → 仪式 skip → 已和解筛选可见
- [x] 异常路径：确认 Overlay 取消 → 状态和条目不变
- [x] 数据持久化：`resolveEntry` 仍写 store + 本地持久化（无 API 变更）
- [x] 云端同步：无变更
- [ ] Web / iOS / Android 差异：Maestro 仅 iOS；Web/Android 未设备复验

## 012 集成（B-01）

`.maestro/subflows/seed-active-entry.yaml` 在 `clearState: true` 后：

1. `extendedWaitUntil` → `onboarding-skip-button`
2. tap Skip（012 Host landing 到记一笔 Tab）
3. 直接填写 mood entry，再 deep link 回 dashboard 断言 `mood-entry-card`

011 与 012 不再在 fresh install 造数场景冲突。

## 未验证项

- Maestro `011-metaphor-acceptance` 和解仪式全路径（seed 已通过；`entry-resolve-button` 步骤待设备复验）
- 全站人工视觉 UAT（Profile 全分组、记一笔、回收站逐屏）

## 剩余风险

- Toast `info` 仍用 `COLORS.info`（#3B82F6）— 限 Toast，符合 UI-SPEC
- `success` 绿限 Toast；花园 blooming 仍用 `accent` 绿 —  intentional

## 文档更新记录

- `openspec/ui-components.md` §配色 → 011 权威描述
- `openspec/changes/011-metaphor-activation/SPEC.md`、本文件
- `.planning/REQUIREMENTS.md` MET-* → Phase 1 Complete
- `.planning/ROADMAP.md` Phase 1 checked
