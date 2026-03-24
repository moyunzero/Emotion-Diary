# Quick Task 260324-gvn Summary

**Task:** Fix App Store rejection — 1) App name mismatch 2) Login network error

## 已完成

### Task 1：统一 App 名称（Guideline 2.3.8）

| 文件 | 修改 |
|------|------|
| `app.json` | `expo.name`: 焚语 → 心晴MO |
| `ios/app/Info.plist` | CFBundleDisplayName、CFBundleName: 焚语 → 心晴MO |
| `android/app/src/main/res/values/strings.xml` | app_name: 焚语 → 心晴MO |

设备端展示名称现已与 App Store 名称「心晴MO」一致。

### Task 2：审核回复与排查文档

| 文件 | 用途 |
|------|------|
| `app-store-submission/review-response-2.3.8-2.1a.md` | 提交到 App Store Connect 的审核回复模板 |
| `app-store-submission/supabase-login-checklist.md` | Supabase/登录问题排查清单 |

## 需人工操作

1. **EAS Secrets**：确认 `EXPO_PUBLIC_SUPABASE_URL` 与 `EXPO_PUBLIC_SUPABASE_ANON_KEY` 正确（Anon Key 应为 JWT 格式 `eyJ...`）
2. **审核账号**：确保 `appstore-review@moyunzero.com` 已注册且密码与 App Store Connect 中一致
3. **重新构建**：`eas build --profile production` 后重新提审
4. **在 App Store Connect 中回复**：使用 `review-response-2.3.8-2.1a.md` 内容回复审核团队
