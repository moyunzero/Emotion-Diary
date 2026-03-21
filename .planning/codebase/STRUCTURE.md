# 目录结构（STRUCTURE）

## 仓库根目录

| 路径 | 说明 |
|------|------|
| `app/` | expo-router 页面与布局（`app/_layout.tsx`、`app/(tabs)/`、`app/profile.tsx`） |
| `components/` | 可复用 UI：仪表、记录、洞察、头像、错误边界等 |
| `components/Insights/` | 洞察子组件（如 `WeeklyMoodWeather.tsx`、`TriggerInsight.tsx`） |
| `components/Profile/` | 个人页相关卡片与菜单项 |
| `components/ai/` | AI 相关展示（如 `EmotionPodcast.tsx`） |
| `store/` | Zustand：`useAppStore.ts` + `store/modules/` |
| `hooks/` | 自定义 Hooks（响应式、触觉反馈等） |
| `utils/` | 工具：日期、AI、存储、日志、环境、无障碍等 |
| `services/` | 业务服务（如 `companionDaysService.ts`） |
| `styles/` | 按页面/组件拆分的样式与共享常量 |
| `types/` | 部分领域类型（如 `types/components.ts`、`types/companionDays.ts`） |
| `types.ts` | 核心领域模型：`MoodEntry`、`User`、`WeatherState`、AI 类型等 |
| `constants.ts` / `constants/spacing.ts` | 应用级常量 |
| `lib/supabase.ts` | Supabase 单例与配置检测 |
| `assets/` | 图片、字体等资源 |
| `android/`、`ios/` | 原生工程 |
| `__tests__/` | 单元、属性、集成测试 |
| `scripts/` | 构建、校验、重置工程脚本 |
| `app-store-submission/` | 商店元数据与检查清单（非运行时代码） |

## 命名约定

- **页面文件**：`app/` 下多为 `index.tsx`、`record.tsx` 或与路由段同名的 `profile.tsx`。
- **组件**：PascalCase 文件名，如 `EntryCard.tsx`、`MoodForm.tsx`。
- **Store 模块**：`store/modules/` 内 `entries.ts`、`weather.ts`、`ai.ts`、`storage.ts`、`types.ts` — 职责清晰的小写单数文件名。
- **样式**：`styles/components/*.styles.ts` 与页面名对应；`styles/sharedStyles.ts`、`styles/constants.ts` 复用。

## 测试与配置位置

- `jest.config.js`、`jest.ci.config.js`、`jest.setup.js` — Jest 与全局 Mock。
- `eslint.config.js` — ESLint flat。
- `eas.json` — EAS Build profile。
- `.env.example` — 环境变量模板（真实密钥不入库）。

## 路径别名

- TypeScript：`@/*` 映射到仓库根（`tsconfig.json`）。
- Jest：`moduleNameMapper` 同步 `@/`（`jest.config.js`）。

## 建议阅读顺序（新人上手）

1. `app/_layout.tsx` → `app/(tabs)/_layout.tsx` → 各 tab 页面  
2. `store/useAppStore.ts`（前半部分初始化与模块合并）  
3. `store/modules/entries.ts`、`store/modules/storage.ts`  
4. `lib/supabase.ts`、`utils/aiService.ts`  
5. `components/Dashboard.tsx`、`components/Record.tsx` 与对应 `styles/`
