/**
 * shared/sync/pullConflictCount.ts — shared ids whose local revision is newer.
 */

import { countReplaceableSharedIds } from '../../../../shared/sync/pullConflictCount';

describe('countReplaceableSharedIds', () => {
  it('counts one shared id when local updatedAt is strictly greater (D-01)', () => {
    const total = countReplaceableSharedIds(
      [{ id: 'shared', updatedAt: 1_700_000_002_000 }],
      [{ id: 'shared', updatedat: 1_700_000_001_000 }],
      new Set(),
    );

    expect(typeof total).toBe('number');
    expect(total).toBe(1);
  });
});
