# 风险与关注点（CONCERNS）

## 安全与隐私

- **`EXPO_PUBLIC_*` 变量**会打入客户端包：Groq、Supabase anon key 等均可被提取。依赖 **Supabase RLS**、密钥轮换与最小权限；敏感逻辑不应仅依赖前端隐藏。
- **离线占位 Supabase URL/Key**（`lib/supabase.ts`）：避免未配置时崩溃，但需确保错误路径不会误将离线客户端当已登录状态滥用。
- **生产环境 `drop_console`**（`metro.config.js`）：减少日志泄露，但不能替代服务端鉴权。

## 同步与数据一致性

- Store 使用 **互斥锁 + 防抖** 缓解竞态；极端网络条件下仍可能出现「本地与云端」冲突，需产品层定义以谁为准（当前实现以代码为准，详见 `store/useAppStore.ts` 同步分支）。
- **访客与注册用户迁移**（`migrateGuestDataToUser` 等）路径复杂，是回归测试重点区域。

## 外部服务依赖

- **Groq**：API 变更、限流或密钥失效会导致 AI 功能失败；需友好降级 UI。
- **Supabase**：项目暂停、RLS 策略错误会导致同步失败；`getErrorMessage` 已部分覆盖常见 PG 错误码。

## 技术债与未完成项

- **`utils/logger.ts`** 中存在 **TODO：日志持久化** 未实现。
- 代码库中 **TODO/FIXME** 密度低；新增技术债建议在 PR 中显式记录。

## 性能

- **Skia / Reanimated / FlashList** 已选用性能向库；低端机上 Skia 与复杂洞察视图仍可能掉帧，需真机 profile。
- **AI 缓存**有上限与 TTL，但长期会话仍应注意内存与请求频率。

## 构建与发布

- **EAS / 商店合规**：依赖 `verify:*` 脚本与人工检查；iOS/Android 权限文案需与真实功能一致（见 `app.json` 与 `app-store-submission/`）。
- **新架构**（`newArchEnabled: true`）：需关注第三方原生模块兼容性回归。

## 测试覆盖盲区

- Jest 以 **Mock 为主**，缺少真实设备上的 E2E；关键用户路径（登录、同步、离线切换）建议补充自动化或清单式手工回归。
