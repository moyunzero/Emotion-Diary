# Quick Plan 260324-gvn: Fix App Store Rejection

**Task:** Fix App Store rejection — 1) App name mismatch (心晴MO vs 焚语) 2) Login network error during review

---

## 问题分析

### 问题 1：Guideline 2.3.8 - App 名称不一致

| 位置 | 当前值 | 说明 |
|------|--------|------|
| 应用商店展示名 | 心晴MO | 在 App Store Connect 中配置 |
| 设备主屏名 | 焚语 | 来自 `app.json`、`ios/Info.plist`、`android/strings.xml` |

「心晴MO」与「焚语」差异过大，审核要求二者需足够相似以便用户辨认。

### 问题 2：Guideline 2.1(a) - 登录报错

- **现象**：审核员登录时显示「网络连接异常，请稍后重试」
- **触发条件**：`store/modules/user.ts` 中当 `error.message` 包含 `"Failed to fetch"` 或 `"Network"` 时抛出该提示
- **可能原因**：
  1. **Supabase 配置错误**：`.env` 中 `EXPO_PUBLIC_SUPABASE_ANON_KEY` 形如 `sb_publishable_*`，疑似 Stripe 密钥格式，非 Supabase JWT 格式（正常以 `eyJ` 开头）
  2. EAS 生产构建若未正确注入 Supabase 环境变量，请求会失败
  3. 审核环境网络策略（如 ATS、代理）可能导致 Supabase 请求被拦截

---

## 实施任务

### Task 1：统一 App 名称（代码侧）

**目标**：将设备显示名与商店名对齐。可选方案：
- **方案 A**：设备名改为「心晴MO」（与商店一致）
- **方案 B**：设备名改为「心晴」或「心晴·焚语」等相近名称

**建议**：采用方案 A，设备名改为「心晴MO」，与 App Store Connect 完全一致，无需改商店侧。

**修改文件**：
- `app.json`：`expo.name` → `"心晴MO"`
- `ios/app/Info.plist`：`CFBundleDisplayName`、`CFBundleName` → `心晴MO`
- `android/app/src/main/res/values/strings.xml`：`app_name` → `心晴MO`

**注意**：`app.json` 的 `name` 会被 Expo 用于生成 iOS/Android 原生配置；若使用 `expo prebuild`，需确保 `app.json` 修改后重新 prebuild 以更新 `ios/` 和 `android/`。

### Task 2：排查并修复登录错误

**2a. 验证 Supabase 配置**

- 检查 EAS Secrets 中 `EXPO_PUBLIC_SUPABASE_URL` 与 `EXPO_PUBLIC_SUPABASE_ANON_KEY` 是否正确
- Supabase anon key 应为 JWT 格式（以 `eyJ` 开头），长度约 200+ 字符
- 若 `.env` 中为错误 key，生产构建需在 EAS 中配置正确 Secrets

**2b. 为审核提供兜底说明（可选）**

- 在审核备注中说明：审核账号 `appstore-review@moyunzero.com` 已预注册，密码为 [提供的密码]
- 如 Supabase 在审核网络环境下不可达，可考虑在登录失败时增加「跳过登录继续使用离线功能」的提示，避免阻塞审核（需评估产品策略）

**2c. 改进错误提示**

- 当前「网络连接异常」可能由多种原因引起（包括密钥错误、CORS、服务不可用）
- 在 `store/modules/user.ts` 中区分：
  - 真正的网络错误（fetch failed、timeout）
  - Supabase 返回的明确错误（如 Invalid API key、401）
- 对「API key 无效」等明确错误给出更具体的提示，便于调试

---

## 执行清单

- [ ] Task 1.1：修改 `app.json` 的 `expo.name` 为 `心晴MO`
- [ ] Task 1.2：修改 `ios/app/Info.plist` 的 CFBundleDisplayName、CFBundleName
- [ ] Task 1.3：修改 `android/app/src/main/res/values/strings.xml` 的 app_name
- [ ] Task 2.1：验证 EAS Secrets 中的 Supabase 配置（需手动在 EAS 后台检查）
- [ ] Task 2.2：创建审核回复文档，说明已修复名称并确认审核账号可用

---

## 后续步骤（需人工）

1. 在 App Store Connect 中确认应用名称仍为「心晴MO」（或根据需要调整）
2. 在 EAS 项目设置中确认 `EXPO_PUBLIC_SUPABASE_URL` 和 `EXPO_PUBLIC_SUPABASE_ANON_KEY` 正确
3. 确保审核账号 `appstore-review@moyunzero.com` 已创建且密码正确
4. 重新构建并提交审核
