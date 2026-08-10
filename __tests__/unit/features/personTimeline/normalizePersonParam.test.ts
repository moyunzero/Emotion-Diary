/**
 * REL-01 — normalizePersonParam (exact person tag; Phase 13 D-03)
 */

import { normalizePersonParam } from '../../../../features/personTimeline/normalizePersonParam';

describe('normalizePersonParam', () => {
  it('returns undefined for undefined', () => {
    expect(normalizePersonParam(undefined)).toBeUndefined();
  });

  it('returns the same string value without trim or case-fold', () => {
    expect(normalizePersonParam('Mom')).toBe('Mom');
    expect(normalizePersonParam(' Mom ')).toBe(' Mom ');
    expect(normalizePersonParam('mom')).toBe('mom');
  });

  it('coerces string[] to the first element only', () => {
    expect(normalizePersonParam(['Mom', 'Dad'])).toBe('Mom');
  });

  it('returns undefined for empty array', () => {
    expect(normalizePersonParam([])).toBeUndefined();
  });

  it('returns undefined for empty string (missing-person empty)', () => {
    expect(normalizePersonParam('')).toBeUndefined();
  });

  it('keeps spaced/cased first array element exact for entriesForPerson', () => {
    expect(normalizePersonParam([' Mom ', 'other'])).toBe(' Mom ');
    expect(normalizePersonParam(['mom'])).toBe('mom');
  });
});
