# Supabase 登录审核检查清单

用于排查审核期间「网络连接异常，请稍后重试」问题。

---

## 1. 验证 Supabase Anon Key 格式

**正确格式**：JWT，以 `eyJ` 开头，长度约 200–400 字符

**错误示例**：
- `sb_publishable_*`（疑似 Stripe 密钥）
- 过短或非 JWT 格式的字符串

**检查位置**：
- 本地：`.env` 中的 `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- 生产：EAS Secrets（`eas secret:list` 或 EAS 控制台）

---

## 2. EAS 生产构建环境变量

生产构建（`eas build --profile production`）需通过 EAS Secrets 注入：

```bash
# 设置生产环境变量
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT.supabase.co" --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..." --scope project
```

确认：
- [ ] `EXPO_PUBLIC_SUPABASE_URL` 正确且可访问
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` 为有效 JWT，来自 Supabase 项目设置 → API

---

## 3. 审核账号

- [ ] 邮箱 `appstore-review@moyunzero.com` 已在 Supabase Auth 中注册
- [ ] 密码与 App Store Connect「App 审核信息」中填写的一致
- [ ] 可在本地或测试设备上成功登录

---

## 4. Supabase 项目设置

- [ ] 项目 URL 使用 HTTPS
- [ ] Authentication → Providers → Email 已启用
- [ ] 无自定义 IP 限制或地域限制
- [ ] 如有 RLS，确保 `profiles` 等表对已认证用户可读写

---

## 5. 错误码与提示映射

当前 `store/modules/user.ts` 中：

- `"Failed to fetch"` 或 `"Network"` → 显示「网络连接异常，请稍后重试」
- 可能原因：网络不可达、CORS、无效 API key、Supabase 服务异常

若 Anon Key 错误，Supabase 可能返回 401/403，错误信息可能包含 `"Invalid API key"` 等，需在代码中单独处理并给出更明确提示。
