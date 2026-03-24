# App Store 审核回复（Guideline 2.3.8 + 2.1(a)）

**提交 ID：** b9b5ae4b-12b9-4ee8-bb5b-01f938981354  
**回复日期：** 2026-03-24

---

## Guideline 2.3.8 - App 名称一致性

**已修复：** 我们将设备端显示名称已统一为「心晴MO」，与 App Store  marketplace 名称一致。

**修改内容：**
- `app.json`：`expo.name` → 心晴MO
- iOS `Info.plist`：`CFBundleDisplayName`、`CFBundleName` → 心晴MO
- Android `strings.xml`：`app_name` → 心晴MO

用户在主屏上看到的 App 名称现为「心晴MO」，与商店搜索结果一致，便于辨认与查找。

---

## Guideline 2.1(a) - 登录错误排查说明

关于审核期间出现的「网络连接异常」提示，我们已进行以下检查与改进：

### 1. 审核账号确认

- 审核账号：`appstore-review@moyunzero.com`
- 该账号已在 Supabase Auth 中预先注册
- 请使用提交时在 App Store Connect「App 审核信息」中填写的密码进行登录

### 2. 云端配置核查

- 已确认生产构建使用的 Supabase 项目 URL 与 Anon Key 正确配置于 EAS Secrets
- Supabase 服务面向全球可用，无地域或 IP 限制

### 3. 若仍出现网络错误

如审核环境因网络策略导致无法连接 Supabase，建议：

- 尝试切换 Wi‑Fi 或使用蜂窝网络
- 应用支持**离线模式**：未登录时可正常使用记录、回顾、导出等核心功能；登录仅在用户主动开启「云端备份」时必需

### 4. 联系支持

若问题持续，请通过 App Store Connect 回复功能联系我们，我们将提供进一步的调试支持。

---

## 修改摘要

| 问题 | 处理方式 |
|------|----------|
| 2.3.8 名称不一致 | 设备名统一为「心晴MO」 |
| 2.1(a) 登录报错 | 确认审核账号、核查 Supabase 配置、说明离线能力 |
