# 需求实施计划

> Phase: Performance Optimization

## 概述

本阶段目标：对项目进行性能优化，包括组件 memoization、计算优化、内存泄漏预防等方面。

| Category | Description |
|----------|-------------|
| 组件优化 | 为未 memo 的组件添加 React.memo，优化比较函数 |
| 计算优化 | useMemo 依赖优化，避免不必要的重新计算 |
| 内存优化 | 修复潜在的内存泄漏（定时器、监听器） |
| 列表优化 | 确保 FlashList 和 EntryCard 的最佳实践 |

---

## 1. 组件 Memoization 优化

- [ ] 1.1 Insights/index.tsx 添加 React.memo
  - 将 Insights 组件用 React.memo 包装
  - 避免父组件重渲染时的不必要重渲染

- [ ] 1.2 GardenHeader 组件优化
  - 检查是否已使用 memo
  - 优化样式计算依赖

- [ ] 1.3 GardenFooter 组件优化
  - 检查是否已使用 memo
  - 优化 props 比较

---

## 2. 计算优化

- [ ] 2.1 WeeklyMoodWeather weekDates useMemo
  - 将 `getWeekDates()` 结果用 useMemo 包装
  - 依赖当前日期，避免每天重复计算

- [ ] 2.2 Dashboard filteredEntries 优化
  - 当前 filter 逻辑已经使用 useMemo，优化完成

- [ ] 2.3 Insights stats 计算优化
  - 当前已经是单次遍历完成计算，优化完成

---

## 3. 内存泄漏预防

- [ ] 3.1 EntryCard 音频播放器清理优化
  - 确保 audioPlayer 监听器正确移除
  - 验证 useEffect cleanup 函数

- [ ] 3.2 Dashboard 定时器清理
  - 检查 AsyncStorage 操作是否有清理机制

- [ ] 3.3 store/modules/entries.ts 防抖定时器
  - 验证 clearEntriesSaveDebounce 正确调用

---

## 4. EntryCard 音频优化

- [ ] 4.1 提取音频处理逻辑到 useMemo
  - handlePlayAudio 依赖项优化
  - 音频播放器引用稳定性

- [ ] 4.2 音频状态管理优化
  - playingAudioId 和 playbackPosition 状态分离
  - 避免不必要的状态更新

---

## 5. 验证清单

- [ ] `yarn lint` — 0 warnings
- [ ] `yarn typecheck` — 无错误
- [ ] `yarn test:ci` — 831 passed
- [ ] 内存泄漏检测通过

---

## 参考

- EntryCard 当前已有 React.memo + 自定义比较函数
- Insights 子组件均已使用 memo + useMemo
- Dashboard 使用 FlashList + useShallow