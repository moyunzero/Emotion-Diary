# Phase 9: 目录边界治理与冗余清理 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 09-dir-boundary-cleanup
**Areas discussed:** 目录边界可执行化, 死代码删除策略, 冗余清理与 allowlist, 双端验证粒度

---

## 1. 目录边界可执行化

| Option | Description | Selected |
|--------|-------------|----------|
| Q1-1: 是 | 将 features/ 纳入 depcruise、boundaries | ✓ |
| Q1-2: 否 | 本阶段暂不纳入 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q2-1: 与 app 同级 | features 只能被 app 引用，可引用 components/store 等 | ✓ |
| Q2-2: 等同 feature 层 | 在层次中加 feature 层，明确 app→features→components 依赖 | |
| Q2-3: 由 planner 定 | 只决定纳入，具体层级交给 planner | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q3-1: 全部三项 | 跨层越界、循环依赖、未使用导出 都升 error | ✓ |
| Q3-2: 仅跨层+循环 | 未使用导出仍 warn | |
| Q3-3: 仅未使用导出 | 先控导出噪声 | |
| Q3-4: 按 06 条件 | 连续两轮 PR 新增违规=0 再升 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q4-1: 严格 | features 不可互引，仅可引用 shared/components/store/utils | ✓ |
| Q4-2: 宽松 | features 间可引用 | |
| Q4-3: 由 planner 定 | 只要求纳入检查 | |

**Notes:** 用户选择全部严格选项，明确可执行化方向。

---

## 2. 死代码删除策略

| Option | Description | Selected |
|--------|-------------|----------|
| Q1-1: 一次性 | 先全量迁移再删，改动集中 | |
| Q1-2: 分块 | 按模块分批（responsiveUtils→dateUtils→reviewStatsTimeRange），每批独立 PR | ✓ |
| Q1-3: 由 planner 拆 | 2–3 个计划，顺序在计划里写死 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q2-1: PR + SUMMARY | 每个计划有 SUMMARY，说明删了什么、回滚点 | ✓ |
| Q2-2: 再加 09-DELETIONS | 集中记录删除路径与替代入口 | |
| Q2-3: 仅 SUMMARY | 不单独维护删除清单 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q3-1: 是 | Phase 9 结束时 deprecated 必须清零或只剩无调用点薄壳 | ✓ |
| Q3-2: 否 | 允许保留仍有调用的 deprecated | |
| Q3-3: 混合 | 清零约定几条，其余延后 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q4-1: 先 knip 报告驱动 | 以工具报告为准，逐项删或加 allowlist | ✓ |
| Q4-2: 先按计划删 deprecated | 工具只做门禁 | |
| Q4-3: 并行 | 同时含工具基线更新与 deprecated 迁移 | |

**Notes:** 分块删除、证据留 PR+SUMMARY、deprecated 清零、knip 驱动。

---

## 3. 冗余清理与 allowlist

| Option | Description | Selected |
|--------|-------------|----------|
| Q1-1: 是 | 删代码/迁移后同步收紧 allowlist | ✓ |
| Q1-2: 否 | 本阶段只动代码 | |
| Q1-3: 仅 knip | 只收紧 knip | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q2-1: 当场修 | 本 PR 内修掉或补豁免并说明 | ✓ |
| Q2-2: 先记技术债 | 登记，不阻塞 | |
| Q2-3: 回退收紧 | 保持可合并 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q3-1: 是 | Phase 9 结束 verify:governance 全绿 | ✓ |
| Q3-2: 否 | lint + test:ci 即可 | |
| Q3-3: 仅新增 error | 旧基线可 warn | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q4-1: 是 | 在 STRUCTURE/CONVENTIONS 写明 shared/utils 边界 | ✓ |
| Q4-2: 否 | 只在 CONTEXT 写一句 | |
| Q4-3: 单独 ADR | 小文档一条 | |

**Notes:** allowlist 同步收紧、违规当场修、governance 全绿、文档更新 shared/utils 边界。

---

## 4. 双端验证粒度

| Option | Description | Selected |
|--------|-------------|----------|
| Q1-1: 必须 | iOS + Android 各至少一次 smoke | |
| Q1-2: 脚本为主 | verify:governance + 关键路径自动化；双端手测为可选 | ✓ |
| Q1-3: 一轮选一端 | 本阶段只做一端 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q2-1: 06-SMOKE-CHECKLIST | 沿用记录/导出/同步 | |
| Q2-2: 扩展 | Phase 9 扩展 smoke，加入删除/迁移路径相关检查项 | ✓ |
| Q2-3: 由 verifier 列 | 不先改 06 文档 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q3-1: 模拟器双端可接受 | | |
| Q3-2: 必须至少一端真机 | 若做手测，需包含至少一端真机 | ✓ |
| Q3-3: 以 CI 为准 | 手测标「待补」 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Q4-1: Phase 9 只做 smoke | 测试重组留给 Phase 10 | |
| Q4-2: 顺带整理 | 与删代码同文件的明显重复测试可一并清理 | ✓ |
| Q4-3: 其他 | | |

**Notes:** 脚本为主、扩展 smoke、手测需至少一端真机、顺带整理同文件重复测试。

---

## Claude's Discretion

- depcruise/boundaries 具体规则配置
- 删除批次内文件顺序
- 09-DELETIONS.md 是否创建

## Deferred Ideas

- 测试目录与代码边界全面对齐 — Phase 10
- 全仓统一纳入治理 — 后续评估
- AI、登录路径纳入 smoke — 保持 06 主集
