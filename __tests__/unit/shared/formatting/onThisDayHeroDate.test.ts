/**
 * Wave 0 — formatOnThisDayHeroDate (UI-SPEC Memory Lane hero)
 * Local month-day only; never raw epoch. Prefer pure Date math (minimal mocks).
 */

import { formatOnThisDayHeroDate } from '../../../../shared/formatting/onThisDayHeroDate';

describe('formatOnThisDayHeroDate', () => {
  // Fixed local noon so month/day are stable across TZ edges for this calendar day
  const anchorMs = new Date(2026, 7, 10, 12, 0, 0, 0).getTime(); // Aug 10, 2026 local

  it('zh-Hans includes 月 and 日 with spaces around glyphs (UI-SPEC Memory Lane)', () => {
    const label = formatOnThisDayHeroDate(anchorMs, 'zh-Hans');
    expect(label).toMatch(/月/);
    expect(label).toMatch(/日/);
    expect(label).toMatch(/\d+\s+月\s+\d+\s+日/);
    expect(label).not.toBe(String(anchorMs));
    expect(label).not.toMatch(/^\d+$/);
  });

  it('en-US returns a human month-day string (never raw epoch)', () => {
    const label = formatOnThisDayHeroDate(anchorMs, 'en-US');
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toBe(String(anchorMs));
    expect(label).not.toMatch(/^\d{10,}$/);
    // Must reflect local Aug 10, not UTC ISO day slice
    expect(label).toMatch(/8|Aug/i);
    expect(label).toMatch(/10/);
  });

  it('uses local getters (not UTC ISO day slice) for a late-evening local timestamp', () => {
    // Local evening that may differ from UTC calendar day depending on TZ —
    // assert month/day come from local getters on the Date constructed from anchorMs.
    const localEvening = new Date(2026, 0, 15, 23, 30, 0, 0).getTime();
    const zh = formatOnThisDayHeroDate(localEvening, 'zh-Hans');
    const d = new Date(localEvening);
    expect(zh).toBe(`${d.getMonth() + 1} 月 ${d.getDate()} 日`);
  });
});
