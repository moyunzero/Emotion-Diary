# SPEC：条目软删除 · 快照备份 · 按备份恢复（UUID 为键）

## 实施状态（与当前代码一致）

| 阶段 | 内容 | 状态 |
|------|------|------|
| **阶段一（已落地）** | `deleteEntry` 软删（`deletedAt`）、`addEntry` 使用 `generateEntryId()`（UUID v4）、主列表/天气/AI 等经 `excludeSoftDeletedEntries` / `isSoftDeleted`；`syncToCloud` 写入 `entries.deletedat`；`syncFromCloud` / `recoverFromCloud` 合并：**同 id 以云端行为准**；`entry_tombstones` **仅**永久删云 / 销户等路径，**不**在普通软删写入 | **已实现** |
| **阶段二（未做）** | 不可变快照表、登录前/退出前自动快照、按快照选择与单条恢复、与「当前云表」分名的恢复 UI | **未实现**（本文件下文「必须达成」2–4 条仍以目标语义描述阶段二） |

## 背景

- **当前问题**：
  - 「删除」从本地 `entries` 数组**硬移除**，历史在默认列表中不可见；与「备份应含当时全量、恢复应能拉回已删」的产品目标不一致。
  - 「备份/恢复」与「日常 `syncToCloud` / `syncFromCloud` / `recoverFromCloud`」语义混用：用户期望**命名快照**与**从指定快照精确合并**（阶段二）；当前已用 **拉云合并以云端为准** 缓解「云端备份无 `deletedat` 时覆盖本地软删」类场景（阶段一）。
  - 游客 / 登录 / 退出全链路需以 **`MoodEntry.id`** 为唯一键保留可追溯历史；新建条为 UUID v4；历史数据可能仍为旧版时间戳 id。**登录前备份**（阶段二）待实现。
- **用户或业务影响**：误删或换设备后无法按「某次备份时刻」找回；登录合并时可能丢本地已删但仍有业务价值的记录。
- **相关代码**：`store/modules/entries.ts`（`deleteEntry` / `burnEntry`）、`store/useAppStore.ts`（同步与恢复）、`store/modules/user.ts` / `store/modules/storage.ts`（会话与存储键）、`types.ts`（`MoodEntry` / `Status`）、`supabase/migrations/*`（`entries`、可选 `entry_tombstones` 仅用于**永久清除**路径）。
- **相关文档**：`openspec/state-management.md`、`openspec/data-models.md`、`openspec/services.md`。

## 目标

- **必须达成**：
  1. **软删除**：用户「删除」默认仅标记删除（或进回收站），**不**从权威存储中抹除 UUID 行；主列表/天气等默认隐藏软删项，另有回收站或筛选可见。
  2. **备份 = 快照**：手动 / 自动 / **登录前** / **退出前** 等触发点生成**不可变快照**（或版本化包），包含该时刻**全部条目**（含软删、含游客态本地 UUID 行）。
  3. **恢复**：用户可选**某一快照**，按 UUID 与当前数据合并；支持从快照中**单独恢复**若干条（含本地已硬删、若快照里仍有）。
  4. **登录合并**：登录前先写入「登录前备份」；再将**本地全量**（含软删）与云端按 `id` 合并——**云端新版优先**（需定义「新版」：`updated_at` / `timestamp` / 版本号）；**本地独有**上传云端；并下载云端**完整历史**（若云端仍用单表 + 软删字段，则「完整」= 含 `deletedAt` 等行；若分表需在 SPEC 实施阶段定稿）。
  5. **UUID**：新建条目使用稳定 UUID v4（`generateEntryId`）；旧条保留原 `id`，不做强制迁移。
- **不在本次范围**（可写子阶段）：
  - UI 美化、非备份相关的 Insights 改动。
  - 若产品需要「合规硬删 / 右被遗忘」：单独动作（如 `purgeEntryForever`）可写 `entry_tombstones` 并物理删云——与普通软删分流。

## 用户行为

- **触发入口**：
  - 删除：列表删除 → 软删（或移至回收站）。
  - 备份：设置内手动备份、定时自动备份、**即将登录**、**即将退出**（及可选每次 `syncToCloud` 是否算备份——默认**不算**，以免与快照语义混淆；实施时二选一写死）。
  - 恢复：设置 / 数据管理 → 选择快照 → 全量恢复或勾选条目恢复。
- **期望结果**：任意曾在快照或云端出现过的 UUID，在满足合并规则下可被找回；主列表不因「曾从云端拉回过」而意外丢历史（除非用户显式永久清除）。
- **异常或边界场景**：
  - 同一 UUID 多版本冲突（多设备、快照与云同时存在）。
  - 快照过大、存储配额、离线仅本地快照。
  - 账号注销：与 `delete-account`、GDPR 策略一致（快照是否级联删除须产品裁定）。

## 技术约束

- **架构边界**：`store` 不引 `components`；快照序列化格式与加密（若需要）放 `shared/` 或 `services/`。
- **数据兼容**：现有 AsyncStorage 键 `mood_entries_*` 与 Supabase `entries` 行必须可迁移；旧客户端无软删字段时的默认值。
- **多端要求（Web / iOS / Android）**：快照存储位置（仅云 / 仅本地 / 双写）须一致或可解释降级。
- **安全与隐私**：快照含全文与音频元数据；RLS 与 Storage bucket 权限与 `user_id` 绑定。

## 数据模型（阶段一已对齐代码；快照字段仍为阶段二）

- **`MoodEntry`**：已含 `deletedAt`、`burnedAt`、`Status.BURNED` 等；普通删除**不得** `filter` 丢行（当前实现：`map` 设 `deletedAt`）。
- **快照**：建议字段：`id`、`user_id`（可空表示仅本地游客快照？）、`created_at`、`reason`（`manual` | `auto` | `pre_login` | `pre_logout` | …）、`payload`（JSON：完整 `MoodEntry[]` 或压缩 blob）、`client_device_id`（可选）。
- **`entry_tombstones`**：保留表与 migration；**仅**「用户确认永久销毁」或销户清理路径写入，**不**在普通软删路径写入。

## 验收标准

### 阶段一（当前代码）

- [x] 普通删除为软删：默认列表不展示（`excludeSoftDeletedEntries`），`id` 仍在 `entries` 与 AsyncStorage；上云列 **`deletedat`**。
- [x] `recoverFromCloud` ≡ `syncFromCloud`：同 id **以云端行为准**（云端无软删标记时可恢复本地已软删条）。
- [x] 普通软删**不**写 `entry_tombstones`；墓碑与 `delete-account` 等路径仍可用。
- [x] 单测覆盖可见性 / 合并相关纯函数（见 `__tests__/unit/shared/entries/` 等）。
- [x] `openspec/state-management.md`、`data-models.md`、`engineering-quality.md`、`engineering-system.md` 等与阶段一一致。

### 阶段二（快照体系，未实现）

- [ ] 登录前自动生成至少一份本地或云可识别的「登录前备份」（失败时阻塞登录或降级策略须文档写明）。
- [ ] 退出前/手动/自动备份生成快照，打开快照可见当时全量条目（含软删）。
- [ ] 从指定快照恢复后，目标 UUID 条目内容符合合并规则；单条恢复与全量恢复均有测试或脚本验证路径。
- [ ] `recoverFromCloud` 与「从快照恢复」在 UI 文案与实现上分名分责，避免用户混淆。
- [ ] 快照序列化 round-trip 单测。

## 依据

- **产品依据**：用户确认原则——以 UUID 为键、全链路历史、软删 + 回收站 + 快照、恢复不局限于「当前剩余」。
- **技术依据**：Supabase RLS、现有 `entries` 表结构、当前 Zustand 持久化路径。
- **历史决策或风险**：曾将 `deleteEntry` 与 `entry_tombstones` 绑定，已与产品目标冲突，**已撤销**该绑定；墓碑表保留给显式删云与销户。

## 开放问题（实施前需产品/技术拍板）

1. 「云端完整历史」是否等价于单表 `entries` + 软删列，还是需要 `entry_revisions`？
2. 快照默认仅存云端还是本地+云双写（离线优先 vs 换机恢复）？
3. `BURNED` 与软删是否并存（焚烧后是否仍进快照）？
