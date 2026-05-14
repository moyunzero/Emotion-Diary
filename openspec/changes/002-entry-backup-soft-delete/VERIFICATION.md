# VERIFICATION：002-entry-backup-soft-delete

## 验证目标

- **阶段一**：软删、`deletedat` 同步、拉云合并（同 id 云端优先）、墓碑与普通软删分工、文档与代码一致。
- **阶段二**（快照）：未实现；本节不声称已验收。

## 已执行检查

| 检查项 | 命令或方式 | 结果 |
| --- | --- | --- |
| TypeScript | `yarn typecheck` | 改文档前最近一次本地通过；合入后请再跑 |
| ESLint | `yarn lint` | 同上 |
| 治理规则 | `yarn verify:governance` | 同上 |
| 单元测试 | `yarn test`（或项目内等价） | 含 `shared/entries/visibility` 等路径时通过 |

## 行为验证（阶段一）

- [x] 软删后主列表不可见，条目仍在 `entries`（可查 `deletedAt`）。
- [x] `syncToCloud` 后 Supabase 行含 `deletedat`（与客户端一致列名）。
- [x] 本地软删后云端行无 `deletedat` 时，`recoverFromCloud` / `syncFromCloud` 可恢复该条展示。
- [x] 普通 `deleteEntry` 不写入 `entry_tombstones`。

## 未验证项

- 阶段二快照、登录前备份、按快照恢复全链路（未开发）。

## 剩余风险

- 多设备并发仍无版本向量（见 `engineering-quality.md` H1）。
- `generateForecast` 门槛为 `entries.length < 3`（**含**已软删条计数）；与「至少 3 条可见记录」可能不一致，属产品/实现可选对齐项。

## 文档更新记录

- 已与 `openspec/data-models.md`、`state-management.md`、`engineering-system.md`、`engineering-quality.md`、`changes/002/…/SPEC.md` 对齐阶段一语义。
