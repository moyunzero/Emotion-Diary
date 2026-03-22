---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: milestone
status: unknown
stopped_at: Phase 11 context gathered
last_updated: "2026-03-22T07:37:14.550Z"
last_activity: 2026-03-22
progress:
  total_phases: 14
  completed_phases: 8
  total_plans: 37
  completed_plans: 29
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (milestone v1.2)

**Core value:** 用户能把陪伴时间与情绪变化变成 **可保存到相册** 的一张图（v1 不接入系统分享/第三方）。  
**Current focus:** Phase 11 — github-repo-hygiene

## Current Position

Phase: 12
Plan: Not started

### Quick tasks（ad-hoc）

| Date | Item |
|------|------|
| 2026-03-22 | 陪伴天数弹窗与卡片统一数据源：`useCompanionFirstEntryDate`（游客读 `guest_first_entry_date`） |
| 2026-03-22 | 个人页：未登录时「备份心事」「找回回忆」打开登录 Modal（`useProfileSyncHandlers`） |
| 2026-03-22 | CI：`push` 触发分支由 `main` 改为 `master`（`.github/workflows/ci.yml`） |
| 2025-03-21 | 情绪回顾图：修复顶部双重安全区留白（`ReviewExportScreen` header） |
| 2025-03-21 | 情绪回顾图：陪伴天数为 0 → `getEffectiveFirstEntryDateForCompanion` 与 `initializeFirstEntryDate` 口径对齐 |

## Performance Metrics

**Velocity:**

- Total plans completed: 13  
- Average duration: —  
- Total execution time: —  

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| — | — | — | — |

*Updated after each plan completion*
| Phase 04-engineering-motion P01 | 8min | 2 tasks | 6 files |
| Phase 04-engineering-motion P02 | 1 min | 2 tasks | 4 files |
| Phase 04-engineering-motion P04 | 17min | 2 tasks | 4 files |
| Phase 04-engineering-motion P03 | 24min | 2 tasks | 7 files |
| Phase 05 P01 | 1 min | 2 tasks | 3 files |
| Phase 05 P02 | 1 min | 3 tasks | 3 files |
| Phase 05 P03 | 6 min | 2 tasks | 1 files |
| Phase 06-governance-baseline-gates P01 | 1min | 2 tasks | 4 files |
| Phase 06-governance-baseline-gates P03 | 3min | 2 tasks | 4 files |
| Phase 06-governance-baseline-gates P02 | 9min | 2 tasks | 7 files |
| Phase 07-shared P01 | 17min | 2 tasks | 8 files |
| Phase 07-shared P04 | 14min | 2 tasks | 3 files |
| Phase 07-shared P02 | 16min | 3 tasks | 8 files |
| Phase 07-shared P05 | 17min | 2 tasks | 3 files |
| Phase 07-shared P03 | 17min | 2 tasks | 7 files |
| Phase 07-shared P06 | 23min | 2 tasks | 8 files |
| Phase 08-structure-refactor P01 | 25 | 2 tasks | 11 files |
| Phase 08-structure-refactor P02 | 15 | 2 tasks | 4 files |
| Phase 08-structure-refactor P03 | 2 | 2 tasks | 11 files |
| Phase 09-dir-boundary-cleanup P01 | 20 | 4 tasks | 9 files |
| Phase 09-dir-boundary-cleanup P03 | 15min | 2 tasks | 9 files |
| Phase 09-dir-boundary-cleanup P02 | 5 | 2 tasks | 6 files |
| Phase 09-dir-boundary-cleanup P05 | 10 | 2 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in `PROJECT.md` Key Decisions table. Recent:

- 导出 **先图片、后 PDF**  
- 回顾版式契约（页眉 / 解决率+环比 / Top 天气 / Top 触发器 / 一句 AI）  
- AI 需失败兜底；导出前隐私提示
- [Phase 04-engineering-motion]: 以 derived 作为导出主链唯一统计来源，防止 Screen/Canvas 口径漂移
- [Phase 04-engineering-motion]: closingSummary 复用 derived 输出，优先保持 D-15 用户可见行为稳定
- [Phase 04-engineering-motion]: No pseudo bars for null monthly rates; trend bars render only for real data.
- [Phase 04-engineering-motion]: removeClippedSubviews stays opt-in and is enabled only on Insights.
- [Phase 04-engineering-motion]: Groq API key 改为运行时读取，避免模块加载快照导致行为漂移
- [Phase 04-engineering-motion]: firstEntryDate <= 0 统一归一化为 null，稳定 companionDays 口径
- [Phase 04-engineering-motion]: 按 1 文件粒度拆分 Pkg-A/Pkg-B，确保可独立回滚。
- [Phase 04-engineering-motion]: 抽出 utils/arrayEquality.ts 复用数组比较逻辑，避免组件内重复实现。
- [Phase 05]: 中英文文案采用同构结构，主叙事锁定记录情绪与回顾导出。
- [Phase 05]: 截图顺序按记录到导出到隐私路径编排，强化审核可验证性。
- [Phase 05]: 预检清单按元数据一致性/功能演示路径/审核沟通准备分组，并为每项附证据口径。
- [Phase 05]: 4.3(a) 回复采用保守解释优先，强调 distinct branding、core flows、verification paths。
- [Phase 05]: Phase 5 在 ROADMAP 中维持 IOS-01 追踪并明确 05-01/05-02 双计划闭环。
- [Phase 05]: IOS-01 traceability 状态使用 Verified，并与 Phase 5 验证语义保持一致。
- [Phase 05]: IOS-01 证据链必须显式引用 05-01/05-02 计划与 05-VERIFICATION 报告。
- [Phase 06-governance-baseline-gates]: 将治理入口命名为 verify:governance，并以 --dry-run 提供稳定可复现摘要输出
- [Phase 06-governance-baseline-gates]: Phase 06 首版范围仅覆盖 app/components/store/utils/hooks/services/lib，显式排除 ios/android/docs
- [Phase 06-governance-baseline-gates]: smoke 路径固定为 record/export/sync，并通过单入口脚本编排
- [Phase 06-governance-baseline-gates]: 导出一致性仅使用结构化断言，明确排除像素级快照比对
- [Phase 06-governance-baseline-gates]: 每个治理重构包必须按 D-14 字段提交并遵循偏差先回退
- [Phase 06-governance-baseline-gates]: Boundaries lint gate defaults to warn and upgrades via GOV_BOUNDARIES_LEVEL=error after D-10 is met.
- [Phase 06-governance-baseline-gates]: Historical unused-export debt is tracked in allowlist baseline instead of immediate cleanup.
- [Phase 07-shared]: shared formatting 先落地纯函数，再由旧入口转调，避免关键页回归面扩大
- [Phase 07-shared]: Phase 7 保留旧签名 thin adapter 并标注 deprecated，Phase 8 再统一删除
- [Phase 07-shared]: 导出页采用无 UI 侵入方式接入 shared formatting（可访问标签承载日期语义）。
- [Phase 07-shared]: 洞察页回访日期改为复用 shared/formatting 的 formatMonthDay，消除页面内手写日期拼接。
- [Phase 07-shared]: utils/reviewStatsTimeRange 保留为 deprecated thin adapter 并统一转调 shared/time-range。
- [Phase 07-shared]: 本包仅迁移洞察链路 time-range 调用点，导出链路在后续独立计划迁移。
- [Phase 07-shared]: 导出链路直接引用 shared/time-range，避免继续透传 reviewStatsTimeRange 兼容层。
- [Phase 07-shared]: 导出页 preset 文案统一来自 REVIEW_PRESET_LABEL，消除本地重复映射。
- [Phase 07-shared]: shared/responsive 改为 width/height 输入驱动纯函数，避免 Dimensions 模块加载快照
- [Phase 07-shared]: utils/responsiveUtils 保留 deprecated thin adapter 到 Phase 8 再清理
- [Phase 07-shared]: 关键页迁移优先使用 useResponsiveStyles，避免继续新增 responsiveUtils 调用入口。
- [Phase 07-shared]: 将 ReviewExport 布局映射抽成纯函数文件，便于断点回归测试且不引入 expo 模块测试负担。
- [Phase 08-structure-refactor]: Profile 壳层化：app/profile.tsx 薄壳 + features/profile 三区 + hooks 下沉，ARC-01 达成
- [Phase 08-structure-refactor]: entries slice: createEntriesSlice 正式名，createEntriesModule deprecated 别名；saveEntriesTimeoutRef 迁入 entries，通过 clearEntriesSaveDebounce 导出
- [Phase 08-structure-refactor]: EditEntryModal 目录化：壳/Form/Fields/utils/styles 分离；@/components/entries barrel；EntryCard 迁移 D-16
- [Phase 09-dir-boundary-cleanup]: Removed no-features-to-features depcruise rule (same-feature internal imports allowed); knip handles unused exports
- [Phase 09-dir-boundary-cleanup]: responsiveUtils removed; useResponsiveStyles + createResponsiveMetrics factory pattern
- [Phase 09-dir-boundary-cleanup]: dateUtils: only formatDate + ensureMilliseconds; Chinese/month-day via @/shared/formatting
- [Phase 09-dir-boundary-cleanup]: reviewStatsTimeRange removed; all time-range imports canonical at @/shared/time-range
- [Phase 09-dir-boundary-cleanup]: 09-05: dateUtils residual cleared; formatDate/ensureMilliseconds migrated to shared/formatting, utils/dateUtils.ts deleted

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260322-kqp | 同步 temp-ag-skills 到 ~/.cursor/skills，供全项目与 GSD 调用 | 2026-03-22 | — | [260322-kqp-temp-ag-skills-cursor-skills-gsd](./quick/260322-kqp-temp-ag-skills-cursor-skills-gsd/) |

## Session Continuity

Last activity: 2026-03-22

Last session: 2026-03-22T07:21:03.428Z
Stopped at: Phase 11 context gathered
Resume file: .planning/phases/11-github-repo-hygiene/11-CONTEXT.md
