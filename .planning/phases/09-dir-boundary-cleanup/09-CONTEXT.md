# Phase 9: 目录边界治理与冗余清理 - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

目录边界规则可执行、依赖关系可控，且高置信冗余代码被安全移除。不新增产品功能，不扩张 Phase 6 治理范围以外的目录（ios/android/docs 保持排除）。

</domain>

<decisions>
## Implementation Decisions

### 1. 目录边界可执行化

- **D-01:** 将 `features/` 纳入 depcruise、boundaries 检查范围，与 Phase 6 已有目录一致。
- **D-02:** `features/` 与 `app/` 同级：仅 `app/` 可引用 `features/`；`features/` 可引用 `components/`、`store/`、`utils/`、`shared/` 等。
- **D-03:** 三项规则从 warn 升级到 error：跨层越界 import、新增循环依赖、新增未使用导出。
- **D-04:** features 依赖规则严格：features 之间不可互相引用；仅可引用 shared、components、store、utils 等下层。

### 2. 死代码删除策略

- **D-05:** 分块删除：按模块分批（responsiveUtils → dateUtils → reviewStatsTimeRange），每批独立 PR。
- **D-06:** 删除证据：每个计划有 SUMMARY，说明删了什么、回滚点；PR 描述含改动范围与验证。
- **D-07:** Phase 9 结束时 deprecated 必须清零：`reviewStatsTimeRange`、`responsiveUtils`、`dateUtils` 中 Phase 7 遗留的 thin adapter 要么删除，要么只剩无调用点的薄壳。
- **D-08:** 以 knip 报告驱动：先跑 knip 报告，以工具输出为准逐项删或加 allowlist，不凭主观臆断。

### 3. 冗余清理与 allowlist

- **D-09:** 删代码/迁移后同步收紧 allowlist：对应条目删除或缩小范围，避免残留无效豁免。
- **D-10:** 若收紧 allowlist 导致历史违规暴露：本 PR 内当场修掉或补豁免并说明理由，不留技术债。
- **D-11:** Phase 9 结束 verify:governance 全绿（含 dry-run 与实跑），与 ROADMAP 成功标准一致。
- **D-12:** 在 STRUCTURE.md 或 CONVENTIONS.md 写明 shared/utils 边界：新纯函数进 shared，utils 仅遗留/桥接。

### 4. 双端验证粒度（CLN-03）

- **D-13:** 验证以脚本为主：verify:governance + 关键路径自动化；双端手测为可选/建议。
- **D-14:** 扩展 smoke 清单：Phase 9 在 06-SMOKE-CHECKLIST 基础上加入「删除/迁移路径」相关检查项。
- **D-15:** 若做手测：必须至少一端真机验证，模拟器双端可接受但非强制。
- **D-16:** 与 Phase 10 边界：Phase 9 顺带整理与删代码同文件的明显重复测试；测试目录重组与分层留给 Phase 10。

### Claude's Discretion

- depcruise / boundaries 具体规则配置与 features 层级定义由 planner 按现有 06 配置扩展。
- 删除批次内具体文件顺序（如 responsiveUtils 内部函数迁移顺序）由实现阶段决定。
- 09-DELETIONS.md 是否创建由 planner 按 D-06 证据需求决定（PR+SUMMARY 已满足最低要求）。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 里程碑与阶段约束

- `.planning/ROADMAP.md` — Phase 9 目标、依赖与成功标准
- `.planning/REQUIREMENTS.md` — CLN-01、CLN-02、CLN-03 的原始约束
- `.planning/PROJECT.md` — 增量重构、可回滚、稳定性优先的里程碑原则

### 治理继承

- `.planning/phases/06-governance-baseline-gates/06-CONTEXT.md` — 治理基线、工具范围、门禁策略
- `.planning/phases/06-governance-baseline-gates/06-GATE-RULES.md` — report/warn/error 映射、升级条件
- `.planning/phases/06-governance-baseline-gates/06-SMOKE-CHECKLIST.md` — 关键路径 smoke 清单
- `.planning/phases/06-governance-baseline-gates/06-GOVERNANCE-PR-TEMPLATE.md` — 小包提交与偏差处理

### 代码结构与约定

- `.planning/codebase/STRUCTURE.md` — 当前目录边界、命名约定
- `.planning/codebase/CONVENTIONS.md` — Zustand、错误处理、lint 约定
- `.planning/phases/08-structure-refactor/08-CONTEXT.md` — features/profile 落位、目录约定

### 共享逻辑迁移参考

- `.planning/phases/07-shared/07-CONTEXT.md` — shared 模块、deprecated 适配层来源

</canonical_refs>

<code_context>
## Existing Code Insights

### 待清理 deprecated（Phase 7 遗留）

- `utils/responsiveUtils.ts` — 多处调用（GardenHeader、EmotionReleaseArchive、WeeklyMoodWeather、MoodForm.styles 等），迁移到 shared/responsive。
- `utils/dateUtils.ts` — formatDateChinese、formatMonthDay 等，迁移到 shared/formatting。
- `utils/reviewStatsTimeRange.ts` — getCalendarMonthRange、getReviewExportPeriods、ReviewExportPreset，迁移到 shared/time-range 或 utils 内新位置。
- `services/companionDaysService.ts` — 引用 dateUtils.formatDateChinese，迁移后更新。
- `store/modules/entries.ts` — createEntriesModule 已废弃（08-02 改为 createEntriesSlice），可清理命名/注释。

### 治理工具

- `scripts/verify-governance.js` — 治理入口
- `scripts/governance/depcruise.cjs` — 依赖检查
- `scripts/governance/allowlist.knip.json` — knip allowlist
- `eslint.config.js` — boundaries 规则

### Integration Points

- lint 脚本已包含 `features`（Phase 8 更新）。
- depcruise、boundaries 配置需扩展以纳入 features/ 并定义 app → features → components/store 分层。

</code_context>

<specifics>
## Specific Ideas

- 用户明确：三项门禁（跨层越界、循环依赖、未使用导出）全部升 error，不保留 warn。
- 用户明确：deprecated 必须在 Phase 9 清零，不可遗留仍有调用的薄壳。
- 用户明确：verify:governance 全绿为 Phase 9 完成必要条件。
- 用户明确：allowlist 收紧与代码删除同步，历史违规当场修。

</specifics>

<deferred>
## Deferred Ideas

- 测试目录与代码边界全面对齐 — Phase 10（TST-02）
- 全仓（含 ios/android/docs）统一纳入治理 — 后续阶段评估
- AI、登录路径纳入 smoke — 按 06-D-01 保持记录/导出/同步为主集

</deferred>

---

*Phase: 09-dir-boundary-cleanup*
*Context gathered: 2026-03-22*
