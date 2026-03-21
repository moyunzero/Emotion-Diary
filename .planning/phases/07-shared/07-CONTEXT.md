# Phase 7: Shared 重复逻辑收敛 - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

在不扩展产品功能的前提下，把 `responsive / time-range / formatting` 三类重复逻辑收敛到 shared 单一来源，并通过兼容层保障现有调用稳定迁移。

</domain>

<decisions>
## Implementation Decisions

### 收敛顺序与节奏
- **D-01:** 执行顺序固定为 `formatting -> time-range -> responsive`。
- **D-02:** 采用短周期小包推进，每批控制在 `1-2 天`。
- **D-03:** 虽然首批是 formatting，但每批都必须包含统计口径一致性检查，避免语义漂移。

### 兼容层策略
- **D-04:** 旧入口仅保留到 Phase 7 结束。
- **D-05:** Phase 8 只允许删除旧入口，不允许新增任何旧入口调用。
- **D-06:** Phase 7 期间通过兼容层维持外部调用稳定，迁移优先“替换调用点”，不做破坏性清理。

### 一致性判定口径
- **D-07:** 采用“业务一致”标准：核心数值与业务结论必须一致。
- **D-08:** 文案与展示格式允许微调，但不得改变语义与结论。

### 测试深度（SHR-03）
- **D-09:** 测试策略采用稳健档：`shared` 纯函数单测 + 2 条关键页面最小回归（导出页、洞察页）。
- **D-10:** 任何收敛改动都需有边界输入测试（日期边界、空值、跨月/跨周等）。

### Claude's Discretion
- shared 目录内部具体文件命名可由 Claude 决定，但需保持“按领域分组、入口清晰、可被 tree-shaking”。
- 对旧入口 wrapper 的具体保留方式（re-export 或 thin adapter）由 Claude 决定，但必须可追踪并可逐步删除。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 7 的目标、依赖与成功标准（SHR-01/02/03）。
- `.planning/REQUIREMENTS.md` — SHR-01~SHR-03 需求定义与追踪矩阵。
- `.planning/PROJECT.md` — 里程碑约束（不改核心用户价值、增量可回滚）。
- `.planning/STATE.md` — 当前阶段位置与近期决策背景。

### Governance carry-forward constraints
- `.planning/phases/06-governance-baseline-gates/06-GATE-RULES.md` — 渐进门禁与升级/回退约束。
- `.planning/phases/06-governance-baseline-gates/06-GOVERNANCE-PR-TEMPLATE.md` — 小包提交和偏差处理字段约束。

### Existing implementations to converge
- `utils/responsiveUtils.ts` — 现有响应式工具。
- `hooks/useResponsiveStyles.ts` — 响应式 Hook（可作为收敛入口候选）。
- `utils/reviewStatsTimeRange.ts` — 时间区间逻辑现有单一实现候选。
- `utils/dateUtils.ts` — 日期与格式化基础函数。
- `services/companionDaysService.ts` — 日期格式化重复点之一。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `utils/responsiveUtils.ts`: 已有断点/尺寸派生能力，可作为 responsive 收敛核心。
- `hooks/useResponsiveStyles.ts`: 可封装页面侧样式收敛，但目前消费不足。
- `utils/reviewStatsTimeRange.ts`: 具备周/月区间能力，适合作为 time-range 单一来源。
- `utils/dateUtils.ts`: 已提供日期工具，可扩展为 formatting 统一入口。

### Established Patterns
- 现有代码倾向“工具函数 + 组件内轻调用”的模式，适合以 shared pure functions 推进。
- Phase 6 已建立治理脚手架与 smoke 守护，支持小包增量迁移与回归验证。
- 多处仍存在组件内重复计算与手写格式化，说明需要“先兼容、再替换、后清理”的迁移链路。

### Integration Points
- 洞察页与导出页是 time-range/formatting 的主要消费点，需要优先验证结果一致性。
- Profile 与 Dashboard 等页面涉及 responsive 逻辑，适合放到第三批处理。
- store/统计相关逻辑需优先保障数值与业务结论一致。

</code_context>

<specifics>
## Specific Ideas

- Phase 7 明确采用“稳定优先”的迁移策略：先低风险统一展示层，再统一统计口径，最后处理布局响应式。
- 所有替换都遵循“先加新入口 + 对照验证 + 切换调用 + 保留兼容层”的可回滚路径。

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-shared*
*Context gathered: 2026-03-21*
