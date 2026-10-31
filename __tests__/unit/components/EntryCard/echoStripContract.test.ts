/**
 * EntryCard echo / smoke strip contracts (ECHO-01..03 + D-17)
 * Source-scan (moodWashBurned pattern); no RN StyleSheet import in this suite.
 * GREEN: Plan 02 (strip/mic/Play/D-17/D-37). Smoke: Plan 04. Chips: Plan 05.
 */

import fs from 'fs';
import path from 'path';

const entryCardSource = fs.readFileSync(
  path.join(__dirname, '../../../../components/EntryCard/EntryCard.tsx'),
  'utf8',
);
const entryCardPlaybackSource = fs.readFileSync(
  path.join(
    __dirname,
    '../../../../components/EntryCard/EntryCardPlayback.tsx',
  ),
  'utf8',
);
const entryCardStylesSource = fs.readFileSync(
  path.join(__dirname, '../../../../styles/components/EntryCard.styles.ts'),
  'utf8',
);

/** Collapse→stop effect block historically tied to isExpanded + stopAudio (D-17 forbid). */
function collapseStopEffectPresent(source: string): boolean {
  return (
    /becameCollapsed[\s\S]{0,120}stopAudio\(/.test(source) ||
    (/wasExpandedRef[\s\S]{0,400}stopAudio\(/.test(source) &&
      /isExpanded/.test(source))
  );
}

describe('echoStripContract — listen strip (ECHO-01 / D-01)', () => {
  it('EntryCard / playback source includes echo strip affordance (i18n or testID)', () => {
    const combined = `${entryCardSource}\n${entryCardPlaybackSource}\n${entryCardStylesSource}`;
    const hasStripIntent =
      /entryCard\.echoStrip|echoStripLabel|listenThisMoment|entry-echo-strip|听这一刻/.test(
        combined,
      ) || /testID=["']entry-echo-strip["']/.test(combined);
    expect(hasStripIntent).toBe(true);
  });
});

describe('echoStripContract — mic badge removed when strip path (D-08)', () => {
  it('does not render EntryCardAudioTag / Mic corner when echo strip is the audio chrome', () => {
    // Strip path present implies mic tag chrome must be gone.
    expect(entryCardSource).not.toMatch(/EntryCardAudioTag/);
    expect(entryCardPlaybackSource).not.toMatch(
      /export function EntryCardAudioTag/,
    );
    expect(entryCardPlaybackSource).not.toMatch(/\bMic\b/);
  });
});

describe('echoStripContract — no Play/Pause row chrome (D-09)', () => {
  it('removes legacy expanded Play/Pause list rows and duration readout', () => {
    expect(entryCardPlaybackSource).not.toMatch(/\bPlay\b/);
    expect(entryCardPlaybackSource).not.toMatch(/\bPause\b/);
    expect(entryCardPlaybackSource).not.toMatch(/audioPlayRow/);
    expect(entryCardPlaybackSource).not.toMatch(/entry-audio-playing/);
  });
});

describe('echoStripContract — smoke strip (ECHO-03 / D-29 D-30)', () => {
  it('burned-had-audio path uses smoke copy keys (not playable burned list)', () => {
    const combined = `${entryCardSource}\n${entryCardPlaybackSource}`;
    const hasSmoke =
      /entryCard\.smokeStrip|smokeStripLabel|voiceBecameSmoke|声音已化作青烟|entry-smoke-strip/.test(
        combined,
      );
    expect(hasSmoke).toBe(true);
    // Playable burned list chrome must be gone once smoke lands
    expect(entryCardPlaybackSource).not.toMatch(
      /export function EntryCardBurnedPlayback/,
    );
    expect(combined).not.toMatch(/burnedAudioLabel/);
  });
});

describe('echoStripContract — collapse must not stop audio (D-17)', () => {
  it('EntryCard must not stopAudio on expand→collapse', () => {
    expect(collapseStopEffectPresent(entryCardSource)).toBe(false);
  });
});

describe('echoStripContract — card time-of-day only (D-37)', () => {
  it('EntryCard formats card chrome with toLocaleTimeString, not formatLocaleDate', () => {
    expect(entryCardSource).toMatch(/toLocaleTimeString/);
    expect(entryCardSource).not.toMatch(/formatLocaleDate/);
  });
});
