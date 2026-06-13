/**
 * shared/audio/uploadRetry.ts
 */

import {
  AUDIO_UPLOAD_BASE_DELAY_MS,
  AUDIO_UPLOAD_MAX_ATTEMPTS,
  computeUploadRetryDelayMs,
} from '../../../../shared/audio/uploadRetry';

describe('uploadRetry', () => {
  it('MAX_ATTEMPTS 为 3', () => {
    expect(AUDIO_UPLOAD_MAX_ATTEMPTS).toBe(3);
  });

  it('退避：500ms, 1000ms, 2000ms…', () => {
    expect(computeUploadRetryDelayMs(0)).toBe(500);
    expect(computeUploadRetryDelayMs(1)).toBe(1000);
    expect(computeUploadRetryDelayMs(2)).toBe(2000);
  });

  it('BASE_DELAY 为 500', () => {
    expect(AUDIO_UPLOAD_BASE_DELAY_MS).toBe(500);
  });
});
