# Expo Router 与 app/ 约定（焚语）

## 技术事实

- 路由栈基于 **expo-router**（文件系统路由），与 `package.json` 的 `main: expo-router/entry` 一致。
- `app.json` 中开启 `typedRoutes: true`，生成类型安全的 href；深链 scheme 见下文。

## 目录与职责

- `app/_layout.tsx` — 根布局：字体加载、全局 Provider、与栈/主题相关初始化。
- `app/(tabs)/_layout.tsx` — 底部 Tab 容器与 Tab 级选项。
- `app/(tabs)/index.tsx` — 首页 Tab（主入口之一）。
- `app/(tabs)/record.tsx` — 「记录」Tab：情绪记录主流程。
- `app/(tabs)/insights.tsx` — 「洞察」Tab：统计与花园等。
- `app/profile.tsx` — 个人中心（独立于 tabs 组，由导航跳转进入）。
- `app/review-export.tsx` — 情绪回顾图全屏页（导出/保存相册）。

## 与 features / components

- 路由壳层与 **屏幕入口** 放在 `app/`：每个文件对应 URL 路径，尽量保持薄，把复杂 UI 拆到 `components/` 或 `features/`。
- 可复用 UI、表单与业务组装主要在 `components/`；个人中心等 feature 级聚合在 `features/`（如 `features/profile`），由 `app/` 中的路由文件引用。

## Deep linking

- 自定义 scheme：**emotiondiary**（与 `app.json` → `expo.scheme` 一致），用于通用链接与开发调试时的 deep link 前缀。
