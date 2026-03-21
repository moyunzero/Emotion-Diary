# Phase 07: Shared 重复逻辑收敛 - Research

**Researched:** 2026-03-21  
**Domain:** React Native (Expo) shared utilities convergence (responsive / time-range / formatting)  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 执行顺序固定为 `formatting -> time-range -> responsive`。
- **D-02:** 采用短周期小包推进，每批控制在 `1-2 天`。
- **D-03:** 虽然首批是 formatting，但每批都必须包含统计口径一致性检查，避免语义漂移。
- **D-04:** 旧入口仅保留到 Phase 7 结束。
- **D-05:** Phase 8 只允许删除旧入口，不允许新增任何旧入口调用。
- **D-06:** Phase 7 期间通过兼容层维持外部调用稳定，迁移优先“替换调用点”，不做破坏性清理。
- **D-07:** 采用“业务一致”标准：核心数值与业务结论必须一致。
- **D-08:** 文案与展示格式允许微调，但不得改变语义与结论。
- **D-09:** 测试策略采用稳健档：`shared` 纯函数单测 + 2 条关键页面最小回归（导出页、洞察页）。
- **D-10:** 任何收敛改动都需有边界输入测试（日期边界、空值、跨月/跨周等）。

### Claude's Discretion
- shared 目录内部具体文件命名可由 Claude 决定，但需保持“按领域分组、入口清晰、可被 tree-shaking”。
- 对旧入口 wrapper 的具体保留方式（re-export 或 thin adapter）由 Claude 决定，但必须可追踪并可逐步删除。

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHR-01 | 响应式/时间区间/通用格式化等重复逻辑收敛到单一来源，旧入口保留可迁移兼容层。 | 提供 `shared` 目标结构、唯一入口、旧入口 wrapper 保留与追踪策略。 |
| SHR-02 | 组件内重复计算迁移到纯函数模块后，业务行为与显示结果保持一致。 | 提供“先加新入口 -> 对照验证 -> 切换调用 -> 保留兼容层”迁移批次与一致性检查点。 |
| SHR-03 | 收敛后的 shared 模块具备基础单元测试，覆盖关键边界输入。 | 提供 unit + minimal regression 方案、快速命令与边界用例清单。 |
</phase_requirements>

## Summary

Phase 07 的核心不是“引入新能力”，而是把已经存在但分散实现的逻辑收拢成单一来源，同时保证用户看见的结果不变。当前代码库中，time-range 领域已有较成熟的中心实现（`utils/reviewStatsTimeRange.ts`），但 formatting 与 responsive 仍有多个“组件内就地实现”，导致语义漂移风险和迁移成本持续上升。

在现有约束下，推荐采用“保守收敛”策略：先收敛 formatting（低风险、影响可见但可快速比对），再收敛 time-range（已有基础，主要做入口统一与消费侧去重），最后收敛 responsive（涉及 UI 布局与尺寸，风险最高放最后）。每批都保留兼容层，完成调用切换后不立即删除旧入口，满足 Phase 7 稳定性目标与 Phase 8 清理窗口约束。

**Primary recommendation:** 以 `shared` 为唯一实现层、以旧路径 wrapper 为过渡层、以“行为一致 + 边界测试 + 最小回归”作为每批验收门槛。

## Current Duplication Findings

### responsive
- `utils/responsiveUtils.ts` 是事实上的中心，但存在快照式屏幕尺寸实现（模块加载时 `Dimensions.get('window')`），与 `useWindowDimensions` 的动态尺寸思路并存，存在旋转/窗口变化一致性风险。
- `hooks/useResponsiveStyles.ts` 复合了 responsive token，但消费不足，大量组件直接调用 `responsivePadding/responsiveFontSize`，入口不统一。

### time-range
- 核心区间逻辑在 `utils/reviewStatsTimeRange.ts`（自然周/月、上一周期）已统一。
- `components/Insights/utils.tsx` 存在独立周一到周日计算（`getWeekDates`），与 core time-range 实现重复。
- preset 文案映射在 `utils/reviewExportDerived.ts` 与 `components/ReviewExport/ReviewExportScreen.tsx` 分散定义（语义一致但维护点重复）。

### formatting
- `utils/dateUtils.ts` 与 `services/companionDaysService.ts` 同时存在“中文日期格式化”实现（`formatDateChinese` vs `formatStartDate`）。
- `components/WeatherStation.tsx`、`app/profile.tsx`、`components/Insights/TriggerInsight.tsx` 等组件中有本地 `M/D` 文本拼接逻辑，未走统一格式化入口。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.9.2 (project) | 纯函数 shared 模块与类型约束 | 已在仓库全局使用，重构风险最低 |
| React Native | 0.81.5 (project), latest 0.84.1 | 响应式尺寸来源与 UI 运行环境 | Phase 07 不升级框架，只做逻辑收敛 |
| Jest | ^30.2.0 (project), latest 30.3.0 | 单测与最小回归执行 | 现有测试基建完备、可快速扩展 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ts-jest | ^29.4.6 | TS 测试转译 | 新增 shared util 单测时沿用 |
| fast-check | ^4.5.3 | 属性测试（可选） | 日期边界或格式幂等性扩展时使用 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 继续组件内本地格式化 | 引入 date-fns/dayjs 全量替换 | 本阶段目标是“收敛而非技术栈迁移”，新库会放大变更面 |
| 直接删除旧入口 | 过渡 wrapper + deprecate 标记 | 直接删除风险高，不符合 D-04~D-06 |

**Installation:**
```bash
# 本阶段建议不新增运行时依赖
yarn install
```

**Version verification:**  
- `react-native`: latest `0.84.1`, npm modified `2026-03-21T03:58:06.408Z`  
- `jest`: latest `30.3.0`, npm modified `2026-03-10T02:00:06.708Z`  
- `ts-jest`: latest `29.4.6`, npm modified `2025-12-01T17:32:14.536Z`

## Recommended Single-Source Design

### Recommended Project Structure
```text
shared/
├── formatting/
│   ├── date.ts           # 中文日期、短日期、相对时间
│   └── index.ts          # formatting 统一导出
├── time-range/
│   ├── periods.ts        # 周/月区间与上一周期
│   ├── presets.ts        # preset key + label 映射
│   └── index.ts
├── responsive/
│   ├── tokens.ts         # 断点、padding/font/spacing token
│   ├── metrics.ts        # 设备类型、动态屏幕计算
│   └── index.ts
└── index.ts              # shared 顶层稳定入口
```

### Pattern 1: Pure Domain Utilities + Thin UI Adapter
**What:** shared 内只放纯函数/可预测计算；组件层只做取值与渲染。  
**When to use:** formatting/time-range/responsive 任一通用逻辑。  
**Example:**
```typescript
// Source: local codebase pattern (utils/reviewStatsTimeRange.ts)
export function getReviewExportPeriods(now: Date, preset: ReviewExportPreset) {
  // 纯函数：输入 now + preset，输出 current/previous
}
```

### Pattern 2: Canonical Mapping Centralization
**What:** 把 `preset -> label` 映射放到 shared/time-range/presets 单点。  
**When to use:** 任何页面显示“本周/本月/上周/上月”文案。  
**Example:**
```typescript
export const REVIEW_PRESET_LABEL: Record<ReviewExportPreset, string> = {
  this_week: '本周',
  this_month: '本月',
  last_week: '上周',
  last_month: '上月',
};
```

### Pattern 3: Dynamic Responsive Inputs
**What:** 计算函数接收 `width/height` 输入，避免模块级快照常量。  
**When to use:** 横竖屏、分屏、窗口尺寸变化场景。  
**Example:**
```typescript
export function getDeviceTypeBySize(width: number, height: number) {
  const aspectRatio = height / width;
  // return phone/tablet/desktop
}
```

### Anti-Patterns to Avoid
- **组件内重复日期拼接：** 容易出现格式漂移与 i18n 语义不一致，应统一走 shared formatting。
- **模块加载时固定屏幕尺寸：** 旋转后结果可能过期，应改为输入驱动。
- **跨文件重复 preset 文案：** 新增预设时容易漏改，必须集中映射。

## Compatibility Layer Strategy

| 场景 | 兼容层做法 | 退出条件 |
|------|------------|----------|
| `utils/dateUtils.ts` 旧 API | 保留函数签名，内部转调 `shared/formatting` | Phase 8 删除旧入口 |
| `services/companionDaysService.ts::formatStartDate` | 保留导出，改为调用 shared 中文日期函数 | 调用点全部切换后删除 |
| `utils/reviewStatsTimeRange.ts` | 可作为 shared/time-range 的薄适配器（re-export） | 新入口覆盖率达标后删除旧路径导入 |
| `utils/responsiveUtils.ts` | 保留旧方法名，内部改为调用 `shared/responsive` 动态版本 | 组件改完 + 回归通过后删除 |

推荐为兼容层增加 `/** @deprecated Phase 7 temporary compatibility */` 注释，并通过 lint/grep 禁止新增旧入口调用。

## Migration Batches (1-2 days each)

### Batch A (Formatting first, low risk)
1. 新建 `shared/formatting` 单一实现（中文日期、短日期、相对时间）。  
2. 旧入口（`dateUtils`、`formatStartDate`）改为 thin adapter。  
3. 替换优先级：导出页 -> 洞察页 -> 其余页面。  
4. 检查点：核心展示文本语义一致（D-07/D-08）。

### Batch B (Time-range second, medium risk)
1. 将 `reviewStatsTimeRange` 提升为 `shared/time-range` canonical 实现。  
2. 合并 preset label 映射，删除重复定义。  
3. 将 `components/Insights/utils.tsx::getWeekDates` 改为复用 shared 周边界逻辑。  
4. 检查点：导出统计 current/previous 边界与旧行为一致。

### Batch C (Responsive last, higher UI risk)
1. 把 `responsive` 逻辑改为“输入 width/height 的纯函数 + hook adapter”。  
2. `useResponsiveStyles` 统一消费 `shared/responsive`，并逐步替换直接调用点。  
3. 保留旧 `responsiveUtils` API 作为 wrapper 到 Phase 7 结束。  
4. 检查点：关键页面（导出页/洞察页）布局与字号不回归。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 日期显示格式统一 | 在每个组件手写 `${m}/${d}` 或中文拼接 | `shared/formatting` 函数 | 防止语义漂移与边界漏测 |
| 周/月区间推导 | 页面内重复写“周一-周日”计算 | `shared/time-range` canonical API | 防止统计口径分叉 |
| 响应式断点判定 | 组件内直接 if/else 判断屏宽 | `shared/responsive` token + helper | 防止阈值散落与维护困难 |

**Key insight:** 此 phase 的风险来自“分散实现”，不是“算法复杂度”；必须优先消除重复入口。

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — 本阶段仅收敛计算/展示逻辑，不改存储 schema 或 key | 无数据迁移，代码编辑即可 |
| Live service config | None — 未发现依赖外部控制台配置的逻辑命名收敛 | 无 |
| OS-registered state | None — 不涉及任务注册、服务名或系统级标识 | 无 |
| Secrets/env vars | None — 不涉及环境变量命名变更 | 无 |
| Build artifacts | None — 不涉及包名/二进制名变更 | 无 |

## Testing Strategy

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (`jest.config.js`) |
| Config file | `jest.config.js`, `jest.ci.config.js` |
| Quick run command | `yarn test:unit __tests__/unit/utils/reviewStatsTimeRange.test.ts` |
| Full suite command | `yarn test:ci` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHR-01 | shared 单一来源 + 兼容层可用 | unit | `yarn test:unit __tests__/unit/utils/utilityFunctionTypes.test.ts` | ✅ |
| SHR-02 | 迁移后导出/洞察业务结果一致 | unit + minimal regression | `yarn test:unit __tests__/unit/utils/reviewExportDerived.test.ts` | ✅ |
| SHR-03 | 边界输入测试（跨周/月、空值） | unit | `yarn test:unit __tests__/unit/utils/reviewStatsTimeRange.test.ts` | ✅ |

### Minimal Regression (locked by D-09)
- 导出页：`components/ReviewExport/ReviewExportScreen.tsx` + `ReviewExportCanvas` 数值/文案一致。  
- 洞察页：`components/Insights/*` 中周范围与格式化文本一致性。

### Required Boundary Cases (locked by D-10)
- 月边界：2 月、闰年、跨年（12->1）。  
- 周边界：周日、周一、跨月周。  
- 空值：无记录、`firstEntryDate` 为空或 <= 0。  
- Responsive：小屏/平板阈值、横竖屏切换。

## Common Pitfalls

### Pitfall 1: “只换导入路径”但没统一实现
**What goes wrong:** 看起来迁移了，实际上 shared/old 两套逻辑并存。  
**Why it happens:** 先做调用替换，没做旧入口转调。  
**How to avoid:** 强制旧入口仅保留 wrapper，不允许残留业务实现。  
**Warning signs:** 同类逻辑在 `shared` 与 `utils/services/components` 同时存在。

### Pitfall 2: responsive 逻辑用静态尺寸导致旋转漂移
**What goes wrong:** 横竖屏切换后排版与断点判断不更新。  
**Why it happens:** 模块加载期缓存 `Dimensions.get('window')`。  
**How to avoid:** 让核心计算函数改为接收实时 `width/height`。  
**Warning signs:** 旋转后字号/间距未变化或变化异常。

### Pitfall 3: preset 文案和周期逻辑脱节
**What goes wrong:** 显示“本月”，实际统计区间是其他预设。  
**Why it happens:** 文案映射与 period 计算分散。  
**How to avoid:** 将 key->label 与 key->period 收敛在同一域模块。  
**Warning signs:** 同一 preset 在不同页面出现不同中文标签。

## Code Examples

### Existing canonical time-range pattern
```typescript
// Source: utils/reviewStatsTimeRange.ts
export function getReviewExportPeriods(now: Date, preset: ReviewExportPreset) {
  const y = now.getFullYear();
  const m = now.getMonth();
  // this_month / last_month / this_week / last_week
}
```

### Existing duplicated formatting pattern (to converge)
```typescript
// Source: services/companionDaysService.ts
export function formatStartDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}
```

## Risk & Rollback Recommendations

| Risk | Trigger | Mitigation | Rollback |
|------|---------|------------|----------|
| 统计口径漂移 | 周/月边界实现变动 | 每批执行导出统计对照测试 | 回退该批 PR（D-14 小包） |
| 文案格式变化引发用户感知差异 | formatting 函数统一后表现微调 | 保持语义一致，必要时加 snapshot 文本断言 | 兼容层切回旧实现 |
| 布局抖动 | responsive 动态化后阈值变化 | 仅改 shared 核心 + 两条关键页回归 | 恢复旧 wrapper 逻辑 |
| 迁移中断 | 半迁移状态 | 保留旧入口可运行直到 Phase 7 结束 | 使用兼容层保持线上稳定 |

## Sources

### Primary (HIGH confidence)
- Local context: `.planning/phases/07-shared/07-CONTEXT.md` (locked decisions D-01~D-10)
- Local requirements: `.planning/REQUIREMENTS.md` (SHR-01/02/03)
- Local governance: `.planning/phases/06-governance-baseline-gates/06-GATE-RULES.md`
- Local implementation:
  - `utils/responsiveUtils.ts`
  - `hooks/useResponsiveStyles.ts`
  - `utils/reviewStatsTimeRange.ts`
  - `utils/dateUtils.ts`
  - `services/companionDaysService.ts`
  - `components/Insights/utils.tsx`
  - `components/WeatherStation.tsx`
  - `components/ReviewExport/ReviewExportScreen.tsx`
  - `utils/reviewExportDerived.ts`

### Secondary (MEDIUM confidence)
- npm registry metadata (`npm view`) for package currency checks.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 主要基于仓库现状与 npm registry 实时版本信息。
- Architecture: HIGH - 直接来自现有代码重复点与 Phase 约束。
- Pitfalls: HIGH - 由当前重复实现和已存在模式直接推导。

**Research date:** 2026-03-21  
**Valid until:** 2026-04-20

## Planner Feed: Must-Have Checkpoints

以下清单可直接作为 planner 约束（必须逐项可验证）：

1. **顺序锁定**：任务波次必须严格 `formatting -> time-range -> responsive`（D-01）。  
2. **小包节奏**：每个计划包限定 1-2 天，可独立回滚（D-02 + governance D-14）。  
3. **每批口径校验**：无论批次主题，都必须包含统计口径一致性检查（D-03）。  
4. **兼容层保留**：旧入口在 Phase 7 内保留 thin adapter，不做破坏性删除（D-04~D-06）。  
5. **新增旧调用禁止**：从第一包开始，禁止新增旧入口 import（lint/grep gate）。  
6. **一致性判定**：核心数值/结论必须一致；仅允许文案微调且不改语义（D-07/D-08）。  
7. **测试门槛**：每包至少通过 `yarn lint` + 受影响测试 + 关键路径 smoke（记录/导出/同步）。  
8. **SHR-03 边界测试**：必须覆盖空值、跨周跨月、日期边界、responsive 阈值（D-09/D-10）。  
9. **关键页回归**：导出页 + 洞察页最小回归必须纳入计划和验收。  
10. **Phase 8 交接约束**：Phase 7 只迁移不删旧入口；Phase 8 才允许集中删除兼容层。
