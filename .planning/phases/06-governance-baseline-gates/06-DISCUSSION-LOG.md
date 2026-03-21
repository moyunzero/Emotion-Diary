# Phase 6: 治理基线与门禁 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 06-治理基线与门禁
**Areas discussed:** 基线快照, 工具落地, 门禁策略, 执行工作流

---

## 基线快照

| Option | Description | Selected |
|--------|-------------|----------|
| 仅记录 + 导出 | 更快，但同步风险后置 | |
| 记录 + 导出 + 同步 | 覆盖面与成本平衡 | ✓ |
| 记录 + 导出 + 同步 + AI + 登录迁移 | 最全但较重 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 混合模式 | 手测脚本 + 少量自动化断言 | ✓ |
| 纯手测 | 最快，但长期不稳 | |
| 自动化优先 | 稳，但 Phase 6 投入较大 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 结构化断言 | 字段与关键文本一致，不依赖像素快照 | ✓ |
| 图像快照比对 | 严格但脆弱 | |
| 仅人工看图 | 无自动护栏 | |

| Option | Description | Selected |
|--------|-------------|----------|
| phase 目录落盘 | 便于审计与追踪 | ✓ |
| 仅测试文件 | 无单独审计文档 | |
| 根目录单文档 | 易混杂 | |

**User's choice:** 核心三路径 + 混合证据 + 结构化断言 + phase 文档落盘。  
**Notes:** 强调“可审计”和“不要脆弱快照”。

---

## 工具落地

| Option | Description | Selected |
|--------|-------------|----------|
| knip -> dep-cruise -> boundaries | 先死代码，再依赖，再开发期约束 | ✓ |
| dep-cruise 先行 | 先边界后清理 | |
| 一次性全上 | 快但噪音高 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 运行时主目录 | app/components/store/utils/hooks/services/lib | ✓ |
| 全仓 | 含原生与文档，噪音高 | |
| 小试点 | app + store | |

| Option | Description | Selected |
|--------|-------------|----------|
| 基线快照 + allowlist | 只拦新增问题 | ✓ |
| 先清零历史 | 成本过高 | |
| 永久 warn | 约束弱 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 摘要入库 + CI 可复现命令 | 平衡可追溯与仓库体积 | ✓ |
| 仅 CI 日志 | 不利审计 | |
| 全量报告入库 | 冗余大 | |

**User's choice:** 采用增量落地与“只拦新增”的策略。  
**Notes:** 关注可复现与噪音控制。

---

## 门禁策略

| Option | Description | Selected |
|--------|-------------|----------|
| report 主 + 关键 warn | 渐进收紧 | ✓ |
| 全 warn | 可行但约束弱 | |
| 尽快全 error | 风险较高 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 连续两轮 PR 新增违规=0 再升级 | 有明确阈值 | ✓ |
| 固定时间升级 | 与质量脱钩 | |
| 人工主观判断 | 不稳定 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 跨层越界 import | error 候选 | ✓ |
| 新增循环依赖 | error 候选 | ✓ |
| 新增未使用导出 | error 候选 | ✓ |
| 全部保持 warn | 暂不收紧 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 阻断合并 + 可快速解锁 | 稳健且可恢复 | ✓ |
| 不阻断 | 约束不足 | |
| 强阻断不可降级 | 恢复成本高 | |

**User's choice:** 渐进门禁 + 明确阈值升级 + 阻断合并但保留恢复通道。  
**Notes:** 明确支持 error 候选三项。

---

## 执行工作流

| Option | Description | Selected |
|--------|-------------|----------|
| 小步包 | 1-2 文件或同主题小范围 | ✓ |
| 中等包 | 3-6 文件 | |
| 大包 | 一次跨模块 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 全模板 | 目的/范围/风险/验证/回滚 | ✓ |
| 轻模板 | 仅改动说明 | |
| 无模板 | 随意 | |

| Option | Description | Selected |
|--------|-------------|----------|
| lint + 相关测试 + smoke | 最小安全门槛 | ✓ |
| 仅 lint | 覆盖不足 | |
| 仅测试 | 约束不足 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 行为稳定优先 | 发现偏差先回退 | ✓ |
| 强行前推 | 风险高 | |
| 接受轻微变化 | 与本阶段目标冲突 | |

**User's choice:** 小包推进、强模板、最小验证门槛、偏差即回退。  
**Notes:** 再次强调“稳定性第一”。

---

## Claude's Discretion

- 治理命令与脚本的具体命名。
- 基线文档表头与执行清单格式细节。

## Deferred Ideas

- AI 与登录迁移纳入 Phase 6 核心护栏（后续再评估）
- 全仓（含原生/文档）同批纳入工具规则（后续阶段）
- 一步到位全 error 强阻断（暂不采用）
