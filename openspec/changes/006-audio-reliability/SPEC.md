# SPEC：音频上传可靠（E-B）

## 目标

- `uploadPendingAudios`：指数退避重试；耗尽后 `syncStatus: failed`
- 备份时重试 `pending` + `failed`
- 条目内语音展示 pending/failed；failed 可点「重试上传」
- `applyAudioUploadResults` 合并成功 URL 与失败标记
- 不改 `recordingCoordinator`（006 独占，本任务不碰）

## 验收

- [x] 退避单测
- [x] 失败写入 entries + UI
- [x] 重试路径
- [x] CI 绿
