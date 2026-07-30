/**
 * services/audioSync.ts — Wave 0 stubs for SYNC-03 pool (D-10, D-11, D-13).
 *
 * Targets uploadPendingAudios concurrency cap 3 + fail-continue.
 * Return shape must stay { success, failed, results, failedAudioIds }
 * for applyAudioUploadResults at the syncToCloud call site (D-12).
 *
 * RED until Plan 08-04 implements the pool; no new npm deps (no p-limit).
 */

jest.mock('../../../shared/audio/uploadRetry', () => {
  const actual = jest.requireActual<
    typeof import('../../../shared/audio/uploadRetry')
  >('../../../shared/audio/uploadRetry');
  return {
    ...actual,
    sleepMs: jest.fn(() => Promise.resolve()),
  };
});

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
import { uploadPendingAudios } from '../../../services/audioSync';
import { AudioData } from '../../../types';

function makeAudio(id: string): AudioData {
  return {
    id,
    localUri: `file:///${id}.m4a`,
    duration: 1,
    fileSize: 1,
    fileHash: 'h',
    createdAt: 1,
    syncStatus: 'pending',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  mockFrom.mockImplementation(() => ({
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
  }));
});

describe('uploadPendingAudios concurrency (D-10)', () => {
  it('peak in-flight uploads never exceeds 3 and saturates at 3 when N>3', async () => {
    let inFlight = 0;
    let peakInFlight = 0;
    const gateResolvers: Array<() => void> = [];

    mockUpload.mockImplementation(() => {
      inFlight += 1;
      peakInFlight = Math.max(peakInFlight, inFlight);
      return new Promise<{ error: null }>((resolve) => {
        gateResolvers.push(() => {
          inFlight -= 1;
          resolve({ error: null });
        });
      });
    });

    const audios = [
      makeAudio('a1'),
      makeAudio('a2'),
      makeAudio('a3'),
      makeAudio('a4'),
      makeAudio('a5'),
    ];

    const pending = uploadPendingAudios(audios, 'user-1');

    // Allow the pool to fill before releasing any upload.
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));

    expect(peakInFlight).toBeLessThanOrEqual(3);
    expect(peakInFlight).toBe(3);

    while (gateResolvers.length > 0) {
      const resolvers = gateResolvers.splice(0, gateResolvers.length);
      resolvers.forEach((resolve) => resolve());
      await new Promise((r) => setImmediate(r));
    }

    const result = await pending;
    expect(result.success).toBe(5);
    expect(result.failed).toBe(0);
    expect(result.failedAudioIds).toEqual([]);
    expect(result.results.size).toBe(5);
  });
});

describe('uploadPendingAudios fail-continue (D-11)', () => {
  it('one failure still yields success remoteUrls for others and lists failed id', async () => {
    mockUpload.mockImplementation((_path: string, localUri: string) => {
      if (String(localUri).includes('bad')) {
        return Promise.resolve({ error: { message: 'upload failed' } });
      }
      return Promise.resolve({ error: null });
    });

    const audios = [
      makeAudio('ok1'),
      makeAudio('bad'),
      makeAudio('ok2'),
    ];

    const result = await uploadPendingAudios(audios, 'user-1');

    expect(result).toEqual(
      expect.objectContaining({
        success: 2,
        failed: 1,
        failedAudioIds: ['bad'],
      }),
    );
    expect(result.results.get('ok1')).toBe('user-1/ok1.m4a');
    expect(result.results.get('ok2')).toBe('user-1/ok2.m4a');
    expect(result.results.has('bad')).toBe(false);
    // Compatible with applyAudioUploadResults(entries, results, failedSet)
    expect(result.results).toBeInstanceOf(Map);
    expect(Array.isArray(result.failedAudioIds)).toBe(true);
  });
});
