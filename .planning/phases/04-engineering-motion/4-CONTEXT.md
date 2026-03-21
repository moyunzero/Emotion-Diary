# Phase 4: 工程与动效 - Context

**Gathered:** 2026-03-21  
**Status:** Discuss complete — aligned with `04-01`～`04-03-PLAN.md`  
**Discuss 说明:** 已按产品诉求 **扩展 Phase 4**：在原有回顾导出/趋势/动效之外，增加 **全仓增量代码优化**、**增量去冗余** 与 **项目文件格式/约定**（见 **04-03**）；仍 **禁止** 大爆炸重构与全仓库仅格式化巨型 diff。

<domain>
## Phase Boundary

本阶段交付：**（1）** **增量** 收敛回顾导出相关 **重复统计链**（**ENG-02** 子集）；**（2）** 补全回顾图 **月解决率趋势** 的 **可读性**（**EXPORT-04**）；**（3）** **动效/过渡审计** 与 **首批**小步修复（**ANIM-01**）；**（4）** 对 **现有代码库** 做 **可审计的增量优化与去冗余**，并 **更新项目结构/格式约定**（**ENG-02** 扩展 — **`04-03-PLAN`**：棕地清单、**`STRUCTURE.md`**、**`.editorconfig`**、跨目录 **≥6** 处实质优化）。

**不包含**：全仓库目录级「搬家」或一次性全量 Prettier；**新增** Reanimated 为硬依赖；PDF；App Store 元数据（Phase 5）；**合并** 洞察与回顾 **不同口径** 的统计逻辑；**无清单** 的重命名风暴。

</domain>

<gray_areas>
## Gray Areas Considered（已决默认）

| 灰区 | 选项 | **锁定默认** |
|------|------|----------------|
| 派生状态放哪一层 | 仅合并 `reviewExportClosingInput` vs Canvas+摘要同源 | **一次 `computeReviewExportDerivedState`，Screen 注入 Canvas**（与 `04-01` 一致） |
| 趋势图形态 | 柱 / 折 / 仅文字 | **保留 SVG 柱条**，补 **月份标签** + 去开发占位句；不强制改折线 |
| 动效「首批」改什么 | 大改焚烧 / 仅列表与滚动 | **列表与滚动微优化**（`keyboardShouldPersistTaps`、`removeClippedSubviews` 等），**不动** Skia 焚烧核心路径 |
| 审计文档放哪 | 根目录 vs 阶段目录 | **`.planning/phases/04-engineering-motion/ANIM-TRANSITION-AUDIT.md`** |
| 全仓优化粒度 | 只动导出 vs 棕地多模块 | **棕地多模块**：**`04-03`** 覆盖 `components/`、`utils/`、`hooks/`、`store/`、`app/`，**清单驱动 + 小步提交** |
| 优化包大小 | 1–2 文件 / 3–6 文件 / 7–12 文件 | **1–2 文件/次（保守小包）**，优先低风险可回滚 |

</gray_areas>

<decisions>
## Implementation Decisions

### 工程（ENG-02）

- **D-01**：新增 **`computeReviewExportDerivedState(...)`**（命名可调），串联 **`getReviewExportPeriods`**、**`compareResolutionToPreviousPeriod`**、**`getMonthlyResolutionRateSeries`**、**`getTopThreeWeatherBucketsByDays`**、**`getTopTriggersWithAdvice`**、**`calculateDaysAsOf`**；**`buildReviewExportClosingSummary`** 仅基于该结果映射 **`ReviewExportClosingSummary`**。  
- **D-02**：**`ReviewExportScreen`** **`useMemo`** 持有派生结果；**`ReviewExportCanvas`** 经 **props** 消费，**不再**内部重复 `useMemo` 整条统计链。  
- **D-03**：**不** 为「代码好看」合并 **`Insights/index.tsx`** 的 `stats` 单次遍历与回顾导出周期统计（**口径不同**）；若抽到 `utils/`，须 **命名区分** `insightsHomeStats` vs `reviewExportDerived`。

### 趋势（EXPORT-04）

- **D-04**：移除 **「数据已接入，样式可在后续版本美化」** 等 **开发向** 文案；替换为 **用户可读** 的月份/轴说明或一句产品向提示（**≤20 字** 级，具体见 `04-02`）。  
- **D-05**：图与 **`getMonthlyResolutionRateSeries`** 严格一致；**无** 装饰性假数据列。

### 动效（ANIM-01）

- **D-06**：**`ANIM-TRANSITION-AUDIT.md`** 覆盖 **≥4** 条路径，含 **洞察 Tab**、**回顾导出**、**EntryCard**、**根 Stack**。  
- **D-07**：首批 **≥2** 处改动须 **可 grep**；**禁止** 无清单的大范围动画重写。

### 全仓增量与格式（ENG-02 扩展 · 04-03）

- **D-08**：**`CODEBASE-OPTIMIZATION-AUDIT.md`** 为 **唯一** 认可的「全仓优化」 backlog 入口；执行项须 **可追溯** 到审计行或 PLAN 任务。  
- **D-09**：**`.editorconfig`** 与 **现有 `eslint.config.js` / Expo** 共存；**不** 以「格式统一」为由单次提交修改 **>15** 个无关文件。  
- **D-10**：**`STRUCTURE.md`** 必须写明 **新代码落点** 与 **历史债务**（大文件、重复动画）的 **记录方式**，不要求本阶段全部还清。  
- **D-11**：增量优化 **优先** 删冗余、抽纯函数、类型 import；**次选** 仅格式 —— 且格式改动须 **与逻辑改动同文件** 或 **单独小 PR**（由执行者选，须在审计中注明）。
- **D-12**：优化执行节奏采用 **1–2 文件/次** 的保守小包；每包必须有明确主题与回滚边界。  
- **D-13**：允许 **跨模块小迁移**（如 `components` → `utils` 的纯函数迁移），但必须同步补齐或更新相关测试。  
- **D-14**：每个优化小包合并前，最低验证为 **lint + 相关单测 + 关键路径一次手动检查**。  
- **D-15**：当优化与现有行为冲突时，遵循 **行为稳定优先**：宁可保留技术债，不引入用户可见行为偏差。

### Claude's Discretion

- 月份标签 **隔月显示 / 旋转 / 缩小字号** 防重叠。  
- **`ScreenContainer`** 是否增加 **`removeClippedSubviews`** 可选 prop（洞察页 **true**，他页默认 **false**）。  
- **`BUCKET_TO_MOOD`** 是否抽到独立 **`utils`** 文件。  
- **04-03** 具体选哪 6+ 处优化：以 **`CODEBASE-OPTIMIZATION-AUDIT.md`** 优先级为准。

</decisions>

<specifics>
## Specific Ideas

- 趋势区语气与 **2-UI-SPEC** 治愈系一致，**不** 出现内部迭代口吻（如「后续版本美化」）。  
- 审计表建议列 **优先级 P0–P2**，便于 Phase 5 前再扫尾。  
- 若 **`04-01`** 与 **`04-02`** 与本文冲突，以 **先更新 CONTEXT、再改 PLAN** 为准。

</specifics>

<canonical_refs>
## Canonical References

### 规划与需求

- `.planning/ROADMAP.md` — Phase 4 Goal、Success Criteria  
- `.planning/REQUIREMENTS.md` — ENG-02、ANIM-01、EXPORT-04  
- `.planning/PROJECT.md` — 增量工程、动效审计  

### 本阶段计划（执行顺序）

- `.planning/phases/04-engineering-motion/04-01-PLAN.md` — ENG-02（回顾导出派生单一来源）  
- `.planning/phases/04-engineering-motion/04-02-PLAN.md` — EXPORT-04、ANIM-01  
- `.planning/phases/04-engineering-motion/04-03-PLAN.md` — ENG-02（全仓增量优化 + 格式约定）  

### 上游契约与结构

- `.planning/phases/02-ui/2-UI-SPEC.md` — 趋势区 EXPORT-04  
- `.planning/codebase/STRUCTURE.md`  

### 实现前必读（代码）

- `utils/reviewExportClosingInput.ts`  
- `components/ReviewExport/ReviewExportCanvas.tsx`  
- `components/ReviewExport/ReviewExportScreen.tsx`  
- `components/ScreenContainer.tsx`（`ScrollView` 已有 `keyboardShouldPersistTaps`；洞察走此容器）  

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`getMonthlyResolutionRateSeries`** + **`ReviewExportCanvas`** 内 **SVG `Rect`** 柱图。  
- **`ScreenContainer`**：`scrollable` 时 **`ScrollView`** 已设 **`keyboardShouldPersistTaps="handled"`**；**`ReviewExportScreen`** 使用 **独立 `ScrollView`**，计划中对回顾页补同一 prop（见 `04-02`）。  

### Integration Points

- **`buildReviewExportClosingSummary`** 与 **Canvas** 内 **`useMemo`** 当前 **并行重复** — **`04-01`** 收敛为 **单一 `computeReviewExportDerivedState`**。  
- **洞察**：**`ScreenContainer scrollable`** — **`removeClippedSubviews`** 需 **可选透传** 或 **仅 Insights 开启**（见 `04-02`）。

### Established Patterns

- 根 **`Stack`** 已避免自定义转场以降低 native 风险（`_layout.tsx` 注释）。  
- **EntryCard**：**`LayoutAnimation`** + **焚烧** 走 **Skia**，**ANIM** 审计应 **记录**、本阶段 **不** 默认重写。

</code_context>

<deferred>
## Deferred Ideas

- **全量 Reanimated** 迁移、统一共享元素转场 — backlog / 后续版本。  
- **趋势图交互**（点按某月钻取）— 超出 EXPORT-04「可读性」范围。  
- **洞察与回顾** 完全同一套「月度」定义 — 产品未统一前 **不** 强合并。  
- **全仓库 Prettier + 目录大搬迁** — 与 Phase 4 **增量** 原则冲突；若要做，单独立里程碑。

</deferred>

---

*Phase: 04-engineering-motion*  
*Context gathered: 2026-03-21 (updated: 2026-03-21)*
