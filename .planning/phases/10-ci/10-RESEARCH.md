# Phase 10: 测试治理与 CI 收口 - Research

**Researched:** 2026-03-22  
**Domain:** Jest/React Native 测试治理、GitHub Actions 分层 CI、与 Phase 6 治理门禁对齐  
**Confidence:** HIGH（仓库脚本与配置已核对；Jest 30 CLI 经 Context7；GHA 经官方文档）

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**示例/低价值/重复测试清理标准（TST-01）**

- **D-01:** 示例测试删除 — `__tests__/unit/utils/example.test.ts`、`__tests__/property/example.property.test.ts` 仅验证 Jest/fast-check 基础设施，真实业务测试已覆盖；直接删除，不保留单独冒烟测试。
- **D-02:** 低价值界定采用三标准叠加（满足任一条即视为删除候选）：(1) 明确标注为示例/脚手架的；(2) 不断言业务行为的（空断言、仅测类型/导入存在）；(3) 与关键路径（记录/导出/同步）无关且维护成本高、覆盖很薄。
- **D-03:** 重复测试处理：保留「最贴近源码」的一份。例如 `__tests__/unit/shared/` 对应 `shared/` 的测试优先保留，删除 utils 或 property 中重复断言同一逻辑的用例。执行前核对不丢独特覆盖。

### Claude's Discretion

- TST-02 测试目录与代码边界对齐 — 是否建立 `__tests__/features`、colocated vs 集中式、与 features/store/shared 的映射规则，由 planner 按现有 `__tests__/unit` 结构扩展。
- TST-03 CI 分层策略 — 基础门禁 vs 进阶门禁的具体命令、PR 阶段 vs 进阶阶段职责、GitHub Actions 入口设计，由 planner 按 Phase 6 验证门槛与 `test:ci`/`verify:governance` 现状设计。
- 关键路径测试集补齐 — 记录/导出/同步各自需哪些自动化测试、`verifyGovernanceSmoke` 之外的补充，由 planner 按 Phase 6 D-01 与现有测试清单推导。

### Deferred Ideas (OUT OF SCOPE)

- 测试目录对齐（TST-02）与 CI 分层（TST-03）的细节 — 用户仅讨论了清理标准，其余由 planner 推导。
- 覆盖率门槛是否在 CI 中强制 — 当前 jest.ci.config 已取消；是否在进阶门禁中恢复由实现决定。
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TST-01 | 删除示例/低价值/重复测试，保留并补齐关键路径测试集 | D-01～D-03 删除规则；`scripts/verify-governance-smoke.js` 已锚定 record/export/sync 用例路径；全量检索 `__tests__` 可比对重复与「文件名 vs 被测模块」错位 |
| TST-02 | 测试目录与代码边界对齐（feature/store/shared/integration），可快速定位责任模块 | 现状为 `__tests__/unit/{app,components,hooks,scripts,services,shared,store,utils}` + `property/` + `integration/`；无 `__tests__/unit/features`；存在「路径在 utils、逻辑在 shared」的错位用例（见下文物证） |
| TST-03 | CI 分层（基础 + 进阶），速度与稳定性平衡 | 仓库无 `.github/workflows`；已有 `yarn lint`、`yarn test:ci`（`jest.ci.config.js` 无覆盖率阈值）、`yarn verify:governance`、`test:release`（lint + test:ci）；可映射为 PR 快路径与 main/进阶慢路径 |
</phase_requirements>

## Summary

本阶段不扩张产品功能，而是让测试集与目录边界可维护，并把 Phase 6 已约定的本地门禁（lint、Jest、`verify:governance`、关键路径 smoke）收口到可重复的 CI 分层模型中。

仓库当前以 **Jest 30 + react-native preset + ts-jest** 为主，`jest.config.js` 保留 80% 全局覆盖率阈值（本地/全量 `yarn test` / `yarn test:coverage`），`jest.ci.config.js` 继承同一 preset 但 **显式关闭 `coverageThreshold`**，与 CONTEXT 中「CI 不以覆盖率为硬门槛」一致。关键路径 smoke 已由 `scripts/verify-governance-smoke.js` 编排为三条独立 Jest 调用（`--runInBand`、`--watchman=false`），与 Phase 6 D-15「lint + 相关测试 + 关键路径 smoke」可组合为进阶门禁。

**GitHub Actions 尚未接入**（`.github` 下无 workflow）。官方推荐模式为 `actions/checkout` + `actions/setup-node`（可选 `cache: yarn`）+ `yarn --frozen-lockfile` + 与本地相同的 npm scripts（[Building and testing Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)）。分层上建议：**PR** 跑最快反馈组合（如 `lint` + `test:ci`）；**push main 或 merge 后**再跑 `verify:governance` 与 `verify-governance-smoke`（或将其明确为进阶 job），避免把 knip/depcruise/边界 ESLint 与多次 Jest 子进程放进每一次 PR 同步推送。

**Primary recommendation:** 以「删除 D-01 示例 + 按 D-02/D-03 审计剩余用例 + 将 `shared`/`features` 相关测试路径对齐源码树」为 TST-01/02 的执行顺序；TST-03 新增 `.github/workflows/ci.yml`，用两个 job（`pr-gate` / `post-merge` 或 `governance`）映射基础与进阶命令，全部复用现有 `package.json` scripts，不手搓并行测试运行器。

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | ^30.2.0（registry latest **30.3.0**，2026-03-22 `npm view`） | 单测/集成测试运行器 | 已与 Expo RN preset、`jest.ci.config.js` 双配置落地 |
| ts-jest | ^29.4.6 | TS 转换 | `package.json` 已依赖 |
| fast-check | ^4.5.3（registry latest **4.6.0**） | 属性测试 | `__tests__/property` 已采用 |
| @testing-library/react-native | ^13.3.3 | 组件测试 | RN 社区默认搭配 Jest |
| react-test-renderer | 19.1.0 | 与 React 19 对齐 | 与 `react` 版本锁定一致 |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| GitHub Actions `setup-node` | Node + yarn 缓存 | 所有 CI job |
| 既有 Node 脚本 `verify-governance.js` / `verify-governance-smoke.js` | 治理与关键路径编排 | 进阶门禁；与 Phase 6 D-05/D-15 一致 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 分层多 workflow 文件 | 单文件多 job | 单文件更易见依赖与复用；多文件适合复用 `workflow_call`（本仓体量下通常不必） |
| PR 上跑全量 `yarn test`（含覆盖率门槛） | `yarn test:ci` | 避免 PR 因本地 80% 阈值波动阻塞；符合当前 `jest.ci.config.js` 设计 |

**Installation:** 无需为 Phase 10 更换测试框架；若 CI 缺依赖，仅需在 workflow 中安装现有 `package.json` 依赖。

**Version verification:**

```bash
npm view jest version
npm view fast-check version
npm view @testing-library/react-native version
npm view ts-jest version
```

（2026-03-22 执行结果：30.3.0、4.6.0、13.3.3、29.4.6。锁文件仍以仓库内 `yarn.lock` 为准。）

## Architecture Patterns

### Recommended Project Structure（测试侧）

在保留 `integration/`、`property/` 顶层分类的前提下，将 **`__tests__/unit` 下的子树与源码顶层目录对齐**：

```
__tests__/
├── unit/
│   ├── app/              # 对应 app/
│   ├── components/       # 对应 components/
│   ├── features/         # 对应 features/（新建，承接 profile 等 feature 测）
│   ├── hooks/
│   ├── services/
│   ├── shared/           # 对应 shared/（优先放纯函数/时间区间/formatting 测）
│   ├── store/
│   ├── utils/            # 仅保留仍测 utils/ 内实现的用例
│   └── scripts/          # 编排类脚本自测（如 verify-governance-smoke）
├── property/
└── integration/
```

**When to use colocated tests:** 若某 feature 极高内聚且团队偏好邻接，可采用 `features/foo/__tests__/`；当前仓库已集中式 `__tests__`，**扩展 `__tests__/unit/features` 迁移成本更低、与 CONTEXT「按现有 unit 结构扩展」一致**。

### Pattern 1: 双 Jest 配置（本地严 / CI 宽）

**What:** 基础配置含 `coverageThreshold`；CI 配置 `extends` 或展开合并后删除阈值。  
**When to use:** 与当前 `jest.config.js` + `jest.ci.config.js` 一致，应保留。  
**Example:**

```javascript
// 与仓库 jest.ci.config.js 同构
const base = require("./jest.config.js");
module.exports = { ...base, coverageThreshold: undefined };
```

### Pattern 2: Smoke 编排独立于「全量 test:ci」

**What:** 关键路径用显式文件列表跑 Jest（见 `scripts/verify-governance-smoke.js`），便于进阶阶段只跑最小集或在失败时快速重跑。  
**When to use:** 进阶 job 或 nightly；PR 阶段可只跑 `test:ci` 全量或进一步缩窄（需 planner 权衡漏测风险）。

### Pattern 3: GitHub Actions 分层 Job

**What:** Job A（`lint` + `test:ci`）→ Job B（`verify:governance` + smoke 脚本）用 `needs` 串联或并行独立触发。  
**When to use:** PR 仅 A；main push 或 `workflow_dispatch` 跑 A+B。

**Anti-Patterns to Avoid**

- **在 CI 里手搓 `jest` 路径列表而不复用脚本：** smoke 列表应与 `verify-governance-smoke.js` 单一来源，否则漂移。
- **PR 上默认开启全局覆盖率硬门槛：** 与现 `jest.ci.config.js` 及用户 deferred 决策冲突，除非单独开 job 且明确恢复阈值。
- **忽略 `yarn.lock`：** CI 应 `yarn install --frozen-lockfile`（或官方文档中的 `yarn --frozen-lockfile`），保证可复现。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Node 版本与依赖安装 | 自建镜像脚本 | `actions/setup-node` + yarn cache | 官方维护、文档完备 |
| 关键路径测试编排 | 在 YAML 里复制多行 jest 文件路径 | `scripts/verify-governance-smoke.js` | 已与 Phase 6 smoke 清单对齐 |
| 治理三阶段 | 自定义依赖图检查器 | `verify:governance`（knip → depcruise → boundaries eslint） | Phase 6 已定顺序与范围 |

**Key insight:** 本仓「分层」主要体现在 **命令组合与触发时机**，而非新测试框架或自研 runner。

## Common Pitfalls

### Pitfall 1: 删除/移动测试后 smoke 路径失效

**What goes wrong:** `verify-governance-smoke.js` 硬编码文件路径；移动 `storage.test.ts` 等文件会导致进阶门禁静默失败或跳过（若未跑到）。  
**Why:** 脚本未动态发现测试，仅靠静态列表。  
**How to avoid:** 任一对 record/export/sync 相关测试改名或移动时，同步更新 `SMOKE_PATHS`。  
**Warning signs:** CI 进阶 job 报 jest 找不到文件。

### Pitfall 2: 「文件名」与「被测模块」不一致导致 TST-02 长期无法达成

**What goes wrong:** 例如 `__tests__/unit/utils/dateUtils.test.ts` 实际 import `@/shared/formatting`；`reviewStatsTimeRange.test.ts` 实际测 `@/shared/time-range`。开发者按文件名会在错误目录找实现。  
**Why:** Phase 7–9 迁移后未重命名/搬迁测试文件。  
**How to avoid:** 对齐到 `__tests__/unit/shared/...` 或按 feature 分桶，并更新 README 映射表。  
**Warning signs:** code review 中反复出现「测试在哪」问题。

### Pitfall 3: 全量 Jest 与 Watchman 在 CI

**What goes wrong:** 部分环境下 watchman 不可用或 flaky。  
**Why:** 沙箱权限与守护进程差异。  
**How to avoid:** smoke 脚本已用 `--watchman=false`；若 CI 中偶发问题，可在 workflow 的 `test:ci` 上同样追加 `jest --watchman=false`（需 planner 决定是否改 script 或仅 CI env）。  
**Warning signs:** CI 仅 Linux 失败、本地 macOS 通过。

### Pitfall 4: `collectCoverageFrom` 与目录演进脱节

**What goes wrong:** `jest.config.js` 的 `collectCoverageFrom` 当前包含 `app/components/hooks/services/store/utils`，**未列 `features/`、`shared/`**；本地跑 coverage 时新目录默认不计入，易误判「覆盖率够了」。  
**Why:** 结构演进快于 Jest 配置。  
**How to avoid:** Phase 10 顺带对齐 `collectCoverageFrom`（与 TST-02 同类「边界一致」工作）。  
**Warning signs:** 新模块无 coverage 报告条目。

## Code Examples

### Jest 指定配置（CLI）

```bash
jest my-test --notify --config=config.json
```

Source: [Jest 30 Getting Started](https://jestjs.io/docs/30.0/getting-started)（Context7 `/websites/jestjs_io_30_0`）。

### GitHub Actions：Yarn + 缓存 + 测试

```yaml
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-node@v4
    with:
      node-version: '20.x'
      cache: 'yarn'
  - run: yarn --frozen-lockfile
  - run: yarn test
```

Source: [GitHub Docs - Building and testing Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 仅本地脚本、无 CI | GHA 分层 job | Phase 10 引入 | PR 反馈可预期、可阻断合并 |
| 单目录堆叠 utils 测试 | 与 `shared/` / `features/` 对齐 | Phase 10 | 降低认知负担 |

**Deprecated/outdated:** 无强制迁移到其他测试框架（REQUIREMENTS 已将重型迁移列为 v2 ENGX）。

## Open Questions

1. **PR 阶段是否跑完整 `yarn test:ci` 还是拆分 unit/property/integration？**
   - What we know: 已有 `test:unit` 等脚本；全量时间取决于用例数量。  
   - What's unclear: 可接受的 PR 最长时长。  
   - Recommendation: 默认全量 `test:ci`；若超时再拆 job 并行（注意 Jest 资源竞争）。

2. **是否在进阶门禁恢复覆盖率阈值？**
   - What we know: 用户 deferred，jest.ci 当前无 threshold。  
   - What's unclear: 团队对漏测 vs 速度的偏好。  
   - Recommendation: 进阶 job 可选 `jest --coverage` + 上传 artifact，暂不强制 threshold，直到关键路径稳定。

3. **Node 主版本 pin**
   - What we know: `package.json` 无 `engines`，无 `.nvmrc`。  
   - What's unclear: Expo SDK 54 在 CI 上的官方推荐 Node 小版本。  
   - Recommendation: CI 先用 Node 20.x LTS；后续在 `engines` 或 `.node-version` 文档化（与 Expo 文档交叉验证）。

## Validation Architecture

> `workflow.nyquist_validation` 在 `.planning/config.json` 中为 `true`，本段保留。

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest ^30.2.0 + ts-jest + react-native preset |
| Config file | `jest.config.js`（本地/覆盖率）；`jest.ci.config.js`（CI） |
| Quick run command | `yarn test:ci` 或 `yarn test:unit` |
| Full suite command | `yarn test`（等同默认 jest） |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| TST-01 | 移除示例与低价值用例后套件仍绿 | integration（全仓） | `yarn test:ci` | ✅ jest.ci.config.js |
| TST-01 | 关键路径仍被 smoke 覆盖 | smoke | `node scripts/verify-governance-smoke.js` | ✅ |
| TST-02 | 目录约定可被文档/清单检查 | manual / optional guard | 无现成自动化 | ❌ 可选 Wave 0：简单脚本列目录 |
| TST-03 | CI 分层执行约定命令 | CI | GHA workflow（待添加） | ❌ |

### Sampling Rate

- **Per task commit:** `yarn test:ci`（或受影响路径的 `yarn jest <path>`）  
- **Per wave merge:** `yarn test:release` + `yarn verify:governance -- --dry-run`（干跑快速）或全量执行视门禁级别  
- **Phase gate:** 全量 `yarn test:ci` + 进阶门禁（governance + smoke）绿后再 `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `.github/workflows/*.yml` — 覆盖 TST-03  
- [ ] （可选）`engines` 或 `.nvmrc` — 与 CI `node-version` 对齐  
- [ ] 更新 `__tests__/README.md` — 反映 `features/`、`shared/` 映射与 TST-01 删除示例后的结构  
- [ ] （可选）对齐 `jest.config.js` `collectCoverageFrom` 含 `features/`、`shared/`

## Sources

### Primary (HIGH confidence)

- 仓库：`package.json`、`jest.config.js`、`jest.ci.config.js`、`scripts/verify-governance.js`、`scripts/verify-governance-smoke.js`、`__tests__/**` 清单（2026-03-22 扫描）  
- Context7 `/websites/jestjs_io_30_0` — Jest CLI `--config`  
- [GitHub Docs: Building and testing Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs) — setup-node、yarn、缓存  

### Secondary (MEDIUM confidence)

- `.planning/phases/06-governance-baseline-gates/06-CONTEXT.md` — D-15 验证门槛、关键路径定义  
- `.planning/codebase/STRUCTURE.md` — shared/utils 边界  

### Tertiary (LOW confidence)

- Expo SDK 54 对 Node 的精确次要版本要求 — 需与 [Expo 官方文档](https://docs.expo.dev/) 当前页交叉验证后再 pin CI。

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — 与 lockfile/配置文件一致，registry 版本已抽查  
- Architecture: **HIGH** — 基于现有脚本与目录扫描  
- Pitfalls: **MEDIUM-HIGH** — 含已观察到的「测试文件命名错位」物证  

**Research date:** 2026-03-22  
**Valid until:** ~2026-04-22（Jest/GHA 小版本频繁时可缩短）
