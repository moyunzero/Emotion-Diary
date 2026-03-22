# Expo / React Native 配置审计（焚语）

> 对照 Expo SDK 54 与当前仓库配置的结构化记录；与 Phase 13 / RN-01 对齐。

## 版本锚点

- 依赖锁定（见根目录 `package.json`）：**expo ~54**（当前 `~54.0.30`）、**react-native 0.81**（当前 `0.81.5`）、**expo-router**（`~6.0.21`），入口 `main` 为 `expo-router/entry`。

## 配置核对表

| 文件 | 关注点 | 当前值摘要 | 结论 | 备注 |
|------|--------|------------|------|------|
| `app.json` | `newArchEnabled` | `true` | Intentional | 新架构与 Expo 54 推荐方向一致 |
| `app.json` | `experiments` | `typedRoutes: true`, `reactCompiler: true` | Intentional |  typed routes + React Compiler 实验开关 |
| `babel.config.js` | `reanimated` 插件顺序 | 仅 `react-native-reanimated/plugin` 在 `plugins` 中 | Aligned | Reanimated 要求该插件在列表中且位于最后（当前唯一插件，满足） |
| `metro.config.js` | `drop_console` | `compress.drop_console: true` | Intentional deviation | 生产 bundle 剥离 `console`，见下节 |
| `tsconfig.json` | `strict` + `paths` | `strict: true`；`@/*` → 项目根 | Aligned | 继承 `expo/tsconfig.base` |

## 刻意偏差与说明

- **`metro.config.js` 中 `drop_console: true`**：在 **生产/Release 类打包**路径下，Metro 压缩会移除 `console.*` 调用，减小体积并降低日志泄露风险。本地开发使用 `expo start` / Dev Client 时通常不走同一 minify 配置，开发者仍可在 `__DEV__` 分支下看到日志；若某构建 profile 发现日志异常消失，应优先检查是否误用了生产型 Metro 配置。

## 顶层目录与 RN / Expo 约定

| 目录 | 与常见 RN/Expo 实践对照 | 结论 |
|------|-------------------------|------|
| `app/` | Expo Router 唯一路由根，与 `package.json` 的 `main: expo-router/entry` 一致 | 符合 |
| `android/` `ios/` | Prebuild 产物；业务逻辑应在共享 JS 层 | 符合 |
| `components/` | 通用 UI；非路由页面 | 符合 |
| `features/` | 按功能垂直切片（如 `profile/`） | 符合（常见可扩展结构） |
| `store/` `hooks/` | 状态与副作用与视图分离 | 符合 |
| `lib/` `services/` `utils/` `shared/` | SDK 封装、领域服务、纯工具、跨层共享 | 符合；边界由 `eslint-plugin-boundaries` 约束 |
| `styles/` `types/` `constants/` | 样式与类型、常量拆分 | 符合 |
| `assets/` | 静态资源 | 符合 |
| `__tests__/` | Jest 测试与源码并列 | 符合 |
| `scripts/` | Node 校验脚本，非 Metro 入口 | 符合 |
| `openspec/` `docs/` `.planning/` | 文档与规划，不参与 runtime bundle | 符合 |
| `src/` | 与根目录 `app/` 并存的子域占位（多数字目录为空）；易造成「第二源码根」认知成本 | **注意**：非 Expo 默认；新代码优先 `app/` / `components/` / `features/` |
| `dist/` `coverage/` | 已在 `.gitignore`，构建/测试产物 | 勿当手维护源码 |

## 参考

- [Expo 文档](https://docs.expo.dev/) — 官方指南与 SDK 说明
