# Phase 06 Governance Smoke Checklist

> 目标：对关键路径（记录 / 导出 / 同步）执行“自动化 + 手测”混合验收，并沉淀可追溯证据。

## 使用方式

1. 先执行自动化 smoke（`node scripts/verify-governance-smoke.js` 或 `--dry-run` 预检）。
2. 再按本清单完成手测。
3. 每个路径都填写证据字段，确保可复盘、可回滚。

## 证据记录模板

| 案例ID | 路径 | 命令/操作 | 结果（Pass/Fail） | 证据链接/截图说明 | 回滚点（commit/tag） | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| GOV-SMOKE-XXX | 记录/导出/同步 | 具体命令或手测步骤 | Pass/Fail | 证据说明 | commit hash/tag | 可选 |

## 路径 1：记录（Record）

### 自动化

- 命令：`node scripts/verify-governance-smoke.js`
- 关注项：
  - 输出必须包含 `record` 路径执行。
  - 退出码稳定（成功为 0）。

### 手测

1. 新建一条情绪记录并保存。
2. 编辑该记录后再次保存。
3. 返回列表和详情页，确认内容一致、无异常提示。

### 证据位

- 案例ID：`GOV-SMOKE-RECORD-01`
- 命令：`node scripts/verify-governance-smoke.js`
- 结果：
- 回滚点：

## 路径 2：导出（Export）

### 自动化

- 命令：`node scripts/verify-governance-smoke.js`
- 关注项：
  - 输出必须包含 `export` 路径执行。
  - 明确声明“结构化断言”（不使用像素级截图比对）。
  - 关键统计字段与关键文本一致性由结构化断言覆盖。

### 手测

1. 打开回顾导出页并生成导出图。
2. 核对范围、陪伴天数、解决率、Top 天气/触发器、一句话总结等关键字段。
3. 保存到相册并确认保存成功提示。

### 证据位

- 案例ID：`GOV-SMOKE-EXPORT-01`
- 命令：`node scripts/verify-governance-smoke.js`
- 结果：
- 回滚点：

## 路径 3：同步（Sync）

### 自动化

- 命令：`node scripts/verify-governance-smoke.js`
- 关注项：
  - 输出必须包含 `sync` 路径执行。
  - 同步状态相关测试被显式纳入 smoke。

### 手测

1. 登录可同步账号（如已登录则跳过）。
2. 触发一次同步并等待完成状态。
3. 检查无错误提示，且本地与远端状态一致。

### 证据位

- 案例ID：`GOV-SMOKE-SYNC-01`
- 命令：`node scripts/verify-governance-smoke.js`
- 结果：
- 回滚点：

## 失败处理

- 任一路径失败：先记录失败证据，再按“行为偏差先回退”原则回退当前小包。
- 回退后重新执行 smoke 与对应手测，直到恢复稳定。
