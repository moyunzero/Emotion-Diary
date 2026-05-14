/**
 * shared/sync/tombstone.ts — B-3 墓碑管线纯逻辑（显式删云 / 合并过滤；普通删除不写墓碑见 002 SPEC）。
 */

import {
  collectTombstoneEntryIds,
  filterOutTombstonedEntries,
} from '../../../../shared/sync/tombstone';

describe('collectTombstoneEntryIds', () => {
  it('null / undefined → []', () => {
    expect(collectTombstoneEntryIds(null)).toEqual([]);
    expect(collectTombstoneEntryIds(undefined)).toEqual([]);
  });

  it('空数组 → []', () => {
    expect(collectTombstoneEntryIds([])).toEqual([]);
  });

  it('去重并保持首次出现顺序', () => {
    expect(
      collectTombstoneEntryIds([
        { entry_id: 'a' },
        { entry_id: 'b' },
        { entry_id: 'a' },
        { entry_id: 'b' },
      ]),
    ).toEqual(['a', 'b']);
  });

  it('忽略空串与仅空白', () => {
    expect(
      collectTombstoneEntryIds([
        { entry_id: '' },
        { entry_id: '   ' },
        { entry_id: 'ok' },
      ]),
    ).toEqual(['ok']);
  });

  it('忽略缺失 entry_id 与 null', () => {
    expect(
      collectTombstoneEntryIds([
        {},
        { entry_id: null },
        { entry_id: 'x' },
      ] as { entry_id?: string | null }[]),
    ).toEqual(['x']);
  });

  it('不修改入参数组元素', () => {
    const rows = [{ entry_id: 'a' }];
    collectTombstoneEntryIds(rows);
    expect(rows).toEqual([{ entry_id: 'a' }]);
  });
});

describe('filterOutTombstonedEntries', () => {
  const items = [{ id: '1', v: 1 }, { id: '2', v: 2 }];

  it('空墓碑集 → 浅拷贝原列表（非同一引用）', () => {
    const out = filterOutTombstonedEntries(items, new Set());
    expect(out).toEqual(items);
    expect(out).not.toBe(items);
  });

  it('剔除墓碑 id', () => {
    const out = filterOutTombstonedEntries(items, new Set(['2']));
    expect(out).toEqual([{ id: '1', v: 1 }]);
  });

  it('墓碑命中全部 → []', () => {
    expect(filterOutTombstonedEntries(items, new Set(['1', '2']))).toEqual([]);
  });

  it('不修改入参 items', () => {
    filterOutTombstonedEntries(items, new Set(['1']));
    expect(items).toHaveLength(2);
  });
});
