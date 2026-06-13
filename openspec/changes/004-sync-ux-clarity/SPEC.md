# SPEC：同步 UX 清晰化 · 状态可见 · 互斥锁文档化

## 背景

- **当前问题**：Profile「备份心事 / 找回回忆」与底层 `syncToCloud` / `recoverFromCloud` 语义不够清晰；并发同步时 store 返回 `false` 但 UI 仍可能示成功；`syncStatus`（store）与 Profile 本地状态双轨。
- **用户或业务影响**：误用「找回」导致不理解合并规则；同步失败/排队不可见。
- **相关代码**：`features/profile/`、`store/useAppStore.ts`、`shared/sync/syncLock.ts`。
- **相关文档**：`changes/003-regression-guardrails/`、`iteration-roadmap-2026.md` 波 1；`state-management.md`。

## 目标

- **必须达成（B3）**：
  1. 用户可区分 **备份到云端**（`syncToCloud`）与 **从云端合并**（`recoverFromCloud` ≡ `syncFromCloud`）。
  2. 说明区注明 **命名快照恢复** 属后续能力（007），不与当前两项混称。
  3. 「从云端合并」前 **确认对话框**，说明同 id 以云端为准。
- **必须达成（状态）**：
  4. Profile 展示 store `syncStatus`（含 `pending` / `error`）。
  5. `handleSyncAction` 正确处理 `false` 返回与 `pending`，不虚假成功。
- **必须达成（工程）**：
  6. 互斥锁提取为 `shared/sync/syncLock.ts` 并单测（小步状态机，非合并算法重写）。
- **必须达成（OQ-4）**：`generateForecast` 门槛使用可见条目数（`excludeSoftDeletedEntries`）。
- **不在本次范围**：快照 UI（007）、回收站（005）、自动后台同步策略变更。

## 验收标准

- [x] 文案与确认框符合 SPEC
- [x] store `syncStatus` 在 Profile 可见
- [x] pending / false 不示成功
- [x] `syncLock` 单测 + CI 绿
- [x] `state-management.md` / `engineering-quality.md` H1 有 UI 指向
- [x] OQ-4：`generateForecast` 门槛

## 依据

- **产品依据**：`iteration-roadmap-2026.md` 004；brainstorming B3。
- **技术依据**：`mergeCloudPullEntries`、003 回归清单 S 系列。
