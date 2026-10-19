jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'zh-Hans' }]),
}));

import { runPullConflictProbe } from '../../../../store/sync/pullConflictProbe';

beforeAll(async () => {
  const { initI18n } = await import('../../../../i18n');
  await initI18n();
});

describe('runPullConflictProbe', () => {
  it('counts one shared id only when local time is strictly newer', async () => {
    await expect(runPullConflictProbe('shared-newer')).resolves.toBe(
      'shared-newer:ready:1:id, updatedat',
    );
  });

  it('does not count equal timestamps after millisecond alignment', async () => {
    await expect(runPullConflictProbe('equal')).resolves.toBe(
      'equal:ready:0:id, updatedat',
    );
  });

  it('does not count an id that exists only on this device', async () => {
    await expect(runPullConflictProbe('local-only')).resolves.toBe(
      'local-only:ready:0:id, updatedat',
    );
  });

  it('returns unknown for a network failure instead of a ready zero', async () => {
    await expect(runPullConflictProbe('network')).resolves.toBe(
      'network:unknown::id, updatedat',
    );
  });

  it.each(['no-user', 'session-mismatch', 'permission'])(
    'throws for %s instead of unknown or ready zero',
    async (caseName) => {
      const line = await runPullConflictProbe(caseName);
      expect(line.startsWith(`${caseName}:error:`)).toBe(true);
      expect(line).not.toContain(':unknown:');
      expect(line).not.toContain(':ready:0:');
    },
  );
});
