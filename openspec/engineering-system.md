# 工程规范 · 系统与集成（Engineering: System）

> **SDD 定位**：仓库形态、分层架构、技术栈与外部集成等**实现支撑事实**；与 `openspec/changes/*/SPEC.md` 的**范围与验收**互补。  
> **不重复**：`MoodEntry` / Store API / Groq 调用参数等契约见 [`data-models.md`](./data-models.md)、[`state-management.md`](./state-management.md)、[`services.md`](./services.md)。产品叙述见 [`project-overview.md`](./project-overview.md)。  
> **姐妹篇**：约定、技术债、UI 壳层、测试与 CI 见 [`engineering-quality.md`](./engineering-quality.md)。

---

## 1. 架构概览

离线优先 + 可选 Supabase 同步；**Flux 风格单向流**：UI → Zustand（`store/useAppStore.ts` + `store/modules/*`）→ `services/` / `utils/` → AsyncStorage / Supabase / Groq。

```text
app/ · components/ · features/  →  useAppStore(selector)
        ↓
store/modules/{entries,user,weather,ai,audio,storage}
        ↓
services/* · utils/* · lib/supabase.ts
        ↓
AsyncStorage / Supabase / Groq REST
```

**硬约束**：单一全局 store；离线写入先本地再异步上云；音频由 `expo-audio` + `services/audioSync.ts`，store 不持原生句柄；**录音片段投递**由 `shared/audio/recordingCoordinator.ts` 单例 `clipHandler` 完成——多处挂载 `AudioRecorder` 时必须设置 `clipBinding`（默认 `tab-focus`）并在卸载时调用 `releaseRecordingClipHandler`，约定与风险见 [`engineering-quality.md`](./engineering-quality.md) §2.3。认证迁移须走 `store/modules/storage.ts` 的 guest↔user 路径。

**反模式（摘要）**：勿在组件内跨 slice 乱 `setState`（应调 `addEntry` 等 action）；勿绕过 `storage` helper 直写 AsyncStorage（破坏多账号 key）。

---

## 2. 数据流要点

- **新建条目**：`Record` → `addEntry` → entries slice → 防抖 `_saveEntries` → `storage` → AsyncStorage；若已登录则 `syncToCloud` upsert + 音频上传（`audioSync.ts`）。
- **软删与上云**：`deleteEntry` 仅设 `deletedAt`，条目仍在 `entries` 数组；`syncToCloud` 映射为 Supabase 列 **`deletedat`**（`bigint` 毫秒，与 `moodlevel`/`resolvedat` 等命名一致）。**不写** `entry_tombstones`（墓碑用于永久删云等路径）。
- **拉云合并**：`syncFromCloud` / `recoverFromCloud`（后者即调用前者）先剔除墓碑 id，再以 **Map：本地先、云端覆盖同 id** 合并 — **同 id 以云端行为准**（用于「找回回忆」覆盖本地软删状态）。
- **启动**：`_layout` → `initializeStore`：profile 缓存 → Supabase session → entries → 天气 → `onAuthStateChange`。
- **AI**：洞察页 → `store/modules/ai.ts` → `utils/aiService.ts` → Groq；带 TTL 缓存；入参侧排除软删见 `services.md`。

---

## 3. 路由（Expo Router）

```text
app/
├── _layout.tsx              # 根 Stack、字体/Splash/store 生命周期
├── (tabs)/_layout.tsx       # 三 Tab
├── (tabs)/index|record|insights.tsx
├── profile.tsx
└── review-export.tsx
```

屏幕实现下沉到 `components/` 或 `features/profile/ProfileScreen.tsx` 等；`(tabs)/` 为分组，不出现在 URL。

---

## 4. 仓库目录树（摘要）

```
Emotion-Diary/
├── app/                 # 路由页面
├── components/          # 通用 UI（含 Dashboard、Record、Insights、AudioRecorder、EditEntryModal…）
├── features/profile/  # 个人中心垂直模块
├── store/               # useAppStore + modules/
├── hooks/  services/  utils/  lib/  shared/  styles/  constants/
├── types.ts  types/
├── supabase/functions/delete-account/
├── __tests__/unit/     # Jest
├── scripts/  .github/workflows/ci.yml
└── app.json  eas.json  tsconfig.json  eslint.config.js  metro.config.js  knip.json
```

**命名**：组件 `PascalCase.tsx`；hook `useXxx.ts`；工具 `camelCase.ts`；样式工厂 `styles/components/*.styles.ts`。详情见 [`engineering-quality.md`](./engineering-quality.md) §1。

**特殊目录**：`supabase/functions/delete-account/`（Edge 注销）；`app-store-submission/`（商店材料）。

---

## 5. 扩展约定（应在何处改代码）

| 场景 | 做法 |
|------|------|
| 新 Tab 屏 | `app/(tabs)/<name>.tsx` + 注册 Tab；实现放 `components/` 或 `features/` |
| 新独立屏 | `app/<name>.tsx` + 根 `Stack` 如需 |
| 新 Zustand 切片 | 扩展 `store/modules/types.ts` → 新建 `store/modules/<n>.ts` → 合入 `useAppStore.ts` |
| 新远端编排 | `services/<n>.ts`；纯函数 `utils/<n>.ts` |

---

## 6. 技术栈与版本锚点

**概览**：Expo ~54、RN 0.81、React 19、Expo Router ~6、Zustand ^5、Jest+ts-jest、ESLint+boundaries、EAS Build。Node ≥ 20（`.nvmrc`），包管理 **Yarn**。TypeScript `strict` + `@/*` 别名。

**权威来源**：完整依赖表、行号锚点以 **`package.json` / `app.json` / `eas.json`** 为准；下表仅列高频原生与云端依赖。

| 包 | 用途 |
|----|------|
| `expo-router` | 文件路由 |
| `expo-audio` | 录音/播放 |
| `expo-file-system` / `expo-media-library` | 音频缓存、导出相册 |
| `expo-secure-store` | Supabase 会话 |
| `@supabase/supabase-js` | 唯一云端客户端入口 `lib/supabase.ts` |
| `@shopify/flash-list` / `react-native-reanimated` / `@shopify/react-native-skia` | 列表与动效 |
| `lucide-react-native` | 图标 |

**构建**：`babel.config.js` 须含 `react-native-reanimated/plugin`（最后）；`metro.config.js` 生产期压缩选项已开。EAS profiles：`development` / `preview` / `production`（见 `eas.json`）。

---

## 7. 外部集成

| 类型 | 模块 | 说明 |
|------|------|------|
| Supabase | `lib/supabase.ts` | Auth、Postgres `profiles`/`entries`、Storage `audios`、Edge `delete-account` |
| Groq | `utils/aiService.ts` | OpenAI 兼容 `chat/completions`，`llama-3.1-8b-instant`；缺 key 时兜底文案 |
| Expo 设备能力 | 见 §6 | 触觉、相册、深链等分散在组件与 hooks |

**环境变量**（`.env.example`；勿将密钥提交入库）：

| 变量 | 用途 |
|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 云端；缺失则离线占位 client |
| `EXPO_PUBLIC_GROQ_API_KEY` | AI |
| Edge 运行时 | `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（仅 Edge，不进客户端） |

**离线 / 同步（摘要）**：写先入 AsyncStorage；`syncToCloud` / `syncFromCloud` 在 `useAppStore.ts`；墓碑删云见 `shared/sync/tombstone.ts` 与迁移 `entry_tombstones`（未执行 migration 前查询失败则降级为不删云）。音频路径与 Storage 约定见 `services/audioSync.ts`。

**未集成**：Sentry/埋点/推送/IAP 等当前未使用。

---

## 8. 关键入口速查

| 入口 | 文件 |
|------|------|
| 应用启动 | `app/_layout.tsx` |
| Store 初始化 / 同步 | `store/useAppStore.ts` |
| Supabase 客户端 | `lib/supabase.ts` |
| AI 调用 | `utils/aiService.ts` |
| 音频上云 | `services/audioSync.ts` |
| 录音手势与片段回调 | `shared/audio/recordingCoordinator.ts`、`components/AudioRecorder/RecordingSessionHost.tsx` |
| CI | `.github/workflows/ci.yml`（PR：`typecheck`→`lint`；push `master` 追加 `verify:governance`） |

---

*合并自原 `openspec/codebase/ARCHITECTURE`、`STRUCTURE`、`STACK`、`INTEGRATIONS` 核心条目；删去与领域规范重复的细节。*
