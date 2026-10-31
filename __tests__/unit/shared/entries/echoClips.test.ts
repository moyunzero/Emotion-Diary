/**
 * Wave 0 RED — shared/entries/echoClips (ECHO-02 / D-21, D-23, D-26, D-28)
 * Clips sorted by createdAt ascending; N=1 → no chip row; named labels truncate ~12 graphemes.
 * GREEN in Plan 05. Runtime require so missing module fails the test (not TS2307).
 */

import type { AudioData } from '../../../../types';

type EchoClipsModule = {
  sortClipsAscending: (clips: readonly AudioData[]) => AudioData[];
  chipLabel: (
    n: number,
    name?: string,
    locale?: 'zh-Hans' | 'en-US',
  ) => string;
  needsClipChips: (clipCount: number) => boolean;
  truncateClipShortName: (name: string, maxGraphemes?: number) => string;
};

function loadEchoClips(): EchoClipsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../../shared/entries/echoClips') as EchoClipsModule;
}

const clip = (overrides: Partial<AudioData> & { id: string; createdAt: number }): AudioData => ({
  localUri: `file:///${overrides.id}.m4a`,
  duration: 3,
  fileSize: 100,
  fileHash: overrides.id,
  syncStatus: 'pending',
  ...overrides,
});

describe('echoClips sort (D-28 / D-21)', () => {
  it('sorts by createdAt ascending; first clip is 第 1 声 default', () => {
    const { sortClipsAscending } = loadEchoClips();
    const later = clip({ id: 'later', createdAt: 300 });
    const earlier = clip({ id: 'earlier', createdAt: 100 });
    const mid = clip({ id: 'mid', createdAt: 200 });
    const sorted = sortClipsAscending([later, earlier, mid]);
    expect(sorted.map((c) => c.id)).toEqual(['earlier', 'mid', 'later']);
    expect(sorted[0]?.id).toBe('earlier');
  });

  it('does not mutate the input array', () => {
    const { sortClipsAscending } = loadEchoClips();
    const input = [
      clip({ id: 'b', createdAt: 2 }),
      clip({ id: 'a', createdAt: 1 }),
    ];
    const before = input.map((c) => c.id);
    sortClipsAscending(input);
    expect(input.map((c) => c.id)).toEqual(before);
  });
});

describe('echoClips chip visibility (D-26)', () => {
  it('N=1 implies no chip labels needed; N>1 shows chips', () => {
    const { needsClipChips } = loadEchoClips();
    expect(needsClipChips(0)).toBe(false);
    expect(needsClipChips(1)).toBe(false);
    expect(needsClipChips(2)).toBe(true);
  });
});

describe('echoClips chipLabel (D-23 / D-28)', () => {
  it('unnamed uses 第 N 声 / Voice N', () => {
    const { chipLabel } = loadEchoClips();
    expect(chipLabel(1, undefined, 'zh-Hans')).toMatch(/第\s*1\s*声|Voice\s*1/i);
    expect(chipLabel(2, undefined, 'en-US')).toMatch(/Voice\s*2/i);
  });

  it('named form includes truncated short name (~12 graphemes)', () => {
    const { chipLabel, truncateClipShortName } = loadEchoClips();
    const longName = '这是一段特别特别长的自定义录音名字超过十二字';
    const short = truncateClipShortName(longName, 12);
    expect([...short].length).toBeLessThanOrEqual(13); // 12 + optional ellipsis
    expect(short).not.toBe(longName);

    const labeled = chipLabel(1, longName, 'zh-Hans');
    expect(labeled).toMatch(/第\s*1\s*声/);
    expect(labeled).toContain('·');
    expect(labeled.length).toBeLessThan(longName.length + 20);
  });
});
