# 焚语（Emotion-Diary）— GSD 工程

## What This Is

**焚语** 是一款治愈系情绪记录应用（Expo / React Native）：用「情绪气象站」「心灵花园」等隐喻帮助用户记录情绪、理解触发因素，并可选使用 AI 与云端同步。当前代码库已具备记录、洞察、焚烧、AI（Groq）、Supabase 同步与离线优先等能力（见 `.planning/codebase/`）。

本轮 GSD 聚焦：**在不大改产品内核的前提下**，交付用户强感知的 **周/月情绪回顾导出（图片优先）**，并同步推进 **工程质量、动效与 Apple 上架**。

## Core Value

**用户能把「被陪伴的时间」和「情绪变化」变成可保存、可分享的一张图**——缓解「数据只在手机里」的焦虑，同时保持温柔、非官腔的调性。

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

### Active

- [ ] **回顾导出（图片优先）**：用户可选 **周/月** 时间范围，一键生成 **可分享图片**（PDF 明确后置）；版式须包含下列区块（见下节「导出版式契约」）。
- [ ] **工程质量（主轴）**：减少冗余、按清晰边界整理模块/目录，使导出与统计不堆死在单一大组件。
- [ ] **动效与分析**：对核心路径（尤其导出预览、洞察相关滚动与过渡）做审计与收敛，避免重复动画逻辑。
- [ ] **Apple App Store**：完成提交流程所需的构建、隐私与元数据（与 `app-store-submission/` 及现有 verify 脚本协同）。

### Out of Scope（本轮明确不做或后置）

- **PDF 导出**：确认图片链路稳定后再做（用户已表态「先保证图片」）。
- **跨平台商店同步上线**：本轮文案以 **Apple App Store** 为主；其他商店不强制同学段完成。
- **重写全应用架构**：仅做 **增量式** 分层与去冗余，避免「大爆炸」重构。

## 导出版式契约（图片 v1）

**总体**：一张图内信息层次清晰，适合保存与分享到社交平台；语气 **像朋友 / 树洞 / 温柔姐姐**，避免客服腔。

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
| 工程质量 **增量重构** 而非全量重写 | 控制风险、配合上架节奏 | — Pending |

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
*Last updated: 2025-03-21 after initialization（用户确认导出版式与图片优先）*
