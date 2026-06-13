/**
 * shared/sync/cloudMerge.ts — syncFromCloud 合并语义（同 id 云端为准）
 */

import { mergeCloudPullEntries } from '../../../../shared/sync/cloudMerge';
import { MoodEntry, MoodLevel, Status } from '../../../../types';

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'e1',
    timestamp: 1000,
    moodLevel: MoodLevel.ANNOYED,
    content: 'local',
    deadline: 'later',
    people: [],
    triggers: [],
    status: Status.ACTIVE,
    ...overrides,
  };
}

describe('mergeCloudPullEntries', () => {
  it('保留仅存在于本地的 id', () => {
    const localOnly = makeEntry({ id: 'local-only', timestamp: 5000 });
    const result = mergeCloudPullEntries([localOnly], [], new Set());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('local-only');
  });

  it('同 id 以云端行覆盖（含恢复软删）', () => {
    const local = makeEntry({
      id: 'x',
      timestamp: 2000,
      content: 'local-soft',
      deletedAt: 99,
    });
    const cloud = makeEntry({
      id: 'x',
      timestamp: 1000,
      content: 'cloud-active',
      deletedAt: undefined,
    });
    const result = mergeCloudPullEntries([local], [cloud], new Set());
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('cloud-active');
    expect(result[0].deletedAt).toBeUndefined();
  });

  it('本地墓碑 id 从合并输入剔除（云端行在调用前已过滤墓碑）', () => {
    const tombstoned = makeEntry({ id: 'dead' });
    const result = mergeCloudPullEntries(
      [tombstoned],
      [],
      new Set(['dead']),
    );
    expect(result).toEqual([]);
  });

  it('按 timestamp 降序排序', () => {
    const a = makeEntry({ id: 'a', timestamp: 100 });
    const b = makeEntry({ id: 'b', timestamp: 300 });
    const c = makeEntry({ id: 'c', timestamp: 200 });
    const result = mergeCloudPullEntries([a, b, c], [], new Set());
    expect(result.map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });

  it('不修改入参数组元素', () => {
    const local = [makeEntry({ id: 'l' })];
    const cloud = [makeEntry({ id: 'c', content: 'cloud' })];
    mergeCloudPullEntries(local, cloud, new Set());
    expect(local[0].content).toBe('local');
    expect(cloud[0].content).toBe('cloud');
  });
});
