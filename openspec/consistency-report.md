# OpenSpec 规范文档与代码一致性说明

**定位**：人工维护的「当前对齐声明」，**非**自动化逐行审计报告。权威契约以 **git 中的源码** 为准；发现漂移时改代码或改文档并更新本页日期。

**最近对齐（2026-05）**：条目 **UUID v4**（`generateEntryId`）、**软删除**（`deletedAt` + `entries.deletedat`）、**拉云合并**（`syncFromCloud` / `recoverFromCloud` 同 id 以云端为准）、**墓碑表**仅永久删云路径、`aiService` 入参 **`excludeSoftDeletedEntries`**。详见 `openspec/data-models.md`、`state-management.md`、`engineering-system.md`、`changes/002-entry-backup-soft-delete/SPEC.md`。

---

## 检查范围（OpenSpec 主文档）

| 文档 | 与代码关系 |
|------|------------|
| `data-models.md` | `MoodEntry` / `User` / 天气业务规则等与 `types.ts`、`visibility.ts` 对齐 |
| `state-management.md` | Store 行为与 `store/modules/*`、`useAppStore.ts` 对齐 |
| `services.md` | Groq / Supabase 侧与 `utils/aiService.ts`、`lib/supabase.ts` 对齐 |
| `utils.md` / `ui-components.md` / `project-overview.md` | 随功能变更增量更新；大改前 grep 相关符号 |

---

## 已知差异 /  backlog（刻意保留）

- **002 阶段二**：命名快照、登录前备份、按快照恢复 — SPEC 已标「未实现」，代码无对应模块。
- **预测门槛**：`generateForecast` 使用 `entries.length`（含软删）；若产品要求「仅可见条数」需改 `store/modules/ai.ts` 后再改文档。

---

## 维护约定

1. 改 `store` / `types` / 同步列名时，**同一 PR** 更新上表所列 md 与 `changes/002/…` 中相关段落。  
2. 避免在本文件写死「100% 一致」类结论；可写「最近一次人工对齐日期 + 主题」。  
3. CI 仍以 `yarn typecheck` / `yarn lint` 为准；本文件不参与构建。
