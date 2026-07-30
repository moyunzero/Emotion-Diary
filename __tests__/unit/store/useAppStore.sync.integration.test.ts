/**
 * useAppStore sync integration — Wave 0 harness for TEST-02 (D-05..D-08).
 *
 * D-05 scenarios (Plan 09-04 greens assertions):
 * - tombstone purge excludes upsert
 * - revision-meta push skip
 * - 42501 → 23505 → update (CR-01); meta advances only on update OK
 * - writeback failure clears lastSynced (CR-02)
 * - syncFromCloud cloud-wins merge
 *
 * Pattern 2 import mocks + Pattern 3 thenable supabase fake (09-RESEARCH).
 * RED until Plan 09-04 fills RESEARCH verified expects; do not describe.skip.
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

describe('useAppStore sync integration (TEST-02 / D-05 Wave 0)', () => {
  it('harness loads store and exposes syncToCloud / syncFromCloud', () => {
    expect(typeof useAppStore.getState().syncToCloud).toBe('function');
    expect(typeof useAppStore.getState().syncFromCloud).toBe('function');
    expect(isWritebackPayload({ audios: [] })).toBe(true);
    expect(isWritebackPayload({ audios: [], id: 'e1' })).toBe(false);
  });

  it('D-05 tombstone: purged entry excluded from upsert', async () => {
    // Plan 09-04: RESEARCH Code Example — tombstone purge excludes upsert
    seedStore([makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' })]);
    expect(useAppStore.getState().entries).toHaveLength(2);
    expect(false).toBe(true);
  });

  it('D-05 revision-meta: unchanged entry skipped on second push', async () => {
    // Plan 09-04: RESEARCH — push skip via revision meta
    seedStore([makeEntry({ id: 'e1', updatedAt: 5000 })]);
    expect(false).toBe(true);
  });

  it('D-05 CR-01: 42501 then 23505 routes to update; meta advances only on update OK', async () => {
    // Plan 09-04: RESEARCH CR-01 + negative twin (update fail)
    seedStore([makeEntry({ id: 'e1', updatedAt: 5000 })]);
    expect(false).toBe(true);
  });

  it('D-05 CR-02 writeback: failure clears lastSynced for that entry', async () => {
    // Plan 09-04: RESEARCH CR-02 — audios-only update error clears meta
    seedStore([
      makeEntry({
        id: 'e1',
        updatedAt: 5000,
        audios: [makeAudio({ id: 'a1' })],
      }),
    ]);
    expect(false).toBe(true);
  });

  it('D-05 syncFromCloud: cloud-wins merge + tombstone filter', async () => {
    // Plan 09-04: cloud-wins merge via syncFromCloud
    seedStore([makeEntry({ id: 'e1', content: 'x' })]);
    expect(false).toBe(true);
  });
});
