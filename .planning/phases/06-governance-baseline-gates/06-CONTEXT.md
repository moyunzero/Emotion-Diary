# Phase 6: 治理基线与门禁 - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只交付工程治理基线与门禁（`GOV-01` ~ `GOV-03`）：建立可执行检查脚手架、定义 report/warn/error 渐进规则、锁定重构前后行为一致的关键路径护栏。

不新增产品功能，不做目录大搬迁，不处理 Phase 7+ 的结构重构执行细节。

</domain>

<decisions>
## Implementation Decisions

### 基线快照与验收护栏
- **D-01:** 关键路径最小集合锁定为：**记录 + 导出 + 同步**（不把 AI 与登录迁移纳入 Phase 6 必测主集）。
- **D-02:** 基线证据采用**混合模式**：手测脚本 + 少量自动化断言（避免纯手测不稳，也避免自动化过重拖慢阶段推进）。
- **D-03:** 导出链路一致性校验采用**结构化断言**（统计字段与关键文本一致），不依赖像素级图像快照。
- **D-04:** 基线产物统一落在 ` .planning/phases/06-governance-baseline-gates/ ` 下，便于审计与回溯。

### 工具接入顺序与范围
- **D-05:** 工具接入顺序固定为：`knip` -> `dependency-cruiser` -> `eslint-plugin-boundaries`。
- **D-06:** 初期覆盖目录为：`app/`、`components/`、`store/`、`utils/`、`hooks/`、`services/`、`lib/`（先不纳入 `ios/`、`android/`、文档目录）。
- **D-07:** 历史问题采用**基线快照 + allowlist**策略，只阻断新增问题，不要求 Phase 6 一次性清零历史包袱。
- **D-08:** 工具输出以“phase 文档下摘要 + CI 可复现命令”为准，不把完整大报告全部入库。

### 门禁策略（渐进收紧）
- **D-09:** Phase 6 默认门禁级别：**report 为主，关键项 warn**。
- **D-10:** 从 warn 升级到 error 的统一条件：**连续两轮 PR 新增违规 = 0** 才升级。
- **D-11:** 本里程碑内可升级到 error 的候选项：跨层越界 import、新增循环依赖、新增未使用导出。
- **D-12:** 门禁失败默认**阻断合并**，但允许通过“revert 当前包/临时降级规则并留痕”快速解锁流水线。

### 执行工作流与回滚原则
- **D-13:** 单个重构 PR 体量控制为**小步**（1-2 文件或同主题小范围）。
- **D-14:** 每个 PR 必须包含模板字段：目的、改动范围、风险、验证、回滚点。
- **D-15:** 每个包最低验证门槛固定：`lint + 相关测试 + 关键路径 smoke`。
- **D-16:** 发生行为偏差时遵循**行为稳定优先**：先回退该包并记录问题，禁止“先带病合并后修”。

### Claude's Discretion
- 治理命令命名与脚本组织（如 `verify:governance` / `verify:boundaries`）的具体命名可由实现阶段确定。
- 基线文档的表格字段（案例 ID、断言字段、证据链接）可按可读性微调。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 里程碑与阶段约束
- `.planning/ROADMAP.md` — Phase 6 目标、依赖与成功标准
- `.planning/REQUIREMENTS.md` — `GOV-01`、`GOV-02`、`GOV-03` 的原始约束
- `.planning/PROJECT.md` — 增量重构、可回滚、稳定性优先的里程碑原则

### 历史决策继承
- `.planning/phases/04-engineering-motion/4-CONTEXT.md` — 1-2 文件微包、审计驱动、行为稳定优先
- `.planning/phases/05-apple/05-CONTEXT.md` — 文档与清单驱动的执行方式（可迁移为治理文档流程）

### 代码结构与约定
- `.planning/codebase/STRUCTURE.md` — 当前目录边界、命名约定、Phase 4 的结构规则
- `.planning/codebase/CONVENTIONS.md` — Zustand 模块模式、错误处理、日志与 lint 约定
- `.planning/codebase/STACK.md` — Expo/RN/TS/Jest/ESLint 基座版本锚点

### 研究输入
- `.planning/research/SUMMARY.md` — v1.1 治理建议（工具链、阶段顺序、风险）
- `.planning/research/STACK.md` — 工具建议与接入风险
- `.planning/research/PITFALLS.md` — 误删/越界/行为漂移等典型风险及防护

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/verify-*.js`：已有“脚本化校验”模式，可复用于治理脚手架命令编排。
- `jest.config.js` / `jest.ci.config.js`：现成测试入口，可承接关键路径保护用例。
- `eslint.config.js`：已有 lint 基座，适合增量加入边界规则而非重建。

### Established Patterns
- 项目已采用“增量、小包、可回滚”策略（Phase 4/5 有明确证据）。
- TypeScript 严格模式与 `@/*` 别名已稳定，适合在不迁移框架前提下推进治理。

### Integration Points
- 治理脚手架命令应挂接 `package.json` scripts，并在 `.planning/phases/06-governance-baseline-gates/` 留存执行说明。
- 门禁升级策略需同时落在文档与 CI（本地/CI输出一致）以保证团队可感知。

</code_context>

<specifics>
## Specific Ideas

- 用户明确偏好：**渐进收紧**，不是一次性强硬门禁。
- 用户明确偏好：**行为稳定优先**，发现偏差先回退当前包。
- 用户明确偏好：PR 固定模板与小包推进，强调可审计、可复现、可回滚。

</specifics>

<deferred>
## Deferred Ideas

- 将 AI、登录迁移纳入 Phase 6 关键路径护栏（暂不纳入，后续按阶段需求再加）。
- 全仓（含 `ios/`、`android/`、文档）统一纳入治理规则（Phase 6 先不做）。
- 一次性切换到全 error 强阻断（保留为后续门禁成熟后再评估）。

</deferred>

---

*Phase: 06-governance-baseline-gates*
*Context gathered: 2026-03-21*
