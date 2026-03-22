# Phase 12 — 单文件体量清单

**日期:** 2026-03-22

## 阈值

- **警告带：** 约 **400～500 行** 起视为需关注体积；本清单将 **≥400 行且小于 800 行** 的生产源码（不含 `__tests__`）列入「警告带」，便于与路线图 SIZE-01 对齐。
- **硬上限候选：** **≥800 行** 的文件必须进入拆分/治理排期，优先处理。

## 统计命令

```sh
find . -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path './node_modules/*' ! -path './__tests__/*' ! -path '*/__tests__/*' -print0 | xargs -0 wc -l | sort -n
```

## 硬上限候选（≥800）

| 路径 | 行数 | 备注 |
|------|------|------|
| `store/useAppStore.ts` | 1292 | 头号拆分对象；Zustand 编排与剩余状态聚合 |

## 警告带（400～500 行及以上且未满 800）

以下路径来自 `12-RESEARCH.md` 第 4 节，执行日已用 `wc -l` 复核（均仍存在）：

| 路径 | 行数 |
|------|------|
| `utils/aiService.ts` | 777 |
| `features/profile/components/ProfileSettingsSection.tsx` | 757 |
| `components/EntryCard.tsx` | 583 |
| `utils/errorHandler.ts` | 529 |
| `components/Dashboard.tsx` | 514 |
| `components/MoodForm.tsx` | 437 |
| `components/WeatherStation.tsx` | 428 |
| `components/ReviewExport/ReviewExportScreen.tsx` | 385 |
| `components/ReviewExport/ReviewExportCanvas.tsx` | 378 |

## 下一批拆分候选

1. **`store/useAppStore.ts`** — 头号候选；与 Phase 8–9 的 slice 模式对齐，继续纵向抽离。
2. **`utils/aiService.ts`** — 体量接近 800，建议在 user/sync 拆分后单独排期模块边界。

**Wave 3 计划：** 首批拆分 **`createUserSlice`**（`store/modules/user.ts`），将 `UserModule` 相关状态与方法从 `useAppStore.ts` 迁出；**SyncModule** 留待后续 plan / follow-up。
