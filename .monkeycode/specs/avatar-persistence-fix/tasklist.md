# 需求实施计划 - 头像持久化修复

## 问题描述

用户登录后选择头像，退出后再次登录时，头像不是之前选择的新头像，而是旧的头像或默认头像。

## 问题分析

1. **缓存更新逻辑可能存在 Bug**：`login` 函数中后台更新缓存时，检查条件 `profile.name || profile.avatar` 可能导致头像更新不及时
2. **`user_session` 未保存 avatar**：登录时只保存了 `user_session`，但没有正确保存/恢复 avatar
3. **需要添加调试日志**：追踪 avatar 的来源和变化

---

- [ ] 1. 修复 `login` 函数中头像更新逻辑
  - [ ] 1.1 修改后台更新逻辑，分别检查 `profile.avatar` 和 `profile.name`
    - 移除联合条件 `(profile.name || profile.avatar)`
    - 改为分别检查和处理 `name` 和 `avatar`
    - 确保当 `profile.avatar` 存在时，即使 `profile.name` 不存在也更新头像

  - [ ] 1.2 确保 `AsyncStorage.setItem("user_session")` 包含完整的 avatar 数据
    - 检查保存的 userData 包含最新的 avatar

- [ ] 2. 修复 `_loadUser` 函数中头像更新逻辑
  - [ ] 2.1 同样修改后台更新逻辑，分别检查 `profile.avatar` 和 `profile.name`

- [ ] 3. 改进 `updateUser` 的缓存同步逻辑
  - [ ] 3.1 即使 `cachedProfile` 不存在，也应该更新缓存
    - 当 `cachedProfile` 为 null 时，创建一个新的缓存条目

- [ ] 4. 添加调试日志（可选，仅 DEV 模式）
  - [ ] 4.1 在头像加载和更新时添加日志，便于排查问题

- [ ] 5. 检查点 - 运行 lint 和 typecheck
  - 运行 `yarn lint` 和 `yarn typecheck` 确保代码正确

- [ ] 6. 验证修复
  - [ ] 6.1 确保登录后头像选择能正确保存
  - [ ] 6.2 确保登出后再次登录时头像正确恢复
