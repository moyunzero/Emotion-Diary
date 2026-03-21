# Technology Stack（v1.1 工程重构与代码治理）

**Project:** Emotion-Diary（Expo React Native）  
**Milestone:** v1.1 工程重构与代码治理  
**Researched:** 2026-03-21

## 推荐增量栈（只覆盖本里程碑）

### Core Governance（新增）

| Technology | Version（practical/current） | Purpose | Why |
|------------|-------------------------------|---------|-----|
| `knip` | `^5.88.0` | 死代码/未使用导出/未使用依赖扫描 | 比 `ts-prune` 覆盖面更全（文件+导出+依赖），且活跃维护；适合“死代码清理 + test dedup 前置盘点” |
| `dependency-cruiser` | `^17.3.9` | 目录重构后的依赖边界校验与可视化 | 直接把“目录边界”变成可执行规则，避免重构后回到跨层互引 |
| `eslint-plugin-boundaries` | `^6.0.0` | 在开发期实时阻断越界 import | 与现有 ESLint 9/Expo lint 流程兼容，反馈更早（编辑期/CI） |

### Existing Stack（保持不变，不做迁移）

| Area | Current | Decision |
|------|---------|----------|
| Runtime | Expo `~54.0.30`, React Native `0.81.5` | 保持不变（本里程碑只做工程治理） |
| Language | TypeScript `~5.9.2` strict | 保持不变（治理规则基于现有 TS） |
| Test Runner | Jest `^30.2.0` + RTL + fast-check | 保持不变（做“测试去重”，不做测试框架迁移） |
| Lint Base | ESLint `^9.25.0` + `eslint-config-expo` | 保持不变，仅增量插件 |

## 集成点（Integration Points）

### 1) `knip`：死代码清理基线

- 在 `package.json` 新增脚本：`"lint:deadcode": "knip"`  
- 新建 `knip.json`（或 `knip.config.ts`）只扫描治理范围：`app/ components/ store/ utils/ lib/ services/ types/`
- 先以 **report-only** 运行 1-2 轮，整理白名单后再逐步收紧
- CI 初期策略：允许警告（不阻断），第 2 轮再升级为阻断

**对目标的直接价值：**
- dead code cleanup：识别未引用文件/导出/依赖
- test dedup：识别“测试专用但未被入口引用”的残留文件

### 2) `dependency-cruiser`：目录重构护栏

- 新建 `.dependency-cruiser.cjs`，定义分层规则（示例）：
  - `app/*` 可依赖 `features/*`、`shared/*`
  - `features/*` 禁止互相横向直连（通过 `shared`/`domain` 抽象）
  - `shared/*` 禁止依赖 `features/*`
- 新增脚本：
  - `"arch:check": "depcruise --config .dependency-cruiser.cjs ."`
  - `"arch:graph": "depcruise --config .dependency-cruiser.cjs --output-type err-long ."`
- 在“目录重构 PR”中先跑可视化报告，再开启 CI 阻断

**对目标的直接价值：**
- directory refactor：保证新目录结构可持续，不被后续提交破坏

### 3) `eslint-plugin-boundaries`：日常开发即时反馈

- 在 ESLint 配置中定义 element 类型（`app` / `feature` / `shared` / `infra`）
- 规则重点只开 2-3 条高价值规则（避免一次性过严）：
  - 禁止 `shared -> feature`
  - 禁止跨 feature 直接 import
  - 限制 `app` 仅消费公开入口（barrel/feature public API）
- 先以 warning 落地，2 周后再考虑升级部分为 error

**对目标的直接价值：**
- large-file split + directory refactor：拆分后的新模块边界在提交阶段就被校验

## 不建议在本里程碑新增（What NOT to Add）

| Not Add | Why Not in v1.1 | Risk if Added Now |
|---------|------------------|-------------------|
| 全量迁移到 `Vitest` | 与当前 Jest 生态不一致，收益低于迁移成本 | 测试不稳定、迁移工期挤占重构主线 |
| 引入 `Nx/Turborepo` | 当前不是多包仓主矛盾 | 工程复杂度上升，治理目标被工具化改造稀释 |
| 引入重型静态分析平台（SonarQube 等） | 当前规模下投入产出低 | CI 时长/维护成本显著增加 |
| 全仓格式化/规则大爆炸（Biome+ESLint 迁移） | 与目录重构同期开大变更，风险过高 | 回归定位困难，回滚粒度变粗 |
| 继续使用 `ts-prune` 作为主工具 | 维护活跃度与能力范围不如 `knip` | 漏检未使用文件/依赖，治理结果不完整 |

## 落地顺序（最小风险）

1. **第 1 步：只加扫描，不阻断 CI**  
   - 引入 `knip` + `depcruise`，输出报告建立“现状基线”
2. **第 2 步：目录重构与大文件拆分并行推进**  
   - 边拆边用 `arch:check` 校验边界
3. **第 3 步：死代码与重复测试清理**  
   - 依据 `knip` 报告逐批删除；每批删除都跑 `test:ci`
4. **第 4 步：逐步收紧规则**  
   - warnings -> errors（先边界，再 dead code）

## 风险与回滚（必须显式）

### 风险

- **误删导出/文件**：静态分析可能误判“动态引用路径”
- **边界规则过严**：短期产生大量 lint 噪声，影响交付节奏
- **CI 时长上升**：新增扫描任务导致流水线变慢

### 回滚策略

- `knip` 回滚：
  - 先保留 report-only 脚本；若误报高，临时回退为“本地运行，不进 CI”
  - 删除或收窄 `knip` 配置，不影响运行时代码
- `dependency-cruiser` 回滚：
  - 只移除 `arch:check` CI 步骤，代码结构本身不受影响
  - 规则可按目录粒度关闭，不需要整体撤销
- `eslint-plugin-boundaries` 回滚：
  - 规则从 `error` 降回 `warn`，或只保留 1 条关键规则
  - 插件移除不影响业务逻辑，仅影响治理约束

## 推荐安装（for downstream）

```bash
# Governance additions
npm install -D knip dependency-cruiser eslint-plugin-boundaries
```

## Sources（with confidence）

- [Knip npm（v5.88.0）](https://www.npmjs.com/package/knip) — HIGH  
- [Knip 官方文档](https://knip.dev/) — HIGH  
- [dependency-cruiser npm（v17.3.9）](https://www.npmjs.com/package/dependency-cruiser) — HIGH  
- [dependency-cruiser releases](https://github.com/sverweij/dependency-cruiser/releases) — MEDIUM-HIGH  
- [eslint-plugin-boundaries npm（v6.0.0）](https://www.npmjs.com/package/eslint-plugin-boundaries) — HIGH  
- [ts-prune 仓库状态（maintenance/archived）](https://github.com/nadeesha/ts-prune) — MEDIUM（建议在落地前二次确认仓库最新状态）

## 结论（一句话）

本里程碑只需在现有 Expo/RN/Jest/ESLint 基座上，**增量引入 `knip + dependency-cruiser + eslint-plugin-boundaries`**，即可覆盖“大文件拆分、目录重构、死代码清理、测试去重”四类治理目标；其余重型迁移应明确后置。
