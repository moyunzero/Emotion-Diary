# 外部集成（INTEGRATIONS）

## Supabase（后端即服务）

- **客户端**：`@supabase/supabase-js`，封装于 `lib/supabase.ts`。
- **配置**：`EXPO_PUBLIC_SUPABASE_URL`、`EXPO_PUBLIC_SUPABASE_ANON_KEY`（见 `.env.example`）。未配置时控制台警告并以「离线占位」URL/Key 创建客户端，避免崩溃；业务通过 `isSupabaseConfigured()` 判断是否启用云端能力。
- **认证存储**：自定义 `SecureStoreAdapter`，将 `expo-secure-store` 适配为 Supabase Auth 的持久化存储；`autoRefreshToken`、`persistSession` 开启。
- **Polyfill**：`react-native-url-polyfill/auto` 在 `lib/supabase.ts` 与 `store/useAppStore.ts` 中引入。
- **数据面**：Store 内对 `profiles` 等表做存在性检查与同步逻辑（见 `store/useAppStore.ts` 中 `initializeDatabase` 等）；具体表结构依赖 Supabase 侧 SQL（错误信息中提示需在 SQL Editor 执行脚本）。

## Groq（LLM API）

- **用途**：情绪分析、预测、播客类文案等（`utils/aiService.ts`）。
- **端点**：`https://api.groq.com/openai/v1/chat/completions`。
- **模型**：`llama-3.1-8b-instant`（文件中常量 `GROQ_MODEL`）。
- **配置**：`EXPO_PUBLIC_GROQ_API_KEY`；缺失时相关功能需降级或不可用（由调用处逻辑决定）。
- **客户端缓存**：内存 `Map` + TTL + 最大条数限制，避免重复请求与内存无限增长。

## Hugging Face（可选）

- `.env.example` 含 `EXPO_PUBLIC_HF_TOKEN`，用于部分 AI/模型相关能力（具体调用点以 `grep EXPO_PUBLIC_HF` 或 imports 为准）。

## 其他 Expo 模块

- **Web 浏览器**：`expo-web-browser`（OAuth 或外链场景，插件在 `app.json` 中注册）。
- **链接**：`expo-linking` + `app.json` 中 `scheme: "emotiondiary"` 用于深度链接。
- **设备信息**：`expo-device`。
- **触觉**：`expo-haptics`。
- **截图**：`react-native-view-shot`（分享/导出类功能可能使用）。

## 环境变量与安全说明

- 所有 `EXPO_PUBLIC_*` 变量会进入**客户端打包产物**；敏感密钥应通过 **EAS Secrets** 等渠道注入，且仍需假设可被逆向，服务端应以 RLS/后端代理保护资源。
- `scripts/verify-env-security.js` 与 `verify:all` 系列脚本用于发布前校验配置（见 `package.json` scripts）。

## 关键文件路径

- `lib/supabase.ts` — Supabase 客户端与 `isSupabaseConfigured`
- `utils/aiService.ts` — Groq 调用与缓存
- `.env.example` — 变量清单与说明
- `utils/env.ts` — `__DEV__` / `NODE_ENV` 环境判断
