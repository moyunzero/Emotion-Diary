const mockUploadPendingAudios = jest.fn();
const mockEqUser = jest.fn(async () => ({ error: null }));
const mockEqId = jest.fn(() => ({ eq: mockEqUser }));
const mockUpdate = jest.fn((_payload?: unknown) => ({ eq: mockEqId }));

jest.mock('../../../../services/audioSync', () => ({
  audioNeedsCloudUpload: (audio: {
    localUri?: string;
    remoteUrl?: string;
  }) =>
    Boolean(audio.localUri) &&
    typeof audio.remoteUrl === 'string' &&
    audio.remoteUrl.startsWith('https://'),
  uploadPendingAudios: (...args: unknown[]) => mockUploadPendingAudios(...args),
}));

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { user: { id: 'u1' } } },
        error: null,
      })),
    },
    from: () => ({
      update: (payload: unknown) => mockUpdate(payload),
    }),
  },
}));

import { repairCloudAudios } from '../../../../store/sync/repairCloudAudios';
import { resetSyncLockForTests } from '../../../../shared/sync/syncLock';
import type { AppState } from '../../../../store/modules/types';
import type { MoodEntry } from '../../../../types';

beforeEach(() => {
  jest.clearAllMocks();
  resetSyncLockForTests();
  mockEqUser.mockResolvedValue({ error: null });
});

describe('repairCloudAudios', () => {
  it('uploads a legacy clip and writes the object path back', async () => {
    mockUploadPendingAudios.mockResolvedValue({
      success: 1,
      failed: 0,
      results: new Map([['a1', 'u1/a1.m4a']]),
      failedAudioIds: [],
    });
    const save = jest.fn();
    const entry = {
      id: 'e1',
      audios: [
        {
          id: 'a1',
          localUri: 'file:///a.m4a',
          remoteUrl: 'https://example.supabase.co/storage/v1/object/public/audios/u1/a1.m4a',
          syncStatus: 'synced',
          duration: 1,
          fileSize: 1,
          fileHash: 'h',
          createdAt: 1,
        },
      ],
    } as MoodEntry;
    let entries = [entry];
    const get = () =>
      ({
        user: { id: 'u1' },
        entries,
        _saveEntries: save,
      }) as unknown as AppState;

    const onFinally = jest.fn();
    await repairCloudAudios(
      get,
      (partial) => {
        if (partial.entries) entries = partial.entries;
      },
      onFinally,
    );

    expect(mockUploadPendingAudios).toHaveBeenCalledTimes(1);
    expect(entries[0].audios?.[0].remoteUrl).toBe('u1/a1.m4a');
    expect(entries[0].audios?.[0].syncStatus).toBe('synced');
    expect(save).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      audios: entries[0].audios,
    });
    expect(onFinally).toHaveBeenCalledTimes(1);
  });

  it('does not resume a queued sync when it never took the lock', async () => {
    const { tryBeginSync } = await import(
      '../../../../shared/sync/syncLock'
    );
    tryBeginSync();
    const onFinally = jest.fn();

    await repairCloudAudios(
      () =>
        ({
          user: { id: 'u1' },
          entries: [
            {
              id: 'e1',
              audios: [
                {
                  id: 'a1',
                  localUri: 'file:///a.m4a',
                  remoteUrl: 'https://example.supabase.co/a.m4a',
                  syncStatus: 'synced',
                  duration: 1,
                  fileSize: 1,
                  fileHash: 'h',
                  createdAt: 1,
                },
              ],
            },
          ],
          _saveEntries: jest.fn(),
        }) as unknown as AppState,
      jest.fn(),
      onFinally,
    );

    expect(mockUploadPendingAudios).not.toHaveBeenCalled();
    expect(onFinally).not.toHaveBeenCalled();
  });

  it('does nothing when no clip still points at an http URL', async () => {
    const get = () =>
      ({
        user: { id: 'u1' },
        entries: [{ id: 'e1', audios: [] }],
        _saveEntries: jest.fn(),
      }) as unknown as AppState;

    await repairCloudAudios(get, jest.fn());

    expect(mockUploadPendingAudios).not.toHaveBeenCalled();
  });
});
