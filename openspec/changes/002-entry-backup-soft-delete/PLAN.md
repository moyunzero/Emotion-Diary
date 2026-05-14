# PLAN：002-entry-backup-soft-delete

## 实施进度摘要

| 原计划步骤 | 状态 |
|------------|------|
| 数据模型 + 软删字段 + 列表/天气过滤 | **已落地**（见 `types.ts`、`visibility.ts`、`entries.ts`） |
| `deleteEntry` 软删；墓碑与永久删分流 | **已落地** |
| 快照服务（登录前/退出前/手动快照表） | **未做**（阶段二） |
| 恢复 UI + 按快照 merge | **未做**；当前仅有 **拉云合并**（同 id 云端优先） |
| 文案区分「同步」与「命名快照恢复」 | 部分（云恢复路径有）；快照 UI 待阶段二 |

## 前置阅读

- [ ] `AGENTS.md`
- [ ] `openspec/README.md`
- [ ] `openspec/changes/002-entry-backup-soft-delete/SPEC.md`
- [ ] `openspec/engineering-quality.md` §1–§2
- [ ] `openspec/state-management.md`（同步与 `deleteEntry` 契约）
- [ ] 相关源码：`store/modules/entries.ts`、`store/useAppStore.ts`、`store/modules/user.ts`、`types.ts`

## 假设

- 待与产品确认：`SPEC.md` 末尾「开放问题」三项后再拆阶段二。

## 实施步骤（草案，随 SPEC 定稿调整）

1. **数据模型**：为 `MoodEntry` 增加软删字段或状态；迁移与默认；列表/天气过滤规则。
   - 验证：`yarn typecheck`；单测字段 round-trip。

2. **删除路径**：`deleteEntry` 改为软删；可选 `permanentlyPurgeEntry` 写墓碑 + 删云（若产品需要）。
   - 验证：单测 + 手工主列表与回收站。

3. **快照服务**：序列化、存储键或 Supabase 表/Storage、触发点（手动/自动/登录前/退出前）。
   - 验证：离线生成快照、读回 JSON 一致。

4. **恢复 UI + merge**：按 UUID 合并、云端新版优先 + 本地独有上传规则与单测。
   - 验证：`yarn test` 相关用例；双设备场景说明文档。

5. **文案与入口**：区分「同步」与「从备份恢复」；更新 `recoverFromCloud` 提示。
   - 验证：E2E 或手工清单。

## 风险与回滚

- **风险**：迁移失败导致旧数据不可读；快照体积与费用。
- **回滚方式**：功能开关（远程配置或常量）关闭快照写入；保留硬删前行为需另分支评估。

## 文档同步

- [x] `openspec/state-management.md`
- [x] `openspec/data-models.md`
- [x] `openspec/engineering-quality.md` §2（H1 等）
- [x] `openspec/engineering-system.md` §2
- [x] 根 `README.md` / `README.en.md`（数据同步节已补充软删一句；命名快照说明待阶段二）
