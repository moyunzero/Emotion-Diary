# VERIFICATION：006-audio-reliability

## 已执行检查

| 检查项 | 结果 |
| --- | --- |
| `yarn typecheck` | 通过 |
| `yarn lint` | 通过（EntryCard hooks deps 已补） |
| `yarn test` | 通过（169 tests，2026-06 复验） |
| Playwright / Maestro E2E | `yarn test:e2e` / `yarn test:maestro:purge` | 通过（永久删除路径） |
| 设备：失败态 + 重试 | **未执行** |

## 变更摘要

- `shared/audio/uploadRetry.ts` — 指数退避（500/1000/2000ms）
- `uploadAudioWithRetry` + `failedAudioIds` 批量上传
- `applyAudioUploadResults` — synced / failed 标记
- `retryAudioUpload` + EntryCard「上传失败 · 点击重试」
- 备份时重试 `pending` + `failed`
