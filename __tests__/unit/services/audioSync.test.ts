/**
 * services/audioSync.ts — uploadAudioWithRetry
 */

jest.mock('../../../lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => false),
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

import { uploadAudioWithRetry } from '../../../services/audioSync';
import { AudioData } from '../../../types';

const audio: AudioData = {
  id: 'a1',
  localUri: 'file:///a.m4a',
  duration: 1,
  fileSize: 1,
  fileHash: 'h',
  createdAt: 1,
  syncStatus: 'pending',
};

describe('uploadAudioWithRetry', () => {
  it('首次成功立即返回', async () => {
    const upload = jest.fn().mockResolvedValue({
      success: true,
      remoteUrl: 'https://cdn/a.m4a',
    });
    const sleep = jest.fn();

    const result = await uploadAudioWithRetry(audio, 'user-1', {
      upload,
      sleep,
    });

    expect(result).toEqual({
      success: true,
      remoteUrl: 'https://cdn/a.m4a',
    });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('失败后退避再试，耗尽返回 false', async () => {
    const upload = jest
      .fn()
      .mockResolvedValueOnce({ success: false, error: 'net' })
      .mockResolvedValueOnce({ success: false, error: 'net' })
      .mockResolvedValueOnce({ success: false, error: 'net' });
    const sleep = jest.fn().mockResolvedValue(undefined);

    const result = await uploadAudioWithRetry(audio, 'user-1', {
      upload,
      sleep,
    });

    expect(result).toEqual({ success: false });
    expect(upload).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, 500);
    expect(sleep).toHaveBeenNthCalledWith(2, 1000);
  });
});
