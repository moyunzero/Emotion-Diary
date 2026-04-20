# 心晴MO（Emotion-Diary）— GSD 工程

## What This Is

**心晴MO** 是一款治愈系情绪记录应用（Expo / React Native）：用「情绪气象站」「心灵花园」等隐喻帮助用户记录情绪、理解触发因素，并可选使用 AI 与云端同步。应用商店、设备显示名与对外文档统一为 **心晴MO**。当前代码库已具备记录、洞察、焚烧、AI（Groq）、Supabase 同步与离线优先等能力（见 `.planning/codebase/`）。

**v1.1 工程重构与代码治理** 已收口（治理、shared、结构拆分、目录边界、测试/CI）。  
当前进入新里程碑：**v1.2 GitHub 开源就绪与产品体验精炼** — 面向公开仓库的 **可复现构建、无密钥泄漏、代码与测试集健康、RN/Expo 约定清晰、单文件可维护、核心逻辑中文注释、UI 拒绝通用模版感**；不改变「情绪记录 + 温柔回顾」核心叙事。

## Current Milestone: v1.5 代码质量优化

**Goal:** 清理未使用代码、合并重复导出、修复 lint 警告与测试问题，提升代码库健康度。

**Target features:**

- **CLEAN-01 未使用导出清理**：删除已识别但未使用的导出
- **CLEAN-02 重复导出合并**：解决 AudioRecorder 等组件的 default + named 同名导出
- **CLEAN-03 lint 警告修复**：处理未使用变量与 React hooks 依赖缺失
- **CLEAN-04 测试修复**：修复 expo-audio mock 问题导致的测试失败

## Previous Milestone: v1.4 极简差异化体验 (Abandoned)

**Goal:** 在不增加复杂度的前提下，围绕"3 步内完成情绪记录"做体验升级。  
**Status:** Phase 17-18 completed; Phase 19-20 abandoned.

**Goal:** 根据项目最新代码，修改 README、相关文档及 App 上架元数据，确保与现有代码逻辑与品牌命名一致。  
**Status:** Complete（Phase 16）

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
- ✓ **UI 体验与非模版化（UI-01/02）**：`14-UI-SPEC` 全产品原则与反模式、`14-UI-AUDIT` 五关键屏抽检、CONTRIBUTING 链到 SPEC — Validated in Phase 14 (ui)
- ✓ **隐私轻面板（SMP-01）**：个人页单入口展示数据边界，双开关即时生效，离线可切换并支持补偿同步，默认保守关闭 — Validated in Phase 17 (v1-4)

### Active（v1.4）

见 `.planning/REQUIREMENTS.md` **v1.4** 章节（SMP-02/04/06）。摘要：以“极简、温柔、非同质化”为约束，优先优化高频记录路径与叙事回顾体验。

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
   - **陪伴心晴MO 第 N 天**（与现有「陪伴天数」逻辑一致，如 `firstEntryDate` / companion days）

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
     > 「这个月你陪着自己走过 9 次暴风雨，也让 29 朵情绪小花盛开。你真的很努力，心晴MO 一直都在。」  
   - 需 **无 Key / 失败时的兜底文案**（避免空白或报错打断导出）

## Context

- 第一版 App 已上架，当前阶段目标从“可发布”转向“可持续使用”：降低记录阻力、提高长期留存、维持情感陪伴感。  
- 用户明确要求：功能必须尽可能简单、Web+移动端体验一致、避免社交化压力设计、避免与 2026 同类产品雷同。  
- 研究结论（`.planning/research/SUMMARY.md`）：v1.4 应坚持最小增量，优先做隐私可见性、极速记录路径、温和提醒、叙事化回顾增强。

## Constraints

- **Tech**：保持 Expo SDK 54 / RN 0.81 主栈，v1.4 原则上仅接受最小依赖增量（如本地提醒所需能力）。  
- **Simplicity**：新增功能必须服务“更快完成记录”，不引入社交排名、复杂任务系统、重运营机制。  
- **Cross-platform**：Web 与移动端核心路径一致，交互语义与文案语气保持统一。  
- **Privacy**：涉及同步、AI、导出的能力必须让用户清楚看到数据边界并可自主控制。  
- **Tone**：文案保持温柔、非评判、非说教，不使用焦虑驱动文案。

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 导出 **先图片、后 PDF** | 用户最易感知、工程迭代更快 | — Pending |
| 回顾内容以 **周/月 + 陪伴天数 + 解决率/趋势 + Top 天气/触发器 + 一句 AI** 为 v1 契约 | 用户已给出可执行的版式与示例 | — Pending |
| AI 总结需 **失败兜底** | 避免无 Key 或网络失败时导出残缺 | — Pending |
| 工程治理按“先低风险清理，再结构重构”推进 | 先降噪再重构，降低回归风险 | — Pending |
| 大文件拆分按 feature 边界而非技术类型硬切 | 减少跨模块耦合，提升可维护性 | — Pending |
| 测试采用“删示例、并重复、保关键路径”策略 | 同时降低维护成本与重构风险 | — Pending |
| v1.4 只做高杠杆小步改动，不做功能堆叠 | 保持产品简洁，避免与同类应用同质化 | — Pending |
| 未被选中的候选能力（检索/微行动）本里程碑明确不做 | 聚焦交付节奏与用户最直接价值 | — Pending |

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
*Last updated: 2026-04-19 — Milestone v1.5 started (code quality)*
