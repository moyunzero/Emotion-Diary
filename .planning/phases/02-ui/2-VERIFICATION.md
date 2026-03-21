# Phase 2 Verification

**Date:** 2025-03-21  
**Status:** passed（代码与单测；真机相册权限需设备手测）

## Automated

- [x] `utils/reviewStatsTimeRange.ts`：`ReviewExportPreset`、`getReviewExportPeriods`
- [x] `app/review-export.tsx`、`app/_layout.tsx`：`/review-export` Stack
- [x] `components/Insights/index.tsx`：「生成情绪回顾图」→ `router.push('/review-export')`
- [x] `components/ReviewExport/*`：画布、`captureRef`（`tmpfile`）、`expo-media-library` 保存、`review_export_privacy_ack_v1`
- [x] `expo-media-library` 依赖；`app.json` 插件 + iOS `Info.plist` 相册说明
- [x] `__tests__/unit/utils/reviewStatsTimeRange.test.ts` 通过
- [x] `eslint`（ReviewExport 与相关路径）通过

## Manual / device

- [ ] iOS：首次保存相册权限弹窗与文案；保存后相册可见
- [ ] Android：同上

## Notes

- Web：`保存到相册` 提示使用原生应用（`Platform.OS === 'web'` 拦截）
