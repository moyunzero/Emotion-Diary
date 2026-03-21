# Phase 5: Apple 上架 - Context

**Gathered:** 2026-03-21  
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段仅交付 **App Store 提交流程就绪**（`IOS-01`）：构建与版本一致、隐私与导出相关说明一致、截图与中英文描述可提审、预检清单可勾选。

**不包含**：新增产品功能、导出能力扩展（如 PDF）、跨平台商店同步上线。

</domain>

<decisions>
## Implementation Decisions

### 提审策略
- **D-01:** 首次提审采用 **最小可过审包**，优先通过率，避免一次性堆叠过多卖点。
- **D-02:** 首发主叙事锁定为 **「记录情绪 + 回顾导出」**，素材与文案围绕该双主线统一。
- **D-03:** AI 采用 **弱化呈现**：主文案不强调 AI，次级描述可提“温柔一句”且需明确失败兜底与非医疗属性。

### 提审材料一致性
- **D-04:** `app-store-submission/preflight-checklist.md` 作为提审前最终核对入口，所有元数据与截图变更必须在清单体现。
- **D-05:** 中英文描述保持同一信息结构：核心价值、隐私提醒、导出行为边界（保存到相册，不内置第三方分享）。

### Claude's Discretion
- 截图顺序与每张截图文案长度可在不偏离主叙事前提下微调。
- 审核备注字段采用“保守解释”模板优先，必要时再补充功能细节。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 规划与需求
- `.planning/ROADMAP.md` — Phase 5 Goal / Success Criteria
- `.planning/REQUIREMENTS.md` — `IOS-01`
- `.planning/PROJECT.md` — 产品主价值与当前范围边界

### 上架材料
- `app-store-submission/preflight-checklist.md` — 提审清单与最终核对
- `app-store-submission/metadata/app-description-zh.md` — 中文描述草稿
- `app-store-submission/metadata/app-description-en.md` — 英文描述草稿
- `app-store-submission/metadata/screenshot-guide.md` — 截图规划
- `app-store-submission/review-response-4.3a.md` — 审核沟通模板

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/review-export.tsx` + `components/ReviewExport/*`：可用于截图主素材（回顾导出主线）。
- `components/Insights/index.tsx`：可作为“记录后回顾/洞察”辅助截图素材来源。

### Integration Points
- `app.json`、`ios/app/Info.plist`：版本、权限文案与上架元数据一致性核对关键点。
- `scripts/verify-*.js`：可复用为预检命令，减少人工漏检。

### Established Patterns
- 项目采用增量收敛策略：文档先行、清单驱动，避免大范围无关改动。

</code_context>

<specifics>
## Specific Ideas

- 上架文案避免“治疗/诊断”语义，强调“自我记录与回顾”。
- 首发截图建议突出“回顾导出图可保存到相册”的可感知价值。

</specifics>

<deferred>
## Deferred Ideas

- AI 作为主卖点的提审文案策略（后续版本视审核反馈再增强）。
- 多商店同步素材体系（本阶段仅 Apple）。

</deferred>

---

*Phase: 05-apple*  
*Context gathered: 2026-03-21*
