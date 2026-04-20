# 需求实施计划 - 解除循环依赖

## 问题描述

存在循环依赖链：
```
store/useAppStore.ts → store/modules/ai.ts → utils/aiService.ts → store/useAppStore.ts
```

`aiService.ts` 中以下函数直接调用 `useAppStore.getState().user` 获取用户信息：
- `generateReviewExportClosingLine` (line 504)
- `generateEmotionPodcast` (line 581)
- `generateEmotionPrescription` (line 693)

## 解决方案

采用**依赖注入**方案：将 `userId`、`userName` 和 `firstEntryDate` 作为参数传入相关函数，从源头解除循环依赖。

---

- [ ] 1. 修改 `generateReviewExportClosingLine` 函数
  - [ ] 1.1 添加 `userId` 和 `userName` 参数到函数签名
    - 参数类型：`userId: string, userName: string`
    - 更新缓存 key 使用传入的 `userId`
    - 更新 prompt 使用传入的 `userName`

  - [ ] 1.2 移除 `useAppStore` 调用
    - 删除 `const user = useAppStore.getState().user;`
    - 删除 `useAppStore` 导入语句

- [ ] 2. 修改 `generateEmotionPodcast` 函数
  - [ ] 2.1 添加 `userId` 和 `userName` 参数到函数签名
    - 参数类型：`userId: string, userName: string`
    - 更新缓存 key 使用传入的 `userId`
    - 更新 prompt 使用传入的 `userName`

  - [ ] 2.2 移除 `useAppStore` 调用
    - 删除 `const user = useAppStore.getState().user;`

- [ ] 3. 修改 `generateEmotionPrescription` 函数
  - [ ] 3.1 添加 `userId`、`userName` 和 `firstEntryDate` 参数到函数签名
    - 参数类型：`userId: string, userName: string, firstEntryDate?: number`
    - 更新缓存 key 使用传入的 `userId`
    - 更新 prompt 使用传入的 `userName` 和 `firstEntryDate`

  - [ ] 3.2 移除 `useAppStore` 调用
    - 删除 `const user = useAppStore.getState().user;`

- [ ] 4. 更新所有调用点
  - [ ] 4.1 在 `store/modules/ai.ts` 中修改 `generatePodcast` 调用
    - 从 `get()` 获取当前用户信息
    - 传递 `userId`、`userName` 参数

  - [ ] 4.2 查找并更新其他调用 `generateEmotionPodcast` 的地方

  - [ ] 4.3 查找并更新其他调用 `generateEmotionPrescription` 的地方

  - [ ] 4.4 查找并更新其他调用 `generateReviewExportClosingLine` 的地方

- [ ] 5. 检查点 - 确保没有残留的 `useAppStore` 导入
  - [ ] 5.1 验证 `aiService.ts` 中不再导入 `useAppStore`
  - [ ] 5.2 运行 `grep -r "useAppStore" utils/aiService.ts` 确认无结果

- [ ] 6. 运行 lint 和 typecheck
  - 运行 `yarn lint` 和 `yarn typecheck` 确保代码正确

- [ ] 7. 测试验证
  - [ ] 7.1 启动开发服务器验证无循环依赖警告
  - [ ] 7.2 测试 AI 功能正常运作
