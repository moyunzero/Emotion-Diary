/**
 * 音频上传重试：指数退避延迟（纯函数，可单测）。
 */

export const AUDIO_UPLOAD_MAX_ATTEMPTS = 3;
export const AUDIO_UPLOAD_BASE_DELAY_MS = 500;

/** 第 n 次失败后的等待毫秒（n 从 0 起，对应第 1、2 次失败后的退避）。 */
export function computeUploadRetryDelayMs(failureIndex: number): number {
  if (failureIndex < 0) return AUDIO_UPLOAD_BASE_DELAY_MS;
  return AUDIO_UPLOAD_BASE_DELAY_MS * 2 ** failureIndex;
}

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
