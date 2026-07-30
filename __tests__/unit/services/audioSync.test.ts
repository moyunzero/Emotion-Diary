/**
 * services/audioSync.ts — uploadAudio path writeback + uploadAudioWithRetry
 */

const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
const mockFrom = jest.fn((_bucket?: string) => ({
  upload: mockUpload,
  createSignedUrl: mockCreateSignedUrl,
}));

jest.mock('../../../lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: {
    storage: {
      from: (bucket: string) => mockFrom(bucket),
    },
  },
}));

import { isSupabaseConfigured } from '../../../lib/supabase';
import {
  resolvePlayableRemoteUrl,
  uploadAudio,
  uploadAudioWithRetry,
} from '../../../services/audioSync';
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

beforeEach(() => {
  jest.clearAllMocks();
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  mockFrom.mockImplementation(() => ({
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
  }));
});

describe('uploadAudio (SEC-02 path writeback)', () => {
  it('on success returns remoteUrl as object path, not http(s) URL', async () => {
    mockUpload.mockResolvedValue({ error: null });

    const result = await uploadAudio(audio, 'user-1');

    expect(result).toEqual({
      success: true,
      remoteUrl: 'user-1/a1.m4a',
    });
    expect(result.remoteUrl).not.toMatch(/^https?:\/\//i);
    expect(mockUpload).toHaveBeenCalledWith(
      'user-1/a1.m4a',
      'file:///a.m4a',
      expect.objectContaining({ contentType: 'audio/m4a', upsert: true }),
    );
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
  });
});

describe('resolvePlayableRemoteUrl', () => {
  it('extracts path and mints createSignedUrl with 86400 TTL', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/a.m4a?token=t' },
      error: null,
    });

    const url = await resolvePlayableRemoteUrl(
      'https://xyz.supabase.co/storage/v1/object/public/audios/user-1/a1.m4a',
    );

    expect(url).toBe('https://signed.example/a.m4a?token=t');
    expect(mockFrom).toHaveBeenCalledWith('audios');
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('user-1/a1.m4a', 86400);
  });

  it('returns null when path cannot be parsed', async () => {
    const url = await resolvePlayableRemoteUrl('https://cdn.example.com/other.m4a');
    expect(url).toBeNull();
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
  });
});

describe('uploadAudioWithRetry', () => {
  it('首次成功立即返回', async () => {
    const upload = jest.fn().mockResolvedValue({
      success: true,
      remoteUrl: 'user-1/a1.m4a',
    });
    const sleep = jest.fn();

    const result = await uploadAudioWithRetry(audio, 'user-1', {
      upload,
      sleep,
    });

    expect(result).toEqual({
      success: true,
      remoteUrl: 'user-1/a1.m4a',
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
