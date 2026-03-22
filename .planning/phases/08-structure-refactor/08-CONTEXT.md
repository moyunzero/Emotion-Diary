# Phase 8: 大文件拆分与结构重构 - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

在不扩展产品功能的前提下，将 `app/profile.tsx`、`store/useAppStore.ts` 及 500+ 行核心组件按职责拆分，降低单文件复杂度，同时保持用户可见行为与对外 API 兼容。

</domain>

<decisions>
## Implementation Decisions

### 拆分优先级与顺序

- **D-01:** 执行顺序固定为：先 profile 壳层 → 再 store slice → 最后 500+ 组件（风险递进）。
- **D-02:** 每批粒度：profile 单独 1 批、store 单独 1 批、500+ 组件每 1 个 1 批（约 3–4 小包）。
- **D-03:** 若某批发现阻塞（如循环依赖）：先解决阻塞再继续，不跳过或转做其他目标。
- **D-04:** Phase 8 内 500+ 组件只拆 1 个（EditEntryModal），其余留给 Phase 9/10。

### profile 模块落位与目录约定

- **D-05:** feature 根目录为 `features/profile/`，与 Phase 9 目录边界一致。
- **D-06:** `app/profile.tsx` 壳层仅保留路由注册 + 一层 layout 容器，其它全部移到 feature 模块。
- **D-07:** profile 子区块按 UI 区块划分：`ProfileHeader`、`ProfileSettings`、`ProfileStats` 等。
- **D-08:** profile 专用 hooks 落位 `features/profile/hooks/` 或 `hooks/profile/`。

### useAppStore 首批 slice 范围

- **D-09:** slice 按功能域划分：entries、sync、settings、ui 等。
- **D-10:** 对外 API 保持 `useAppStore.getState()` 和现有 selector 用法不变，内部改为组合各 slice。
- **D-11:** Zustand slice 合并方式由 planner 根据 Zustand 最佳实践决定。
- **D-12:** 首批只做 1 个 slice 跑通（如 entries），再扩展。

### ARC-03 首个 500+ 目标组件（EditEntryModal）

- **D-13:** Phase 8 内首个拆分的 500+ 组件为 EditEntryModal（约 595 行）。
- **D-14:** 目录落位：保留 `components/EditEntryModal/` 作为主入口，内部拆成 `EditEntryModal.tsx`（壳）+ `EditEntryForm.tsx`、`EditEntryFields.tsx` 等。
- **D-15:** 拆分粒度：视图 / 逻辑 / 纯函数 分离（表单 UI、校验/提交逻辑、日期/格式工具）。
- **D-16:** 调用方逐步改为 `import { EditEntryModal } from '@/components/entries'` 等新路径，不强制本阶段全部迁移。

### Claude's Discretion

- profile 具体子区块命名与文件划分细节由 planner 按现有代码结构决定。
- store slice 的初始 state 与 action 命名由 planner 按 Zustand 惯例决定。
- EditEntryModal 内部子组件命名（EditEntryForm、EditEntryFields 等）为示例，planner 可按实际逻辑调整。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` — Phase 8 的目标、依赖与成功标准（ARC-01/02/03）。
- `.planning/REQUIREMENTS.md` — ARC-01～ARC-03 需求定义与追踪矩阵。
- `.planning/PROJECT.md` — 里程碑约束（按 feature 边界拆分，不按技术类型硬切）。

### Governance carry-forward

- `.planning/phases/06-governance-baseline-gates/06-GOVERNANCE-PR-TEMPLATE.md` — 小包提交与偏差处理。
- `.planning/phases/06-governance-baseline-gates/06-SMOKE-CHECKLIST.md` — 关键路径回归验证。

### Target files

- `app/profile.tsx` — profile 壳层拆分目标。
- `store/useAppStore.ts` — store slice 化目标。
- `components/EditEntryModal.tsx` — 首个 500+ 组件拆分目标（注：可能已为目录 `components/EditEntryModal/`）。

</canonical_refs>

<code_context>
## Existing Code Insights

### Target files (line counts)

- `app/profile.tsx` — ~1448 行
- `store/useAppStore.ts` — ~1350 行
- `components/EditEntryModal.tsx` — ~595 行（或同目录下等效入口）

### Established patterns

- Phase 7 已建立 shared 单一来源（formatting/time-range/responsive），profile/store/组件可复用。
- 治理基线（Phase 6）支持小包验证与 smoke 回归。

### Integration points

- profile 与 useAppStore 强耦合（entries、user prefs、sync 状态）。
- EditEntryModal 与 store 的 entries CRUD、MoodForm 等有交互。

</code_context>

<specifics>
## Specific Ideas

- profile 壳层化后，个人页核心交互与显示必须无变化（ARC-01 成功标准）。
- store slice 化后，外部调用方式保持兼容，核心流程可正常运行（ARC-02）。
- EditEntryModal 拆分后通过回归验证，用户侧无功能缺失或行为漂移（ARC-03）。

</specifics>

<deferred>
## Deferred Ideas

- EntryCard、Dashboard 等其它 500+ 组件拆分 — 留给 Phase 9/10。
- import 路径全面迁移到 `@/components/entries` — 本阶段仅逐步引导，不强制。

</deferred>

---

*Phase: 08-structure-refactor*
*Context gathered: 2026-03-21*
