/**
 * editHistory.test.ts
 * 覆盖 shared/entries/editHistory.ts 的核心决策（H4 回归子集 / B-1 第一档）：
 * - 快照深拷贝：编辑后修改原 entry 不污染历史
 * - 上限截断：连续编辑 N+1 次只保留最近 N 条
 * - 不可变性：不修改入参数组
 * - 边界：undefined / limit<=0 / 空 history
 */

import {
  appendEditHistoryWithLimit,
  buildEditHistorySnapshot,
} from '../../../../shared/entries/editHistory';
import { EditHistory, MoodEntry, MoodLevel } from '../../../../types';

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: '1',
    timestamp: 1700000000000,
    moodLevel: MoodLevel.UPSET,
    content: 'original',
    deadline: 'today',
    people: ['Alice', 'Bob'],
    triggers: ['Late'],
    status: 'active' as MoodEntry['status'],
    ...overrides,
  };
}

describe('buildEditHistorySnapshot', () => {
  it('使用注入的 editedAt 而不是 Date.now()，保证测试稳定', () => {
    const entry = makeEntry();
    const snap = buildEditHistorySnapshot(entry, 1234567890);
    expect(snap.editedAt).toBe(1234567890);
  });

  it('快照保留改动前的内容 / 心情等级 / 截止 / 人物 / 触发器', () => {
    const entry = makeEntry({
      content: 'before',
      moodLevel: MoodLevel.ANGRY,
      deadline: 'week',
      people: ['Mom'],
      triggers: ['Chore', 'Late'],
    });

    const snap = buildEditHistorySnapshot(entry, 1);

    expect(snap.previousContent).toBe('before');
    expect(snap.previousMoodLevel).toBe(MoodLevel.ANGRY);
    expect(snap.previousDeadline).toBe('week');
    expect(snap.previousPeople).toEqual(['Mom']);
    expect(snap.previousTriggers).toEqual(['Chore', 'Late']);
  });

  it('对 people / triggers 做浅拷贝：后续修改原数组不污染快照（核心防御）', () => {
    const people = ['Alice'];
    const triggers = ['Late'];
    const entry = makeEntry({ people, triggers });

    const snap = buildEditHistorySnapshot(entry, 1);

    people.push('Bob');
    triggers.push('Noise');

    expect(snap.previousPeople).toEqual(['Alice']);
    expect(snap.previousTriggers).toEqual(['Late']);
  });

  it('支持空数组的人物 / 触发器', () => {
    const entry = makeEntry({ people: [], triggers: [] });
    const snap = buildEditHistorySnapshot(entry, 1);

    expect(snap.previousPeople).toEqual([]);
    expect(snap.previousTriggers).toEqual([]);
  });
});

describe('appendEditHistoryWithLimit', () => {
  const makeSnapshot = (n: number): EditHistory => ({
    editedAt: n,
    previousContent: `c${n}`,
    previousMoodLevel: MoodLevel.UPSET,
    previousDeadline: 'today',
    previousPeople: [],
    previousTriggers: [],
  });

  it('currentHistory 为 undefined 时按空数组处理', () => {
    const snap = makeSnapshot(1);
    const result = appendEditHistoryWithLimit(undefined, snap, 10);
    expect(result).toEqual([snap]);
  });

  it('正常追加：保留旧的 + 新的快照', () => {
    const existing = [makeSnapshot(1), makeSnapshot(2)];
    const newSnap = makeSnapshot(3);

    const result = appendEditHistoryWithLimit(existing, newSnap, 10);

    expect(result.map((s) => s.editedAt)).toEqual([1, 2, 3]);
  });

  it('超过 limit 时只保留最近 N 条（核心回归：内存泄漏防御）', () => {
    const existing = Array.from({ length: 10 }, (_, i) => makeSnapshot(i + 1));
    const newSnap = makeSnapshot(11);

    const result = appendEditHistoryWithLimit(existing, newSnap, 10);

    expect(result).toHaveLength(10);
    // 最早的应被丢弃，最新的应保留
    expect(result[0].editedAt).toBe(2);
    expect(result[9].editedAt).toBe(11);
  });

  it('不修改入参 currentHistory（不可变性）', () => {
    const existing = [makeSnapshot(1), makeSnapshot(2)];
    const before = [...existing];
    const newSnap = makeSnapshot(3);

    appendEditHistoryWithLimit(existing, newSnap, 10);

    expect(existing).toEqual(before);
  });

  it('limit = 0 时返回空数组（避免 slice(-0) 反向行为）', () => {
    const existing = [makeSnapshot(1), makeSnapshot(2)];
    const result = appendEditHistoryWithLimit(existing, makeSnapshot(3), 0);
    expect(result).toEqual([]);
  });

  it('limit 为负数时也返回空数组', () => {
    const existing = [makeSnapshot(1)];
    const result = appendEditHistoryWithLimit(existing, makeSnapshot(2), -5);
    expect(result).toEqual([]);
  });

  it('limit = 1 时只保留最新一条', () => {
    const existing = [makeSnapshot(1), makeSnapshot(2)];
    const result = appendEditHistoryWithLimit(existing, makeSnapshot(3), 1);
    expect(result).toEqual([makeSnapshot(3)]);
  });
});
