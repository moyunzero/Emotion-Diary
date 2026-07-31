import {
  areAudioDataArraysEqual,
  areOrderedStringArraysEqual,
} from '../../../utils/arrayEquality';

describe('areOrderedStringArraysEqual', () => {
  it('treats both nullish as equal', () => {
    expect(areOrderedStringArraysEqual(null, undefined)).toBe(true);
  });

  it('compares order and values', () => {
    expect(areOrderedStringArraysEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(areOrderedStringArraysEqual(['a', 'b'], ['b', 'a'])).toBe(false);
  });
});

describe('areAudioDataArraysEqual', () => {
  const base = {
    id: 'a1',
    name: 'custom',
    syncStatus: 'pending' as const,
    duration: 2,
    localUri: 'file://a',
    remoteUrl: undefined as string | undefined,
  };

  it('returns true when UI-relevant fields match', () => {
    expect(areAudioDataArraysEqual([base], [{ ...base }])).toBe(true);
  });

  it('returns false when only name changes (rename must re-render EntryCard)', () => {
    expect(
      areAudioDataArraysEqual([base], [{ ...base, name: 'renamed' }]),
    ).toBe(false);
  });

  it('returns false when syncStatus changes', () => {
    expect(
      areAudioDataArraysEqual(
        [base],
        [{ ...base, syncStatus: 'synced' as const }],
      ),
    ).toBe(false);
  });

  it('returns false when length or id differs', () => {
    expect(areAudioDataArraysEqual([base], [])).toBe(false);
    expect(
      areAudioDataArraysEqual([base], [{ ...base, id: 'a2' }]),
    ).toBe(false);
  });

  it('treats missing name as equal to undefined name', () => {
    const withoutName = { ...base, name: undefined };
    const omitted = {
      id: 'a1',
      syncStatus: 'pending' as const,
      duration: 2,
      localUri: 'file://a',
    };
    expect(areAudioDataArraysEqual([withoutName], [omitted])).toBe(true);
  });
});
