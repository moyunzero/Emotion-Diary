# Phase 10: 测试治理与 CI 收口 - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

测试体系围绕关键路径稳定运行，CI 在速度与风险控制之间达成平衡。不扩张产品功能，聚焦 TST-01（清理示例/低价值/重复测试）、TST-02（测试目录与代码边界对齐）、TST-03（CI 分层门禁）。

</domain>

<decisions>
## Implementation Decisions

### 示例/低价值/重复测试清理标准（TST-01）

- **D-01:** 示例测试删除 — `__tests__/unit/utils/example.test.ts`、`__tests__/property/example.property.test.ts` 仅验证 Jest/fast-check 基础设施，真实业务测试已覆盖；直接删除，不保留单独冒烟测试。
- **D-02:** 低价值界定采用三标准叠加（满足任一条即视为删除候选）：(1) 明确标注为示例/脚手架的；(2) 不断言业务行为的（空断言、仅测类型/导入存在）；(3) 与关键路径（记录/导出/同步）无关且维护成本高、覆盖很薄。
- **D-03:** 重复测试处理：保留「最贴近源码」的一份。例如 `__tests__/unit/shared/` 对应 `shared/` 的测试优先保留，删除 utils 或 property 中重复断言同一逻辑的用例。执行前核对不丢独特覆盖。

### Claude's Discretion

- TST-02 测试目录与代码边界对齐 — 是否建立 `__tests__/features`、colocated vs 集中式、与 features/store/shared 的映射规则，由 planner 按现有 `__tests__/unit` 结构扩展。
- TST-03 CI 分层策略 — 基础门禁 vs 进阶门禁的具体命令、PR 阶段 vs 进阶阶段职责、GitHub Actions 入口设计，由 planner 按 Phase 6 验证门槛与 `test:ci`/`verify:governance` 现状设计。
- 关键路径测试集补齐 — 记录/导出/同步各自需哪些自动化测试、`verifyGovernanceSmoke` 之外的补充，由 planner 按 Phase 6 D-01 与现有测试清单推导。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 里程碑与阶段约束

- `.planning/ROADMAP.md` — Phase 10 目标、依赖与成功标准
- `.planning/REQUIREMENTS.md` — TST-01、TST-02、TST-03 的原始约束
- `.planning/PROJECT.md` — 工程治理、可回滚、稳定性优先的里程碑原则

### 治理与测试继承

- `.planning/phases/06-governance-baseline-gates/06-CONTEXT.md` — 关键路径=记录+导出+同步、D-15 验证门槛
- `.planning/phases/06-governance-baseline-gates/06-SMOKE-CHECKLIST.md` — 关键路径 smoke 清单
- `.planning/phases/09-dir-boundary-cleanup/09-CONTEXT.md` — 测试目录重组与分层留给 Phase 10

### 代码结构与约定

- `.planning/codebase/STRUCTURE.md` — 目录边界、shared/utils 边界
- `__tests__/README.md` — 当前测试目录结构与类型说明

</canonical_refs>

<code_context>
## Existing Code Insights

### 测试结构

- `__tests__/`：`unit/`、`integration/`、`property/`；`unit/` 含 app、components、hooks、scripts、services、shared、store、utils
- 示例测试：`__tests__/unit/utils/example.test.ts`、`__tests__/property/example.property.test.ts` — 仅验证 Jest/fast-check 基础设施
- 无 `__tests__/features/` — features/ 由 Phase 8 引入

### 脚本与配置

- `test:unit`、`test:property`、`test:integration`、`test:ci`（jest.ci.config.js，无覆盖率门槛）
- `verify:governance`、`scripts/verify-governance-smoke.js` — record/export/sync smoke
- `jest.config.js` 有 80% 覆盖率门槛；`jest.ci.config.js` 已移除
- 无 `.github/workflows` — 尚未接入 GitHub Actions

### Integration Points

- Phase 6 D-15：每个包最低验证 = `lint + 相关测试 + 关键路径 smoke`
- Phase 9 已删除 `utils/reviewStatsTimeRange.ts`、`responsiveUtils`、`dateUtils` — 若存在对应过期测试需同步清理

</code_context>

<specifics>
## Specific Ideas

- 用户明确：示例测试直接删除，不保留单独冒烟测试。
- 用户明确：低价值三标准（示例标注 + 无业务断言 + 非关键路径且薄）满足任一即可删。
- 用户明确：重复时保留最贴近源码的一份，删除其余。

</specifics>

<deferred>
## Deferred Ideas

- 测试目录对齐（TST-02）与 CI 分层（TST-03）的细节 — 用户仅讨论了清理标准，其余由 planner 推导。
- 覆盖率门槛是否在 CI 中强制 — 当前 jest.ci.config 已取消；是否在进阶门禁中恢复由实现决定。

</deferred>

---

*Phase: 10-ci*
*Context gathered: 2026-03-22*
