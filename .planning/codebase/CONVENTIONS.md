# 代码约定（CONVENTIONS）

## TypeScript

- **`strict: true`**（`tsconfig.json`）：避免隐式 `any`，新代码应补齐接口与函数返回值类型。
- **领域模型**集中在 `types.ts` 与 `store/modules/types.ts`；组件专用类型可在 `types/components.ts` 等文件中扩展。

## React / React Native 组件

- **函数组件** + Hooks；根布局使用 `expo-router` 的 `Stack` / `Tabs`。
- **样式**：大量采用 `StyleSheet` 或独立 `*.styles.ts`（见 `styles/components/`），与业务组件分离，便于主题与响应式调整。
- **Memo**：性能敏感列表项（如 `EntryCard`）可能使用 `React.memo`，配合属性稳定性（属性测试见 `__tests__/property/entrycard-memoization.property.test.tsx`）。

## 状态管理（Zustand）

- **单 Store 多模块**：`createEntriesSlice`、`createWeatherModule`、`createAIModule` 等工厂接收 `set`/`get`，在 `useAppStore.ts` 中 Slices Pattern 展开合并（`create<AppStore>()((...a) => ({ ...createEntriesSlice(...a), ... }))`）。
- **内部方法前缀**：`_loadEntries`、`_saveEntries`、`_setWeather` 等表示「模块内或 store 内部使用」，避免与公开 API 混淆。
- **异步与竞态**：同步云使用 `isSyncingRef`、`pendingSyncRef` 与防抖定时器，避免重复提交（详见 `store/useAppStore.ts` 文件顶部注释）。

## 错误处理

- **统一分类**：优先使用 `utils/errorHandler.ts` 判断网络与认证类错误。
- **用户可见文案**：`getErrorMessage`（`useAppStore.ts`）将常见 Supabase/Postgres 错误码转为中文提示；默认截断过长原始错误串。
- **SecureStore / 异步边界**：`lib/supabase.ts` 的适配器对 `getItem`/`setItem` 使用 try/catch 并降级为 `null`/warn，避免单点存储失败导致崩溃。

## 日志

- **`utils/logger.ts`**：封装日志行为；生产环境依赖 Metro `drop_console`（`metro.config.js`）减少控制台输出泄露。
- 存在 **TODO**：日志持久化尚未实现（见该文件内注释）。

## 环境与功能开关

- **`isSupabaseConfigured()`**：任何云端读写前应判断，未配置时保持离线体验。
- **`utils/env.ts`**：`isDevelopment` / `isProduction` / `isTest` 用于区分运行环境。

## ESLint

- 使用 **Expo 官方 flat 配置**（`eslint.config.js`），`dist/*` 忽略；提交前可运行 `yarn lint`。

## 国际化与文案

- 当前 UI 文案以**中文**为主；商店材料另有 `app-store-submission/metadata/` 下中英文描述文件。

## 导入顺序（非强制，常见模式）

1. 外部包（React、RN、Expo）
2. 内部别名 `@/` 或相对路径 `../`
3. 类型与常量
