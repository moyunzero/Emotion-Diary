# Phase 10: 测试治理与 CI 收口 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 10-ci
**Areas discussed:** 示例/低价值/重复测试的清理标准

---

## 示例/低价值/重复测试的清理标准

### Q1: 示例测试（example.test.ts、example.property.test.ts）处理

| Option | Description | Selected |
|--------|-------------|----------|
| 删除 | 真实业务测试已在跑，不再需要单独冒烟 | ✓ |
| 保留但精简 | 各保留 1 个最简用例 | |
| 合并到一个 smoke 文件 | 如 `__tests__/smoke/infrastructure.test.ts` | |
| 先保留 | 暂不清理 | |

**User's choice:** 1 — 删除
**Notes:** 直接删除，不保留单独冒烟测试。

---

### Q2: 「低价值」测试界定

| Option | Description | Selected |
|--------|-------------|----------|
| 只删明确标注为示例/脚手架的 | 其它一律不动 | ✓ (组合) |
| 删「不断言业务行为」的 | 空断言、仅测类型/导入存在 | ✓ (组合) |
| 删「与关键路径无关且很薄」的 | 非记录/导出/同步且维护成本高 | ✓ (组合) |
| 由实现阶段逐份评审 | 不设硬规则，计划内列候选 | |

**User's choice:** 1+2+3 — 三标准叠加，满足任一条即可作为删除候选
**Notes:** 执行前需核对不丢独特覆盖。

---

### Q3: 「重复」测试处理

| Option | Description | Selected |
|--------|-------------|----------|
| 保留最贴近源码的一份 | 如 unit/shared 对 shared 的测试优先 | ✓ |
| 保留集成面最大的一份 | 更接近用户流程 | |
| 不自动合并 | 计划内标注，PR 人工决定 | |
| 以运行时间为准 | 重复时删更慢/更脆的 | |

**User's choice:** 1 — 保留最贴近源码的一份
**Notes:** 删除 utils 或 property 中重复断言同一逻辑的用例。

---

## Claude's Discretion

- TST-02 测试目录对齐 — 未讨论，由 planner 推导
- TST-03 CI 分层策略 — 未讨论，由 planner 推导
- 关键路径测试集 — 未讨论，由 planner 按 Phase 6 推导

## Deferred Ideas

- 测试目录与代码边界对齐的细节
- CI 基础门禁 vs 进阶门禁的具体设计
- 覆盖率门槛在 CI 中的角色
