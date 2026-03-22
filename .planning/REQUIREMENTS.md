# Requirements: 焚语（v1.1 工程重构与代码治理）

**Defined:** 2026-03-21  
**Core Value:** 用户能把陪伴时间与情绪变化变成可保存到相册的一张图（不因工程治理而损害现有核心体验）。

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

- [ ] **TST-01**: 删除示例/低价值/重复测试，保留并补齐关键路径测试集。
- [ ] **TST-02**: 测试目录与代码边界对齐（feature/store/shared/integration），可快速定位责任模块。
- [ ] **TST-03**: CI 采用分层策略（基础门禁 + 进阶门禁），在稳定性和速度间取得平衡。

## v2 Requirements

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
| TST-01 | Phase 10 | Pending |
| TST-02 | Phase 10 | Pending |
| TST-03 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after milestone v1.1 roadmap creation (Phase 6-10 mapped)*
