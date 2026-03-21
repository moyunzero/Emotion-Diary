# 技术栈（STACK）

## 概述

**Emotion-Diary（焚语）** 是基于 **Expo / React Native** 的跨平台情绪日记应用，使用 **TypeScript** 严格模式，状态管理为 **Zustand**，路由为 **expo-router**（文件式路由）。

## 语言与运行时

| 层级 | 技术 |
|------|------|
| 语言 | TypeScript（`strict: true`，见 `tsconfig.json`） |
| 运行时 | JavaScript（Hermes，由 Expo/React Native 管理） |
| 包管理 | 项目使用 `yarn` 脚本约定（`package.json` 中 `test:release` 等） |

## 核心框架与版本锚点

- **Expo SDK**：`~54.0.30`（`package.json`）
- **React**：`19.1.0`
- **React Native**：`0.81.5`
- **expo-router**：`~6.0.21`（入口 `main`: `expo-router/entry`）
- **新架构**：`app.json` 中 `newArchEnabled: true`

## UI 与交互

- **导航**：`@react-navigation/native`、底部 Tabs（`app/(tabs)/_layout.tsx`）
- **手势**：`react-native-gesture-handler`、`react-native-reanimated`（`babel.config.js` 含 Reanimated 插件）
- **列表**：`@shopify/flash-list`
- **图形**：`@shopify/react-native-skia`（天气/可视化等）
- **图标**：`lucide-react-native`、`@expo/vector-icons`
- **字体**：`@expo-google-fonts/lato`，在 `app/_layout.tsx` 通过 `useFonts` 加载
- **媒体**：`expo-av`、`expo-image`

## 状态与数据校验

- **全局状态**：`zustand`（`store/useAppStore.ts`）
- **持久化**：`@react-native-async-storage/async-storage`（条目等）、`expo-secure-store`（会话等，见 `lib/supabase.ts`）
- **Schema**：`zod`（`^4.3.5`）

## 构建与打包

- **Metro**：`metro.config.js` 基于 `expo/metro-config`，生产构建 `drop_console: true`
- **Babel**：`babel-preset-expo` + Reanimated 插件（`babel.config.js`）
- **EAS**：`eas.json` 定义 `development` / `preview` / `production` 配置；`app.json` → `extra.eas.projectId`
- **原生工程**：`android/`、`ios/` 已纳入仓库，便于商店构建与原生配置

## 代码质量工具

- **ESLint**：`eslint` + `eslint-config-expo`（`eslint.config.js` flat config）
- **TypeScript 路径**：`@/*` → 项目根（`tsconfig.json`）

## 实验特性（Expo）

`app.json` → `expo.experiments`：

- `typedRoutes: true`
- `reactCompiler: true`

## 配置文件索引

| 文件 | 作用 |
|------|------|
| `package.json` | 依赖、脚本（`expo start`、`jest`、`eas build`、`verify:*`） |
| `app.json` | Expo 应用元数据、插件、scheme、平台 bundle id |
| `tsconfig.json` | TS 严格模式与路径别名 |
| `babel.config.js` | Babel 与 Reanimated |
| `metro.config.js` | 打包与压缩选项 |
| `eas.json` | EAS Build 环境 |
| `jest.config.js` / `jest.ci.config.js` | 测试与覆盖率门槛 |
