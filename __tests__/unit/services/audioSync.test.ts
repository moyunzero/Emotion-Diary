/**
 * services/audioSync.ts — uploadAudio path writeback + uploadAudioWithRetry
 */

const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();
const mockReadAsStringAsync = jest.fn();
const mockGetInfoAsync = jest.fn();
const mockFetch = jest.fn();

function m4aHeaderResponse() {
  const bytes = new Uint8Array(16);
  bytes.set([0x66, 0x74, 0x79, 0x70], 4);
  return {
    ok: true,
    status: 206,
    arrayBuffer: async () => bytes.buffer,
  };
}
const mockFrom = jest.fn((_bucket?: string) => ({
  upload: mockUpload,
  createSignedUrl: mockCreateSignedUrl,
}));

jest.mock('expo-file-system', () => ({
  EncodingType: { Base64: 'base64' },
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
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
  audioNeedsCloudUpload,
  repairActionForAudio,
  resolvePlayableRemoteUrl,
  uploadAudio,
  uploadAudioWithRetry,
  uploadPendingAudios,
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
  mockGetInfoAsync.mockResolvedValue({ exists: true, size: 8 });
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  mockFrom.mockImplementation(() => ({
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
  }));
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue(m4aHeaderResponse());
});

describe('uploadAudio (SEC-02 path writeback)', () => {
  it('uploads file bytes and returns the object path, not an http(s) URL', async () => {
    const payload = Buffer.from('m4a-bytes');
    mockReadAsStringAsync.mockResolvedValue(payload.toString('base64'));
    mockUpload.mockResolvedValue({ error: null });

    const result = await uploadAudio(audio, 'user-1');

    expect(result).toEqual({
      success: true,
      remoteUrl: 'user-1/a1.m4a',
    });
    expect(result.remoteUrl).not.toMatch(/^https?:\/\//i);
    expect(mockReadAsStringAsync).toHaveBeenCalledWith('file:///a.m4a', {
      encoding: 'base64',
    });
    const [path, body, options] = mockUpload.mock.calls[0];
    expect(path).toBe('user-1/a1.m4a');
    expect(body).toBeInstanceOf(ArrayBuffer);
    expect(Buffer.from(body).equals(payload)).toBe(true);
    expect(options).toEqual(
      expect.objectContaining({ contentType: 'audio/m4a', upsert: true }),
    );
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
  });

  it('does not upload when the file body is a path string', async () => {
    mockReadAsStringAsync.mockResolvedValue(
      Buffer.from('file:///tmp/clip.m4a').toString('base64'),
    );

    const result = await uploadAudio(audio, 'user-1');

    expect(result).toEqual({ success: false, error: '文件内容不是音频' });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('does not upload when the local file is empty', async () => {
    mockReadAsStringAsync.mockResolvedValue('');

    const result = await uploadAudio(audio, 'user-1');

    expect(result.success).toBe(false);
    expect(mockUpload).not.toHaveBeenCalled();
  });
});

describe('audioNeedsCloudUpload', () => {
  it('reuploads a synced clip that still points at an http URL when the local file remains', () => {
    expect(
      audioNeedsCloudUpload({
        localUri: 'file:///a.m4a',
        remoteUrl: 'https://example.supabase.co/storage/v1/object/public/audios/u/a.m4a',
        syncStatus: 'synced',
      }),
    ).toBe(true);
  });

  it('skips a synced clip whose remoteUrl is already an object path', () => {
    expect(
      audioNeedsCloudUpload({
        localUri: 'file:///a.m4a',
        remoteUrl: 'user-1/a1.m4a',
        syncStatus: 'synced',
      }),
    ).toBe(false);
  });

  it('skips a legacy http URL when this device has no local file', () => {
    expect(
      audioNeedsCloudUpload({
        remoteUrl: 'https://example.supabase.co/storage/v1/object/public/audios/u/a.m4a',
        syncStatus: 'synced',
      }),
    ).toBe(false);
  });
});

describe('repairActionForAudio', () => {
  const file = 'file:///clip.m4a';

  it('uploads a synced http clip only when the local file has bytes', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 12 });
    await expect(
      repairActionForAudio({
        localUri: file,
        remoteUrl: 'https://cdn.example/a.m4a',
        syncStatus: 'synced',
      }),
    ).resolves.toBe('upload');
  });

  it('skips a synced http clip whose file is missing or empty', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false, size: 0 });
    await expect(
      repairActionForAudio({
        localUri: file,
        remoteUrl: 'HTTP://cdn.example/a.m4a',
        syncStatus: 'synced',
      }),
    ).resolves.toBe('skip-missing');

    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 0 });
    await expect(
      repairActionForAudio({
        localUri: file,
        remoteUrl: 'https://cdn.example/a.m4a',
        syncStatus: 'synced',
      }),
    ).resolves.toBe('skip-missing');
  });

  it('does not upload a synced clip that already has an object path', async () => {
    await expect(
      repairActionForAudio({
        localUri: file,
        remoteUrl: 'user-1/a.m4a',
        syncStatus: 'synced',
      }),
    ).resolves.toBe('skip');
    expect(mockGetInfoAsync).not.toHaveBeenCalled();
  });

  it('fails a pending or failed clip when the file is missing', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false, size: 0 });
    await expect(
      repairActionForAudio({
        localUri: file,
        syncStatus: 'pending',
      }),
    ).resolves.toBe('fail-missing');
    await expect(
      repairActionForAudio({
        localUri: file,
        remoteUrl: 'https://cdn.example/a.m4a',
        syncStatus: 'failed',
      }),
    ).resolves.toBe('fail-missing');
  });

  it('uploads pending and failed clips that still have a file', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 4 });
    await expect(
      repairActionForAudio({ localUri: file, syncStatus: 'pending' }),
    ).resolves.toBe('upload');
    await expect(
      repairActionForAudio({ localUri: file, syncStatus: 'failed' }),
    ).resolves.toBe('upload');
  });

  it('treats a filesystem error as a missing file', async () => {
    mockGetInfoAsync.mockRejectedValue(new Error('boom'));
    await expect(
      repairActionForAudio({ localUri: file, syncStatus: 'pending' }),
    ).resolves.toBe('fail-missing');
    await expect(
      repairActionForAudio({
        localUri: file,
        remoteUrl: 'https://cdn.example/a.m4a',
        syncStatus: 'synced',
      }),
    ).resolves.toBe('skip-missing');
  });

  it('skips when there is no local uri, even if status is pending', async () => {
    await expect(
      repairActionForAudio({
        remoteUrl: 'https://cdn.example/a.m4a',
        syncStatus: 'pending',
      }),
    ).resolves.toBe('skip');
  });
});

describe('uploadPendingAudios legacy repair', () => {
  it('uploads the legacy http clip and leaves the path clip alone', async () => {
    mockReadAsStringAsync.mockResolvedValue(Buffer.from('m4a').toString('base64'));
    mockUpload.mockResolvedValue({ error: null });

    const result = await uploadPendingAudios(
      [
        {
          ...audio,
          id: 'legacy',
          syncStatus: 'synced',
          remoteUrl:
            'https://example.supabase.co/storage/v1/object/public/audios/u/legacy.m4a',
        },
        {
          ...audio,
          id: 'fresh',
          syncStatus: 'synced',
          remoteUrl: 'user-1/fresh.m4a',
        },
      ],
      'user-1',
    );

    expect(result.success).toBe(1);
    expect(result.results.get('legacy')).toBe('user-1/legacy.m4a');
    expect(result.results.has('fresh')).toBe(false);
  });

  it('skips a legacy http clip when the local file is not on this device', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false });

    const result = await uploadPendingAudios(
      [
        {
          ...audio,
          id: 'legacy',
          syncStatus: 'synced',
          remoteUrl:
            'https://example.supabase.co/storage/v1/object/public/audios/u/legacy.m4a',
        },
      ],
      'user-1',
    );

    expect(result).toEqual({
      success: 0,
      failed: 0,
      results: new Map(),
      failedAudioIds: [],
    });
    expect(mockUpload).not.toHaveBeenCalled();
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
    expect(mockFetch).toHaveBeenCalledWith(
      'https://signed.example/a.m4a?token=t',
      expect.objectContaining({
        headers: { Range: 'bytes=0-15' },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('returns null when the object body is a stored file path', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/a.m4a?token=t' },
      error: null,
    });
    const text = Buffer.from('file:///Users/moyun/clip.m4a');
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () =>
        text.buffer.slice(text.byteOffset, text.byteOffset + text.byteLength),
    });

    const url = await resolvePlayableRemoteUrl('user-1/a1.m4a');

    expect(url).toBeNull();
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
