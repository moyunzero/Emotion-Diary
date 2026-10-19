/**
 * store/sync/countPullConflicts.ts — read-only id and updatedat preview.
 */

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'zh-Hans' }]),
}));

import type { SupabaseClient } from '@supabase/supabase-js';

import { countPullConflicts } from '../../../../store/sync/countPullConflicts';

const USER_ID = 'user-1';
const ENTRY_ID = 'shared';
const OTHER_ID = 'other';

type QueryResult = { data: unknown; error: unknown };

function signedInClient(
  entries: QueryResult,
  tombstones: QueryResult = { data: [], error: null },
  session: {
    data: { session: { user: { id: string } } | null };
    error: unknown;
  } = {
    data: { session: { user: { id: USER_ID } } },
    error: null,
  },
) {
  const entriesEq = jest.fn().mockResolvedValue(entries);
  const entriesSelect = jest.fn().mockReturnValue({ eq: entriesEq });
  const tombstoneEq = jest.fn().mockResolvedValue(tombstones);
  const tombstoneSelect = jest.fn().mockReturnValue({ eq: tombstoneEq });
  const from = jest.fn((table: string) => {
    if (table === 'entry_tombstones') {
      return { select: tombstoneSelect };
    }
    return { select: entriesSelect };
  });
  const client = {
    from,
    auth: { getSession: jest.fn().mockResolvedValue(session) },
  } as unknown as SupabaseClient;
  return { client, entriesSelect, entriesEq };
}

function localEntry(id: string, updatedAt: number) {
  return { id, timestamp: 1_700_000_000_000, updatedAt };
}

describe('countPullConflicts', () => {
  beforeAll(async () => {
    const { initI18n } = await import('../../../../i18n');
    await initI18n();
  });

  it('returns ready total 1 for one strictly newer shared id (D-01)', async () => {
    const entriesEq = jest.fn().mockResolvedValue({
      data: [{ id: ENTRY_ID, updatedat: 1_700_000_001_000 }],
      error: null,
    });
    const entriesSelect = jest.fn().mockReturnValue({ eq: entriesEq });
    const tombstoneEq = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const tombstoneSelect = jest.fn().mockReturnValue({ eq: tombstoneEq });
    const from = jest.fn((table: string) => {
      if (table === 'entry_tombstones') {
        return { select: tombstoneSelect };
      }
      return { select: entriesSelect };
    });
    const client = {
      from,
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: USER_ID } } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    const result = await countPullConflicts(client, () => ({
      user: { id: USER_ID, name: 'Ada' },
      entries: [
        {
          id: ENTRY_ID,
          timestamp: 1_700_000_000_000,
          updatedAt: 1_700_000_002_000,
        },
      ],
    }));

    expect(result).toEqual({ status: 'ready', total: 1 });
    expect(entriesSelect).toHaveBeenCalledWith('id, updatedat');
    expect(entriesEq).toHaveBeenCalledWith('user_id', USER_ID);
    const selectArg = String(entriesSelect.mock.calls[0]?.[0]);
    expect(selectArg).not.toBe('*');
    expect(selectArg).not.toContain('content');
  });

  it('returns unknown when the entries error message is Network request failed (D-09)', async () => {
    const { client } = signedInClient({
      data: null,
      error: { message: 'Network request failed' },
    });

    const result = await countPullConflicts(client, () => ({
      user: { id: USER_ID },
      entries: [localEntry(ENTRY_ID, 1_700_000_002_000)],
    }));

    expect(result).toEqual({ status: 'unknown' });
    expect(result).not.toEqual({ status: 'ready', total: 0 });
  });

  it('rejects permission denied 42501 and does not return unknown (D-11)', async () => {
    const { client } = signedInClient({
      data: null,
      error: { message: 'permission denied', code: '42501' },
    });

    await expect(
      countPullConflicts(client, () => ({
        user: { id: USER_ID },
        entries: [localEntry(ENTRY_ID, 1_700_000_002_000)],
      })),
    ).rejects.toThrow();
  });

  it('returns ready total 0 for an empty entries list when a local entry exists (D-10)', async () => {
    const { client } = signedInClient({ data: [], error: null });

    const result = await countPullConflicts(client, () => ({
      user: { id: USER_ID },
      entries: [localEntry(ENTRY_ID, 1_700_000_002_000)],
    }));

    expect(result).toEqual({ status: 'ready', total: 0 });
  });

  it('returns ready total 0 when entries data is null and error is null (D-10)', async () => {
    const { client } = signedInClient({ data: null, error: null });

    const result = await countPullConflicts(client, () => ({
      user: { id: USER_ID },
      entries: [localEntry(ENTRY_ID, 1_700_000_002_000)],
    }));

    expect(result).toEqual({ status: 'ready', total: 0 });
  });

  it('throws when the store has no user (D-11)', async () => {
    const { client, entriesSelect } = signedInClient({ data: [], error: null });

    await expect(
      countPullConflicts(client, () => ({
        user: null,
        entries: [localEntry(ENTRY_ID, 1_700_000_002_000)],
      })),
    ).rejects.toThrow('认证状态验证失败，请重新登录');
    expect(entriesSelect).not.toHaveBeenCalled();
  });

  it('throws when getSession returns an error (D-11)', async () => {
    const { client, entriesSelect } = signedInClient(
      { data: [], error: null },
      { data: [], error: null },
      { data: { session: null }, error: { message: 'session down' } },
    );

    await expect(
      countPullConflicts(client, () => ({
        user: { id: USER_ID },
        entries: [localEntry(ENTRY_ID, 1_700_000_002_000)],
      })),
    ).rejects.toThrow('认证状态验证失败，请重新登录');
    expect(entriesSelect).not.toHaveBeenCalled();
  });

  it('throws when the session user id differs from the store user (D-11)', async () => {
    const { client, entriesSelect } = signedInClient(
      { data: [], error: null },
      { data: [], error: null },
      {
        data: { session: { user: { id: 'someone-else' } } },
        error: null,
      },
    );

    await expect(
      countPullConflicts(client, () => ({
        user: { id: USER_ID },
        entries: [localEntry(ENTRY_ID, 1_700_000_002_000)],
      })),
    ).rejects.toThrow('用户身份验证失败，请重新登录');
    expect(entriesSelect).not.toHaveBeenCalled();
  });

  it('counts a finite numeric-string updatedat and skips a non-numeric string (A2)', async () => {
    const { client } = signedInClient({
      data: [
        { id: ENTRY_ID, updatedat: '1700000000000' },
        { id: OTHER_ID, updatedat: 'not-a-time' },
      ],
      error: null,
    });

    const result = await countPullConflicts(client, () => ({
      user: { id: USER_ID },
      entries: [
        localEntry(ENTRY_ID, 1_700_000_000_001),
        localEntry(OTHER_ID, 1_700_000_000_001),
      ],
    }));

    expect(result).toEqual({ status: 'ready', total: 1 });
  });
});
