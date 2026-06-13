# SPEC：大列表与 Insights 性能（E-D · 008）

## 背景

- **依赖**：005（回收站列表模式可参考）。
- **问题**：5k+ 条目时 Dashboard FlashList 缺 `estimatedItemSize`；EntryCard 全表订阅播放进度；Insights 首屏全量挂载；回顾导出天气统计 O(天数×n)。

## 目标

1. **Dashboard**：`filterDashboardEntries` 单次分桶；`getItemType`（FlashList 2.x 自动尺寸，保留典型高度常量供调参参考）。
2. **EntryCard**：仅当前播放条目订阅 `playbackPosition`。
3. **Insights**：首屏 `WeeklyMoodWeather` + `HealingProgress`；其余 `InteractionManager` 延迟挂载；Tab `lazy: true`。
4. **Review Export**：天气统计 O(n)；截图 `quality` + `maxWidth` 压采样；`LARGE_DATA_ENTRY_SOFT_LIMIT` 文档化。

## 不在范围

- 虚拟列表改造 Insights 内部子组件算法（仅 lazy mount）。
- Sentry / 运行时性能监控。

## 验收

- [x] dashboardFilter / reviewStatsWeather 单测
- [x] 常量 `constants/performance.ts`
- [x] CI 绿
