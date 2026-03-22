# 焚语（Emotion-Diary）— GSD 工程

## What This Is

**焚语** 是一款治愈系情绪记录应用（Expo / React Native）：用「情绪气象站」「心灵花园」等隐喻帮助用户记录情绪、理解触发因素，并可选使用 AI 与云端同步。当前代码库已具备记录、洞察、焚烧、AI（Groq）、Supabase 同步与离线优先等能力（见 `.planning/codebase/`）。

**v1.1 工程重构与代码治理** 已收口（治理、shared、结构拆分、目录边界、测试/CI）。  
当前进入新里程碑：**v1.2 GitHub 开源就绪与产品体验精炼** — 面向公开仓库的 **可复现构建、无密钥泄漏、代码与测试集健康、RN/Expo 约定清晰、单文件可维护、核心逻辑中文注释、UI 拒绝通用模版感**；不改变「情绪记录 + 温柔回顾」核心叙事。

## Current Milestone: v1.2 GitHub 开源就绪与产品体验精炼

**Goal:** 仓库达到可安全公开 GitHub 的标准，并在外观与可维护性上更贴近产品调性（非模版化、温柔治愈语境）。

**Target features:**

- 开源卫生：README / 许可与安全说明、`.gitignore`、无密钥、CI 与分支说明  
- 集成可复现：依赖与脚本一致、环境变量模板与文档对齐  
- 代码健康：死代码与无效路径清理；**精简测试集**（删示例/重复/无断言类），保留关键路径与门禁  
- RN/Expo 约定核对与文档化；**单文件行数**超阈清单与分批拆分  
- 核心链路 **中文注释** 补强  
- **UI**：审计并强化差异化（拒绝「通用 AI 应用」模版感）

## Core Value

**用户能把「被陪伴的时间」和「情绪变化」变成可保存到相册的一张图**——缓解「数据只在手机里」的焦虑，同时保持温柔、非官腔的调性（v1 应用内 **仅保存到相册**，不接入系统分享/第三方；用户可从相册自行转发）。

## Requirements

### Validated

以下能力已在现有代码库中落地（棕地推断，详见 `.planning/codebase/ARCHITECTURE.md`、`STACK.md` 与 `README.md`）。

- ✓ 多级情绪记录、期限、人物/触发器标签、草稿与编辑历史 — existing
- ✓ 「情绪气象站」与天气隐喻、洞察页（花园/治愈进度等）— existing
- ✓ 气话焚烧与 Skia 动效 — existing
- ✓ AI：情绪预测、播客式文案等（Groq）— existing
- ✓ 离线优先本地存储 + 可选 Supabase 同步与账号 — existing
- ✓ 访客与登录用户数据迁移路径 — existing
- ✓ 工程化基础：TypeScript 严格模式、Zustand 模块化 store、Jest 与覆盖率门槛 — existing
- ✓ **Apple App Store 提审闭环（IOS-01）**：中英文元数据、截图指引、预检清单、4.3(a) 回复模板与需求追踪已收口 — Validated in Phase 05 (apple)
- ✓ **治理基线门禁（GOV-01/GOV-02/GOV-03）**：统一治理入口、渐进式门禁收紧、关键路径烟雾验证与验收模板已建立 — Validated in Phase 06 (governance-baseline-gates)
- ✓ **Shared 重复逻辑收敛（SHR-01/SHR-02/SHR-03）**：formatting/time-range/responsive 已建立单一来源与兼容层迁移路径，关键页面最小回归与边界测试已接入 — Validated in Phase 07 (shared)
- ✓ **大文件拆分治理（ARC-01/02/03）**：profile 壳层化与 features/profile 三区、entries slice 落位、EditEntryModal 目录化与 @/components/entries 出口 — Validated in Phase 08 (structure-refactor)
- ✓ **目录边界治理与冗余清理（CLN-01/02/03）**：features/shared 纳入治理 scope、三项门禁升 error、responsiveUtils/dateUtils/reviewStatsTimeRange deprecated 清零 — Validated in Phase 09 (dir-boundary-cleanup)
- ✓ **测试治理与 CI 收口（TST-01/02/03）**：示例与重复单测清理、`unit` 目录与源码边界对齐、GitHub Actions 分层门禁与 Node 20 锁定 — Validated in Phase 10 (ci)
- ✓ **GitHub 仓库卫生与可复现构建（GH-01～03, INT-01～03）**：根目录 `SECURITY.md`、`yarn typecheck` 与 CI 对齐、README/CONTRIBUTING/README.en 开发者路径、`.env.example` 与代码一致、GH-02 密钥扫描记录 — Validated in Phase 11 (github-repo-hygiene)
- ✓ **代码健康、测试精炼与单文件体量（QA-01/02, TST2-01/02, SIZE-01）**：knip 基线快照、`useAppStore` 诊断日志收敛、`createUserSlice` 拆分、`12-SIZE-OVERVIEW` / 测试删除审计表、CONTRIBUTING 测试布局索引 — Validated in Phase 12 (code-health-tests-size)
- ✓ **RN/Expo 约定与中文注释（RN-01/02, DOC-01）**：`EXPO-RN-AUDIT` / `EXPO-ROUTER`、STACK 与 CONTRIBUTING 索引、store 与记录/导出路径中文注释 — Validated in Phase 13 (rn-expo)

### Active（v1.2）

见 `.planning/REQUIREMENTS.md` **v1.2** 章节（GH / INT / QA / TST / RN / SIZE / DOC / UI）。摘要：GitHub 文档与密钥卫生、集成与 env 可复现、死代码与测试集精炼（**保留关键路径与 CI 所需测试**）、RN 标准核对、大单文件拆分、中文注释、非模版化 UI 方向与抽检。

### Out of Scope（v1.2）

- **大范围新功能**：仍以开源就绪与体验精炼为主，不引入新业务能力面。
- **删除全部自动化测试**：与 CI/治理冲突；仅允许删除已识别的低价值/重复/示例测试。

### Out of Scope（历史 v1.1）

- **新增产品功能扩张**（如新业务模块、大范围 UI 改版）：v1.1 以工程治理为主，不引入额外产品范围。
- **一次性全仓大爆炸迁移**：采用增量式重构与分批 PR，确保可验证、可回滚。
- **变更核心用户价值叙事**：继续保持“情绪记录 + 温柔回顾”主线，不在本轮改动产品定位。

## 导出版式契约（图片 v1）

**总体**：一张图内信息层次清晰，适合 **保存到相册** 与回顾；语气 **像朋友 / 树洞 / 温柔姐姐**，避免客服腔（v1 不内置「分享到微信」等入口）。

1. **页眉**  
   - 用户选择的 **时间范围**（例：`2025年3月1日～3月31日`）  
   - **陪伴焚语第 N 天**（与现有「陪伴天数」逻辑一致，如 `firstEntryDate` / companion days）

2. **本期解决与记录**  
   - **大数字**：本期情绪解决率（%），并展示 **相对上期变化**（例：`本月解决率 68%（↑12% vs 上月）`）  
   - **小字**：本期共记录 X 笔，已和解 Y 笔  

3. **趋势（可选 v1）**  
   - **折线图或柱状图**：解决率 **月趋势**（若实现成本过高，可先占位或 Phase 再补，但在架构上预留数据接口）

4. **本期情绪气象站 Top 天气**  
   - 展示出现最多的 **3 种**天气档位（与现有「晴/多云/雨/雷暴」等映射一致）  
   - 每种：**图标 + 出现天数**（例：晴朗 18 天 / 有雨 9 天 / 暴风雨 4 天）

5. **Top 3 情绪触发器 + 园艺小建议**  
   - 与现有洞察/园艺文案风格一致，**短、可扫读**

6. **一句话 AI 温柔总结**  
   - 全图最有分享欲的收尾；需 **温柔、具体、不空洞**（示例语气）：  
     > 「这个月你陪着自己走过 9 次暴风雨，也让 29 朵情绪小花盛开。你真的很努力，焚语一直都在。」  
   - 需 **无 Key / 失败时的兜底文案**（避免空白或报错打断导出）

## Context

- 用户明确 **主轴为工程质量**，同时强需求为 **可带走的回顾图**，以缓解数据焦虑并支撑上架叙事。  
- 已有代码库映射：`.planning/codebase/`。  
- 技术线索：聚合数据来自 `MoodEntry` 与现有天气/触发器统计；截图导出可走 **`react-native-view-shot`**；AI 可走 **`utils/aiService.ts` / Groq**，须注意速率与离线。

## Constraints

- **Tech**：保持 Expo SDK 54 / RN 0.81 栈，不引入与维护成本不匹配的重依赖。  
- **Privacy**：导出即用户主动将情绪内容带出设备，需在 UI 与隐私说明中 **明确提示风险**（与 App Store 任务绑定）。  
- **Performance**：图片生成路径须避免阻塞主线程过久；大数据量月份需有降级策略（如简化图表）。  
- **Tone**：AI 与固定文案均需 **非官方、可共读** 的温柔语气（用户明确排斥官腔）。

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 导出 **先图片、后 PDF** | 用户最易感知、工程迭代更快 | — Pending |
| 回顾内容以 **周/月 + 陪伴天数 + 解决率/趋势 + Top 天气/触发器 + 一句 AI** 为 v1 契约 | 用户已给出可执行的版式与示例 | — Pending |
| AI 总结需 **失败兜底** | 避免无 Key 或网络失败时导出残缺 | — Pending |
| 工程治理按“先低风险清理，再结构重构”推进 | 先降噪再重构，降低回归风险 | — Pending |
| 大文件拆分按 feature 边界而非技术类型硬切 | 减少跨模块耦合，提升可维护性 | — Pending |
| 测试采用“删示例、并重复、保关键路径”策略 | 同时降低维护成本与重构风险 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason  
2. Requirements validated? → Move to Validated with phase reference  
3. New requirements emerged? → Add to Active  
4. Decisions to log? → Add to Key Decisions  
5. "What This Is" still accurate? → Update if drifted  

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections  
2. Core Value check — still the right priority?  
3. Audit Out of Scope — reasons still valid?  
4. Update Context with current state  

---
*Last updated: 2026-03-22 — Phase 13 complete; milestone v1.2 in progress*
