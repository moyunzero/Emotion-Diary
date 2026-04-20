# 需求实施计划 - Profile 缓存优化

- [ ] 1. 实现 Profile 缓存机制
  - [ ] 1.1 定义 Profile 缓存接口和数据结构
    - 在 `types.ts` 中添加 `CachedProfile` 类型，包含 profile 数据和缓存时间戳
    - 缓存 key 使用 `profile_cache_{userId}` 格式
    - 缓存有效期设置为 24 小时（TTL: 86400 秒）

  - [ ] 1.2 实现 profile 缓存的读取和写入函数
    - `getCachedProfile(userId: string): Promise<CachedProfile | null>`
    - `setCachedProfile(userId: string, profile: Partial<Profile>): Promise<void>`
    - `clearCachedProfile(userId: string): Promise<void>`

  - [ ] 1.3 修改 `_loadUser` 使用缓存
    - 优先从本地缓存读取 profile，减少网络请求
    - 缓存未命中或过期时才查询云端 `profiles` 表
    - 更新缓存时间戳

  - [ ] 1.4 修改 `login` 使用缓存
    - 登录后优先使用缓存的 profile 数据
    - 减少 `supabase.from("profiles").select("*")` 的调用
    - 后台静默更新缓存

  - [ ] 1.5 修改 `updateUser` 同步更新缓存
    - 更新 profile 后立即更新本地缓存
    - 确保缓存一致性

- [ ] 2. 登录后操作并行化
  - [ ] 2.1 分析 `login` 函数中的串行依赖
    - `migrateGuestDataToUser()` 或 `_loadEntries()` 互相独立
    - `initializeFirstEntryDate()` 与 `_loadEntries()` 可并行

  - [ ] 2.2 使用 `Promise.all` 并行化独立操作
    - `await Promise.all([get()._loadEntries(), get().initializeFirstEntryDate()])`
    - 确保两个操作都完成后再返回

- [ ] 3. 添加缓存管理逻辑
  - [ ] 3.1 在 `logout` 时清除 profile 缓存
  - [ ] 3.2 在用户切换时清除旧用户的 profile 缓存
  - [ ] 3.3 在 `deleteAccount` 时清除 profile 缓存

- [ ] 4. 检查点 - 运行 lint 和 typecheck
  - 运行 `yarn lint` 和 `yarn typecheck` 确保代码正确
