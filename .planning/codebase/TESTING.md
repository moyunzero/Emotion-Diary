# 测试（TESTING）

## 框架与运行器

- **Jest**（`jest@^30`）+ **`ts-jest`**（`package.json` `devDependencies`）。
- **预设**：`preset: "react-native"`（`jest.config.js`）。
- **环境**：`testEnvironment: "node"`。
- **CI 专用配置**：`jest.ci.config.js`（由 `yarn test:ci` 使用）。

## 入口与全局 Mock

- **`jest.setup.js`**：在测试中统一 Mock：
  - `@react-native-async-storage/async-storage`
  - `expo-secure-store`
  - `expo-constants`
  - `react-native-reanimated`、`react-native-gesture-handler`
  - `@shopify/react-native-skia`
  - `expo-router`（`useRouter`、`Stack` 等）
  - `@supabase/supabase-js`（链式 `from/select/insert`）
  - `react-native-safe-area-context`

## 测试目录布局

| 路径 | 内容 |
|------|------|
| `__tests__/unit/` | 单元测试：store、utils、组件 |
| `__tests__/property/` | 基于 **fast-check** 的属性测试 |
| `__tests__/integration/` | 集成测试：如 `ErrorBoundary`、`CompanionDaysModal` |
| `__tests__/README.md` | 测试说明（若存在） |

## 命名与匹配

- **`testMatch`**：`**/__tests__/**/*.test.[jt]s?(x)` 等（`jest.config.js`）。
- **覆盖率**：`collectCoverageFrom` 覆盖 `app/`、`components/`、`hooks/`、`services/`、`store/`、`utils/`，排除类型声明与 `__tests__`。
- **门槛**：`coverageThreshold` 全局 **80%**（分支/函数/行/语句），提高重构成本与质量基线。

## 常用命令

| 命令 | 作用 |
|------|------|
| `yarn test` | 默认 Jest |
| `yarn test:watch` | 监视模式 |
| `yarn test:coverage` | 覆盖率报告 |
| `yarn test:ci` | CI 配置 |
| `yarn test:unit` | 仅 `__tests__/unit` |
| `yarn test:property` | 仅属性测试 |
| `yarn test:integration` | 仅集成测试 |
| `yarn test:release` | `lint` + `test:ci`（发布前） |

## 属性测试

- **`fast-check`** 用于随机化输入验证不变量（如同步合并、日期工具、memo 行为），见 `__tests__/property/*.ts(x)`。

## 测试库

- **`@testing-library/react-native`** 与 **`@testing-library/jest-native`**（`devDependencies`）用于组件级断言（ matchers 等）。

## 局限与注意事项

- Supabase 与路由在 setup 中**完全 Mock**，集成测试不会命中真实网络；端到端需 Detox/Maestro 等另行引入。
- Reanimated/Skia 等使用 mock 实现，**不验证**真实原生动画与绘制。
