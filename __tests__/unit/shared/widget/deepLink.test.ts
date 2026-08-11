/**
 * Wave 0 — PLT-02 fixed Dashboard deep-link constant
 */

import { WIDGET_DEEP_LINK_URL } from '@/shared/widget';

describe('WIDGET_DEEP_LINK_URL', () => {
  it('equals Dashboard scheme root with three slashes (D-06)', () => {
    expect(WIDGET_DEEP_LINK_URL).toBe('emotiondiary:///');
    expect(WIDGET_DEEP_LINK_URL).toMatch(/^emotiondiary:\/\/\/$/);
  });

  it('does not target Insights, On This Day, or person timeline (D-07)', () => {
    const url = WIDGET_DEEP_LINK_URL.toLowerCase();
    expect(url).not.toContain('insights');
    expect(url).not.toContain('on-this-day');
    expect(url).not.toContain('onthisday');
    expect(url).not.toContain('person');
    expect(url).not.toContain('timeline');
  });
});
