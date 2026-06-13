# PLAN：004-sync-ux-clarity

## 步骤

1. `shared/sync/syncLock.ts` + 单测（自 `syncStatus.test` 迁移）
2. `useAppStore` 改用 `syncLock`（行为等价）
3. `constants/syncDataOps.ts` + Profile 文案/说明/确认框
4. `useProfileSyncHandlers` 对齐 store 状态与返回值
5. `generateForecast` OQ-4
6. SPEC / state-management / VERIFICATION

## 验证

- `yarn typecheck` / `yarn test`
- 手工：Profile 合并确认、pending 提示（可选双次快速点备份）
