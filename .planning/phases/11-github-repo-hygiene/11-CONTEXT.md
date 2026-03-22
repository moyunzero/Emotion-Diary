# Phase 11: GitHub 仓库与可复现构建 - Context

**Gathered:** 2026-03-22  
**Status:** Ready for planning

<domain>
## Phase Boundary

在 Phase 10 已完成的前提下，将仓库推进到 **可安全公开 GitHub** 的基础状态：**文档完整、许可与安全说明就位、无密钥进库、新克隆可按文档完成安装并跑通承诺的最小校验集**（对应 GH-01～03、INT-01～03）。  
本阶段 **不** 扩张产品功能；超出边界的想法记入 deferred。

</domain>

<decisions>
## Implementation Decisions

### README 结构与开源访客路径（区域 1）

- **D-01:** 在 **主 README 靠前位置** 增加固定的「开发者快速上手」区块：克隆、`yarn install`、复制 `.env.example`、核心脚本（至少 `typecheck` / `lint` / `test:ci`，与 INT-01 对齐）、默认分支名、CI 行为摘要（PR vs push）及文档链接。
- **D-02:** **保留** 现有产品介绍与功能长文，放在快速上手之后或通过目录锚点组织；英文读者继续由 `README.en.md` 承担平行叙事（与现有徽章链一致）。
- **D-03:** 深度架构/流程以 **`openspec/`** 与 `.planning/codebase/` 为权威延伸，README 中用显式链接指向，避免在 README 内重复维护大段规格。

### 安全说明与断链修复（区域 2）

- **D-04:** **新增** 仓库根目录 `SECURITY.md`：支持版本范围、**如何负责任地报告漏洞**（优先 GitHub Security Advisories / Private vulnerability reporting，若已开启）、禁止在公开 Issue 贴密钥；语气与体量保持 **简短可执行**。
- **D-05:** README「安全性」小节 **保留简短摘要**，并 **正确链接** 至 `./SECURITY.md`（当前 README 已引用但文件缺失，属 Phase 11 必修复项）。
- **D-06:** `.github/SECURITY_CHECKLIST.md` 等 **维护者清单** 可与 `SECURITY.md` 并存：`SECURITY.md` 面向外部报告者；清单面向维护者自检（不在 D-04 中合并为一文件，除非 plan 执行时发现重复过高）。

### 贡献准则与行为准则（区域 3 / GH-03）

- **D-07:** 仓库 **已存在** `CONTRIBUTING.md` 与 `CODE_OF_CONDUCT.md` — **维持独立文件**，不在本阶段改为「仅 README 一章」。
- **D-08:** README 显著位置（快速上手区块附近）**增加指向** `CONTRIBUTING.md` 与 `CODE_OF_CONDUCT.md` 的链接；若已有分散提及，合并为 **一处主入口** 避免重复。
- **D-09:** `CONTRIBUTING.md` 中的命令与流程须与 **实际 CI**（`.github/workflows/ci.yml`）及 **包管理器约定**（Yarn + lockfile）一致；与 `openspec/` 的引用保留，但执行 plan 时 **逐条核对** 是否仍与当前脚本矩阵一致（例如是否仍写「仅 lint」而未写 `test:ci` / `typecheck`）。

### 最小校验集与 `typecheck`（区域 4 / INT-01）

- **D-10:** 在 `package.json` **新增** 脚本 `typecheck`，推荐实现为 `tsc --noEmit`（项目已 `extends: expo/tsconfig.base` + `strict: true`，与现有 `tsconfig.json` 对齐）。
- **D-11:** README（及 CONTRIBUTING 中若列出检查命令）将 **文档承诺的最小集** 明确为：`yarn typecheck`、`yarn lint`、`yarn test:ci`；与 ROADMAP 成功标准及 INT-01 表述一致。
- **D-12:** **不** 在 Phase 11 将 `verify:governance` / smoke 列为「新贡献者必读第一步」——仍作为 **push 门禁与进阶治理** 在 CI 说明中交代；避免开源访客被过长命令清单吓退（与 Phase 6 既有分工一致）。

### Claude's Discretion

- `SECURITY.md` 的具体段落标题与是否增加「披露时间线」示例：由执行 plan 按 GitHub 默认最佳实践微调，**不改变** D-04/D-05 的「必须有根目录 SECURITY + 修复 README 链」结果。
- README 锚点命名与目录排版：在满足 D-01～D-03 前提下由实现者选择最清晰的 Markdown 结构。

### Folded Todos

无（`gsd-tools todo match-phase 11` 无匹配项）。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 路线图与需求

- `.planning/ROADMAP.md` — Phase 11 目标、成功标准、依赖 Phase 10
- `.planning/REQUIREMENTS.md` — GH-01～03、INT-01～03 全文与追溯表
- `.planning/PROJECT.md` — v1.2 里程碑与非目标边界

### 仓库与集成现状

- `README.md` / `README.en.md` — 当前叙事、安全小节、快速开始
- `LICENSE` — 许可已存在
- `CONTRIBUTING.md` — Fork/PR、OpenSpec、当前列出的检查命令（待与 D-10/D-11 对齐）
- `CODE_OF_CONDUCT.md` — 行为准则已存在
- `.env.example` — 与 `EXPO_PUBLIC_*` 变量模板及注释
- `.github/workflows/ci.yml` — PR / push `master`、Node 20、yarn、lint、test:ci、governance、smoke
- `package.json` — scripts 矩阵（待增加 typecheck）

### 延伸规格（贡献者深度阅读）

- `openspec/README.md` — OpenSpec 入口
- `.planning/codebase/STACK.md` — 技术栈摘要（若 plan 需核对工具版本）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`：已具备 GH-03 基础，Phase 11 以 **链接、命令对齐、与 CI 一致** 为主，而非从零撰写。
- `.env.example`：已覆盖 Groq / Supabase / HF 等 `EXPO_PUBLIC_*`，与 INT-02 对齐成本低，plan 仅需 grep 核对代码中是否仍有未列出的公共 env。
- `scripts/verify-env-security.js` 等：可作为 GH-02 文档中「维护者可选」的引用，但不强加给首次克隆者。

### Established Patterns

- **包管理器**：CI 使用 `yarn install --frozen-lockfile`，INT-03 应在 README 明确 **Yarn 为官方路径**。
- **分支**：默认开发分支为 **`master`**（与 STATE / CI 一致），README 须避免仍写「main」或未说明。

### Integration Points

- README ↔ 根目录 `SECURITY.md`（待创建）↔ GitHub Security 功能配置（仓库设置层面，可在 plan 中 checklist）
- README / CONTRIBUTING ↔ `package.json` scripts（新增 `typecheck` 后统一曝光）

</code_context>

<specifics>
## Specific Ideas

用户在一次回复中选择 **讨论全部四项** 灰色地带；各区域采用会话中已声明的 **推荐默认**（主 README 前置开发者区块、根目录 SECURITY、保留现有 CONTRIBUTING/COC 并链出、`yarn typecheck` + 文档最小集）。

</specifics>

<deferred>
## Deferred Ideas

- **Phase 12+**：knip/死代码大扫、测试集再精炼、单文件拆分 — 不纳入 Phase 11。
- **git-secrets / 密钥扫描自动化**：GH-02 若需「人工清单或工具结果」，可在 plan 中单列任务；本 CONTEXT 不强制引入新工具链。

### Reviewed Todos (not folded)

无。

</deferred>

---

*Phase: 11-github-repo-hygiene*  
*Context gathered: 2026-03-22*
