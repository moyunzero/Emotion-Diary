/**
 * shared/entries/visibility.ts — 软删过滤与新建 id 生成
 */

import {
  excludeSoftDeletedEntries,
  generateEntryId,
  isSoftDeleted,
  onlySoftDeletedEntries,
} from '../../../../shared/entries/visibility';
import type { MoodEntry } from '../../../../types';
import { Status } from '../../../../types';

const base = (): MoodEntry => ({
  id: 'e1',
  timestamp: 1,
  moodLevel: 2,
  content: '',
  deadline: 'later',
  people: [],
  triggers: [],
  status: Status.ACTIVE,
});

describe('isSoftDeleted', () => {
  it('deletedAt 为正数 → true', () => {
    expect(isSoftDeleted({ deletedAt: 100 })).toBe(true);
  });

  it('deletedAt 缺失 / 0 / null → false', () => {
    expect(isSoftDeleted({})).toBe(false);
    expect(isSoftDeleted({ deletedAt: 0 })).toBe(false);
    expect(isSoftDeleted({ deletedAt: null as unknown as number })).toBe(
      false,
    );
  });

  it('deletedAt 为负数 → false（边界：非正数均视为未软删）', () => {
    expect(isSoftDeleted({ deletedAt: -1 })).toBe(false);
  });
});

describe('excludeSoftDeletedEntries', () => {
  it('过滤已软删，保留其它', () => {
    const a = { ...base(), id: 'a' };
    const b = { ...base(), id: 'b', deletedAt: 99 };
    const c = { ...base(), id: 'c' };
    expect(excludeSoftDeletedEntries([a, b, c])).toEqual([a, c]);
  });

  it('不修改入参数组元素', () => {
    const list = [{ ...base(), deletedAt: 1 }];
    excludeSoftDeletedEntries(list);
    expect(list).toHaveLength(1);
  });
});

describe('onlySoftDeletedEntries', () => {
  it('仅返回软删条并按 deletedAt 降序', () => {
    const active = { ...base(), id: 'a' };
    const old = { ...base(), id: 'old', deletedAt: 100 };
    const recent = { ...base(), id: 'recent', deletedAt: 200 };
    expect(onlySoftDeletedEntries([active, old, recent])).toEqual([
      recent,
      old,
    ]);
  });
});

describe('generateEntryId', () => {
  it('符合 UUID v4 形态', () => {
    const id = generateEntryId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('连续两次不同', () => {
    expect(generateEntryId()).not.toBe(generateEntryId());
  });
});
