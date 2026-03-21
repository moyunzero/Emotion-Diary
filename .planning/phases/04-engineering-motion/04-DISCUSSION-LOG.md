# Phase 4: 工程与动效 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 04-engineering-motion
**Areas discussed:** 全仓优化粒度

---

## 全仓优化粒度

| Option | Description | Selected |
|--------|-------------|----------|
| 保守小包 | 每次改 1–2 个文件，优先可回滚与低风险 | ✓ |
| 中等小包 | 每次改 3–6 个同主题文件，平衡速度与风险 | |
| 主题包偏大 | 每次改 7–12 个文件，一次做透 | |
| 你来定 | 由 Claude 自动拆包 | |

**User's choice:** 保守小包（1–2 文件/次）
**Notes:** 要求每包边界清晰，便于回滚。

---

## 优化类型范围

| Option | Description | Selected |
|--------|-------------|----------|
| 只允许低风险去冗余 | 删未用、类型收敛、重复抽取 | |
| 低风险 + 轻结构调整 | 文件内重排与小抽取，不跨模块 | |
| 允许跨模块小迁移 | 小范围跨目录迁移，需测试兜底 | ✓ |
| 你来定 | Claude 自动筛选 | |

**User's choice:** 允许跨模块小迁移（需测试）
**Notes:** 仅限小迁移，不做目录级搬迁。

---

## 每包验证门槛

| Option | Description | Selected |
|--------|-------------|----------|
| 只跑 lint | 最快 | |
| lint + 相关单测 | 平衡方案 | |
| lint + 单测 + 手动关键路径检查 | 稳定优先 | ✓ |
| 你来定 | Claude 按风险分级 | |

**User's choice:** lint + 相关单测 + 一次手动关键路径检查
**Notes:** 每个小包都要满足该最低验证标准。

---

## 冲突时优先级

| Option | Description | Selected |
|--------|-------------|----------|
| 行为稳定优先 | 不改变用户可见行为 | ✓ |
| 可维护性优先 | 可接受轻微行为变化并记录 | |
| 按模块分级 | 核心稳定优先，非核心可维护优先 | |
| 你来定 | Claude 自动判定 | |

**User's choice:** 行为稳定优先
**Notes:** 宁可保留技术债，也不引入行为偏差。

---

## Claude's Discretion

- 在满足上述门槛前提下，自主安排具体 1–2 文件小包的执行顺序。

## Deferred Ideas

- None.
