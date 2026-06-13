# VERIFICATION：008-performance-large-data

## 已执行检查

| 检查项 | 结果 |
| --- | --- |
| `yarn typecheck` | 通过 |
| `yarn lint` | 通过 |
| `yarn test` | 通过（169 tests，2026-06 复验） |
| 设备：5k 列表滚动 / Insights 首开 / 大月导出 | **未执行** |

## 变更摘要

- `shared/entries/dashboardFilter.ts` — O(n) 分桶筛选 + `getItemType`
- `EntryCard` — 播放状态按 entry 隔离订阅
- `InsightsDeferredSections` — 首屏下延迟挂载
- `reviewStatsWeather` — O(n) 日聚合
- `ReviewExportScreen` — 截图 quality + maxWidth
- `constants/performance.ts` — 规模与截图常量

## 基准说明

- FlashList **2.0.2** 无 `estimatedItemSize` prop；保留 `DASHBOARD_ENTRY_ESTIMATED_SIZE` 作调参参考
- `LARGE_DATA_ENTRY_SOFT_LIMIT = 5000` 为设计参考，非硬截断
- Insights 首开 &lt; 2s 须在真机冷启动后实测记入本文件
