/**
 * sync.test.ts
 * 覆盖 shared/audio/sync.ts 的 applyRemoteUrlsToEntries（H7 回归点）：
 * - 空映射 / 无音频 entry：原样返回，writeback 为空
 * - 仅部分 audio 命中：仅命中 audio 被改，未命中保持原样
 * - 多 entry 部分命中：仅被改的 entry 进入 writeback
 * - 改动后的 audio 同时把 syncStatus 标记为 'synced'
 * - 未改动的 entry 保持原引用（浅相等优化）
 * - 输入 entries / audios 不可变（不修改原对象）
 */

import { applyRemoteUrlsToEntries } from '../../../../shared/audio/sync';
import { AudioData, MoodEntry, MoodLevel, Status } from '../../../../types';

function makeAudio(overrides: Partial<AudioData> = {}): AudioData {
  return {
    id: 'audio-1',
    localUri: 'file:///local/a.m4a',
    duration: 3,
    fileSize: 1024,
    fileHash: 'hash',
    createdAt: 1000,
    syncStatus: 'pending',
    ...overrides,
  };
}

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

describe('applyRemoteUrlsToEntries (H7 回归)', () => {
  it('空映射时原样返回 entries，writeback 为空（避免无谓的引用改动）', () => {
    const entries = [makeEntry({ audios: [makeAudio()] })];
    const result = applyRemoteUrlsToEntries(entries, new Map());

    expect(result.updatedEntries).toBe(entries); // 同引用
    expect(result.writeback).toEqual([]);
  });

  it('entries 都没有 audios 时 writeback 为空，updatedEntries 元素同引用', () => {
    const entries = [makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' })];
    const result = applyRemoteUrlsToEntries(
      entries,
      new Map([['audio-X', 'https://cdn/x.m4a']]),
    );

    expect(result.writeback).toEqual([]);
    expect(result.updatedEntries[0]).toBe(entries[0]);
    expect(result.updatedEntries[1]).toBe(entries[1]);
  });

  it('命中的 audio 写入 remoteUrl 并标记 syncStatus=synced（核心回归）', () => {
    const audio = makeAudio({ id: 'aud-1', syncStatus: 'pending' });
    const entries = [makeEntry({ id: 'e1', audios: [audio] })];

    const { updatedEntries, writeback } = applyRemoteUrlsToEntries(
      entries,
      new Map([['aud-1', 'https://cdn/aud-1.m4a']]),
    );

    expect(updatedEntries[0].audios?.[0]).toEqual({
      ...audio,
      remoteUrl: 'https://cdn/aud-1.m4a',
      syncStatus: 'synced',
    });
    expect(writeback).toHaveLength(1);
    expect(writeback[0]).toEqual({
      id: 'e1',
      audios: updatedEntries[0].audios,
    });
  });

  it('多 entry 部分命中：仅被改的 entry 进入 writeback', () => {
    const hitAudio = makeAudio({ id: 'aud-hit' });
    const missAudio = makeAudio({ id: 'aud-miss' });
    const entries = [
      makeEntry({ id: 'e-hit', audios: [hitAudio] }),
      makeEntry({ id: 'e-miss', audios: [missAudio] }),
      makeEntry({ id: 'e-empty' }),
    ];

    const { updatedEntries, writeback } = applyRemoteUrlsToEntries(
      entries,
      new Map([['aud-hit', 'https://cdn/hit.m4a']]),
    );

    expect(writeback).toHaveLength(1);
    expect(writeback[0].id).toBe('e-hit');

    // 未被改动的 entry 保持原引用
    expect(updatedEntries[1]).toBe(entries[1]);
    expect(updatedEntries[2]).toBe(entries[2]);
  });

  it('同一 entry 内部分 audio 命中：未命中的 audio 保持原状', () => {
    const hit = makeAudio({ id: 'aud-hit' });
    const miss = makeAudio({ id: 'aud-miss', remoteUrl: 'https://cdn/existing.m4a' });
    const entries = [makeEntry({ id: 'e1', audios: [hit, miss] })];

    const { updatedEntries, writeback } = applyRemoteUrlsToEntries(
      entries,
      new Map([['aud-hit', 'https://cdn/hit.m4a']]),
    );

    expect(updatedEntries[0].audios?.[0].remoteUrl).toBe('https://cdn/hit.m4a');
    expect(updatedEntries[0].audios?.[0].syncStatus).toBe('synced');
    expect(updatedEntries[0].audios?.[1]).toEqual(miss); // 未命中保持原样
    expect(writeback).toHaveLength(1);
  });

  it('不修改原 entries 数组与 audios 数组（不可变性）', () => {
    const audio = makeAudio({ id: 'aud-1', syncStatus: 'pending' });
    const entry = makeEntry({ id: 'e1', audios: [audio] });
    const entries = [entry];
    const originalAudios = entry.audios;

    applyRemoteUrlsToEntries(
      entries,
      new Map([['aud-1', 'https://cdn/aud-1.m4a']]),
    );

    expect(entry.audios).toBe(originalAudios); // 原 entry 引用不变
    expect(audio.syncStatus).toBe('pending'); // 原 audio 未被改
    expect(audio.remoteUrl).toBeUndefined();
  });

  it('audios 为空数组的 entry 视作无音频，保持原引用', () => {
    const entry = makeEntry({ id: 'e1', audios: [] });
    const { updatedEntries, writeback } = applyRemoteUrlsToEntries(
      [entry],
      new Map([['aud-1', 'https://cdn/aud-1.m4a']]),
    );

    expect(updatedEntries[0]).toBe(entry);
    expect(writeback).toEqual([]);
  });
});
