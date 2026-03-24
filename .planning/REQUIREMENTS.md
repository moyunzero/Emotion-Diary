# Requirements: 心晴MO / 焚语（v1.2 已完成 · v1.3 活跃）

**Defined:** 2026-03-21（v1.1）· 2026-03-22（v1.2）· 2026-03-24（v1.3）  
**Core Value:** 用户能把陪伴时间与情绪变化变成可保存到相册的一张图；v1.3 在 **不改变代码行为** 前提下完成 README、文档与 App 上架元数据对齐。

## v1 Requirements

Requirements for milestone v1.1. Focus on engineering governance, maintainability, and safe refactor.

### 治理基线与门禁

- [x] **GOV-01**: 项目建立治理脚手架（结构规范、检查命令、执行说明），并可在本地一键运行。
- [x] **GOV-02**: 规则收紧采用渐进策略（report/warn -> error），并在文档中明确阶段切换条件。
- [x] **GOV-03**: 为关键路径建立“重构前后行为一致”的验收护栏（至少覆盖记录、导出、同步核心流）。

### 重复逻辑收敛（Shared 单一来源）

- [x] **SHR-01**: 响应式/时间区间/通用格式化等重复逻辑收敛到单一来源，旧入口保留可迁移兼容层。
- [x] **SHR-02**: 组件内重复计算迁移到纯函数模块后，业务行为与显示结果保持一致。
- [x] **SHR-03**: 收敛后的 shared 模块具备基础单元测试，覆盖关键边界输入。

### 大文件拆分与结构重构

- [x] **ARC-01**: `app/profile.tsx` 拆分为路由壳层 + feature 模块，降低单文件复杂度且不改变用户可见行为。
- [x] **ARC-02**: `store/useAppStore.ts` 完成 slice 化（至少完成首批核心切片），对外 API 保持兼容。
- [x] **ARC-03**: 500+ 行核心组件按职责拆分（视图、逻辑、纯函数）并通过回归验证。

### 目录边界治理与冗余清理

- [x] **CLN-01**: 建立目录边界规则并执行依赖检查，避免新增跨层耦合与循环依赖。
- [x] **CLN-02**: 删除高置信死代码（未使用导出、废弃 hook/工具、示例脚手架），并保留删除证据与回滚点。
- [x] **CLN-03**: 清理后通过双端 smoke 与关键路径验证，确保无动态引用误删。

### 测试治理与 CI 收口

- [x] **TST-01**: 删除示例/低价值/重复测试，保留并补齐关键路径测试集。
- [x] **TST-02**: 测试目录与代码边界对齐（feature/store/shared/integration），可快速定位责任模块。
- [x] **TST-03**: CI 采用分层策略（基础门禁 + 进阶门禁），在稳定性和速度间取得平衡。

## v1.2 Requirements（GitHub 开源就绪与产品体验精炼）

**Defined:** 2026-03-22

### GitHub 与仓库卫生（GH）

- [ ] **GH-01**: README 对开源访客说明：项目是什么、如何安装运行、脚本矩阵、默认分支与 CI 状态；LICENSE / SECURITY 或等价说明就位。
- [ ] **GH-02**: 无密钥与私有 URL 进入版本库；`.gitignore` 覆盖常见泄漏路径；必要时提供 `git-secrets` / 人工清单结果。
- [ ] **GH-03**: 贡献与行为准则可选但推荐（CONTRIBUTING / CODE_OF_CONDUCT 或 README 章节），与项目实际流程一致。

### 集成与可复现（INT）

- [ ] **INT-01**: 新克隆仓库按文档可完成安装与 `typecheck` / `lint` / `test:ci`（或文档声明的最低集）无额外隐式步骤。
- [ ] **INT-02**: 环境变量：`.env.example`（或等价）与代码中 `process.env` / Expo 配置引用一致，并说明 Groq/Supabase 等可选性。
- [ ] **INT-03**: 锁文件与包管理器约定在 README 中写明（避免 npm/yarn/bun 混用未说明）。

### 代码健康与冗余（QA）

- [ ] **QA-01**: knip（及既有治理脚本）无未解释的新增高置信死代码；或增量记入允许清单并附理由。
- [ ] **QA-02**: 临时代码、调试残留、明显无效分支或注释块清理；与「集成仍成功」验收一致。

### 测试集精炼（TST2）

- [ ] **TST2-01**: **删除**已识别的示例、重复、无断言或长期跳过的测试文件；**不得**删除仍被 CI/关键路径依赖的测试；删除清单可审计。
- [ ] **TST2-02**: 剩余测试布局符合 RN/Jest 与仓库约定，README 或 `docs/` 中可索引。

### React Native / Expo 约定（RN）

- [x] **RN-01**: `app.json` / `metro` / `babel` / `tsconfig` 与当前 Expo SDK 推荐实践核对；偏差写入 README 或 `.planning/codebase/`。
- [x] **RN-02**: 入口与路由（Expo Router）目录约定与命名在贡献文档中可查找。

### 单文件体量（SIZE）

- [ ] **SIZE-01**: 建立单文件行数阈值（建议 **400～500 行** 为警告、**800 行** 为硬上限候选）；产出超标清单并按 Phase 分批拆分，不一次性大爆炸。

### 中文注释（DOC）

- [x] **DOC-01**: 对 `store` 核心切片、`features` 主流程（记录/导出/同步）、非显而易见的算法与副作用处补充 **中文** 注释或模块头说明；英文专有名词可保留。

### UI 与非模版化（UI）

- [x] **UI-01**: 完成 UI 方向审计：拒绝「通用 AI 产品」模版感；更新或新增 `UI-SPEC` / 设计原则段落（治愈、手帐/气象隐喻、留白与字体层级）。
- [x] **UI-02**: 关键路径（首页、记录、洞察、导出、个人）**抽检**：对比原则做通过/待改进列表，待改进项进入后续 plan 或 backlog。

## v1.3 Requirements（文档与元数据对齐）

**Defined:** 2026-03-24

### 文档与元数据（DOC-META）

- [ ] **DOC-META-01**: README.md 与当前代码一致：应用名称（心晴MO / 焚语）明确、功能列表与实现对齐、项目结构与 `app/`、`components/`、`features/` 等目录实际结构一致、技术栈版本与 `package.json` 一致。
- [ ] **DOC-META-02**: README.en.md 与 README.md 结构对应、品牌与功能描述一致；CONTRIBUTING、SECURITY 等引用的脚本与路径正确。
- [ ] **DOC-META-03**: App 上架元数据（app-description-zh、app-description-en、screenshot-guide）明确 心晴MO（应用名/设备名）与 焚语（品牌/产品名）的用法；提审资料引用的流程与页面与代码一致。
- [ ] **DOC-META-04**: preflight-checklist、review-response 等提审文档与当前命名、2.3.8/2.1a 回复模板、登录说明一致；提审资料清单可交叉核对。

## v2 Requirements（未来）

Deferred to future milestone.

### 工程化增强（后置）

- **ENGX-01**: 重型工程迁移评估（如测试框架迁移、工作区编排工具）形成决策文档后再执行。
- **ENGX-02**: 覆盖率提升专项（在关键路径稳定后逐步扩展，而非当前里程碑目标）。

## Out of Scope

| Feature | Reason |
|---------|--------|
| 新增业务功能模块 | v1.1 聚焦工程治理，不扩张产品范围 |
| 一次性全仓大爆炸重构 | 风险不可控，违背可回滚原则 |
| 重型框架/工具链迁移（Nx/Turborepo、测试框架整体迁移） | 成本高且偏离本里程碑主目标 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GOV-01 | Phase 6 | Complete |
| GOV-02 | Phase 6 | Complete |
| GOV-03 | Phase 6 | Complete |
| SHR-01 | Phase 7 | Complete |
| SHR-02 | Phase 7 | Complete |
| SHR-03 | Phase 7 | Complete |
| ARC-01 | Phase 8 | Complete |
| ARC-02 | Phase 8 | Complete |
| ARC-03 | Phase 8 | Complete |
| CLN-01 | Phase 9 | Complete |
| CLN-02 | Phase 9 | Complete |
| CLN-03 | Phase 9 | Complete |
| TST-01 | Phase 10 | Complete |
| TST-02 | Phase 10 | Complete |
| TST-03 | Phase 10 | Complete |
| GH-01 | Phase 11 | Pending |
| GH-02 | Phase 11 | Pending |
| GH-03 | Phase 11 | Pending |
| INT-01 | Phase 11 | Pending |
| INT-02 | Phase 11 | Pending |
| INT-03 | Phase 11 | Pending |
| QA-01 | Phase 12 | Pending |
| QA-02 | Phase 12 | Pending |
| TST2-01 | Phase 12 | Pending |
| TST2-02 | Phase 12 | Pending |
| SIZE-01 | Phase 12 | Pending |
| RN-01 | Phase 13 | Complete |
| RN-02 | Phase 13 | Complete |
| DOC-01 | Phase 13 | Complete |
| UI-01 | Phase 14 | Complete |
| UI-02 | Phase 14 | Complete |
| DOC-META-01 | Phase 16 | Pending |
| DOC-META-02 | Phase 16 | Pending |
| DOC-META-03 | Phase 16 | Pending |
| DOC-META-04 | Phase 16 | Pending |

**Coverage:**
- v1.1 requirements: 15 total — mapped Phases 6–10 ✓  
- v1.2 requirements: 17 total — mapped Phases 11–14 ✓  
- v1.3 requirements: 4 total — mapped Phase 16 ✓

---
*Requirements defined: 2026-03-21 (v1.1), 2026-03-22 (v1.2), 2026-03-24 (v1.3)*  
*Last updated: 2026-03-24 — Milestone v1.3 文档与元数据对齐*
