/**
 * store/sync/countPullConflicts.ts — read-only id and updatedat preview.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { countPullConflicts } from '../../../../store/sync/countPullConflicts';

const USER_ID = 'user-1';
const ENTRY_ID = 'shared';

describe('countPullConflicts', () => {
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
});
