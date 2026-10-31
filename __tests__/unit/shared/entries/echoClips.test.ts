/**
 * Wave 0 RED — shared/entries/echoClips (ECHO-02 / D-21, D-23, D-26, D-28)
 * Clips sorted by createdAt ascending; N=1 → no chip row; named labels truncate ~12 graphemes.
 * Plan 05: weather strip mapping (A1) + ink progress ratio.
 * Runtime require so missing module fails the test (not TS2307).
 */

import type { AudioData, MoodLevel } from '../../../../types';
import { MoodLevel as MoodLevelEnum } from '../../../../types';

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

type WeatherStripModule = {
  moodLevelToWeatherStripKey: (
    level: MoodLevel,
  ) => 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  inkProgressRatio: (position: number, duration: number) => number;
};

function loadEchoClips(): EchoClipsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../../shared/entries/echoClips') as EchoClipsModule;
}

function loadWeatherStrip(): WeatherStripModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../../shared/mood/weatherStrip') as WeatherStripModule;
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

describe('echoClips chipLabel (A1 segment copy)', () => {
  it('unnamed uses 第 N 段 / Clip N', () => {
    const { chipLabel } = loadEchoClips();
    expect(chipLabel(1, undefined, 'zh-Hans')).toMatch(/第\s*1\s*段/);
    expect(chipLabel(2, undefined, 'en-US')).toMatch(/Clip\s*2/i);
  });

  it('named form is short name only (truncated ~12 graphemes)', () => {
    const { chipLabel, truncateClipShortName } = loadEchoClips();
    const longName = '这是一段特别特别长的自定义录音名字超过十二字';
    const short = truncateClipShortName(longName, 12);
    expect([...short].length).toBeLessThanOrEqual(13); // 12 + optional ellipsis
    expect(short).not.toBe(longName);

    const labeled = chipLabel(1, longName, 'zh-Hans');
    expect(labeled).toBe(short);
    expect(labeled).not.toMatch(/声/);
  });
});

describe('weatherStrip MoodLevel mapping (A1 locked)', () => {
  it('maps 1→sunny, 2→cloudy, 3→rainy, 4–5→stormy', () => {
    const { moodLevelToWeatherStripKey } = loadWeatherStrip();
    expect(moodLevelToWeatherStripKey(MoodLevelEnum.ANNOYED)).toBe('sunny');
    expect(moodLevelToWeatherStripKey(MoodLevelEnum.UPSET)).toBe('cloudy');
    expect(moodLevelToWeatherStripKey(MoodLevelEnum.ANGRY)).toBe('rainy');
    expect(moodLevelToWeatherStripKey(MoodLevelEnum.FURIOUS)).toBe('stormy');
    expect(moodLevelToWeatherStripKey(MoodLevelEnum.EXPLOSIVE)).toBe('stormy');
  });
});

describe('inkProgressRatio (D-05 / D-11)', () => {
  it('clamps position/duration to 0..1', () => {
    const { inkProgressRatio } = loadWeatherStrip();
    expect(inkProgressRatio(0, 10)).toBe(0);
    expect(inkProgressRatio(5, 10)).toBe(0.5);
    expect(inkProgressRatio(10, 10)).toBe(1);
    expect(inkProgressRatio(15, 10)).toBe(1);
    expect(inkProgressRatio(-1, 10)).toBe(0);
    expect(inkProgressRatio(1, 0)).toBe(0);
  });
});
