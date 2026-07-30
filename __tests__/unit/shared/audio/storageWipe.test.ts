/**
 * storageWipe.test.ts
 * SEC-01 Wave 0：path-segment 匹配（非 substring）与 wipe 候选过滤。
 */

import {
  filterWipeCandidatePaths,
  pathSegmentIncludesUserId,
} from '../../../../shared/audio/storageWipe';

describe('pathSegmentIncludesUserId', () => {
  const userId = 'user-abc-123';

  it('matches prefix path {userId}/a.m4a', () => {
    expect(pathSegmentIncludesUserId(`${userId}/a.m4a`, userId)).toBe(true);
  });

  it('matches nested path …/{userId}/…', () => {
    expect(pathSegmentIncludesUserId(`legacy/${userId}/clip.m4a`, userId)).toBe(true);
  });

  it('does not match substring-only ids that are not full path segments', () => {
    // userId is a substring of another segment, not a segment itself
    expect(pathSegmentIncludesUserId(`prefix-${userId}-suffix/file.m4a`, userId)).toBe(false);
    expect(pathSegmentIncludesUserId(`other-user-abc-1234/file.m4a`, 'user-abc-123')).toBe(false);
  });

  it('returns false for empty userId', () => {
    expect(pathSegmentIncludesUserId('user-abc-123/a.m4a', '')).toBe(false);
  });
});

describe('filterWipeCandidatePaths', () => {
  const userId = 'uid-42';

  it('keeps matching object paths only', () => {
    const paths = [
      `${userId}/a.m4a`,
      'other/b.m4a',
      `nested/${userId}/c.m4a`,
      `not-${userId}/d.m4a`,
    ];
    expect(filterWipeCandidatePaths(paths, userId)).toEqual([
      `${userId}/a.m4a`,
      `nested/${userId}/c.m4a`,
    ]);
  });

  it('empty input → empty output', () => {
    expect(filterWipeCandidatePaths([], userId)).toEqual([]);
  });
});
