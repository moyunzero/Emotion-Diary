/**
 * services/entryTombstones.ts — 拉取墓碑 id（Supabase 调用为 mock）
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  fetchUserTombstoneEntryIds,
  insertEntryTombstone,
} from '@/services/entryTombstones';

describe('fetchUserTombstoneEntryIds', () => {
  it('成功时返回去重 id 列表与 Set', async () => {
    const from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { entry_id: 'a' },
            { entry_id: 'b' },
            { entry_id: 'a' },
          ],
          error: null,
        }),
      }),
    });
    const client = { from } as unknown as SupabaseClient;

    const out = await fetchUserTombstoneEntryIds(client, 'user-1');

    expect(from).toHaveBeenCalledWith('entry_tombstones');
    expect(out.tombstoneFetchError).toBeNull();
    expect(out.tombstoneIdsArr).toEqual(['a', 'b']);
    expect(out.tombstoneIdSet).toEqual(new Set(['a', 'b']));
  });

  it('查询报错时仍对 data 做 collect，并带回 error', async () => {
    const from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ entry_id: 'x' }],
          error: { message: 'network' },
        }),
      }),
    });
    const client = { from } as unknown as SupabaseClient;

    const out = await fetchUserTombstoneEntryIds(client, 'user-2');

    expect(out.tombstoneFetchError).toEqual({ message: 'network' });
    expect(out.tombstoneIdsArr).toEqual(['x']);
    expect(out.tombstoneIdSet).toEqual(new Set(['x']));
  });
});

describe('insertEntryTombstone', () => {
  it('成功插入返回 null error', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn().mockReturnValue({ insert });
    const client = { from } as unknown as SupabaseClient;

    const out = await insertEntryTombstone(client, 'user-1', 'entry-1');

    expect(from).toHaveBeenCalledWith('entry_tombstones');
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      entry_id: 'entry-1',
    });
    expect(out.error).toBeNull();
  });

  it('23505 重复插入视为成功', async () => {
    const insert = jest.fn().mockResolvedValue({
      error: { message: 'dup', code: '23505' },
    });
    const from = jest.fn().mockReturnValue({ insert });
    const client = { from } as unknown as SupabaseClient;

    const out = await insertEntryTombstone(client, 'user-1', 'entry-1');
    expect(out.error).toBeNull();
  });
});
