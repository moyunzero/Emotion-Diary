# Domain Pitfalls

**Domain:** React Native + TypeScript（v1.1 工程重构与代码治理）
**Researched:** 2026-03-21

## Critical Pitfalls

### Pitfall 1: 大文件硬拆导致行为漂移（尤其是状态与副作用时序）

**What goes wrong:** 把 `app/profile.tsx`、`store/useAppStore.ts` 这类超大文件按“文件行数”硬切，而不是按稳定业务边界切，导致状态来源分裂、Hook 执行顺序变化、导出统计口径不一致。  
**Why it happens:** 重构目标只盯“变小”，忽略“单一事实来源（single source of truth）”与副作用依赖链。  
**Consequences:** 回顾图数值前后不一致、伴随天数/解决率回归、线上出现难复现 bug。  
**Prevention:**  

- 先画“依赖地图”：状态源、派生链、I/O 副作用，再决定拆分边界。  
- 先抽“纯函数/纯派生”，后拆 UI 与容器，最后再移动目录。  
- 对关键口径建立黄金样本测试（解决率、环比、Top 天气、Top 触发器、陪伴天数）。  
- 每次拆分控制在“单文件或单职责”粒度，保证可回滚。  
**Detection (warning signs):**  

- 同一指标在两个组件或两个 selector 里重复计算。  
- 拆分后 diff 很大但新增测试很少。  
- PR 描述无法一句话说明“唯一数据源在哪”。  
**Suggested phase:** Phase A「重构前基线与口径冻结」+ Phase B「大文件分治实施」

### Pitfall 2: 目录重构先动路径后动依赖，触发隐式循环依赖

**What goes wrong:** 先大规模改 import 路径和目录层级，再处理模块职责，出现 feature 与 shared 互相引用、跨层反向依赖。  
**Why it happens:** 把目录整理当成“纯机械移动”，未先定义边界规则（谁可以依赖谁）。  
**Consequences:** Metro 缓存异常、热更新不稳定、后续改动牵一发而动全身。  
**Prevention:**  

- 先定义依赖方向（`app -> features -> shared`，禁止反向）。  
- 建立 alias 与边界 lint（如 import/no-cycle、边界规则）后再迁移。  
- 目录迁移采用“适配层过渡”：先保留 re-export，分批替换引用。  
**Detection (warning signs):**  

- `index.ts` 桶文件越来越重，开始“万能导出”。  
- 新模块必须跨 3 层目录才能拿到类型/工具。  
- CI 中偶发循环依赖告警或 bundle 体积异常上涨。  
**Suggested phase:** Phase C「目录与依赖治理（含 lint 护栏）」

### Pitfall 3: 死代码清理误删运行时动态引用

**What goes wrong:** 仅依赖静态分析删除“未引用”代码，误删动态 import、按平台分支、反射式注册或环境变量门控代码。  
**Why it happens:** 误把“工具报告未引用”当成“100% 可删”；忽略 Expo/RN 的平台摇树与 side effects 规则。  
**Consequences:** Android/iOS 某一端功能静默失效，发布后才暴露。  
**Prevention:**  

- 死代码分三类：确定可删、需要运行时验证、暂缓观察。  
- 对 `Platform.OS`、`Platform.select`、动态 import、feature flag 相关代码建立白名单。  
- 清理后必须跑双端 smoke（iOS/Android）+ 关键路径手测。  
**Detection (warning signs):**  

- 代码“没引用”但在配置/路由/注册表中被字符串引用。  
- 改动主要是删除，但没有新增任何验证步骤。  
- 仅在单平台验证通过就准备合并。  
**Suggested phase:** Phase D「死代码清理与双端验证」

### Pitfall 4: 测试清理变成“删红线”，丢失重构安全网

**What goes wrong:** 以“提速”为目标删除慢测与重复测时，把真正保护重构的关键行为测试也删掉，导致后续重构可测性塌陷。  
**Why it happens:** 未先给测试分层（契约测试/关键路径集成测试/低价值快照测试），只按“慢/不稳定”粗暴清理。  
**Consequences:** 回归在发布前难以发现；团队对测试失去信任。  
**Prevention:**  

- 先建“必须保留清单”：统计口径、导出流程、AI 兜底、权限与相册保存路径。  
- 替换而非直接删除：将脆弱快照测试改为行为断言。  
- CI 分层执行：PR 跑关键路径，夜间跑全量。  
- 在资源紧张 CI 下显式设置 `maxWorkers`（如 50%）降低随机抖动。  
**Detection (warning signs):**  

- 测试数量下降明显，但关键路径覆盖说明为空。  
- `bail` 提前退出掩盖后续失败，失败信息变少。  
- “清理测试”PR 几乎没有业务行为断言。  
**Suggested phase:** Phase E「测试组合治理与 CI 稳定性」

## Moderate Pitfalls

### Pitfall 1: 共享工具函数“统一”后语义被偷换

**What goes wrong:** 把多个相似工具合并成一个通用函数时，忽略历史语义差异（如时间区间闭开边界、空值处理策略）。  
**Prevention:**  

- 为每个工具函数写输入输出契约与边界 case。  
- 先保持兼容（wrapper），再渐进收敛调用方。  
**Suggested phase:** Phase B

### Pitfall 2: Barrel/聚合导出滥用，造成隐式耦合与 tree-shaking 失效

**What goes wrong:** 为了“导入好看”大量使用 `export *`，导致依赖不可见、摇树效果变差、包体上涨。  
**Prevention:**  

- shared 层只暴露显式命名导出；避免“星号一把梭”。  
- 对大模块强制按需导入，避免 namespace import。  
**Suggested phase:** Phase C + Phase D

### Pitfall 3: 重构期间忽略性能回归

**What goes wrong:** 组件拆分后渲染层级增加、重复 selector 计算增多，导致 JS 线程掉帧。  
**Prevention:**  

- 在 release 构建下对关键页面做前后对比（不是 dev 模式）。  
- 对重计算路径加 memo/selector 缓存并验证收益。  
**Suggested phase:** Phase B + Phase E

## Minor Pitfalls

### Pitfall 1: 命名与目录约定只写文档不落工具

**What goes wrong:** 规范存在但无人执行，几周后结构再次漂移。  
**Prevention:** 将约定转成 lint/脚本检查，并在 PR 模板要求勾选。  

**Suggested phase:** Phase C

### Pitfall 2: 一次性超大 PR

**What goes wrong:** 审查质量下降，问题只能上线后发现。  
**Prevention:** 控制为“小步可回滚”PR，每个 PR 只解决一个治理目标。  

**Suggested phase:** 全阶段通用

## Integration Pitfalls（本里程碑特有）

### Pitfall 1: 工程治理改动破坏既有导出主线

**What goes wrong:** 重构时改动了统计聚合与导出渲染链路的连接点，导致“看起来可编译，导出却错数据”。  
**Prevention:**  

- 锁定导出链路契约测试：`derived -> screen -> export`。  
- Phase 级验收中强制包含“同一数据样本的 UI 与导出一致性检查”。  
**Suggested phase:** Phase A/B/E

### Pitfall 2: App Store 相关素材与文案路径在目录迁移中失联

**What goes wrong:** 目录重构后，提交清单引用的截图/文案路径失效，影响提审复用。  
**Prevention:**  

- 对 `app-store-submission` 建立路径健康检查脚本。  
- 迁移 PR 必含“提审资产可达性”核对项。  
**Suggested phase:** Phase C

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Warning Sign | Mitigation |
| --- | --- | --- | --- |
| A. 重构前基线与口径冻结 | 先重构后补测试 | 指标口径文档为空 | 先建立黄金样本与契约测试再动代码 |
| B. 大文件分治实施 | 拆分导致状态漂移 | 同一数据多处计算 | 先抽纯函数与 selector，再拆组件/容器 |
| C. 目录与依赖治理 | 循环依赖与跨层导入 | import/no-cycle 告警增长 | 先加边界 lint，再分批迁移目录 |
| D. 死代码清理与双端验证 | 误删动态/平台代码 | 单平台通过即合并 | 运行时白名单 + iOS/Android 双端 smoke |
| E. 测试组合治理与 CI 稳定性 | 关键测试被误删 | 数量下降但覆盖盲区变大 | 建立必须保留清单 + 分层 CI + maxWorkers |

## Sources

- Expo docs: Tree shaking and code removal (official, HIGH)  
  [https://docs.expo.dev/guides/tree-shaking](https://docs.expo.dev/guides/tree-shaking)
- React Native docs: Performance Overview (official, HIGH)  
  [https://reactnative.dev/docs/performance](https://reactnative.dev/docs/performance)
- Jest docs: `maxWorkers` (official, HIGH)  
  [https://jestjs.io/docs/configuration#maxworkers-number--string](https://jestjs.io/docs/configuration#maxworkers-number--string)
- Jest docs: `bail` (official, HIGH)  
  [https://jestjs.io/docs/configuration#bail-number--boolean](https://jestjs.io/docs/configuration#bail-number--boolean)
- Callstack blog: RN monorepo with Yarn workspaces（实践参考，MEDIUM）  
  [https://callstack.com/blog/a-practical-guide-to-react-native-monorepo-with-yarn-workspaces](https://callstack.com/blog/a-practical-guide-to-react-native-monorepo-with-yarn-workspaces)
- Community case studies about large-file split / flaky tests（趋势参考，LOW，需要结合本仓验证）  
  [https://ef-map.com/blog/app-tsx-refactoring-custom-hooks](https://ef-map.com/blog/app-tsx-refactoring-custom-hooks)  
  [https://shift.infinite.red/fix-flaky-jest-tests-in-ci-with-maxworkers-and-why-it-works-e3d3189f35a4](https://shift.infinite.red/fix-flaky-jest-tests-in-ci-with-maxworkers-and-why-it-works-e3d3189f35a4)
