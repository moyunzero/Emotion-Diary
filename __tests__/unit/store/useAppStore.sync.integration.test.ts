/**
 * useAppStore sync integration — TEST-02 (D-05..D-08).
 *
 * D-05 scenarios:
 * - tombstone purge excludes upsert
 * - revision-meta push skip
 * - 42501 → 23505 → update (CR-01); meta advances only on update OK
 * - writeback failure clears lastSynced (CR-02)
 * - syncFromCloud cloud-wins merge
 *
 * Pattern 2 import mocks + Pattern 3 thenable supabase fake (09-RESEARCH).
 */

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'zh-Hans' }]),
}));

jest.mock('react-native-url-polyfill/auto', () => ({}), { virtual: true });

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  requestRecordingPermissionsAsync: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

jest.mock('@/components/Insights/utils', () => ({
  getGrowthStage: () => ({ stage: 'seed', label: 'seed', icon: null }),
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: '/cache/',
  documentDirectory: '/docs/',
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1 }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'ios', select: (spec: Record<string, unknown>) => spec.ios },
}));

const mockUploadPendingAudios = jest.fn();

jest.mock('@/services/audioSync', () => ({
  uploadPendingAudios: (...args: unknown[]) => mockUploadPendingAudios(...args),
  resolvePlayableRemoteUrl: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((k) => {
          delete store[k];
        });
      }),
      _store: store,
      _reset: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
  };
});

type Result = { data?: unknown; error?: unknown };
type Call = { table: string; op: string; payload?: unknown };

/** Mutable supabase fake state — `mock` prefix so Jest hoist can close over it. */
const mockSyncDb: {
  calls: Call[];
  handlers: Record<string, (payload: unknown, call: Call) => Result>;
  makeBuilder: (table: string) => Record<string, unknown>;
} = {
  calls: [],
  handlers: {},
  makeBuilder(table: string) {
    let op = 'select';
    let payload: unknown;
    const builder: Record<string, unknown> = {};
    const chain = (name: string) => (arg?: unknown) => {
      if (['select', 'delete', 'upsert', 'insert', 'update'].includes(name)) {
        op = name;
        payload = arg;
      }
      return builder;
    };
    for (const m of [
      'select',
      'delete',
      'upsert',
      'insert',
      'update',
      'eq',
      'in',
      'order',
    ]) {
      builder[m] = chain(m);
    }
    builder.single = () => builder;
    builder.then = (resolve: (r: Result) => unknown) => {
      const call: Call = { table, op, payload };
      mockSyncDb.calls.push(call);
      const h = mockSyncDb.handlers[`${table}.${op}`];
      return Promise.resolve(
        h ? h(payload, call) : { data: [], error: null },
      ).then(resolve);
    };
    return builder;
  },
};

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  registerSecureStorePersistFailureHandler: jest.fn(),
  supabase: {
    from: (table: string) => mockSyncDb.makeBuilder(table),
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { user: { id: 'u1' } } },
        error: null,
      })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodLevel, Status, type AudioData, type MoodEntry } from '@/types';
import { revisionMetaStorageKey } from '@/shared/sync/revisionMeta';
import { cleanupStoreTimers, useAppStore } from '@/store/useAppStore';

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage> & {
  _store: Record<string, string>;
  _reset: () => void;
};

/** Writeback update is audios-only; RLS update carries many columns (Pitfall 5). */
function isWritebackPayload(p: unknown): boolean {
  return (
    typeof p === 'object' &&
    p !== null &&
    Object.keys(p).length === 1 &&
    'audios' in p
  );
}

function makeEntry(partial: Partial<MoodEntry> & { id: string }): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp ?? 1000,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: partial.content ?? 'x',
    deadline: 'later',
    people: [],
    triggers: [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
    updatedAt: partial.updatedAt,
    audios: partial.audios,
  };
}

function makeAudio(partial: Partial<AudioData> & { id: string }): AudioData {
  return {
    id: partial.id,
    localUri: partial.localUri ?? `file:///${partial.id}.m4a`,
    remoteUrl: partial.remoteUrl,
    duration: partial.duration ?? 1,
    fileSize: partial.fileSize ?? 1,
    fileHash: partial.fileHash ?? 'h',
    createdAt: partial.createdAt ?? 1,
    syncStatus: partial.syncStatus ?? 'pending',
  };
}

function seedStore(entries: MoodEntry[] = []): void {
  useAppStore.setState({
    user: { id: 'u1', name: 'n' } as never,
    entries,
    syncStatus: 'idle',
    syncProgress: '',
    lastSyncTime: null,
  });
}

beforeEach(() => {
  mockStorage._reset();
  mockSyncDb.calls.length = 0;
  mockSyncDb.handlers = {};
  mockUploadPendingAudios.mockReset();
  mockUploadPendingAudios.mockResolvedValue({
    success: 0,
    failed: 0,
    results: new Map(),
    failedAudioIds: [],
  });
  seedStore();
});

afterAll(() => {
  cleanupStoreTimers();
});

describe('useAppStore sync integration (TEST-02 / D-05)', () => {
  it('harness loads store and exposes syncToCloud / syncFromCloud', () => {
    expect(typeof useAppStore.getState().syncToCloud).toBe('function');
    expect(typeof useAppStore.getState().syncFromCloud).toBe('function');
    expect(isWritebackPayload({ audios: [] })).toBe(true);
    expect(isWritebackPayload({ audios: [], id: 'e1' })).toBe(false);
  });

  describe('syncToCloud', () => {
    it('D-05 tombstone: purged entry excluded from upsert', async () => {
      mockSyncDb.handlers['entry_tombstones.select'] = () => ({
        data: [{ entry_id: 'e2' }],
        error: null,
      });

      seedStore([makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' })]);

      expect(await useAppStore.getState().syncToCloud()).toBe(true);

      const upsert = mockSyncDb.calls.find((c) => c.op === 'upsert');
      expect((upsert?.payload as { id: string }[]).map((e) => e.id)).toEqual([
        'e1',
      ]);
      expect(
        mockSyncDb.calls.some(
          (c) => c.table === 'entries' && c.op === 'delete',
        ),
      ).toBe(true);
      expect(useAppStore.getState().syncStatus).toBe('idle');
    });

    it('D-05 revision-meta: unchanged entry skipped on second push', async () => {
      seedStore([makeEntry({ id: 'e1', updatedAt: 5000 })]);

      await useAppStore.getState().syncToCloud();
      mockSyncDb.calls.length = 0;
      await useAppStore.getState().syncToCloud();

      expect(mockSyncDb.calls.some((c) => c.op === 'upsert')).toBe(false);
    });

    it('D-05 CR-01: 42501 then 23505 routes to update; meta advances only on update OK', async () => {
      mockSyncDb.handlers['entries.upsert'] = () => ({
        error: { code: '42501' },
      });
      mockSyncDb.handlers['entries.select'] = () => ({ data: [], error: null });
      mockSyncDb.handlers['entries.insert'] = () => ({
        error: { code: '23505' },
      });
      const updatePayloads: unknown[] = [];
      mockSyncDb.handlers['entries.update'] = (p) => {
        updatePayloads.push(p);
        return { error: null };
      };

      seedStore([makeEntry({ id: 'e1', updatedAt: 5000 })]);

      expect(await useAppStore.getState().syncToCloud()).toBe(true);
      expect(updatePayloads).toHaveLength(1);

      const meta = JSON.parse(
        mockStorage._store[revisionMetaStorageKey('u1')],
      );
      expect(meta.lastSyncedUpdatedAtByEntryId).toEqual({ e1: 5000 });
    });

    it('D-05 CR-01 twin: 23505 then update fail does not advance lastSynced', async () => {
      mockSyncDb.handlers['entries.upsert'] = () => ({
        error: { code: '42501' },
      });
      mockSyncDb.handlers['entries.select'] = () => ({ data: [], error: null });
      mockSyncDb.handlers['entries.insert'] = () => ({
        error: { code: '23505' },
      });
      mockSyncDb.handlers['entries.update'] = () => ({
        error: { message: 'denied' },
      });

      seedStore([makeEntry({ id: 'e1', updatedAt: 5000 })]);

      await useAppStore.getState().syncToCloud();

      expect(mockStorage._store[revisionMetaStorageKey('u1')]).toBeUndefined();
    });

    it('D-05 CR-02 writeback: failure clears lastSynced for that entry', async () => {
      mockSyncDb.handlers['entries.upsert'] = () => ({ error: null });
      mockSyncDb.handlers['entries.update'] = (p) =>
        isWritebackPayload(p)
          ? { error: { message: 'writeback boom' } }
          : { error: null };

      mockUploadPendingAudios.mockResolvedValue({
        success: 1,
        failed: 0,
        results: new Map([['a1', 'audios/u1/a1.m4a']]),
        failedAudioIds: [],
      });

      seedStore([
        makeEntry({
          id: 'e1',
          updatedAt: 5000,
          audios: [makeAudio({ id: 'a1' })],
        }),
      ]);

      await useAppStore.getState().syncToCloud();

      const meta = JSON.parse(
        mockStorage._store[revisionMetaStorageKey('u1')],
      );
      expect(meta.lastSyncedUpdatedAtByEntryId).toEqual({});
    });
  });

  describe('syncFromCloud', () => {
    it('D-05 syncFromCloud: cloud-wins merge + tombstone filter', async () => {
      mockSyncDb.handlers['entry_tombstones.select'] = () => ({
        data: [{ entry_id: 'e2' }],
        error: null,
      });
      mockSyncDb.handlers['entries.select'] = () => ({
        data: [
          {
            id: 'e1',
            user_id: 'u1',
            timestamp: 1_700_000_002_000,
            moodlevel: MoodLevel.ANNOYED,
            content: 'c',
            deadline: 'later',
            people: [],
            triggers: [],
            status: 'active',
            updatedat: 1_700_000_009_000,
            audios: [],
          },
        ],
        error: null,
      });

      seedStore([
        makeEntry({
          id: 'e1',
          content: 'x',
          updatedAt: 1_700_000_001_000,
          timestamp: 1_700_000_001_000,
        }),
        makeEntry({
          id: 'e2',
          content: 'x',
          updatedAt: 1_700_000_001_500,
          timestamp: 1_700_000_001_500,
        }),
      ]);

      expect(await useAppStore.getState().syncFromCloud()).toBe(true);

      const { entries, syncStatus } = useAppStore.getState();
      expect(syncStatus).toBe('idle');
      expect(entries.map((e) => e.id)).toEqual(['e1']);
      expect(entries[0].content).toBe('c');
      expect(entries[0].updatedAt).toBe(1_700_000_009_000);
    });
  });
});
