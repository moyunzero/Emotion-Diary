# 架构（ARCHITECTURE）

## 架构风格

- **单页应用（多屏）**：React Native + **expo-router** 文件式路由；根布局 `app/_layout.tsx` 提供字体加载、Zustand 初始化、安全区与根 `Stack`。
- **集中式客户端状态**：**Zustand** 单 store（`store/useAppStore.ts`），按领域拆分为 **模块**（`store/modules/*.ts`），通过组合实现 `AppState`（`store/modules/types.ts`）。
- **离线优先 + 可选同步**：条目与用户数据默认落在 **AsyncStorage**（经 `store/modules/storage.ts`）；在 Supabase 配置完整时执行上云/下拉同步与认证流程。

## 入口与路由层次

```
app/_layout.tsx          # Root：Splash、字体、initializeStore、Stack
  ├── app/(tabs)/        # Tabs：气象站 / 记一笔 / 洞察
  │     ├── _layout.tsx
  │     ├── index.tsx
  │     ├── record.tsx
  │     └── insights.tsx
  └── app/profile.tsx    # Stack 二级屏：个人资料
```

## 状态模块边界

| 模块 | 职责 |
|------|------|
| `store/modules/entries.ts` | 情绪条目的 CRUD、本地持久化触发 |
| `store/modules/weather.ts` | 基于条目推导「天气」状态 |
| `store/modules/ai.ts` | 预测、播客等 AI 结果与生成动作 |
| `store/modules/storage.ts` | AsyncStorage 键、迁移、访客与登录用户数据迁移 |
| `store/useAppStore.ts` | 聚合模块、用户/同步/认证监听器、防抖同步、`initializeStore` 导出 |

## 数据流（简化）

1. **写入路径**：UI 操作 → `useAppStore` 方法 → 更新内存 `entries` / `user` 等 → 防抖 `_saveEntries` → AsyncStorage。
2. **同步路径**（已配置 Supabase）：`syncToCloud` / `syncFromCloud` 等与 Supabase `auth`、`from(...)` 交互；使用 `isSyncingRef` / `pendingSyncRef` / 定时器合并并发与防抖（`useAppStore.ts` 顶部）。
3. **AI 路径**：组件或 store 调用 `utils/aiService.ts` → Groq HTTP API → 结果写回 store 模块字段。

## 错误与用户提示

- **网络/认证分类**：`utils/errorHandler.ts` 中 `isNetworkError`、`isAuthError` 等，与 `getErrorMessage`（`useAppStore.ts`）组合，将底层错误转为中文提示。

## 横切关注点

- **错误边界**：`components/ErrorBoundary.tsx` 包裹关键 UI，防止子树崩溃拖垮全应用。
- **响应式 UI**：`hooks/useResponsiveStyles.ts`、`utils/responsiveUtils.ts` 等与样式常量（`styles/`、`constants/spacing.ts`）配合。
- **无障碍**：`utils/accessibility.ts` 等辅助方法。
- **性能**：`utils/performance.ts`、`utils/devicePerformance.ts` 等与列表/渲染优化相关逻辑。

## 原生与配置

- **Android / iOS**：标准 Expo 预构建结构；权限与文案在 `app.json`、`android/app/src/main/AndroidManifest.xml`、`ios/app/Info.plist` 等文件中维护。
- **发布校验**：`scripts/verify-*.js` 聚合为 `verify:all`，与商店合规（隐私清单、权限、版本号等）相关。
