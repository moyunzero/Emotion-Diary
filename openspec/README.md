# OpenSpec 使用指南（含 SSD 规范同步开发）

本目录是 **规范驱动开发（Spec-driven Development，SDD）** 的单一入口：既包含面向产品/架构的 **OpenSpec 静态规范**（`*.md`），也包含与代码改动一一对应的 **任务级规范**（`changes/`）与模板（`templates/`）。README 中的「OpenSpec」即指本目录。

## 工程上下文（两篇、控制篇幅）

**系统与集成**（架构、目录树、技术栈、外部集成、同步要点）：[`engineering-system.md`](./engineering-system.md)。  
**质量与体验**（代码约定、技术债与风险、UI 壳层、测试与 CI）：[`engineering-quality.md`](./engineering-quality.md)。  

两篇文首均有 **SDD 定位**（工程事实 vs `changes/*/SPEC.md` 验收契约）及与根目录 `data-models.md` 等的**禁止双写**说明。仓库根 **`.planning/`** 为本地规划（**gitignore**，不上传远程）。

**迭代排期（母规范）**：竞品校准后的工程优先路线图见 [`iteration-roadmap-2026.md`](./iteration-roadmap-2026.md)（指导 `changes/003`–`010`，不替代各任务 `SPEC.md`）。

---

## 目录结构

```text
openspec/
├── README.md                    # 本文件：流程 + 目录说明
├── development-workflow.md      # 开发工作流（提案→审查→实施→归档）
├── project-overview.md          # 项目概览规范
├── data-models.md               # 数据模型规范
├── state-management.md          # 状态管理规范
├── ui-components.md             # UI 组件规范
├── services.md                  # 服务层规范
├── utils.md                     # 工具函数规范
├── consistency-report.md        # 规范与实现一致性报告（若有）
├── iteration-roadmap-2026.md    # 迭代路线图（母规范，指导 changes/003–010）
├── engineering-system.md        # 工程：架构、目录、栈、集成、同步
├── engineering-quality.md       # 工程：约定、风险、UI 壳层、测试/CI
├── templates/                   # 新任务拷贝用模板
│   ├── SPEC.md
│   ├── PLAN.md
│   └── VERIFICATION.md
└── changes/                     # 按任务归档的变更规范（SSD 任务根目录）
    └── <编号>-<简短名称>/
        ├── SPEC.md              # 必填：目标、验收、约束
        ├── PLAN.md              # 可选：多步骤/高风险时
        ├── VERIFICATION.md      # 必填：验证命令与结果
        └── REGRESSION-CHECKLIST.md  # 可选：手工回归（如 003）
```

新任务建议路径示例：`openspec/changes/002-audio-recovery-tests/SPEC.md`。

**当前大批次索引**（合入前对照）：[`changes/WORKTREE-2026-06.md`](./changes/WORKTREE-2026-06.md)（003–010 + E2E + 验证命令）。

---

## 核心原则（SSD）

1. **先有依据，再改代码**：实现前阅读 `AGENTS.md`、本 README、**[`engineering-system.md`](./engineering-system.md)** / **[`engineering-quality.md`](./engineering-quality.md)**（按改动类型择一或通读），再打开任务 `SPEC.md`。
2. **小规范驱动小改动**：每个功能/重要修复/跨模块重构在 `openspec/changes/<编号>-<名称>/` 下维护 `SPEC.md`；复杂任务再补 `PLAN.md`。
3. **代码反哺文档**：新约束、风险、决策写回 `openspec` 对应领域规范或 **`engineering-quality.md`**（风险/约定）/ **`engineering-system.md`**（栈、集成、目录）。
4. **文档是事实源**：优先以本目录与上述两篇工程文档的当前描述为准，再用代码验证。
5. **能验证才算完成**：在 `VERIFICATION.md` 中记录实际执行的检查，不得只声明「已完成」。

---

## 开发闭环（Agent / 人类通用）

1. **读取上下文**  
   `AGENTS.md` → `openspec/README.md`（本文件）→ **`engineering-quality.md`**（约定、风险、UI 壳层、测试）；栈/目录/集成见 **`engineering-system.md`**。排新任务前对照 **[`iteration-roadmap-2026.md`](./iteration-roadmap-2026.md)**（波次与依赖）。另读与任务相关的 `openspec/*.md` 及源码、测试。

2. **建立或确认规范**  
   新功能、重要修复、跨模块重构：在 `openspec/changes/<编号>-<名称>/` 创建 `SPEC.md`（自 `templates/SPEC.md` 拷贝）。简单局部改动可不建新目录，但须在 PR/回复中说明依据与验证方式。

3. **制定计划**  
   多文件、多阶段或高风险：补 `PLAN.md`；计划须含可执行验证点。

4. **执行实现**  
   动手前完成「修改合理性自审」（见下节）；发现规范错误时先改规范再写代码。

5. **验证与记录**  
   在 `VERIFICATION.md` 记录命令与结果；无法执行的项写明原因与剩余风险；新隐患更新 **`engineering-quality.md`** §2。

6. **同步文档**  
   完成后执行「代码-文档一致性检查」（见下节），更新受影响的 `openspec` 领域规范或 **`engineering-system.md` / `engineering-quality.md`**。

---

## 修改合理性自审（实现前）

- **必要性**：是否对应 `SPEC.md` 中的目标？是否在规范外「顺手优化」？
- **架构契合**：是否符合 **`engineering-system.md`** 中的分层与边界？
- **现有约定**：是否遵循 **`engineering-quality.md`** §1？
- **风险评估**：是否触及 **`engineering-quality.md`** §2 中的脆弱区域？
- **副作用**：同步、多端、离线、AI、音频等是否受影响？
- **可回滚**：能否快速回滚？是否需要迁移？
- **更简方案**：是否有更小、更局部的实现？

---

## 代码-文档一致性检查（提交或汇报前）

- [ ] 依赖变更 → **`engineering-system.md`** §6、`AGENTS.md` 是否同步？
- [ ] 新模块/目录 → **`engineering-system.md`** §4–§5、`AGENTS.md` 架构小节？
- [ ] 分层或数据流变化 → **`engineering-system.md`** §1–§3、**`engineering-quality.md`** §1？
- [ ] 外部服务 / 环境变量 → **`engineering-system.md`** §7、根 README？
- [ ] 新代码约定 → **`engineering-quality.md`** §1？
- [ ] 新技术债或风险 → **`engineering-quality.md`** §2？
- [ ] 用户可见行为变化 → 对应任务 `SPEC.md`、根 README、`openspec` 领域规范？
- [ ] 主导航 / Tab / 全屏栈 / 主屏纵向结构 → **`engineering-quality.md`** §3？
- [ ] 任务验收与 `VERIFICATION.md` 是否一致？

---

## 何时必须创建 `changes/` 任务

- 影响用户数据、同步、认证、AI、音频或云端存储  
- 修改 `store/`、`services/`、`lib/supabase.ts` 等共享逻辑  
- 新增依赖、迁移数据或改变接口契约  
- 改动超过约 3 个文件，或影响 Web / iOS / Android 多端  
- 修复曾误判的技术债（删除、同步、音频恢复等）

## 何时可轻量处理

- 文案、注释、README 小修；局部样式不改行为；单文件低风险 bugfix 且验证清晰。  
  仍须在回复中说明：**依据、范围、验证结果或未验证原因**。

---

## OpenSpec 工作流（领域规范层）

与任务目录互补：

1. **提案** — 描述规范或行为变更意图（可先落在 `changes/` 的 SPEC 或独立提案文档）。  
2. **审查** — 与审阅者/AI 对齐范围与验收。  
3. **实施** — 按 `SPEC`/`PLAN` 与领域规范改代码。  
4. **归档** — 合并后更新 `openspec` 中对应领域文档（如 `data-models.md`），使长期规范与代码一致。

---

## 与 AI 工具集成

在 Cursor 等环境中：开始任务前打开相关 `openspec/*.md` 与 `openspec/changes/.../SPEC.md`；提示中引用路径，便于生成符合分层与约定的代码。

---

## 更新和维护

- 领域规范（根下各 `*.md`）应与代码同步；任务文档在变更生命周期内保持准确。  
- 定期审查 **`engineering-quality.md`** §2 与任务 `VERIFICATION.md` 中的未验证项。
