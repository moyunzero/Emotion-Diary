/**
 * Source gate: On This Day audio warm-up (Person Timeline parity).
 * Burned-card a11y lives in __tests__/unit/components/EntryCard/burnedAshA11y.test.ts
 */

import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '../../../..');

describe('OnThisDayScreen audio focus parity', () => {
  it('prepares playback audio mode on focus and stops on blur', () => {
    const src = fs.readFileSync(
      path.join(root, 'features/onThisDay/OnThisDayScreen.tsx'),
      'utf8',
    );
    expect(src).toContain('preparePlaybackAudioMode');
    expect(src).toMatch(
      /useFocusEffect\([\s\S]*setAnchorMs\(Date\.now\(\)\)[\s\S]*preparePlaybackAudioMode\(\)[\s\S]*stopAudio/,
    );
  });
});
