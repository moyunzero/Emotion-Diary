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

## 参考

- [Expo 文档](https://docs.expo.dev/) — 官方指南与 SDK 说明
