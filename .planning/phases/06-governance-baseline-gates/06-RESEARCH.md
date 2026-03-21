# Phase 6: 治理基线与门禁 - Research

**Researched:** 2026-03-21  
**Domain:** React Native/Expo 工程治理基线、依赖边界门禁、渐进式 CI 策略  
**Confidence:** HIGH

## User Constraints (from CONTEXT.md)

### Locked Decisions
### 基线快照与验收护栏
- **D-01:** 关键路径最小集合锁定为：**记录 + 导出 + 同步**（不把 AI 与登录迁移纳入 Phase 6 必测主集）。
- **D-02:** 基线证据采用**混合模式**：手测脚本 + 少量自动化断言（避免纯手测不稳，也避免自动化过重拖慢阶段推进）。
- **D-03:** 导出链路一致性校验采用**结构化断言**（统计字段与关键文本一致），不依赖像素级图像快照。
- **D-04:** 基线产物统一落在 ` .planning/phases/06-governance-baseline-gates/ ` 下，便于审计与回溯。

### 工具接入顺序与范围
- **D-05:** 工具接入顺序固定为：`knip` -> `dependency-cruiser` -> `eslint-plugin-boundaries`。
- **D-06:** 初期覆盖目录为：`app/`、`components/`、`store/`、`utils/`、`hooks/`、`services/`、`lib/`（先不纳入 `ios/`、`android/`、文档目录）。
- **D-07:** 历史问题采用**基线快照 + allowlist**策略，只阻断新增问题，不要求 Phase 6 一次性清零历史包袱。
- **D-08:** 工具输出以“phase 文档下摘要 + CI 可复现命令”为准，不把完整大报告全部入库。

### 门禁策略（渐进收紧）
- **D-09:** Phase 6 默认门禁级别：**report 为主，关键项 warn**。
- **D-10:** 从 warn 升级到 error 的统一条件：**连续两轮 PR 新增违规 = 0** 才升级。
- **D-11:** 本里程碑内可升级到 error 的候选项：跨层越界 import、新增循环依赖、新增未使用导出。
- **D-12:** 门禁失败默认**阻断合并**，但允许通过“revert 当前包/临时降级规则并留痕”快速解锁流水线。

### 执行工作流与回滚原则
- **D-13:** 单个重构 PR 体量控制为**小步**（1-2 文件或同主题小范围）。
- **D-14:** 每个 PR 必须包含模板字段：目的、改动范围、风险、验证、回滚点。
- **D-15:** 每个包最低验证门槛固定：`lint + 相关测试 + 关键路径 smoke`。
- **D-16:** 发生行为偏差时遵循**行为稳定优先**：先回退该包并记录问题，禁止“先带病合并后修”。

### Claude's Discretion
- 治理命令命名与脚本组织（如 `verify:governance` / `verify:boundaries`）的具体命名可由实现阶段确定。
- 基线文档的表格字段（案例 ID、断言字段、证据链接）可按可读性微调。

### Deferred Ideas (OUT OF SCOPE)
- 将 AI、登录迁移纳入 Phase 6 关键路径护栏（暂不纳入，后续按阶段需求再加）。
- 全仓（含 `ios/`、`android/`、文档）统一纳入治理规则（Phase 6 先不做）。
- 一次性切换到全 error 强阻断（保留为后续门禁成熟后再评估）。

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GOV-01 | 建立治理脚手架（结构规范、检查命令、执行说明），本地一键运行 | 标准栈给出 `knip + depcruise + boundaries`，并提供统一 `verify` 脚本编排模式 |
| GOV-02 | report/warn -> error 渐进收紧，并写清切换条件 | 规则分级策略、升级阈值、allowlist 与“新增违规阻断”机制 |
| GOV-03 | 关键路径“重构前后行为一致”护栏（记录/导出/同步） | 基于现有 Jest 测试入口，建立关键路径 smoke + 结构化断言清单 |

## Summary

本阶段不是“功能开发”，而是把后续重构变成“可控工程行为”：先建立检测脚手架，再把规则从 report/warn 渐进收紧到 error，最后用关键路径（记录、导出、同步）保证“改结构不改行为”。当前仓库已具备可复用基础（`eslint.config.js`、`jest.config.js`、`scripts/verify-*.js`），因此最佳策略是增量接入而非推倒重建。

`knip`、`dependency-cruiser`、`eslint-plugin-boundaries` 的组合能够分别覆盖“未使用代码/依赖”、“依赖图违规（循环、越层）”、“编辑期边界约束”三层防线，且都支持从宽松到严格的策略推进，符合 D-09~D-11。结合 D-07（历史问题不一次性清零），推荐采用“基线快照 + allowlist + 只阻断新增”的上线路径，避免 Phase 6 因历史债务卡死。

关键路径验收方面，项目现有测试资产已覆盖导出统计与同步相关行为（如 `reviewExportDerived`、`syncStatus`、`storage`），可以用最小增量方式形成治理门禁闭环：每个小包执行 `lint + 定向测试 + 关键路径 smoke`，并将证据摘要沉淀到 phase 文档目录以满足审计和回滚需求。

**Primary recommendation:** 按 `knip -> depcruise -> boundaries` 顺序分三步接入，先 report 建基线，再将“新增循环/越层/未使用导出”升到 warn，满足连续两轮 0 新增后再升 error。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| knip | 6.0.1 | 检测未使用依赖、导出、文件 | 适合先做“治理可见化”，输出易审计，支持零配置起步 |
| dependency-cruiser | 17.3.9 | 依赖图分析（循环依赖、越层、allowed/forbidden） | 架构约束表达力强，CLI/规则成熟，适合 CI 门禁 |
| eslint-plugin-boundaries | 6.0.1 | 在 ESLint 阶段实时阻断非法 import | 开发时即时反馈，和现有 ESLint 流水线天然融合 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint | 9.25.0（项目现有） | 挂载 boundaries 规则与统一 lint 门禁 | Phase 6 全程 |
| jest | 30.2.0（项目现有） | 关键路径行为一致性断言 | 每个小包最小回归 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dependency-cruiser | madge | madge 更轻但规则表达弱，不利于渐进治理门禁 |
| eslint-plugin-boundaries | eslint-plugin-import 自定义规则 | 可行但规则组织复杂、可读性与可维护性较差 |
| knip | ts-prune + depcheck 拼装 | 组合方案碎片化，结果口径不统一 |

**Installation:**
```bash
npm install -D knip dependency-cruiser eslint-plugin-boundaries
```

**Version verification:**  
- `knip@6.0.1`（published: 2026-03-20）  
- `dependency-cruiser@17.3.9`（published: 2026-03-12）  
- `eslint-plugin-boundaries@6.0.1`（published: 2026-03-20）

## Architecture Patterns

### Recommended Project Structure
```text
scripts/
├── verify-governance.js        # 统一编排 knip/depcruise/eslint-boundaries
├── verify-governance-smoke.js  # 关键路径 smoke 编排（记录/导出/同步）
└── governance/
    ├── allowlist.knip.json     # 历史债务白名单
    ├── depcruise.cjs           # forbidden/allowed 规则
    └── boundaries.cjs          # eslint boundaries 元素定义

.planning/phases/06-governance-baseline-gates/
├── 06-BASELINE.md              # 初次基线快照与说明
├── 06-GATE-RULES.md            # report/warn/error 切换条件与记录
└── 06-SMOKE-CHECKLIST.md       # 关键路径手测+自动化混合证据
```

### Pattern 1: 三层治理门禁（可渐进收紧）
**What:** 静态死代码检测（knip）+ 依赖图约束（depcruise）+ 开发期 import 边界（eslint boundaries）。  
**When to use:** 需要“先可见再收紧”的重构阶段。  
**Example:**
```typescript
// Source: https://raw.githubusercontent.com/sverweij/dependency-cruiser/main/README.md
// depcruise 规则核心：forbidden/allowed + severity
export default {
  forbidden: [
    {
      name: "no-circular",
      severity: "warn",
      from: {},
      to: { circular: true }
    }
  ]
};
```

### Pattern 2: 基线快照 + 新增违规阻断
**What:** 首次运行生成基线，历史项进入 allowlist，仅对新增违规失败。  
**When to use:** 历史债务较多，无法一次性清零。  
**Example:**
```typescript
// Source: https://knip.dev/overview/configuration
// knip 配置文件可固定分析范围，配合 allowlist 做增量治理
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "project": ["app/**/*", "components/**/*", "store/**/*", "utils/**/*", "hooks/**/*", "services/**/*", "lib/**/*"]
}
```

### Pattern 3: 统一 verify 编排脚本
**What:** 复用现有 `scripts/verify-*.js` 风格，统一输出与退出码。  
**When to use:** 需要本地/CI 同一命令、可审计输出。  
**Example:**
```javascript
// Source: repo existing pattern (scripts/verify-all-configs.js)
const { execSync } = require("child_process");
execSync("npm run lint", { stdio: "inherit" });
execSync("npm run test -- --runInBand __tests__/unit/utils/reviewExportDerived.test.ts", { stdio: "inherit" });
```

### Anti-Patterns to Avoid
- **一次性全 error：** 会被历史债务拖死，违背 D-09/D-10 的渐进策略。
- **把完整大报告直接入库：** 噪音高、评审成本大，违背 D-08。
- **先改目录后补门禁：** 风险顺序反了，容易出现“重构后才发现漂移”。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 未使用依赖/导出检测 | 自写 AST 扫描脚本 | knip | 插件生态与误报处理更成熟 |
| 循环依赖和跨层检查 | 自写 import 图遍历器 | dependency-cruiser | 规则表达与报告能力完善 |
| 目录边界 lint | 自定义 ESLint rule 从零写 | eslint-plugin-boundaries | 已有元素建模与规则体系 |

**Key insight:** Phase 6 核心是“治理可执行化”而不是“造治理工具”，自研会把周期消耗在工具正确性而非业务稳定性。

## Common Pitfalls

### Pitfall 1: 基线范围过大导致噪音淹没
**What goes wrong:** 一上来全仓扫描，误报和历史问题过多，团队忽视结果。  
**Why it happens:** 没有按 D-06 先收敛目录范围。  
**How to avoid:** 第一版严格限定到 `app/components/store/utils/hooks/services/lib`。  
**Warning signs:** 首次报告超过百条且难以分类。

### Pitfall 2: allowlist 失控
**What goes wrong:** 白名单长期膨胀，治理形同虚设。  
**Why it happens:** 只加不减、无升级条件。  
**How to avoid:** 与 D-10 绑定：连续两轮 PR 新增违规=0 才升级，并定期清理 allowlist。  
**Warning signs:** 每次违规都通过“临时放行”解决。

### Pitfall 3: 只做静态规则，不做行为护栏
**What goes wrong:** 结构变好看了，但记录/导出/同步行为发生漂移。  
**Why it happens:** 把治理误解成“仅 lint”。  
**How to avoid:** 每包强制执行 `lint + 相关测试 + 关键路径 smoke`（D-15）。  
**Warning signs:** lint 全绿但用户路径回归失败。

## Code Examples

Verified patterns from official sources:

### Dependency-cruiser 初始化与执行
```bash
# Source: https://raw.githubusercontent.com/sverweij/dependency-cruiser/main/README.md
npx depcruise --init
npx depcruise src
```

### ESLint Boundaries 快速接入（Flat Config）
```javascript
// Source: https://www.jsboundaries.dev/docs/quick-start/
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "app/*" },
        { type: "components", pattern: "components/*" },
        { type: "store", pattern: "store/*" },
        { type: "utils", pattern: "utils/*" }
      ]
    },
    rules: {
      ...boundaries.configs.recommended.rules
    }
  }
];
```

### Knip 最小起步
```bash
# Source: https://knip.dev/overview/getting-started
npm init @knip/config
npm run knip
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| “人工巡检 + 评审经验” | “静态分析 + 规则配置 + 渐进门禁” | 近年工程治理实践普及 | 可量化、可自动化、可追责 |
| 一次性严门禁 | report/warn 到 error 分阶段演进 | 工具与团队协作成熟后 | 降低治理落地阻力 |

**Deprecated/outdated:**
- 单纯依赖人工 Code Review 识别边界问题：覆盖率低、无法稳定复现。

## Open Questions

1. **关键路径 smoke 的自动化粒度要多深？**
   - What we know: 当前已有导出与同步相关测试基础。
   - What's unclear: 是否在 Phase 6 增加 UI 层录制脚本，还是先以结构化断言为主。
   - Recommendation: 先保守采用“结构化断言 + 手测脚本”，避免 Phase 6 过重。

2. **边界元素如何映射最小且稳定？**
   - What we know: 目录范围已锁定（D-06）。
   - What's unclear: `app` 与 `components` 的互相引用细则需要一次梳理。
   - Recommendation: 首版只阻断明显越层与循环，复杂规则放到后续阶段迭代。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 |
| Config file | `jest.config.js`, `jest.ci.config.js` |
| Quick run command | `npm run test -- --runInBand __tests__/unit/utils/reviewExportDerived.test.ts __tests__/unit/store/syncStatus.test.ts __tests__/unit/store/storage.test.ts` |
| Full suite command | `npm run test:ci` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GOV-01 | 治理脚手架可本地一键运行 | smoke | `npm run verify:governance`（Phase 6 新增） | ❌ Wave 0 |
| GOV-02 | report/warn/error 渐进规则可执行 | integration | `npm run verify:boundaries`（Phase 6 新增） | ❌ Wave 0 |
| GOV-03 | 记录/导出/同步行为一致 | unit + smoke | `npm run test -- --runInBand __tests__/unit/utils/reviewExportDerived.test.ts __tests__/unit/store/syncStatus.test.ts __tests__/unit/store/storage.test.ts` | ✅ |

### Sampling Rate
- **Per task commit:** `npm run lint && npm run test -- --runInBand __tests__/unit/utils/reviewExportDerived.test.ts __tests__/unit/store/syncStatus.test.ts __tests__/unit/store/storage.test.ts`
- **Per wave merge:** `npm run test:ci`
- **Phase gate:** `npm run verify:governance && npm run test:ci`

### Wave 0 Gaps
- [ ] `scripts/verify-governance.js` — 统一串联 knip/depcruise/boundaries（覆盖 GOV-01/GOV-02）
- [ ] `scripts/governance/depcruise.cjs` — 目录边界规则与 severities（覆盖 GOV-02）
- [ ] `scripts/governance/boundaries.cjs` 或 ESLint 内联配置片段 — 元素定义与依赖规则（覆盖 GOV-02）
- [ ] `knip.json`（或 `package.json#knip`）+ allowlist 文件 — 历史问题快照基线（覆盖 GOV-01）

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view ... version time`) - 版本与发布时间核验  
- [Knip Getting Started](https://knip.dev/overview/getting-started) - Node 要求与起步命令  
- [Knip Configuration](https://knip.dev/overview/configuration) - 配置文件位置、project 范围策略  
- [dependency-cruiser README](https://raw.githubusercontent.com/sverweij/dependency-cruiser/main/README.md) - 初始化、执行、规则模型  
- [dependency-cruiser rules reference](https://raw.githubusercontent.com/sverweij/dependency-cruiser/main/doc/rules-reference.md) - forbidden/allowed/allowedSeverity 语义  
- [JS Boundaries Quick Start](https://www.jsboundaries.dev/docs/quick-start/) - ESLint flat config 与 recommended 渐进接入

### Secondary (MEDIUM confidence)
- 仓库现有脚手架模式：`scripts/verify-all-configs.js`、`jest.config.js`、`eslint.config.js`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 版本与官方文档双重核验
- Architecture: HIGH - 与项目现有脚手架模式一致，且满足锁定决策
- Pitfalls: MEDIUM - 部分来自工程实践归纳，已结合当前约束校准

**Research date:** 2026-03-21  
**Valid until:** 2026-04-20
