# Project Research Summary

**Project:** Emotion-Diary
**Domain:** v1.1 工程重构与代码治理（Expo React Native 增量棕地治理）
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

这是一个已经运行中的 Expo React Native 应用，不是从零搭建的新项目。专家实践表明，这类“治理型里程碑”最优解不是大爆炸重写，而是采用渐进式重构：先冻结关键业务口径与回归护栏，再进行结构拆分与目录治理，最后逐步收紧规则。核心目标应聚焦“可维护性与可持续迭代能力提升”，而不是新增业务功能。

推荐路径是在现有技术基座（Expo 54、RN 0.81、TypeScript、Jest、ESLint）上做小步增量：引入 `knip`（死代码/无效导出/无效依赖扫描）、`dependency-cruiser`（依赖边界校验）和 `eslint-plugin-boundaries`（开发期越界阻断）。架构上采用“Route Shell + Feature Screen + Store Slice + Shared Utilities”的双层策略，做到对外 API 尽量稳定、对内逐步解耦。

主要风险是行为漂移与误删：大文件硬拆可能改变副作用时序，目录迁移可能引入循环依赖，静态扫描可能误删动态引用。缓解策略是“先边界后迁移、先纯函数后结构、先 report-only 后 CI 阻断”，并强制双端 smoke 与关键路径契约测试（统计口径、导出链路、同步与账号切换）。

## Key Findings

### Recommended Stack

本里程碑不建议迁移运行时与测试框架，继续使用当前 Expo/RN/Jest/ESLint 基座，避免治理任务被大迁移稀释。真正需要的增量是工程治理工具链，以可观测、可回滚、可逐步收紧的方式落地。

**Core technologies:**
- `knip`：死代码/未使用导出/未使用依赖扫描 — 覆盖面更全，适合作为治理前置盘点与清理基线。
- `dependency-cruiser`：依赖规则与结构可视化 — 将目录边界转成可执行规则，防止重构后反弹。
- `eslint-plugin-boundaries`：开发期 import 边界约束 — 在本地与 CI 提前反馈越界问题，降低后置返工。

### Expected Features

v1.1 的特征是“工程治理能力交付”，不是产品能力扩张。必须优先交付能直接降低重构风险、提升维护效率的能力。

**Must have (table stakes):**
- 超大文件拆分（`app/profile.tsx`、`store/useAppStore.ts` 等）— 降低单点复杂度与改动冲击面。
- 目录边界治理（feature/shared 分层归位）— 控制耦合，减少跨层依赖蔓延。
- 重复逻辑收敛（时间、校验、统计辅助）— 消除多处实现导致的语义漂移。
- 死代码与无效导出清理 — 降噪并减少误导性依赖。
- 测试治理（删低价值、保关键路径、补重构护栏）— 提供可持续重构安全网。
- 结构与规范基线（`STRUCTURE.md`、命名与编辑器约定）— 防止治理后快速回退到混乱。

**Should have (competitive):**
- 治理任务清单化 + 风险分级（每项含改动范围/回滚点/验证点）。
- 变更影响面地图（依赖与调用链可视化）提升协作与审查质量。
- 最小 CI 门禁（类型、lint、关键测试）与渐进式 PR 模板（目的/风险/验证/回滚）。

**Defer (v2+):**
- 全量测试框架迁移（如 Jest -> Vitest）。
- 引入 Nx/Turborepo 等重型工程化改造。
- 新增业务功能模块或大规模 UI 改版。
- 以 100% 覆盖率作为阶段目标。

### Architecture Approach

推荐架构是“外层按 feature 分区，内层保持稳定实现逐步迁移”。`app/*` 保持路由壳层，业务下沉 `features/*`；`store/useAppStore` 对外保持门面稳定，对内切为 `auth/entries/sync/weather/ai` 等 slices；共享逻辑统一到 `shared/*` 并给过渡兼容导出；测试按 `features/store/shared/integration` 同构重排。该策略可确保每步变更可独立合并、独立回滚。

**Major components:**
1. `app/*` 路由壳层 — 只负责页面挂载与参数注入。
2. `features/*` 业务模块层 — 承载页面与组件实现（profile/entries/insights）。
3. `store/index + store/slices/*` 状态层 — 对外稳定 API、对内职责切片。
4. `shared/*` 共享能力层 — 纯函数、校验、格式化、错误映射统一入口。
5. `lib/*` 基础设施适配层 — 第三方 SDK 封装（如 Supabase）。

### Critical Pitfalls

1. **大文件硬拆导致行为漂移** — 先冻结口径与黄金样本，再按职责小步拆分，避免副作用时序变化。
2. **目录先迁移后治依赖引发循环** — 先定义并启用边界规则，再分批迁移路径与引用。
3. **死代码清理误删动态/平台引用** — 建立白名单并做 iOS/Android 双端 smoke 验证。
4. **测试清理误删重构护栏** — 先定义必须保留清单，优先行为断言替代脆弱快照。
5. **共享工具“合并”时语义被偷换** — 先做兼容 wrapper 与边界 case，再逐步收敛调用方。

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: 基线冻结与治理脚手架
**Rationale:** 先建立“可测、可控、可回滚”基础，再进入结构变更，避免盲拆。  
**Delivers:** 指标黄金样本、关键路径契约测试、`knip/depcruise/boundaries` report-only 配置、最小 CI 门禁草案。  
**Addresses:** 结构规范基线、测试治理前置、治理任务清单化。  
**Avoids:** 先重构后补测试、误删与口径漂移。

### Phase 2: 低风险收敛（shared 纯函数 + 重复逻辑治理）
**Rationale:** 先处理低耦合区域，快速降噪并验证治理方式可行。  
**Delivers:** `shared/validation`、`shared/format`、`shared/errors` 单一来源；页面内重复逻辑替换。  
**Uses:** 现有 TS/Jest/ESLint 基座，不引入运行时迁移。  
**Implements:** shared 组件边界与兼容导出过渡策略。

### Phase 3: 高价值结构重构（Profile 与 Store 切片）
**Rationale:** 在已有护栏与共享能力稳定后，推进最大收益的复杂区改造。  
**Delivers:** `app/profile.tsx` 壳层化、`features/profile` 落位、`auth/sync/entries` slices 组合、外部 API 兼容。  
**Addresses:** 超大文件拆分、目录边界治理核心部分。  
**Avoids:** 一次性重命名 action、目录与逻辑同时大改。

### Phase 4: 目录依赖治理与死代码清理
**Rationale:** 结构趋稳后再做路径收口与批量清理，降低误删风险。  
**Delivers:** 边界规则从 warning 逐步收紧、循环依赖修复、死代码分级清理（确定可删/需验证/暂缓）。  
**Uses:** `dependency-cruiser` + `eslint-plugin-boundaries` + `knip`。  
**Avoids:** 循环依赖反弹、动态引用误删、单平台验证即合并。

### Phase 5: 测试组合优化与治理收口
**Rationale:** 在结构与依赖稳定后做测试去冗余，确保长期迭代效率。  
**Delivers:** 测试同构重排、关键路径保留清单落地、CI 分层执行（PR/夜间）、迁移兼容出口清理。  
**Addresses:** 测试治理、规范固化、长期可维护性。  
**Avoids:** 只删测试不补护栏、CI 抖动掩盖风险。

### Phase Ordering Rationale

- 顺序遵循“先护栏、再低风险、后高收益、最后收口”的依赖关系，确保每步可独立验证。
- 分组遵循架构边界：shared 先行，feature/store 后行，目录与测试最终对齐，减少交叉返工。
- 风险控制遵循渐进收紧：工具先报告后阻断、规则先 warning 后 error、清理先分级后删除。

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3（Store 切片 + 同步并发）:** 涉及 `syncToCloud/syncFromCloud` 锁语义与 `firstEntryDate` 多源合并，需专门验证迁移策略。
- **Phase 4（死代码清理）:** 动态 import、平台分支、feature flag 场景需细化白名单与验证策略。
- **Phase 5（CI 分层与性能）:** 需结合仓库现状确定 `maxWorkers`、分层测试时长与稳定性阈值。

Phases with standard patterns (skip research-phase):
- **Phase 1（基线与脚手架）:** 模式成熟，主要是工程流程配置与门禁编排。
- **Phase 2（shared 收敛）:** 以纯函数替换为主，技术路径明确、风险可控。

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 以官方文档与 npm 现状为主，增量方案与里程碑边界一致。 |
| Features | HIGH | 来源于项目内规划文档（PROJECT/ROADMAP）与当前治理目标，约束清晰。 |
| Architecture | HIGH | 基于仓内现状（大文件、store 集中）给出渐进方案，兼顾兼容性与可回滚。 |
| Pitfalls | MEDIUM-HIGH | 关键风险有官方依据；部分社区案例仅作趋势参考，需执行期复核。 |

**Overall confidence:** HIGH

### Gaps to Address

- **动态引用清单不完整：** 需要在执行前梳理字符串注册、平台分支与 feature flag 使用点，形成删除白名单。
- **关键路径测试覆盖的“当前基线”未量化：** 需在 Phase 1 输出明确用例清单与覆盖范围基准。
- **目录边界最终规则粒度待定：** 需结合实际 import 图确定哪些规则先 warning、哪些可直接 error。
- **性能回归基线缺失：** 需补关键页面 release 模式前后对比指标，避免重构带来隐性卡顿。

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — 治理增量栈建议（`knip`、`dependency-cruiser`、`eslint-plugin-boundaries`）与落地顺序。
- `.planning/research/FEATURES.md` — table stakes、differentiators、anti-features 与依赖关系。
- `.planning/research/ARCHITECTURE.md` — 渐进式架构拆分策略、组件边界、可执行 build order。
- Expo tree-shaking 官方文档 — 动态引用与清理风险边界。
- React Native performance 官方文档 — 重构期性能回归识别与治理原则。
- Jest 官方配置文档（`maxWorkers`、`bail`）— CI 稳定性与执行策略依据。

### Secondary (MEDIUM confidence)
- dependency-cruiser releases 与工程实践资料 — 边界治理落地经验。
- React Native monorepo/工程治理实践文章（Callstack 等）— 迁移顺序与组织方式参考。

### Tertiary (LOW confidence)
- 社区重构/测试稳定性个案文章 — 可作为启发，不应直接视为本仓结论，需在执行中验证。

---
*Research completed: 2026-03-21*  
*Ready for roadmap: yes*
