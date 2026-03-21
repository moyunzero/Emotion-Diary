# Phase 7: Shared 重复逻辑收敛 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 07-Shared 重复逻辑收敛
**Areas discussed:** 收敛优先级与批次顺序, 兼容层保留策略, 行为一致性判定口径, 测试覆盖深度

---

## 收敛优先级与批次顺序

| Option | Description | Selected |
|--------|-------------|----------|
| 方案1 | `formatting -> time-range -> responsive`，先低风险后高风险 | ✓ |
| 方案2 | `time-range -> formatting -> responsive`，先统一统计口径 | |
| 方案3 | `responsive -> time-range -> formatting`，先攻高风险 | |

**User's choice:** 方案1  
**Notes:** 用户明确偏好短期稳定、1-2天小包推进；虽然先做 formatting，但强调每批都要检查统计口径一致性；接受 responsive 放最后处理。

---

## 兼容层保留策略

| Option | Description | Selected |
|--------|-------------|----------|
| 1 | 旧入口保留到 Phase 8 结束 | |
| 2 | 旧入口仅保留到 Phase 7 结束，Phase 8 只删不增 | ✓ |
| 3 | Phase 7 内清零旧入口 | |

**User's choice:** 2  
**Notes:** 采用中性策略，兼顾迁移稳定与技术债退出窗口。

---

## 行为一致性判定口径

| Option | Description | Selected |
|--------|-------------|----------|
| 1 | 严格一致（数值+文案格式+排序完全一致） | |
| 2 | 业务一致（核心数值/业务结论一致，格式可微调） | ✓ |
| 3 | 宽松一致（用户无明显感知差异即可） | |

**User's choice:** 2  
**Notes:** 用户允许展示格式优化，但不接受语义或结论变化。

---

## 测试覆盖深度

| Option | Description | Selected |
|--------|-------------|----------|
| 1 | 仅 shared 纯函数单测 | |
| 2 | shared 单测 + 导出页/洞察页最小回归 | ✓ |
| 3 | shared 单测 + 页面回归 + 扩展 E2E smoke | |

**User's choice:** 2  
**Notes:** 选择稳健档，兼顾开发效率与回归风险控制。

---

## Claude's Discretion

- shared 内部命名与目录拆分细节可由 Claude 在计划阶段细化。
- 兼容层技术实现方式（wrapper/re-export）可由 Claude 结合代码现状决定。

## Deferred Ideas

- None
