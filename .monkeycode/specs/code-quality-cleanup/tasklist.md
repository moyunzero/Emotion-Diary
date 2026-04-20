# 需求实施计划

> Phase 21: Code Quality Cleanup - 完整任务列表

## 概述

本阶段目标：清理未使用的代码导出、合并重复导出、修复 lint 警告、解决 expo-audio mock 测试失败。

| Plan | 状态 | 描述 |
|------|------|------|
| 01 | ✓ 已完成 | 清理 AudioRecorder 未使用/重复导出 |
| 02 | ✓ 已完成 | 移除未使用的类型导出和变量 |
| 03 | ✓ 已完成 | 修复 React hooks 依赖问题 |
| 04 | ✓ 已完成 | 修复 expo-audio mock 测试失败 |

---

## Plan 01: 清理 AudioRecorder 未使用/重复导出 ✓

- [x] 1.1 移除未使用的 AudioRecorder 组件导出
  - 移除 AudioList, AudioPreview, RecordButton, WaveformView 的默认导出
  - 保留命名导出并更新内部引用

- [x] 1.2 统一 index.ts 导出模式
  - 移除重复的默认+命名导出
  - 只保留 AudioRecorder 作为模块入口点

---

## Plan 02: 移除未使用的类型导出和变量 ✓

- [x] 2.1 移除 AppScreenShell 未使用类型导出
  - `AppScreenShellProps` 从 export type 改为 internal type

- [x] 2.2 移除 Profile 组件未使用类型导出
  - `ProfileMenuItemProps`
  - `ProfileStatCardProps`
  - `ProfileUserCardProps`

- [x] 2.3 移除 audioSync.ts 未使用变量
  - Line ~30: 移除 `data` from destructuring (uploadAudio)
  - Line ~113: 移除 `data` from destructuring (downloadAudio)

---

## Plan 03: 修复 React hooks 依赖问题 ✓

- [x] 3.1 修复 Dashboard.tsx hooks dependencies
  - useCallback 添加 `styles.*` 依赖

- [x] 3.2 修复 ProfileScreen.tsx hooks dependencies
  - useEffect 添加 `state` 依赖 (两处)

- [x] 3.3 修复 useThemeStyles.ts hooks dependencies
  - useMemo 添加 `styleFactory` 依赖

- [x] 3.4 移除 AudioRecorder 未使用变量 (D-05)
  - RecordButton.tsx: `CANCEL_THRESHOLD_PX`, `isPressed`, `handleCancelRecording`
  - WaveformView.tsx: `avgNeighbor`, `leftNeighbor`, `rightNeighbor`

- [x] 3.5 修复 import/no-named-as-default 警告
  - EditEntryForm.tsx: 改为命名导入 `import { AudioRecorder }`

---

## Plan 04: 修复 expo-audio mock 测试失败 ✓

- [x] 4.1 添加 expo-audio mock 到 jest.setup.js
  - Mock `createAudioPlayer`, `AudioStatus`, `PermissionStatus`
  - Mock `useAudioPlayer`, `useAudioPlayerStatus`

- [x] 4.2 添加 expo-haptics mock
  - Mock `impactAsync`, `ImpactFeedbackStyle`

- [x] 4.3 添加 expo-modules-core mock
  - Mock `EventEmitter` 用于事件订阅

- [x] 4.4 添加 expo-file-system mock
  - Mock `expo-file-system` 和 `expo-file-system/legacy`

- [x] 4.5 更新 jest.config.js transformIgnorePatterns
  - 添加 `expo-modules-core`, `expo-haptics`, `expo-audio`, `expo-file-system`

---

## 验证清单

- [x] `yarn lint` — 0 warnings
- [x] `yarn test:ci` — 69 passed (831 tests)
- [x] `yarn typecheck` — 无错误

---

## 提交记录

| Commit | 描述 |
|--------|------|
| 77c2b53 | refactor(21-01): clean up AudioRecorder exports |
| 086dbcd | refactor(21-02): remove unused type exports and variables |
| d465df5 | refactor(21-03): fix React hooks deps and remaining lint warnings |
| (本次) | fix: add expo mock for jest tests |
