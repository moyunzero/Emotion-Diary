/**
 * Wave 0 RED — SHORTCUT_PEOPLE_KEYS (FLOW-05 / D-07 D-11)
 * Shortcut chips are exactly partner/family/colleague/friend;
 * marital legacy keys stay out of the shortcut export.
 * GREEN in later Plan (people constants split). Runtime require so missing
 * export fails the assertion (not TS2307).
 */

type PeopleShortcutsModule = {
  SHORTCUT_PEOPLE_KEYS: readonly string[];
};

function loadPeopleShortcuts(): PeopleShortcutsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../constants') as PeopleShortcutsModule;
}

const EXPECTED_SHORTCUTS = ['partner', 'family', 'colleague', 'friend'] as const;
const LEGACY_MARITAL_KEYS = [
  'boyfriend',
  'girlfriend',
  'husband',
  'wife',
] as const;

describe('peopleShortcuts (FLOW-05 / D-07 D-11)', () => {
  it('SHORTCUT_PEOPLE_KEYS is exactly partner, family, colleague, friend', () => {
    const { SHORTCUT_PEOPLE_KEYS } = loadPeopleShortcuts();
    expect(SHORTCUT_PEOPLE_KEYS).toBeDefined();
    expect([...SHORTCUT_PEOPLE_KEYS]).toEqual([...EXPECTED_SHORTCUTS]);
    expect(SHORTCUT_PEOPLE_KEYS).toHaveLength(4);
  });

  it('marital legacy keys are not members of the shortcut export', () => {
    const { SHORTCUT_PEOPLE_KEYS } = loadPeopleShortcuts();
    expect(SHORTCUT_PEOPLE_KEYS).toBeDefined();
    for (const key of LEGACY_MARITAL_KEYS) {
      expect(SHORTCUT_PEOPLE_KEYS).not.toContain(key);
    }
  });
});
