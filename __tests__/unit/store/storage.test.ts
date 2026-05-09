/**
 * storage.test.ts
 * 覆盖 store/modules/storage.ts 的核心持久化行为：
 * - getStorageKey 键生成逻辑
 * - mergeEntries 合并策略
 * - loadFromStorage / saveToStorage（mock AsyncStorage）
 * - migrateFromLegacyStorage / migrateGuestDataToUser
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getStorageKey,
    loadFromStorage,
    mergeEntries,
    migrateFromLegacyStorage,
    migrateGuestDataToUser,
    removeFromStorage,
    saveToStorage,
} from '../../../store/modules/storage';
import { MoodEntry, MoodLevel, Status } from '../../../types';

// ── Mock AsyncStorage ──────────────────────────────────────────────────────────
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
      _store: store,
      _reset: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
  };
});

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage> & {
  _store: Record<string, string>;
  _reset: () => void;
};

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'entry-1',
    timestamp: 1000,
    moodLevel: MoodLevel.ANNOYED,
    content: 'test',
    deadline: 'later',
    people: [],
    triggers: [],
    status: Status.ACTIVE,
    ...overrides,
  };
}

beforeEach(() => {
  (mockStorage as any)._reset();
  jest.clearAllMocks();
});

// ── getStorageKey ──────────────────────────────────────────────────────────────
describe('getStorageKey', () => {
  it('returns guest key when userId is null', () => {
    expect(getStorageKey(null)).toBe('mood_entries_guest');
  });

  it('returns user-scoped key when userId is provided', () => {
    expect(getStorageKey('user-123')).toBe('mood_entries_user-123');
  });
});

// ── mergeEntries ───────────────────────────────────────────────────────────────
describe('mergeEntries', () => {
  it('returns combined entries when there are no ID conflicts', () => {
    const a = makeEntry({ id: 'a', timestamp: 2000 });
    const b = makeEntry({ id: 'b', timestamp: 1000 });
    const result = mergeEntries([a], [b]);
    expect(result).toHaveLength(2);
    // sorted descending by timestamp
    expect(result[0].id).toBe('a');
    expect(result[1].id).toBe('b');
  });

  it('keep-first: retains entry from entries1 on conflict', () => {
    const original = makeEntry({ id: 'x', timestamp: 1000, content: 'original' });
    const newer = makeEntry({ id: 'x', timestamp: 2000, content: 'newer' });
    const result = mergeEntries([original], [newer], 'keep-first');
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('original');
  });

  it('keep-second: replaces with entry from entries2 on conflict', () => {
    const original = makeEntry({ id: 'x', timestamp: 1000, content: 'original' });
    const newer = makeEntry({ id: 'x', timestamp: 2000, content: 'newer' });
    const result = mergeEntries([original], [newer], 'keep-second');
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('newer');
  });

  it('keep-latest (default): keeps the entry with the higher timestamp', () => {
    const older = makeEntry({ id: 'x', timestamp: 1000, content: 'older' });
    const newer = makeEntry({ id: 'x', timestamp: 2000, content: 'newer' });
    const result = mergeEntries([older], [newer]);
    expect(result[0].content).toBe('newer');
  });

  it('keep-latest: retains entries1 entry when it has a higher timestamp', () => {
    const newer = makeEntry({ id: 'x', timestamp: 3000, content: 'newer' });
    const older = makeEntry({ id: 'x', timestamp: 1000, content: 'older' });
    const result = mergeEntries([newer], [older]);
    expect(result[0].content).toBe('newer');
  });

  it('returns empty array when both inputs are empty', () => {
    expect(mergeEntries([], [])).toEqual([]);
  });
});

// ── loadFromStorage ────────────────────────────────────────────────────────────
describe('loadFromStorage', () => {
  it('returns empty array when key does not exist', async () => {
    const result = await loadFromStorage('missing-key');
    expect(result).toEqual([]);
  });

  it('returns parsed entries when key exists', async () => {
    const entry = makeEntry({ id: 'e1' });
    await AsyncStorage.setItem('test-key', JSON.stringify([entry]));
    const result = await loadFromStorage('test-key');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
  });

  it('returns empty array for invalid JSON', async () => {
    await AsyncStorage.setItem('bad-key', 'not-json{{{');
    const result = await loadFromStorage('bad-key');
    expect(result).toEqual([]);
  });

  it('returns empty array when stored value is not an array', async () => {
    await AsyncStorage.setItem('obj-key', JSON.stringify({ id: 'x' }));
    const result = await loadFromStorage('obj-key');
    expect(result).toEqual([]);
  });
});

// ── saveToStorage ──────────────────────────────────────────────────────────────
describe('saveToStorage', () => {
  it('persists entries and returns true', async () => {
    const entry = makeEntry({ id: 'save-1' });
    const ok = await saveToStorage('save-key', [entry]);
    expect(ok).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'save-key',
      JSON.stringify([entry]),
    );
  });

  it('returns false when AsyncStorage.setItem throws', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    const ok = await saveToStorage('fail-key', []);
    expect(ok).toBe(false);
  });
});

// ── removeFromStorage ──────────────────────────────────────────────────────────
describe('removeFromStorage', () => {
  it('removes the key and returns true', async () => {
    await AsyncStorage.setItem('rm-key', '[]');
    const ok = await removeFromStorage('rm-key');
    expect(ok).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('rm-key');
  });
});

// ── migrateFromLegacyStorage ───────────────────────────────────────────────────
describe('migrateFromLegacyStorage', () => {
  it('reports no migration needed when legacy key is empty', async () => {
    const result = await migrateFromLegacyStorage(null);
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('migrates legacy entries to the new key and removes the old key', async () => {
    const entry = makeEntry({ id: 'legacy-1' });
    await AsyncStorage.setItem('mood_entries', JSON.stringify([entry]));

    const result = await migrateFromLegacyStorage('user-abc');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);

    // legacy key should be gone
    const legacy = await AsyncStorage.getItem('mood_entries');
    expect(legacy).toBeNull();

    // new key should have the data
    const newData = await loadFromStorage('mood_entries_user-abc');
    expect(newData).toHaveLength(1);
    expect(newData[0].id).toBe('legacy-1');
  });
});

// ── migrateGuestDataToUser ─────────────────────────────────────────────────────
describe('migrateGuestDataToUser', () => {
  it('reports no migration when guest storage is empty', async () => {
    const result = await migrateGuestDataToUser('user-xyz');
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it('moves guest entries to user storage and clears guest key', async () => {
    const guestEntry = makeEntry({ id: 'guest-1', timestamp: 5000 });
    await AsyncStorage.setItem('mood_entries_guest', JSON.stringify([guestEntry]));

    const result = await migrateGuestDataToUser('user-xyz');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);

    // guest key should be cleared
    const guest = await AsyncStorage.getItem('mood_entries_guest');
    expect(guest).toBeNull();

    // user key should have the data
    const userData = await loadFromStorage('mood_entries_user-xyz');
    expect(userData[0].id).toBe('guest-1');
  });

  it('merges guest entries with existing user entries (keep-first on conflict)', async () => {
    const userEntry = makeEntry({ id: 'shared', timestamp: 9000, content: 'user-version' });
    const guestEntry = makeEntry({ id: 'shared', timestamp: 1000, content: 'guest-version' });
    await AsyncStorage.setItem('mood_entries_user-xyz', JSON.stringify([userEntry]));
    await AsyncStorage.setItem('mood_entries_guest', JSON.stringify([guestEntry]));

    const result = await migrateGuestDataToUser('user-xyz');
    expect(result.success).toBe(true);
    // keep-first: user entry wins
    const merged = result.data!;
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe('user-version');
  });
});
