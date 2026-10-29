import {
  REVISIT_WINDOW_MS,
  getActionLoopDateLine,
} from '../../../../shared/entries/actionLoopDateLine';

describe('getActionLoopDateLine', () => {
  const ts = 1_700_000_000_000;

  it('exports REVISIT_WINDOW_MS as 48 hours in ms', () => {
    expect(REVISIT_WINDOW_MS).toBe(172_800_000);
  });

  it('returns revisit when now is inside the 48h window', () => {
    const now = ts + 60 * 60 * 1000; // +1h
    expect(getActionLoopDateLine(ts, now)).toEqual({
      kind: 'revisit',
      timestamp: ts + REVISIT_WINDOW_MS,
    });
  });

  it('returns recorded at the exact 48h boundary', () => {
    const now = ts + REVISIT_WINDOW_MS;
    expect(getActionLoopDateLine(ts, now)).toEqual({
      kind: 'recorded',
      timestamp: ts,
    });
  });

  it('returns recorded when window has expired', () => {
    const now = ts + 72 * 60 * 60 * 1000; // +72h
    expect(getActionLoopDateLine(ts, now)).toEqual({
      kind: 'recorded',
      timestamp: ts,
    });
  });
});
