/**
 * guestAudioStrip.test.ts
 * SEC-01 Wave 0：注销成功后 guest 快照保留正文、剥离 audios / remoteUrl（D-04）。
 */

import { stripAudiosFromEntries } from '../../../../shared/audio/guestAudioStrip';
import { AudioData, MoodEntry, MoodLevel, Status } from '../../../../types';

function makeAudio(overrides: Partial<AudioData> = {}): AudioData {
  return {
    id: 'audio-1',
    localUri: 'file:///local/a.m4a',
    remoteUrl: 'user-1/audio-1.m4a',
    duration: 3,
    fileSize: 1024,
    fileHash: 'hash',
    createdAt: 1000,
    syncStatus: 'synced',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'entry-1',
    timestamp: 1000,
    moodLevel: MoodLevel.ANNOYED,
    content: 'keep this diary text',
    deadline: 'later',
    people: ['Mom'],
    triggers: ['Late'],
    status: Status.ACTIVE,
    ...overrides,
  };
}

describe('stripAudiosFromEntries', () => {
  it('preserves entry text fields', () => {
    const entries = [
      makeEntry({
        id: 'e1',
        content: 'hello world',
        people: ['A'],
        triggers: ['B'],
        audios: [makeAudio()],
      }),
    ];
    const result = stripAudiosFromEntries(entries);
    expect(result[0].id).toBe('e1');
    expect(result[0].content).toBe('hello world');
    expect(result[0].people).toEqual(['A']);
    expect(result[0].triggers).toEqual(['B']);
    expect(result[0].moodLevel).toBe(MoodLevel.ANNOYED);
  });

  it('removes audios arrays so guest JSON has no audio arrays / remoteUrl retention', () => {
    const entries = [
      makeEntry({
        audios: [
          makeAudio({ remoteUrl: 'uid/x.m4a' }),
          makeAudio({ id: 'a2', remoteUrl: 'https://cdn/public/x.m4a' }),
        ],
      }),
    ];
    const result = stripAudiosFromEntries(entries);
    expect(result[0].audios === undefined || result[0].audios.length === 0).toBe(true);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/remoteUrl/);
    expect(serialized).not.toMatch(/uid\/x\.m4a/);
  });

  it('leaves entries without audios otherwise intact (no remoteUrl introduced)', () => {
    const entries = [makeEntry({ id: 'plain', content: 'no audio' })];
    const result = stripAudiosFromEntries(entries);
    expect(result[0].content).toBe('no audio');
    expect(result[0].audios === undefined || result[0].audios.length === 0).toBe(true);
  });

  it('does not mutate the input entries or audios arrays', () => {
    const audio = makeAudio();
    const entry = makeEntry({ audios: [audio] });
    const entries = [entry];
    stripAudiosFromEntries(entries);
    expect(entries[0].audios).toHaveLength(1);
    expect(entries[0].audios?.[0].remoteUrl).toBe('user-1/audio-1.m4a');
  });

  it('empty input → empty output', () => {
    expect(stripAudiosFromEntries([])).toEqual([]);
  });
});
