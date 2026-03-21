# Governance Refactor PR Template (Phase 06)

> 适用范围：治理相关重构小包 PR。默认遵循小步推进与可回滚策略。

## D-13 小包原则

- 每个 PR 控制在同主题小范围（建议 1-2 文件，或一个最小闭环）。
- 禁止把不相关改动混入同一个 PR。
- 每个小包都必须有独立回滚点（commit hash/tag）。

## 必填字段（D-14）

### 1) 目的

- 本次改动要解决什么问题？
- 对应哪个治理目标/需求（如 GOV-02/GOV-03）？

### 2) 改动范围

- 修改了哪些文件？
- 影响哪些模块或路径（记录/导出/同步）？

### 3) 风险

- 潜在回归点是什么？
- 哪些用户可见行为最容易受影响？

### 4) 验证

- 自动化验证：
  - `npm run lint`
  - 相关测试（请写明具体命令）
  - `node scripts/verify-governance-smoke.js`
- 手测验证：
  - 记录路径：
  - 导出路径：
  - 同步路径：

### 5) 回滚点

- 当前小包回滚 commit/tag：
- 回滚后如何验证恢复（命令 + 手测）：

## D-16 行为偏差先回退原则

- 一旦发现行为偏差，先回退当前包，不允许“先带病合并后修”。
- 回退后必须补充失败证据与原因分析，再重新拆包提交。

## PR 填写示例（可复制）

### 目的

- 修复导出路径统计字段漂移，满足 GOV-03 一致性护栏要求。

### 改动范围

- `scripts/verify-governance-smoke.js`
- `.planning/phases/06-governance-baseline-gates/06-SMOKE-CHECKLIST.md`

### 风险

- smoke 命令编排改动可能导致本地/CI 运行口径不一致。

### 验证

- 自动化：`node scripts/verify-governance-smoke.js --dry-run`
- 手测：导出页面字段与相册保存路径确认通过。

### 回滚点

- `abc1234`（示例）
