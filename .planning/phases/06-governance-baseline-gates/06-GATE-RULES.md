# Phase 06 Gate Rules

## Current Gate Level

- `report`: 非阻断，仅用于可见化与趋势跟踪（默认基线）。
- `warn`: 高风险项预警（当前阶段默认用于边界越层、循环依赖、新增未使用导出）。
- `error`: 阻断合并（仅在满足升级条件后启用）。

## Rule-to-Level Mapping

| Rule / Signal | Current | Candidate for `error` | Source |
| --- | --- | --- | --- |
| Cross-layer boundary import | warn | Yes | `scripts/governance/depcruise.cjs`, `eslint.config.js` |
| New circular dependency | warn | Yes | `scripts/governance/depcruise.cjs` |
| New unused export | warn | Yes | `scripts/governance/depcruise.cjs`, `scripts/governance/allowlist.knip.json` |
| Unresolvable import | report | No (phase 06 baseline) | `scripts/governance/depcruise.cjs` |

## Upgrade Condition (D-10)

从 `warn` 升级到 `error` 的统一条件：

1. 连续两轮 PR（同一规则集）新增违规数都等于 0。
2. 两轮 PR 都满足最小验证门槛（见下文 D-15）。
3. 升级动作必须在本文件中留痕（日期、规则、负责人、回滚点）。

未满足条件时，禁止“拍脑袋”切到 `error`。

## Default Blocking Strategy (D-12)

- 当规则处于 `error` 级别时：CI 默认阻断合并。
- 当规则处于 `warn` 级别时：允许合并，但必须在 PR 中给出处置说明（修复计划或可追踪豁免）。

## Emergency Unlock Strategy (D-12)

如遇误报或生产阻塞，可采用下列应急解锁（必须留痕）：

1. 首选：回滚当前重构包（最小影响面）。
2. 备选：将单条规则临时从 `error` 降为 `warn`，并在下个 PR 恢复。
3. 必填留痕：触发原因、临时窗口、恢复负责人、验证结果。

## Minimum Verification Bar (D-15)

每个重构包在提交前至少通过：

1. `npm run lint`
2. 相关测试（受影响模块的单测/集成测试）
3. 关键路径 smoke（记录 / 导出 / 同步）

## Governance Commands

- Baseline check: `npm run verify:governance -- --dry-run`
- Lint gate (boundaries included): `npm run lint`

## Change Log

- 2026-03-21: 初始化 Phase 06 的渐进门禁规则（report/warn/error + 升级条件 + 阻断/解锁策略）。
