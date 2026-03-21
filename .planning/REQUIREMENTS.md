# Requirements: 焚语（情绪回顾导出 & 工程/上架）

**Defined:** 2025-03-21  
**Core Value:** 用户能把陪伴时间与情绪变化变成可保存、可分享的一张图，语气温柔、非官腔。

## v1 Requirements

### 回顾导出（图片）

- [ ] **EXPORT-01**: 用户可选择 **周或月** 作为回顾统计的时间范围（起止日期展示符合中文习惯，如 `2025年3月1日～3月31日`）。
- [ ] **EXPORT-02**: 导出图包含 **「陪伴焚语第 N 天」**，N 与现有应用内「陪伴天数」逻辑一致、可解释。
- [ ] **EXPORT-03**: 展示 **本期情绪解决率（%）** 及 **相对上一同期（上月或上周，规则需产品一致）** 的变化（如 `↑12% vs 上月`）；并展示 **小字**：本期共记录 X 笔、已和解 Y 笔。
- [ ] **EXPORT-04**: （可选，若 v1 排期允许）展示解决率 **月趋势** 的简易 **折线图或柱状图**；若砍 scope，须在架构上保留统计接口以便后续补图。
- [ ] **EXPORT-05**: 展示本期 **Top 3「情绪气象站」天气档位**（与现有晴/多云/雨/暴风雨等映射一致），每种含 **图标 + 出现天数**。
- [ ] **EXPORT-06**: 展示 **Top 3 情绪触发器**，并附 **园艺小建议**（短句、与现有洞察风格一致）。
- [ ] **EXPORT-07**: 展示 **一句话 AI 温柔总结**，语气为朋友/树洞/温柔姐姐；**无 API Key 或请求失败时** 有可读兜底文案，不阻断导出主流程。
- [ ] **EXPORT-08**: 用户可将生成结果 **保存到相册或通过系统分享面板分享**（iOS 优先）；导出前 **明确提示**内容含情绪信息、分享需谨慎。

### 工程质量

- [ ] **ENG-01**: 为周/月聚合、解决率、环比、Top 天气/触发器等建立 **可测试的纯函数或服务层**，避免逻辑散落在多个巨型组件内。
- [ ] **ENG-02**: **增量** 整理目录与重复代码（以导出与洞察相关路径为先），不引入无必要的大范围重命名风暴。

### 动效与体验

- [ ] **ANIM-01**: 输出 **动效/过渡审计清单**（核心路径：导出预览、洞察相关列表与关键过渡），并落实 **至少一批**高优先级收敛（减少重复 Reanimated/手势逻辑）。

### Apple 上架

- [ ] **IOS-01**: 完成 **App Store 提交流程** 所需项（构建、隐私声明与用户可见文案、与导出相关的数据说明、截图/描述与现有 `app-store-submission/` 材料协同）。

## v2 Requirements

### 导出扩展

- **EXPORT-PDF-01**: 用户可将同一套回顾内容导出为 **PDF**（版式与图片契约对齐）。

### 跨平台

- **STORE-AND-01**: Android / 其他商店上架与素材（本轮不强制）。

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF 导出（v1） | 用户明确先保证图片 |
| 全应用目录大爆炸式重构 | 风险与上架窗口不匹配；仅增量整理 |
| 无上限的 AI 长文 | v1 仅一句话总结，控制成本与审核风险 |

## Traceability

| Requirement | Phase | Plans / 说明 | Status |
|-------------|-------|----------------|--------|
| EXPORT-01 | Phase 1（时间边界）/ Phase 2（UI） | `01-01-PLAN` / 导出页 | Pending |
| EXPORT-02 | Phase 1（陪伴天数）/ Phase 2（UI） | `01-01` + `calculateDaysAsOf` | Pending |
| EXPORT-03 | Phase 1（率与环比）/ Phase 2（UI） | `01-02-PLAN` | Pending |
| EXPORT-04 | Phase 1（月序列）/ Phase 4（图） | `01-03-PLAN` | Pending |
| EXPORT-05 | Phase 1（Top 天气）/ Phase 2（图） | `01-03-PLAN` | Pending |
| EXPORT-06 | Phase 1（触发器+建议）/ Phase 2（图） | `01-03-PLAN` | Pending |
| EXPORT-07 | Phase 3 | — | Pending |
| EXPORT-08 | Phase 2 | — | Pending |
| ENG-01 | Phase 1 | `01-01`～`01-03-PLAN` | Pending |
| ENG-02 | Phase 4 | — | Pending |
| ANIM-01 | Phase 4 | — | Pending |
| IOS-01 | Phase 5 | — | Pending |

**Coverage:**

- v1 requirements: 12 total  
- Mapped to phases: 12  
- Unmapped: 0 ✓  

---
*Requirements defined: 2025-03-21*  
*Last updated: 2025-03-21 after plan-phase 1*
